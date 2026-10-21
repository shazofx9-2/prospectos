import { handleClientFallback, syncToClientStorage, getCurrentUserId, setUserStoredData, getUserStoredData, computeAnalyticsFallback } from './clientStorage.js';
import { auth } from './firebase.js';
import { firestoreService } from './firestoreService.js';

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
    return Promise.resolve(cache[url] as T);
  }

  // Resilient 800ms timeout for deployments (e.g. Vercel) where static edge has no /api server
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      // Returned HTML SPA index because static Vercel host has no server running on /api/
      return handleClientFallback<T>(url, method, options);
    }

    if (!response.ok) {
      // Fallback to client storage engine if unauthorized or server error
      const fallbackResult = handleClientFallback<T>(url, method, options);
      if (fallbackResult !== undefined && fallbackResult !== null) {
        return fallbackResult;
      }
      const errData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (method === 'GET') {
      cache[url] = data;
    } else {
      clearApiCache();
    }

    // Sync response data into local storage so client storage fallback is up to date
    syncToClientStorage(url, method, options, data);

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Network or timeout or parse error -> fallback instantly to client storage engine
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
    list: async (): Promise<any[]> => {
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();
      const local = getUserStoredData<any>('prospects', uid);

      // Instant return if local cache exists (0ms latency for user)
      if (local && local.length > 0) {
        if (fbUser) {
          firestoreService.prospects.list(fbUser.uid).then((remoteList) => {
            if (remoteList && remoteList.length > 0) {
              setUserStoredData('prospects', remoteList, uid);
            } else if (local.length > 0) {
              Promise.all(local.map((p) => firestoreService.prospects.create(p, fbUser.uid))).catch(() => {});
            }
          }).catch(() => {});
        }
        return local;
      }

      if (fbUser) {
        try {
          const fetchPromise = firestoreService.prospects.list(fbUser.uid);
          const timeoutPromise = new Promise<any[]>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 600)
          );
          const remoteList = await Promise.race([fetchPromise, timeoutPromise]);
          if (remoteList && remoteList.length > 0) {
            setUserStoredData('prospects', remoteList, uid);
            return remoteList;
          }
        } catch (e) {
          console.warn('Firestore prospects fallback:', e);
        }
      }

      return handleClientFallback<any[]>('/api/prospects', 'GET', {});
    },

    create: async (data: any): Promise<any> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      let createdProspect = data;
      if (fbUser) {
        try {
          createdProspect = await firestoreService.prospects.create(data, fbUser.uid);
        } catch (e) {
          console.warn('Firestore prospects create error:', e);
        }
      }

      // Also persist to local storage cache
      let list = getUserStoredData<any>('prospects', uid);
      const newP = {
        ...createdProspect,
        id: createdProspect.id || `prsp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: uid,
      };
      list.unshift(newP);
      setUserStoredData('prospects', list, uid);

      // Attempt server push if available
      request<any>('/api/prospects', {
        method: 'POST',
        body: JSON.stringify(newP),
      }).catch(() => {});

      return newP;
    },

    update: async (id: string, data: any): Promise<any> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      // If converted to Landed, convert to client
      if (data.status === 'Landed') {
        let prospectsList = getUserStoredData<any>('prospects', uid);
        const existingP = prospectsList.find((p) => p.id === id);
        prospectsList = prospectsList.filter((p) => p.id !== id);
        setUserStoredData('prospects', prospectsList, uid);

        const newClient = {
          id: `clnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: uid,
          prospectId: id,
          businessName: data.businessName || existingP?.businessName || 'New Client',
          contactName: data.contactName || data.ownerName || existingP?.ownerName || 'Contact',
          email: data.email !== undefined ? data.email : (existingP?.email || ''),
          phone: data.phone !== undefined ? data.phone : (existingP?.phone || ''),
          servicePurchased: data.servicePurchased || 'Premium CRM Implementation',
          contractValue: Number(data.contractValue) || 12000,
          monthlyRetainer: data.contractType === 'one_time' ? 0 : (Number(data.monthlyRetainer) || 1500),
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          renewalDate: data.renewalDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          deliveryDate: data.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentStatus: data.paymentStatus || 'Pending',
          invoiceStatus: data.invoiceStatus || 'Sent',
          notes: data.notes !== undefined ? data.notes : (existingP?.notes || ''),
          priority: data.priority || existingP?.priority || 'Medium',
          internalNotes: data.internalNotes || 'Converted from Landed Prospect',
          status: data.clientStatus || 'Active',
          nextFollowUpDate: data.nextFollowUpDate || null,
          followUpStatus: data.nextFollowUpDate ? 'pending' : 'none',
          followUpNote: data.followUpNote || null,
        };

        let clientsList = getUserStoredData<any>('clients', uid);
        clientsList.unshift(newClient);
        setUserStoredData('clients', clientsList, uid);

        if (fbUser) {
          await firestoreService.prospects.delete(id).catch(() => {});
          await firestoreService.clients.create(newClient, fbUser.uid).catch(() => {});
        }

        request<any>(`/api/prospects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }).catch(() => {});

        return { success: true, message: 'Converted to client', client: newClient };
      }

      if (fbUser) {
        await firestoreService.prospects.update(id, data, fbUser.uid).catch(() => {});
      }

      let list = getUserStoredData<any>('prospects', uid);
      list = list.map((p) => (p.id === id ? { ...p, ...data } : p));
      setUserStoredData('prospects', list, uid);

      request<any>(`/api/prospects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }).catch(() => {});

      return list.find((p) => p.id === id) || data;
    },

    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      if (fbUser) {
        await firestoreService.prospects.delete(id).catch(() => {});
      }

      let list = getUserStoredData<any>('prospects', uid);
      list = list.filter((p) => p.id !== id);
      setUserStoredData('prospects', list, uid);

      request<{ success: boolean; message: string }>(`/api/prospects/${id}`, {
        method: 'DELETE',
      }).catch(() => {});

      return { success: true, message: 'Deleted' };
    },

    bulkUpdate: async (ids: string[], updates: any): Promise<{ success: boolean; updatedCount: number }> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      if (fbUser) {
        await firestoreService.prospects.bulkUpdate(ids, updates, fbUser.uid).catch(() => {});
      }

      let list = getUserStoredData<any>('prospects', uid);
      list = list.map((p) => (ids.includes(p.id) ? { ...p, ...updates } : p));
      setUserStoredData('prospects', list, uid);

      request<any>('/api/prospects/bulk-update', {
        method: 'POST',
        body: JSON.stringify({ ids, updates }),
      }).catch(() => {});

      return { success: true, updatedCount: ids.length };
    },

    bulkDelete: async (ids: string[]): Promise<{ success: boolean; deletedCount: number }> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      if (fbUser) {
        await firestoreService.prospects.bulkDelete(ids).catch(() => {});
      }

      let list = getUserStoredData<any>('prospects', uid);
      list = list.filter((p) => !ids.includes(p.id));
      setUserStoredData('prospects', list, uid);

      request<any>('/api/prospects/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      }).catch(() => {});

      return { success: true, deletedCount: ids.length };
    },
  },

  clients: {
    list: async (): Promise<any[]> => {
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();
      const local = getUserStoredData<any>('clients', uid);

      // Instant return if local cache exists (0ms latency for user)
      if (local && local.length > 0) {
        if (fbUser) {
          firestoreService.clients.list(fbUser.uid).then((remoteList) => {
            if (remoteList && remoteList.length > 0) {
              setUserStoredData('clients', remoteList, uid);
            } else if (local.length > 0) {
              Promise.all(local.map((c) => firestoreService.clients.create(c, fbUser.uid))).catch(() => {});
            }
          }).catch(() => {});
        }
        return local;
      }

      if (fbUser) {
        try {
          const fetchPromise = firestoreService.clients.list(fbUser.uid);
          const timeoutPromise = new Promise<any[]>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 600)
          );
          const remoteList = await Promise.race([fetchPromise, timeoutPromise]);
          if (remoteList && remoteList.length > 0) {
            setUserStoredData('clients', remoteList, uid);
            return remoteList;
          }
        } catch (e) {
          console.warn('Firestore clients fallback:', e);
        }
      }

      return handleClientFallback<any[]>('/api/clients', 'GET', {});
    },

    create: async (data: any): Promise<any> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      let createdClient = data;
      if (fbUser) {
        try {
          createdClient = await firestoreService.clients.create(data, fbUser.uid);
        } catch (e) {
          console.warn('Firestore clients create error:', e);
        }
      }

      let list = getUserStoredData<any>('clients', uid);
      const newC = {
        ...createdClient,
        id: createdClient.id || `clnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: uid,
      };
      list.unshift(newC);
      setUserStoredData('clients', list, uid);

      request<any>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(newC),
      }).catch(() => {});

      return newC;
    },

    update: async (id: string, data: any): Promise<any> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      if (fbUser) {
        await firestoreService.clients.update(id, data, fbUser.uid).catch(() => {});
      }

      let list = getUserStoredData<any>('clients', uid);
      list = list.map((c) => (c.id === id ? { ...c, ...data } : c));
      setUserStoredData('clients', list, uid);

      request<any>(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }).catch(() => {});

      return list.find((c) => c.id === id) || data;
    },

    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      // 1. Delete from Firestore if authenticated
      if (fbUser) {
        await firestoreService.clients.delete(id).catch((err) => {
          console.warn('Firestore client deletion notice:', err);
        });
      }

      // 2. Delete immediately from client local storage
      let list = getUserStoredData<any>('clients', uid);
      list = list.filter((c) => c.id !== id);
      setUserStoredData('clients', list, uid);

      // Clean up linked tasks and reminders locally
      let tasksList = getUserStoredData<any>('tasks', uid);
      tasksList = tasksList.filter((t) => t.clientId !== id);
      setUserStoredData('tasks', tasksList, uid);

      // 3. Fire server request in background if available
      request<{ success: boolean; message: string }>(`/api/clients/${id}`, {
        method: 'DELETE',
      }).catch(() => {});

      return { success: true, message: 'Deleted' };
    },
  },

  tasks: {
    list: async (clientId?: string): Promise<any[]> => {
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();
      const local = getUserStoredData<any>('tasks', uid);
      const filteredLocal = clientId ? local.filter((t) => t.clientId === clientId) : local;

      // Instant return if local cache exists (0ms latency for user)
      if (filteredLocal && filteredLocal.length > 0) {
        if (fbUser) {
          firestoreService.tasks.list(fbUser.uid, clientId).then((remoteList) => {
            if (remoteList && remoteList.length > 0) {
              if (!clientId) setUserStoredData('tasks', remoteList, uid);
            } else if (filteredLocal.length > 0) {
              Promise.all(filteredLocal.map((t) => firestoreService.tasks.create(t, fbUser.uid))).catch(() => {});
            }
          }).catch(() => {});
        }
        return filteredLocal;
      }

      if (fbUser) {
        try {
          const fetchPromise = firestoreService.tasks.list(fbUser.uid, clientId);
          const timeoutPromise = new Promise<any[]>((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 600)
          );
          const remoteList = await Promise.race([fetchPromise, timeoutPromise]);
          if (remoteList && remoteList.length > 0) {
            if (!clientId) setUserStoredData('tasks', remoteList, uid);
            return remoteList;
          }
        } catch (e) {
          console.warn('Firestore tasks fallback:', e);
        }
      }

      return filteredLocal || [];
    },

    create: async (data: { clientId: string; title: string; description?: string; dueDate?: string; dueTime?: string; priority?: string; assignedTo?: string; addTime?: boolean }) => {
      clearApiCache();
      const fbUser = auth.currentUser;
      const uid = fbUser ? fbUser.uid : getCurrentUserId();

      if (fbUser) {
        try {
          await firestoreService.tasks.create(data, fbUser.uid);
        } catch (e) {
          console.warn('Firestore tasks create error:', e);
        }
      }

      return request<any>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: any) => {
      clearApiCache();
      const fbUser = auth.currentUser;
      if (fbUser) {
        await firestoreService.tasks.update(id, data, fbUser.uid).catch(() => {});
      }
      return request<any>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      clearApiCache();
      const fbUser = auth.currentUser;
      if (fbUser) {
        await firestoreService.tasks.delete(id).catch(() => {});
      }
      return request<{ success: boolean; message: string }>(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },

    syncGoogleCalendar: () =>
      request<{ success: boolean; syncedCount: number; totalCount: number; message: string }>('/api/tasks/sync-google-calendar', {
        method: 'POST',
      }),
  },

  reminders: {
    list: async (): Promise<any[]> => {
      const uid = getCurrentUserId();
      const local = getUserStoredData<any>('reminders', uid);
      if (local && local.length > 0) {
        return local;
      }
      try {
        const res = await request<any[]>('/api/reminders');
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {}
      return handleClientFallback<any[]>('/api/reminders', 'GET', {});
    },
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
    list: async (params?: { prospectId?: string; clientId?: string }): Promise<any[]> => {
      const uid = getCurrentUserId();
      let list = getUserStoredData<any>('notes', uid);
      if (params?.prospectId) list = list.filter((n) => n.prospectId === params.prospectId);
      else if (params?.clientId) list = list.filter((n) => n.clientId === params.clientId);
      if (list && list.length > 0) {
        return list;
      }
      try {
        let query = '';
        if (params?.prospectId) query = `?prospectId=${params.prospectId}`;
        else if (params?.clientId) query = `?clientId=${params.clientId}`;
        const res = await request<any[]>(`/api/notes${query}`);
        if (Array.isArray(res) && res.length > 0) return res;
      } catch {}
      return list || [];
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
    get: async () => {
      // Return instant computation immediately from local storage cache (0ms)
      const fallback = computeAnalyticsFallback();
      request<any>('/api/analytics').then((res) => {
        if (res && res.metrics) cache['/api/analytics'] = res;
      }).catch(() => {});
      return fallback;
    },
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
    list: async () => {
      const fallback = handleClientFallback<any>('/api/follow-ups', 'GET', {});
      request<any>('/api/follow-ups').then((res) => {
        if (res && (res.overdue || res.today || res.upcoming)) cache['/api/follow-ups'] = res;
      }).catch(() => {});
      return fallback;
    },
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
