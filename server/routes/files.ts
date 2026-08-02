import { Router, Response } from 'express';
import { DB, File } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/files - retrieve file metadata list
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { prospectId, clientId } = req.query;

    let files = DB.query('files').filter((f) => f.userId === userId);

    if (prospectId) {
      files = files.filter((f) => f.prospectId === prospectId);
    }
    if (clientId) {
      files = files.filter((f) => f.clientId === clientId);
    }

    // Strip out heavy base64Data when retrieving the metadata list for high-performance requests
    const list = files.map((f) => ({
      id: f.id,
      userId: f.userId,
      prospectId: f.prospectId,
      clientId: f.clientId,
      name: f.name,
      size: f.size,
      type: f.type,
      createdAt: f.createdAt,
    }));

    res.json(list);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error fetching files list' });
  }
});

// POST /api/files - upload a file (payload: name, size, type, base64Data)
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, size, type, base64Data, prospectId, clientId } = req.body;

    if (!name || !base64Data) {
      return res.status(400).json({ error: 'Missing name or base64Data' });
    }

    const newFile: File = {
      id: 'file_' + Math.random().toString(36).substr(2, 9),
      userId,
      prospectId,
      clientId,
      name: name.trim(),
      size: Number(size) || 0,
      type: type || 'application/octet-stream',
      base64Data, // Full base64 payload stored in database
      createdAt: new Date().toISOString(),
    };

    DB.insert('files', newFile);

    // Return metadata of the uploaded file
    res.status(201).json({
      id: newFile.id,
      userId: newFile.userId,
      prospectId: newFile.prospectId,
      clientId: newFile.clientId,
      name: newFile.name,
      size: newFile.size,
      type: newFile.type,
      createdAt: newFile.createdAt,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error uploading file' });
  }
});

// GET /api/files/:id/download - retrieve and download the file with correct mime-type headers
router.get('/:id/download', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const files = DB.query('files');
    const file = files.find((f) => f.id === id && f.userId === userId);

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    // Decode base64 back to binary Buffer
    const buffer = Buffer.from(file.base64Data, 'base64');

    res.setHeader('Content-Type', file.type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error downloading file' });
  }
});

// GET /api/files/:id/view - retrieve the base64 or display file directly (for images preview)
router.get('/:id/view', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const files = DB.query('files');
    const file = files.find((f) => f.id === id && f.userId === userId);

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    const buffer = Buffer.from(file.base64Data, 'base64');
    res.setHeader('Content-Type', file.type);
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error serving preview file' });
  }
});

// DELETE /api/files/:id - delete file
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const files = DB.query('files');
    const file = files.find((f) => f.id === id && f.userId === userId);

    if (!file) {
      return res.status(404).json({ error: 'File not found or unauthorized' });
    }

    DB.delete('files', id);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting file' });
  }
});

export default router;
