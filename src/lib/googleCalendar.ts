import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase.js';
import { Task } from '../types.js';
import { getUserStoredData, setUserStoredData, getCurrentUserId } from './clientStorage.js';
import { firestoreService } from './firestoreService.js';
import { api } from './api.js';

// In-memory cache for Google OAuth Access Token
let cachedAccessToken: string | null = null;

export function getCachedGoogleToken(): string | null {
  return cachedAccessToken;
}

export function setCachedGoogleToken(token: string | null): void {
  cachedAccessToken = token;
}

export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send'
];

/**
 * Acquire Google OAuth access token with Calendar scopes
 * If interactive is true and no token exists, prompts with Google OAuth popup.
 */
export async function getGoogleCalendarAccessToken(interactive = true): Promise<string> {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  if (!interactive) {
    throw new Error('No Google Calendar access token found. Please connect your Google account.');
  }

  const provider = new GoogleAuthProvider();
  GOOGLE_CALENDAR_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'consent select_account' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;

  if (!token) {
    throw new Error('Could not obtain Google Calendar authorization token from sign-in.');
  }

  cachedAccessToken = token;

  // Sync token to backend senderAccounts so backend can also use it
  if (result.user.email) {
    try {
      await api.senderAccounts.connect({
        emailAddress: result.user.email,
        provider: 'gmail',
        oauthAccessToken: token,
      });
    } catch (e) {
      console.warn('Backend sender account sync notice:', e);
    }
  }

  return token;
}

/**
 * Format start and end date/time objects for Google Calendar API v3
 */
function formatEventDates(dueDateStr: string, dueTime?: string, addTime?: boolean) {
  let datePart = new Date().toISOString().split('T')[0];
  if (dueDateStr) {
    datePart = dueDateStr.includes('T') ? dueDateStr.split('T')[0] : dueDateStr.trim();
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
    
    // User local timezone
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const startDateTime = `${datePart}T${startH}:${startM}:00`;

    const totalMinutes = h * 60 + m + 30;
    const endH = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endM = String(totalMinutes % 60).padStart(2, '0');
    const endDateTime = `${datePart}T${endH}:${endM}:00`;

    return {
      start: { dateTime: startDateTime, timeZone },
      end: { dateTime: endDateTime, timeZone }
    };
  } else {
    // All-day event: start inclusive, end exclusive (next day)
    const startDate = new Date(`${datePart}T00:00:00`);
    const nextDate = new Date(startDate.getTime() + 86400000);
    const endDatePart = nextDate.toISOString().split('T')[0];

    return {
      start: { date: datePart },
      end: { date: endDatePart }
    };
  }
}

/**
 * Sync user tasks directly to Google Calendar via Google Calendar API v3
 */
export async function syncTasksToGoogleCalendar(customTasks?: Task[]): Promise<{
  success: boolean;
  syncedCount: number;
  totalCount: number;
  message: string;
  tasks: Task[];
}> {
  const fbUser = auth.currentUser;
  const uid = fbUser ? fbUser.uid : getCurrentUserId();

  // Obtain access token (triggers Google popup if needed)
  const token = await getGoogleCalendarAccessToken(true);

  // Retrieve current tasks
  const tasksToSync = (customTasks && customTasks.length > 0)
    ? [...customTasks]
    : getUserStoredData<Task>('tasks', uid);

  if (tasksToSync.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      totalCount: 0,
      message: 'No tasks found to sync. Create a task first!',
      tasks: []
    };
  }

  let syncedCount = 0;
  const updatedTasks: Task[] = [];

  for (const task of tasksToSync) {
    const { start, end } = formatEventDates(task.dueDate, task.dueTime, task.addTime);
    const eventPayload = {
      summary: `${task.isCompleted ? '✓ [Done] ' : ''}${task.title}`,
      description: `[ProspectOS Task]\nStatus: ${task.isCompleted ? 'Completed' : 'Pending'}\nPriority: ${task.priority}\nAssigned: ${task.assignedTo || 'Unassigned'}\nDetails: ${task.description || 'None'}\n\nManaged by ProspectOS Sales CRM`,
      status: 'confirmed',
      start,
      end
    };

    let eventId = task.googleEventId;
    let didSync = false;

    if (eventId) {
      // Try patching existing calendar event
      try {
        const patchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (patchRes.ok) {
          didSync = true;
          syncedCount++;
        }
      } catch (e) {
        console.warn('Google Calendar patch error for task', task.id, e);
      }
    }

    if (!didSync) {
      // Create new calendar event
      try {
        const postRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (postRes.ok) {
          const data = await postRes.json();
          eventId = data.id;
          didSync = true;
          syncedCount++;
        } else {
          const errText = await postRes.text();
          console.warn('Google Calendar create event failed:', postRes.status, errText);
        }
      } catch (e) {
        console.error('Google Calendar API fetch error:', e);
      }
    }

    const updatedTask: Task = {
      ...task,
      googleEventId: eventId || task.googleEventId,
      syncedToGoogle: didSync || task.syncedToGoogle
    };

    updatedTasks.push(updatedTask);

    // Save individual task update in Firestore if authenticated
    if (fbUser && didSync) {
      firestoreService.tasks.update(task.id, {
        googleEventId: eventId,
        syncedToGoogle: true
      }, fbUser.uid).catch(() => {});
    }
  }

  // Persist updated tasks into local storage cache
  setUserStoredData('tasks', updatedTasks, uid);

  // Notify backend if available with bearer token
  try {
    fetch('/api/tasks/sync-google-calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer fb_${uid}`,
        'x-google-access-token': token
      }
    }).catch(() => {});
  } catch {}

  return {
    success: true,
    syncedCount,
    totalCount: updatedTasks.length,
    message: `Successfully synced ${syncedCount} of ${updatedTasks.length} task(s) directly to your Google Calendar!`,
    tasks: updatedTasks
  };
}

/**
 * Remove an event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(googleEventId: string): Promise<boolean> {
  if (!googleEventId) return false;
  try {
    const token = await getGoogleCalendarAccessToken(false);
    if (!token) return false;

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return res.ok;
  } catch (e) {
    console.warn('Google Calendar delete event error:', e);
    return false;
  }
}
