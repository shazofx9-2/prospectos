import { Router, Response } from 'express';
import { DB, Prospect, Client, Task, Reminder, Note, File } from '../db.js';
import { authMiddleware, AuthenticatedRequest, hashPassword, comparePassword } from '../auth.js';

const router = Router();
router.use(authMiddleware);

// PUT /api/settings/profile - Update user profile identity
router.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email, theme, currency } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updateFields: Record<string, any> = {
      name: name.trim(),
      updatedAt: new Date().toISOString()
    };

    if (email && typeof email === 'string' && email.trim()) {
      const normalizedEmail = email.toLowerCase().trim();
      const users = DB.query('users');
      const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail && u.id !== userId);
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      updateFields.email = normalizedEmail;
    }

    if (theme && (theme === 'dark' || theme === 'light')) {
      updateFields.theme = theme;
    }
    if (currency && typeof currency === 'string') {
      updateFields.currency = currency.trim().toUpperCase();
    }

    let success = DB.update('users', userId, updateFields);

    if (!success) {
      DB.insert('users', {
        id: userId,
        email: updateFields.email || req.user?.email || `${userId}@user.com`,
        name: updateFields.name,
        theme: updateFields.theme || 'dark',
        currency: updateFields.currency || 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      success = true;
    }

    const updatedUser = DB.query('users').find((u) => u.id === userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser ? {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        theme: updatedUser.theme || 'dark',
        currency: updatedUser.currency || 'USD'
      } : undefined
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating profile' });
  }
});

// PUT /api/settings/app-settings - Update theme and currency preferences
router.put('/app-settings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { theme, currency } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (theme && (theme === 'dark' || theme === 'light')) {
      updates.theme = theme;
    }
    if (currency && typeof currency === 'string') {
      updates.currency = currency.trim().toUpperCase();
    }

    const success = DB.update('users', userId, updates);

    if (!success) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const updatedUser = DB.query('users').find((u) => u.id === userId);

    res.json({
      success: true,
      message: 'App settings saved successfully',
      user: updatedUser
        ? {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            theme: updatedUser.theme || 'dark',
            currency: updatedUser.currency || 'USD',
          }
        : undefined,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating app settings' });
  }
});

// PUT /api/settings/password - Update user password
router.put('/password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const users = DB.query('users');
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const newHash = await hashPassword(newPassword);
    DB.update('users', userId, {
      passwordHash: newHash,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error updating password' });
  }
});

// GET /api/settings/export - Export all user's data as a single JSON bundle
router.get('/export', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const data = {
      prospects: DB.query('prospects').filter((p) => p.userId === userId),
      clients: DB.query('clients').filter((c) => c.userId === userId),
      tasks: DB.query('tasks').filter((t) => t.userId === userId),
      reminders: DB.query('reminders').filter((r) => r.userId === userId),
      notes: DB.query('notes').filter((n) => n.userId === userId),
      files: DB.query('files').filter((f) => f.userId === userId),
    };

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error exporting workspace data' });
  }
});

// POST /api/settings/import - Import workspace data JSON
router.post('/import', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { prospects, clients, tasks, reminders, notes, files } = req.body;

    // Optional purge before import
    // 1. Purge
    purgeUserData(userId);

    // 2. Insert with fresh unique IDs and bind to the current userId
    if (Array.isArray(prospects)) {
      prospects.forEach((p: any) => {
        const cleanP: Prospect = {
          ...p,
          id: p.id || 'prsp_' + Math.random().toString(36).substr(2, 9),
          userId,
        };
        DB.insert('prospects', cleanP);
      });
    }

    if (Array.isArray(clients)) {
      clients.forEach((c: any) => {
        const cleanC: Client = {
          ...c,
          id: c.id || 'clnt_' + Math.random().toString(36).substr(2, 9),
          userId,
        };
        DB.insert('clients', cleanC);
      });
    }

    if (Array.isArray(tasks)) {
      tasks.forEach((t: any) => {
        const cleanT: Task = {
          ...t,
          id: t.id || 'task_' + Math.random().toString(36).substr(2, 9),
          userId,
        };
        DB.insert('tasks', cleanT);
      });
    }

    if (Array.isArray(reminders)) {
      reminders.forEach((r: any) => {
        const cleanR: Reminder = {
          ...r,
          id: r.id || 'rem_' + Math.random().toString(36).substr(2, 9),
          userId,
        };
        DB.insert('reminders', cleanR);
      });
    }

    if (Array.isArray(notes)) {
      notes.forEach((n: any) => {
        const cleanN: Note = {
          ...n,
          id: n.id || 'note_' + Math.random().toString(36).substr(2, 9),
          userId,
        };
        DB.insert('notes', cleanN);
      });
    }

    if (Array.isArray(files)) {
      files.forEach((f: any) => {
        const cleanF: File = {
          ...f,
          id: f.id || 'file_' + Math.random().toString(36).substr(2, 9),
          userId,
        };
        DB.insert('files', cleanF);
      });
    }

    res.json({ success: true, message: 'Workspace restore complete.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error restoring workspace' });
  }
});

// POST /api/settings/reset - Reset and seed demo database for this user
router.post('/reset', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 1. Purge
    purgeUserData(userId);

    // 2. Define user-specific seed lists mimicking seed.ts but scoped to current userId
    const prospectsSeed: Prospect[] = [
      {
        id: 'prsp_s1_' + userId,
        userId,
        businessName: 'Starlight Ventures',
        ownerName: 'Sarah Jenkins',
        email: 'sarah@starlight.co',
        phone: '+1 (555) 019-2834',
        website: 'starlight.co',
        industry: 'Venture Capital',
        country: 'United States',
        city: 'San Francisco',
        address: '100 Pine Street, Suite 400',
        source: 'LinkedIn Outbound',
        linkedin: 'linkedin.com/in/sarah-jenkins-starlight',
        instagram: '',
        facebook: '',
        notes: 'Met Sarah at SaaSCon. Highly interested in our premium workflow optimizer package.',
        priority: 'High',
        tags: ['VC', 'Enterprise', 'Warm Lead'],
        dateAdded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Negotiating',
      },
      {
        id: 'prsp_s2_' + userId,
        userId,
        businessName: 'Apex Healthtech',
        ownerName: 'David Chen',
        email: 'dchen@apexhealth.io',
        phone: '+1 (555) 014-9911',
        website: 'apexhealth.io',
        industry: 'Healthcare',
        country: 'Canada',
        city: 'Toronto',
        address: '250 Yonge St',
        source: 'Cold Email',
        linkedin: 'linkedin.com/in/dchen-apex',
        instagram: '',
        facebook: '',
        notes: 'Requested a custom quotation for HIPAA-compliant customer engagement flows.',
        priority: 'Medium',
        tags: ['Healthcare', 'B2B', 'Custom Quotation'],
        dateAdded: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Proposal Sent',
      },
      {
        id: 'prsp_s3_' + userId,
        userId,
        businessName: 'Lumina Creative',
        ownerName: 'Chloe DuPont',
        email: 'chloe@luminacreative.fr',
        phone: '+33 1 42 27 78 90',
        website: 'luminacreative.fr',
        industry: 'Design Agency',
        country: 'France',
        city: 'Paris',
        address: '14 Rue de Rivoli',
        source: 'Inbound Referral',
        linkedin: 'linkedin.com/in/chloe-dupont-lumina',
        instagram: 'instagram.com/luminacreative',
        facebook: '',
        notes: 'Inbound referral from agency partner. Looking for systems audit and operations automation.',
        priority: 'High',
        tags: ['Agency', 'Creative', 'High Value'],
        dateAdded: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Meeting Scheduled',
      },
      {
        id: 'prsp_s6_' + userId,
        userId,
        businessName: 'Nova Commerce',
        ownerName: 'Elena Rostova',
        email: 'elena@novacommerce.io',
        phone: '+1 (555) 017-8822',
        website: 'novacommerce.io',
        industry: 'E-Commerce',
        country: 'United States',
        city: 'New York',
        address: '500 Broadway, Floor 5',
        source: 'Inbound Referral',
        linkedin: '',
        instagram: '',
        facebook: '',
        notes: 'Landed contract for custom headless store setup. Converted successfully.',
        priority: 'High',
        tags: ['Shopify', 'Ecom', 'Landed'],
        dateAdded: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Landed',
      }
    ];

    const clientsSeed: Client[] = [
      {
        id: 'clnt_s1_' + userId,
        userId,
        prospectId: 'prsp_s6_' + userId,
        businessName: 'Nova Commerce',
        contactName: 'Elena Rostova',
        email: 'elena@novacommerce.io',
        phone: '+1 (555) 017-8822',
        servicePurchased: 'Headless E-Commerce Integration & Performance Audit',
        contractValue: 18500,
        monthlyRetainer: 2200,
        startDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentStatus: 'Paid',
        invoiceStatus: 'Paid',
        notes: 'Elite Shopify Hydrogen build. Phase 1 deployment is highly successful. Working on SEO next.',
        priority: 'High',
        internalNotes: 'Elena is highly responsive. Submit weekly reports on Monday morning.',
        status: 'Active',
      },
      {
        id: 'clnt_s2_' + userId,
        userId,
        businessName: 'Acme Global Corp',
        contactName: 'Robert Vance',
        email: 'rvance@acmeglobal.com',
        phone: '+1 (555) 013-1122',
        servicePurchased: 'SaaS Infrastructure Operations Retainer',
        contractValue: 45000,
        monthlyRetainer: 3750,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentStatus: 'Paid',
        invoiceStatus: 'Sent',
        notes: 'AWS cluster scaling, container setups, and security hardening.',
        priority: 'High',
        internalNotes: 'Requires 99.99% uptime guarantees. Ensure logging systems are healthy.',
        status: 'Active',
      },
      {
        id: 'clnt_s3_' + userId,
        userId,
        businessName: 'Prism Designs',
        contactName: 'Maya Lin',
        email: 'mlin@prismdesigns.ca',
        phone: '+1 (555) 019-3849',
        servicePurchased: 'Webflow Marketing Site Rebrand',
        contractValue: 9500,
        monthlyRetainer: 0,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentStatus: 'Pending',
        invoiceStatus: 'Sent',
        notes: 'Full-site rebrand. Ready for client sign-off, invoice currently pending clearance.',
        priority: 'Medium',
        internalNotes: 'Awaiting design assets feedback from Maya.',
        status: 'Renewing',
      }
    ];

    const tasksSeed: Task[] = [
      {
        id: 'task_s1_' + userId,
        userId,
        clientId: 'clnt_s1_' + userId,
        title: 'Optimize Core Web Vitals',
        description: 'Compress image bundles, structure lazy imports, and configure Cloudflare caching headers.',
        isCompleted: true,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'Alex Mercer',
      },
      {
        id: 'task_s2_' + userId,
        userId,
        clientId: 'clnt_s1_' + userId,
        title: 'Integrate Stripe Payment Gateway',
        description: 'Configure customer portal subscriptions, stripe webhooks, and invoice receipts template.',
        isCompleted: false,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'Emma Watson',
      },
      {
        id: 'task_s5_' + userId,
        userId,
        clientId: 'clnt_s2_' + userId,
        title: 'Conduct Disaster Recovery Drill',
        description: 'Perform real-time database restore dry run, check AWS multi-region failover, and measure restore RTO/RPO metrics.',
        isCompleted: false,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'DevOps Lead',
      }
    ];

    const remindersSeed: Reminder[] = [
      {
        id: 'rem_s1_' + userId,
        userId,
        prospectId: 'prsp_s1_' + userId,
        title: 'Send Revised Contract Draft',
        description: 'Refactor pricing module to include a custom quarterly SLA rider.',
        triggerDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        isRecurring: false,
      },
      {
        id: 'rem_s2_' + userId,
        userId,
        prospectId: 'prsp_s2_' + userId,
        title: 'Follow Up on HIPAA Proposal',
        description: 'Acknowledge email sent on Tuesday. Offer security operations sync-up call.',
        triggerDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        isRecurring: false,
      }
    ];

    const notesSeed: Note[] = [
      {
        id: 'note_s1_' + userId,
        userId,
        prospectId: 'prsp_s1_' + userId,
        title: 'Negotiation Strategy Brief',
        content: `### High-Priority Enterprise Scope
Sarah Jenkins is highly focused on our operational scaling module.
- **Budget**: $12k-15k setup. Retainer up to $2.5k.
- **Goal**: Auto-allocate inbound deals based on priority scores.
- **Competitors**: Salesforce (too complex), HubSpot (too generic).
- **Pitch**: ProspectOS offers custom, blazing-fast pipeline orchestration.`,
        isPinned: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'note_s2_' + userId,
        userId,
        clientId: 'clnt_s1_' + userId,
        title: 'Shopify Hydrogen Build Notes',
        content: `### Tech Stack Details
- Framework: Remix + Shopify Oxygen
- Styling: Tailwind CSS
- Data Fetching: Shopify Storefront GraphQL API
- Performance Objective: Lighthouse Score > 95 on mobile devices.`,
        isPinned: false,
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    prospectsSeed.forEach((p) => DB.insert('prospects', p));
    clientsSeed.forEach((c) => DB.insert('clients', c));
    tasksSeed.forEach((t) => DB.insert('tasks', t));
    remindersSeed.forEach((r) => DB.insert('reminders', r));
    notesSeed.forEach((n) => DB.insert('notes', n));

    res.json({ success: true, message: 'Workspace fully reset and seeded with standard indicators!' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error seeding demo data' });
  }
});

// DELETE /api/settings/account - Delete user account and all workspace data
router.delete('/account', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    // 1. Purge all workspace collections
    purgeUserData(userId);
    // 2. Remove user from database
    DB.delete('users', userId);

    res.json({ success: true, message: 'Account and associated data deleted permanently.' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Error deleting account data' });
  }
});

// Purge helper
function purgeUserData(userId: string) {
  const tables = ['prospects', 'clients', 'tasks', 'reminders', 'notes', 'files'] as const;
  tables.forEach((t) => {
    const items = DB.query(t).filter((item) => item.userId === userId);
    items.forEach((item) => {
      DB.delete(t, item.id);
    });
  });
}

export default router;
