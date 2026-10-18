import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase.js';
import { Prospect, Client, Task, Reminder, Note } from '../types.js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

export const firestoreService = {
  // PROSPECTS
  prospects: {
    list: async (userId: string): Promise<Prospect[]> => {
      const colPath = 'prospects';
      try {
        const q = query(collection(db, colPath), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const results: Prospect[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        return results;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, colPath);
        return [];
      }
    },

    create: async (data: any, userId: string): Promise<Prospect> => {
      const colPath = 'prospects';
      const id = data.id || `prsp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const prospect: Prospect = {
        id,
        userId,
        businessName: data.businessName || 'New Prospect',
        ownerName: data.ownerName || '',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        industry: data.industry || 'General',
        country: data.country || 'United States',
        city: data.city || '',
        address: data.address || '',
        source: data.source || 'Direct Outreach',
        linkedin: data.linkedin || '',
        instagram: data.instagram || '',
        facebook: data.facebook || '',
        notes: data.notes || '',
        priority: data.priority || 'Medium',
        tags: Array.isArray(data.tags) ? data.tags : [],
        dateAdded: data.dateAdded || new Date().toISOString(),
        status: data.status || 'New',
        nextFollowUpDate: data.nextFollowUpDate || null,
        followUpStatus: data.followUpStatus || (data.nextFollowUpDate ? 'pending' : 'none'),
        followUpNote: data.followUpNote || null,
        contractType: data.contractType || 'monthly',
        contractValue: Number(data.contractValue) || 12000,
        monthlyRetainer: Number(data.monthlyRetainer) || 1500,
        servicePurchased: data.servicePurchased || 'Premium CRM Implementation',
      };

      try {
        await setDoc(doc(db, colPath, id), prospect);
        return prospect;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${colPath}/${id}`);
        return prospect;
      }
    },

    update: async (id: string, updates: Partial<Prospect>, userId: string): Promise<Prospect | null> => {
      const colPath = 'prospects';
      try {
        const docRef = doc(db, colPath, id);
        await setDoc(docRef, { ...updates, userId }, { merge: true });
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...(snap.data() as any) };
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${colPath}/${id}`);
        return null;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      const colPath = 'prospects';
      try {
        await deleteDoc(doc(db, colPath, id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
        return false;
      }
    },

    bulkDelete: async (ids: string[]): Promise<number> => {
      try {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.delete(doc(db, 'prospects', id));
        });
        await batch.commit();
        return ids.length;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'prospects/bulk');
        return 0;
      }
    },

    bulkUpdate: async (ids: string[], updates: any, userId: string): Promise<number> => {
      try {
        const batch = writeBatch(db);
        ids.forEach((id) => {
          batch.set(doc(db, 'prospects', id), { ...updates, userId }, { merge: true });
        });
        await batch.commit();
        return ids.length;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'prospects/bulk');
        return 0;
      }
    }
  },

  // CLIENTS
  clients: {
    list: async (userId: string): Promise<Client[]> => {
      const colPath = 'clients';
      try {
        const q = query(collection(db, colPath), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const results: Client[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        return results;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, colPath);
        return [];
      }
    },

    create: async (data: any, userId: string): Promise<Client> => {
      const colPath = 'clients';
      const id = data.id || `clnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const client: Client = {
        id,
        userId,
        prospectId: data.prospectId || undefined,
        businessName: data.businessName || 'New Client',
        contactName: data.contactName || '',
        email: data.email || '',
        phone: data.phone || '',
        servicePurchased: data.servicePurchased || 'Premium CRM Implementation',
        contractValue: Number(data.contractValue) || 12000,
        monthlyRetainer: Number(data.monthlyRetainer) || 1500,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        renewalDate: data.renewalDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryDate: data.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentStatus: data.paymentStatus || 'Pending',
        invoiceStatus: data.invoiceStatus || 'Sent',
        notes: data.notes || '',
        priority: data.priority || 'Medium',
        internalNotes: data.internalNotes || '',
        status: data.status || 'Active',
        nextFollowUpDate: data.nextFollowUpDate || null,
        followUpStatus: data.followUpStatus || (data.nextFollowUpDate ? 'pending' : 'none'),
        followUpNote: data.followUpNote || null,
      };

      try {
        await setDoc(doc(db, colPath, id), client);
        return client;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${colPath}/${id}`);
        return client;
      }
    },

    update: async (id: string, updates: Partial<Client>, userId: string): Promise<Client | null> => {
      const colPath = 'clients';
      try {
        const docRef = doc(db, colPath, id);
        await setDoc(docRef, { ...updates, userId }, { merge: true });
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...(snap.data() as any) };
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${colPath}/${id}`);
        return null;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      const colPath = 'clients';
      try {
        await deleteDoc(doc(db, colPath, id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
        return false;
      }
    }
  },

  // TASKS
  tasks: {
    list: async (userId: string, clientId?: string): Promise<Task[]> => {
      const colPath = 'tasks';
      try {
        const q = clientId
          ? query(collection(db, colPath), where('userId', '==', userId), where('clientId', '==', clientId))
          : query(collection(db, colPath), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const results: Task[] = [];
        snapshot.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        return results;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, colPath);
        return [];
      }
    },

    create: async (data: any, userId: string): Promise<Task> => {
      const colPath = 'tasks';
      const id = data.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const task: Task = {
        id,
        userId,
        clientId: data.clientId || '',
        title: data.title || 'New Task',
        description: data.description || '',
        isCompleted: false,
        dueDate: data.dueDate || new Date().toISOString().split('T')[0],
        dueTime: data.dueTime || '',
        priority: data.priority || 'Medium',
        assignedTo: data.assignedTo || 'Lead Agent',
        addTime: Boolean(data.addTime)
      };

      try {
        await setDoc(doc(db, colPath, id), task);
        return task;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${colPath}/${id}`);
        return task;
      }
    },

    update: async (id: string, updates: Partial<Task>, userId: string): Promise<Task | null> => {
      const colPath = 'tasks';
      try {
        const docRef = doc(db, colPath, id);
        await setDoc(docRef, { ...updates, userId }, { merge: true });
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { id: snap.id, ...(snap.data() as any) };
        }
        return null;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${colPath}/${id}`);
        return null;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      const colPath = 'tasks';
      try {
        await deleteDoc(doc(db, colPath, id));
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
        return false;
      }
    }
  }
};
