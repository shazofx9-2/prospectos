import { Router, Response } from 'express';
import { DB, Task } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleAccessToken
} from '../googleCalendar.js';

const router = Router();

router.use(authMiddleware);

// GET /api/tasks
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { clientId } = req.query;

    let tasks = DB.query('tasks').filter((t) => t.userId === userId);
    if (clientId) {
      tasks = tasks.filter((t) => t.clientId === clientId);
    }

    res.json(tasks);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error fetching tasks' });
  }
});

// POST /api/tasks
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { clientId, title, description, dueDate, dueTime, priority, assignedTo, addTime } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID (clientId) is required' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Task Title is required' });
    }

    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      userId,
      clientId,
      title: title.trim(),
      description: (description || '').trim(),
      isCompleted: false,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      dueTime: dueTime ? String(dueTime).trim() : undefined,
      priority: priority || 'Medium',
      assignedTo: (assignedTo || '').trim(),
      addTime: !!addTime,
    };

    // Try creating Google Calendar event if Google account connected
    const googleEventId = await createGoogleCalendarEvent(userId, newTask);
    if (googleEventId) {
      newTask.googleEventId = googleEventId;
      newTask.syncedToGoogle = true;
    }

    DB.insert('tasks', newTask);
    res.status(201).json(newTask);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error creating task' });
  }
});

// POST /api/tasks/sync-google-calendar - Sync all user tasks to Google Calendar
router.post('/sync-google-calendar', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const cleanId = userId.replace(/^fb_/, '');

    const headerToken = req.headers['x-google-access-token'] as string | undefined;
    const token = headerToken || getGoogleAccessToken(userId);
    if (!token) {
      return res.status(400).json({ error: 'No Google account connected. Please sign in or connect your Google account in Settings.' });
    }

    let tasks = DB.query('tasks').filter((t) => {
      const tClean = (t.userId || '').replace(/^fb_/, '');
      return tClean === cleanId || t.userId === userId || t.userId === `fb_${cleanId}`;
    });

    if (tasks.length === 0) {
      // Fallback: if user has no specific user tasks yet, sync all session tasks
      tasks = DB.query('tasks');
    }

    let syncedCount = 0;

    for (const task of tasks) {
      if (!task.googleEventId) {
        const eventId = await createGoogleCalendarEvent(userId, task, token);
        if (eventId) {
          DB.update('tasks', task.id, { googleEventId: eventId, syncedToGoogle: true });
          syncedCount++;
        }
      } else {
        const updated = await updateGoogleCalendarEvent(userId, task, token);
        if (updated) {
          DB.update('tasks', task.id, { syncedToGoogle: true });
          syncedCount++;
        } else {
          // Re-create event if previous event ID is invalid/stale
          const eventId = await createGoogleCalendarEvent(userId, task, token);
          if (eventId) {
            DB.update('tasks', task.id, { googleEventId: eventId, syncedToGoogle: true });
            syncedCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      syncedCount,
      totalCount: tasks.length,
      message: `Successfully synced ${syncedCount} of ${tasks.length} task(s) to Google Calendar.`
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error syncing tasks to Google Calendar' });
  }
});

// PUT or PATCH /api/tasks/:id
const handleUpdateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const tasks = DB.query('tasks');
    const task = tasks.find((t) => t.id === id && t.userId === userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;
    delete updates.clientId;

    const ok = DB.update('tasks', id, updates);
    if (!ok) {
      return res.status(500).json({ error: 'Failed to update task' });
    }

    const saved = DB.query('tasks').find((t) => t.id === id);
    if (saved) {
      if (saved.googleEventId) {
        await updateGoogleCalendarEvent(userId, saved);
      } else {
        const eventId = await createGoogleCalendarEvent(userId, saved);
        if (eventId) {
          DB.update('tasks', saved.id, { googleEventId: eventId, syncedToGoogle: true });
          saved.googleEventId = eventId;
          saved.syncedToGoogle = true;
        }
      }
    }

    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating task' });
  }
};

router.put('/:id', handleUpdateTask);
router.patch('/:id', handleUpdateTask);

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const tasks = DB.query('tasks');
    const task = tasks.find((t) => t.id === id && t.userId === userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    if (task.googleEventId) {
      await deleteGoogleCalendarEvent(userId, task.googleEventId);
    }

    DB.delete('tasks', id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting task' });
  }
});

export default router;
