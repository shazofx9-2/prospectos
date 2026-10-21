import { DB, Task, SenderAccount } from './db.js';

export function getGoogleAccessToken(userId: string): string | null {
  if (!userId) return null;
  const cleanId = userId.replace(/^fb_/, '');

  const accounts = DB.query('senderAccounts').filter((sa) => {
    if (!sa.oauthAccessToken) return false;
    const saUserIdClean = (sa.userId || '').replace(/^fb_/, '');
    return saUserIdClean === cleanId || sa.userId === userId || sa.userId === `fb_${cleanId}`;
  });

  if (accounts.length === 0) {
    // Fallback: use any recently connected account with valid token
    const allAccounts = DB.query('senderAccounts').filter((sa) => !!sa.oauthAccessToken);
    if (allAccounts.length > 0) {
      const sorted = [...allAccounts].sort((a, b) => new Date(b.connectedAt || 0).getTime() - new Date(a.connectedAt || 0).getTime());
      return sorted[0].oauthAccessToken;
    }
    return null;
  }

  const sorted = [...accounts].sort((a, b) => new Date(b.connectedAt || 0).getTime() - new Date(a.connectedAt || 0).getTime());
  return sorted[0]?.oauthAccessToken || null;
}

function formatGoogleCalendarDates(dueDateStr: string, dueTime?: string, addTime?: boolean) {
  let datePart = '2026-07-29';
  if (dueDateStr) {
    if (dueDateStr.includes('T')) {
      datePart = dueDateStr.split('T')[0];
    } else {
      datePart = dueDateStr.trim();
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    datePart = new Date().toISOString().split('T')[0];
  }

  if (addTime && dueTime && /^\d{1,2}:\d{2}$/.test(dueTime)) {
    const [hStr, mStr] = dueTime.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const startH = String(h).padStart(2, '0');
    const startM = String(m).padStart(2, '0');
    const startDateTime = `${datePart}T${startH}:${startM}:00Z`;

    const totalMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    const endDateTime = `${datePart}T${endH}:${endM}:00Z`;

    return {
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime }
    };
  } else {
    // Google Calendar API all-day event
    const startDateObj = new Date(`${datePart}T00:00:00Z`);
    const endDateObj = new Date(startDateObj.getTime() + 86400000);
    const endDatePart = endDateObj.toISOString().split('T')[0];

    return {
      start: { date: datePart },
      end: { date: endDatePart }
    };
  }
}

export async function createGoogleCalendarEvent(userId: string, task: Task, explicitToken?: string): Promise<string | null> {
  const token = explicitToken || getGoogleAccessToken(userId);
  if (!token) {
    console.warn('createGoogleCalendarEvent: No Google access token found for user', userId);
    return null;
  }

  try {
    const { start, end } = formatGoogleCalendarDates(task.dueDate, task.dueTime, task.addTime);

    const eventPayload: any = {
      summary: task.title,
      description: `[ProspectOS Task]\nDescription: ${task.description || 'N/A'}\nPriority: ${task.priority}\nAssigned To: ${task.assignedTo || 'Unassigned'}`,
      status: 'confirmed',
      start,
      end
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (res.ok) {
      const data = await res.json();
      return data.id || null;
    } else {
      const err = await res.text();
      console.warn('Google Calendar create event error:', res.status, err);
      return null;
    }
  } catch (e) {
    console.error('Failed to create Google Calendar event:', e);
    return null;
  }
}

export async function updateGoogleCalendarEvent(userId: string, task: Task, explicitToken?: string): Promise<boolean> {
  if (!task.googleEventId) return false;
  const token = explicitToken || getGoogleAccessToken(userId);
  if (!token) return false;

  try {
    const { start, end } = formatGoogleCalendarDates(task.dueDate, task.dueTime, task.addTime);

    const eventPayload: any = {
      summary: `${task.isCompleted ? '✓ ' : ''}${task.title}`,
      description: `[ProspectOS Task]\nDescription: ${task.description || 'N/A'}\nPriority: ${task.priority}\nStatus: ${task.isCompleted ? 'Completed' : 'Pending'}\nAssigned To: ${task.assignedTo || 'Unassigned'}`,
      start,
      end
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.googleEventId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    return res.ok;
  } catch (e) {
    console.error('Failed to update Google Calendar event:', e);
    return false;
  }
}

export async function deleteGoogleCalendarEvent(userId: string, googleEventId: string): Promise<boolean> {
  const token = getGoogleAccessToken(userId);
  if (!token) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return res.ok;
  } catch (e) {
    console.error('Failed to delete Google Calendar event:', e);
    return false;
  }
}

