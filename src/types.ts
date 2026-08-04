export interface User {
  id: string;
  email: string;
  name: string;
  theme?: 'dark' | 'light';
  currency?: string;
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
  contractType?: 'monthly' | 'one_time';
  contractValue?: number;
  monthlyRetainer?: number;
  servicePurchased?: string;
  estimatedValue?: number;
  startDate?: string;
  renewalDate?: string;
  deliveryDate?: string;
  paymentStatus?: 'Paid' | 'Pending' | 'Overdue';
  invoiceStatus?: 'Paid' | 'Sent' | 'Pending';
  internalNotes?: string;
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
  triggerDate: string;
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

export interface FileMetadata {
  id: string;
  userId: string;
  prospectId?: string;
  clientId?: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}

export interface AnalyticsMetrics {
  totalProspects: number;
  activeProspects: number;
  totalClients: number;
  activeClients: number;
  landedDeals: number;
  failedDeals: number;
  pendingFollowups: number;
  mrr: number;
  totalUpfront: number;
  totalRevenueGenerated: number;
  totalContractValue: number;
  conversionRate: number;
  winRate: number;
  retentionRate?: number;
}

export interface ChartItem {
  name: string;
  value: number;
}

export interface ProspectGrowthItem {
  name: string;
  prospects: number;
}

export interface RevenueTrendItem {
  name: string;
  revenue: number;
  upfront?: number;
  retainers?: number;
}

export interface AnalyticsPayload {
  metrics: AnalyticsMetrics;
  charts: {
    pipelineFunnel: ChartItem[];
    topLeadSources: ChartItem[];
    topIndustries: ChartItem[];
    topCountries: ChartItem[];
    monthlyProspectGrowth: ProspectGrowthItem[];
    monthlyRevenueTrend: RevenueTrendItem[];
    wonVsLost: ChartItem[];
  };
}

export type ViewTab =
  | 'dashboard'
  | 'prospects'
  | 'clients'
  | 'tasks'
  | 'calendar'
  | 'analytics'
  | 'settings';
