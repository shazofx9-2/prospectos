import { Router, Response } from 'express';
import { DB, Client } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();

router.use(authMiddleware);

// GET /api/clients
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const clients = DB.query('clients').filter((c) => c.userId === userId);
    res.json(clients);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error fetching clients' });
  }
});

// POST /api/clients
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      businessName,
      contactName,
      email,
      phone,
      servicePurchased,
      contractValue,
      monthlyRetainer,
      startDate,
      renewalDate,
      deliveryDate,
      paymentStatus,
      invoiceStatus,
      notes,
      priority,
      internalNotes,
      status,
      prospectId,
    } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: 'Business Name is required' });
    }

    const newClient: Client = {
      id: 'clnt_' + Math.random().toString(36).substr(2, 9),
      userId,
      prospectId,
      businessName: businessName.trim(),
      contactName: (contactName || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      servicePurchased: (servicePurchased || 'Consulting').trim(),
      contractValue: Number(contractValue) || 0,
      monthlyRetainer: Number(monthlyRetainer) || 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      renewalDate: renewalDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deliveryDate: deliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentStatus: paymentStatus || 'Pending',
      invoiceStatus: invoiceStatus || 'Pending',
      notes: (notes || '').trim(),
      priority: priority || 'Medium',
      internalNotes: (internalNotes || '').trim(),
      status: status || 'Active',
      nextFollowUpDate: req.body.nextFollowUpDate || null,
      followUpStatus: req.body.followUpStatus || (req.body.nextFollowUpDate ? 'pending' : 'none'),
      followUpNote: req.body.followUpNote || null,
    };

    DB.insert('clients', newClient);
    res.status(201).json(newClient);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error creating client' });
  }
});

// PUT /api/clients/:id
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const clients = DB.query('clients');
    const client = clients.find((c) => c.id === id && c.userId === userId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found or unauthorized' });
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;

    if (updates.contractValue !== undefined) updates.contractValue = Number(updates.contractValue);
    if (updates.monthlyRetainer !== undefined) updates.monthlyRetainer = Number(updates.monthlyRetainer);

    const ok = DB.update('clients', id, updates);
    if (!ok) {
      return res.status(500).json({ error: 'Failed to update client' });
    }

    const saved = DB.query('clients').find((c) => c.id === id);
    res.json(saved);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating client' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const clients = DB.query('clients');
    const client = clients.find((c) => c.id === id && c.userId === userId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found or unauthorized' });
    }

    DB.delete('clients', id);

    // If client was converted from a prospect, delete that prospect as well to prevent orphaned follow-ups
    if (client.prospectId) {
      DB.delete('prospects', client.prospectId);
    }

    // Delete associated client resources
    const tasks = DB.query('tasks').filter((t) => t.clientId === id && t.userId === userId);
    for (const t of tasks) DB.delete('tasks', t.id);

    const reminders = DB.query('reminders').filter((r) => r.clientId === id && r.userId === userId);
    for (const r of reminders) DB.delete('reminders', r.id);

    const notes = DB.query('notes').filter((n) => n.clientId === id && n.userId === userId);
    for (const n of notes) DB.delete('notes', n.id);

    const files = DB.query('files').filter((f) => f.clientId === id && f.userId === userId);
    for (const f of files) DB.delete('files', f.id);

    const emailLogs = DB.query('emailLogs').filter((el) => el.relatedId === id && el.userId === userId);
    for (const el of emailLogs) DB.delete('emailLogs', el.id);

    res.json({ success: true, message: 'Client and associated resources deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting client' });
  }
});

export default router;
