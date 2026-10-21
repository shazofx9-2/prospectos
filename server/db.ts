import fs from 'fs';
import path from 'path';

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_REGION);
const DB_FILE = isVercel ? path.join('/tmp', 'db.json') : path.join(process.cwd(), 'db.json');

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  theme?: 'dark' | 'light';
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProspectStatus =
  | 'New'
  | 'Contacted'
  | 'Follow Up'
  | 'Meeting Scheduled'
  | 'Proposal Sent'
  | 'Negotiating'
  | 'Landed'
  | 'Failed'
  | 'Ghosted'
  | 'Not Interested'
  | 'Archived';

export interface Prospect {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  country: string;
  city: string;
  address: string;
  source: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  notes: string;
  priority: 'Low' | 'Medium' | 'High';
  tags: string[];
  dateAdded: string;
  status: ProspectStatus;
  nextFollowUpDate?: string | null;
  followUpStatus?: 'none' | 'pending' | 'done' | 'skipped';
  followUpNote?: string | null;
}

export type ClientStatus =
  | 'Active'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'
  | 'Lost'
  | 'Renewing';

export interface Client {
  id: string;
  userId: string;
  prospectId?: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  servicePurchased: string;
  contractValue: number;
  monthlyRetainer: number;
  startDate: string;
  renewalDate: string;
  deliveryDate: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  invoiceStatus: 'Sent' | 'Pending' | 'Paid';
  notes: string;
  priority: 'Low' | 'Medium' | 'High';
  internalNotes: string;
  status: ClientStatus;
  nextFollowUpDate?: string | null;
  followUpStatus?: 'none' | 'pending' | 'done' | 'skipped';
  followUpNote?: string | null;
}

export interface SenderAccount {
  id: string;
  userId: string;
  emailAddress: string;
  provider: 'gmail' | 'outlook';
  oauthAccessToken: string;
  oauthRefreshToken: string;
  tokenExpiresAt: number;
  connectedAt: string;
}

export interface EmailTemplate {
  id: string;
  userId: string;
  name: string;
  subject: string;
  body: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  userId: string;
  relatedId: string;
  relatedType: 'prospect' | 'client';
  templateId?: string | null;
  senderAccountId: string;
  senderEmail: string;
  recipientEmail: string;
  subjectSent: string;
  bodySent: string;
  sentAt: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface Task {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: string;
  dueTime?: string;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  addTime?: boolean;
  googleEventId?: string;
  syncedToGoogle?: boolean;
}

export interface Reminder {
  id: string;
  userId: string;
  prospectId?: string;
  clientId?: string;
  title: string;
  description: string;
  triggerDate: string; // ISO date string
  isCompleted: boolean;
  isRecurring: boolean;
  intervalDays?: number;
}

export interface Note {
  id: string;
  userId: string;
  prospectId?: string;
  clientId?: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  userId: string;
  prospectId?: string;
  clientId?: string;
  name: string;
  size: number;
  type: string;
  base64Data: string; // stored inside json for robust in-container durability
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  prospects: Prospect[];
  clients: Client[];
  tasks: Task[];
  reminders: Reminder[];
  notes: Note[];
  files: File[];
  senderAccounts: SenderAccount[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailLog[];
}

const initialDb: DatabaseSchema = {
  users: [],
  prospects: [],
  clients: [],
  tasks: [],
  reminders: [],
  notes: [],
  files: [],
  senderAccounts: [],
  emailTemplates: [],
  emailLogs: []
};

// Seed database with highly realistic, production-grade initial mock data for demo users if empty
function getEmptyDb(): DatabaseSchema {
  return JSON.parse(JSON.stringify(initialDb));
}

export class DB {
  private static load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE)) {
        const rootDb = path.join(process.cwd(), 'db.json');
        if (isVercel && fs.existsSync(rootDb)) {
          try {
            const seedRaw = fs.readFileSync(rootDb, 'utf-8');
            fs.writeFileSync(DB_FILE, seedRaw, 'utf-8');
            return JSON.parse(seedRaw);
          } catch {}
        }
        const empty = getEmptyDb();
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(empty, null, 2), 'utf-8');
        } catch {}
        return empty;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error loading database. Initializing fresh DB.', e);
      return getEmptyDb();
    }
  }

  private static save(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database.', e);
    }
  }

  public static query<K extends keyof DatabaseSchema>(table: K): DatabaseSchema[K] {
    const db = this.load();
    return db[table] || [];
  }

  public static insert<K extends keyof DatabaseSchema>(table: K, record: DatabaseSchema[K][number]): void {
    const db = this.load();
    if (!db[table]) {
      db[table] = [] as any;
    }
    db[table].push(record as any);
    this.save(db);
  }

  public static update<K extends keyof DatabaseSchema>(
    table: K,
    id: string,
    updates: Partial<DatabaseSchema[K][number]>
  ): boolean {
    const db = this.load();
    const list = db[table] || [];
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], ...updates };
    this.save(db);
    return true;
  }

  public static delete<K extends keyof DatabaseSchema>(table: K, id: string): boolean {
    const db = this.load();
    const list = db[table] || [];
    const initialLen = list.length;
    db[table] = list.filter((x: any) => x.id !== id) as any;
    if (db[table].length === initialLen) return false;

    this.save(db);
    return true;
  }

  public static clearAll(): void {
    this.save(getEmptyDb());
  }
}
