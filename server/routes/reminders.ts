import { Router, Response } from 'express';
import { DB, Reminder } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/reminders
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const clients = DB.query('clients').filter((c) => c.userId === userId);
    const prospects = DB.query('prospects').filter((p) => p.userId === userId);
    const clientIds = new Set(clients.map((c) => c.id));
    const prospectIds = new Set(prospects.map((p) => p.id));

    const reminders = DB.query('reminders').filter((r) => {
      if (r.userId !== userId) return false;
      if (r.clientId && !clientIds.has(r.clientId)) return false;
      if (r.prospectId && !prospectIds.has(r.prospectId)) return false;
      return true;
    });
    res.json(reminders);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error fetching reminders' });
  }
});

// POST /api/reminders
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, triggerDate, isRecurring, intervalDays, prospectId, clientId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Reminder Title is required' });
    }
    if (!triggerDate) {
      return res.status(400).json({ error: 'Trigger Date is required' });
    }

    const newReminder: Reminder = {
      id: 'rem_' + Math.random().toString(36).substr(2, 9),
      userId,
      prospectId,
      clientId,
      title: title.trim(),
      description: (description || '').trim(),
      triggerDate,
      isCompleted: false,
      isRecurring: !!isRecurring,
      intervalDays: isRecurring ? (Number(intervalDays) || 7) : undefined,
    };

    DB.insert('reminders', newReminder);
    res.status(201).json(newReminder);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error creating reminder' });
  }
});

// PUT /api/reminders/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const reminders = DB.query('reminders');
    const reminder = reminders.find((r) => r.id === id && r.userId === userId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found or unauthorized' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;

    const ok = DB.update('reminders', id, updates);
    if (!ok) {
      return res.status(500).json({ error: 'Failed to update reminder' });
    }

    const saved = DB.query('reminders').find((r) => r.id === id);
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating reminder' });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const reminders = DB.query('reminders');
    const reminder = reminders.find((r) => r.id === id && r.userId === userId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found or unauthorized' });
    }

    DB.delete('reminders', id);
    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting reminder' });
  }
});

export default router;
