import { handleClientFallback, syncToClientStorage, getStored, DEFAULT_PROSPECTS, DEFAULT_CLIENTS } from './clientStorage.js';

const BASE_URL = ''; // Relative paths proxy perfectly through Vite middleware

export function getToken(): string | null {
  return localStorage.getItem('prospectos_token');
}

export function setToken(token: string): void {
  localStorage.setItem('prospectos_token', token);
  clearApiCache();
}

export function removeToken(): void {
  localStorage.removeItem('prospectos_token');
  clearApiCache();
}

const cache: Record<string, any> = {};

export function clearApiCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Only return cached response if it's non-empty (to avoid stuck empty arrays)
  const isNonEmptyCache =
    cache[url] !== undefined &&
    (!Array.isArray(cache[url]) || cache[url].length > 0);

  if (method === 'GET' && isNonEmptyCache) {
    // Return cached data instantly while refreshing in background
    fetch(url, { ...options, headers })
      .then(async (res) => {
        if (!res.ok) return null;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data && (!Array.isArray(data) || data.length > 0)) {
          cache[url] = data;
        }
      })
      .catch(() => {});
    return Promise.resolve(cache[url] as T);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // Returned HTML SPA index because static Vercel host has no server running on /api/
      return handleClientFallback<T>(url, method, options);
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
      // Fallback to client storage engine if unauthorized or server error
      const fallbackResult = handleClientFallback<T>(url, method, options);
      if (fallbackResult !== undefined && fallbackResult !== null) {
        return fallbackResult;
      }
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (method === 'GET') {
      cache[url] = data;
    } else {
      // Invalidate list caches on mutation
      clearApiCache();
    }

    // Sync response data into local storage so client storage fallback is up to date
    syncToClientStorage(url, method, options, data);

    return data as T;
  } catch (err: any) {
    // Network or parse error -> fallback to client storage & analytics engine
    const fallback = handleClientFallback<T>(url, method, options);
    if (fallback !== undefined && fallback !== null) {
      return fallback;
    }
    throw err;
  }
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (details: { email: string; password: string; name: string }) =>
      request<{ token: string; user: { id: string; email: string; name: string } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(details),
      }),
    me: () =>
      request<{ user: { id: string; email: string; name: string } }>('/api/auth/me'),
  },

  prospects: {
    list: () => request<any[]>('/api/prospects'),
    create: (data: any) =>
      request<any>('/api/prospects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/prospects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/prospects/${id}`, {
        method: 'DELETE',
      }),
    bulkUpdate: (ids: string[], updates: any) =>
      request<{ success: boolean; updatedCount: number }>('/api/prospects/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ ids, updates }),
      }),
    bulkDelete: (ids: string[]) =>
      request<{ success: boolean; deletedCount: number }>('/api/prospects/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }),
  },

  clients: {
    list: () => request<any[]>('/api/clients'),
    create: (data: any) =>
      request<any>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/clients/${id}`, {
        method: 'DELETE',
      }),
  },

  tasks: {
    list: (clientId?: string) =>
      request<any[]>(`/api/tasks${clientId ? `?clientId=${clientId}` : ''}`),
    create: (data: { clientId: string; title: string; description?: string; dueDate?: string; dueTime?: string; priority?: string; assignedTo?: string; addTime?: boolean }) =>
      request<any>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
        method: 'DELETE',
      }),
    syncGoogleCalendar: () =>
      request<{ success: boolean; syncedCount: number; totalCount: number; message: string }>('/api/tasks/sync-google-calendar', {
        method: 'POST',
      }),
  },

  reminders: {
    list: () => request<any[]>('/api/reminders'),
    create: (data: { title: string; description?: string; triggerDate: string; isRecurring?: boolean; intervalDays?: number; prospectId?: string; clientId?: string }) =>
      request<any>('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/reminders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/reminders/${id}`, {
        method: 'DELETE',
      }),
  },

  notes: {
    list: (params?: { prospectId?: string; clientId?: string }) => {
      let query = '';
      if (params?.prospectId) query = `?prospectId=${params.prospectId}`;
      else if (params?.clientId) query = `?clientId=${params.clientId}`;
      return request<any[]>(`/api/notes${query}`);
    },
    create: (data: { title: string; content?: string; prospectId?: string; clientId?: string; isPinned?: boolean }) =>
      request<any>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<any>(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/notes/${id}`, {
        method: 'DELETE',
      }),
  },

  files: {
    list: (params?: { prospectId?: string; clientId?: string }) => {
      let query = '';
      if (params?.prospectId) query = `?prospectId=${params.prospectId}`;
      else if (params?.clientId) query = `?clientId=${params.clientId}`;
      return request<any[]>(`/api/files${query}`);
    },
    upload: (data: { name: string; size: number; type: string; base64Data: string; prospectId?: string; clientId?: string }) =>
      request<any>('/api/files', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/files/${id}`, {
        method: 'DELETE',
      }),
    getDownloadUrl: (id: string) => `/api/files/${id}/download`,
    getViewUrl: (id: string) => `/api/files/${id}/view`,
  },

  analytics: {
    get: () => request<any>('/api/analytics'),
  },
  settings: {
    export: () => request<any>('/api/settings/export'),
    import: (data: any) =>
      request<{ success: boolean; message: string }>('/api/settings/import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reset: () =>
      request<{ success: boolean; message: string }>('/api/settings/reset', {
        method: 'POST',
      }),
    updateProfile: (data: { name: string; email: string; theme?: string; currency?: string }) =>
      request<{ success: boolean; message: string; user?: any }>('/api/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updateAppSettings: (data: { theme?: 'dark' | 'light'; currency?: string }) =>
      request<{ success: boolean; message: string; user?: any }>('/api/settings/app-settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    updatePassword: (data: any) =>
      request<{ success: boolean; message: string }>('/api/settings/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteAccount: () =>
      request<{ success: boolean; message: string }>('/api/settings/account', {
        method: 'DELETE',
      }),
  },

  followUps: {
    list: () => request<{ overdue: any[]; today: any[]; upcoming: any[]; totalCount: number }>('/api/follow-ups'),
    updateProspect: (id: string, data: { nextFollowUpDate?: string | null; followUpStatus?: string; followUpNote?: string | null }) =>
      request<any>(`/api/follow-ups/prospects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    updateClient: (id: string, data: { nextFollowUpDate?: string | null; followUpStatus?: string; followUpNote?: string | null }) =>
      request<any>(`/api/follow-ups/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    send: (data: { relatedId: string; relatedType: 'prospect' | 'client'; recipientEmail?: string; senderAccountId?: string; templateId?: string; subject: string; body: string }) =>
      request<{ success: boolean; message: string; emailLog: any }>('/api/follow-ups/send', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    dismiss: (type: 'prospect' | 'client', id: string) =>
      request<{ success: boolean; message: string }>(`/api/follow-ups/${type}/${id}`, {
        method: 'DELETE'
      }),
  },

  emailTemplates: {
    list: () => request<any[]>('/api/follow-ups/templates'),
    create: (data: { name: string; subject: string; body: string; isDefault?: boolean }) =>
      request<any>('/api/follow-ups/templates', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: { name?: string; subject?: string; body?: string; isDefault?: boolean }) =>
      request<any>(`/api/follow-ups/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/follow-ups/templates/${id}`, {
        method: 'DELETE'
      }),
  },

  senderAccounts: {
    list: () => request<any[]>('/api/follow-ups/sender-accounts'),
    connect: (data: { emailAddress: string; provider?: 'gmail' | 'outlook'; oauthAccessToken?: string; oauthRefreshToken?: string }) =>
      request<any>('/api/follow-ups/sender-accounts/connect', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/follow-ups/sender-accounts/${id}`, {
        method: 'DELETE'
      }),
  },
};
