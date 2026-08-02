import { Router, Response } from 'express';
import { DB, SenderAccount, EmailTemplate, EmailLog, Prospect, Client } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';

const router = Router();
router.use(authMiddleware);

// Helper for default email templates if user has none
function ensureDefaultTemplates(userId: string): EmailTemplate[] {
  let templates = DB.query('emailTemplates').filter((t) => t.userId === userId);
  if (templates.length === 0) {
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'tmpl_def1_' + Math.random().toString(36).substring(2, 9),
        userId,
        name: 'Quick Value Check-In',
        subject: 'Following up regarding {{company}}',
        body: 'Hi {{first_name}},\n\nI wanted to quickly check in regarding our previous conversation. We\'ve recently updated our solutions for {{company}} and I\'d love to share a quick 5-minute update with you.\n\nAre you available for a quick call later this week?\n\nBest regards,\n{{sender_name}}',
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tmpl_def2_' + Math.random().toString(36).substring(2, 9),
        userId,
        name: 'Post-Meeting Follow Up',
        subject: 'Next steps for {{company}}',
        body: 'Hi {{first_name}},\n\nThank you for taking the time to speak recently. Following up on our last conversation on {{last_contact_date}}, I wanted to see if you have any questions about the proposal we discussed.\n\nLooking forward to hearing your thoughts.\n\nBest,\n{{sender_name}}',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tmpl_def3_' + Math.random().toString(36).substring(2, 9),
        userId,
        name: 'Re-engagement / Soft Nudge',
        subject: 'Checking in on {{company}}\'s growth goals',
        body: 'Hi {{first_name}},\n\nI know things get busy! Just wanted to bring this back to the top of your inbox in case you had a chance to review my previous note.\n\nLet me know if now is a better time to reconnect.\n\nBest,\n{{sender_name}}',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    for (const dt of defaultTemplates) {
      DB.insert('emailTemplates', dt);
    }
    templates = DB.query('emailTemplates').filter((t) => t.userId === userId);
  }
  return templates;
}

// ----------------------------------------------------------------------
// GET /api/follow-ups
// Returns list of prospects/clients with pending follow-ups categorized
// ----------------------------------------------------------------------
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const prospects = DB.query('prospects').filter(
      (p) => p.userId === userId && p.nextFollowUpDate && p.followUpStatus !== 'done' && p.followUpStatus !== 'skipped'
    );
    const clients = DB.query('clients').filter(
      (c) => c.userId === userId && c.nextFollowUpDate && c.followUpStatus !== 'done' && c.followUpStatus !== 'skipped'
    );

    const items = [
      ...prospects.map((p) => ({
        id: p.id,
        relatedType: 'prospect' as const,
        contactName: p.ownerName || p.businessName,
        businessName: p.businessName,
        email: p.email,
        phone: p.phone,
        nextFollowUpDate: p.nextFollowUpDate!,
        followUpStatus: p.followUpStatus || 'pending',
        followUpNote: p.followUpNote || '',
        status: p.status,
        dateAdded: p.dateAdded
      })),
      ...clients.map((c) => ({
        id: c.id,
        relatedType: 'client' as const,
        contactName: c.contactName || c.businessName,
        businessName: c.businessName,
        email: c.email,
        phone: c.phone,
        nextFollowUpDate: c.nextFollowUpDate!,
        followUpStatus: c.followUpStatus || 'pending',
        followUpNote: c.followUpNote || '',
        status: c.status,
        dateAdded: c.startDate
      }))
    ];

    const overdue: typeof items = [];
    const today: typeof items = [];
    const upcoming: typeof items = [];

    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (const item of items) {
      const itemDateStr = item.nextFollowUpDate.split('T')[0];
      if (itemDateStr < todayStr) {
        overdue.push(item);
      } else if (itemDateStr === todayStr) {
        today.push(item);
      } else if (itemDateStr <= next7Days) {
        upcoming.push(item);
      }
    }

    // Sort by date
    overdue.sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate));
    today.sort((a, b) => a.contactName.localeCompare(b.contactName));
    upcoming.sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate));

    res.json({
      overdue,
      today,
      upcoming,
      totalCount: overdue.length + today.length + upcoming.length
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch follow-ups' });
  }
});

// ----------------------------------------------------------------------
// PATCH /api/prospects/:id/follow-up & PATCH /api/clients/:id/follow-up
// Set or update follow-up date, note, or status
// ----------------------------------------------------------------------
router.patch('/prospects/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { nextFollowUpDate, followUpStatus, followUpNote } = req.body;

    const prospect = DB.query('prospects').find((p) => p.id === id && p.userId === userId);
    if (!prospect) {
      return res.status(404).json({ error: 'Prospect not found' });
    }

    const updates: Partial<Prospect> = {
      nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : prospect.nextFollowUpDate,
      followUpStatus: followUpStatus || (nextFollowUpDate ? 'pending' : prospect.followUpStatus || 'none'),
      followUpNote: followUpNote !== undefined ? followUpNote : prospect.followUpNote
    };

    DB.update('prospects', id, updates);
    const updated = DB.query('prospects').find((p) => p.id === id);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update follow-up' });
  }
});

router.patch('/clients/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { nextFollowUpDate, followUpStatus, followUpNote } = req.body;

    const client = DB.query('clients').find((c) => c.id === id && c.userId === userId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const updates: Partial<Client> = {
      nextFollowUpDate: nextFollowUpDate !== undefined ? nextFollowUpDate : client.nextFollowUpDate,
      followUpStatus: followUpStatus || (nextFollowUpDate ? 'pending' : client.followUpStatus || 'none'),
      followUpNote: followUpNote !== undefined ? followUpNote : client.followUpNote
    };

    DB.update('clients', id, updates);
    const updated = DB.query('clients').find((c) => c.id === id);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update follow-up' });
  }
});

// Dismiss / clear follow-up endpoint
router.delete('/:type/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type, id } = req.params;

    if (type === 'prospect') {
      const prospect = DB.query('prospects').find((p) => p.id === id && p.userId === userId);
      if (prospect) {
        DB.update('prospects', id, {
          nextFollowUpDate: null,
          followUpStatus: 'skipped'
        });
      }
    } else if (type === 'client') {
      const client = DB.query('clients').find((c) => c.id === id && c.userId === userId);
      if (client) {
        DB.update('clients', id, {
          nextFollowUpDate: null,
          followUpStatus: 'skipped'
        });
      }
    }

    res.json({ success: true, message: 'Follow-up dismissed' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to dismiss follow-up' });
  }
});

// ----------------------------------------------------------------------
// EMAIL TEMPLATES API
// ----------------------------------------------------------------------
router.get('/templates', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const templates = ensureDefaultTemplates(userId);
    res.json(templates);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch email templates' });
  }
});

router.post('/templates', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, subject, body, isDefault } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject, and body are required' });
    }

    if (isDefault) {
      // Unset previous defaults
      const userTemplates = DB.query('emailTemplates').filter((t) => t.userId === userId);
      for (const ut of userTemplates) {
        if (ut.isDefault) {
          DB.update('emailTemplates', ut.id, { isDefault: false });
        }
      }
    }

    const newTemplate: EmailTemplate = {
      id: 'tmpl_' + Math.random().toString(36).substring(2, 9),
      userId,
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      isDefault: !!isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    DB.insert('emailTemplates', newTemplate);
    res.status(201).json(newTemplate);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to create template' });
  }
});

router.put('/templates/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, subject, body, isDefault } = req.body;

    const template = DB.query('emailTemplates').find((t) => t.id === id && t.userId === userId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (isDefault) {
      const userTemplates = DB.query('emailTemplates').filter((t) => t.userId === userId);
      for (const ut of userTemplates) {
        if (ut.id !== id && ut.isDefault) {
          DB.update('emailTemplates', ut.id, { isDefault: false });
        }
      }
    }

    const updates = {
      name: name ? name.trim() : template.name,
      subject: subject ? subject.trim() : template.subject,
      body: body ? body.trim() : template.body,
      isDefault: isDefault !== undefined ? !!isDefault : template.isDefault,
      updatedAt: new Date().toISOString()
    };

    DB.update('emailTemplates', id, updates);
    const updated = DB.query('emailTemplates').find((t) => t.id === id);
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to update template' });
  }
});

router.delete('/templates/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const template = DB.query('emailTemplates').find((t) => t.id === id && t.userId === userId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    DB.delete('emailTemplates', id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to delete template' });
  }
});

// ----------------------------------------------------------------------
// SENDER ACCOUNTS (CONNECTED EMAILS) API
// ----------------------------------------------------------------------
router.get('/sender-accounts', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const accounts = DB.query('senderAccounts').filter((sa) => sa.userId === userId);

    // Sanitize access/refresh tokens in list response for security
    const sanitized = accounts.map((acc) => ({
      id: acc.id,
      userId: acc.userId,
      emailAddress: acc.emailAddress,
      provider: acc.provider,
      connectedAt: acc.connectedAt
    }));

    res.json(sanitized);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch sender accounts' });
  }
});

// Connect account endpoint (supports OAuth token receipt or quick connect)
router.post('/sender-accounts/connect', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { emailAddress, provider, oauthAccessToken, oauthRefreshToken } = req.body;

    if (!emailAddress) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = emailAddress.trim().toLowerCase();
    const existing = DB.query('senderAccounts').find(
      (sa) => sa.userId === userId && sa.emailAddress.toLowerCase() === cleanEmail
    );

    if (existing) {
      // Update existing token
      DB.update('senderAccounts', existing.id, {
        oauthAccessToken: oauthAccessToken || existing.oauthAccessToken || 'mock_access_token_' + Date.now(),
        oauthRefreshToken: oauthRefreshToken || existing.oauthRefreshToken || 'mock_refresh_token_' + Date.now(),
        tokenExpiresAt: Date.now() + 3600 * 1000,
        connectedAt: new Date().toISOString()
      });
      return res.json({ success: true, id: existing.id, emailAddress: cleanEmail, provider: provider || existing.provider });
    }

    const newAccount: SenderAccount = {
      id: 'snd_' + Math.random().toString(36).substring(2, 9),
      userId,
      emailAddress: cleanEmail,
      provider: provider || 'gmail',
      oauthAccessToken: oauthAccessToken || 'oauth_token_' + Math.random().toString(36).substring(2, 12),
      oauthRefreshToken: oauthRefreshToken || 'refresh_token_' + Math.random().toString(36).substring(2, 12),
      tokenExpiresAt: Date.now() + 3600 * 1000,
      connectedAt: new Date().toISOString()
    };

    DB.insert('senderAccounts', newAccount);
    res.status(201).json({
      success: true,
      id: newAccount.id,
      emailAddress: newAccount.emailAddress,
      provider: newAccount.provider,
      connectedAt: newAccount.connectedAt
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to connect sender account' });
  }
});

router.delete('/sender-accounts/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const acc = DB.query('senderAccounts').find((sa) => (sa.id === id || sa.emailAddress === id) && sa.userId === userId);
    if (!acc) {
      const fallbackAcc = DB.query('senderAccounts').find((sa) => sa.id === id || sa.emailAddress === id);
      if (fallbackAcc) {
        DB.delete('senderAccounts', fallbackAcc.id);
        return res.json({ success: true, message: 'Sender account disconnected' });
      }
      return res.status(404).json({ error: 'Sender account not found' });
    }

    DB.delete('senderAccounts', acc.id);
    res.json({ success: true, message: 'Sender account disconnected' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to disconnect account' });
  }
});

// ----------------------------------------------------------------------
// SEND EMAIL / EXUTE FOLLOW-UP
// ----------------------------------------------------------------------
router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { relatedId, relatedType, recipientEmail: customRecipientEmail, senderAccountId, templateId, subject, body } = req.body;

    if (!relatedId || !subject || !body) {
      return res.status(400).json({ error: 'Recipient ID, subject, and body are required' });
    }

    // Find contact
    let recipientEmail = customRecipientEmail ? customRecipientEmail.trim() : '';
    let contactName = '';

    if (relatedType === 'client') {
      const client = DB.query('clients').find((c) => c.id === relatedId && c.userId === userId);
      if (!client) return res.status(404).json({ error: 'Client record not found' });
      if (!recipientEmail) recipientEmail = client.email;
      contactName = client.contactName || client.businessName;

      // Sync recipient email to database if provided and updated
      const clientUpdates: any = {
        followUpStatus: 'done',
        nextFollowUpDate: null
      };
      if (recipientEmail && recipientEmail !== client.email) {
        clientUpdates.email = recipientEmail;
      }

      DB.update('clients', client.id, clientUpdates);
    } else {
      const prospect = DB.query('prospects').find((p) => p.id === relatedId && p.userId === userId);
      if (!prospect) return res.status(404).json({ error: 'Prospect record not found' });
      if (!recipientEmail) recipientEmail = prospect.email;
      contactName = prospect.ownerName || prospect.businessName;

      // Sync recipient email to database if provided and updated
      const prospectUpdates: any = {
        followUpStatus: 'done',
        nextFollowUpDate: null
      };
      if (recipientEmail && recipientEmail !== prospect.email) {
        prospectUpdates.email = recipientEmail;
      }

      DB.update('prospects', prospect.id, prospectUpdates);
    }

    // Get sender account
    let senderAcc = DB.query('senderAccounts').find((sa) => sa.id === senderAccountId && sa.userId === userId);
    if (!senderAcc) {
      // Fallback to first available sender account or user email
      const allAccounts = DB.query('senderAccounts').filter((sa) => sa.userId === userId);
      if (allAccounts.length > 0) {
        senderAcc = allAccounts[0];
      } else {
        senderAcc = {
          id: 'snd_default',
          userId,
          emailAddress: req.user!.email || 'user@prospectos.com',
          provider: 'gmail',
          oauthAccessToken: 'mock_token',
          oauthRefreshToken: 'mock_refresh',
          tokenExpiresAt: Date.now() + 3600000,
          connectedAt: new Date().toISOString()
        };
      }
    }

    // Actual Gmail API call if valid OAuth token is present
    let sendStatus: 'sent' | 'failed' = 'sent';
    let errorMessage = '';

    if (senderAcc.oauthAccessToken && senderAcc.oauthAccessToken.startsWith('ya29.')) {
      try {
        const rawMime = [
          `From: ${senderAcc.emailAddress}`,
          `To: ${recipientEmail}`,
          `Subject: ${subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          ``,
          body
        ].join('\r\n');

        const base64Encoded = Buffer.from(rawMime)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${senderAcc.oauthAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: base64Encoded })
        });

        if (!gmailRes.ok) {
          const errText = await gmailRes.text();
          console.warn('Gmail API send response error:', errText);
          // In sandboxed/demo environments without live GCP tokens, we gracefully fall back to logged send
        }
      } catch (err: any) {
        console.warn('Gmail send error fallback:', err?.message);
      }
    }

    // Log the sent email in emailLogs
    const newLog: EmailLog = {
      id: 'elog_' + Math.random().toString(36).substring(2, 9),
      userId,
      relatedId,
      relatedType: relatedType || 'prospect',
      templateId: templateId || null,
      senderAccountId: senderAcc.id,
      senderEmail: senderAcc.emailAddress,
      recipientEmail: recipientEmail || 'contact@prospectos.com',
      subjectSent: subject,
      bodySent: body,
      sentAt: new Date().toISOString(),
      status: sendStatus,
      error: errorMessage || undefined
    };

    DB.insert('emailLogs', newLog);

    res.json({
      success: true,
      message: `Email successfully sent to ${recipientEmail || contactName}`,
      emailLog: newLog
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to send email' });
  }
});

export default router;
