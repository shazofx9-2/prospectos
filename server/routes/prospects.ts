import { Router, Response } from 'express';
import { DB, Prospect, Client } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import { ensureUserSeeded } from '../seed.js';

const router = Router();

// Apply auth to all prospect routes
router.use(authMiddleware);

// GET /api/prospects - retrieve user's prospects
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    ensureUserSeeded(userId);
    const prospects = DB.query('prospects').filter((p) => p.userId === userId);
    res.json(prospects);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error fetching prospects' });
  }
});

// POST /api/prospects - create a new prospect
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      businessName,
      ownerName,
      email,
      phone,
      website,
      industry,
      country,
      city,
      address,
      source,
      linkedin,
      instagram,
      facebook,
      notes,
      priority,
      tags,
      status,
    } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: 'Business Name is required' });
    }

    const newProspect: Prospect = {
      id: 'prsp_' + Math.random().toString(36).substr(2, 9),
      userId,
      businessName: businessName.trim(),
      ownerName: (ownerName || '').trim(),
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      website: (website || '').trim(),
      industry: (industry || '').trim(),
      country: (country || '').trim(),
      city: (city || '').trim(),
      address: (address || '').trim(),
      source: (source || 'Manual').trim(),
      linkedin: (linkedin || '').trim(),
      instagram: (instagram || '').trim(),
      facebook: (facebook || '').trim(),
      notes: (notes || '').trim(),
      priority: priority || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      dateAdded: new Date().toISOString(),
      status: status || 'New',
      nextFollowUpDate: req.body.nextFollowUpDate || null,
      followUpStatus: req.body.followUpStatus || (req.body.nextFollowUpDate ? 'pending' : 'none'),
      followUpNote: req.body.followUpNote || null,
    };

    DB.insert('prospects', newProspect);

    // If prospect is immediately landed, create client record and delete prospect
    if (newProspect.status === 'Landed') {
      createClientFromProspect(userId, newProspect, req.body);
      DB.delete('prospects', newProspect.id);
    }

    res.status(201).json(newProspect);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error creating prospect' });
  }
});

// PUT or PATCH /api/prospects/:id - update specific prospect
const handleUpdateProspect = (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const prospects = DB.query('prospects');
    const prospect = prospects.find((p) => p.id === id && p.userId === userId);

    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found or unauthorized' });
    }

    const oldStatus = prospect.status;
    const updates = { ...req.body };
    delete updates.id;
    delete updates.userId;

    const updated = DB.update('prospects', id, updates);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update prospect' });
    }

    const savedProspect = DB.query('prospects').find((p) => p.id === id);

    // Trigger Client promotion if transitioned to "Landed"
    if (oldStatus !== 'Landed' && updates.status === 'Landed' && savedProspect) {
      createClientFromProspect(userId, savedProspect, req.body);
      DB.delete('prospects', id);
    }

    res.json(savedProspect);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating prospect' });
  }
};

router.put('/:id', handleUpdateProspect);
router.patch('/:id', handleUpdateProspect);

// DELETE /api/prospects/:id - delete specific prospect
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const prospects = DB.query('prospects');
    const prospect = prospects.find((p) => p.id === id && p.userId === userId);

    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found or unauthorized' });
    }

    deleteProspectResources(userId, id);
    DB.delete('prospects', id);
    res.json({ success: true, message: 'Prospect deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting prospect' });
  }
});

// POST /api/prospects/bulk-update - update multiple prospects
router.post('/bulk-update', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !updates) {
      return res.status(400).json({ error: 'Missing ids array or update payload' });
    }

    const prospects = DB.query('prospects');
    let updatedCount = 0;

    for (const id of ids) {
      const p = prospects.find((item) => item.id === id && item.userId === userId);
      if (p) {
        const oldStatus = p.status;
        const cleanUpdates = { ...updates };
        delete cleanUpdates.id;
        delete cleanUpdates.userId;

        const ok = DB.update('prospects', id, cleanUpdates);
        if (ok) {
          updatedCount++;
          // Promote if status updated to Landed and delete prospect from prospects list
          if (oldStatus !== 'Landed' && cleanUpdates.status === 'Landed') {
            const freshP = DB.query('prospects').find((x) => x.id === id);
            if (freshP) {
              createClientFromProspect(userId, freshP);
              DB.delete('prospects', id);
            }
          }
        }
      }
    }

    res.json({ success: true, updatedCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error in bulk update' });
  }
});

// POST /api/prospects/bulk-delete - delete multiple prospects
router.post('/bulk-delete', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Missing ids array' });
    }

    const prospects = DB.query('prospects');
    let deletedCount = 0;

    for (const id of ids) {
      const p = prospects.find((item) => item.id === id && item.userId === userId);
      if (p) {
        deleteProspectResources(userId, id);
        const ok = DB.delete('prospects', id);
        if (ok) deletedCount++;
      }
    }

    res.json({ success: true, deletedCount });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error in bulk delete' });
  }
});

function deleteProspectResources(userId: string, prospectId: string) {
  const reminders = DB.query('reminders').filter((r) => r.prospectId === prospectId && r.userId === userId);
  for (const r of reminders) DB.delete('reminders', r.id);

  const notes = DB.query('notes').filter((n) => n.prospectId === prospectId && n.userId === userId);
  for (const n of notes) DB.delete('notes', n.id);

  const files = DB.query('files').filter((f) => f.prospectId === prospectId && f.userId === userId);
  for (const f of files) DB.delete('files', f.id);

  const emailLogs = DB.query('emailLogs').filter((el) => el.relatedId === prospectId && el.userId === userId);
  for (const el of emailLogs) DB.delete('emailLogs', el.id);

  // Also clean up any client converted from this prospect
  const clients = DB.query('clients').filter((c) => c.prospectId === prospectId && c.userId === userId);
  for (const c of clients) {
    const tasks = DB.query('tasks').filter((t) => t.clientId === c.id && t.userId === userId);
    for (const t of tasks) DB.delete('tasks', t.id);
    DB.delete('clients', c.id);
  }
}

// Utility to create a corresponding client entry from a newly landed prospect
function createClientFromProspect(userId: string, prospect: Prospect, customFields?: any) {
  // Check if client already exists for this prospect to avoid duplicates
  const clients = DB.query('clients');
  const alreadyClient = clients.some((c) => c.prospectId === prospect.id && c.userId === userId);
  if (alreadyClient) return;

  const isOneTime = customFields?.contractType === 'one_time';
  const servicePurchased = customFields?.servicePurchased || 'Premium CRM Implementation';
  const contractValue = customFields?.contractValue !== undefined ? Number(customFields.contractValue) : ((prospect as any).estimatedValue || 12000);
  const monthlyRetainer = isOneTime ? 0 : (customFields?.monthlyRetainer !== undefined ? Number(customFields.monthlyRetainer) : 1500);

  const newClient: Client = {
    id: 'clnt_' + Math.random().toString(36).substr(2, 9),
    userId,
    prospectId: prospect.id,
    businessName: customFields?.businessName || prospect.businessName,
    contactName: customFields?.contactName || customFields?.ownerName || prospect.ownerName || 'Contact',
    email: customFields?.email !== undefined ? customFields.email : prospect.email,
    phone: customFields?.phone !== undefined ? customFields.phone : prospect.phone,
    servicePurchased,
    contractValue,
    monthlyRetainer,
    startDate: customFields?.startDate || new Date().toISOString().split('T')[0],
    renewalDate: customFields?.renewalDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year renewal
    deliveryDate: customFields?.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],  // 30 days delivery
    paymentStatus: customFields?.paymentStatus || 'Pending',
    invoiceStatus: customFields?.invoiceStatus || 'Sent',
    notes: customFields?.notes !== undefined ? customFields.notes : (prospect.notes || ''),
    priority: customFields?.priority || prospect.priority || 'Medium',
    internalNotes: customFields?.internalNotes || 'Automatically converted from landed prospect.',
    status: customFields?.clientStatus || customFields?.status || 'Active',
  };

  DB.insert('clients', newClient);
}

export default router;
