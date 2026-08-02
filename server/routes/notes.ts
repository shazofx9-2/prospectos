import { Router, Response } from 'express';
import { DB, Note } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/notes
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { prospectId, clientId } = req.query;

    let notes = DB.query('notes').filter((n) => n.userId === userId);

    if (prospectId) {
      notes = notes.filter((n) => n.prospectId === prospectId);
    }
    if (clientId) {
      notes = notes.filter((n) => n.clientId === clientId);
    }

    res.json(notes);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error fetching notes' });
  }
});

// POST /api/notes
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content, prospectId, clientId, isPinned } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Note Title is required' });
    }

    const newNote: Note = {
      id: 'note_' + Math.random().toString(36).substr(2, 9),
      userId,
      prospectId,
      clientId,
      title: title.trim(),
      content: (content || '').trim(),
      isPinned: !!isPinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    DB.insert('notes', newNote);
    res.status(201).json(newNote);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error creating note' });
  }
});

// PUT or PATCH /api/notes/:id
const handleUpdateNote = (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notes = DB.query('notes');
    const note = notes.find((n) => n.id === id && n.userId === userId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;
    updates.updatedAt = new Date().toISOString();

    const ok = DB.update('notes', id, updates);
    if (!ok) {
      return res.status(500).json({ error: 'Failed to update note' });
    }

    const saved = DB.query('notes').find((n) => n.id === id);
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating note' });
  }
};

router.put('/:id', handleUpdateNote);
router.patch('/:id', handleUpdateNote);

// DELETE /api/notes/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const notes = DB.query('notes');
    const note = notes.find((n) => n.id === id && n.userId === userId);

    if (!note) {
      return res.status(404).json({ error: 'Note not found or unauthorized' });
    }

    DB.delete('notes', id);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting note' });
  }
});

export default router;
