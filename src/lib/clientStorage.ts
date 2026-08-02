// Client-side local storage engine and analytics fallback for static hosts (e.g. Vercel static deployments)

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
  status: string;
  nextFollowUpDate?: string | null;
  followUpStatus?: 'none' | 'pending' | 'done' | 'skipped';
  followUpNote?: string | null;
}

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
  status: string;
  nextFollowUpDate?: string | null;
  followUpStatus?: 'none' | 'pending' | 'done' | 'skipped';
  followUpNote?: string | null;
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

const DEFAULT_PROSPECTS: Prospect[] = [
  {
    id: 'prsp_seed1',
    userId: 'usr_demo123',
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
    id: 'prsp_seed2',
    userId: 'usr_demo123',
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
    id: 'prsp_seed3',
    userId: 'usr_demo123',
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
    id: 'prsp_seed4',
    userId: 'usr_demo123',
    businessName: 'Velo Logistics',
    ownerName: 'Marcus Vance',
    email: 'mvance@velologistics.com',
    phone: '+1 (555) 012-7489',
    website: 'velologistics.com',
    industry: 'Transportation',
    country: 'United States',
    city: 'Chicago',
    address: '400 N Michigan Ave',
    source: 'Website Demo Request',
    linkedin: '',
    instagram: '',
    facebook: '',
    notes: 'Booked demo via Calendly. Focused on real-time driver dispatch CRM pipelines.',
    priority: 'Medium',
    tags: ['Logistics', 'Enterprise'],
    dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Contacted',
  },
  {
    id: 'prsp_seed5',
    userId: 'usr_demo123',
    businessName: 'Zetta Cybersec',
    ownerName: 'Aris Thorne',
    email: 'athorne@zettacyber.tech',
    phone: '+44 20 7946 0958',
    website: 'zettacyber.tech',
    industry: 'Cybersecurity',
    country: 'United Kingdom',
    city: 'London',
    address: '1 Primrose St',
    source: 'LinkedIn Outbound',
    linkedin: 'linkedin.com/in/aristhorne-zetta',
    instagram: '',
    facebook: '',
    notes: 'Initial pitch sent. Awaiting feedback from security director.',
    priority: 'Low',
    tags: ['Security', 'SaaS', 'UK'],
    dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'New',
  },
  {
    id: 'prsp_seed6',
    userId: 'usr_demo123',
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
    notes: 'Landed contract for custom store setup.',
    priority: 'High',
    tags: ['Shopify', 'Ecom', 'Landed'],
    dateAdded: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Landed',
  },
  {
    id: 'prsp_seed7',
    userId: 'usr_demo123',
    businessName: 'Helios Energy',
    ownerName: 'Garrison Cole',
    email: 'gcole@heliossolar.com',
    phone: '+1 (555) 011-3456',
    website: 'heliossolar.com',
    industry: 'Renewables',
    country: 'United States',
    city: 'Austin',
    address: '300 Congress Ave',
    source: 'Cold Email',
    linkedin: '',
    instagram: '',
    facebook: '',
    notes: 'Lost to internal build.',
    priority: 'Medium',
    tags: ['Solar', 'In-house Build'],
    dateAdded: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Failed',
  },
];

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'clnt_seed1',
    userId: 'usr_demo123',
    prospectId: 'prsp_seed6',
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
    notes: 'Elite hydrogen build. Phase 1 deployment is successful.',
    priority: 'High',
    internalNotes: 'Elena is highly responsive.',
    status: 'Active',
  },
  {
    id: 'clnt_seed2',
    userId: 'usr_demo123',
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
    internalNotes: 'Requires 99.99% uptime guarantees.',
    status: 'Active',
  },
  {
    id: 'clnt_seed3',
    userId: 'usr_demo123',
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
    notes: 'Full-site rebrand.',
    priority: 'Medium',
    internalNotes: 'Awaiting design assets feedback.',
    status: 'Renewing',
  },
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task_seed1',
    userId: 'usr_demo123',
    clientId: 'clnt_seed1',
    title: 'Optimize Core Web Vitals',
    description: 'Compress image bundles, structure lazy imports, and configure Cloudflare caching headers.',
    isCompleted: true,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'High',
    assignedTo: 'Alex Mercer',
  },
  {
    id: 'task_seed2',
    userId: 'usr_demo123',
    clientId: 'clnt_seed1',
    title: 'Integrate Stripe Payment Gateway',
    description: 'Configure customer portal subscriptions, stripe webhooks, and invoice receipts template.',
    isCompleted: false,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'High',
    assignedTo: 'Alex Mercer',
  },
];

const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'rem_seed1',
    userId: 'usr_demo123',
    prospectId: 'prsp_seed1',
    title: 'Follow up with Sarah on Starlight Proposal',
    description: 'Check if investment committee reviewed our workflow optimizer scope.',
    triggerDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    isRecurring: false,
  },
  {
    id: 'rem_seed2',
    userId: 'usr_demo123',
    clientId: 'clnt_seed2',
    title: 'Monthly Acme Infrastructure Health Check',
    description: 'Verify AWS cluster load balances and memory usage spikes.',
    triggerDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isCompleted: false,
    isRecurring: true,
    intervalDays: 30,
  },
];

const DEFAULT_NOTES: Note[] = [
  {
    id: 'note_seed1',
    userId: 'usr_demo123',
    prospectId: 'prsp_seed1',
    title: 'Initial Discovery Call Takeaways',
    content: 'Sarah confirmed budget is $25,000 for Q3 automation project. Decision makers: Sarah & Marcus.',
    isPinned: true,
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function getStored<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(initial) && Array.isArray(parsed) && parsed.length === 0) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

export function computeAnalyticsFallback() {
  const prospects = getStored<Prospect[]>('prospectos_prospects', DEFAULT_PROSPECTS);
  const clients = getStored<Client[]>('prospectos_clients', DEFAULT_CLIENTS);
  const reminders = getStored<Reminder[]>('prospectos_reminders', DEFAULT_REMINDERS);

  const totalProspects = prospects.length;
  const activeProspects = prospects.filter(
    (p) => !['Landed', 'Failed', 'Archived', 'Not Interested'].includes(p.status)
  ).length;

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'Active').length;

  const landedDeals = prospects.filter((p) => p.status === 'Landed').length;
  const failedDeals = prospects.filter((p) => p.status === 'Failed').length;

  const pendingFollowups = reminders.filter((r) => !r.isCompleted).length;

  const mrr = clients.reduce((acc, c) => acc + (c.monthlyRetainer || 0), 0);
  const totalUpfront = clients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
  const totalRevenueGenerated = totalUpfront + mrr;
  const totalContractValue = totalUpfront;

  const conversionRate = totalProspects > 0 ? Number(((landedDeals / totalProspects) * 100).toFixed(1)) : 0;
  const totalClosed = landedDeals + failedDeals;
  const winRate = totalClosed > 0 ? Number(((landedDeals / totalClosed) * 100).toFixed(1)) : 0;

  const lostClientsCount = clients.filter((c) => ['Cancelled', 'Lost'].includes(c.status)).length;
  const retentionRate = totalClients > 0
    ? Number((((totalClients - lostClientsCount) / totalClients) * 100).toFixed(1))
    : 100;

  const pipelineFunnel = [
    { name: 'New', value: prospects.filter((p) => p.status === 'New').length },
    { name: 'Contacted', value: prospects.filter((p) => p.status === 'Contacted').length },
    { name: 'Follow Up', value: prospects.filter((p) => p.status === 'Follow Up').length },
    { name: 'Meeting Scheduled', value: prospects.filter((p) => p.status === 'Meeting Scheduled').length },
    { name: 'Proposal Sent', value: prospects.filter((p) => p.status === 'Proposal Sent').length },
    { name: 'Negotiating', value: prospects.filter((p) => p.status === 'Negotiating').length },
    { name: 'Landed', value: landedDeals },
    { name: 'Failed', value: failedDeals },
  ];

  const sourcesMap: Record<string, number> = {};
  prospects.forEach((p) => {
    const src = p.source || 'Unknown';
    sourcesMap[src] = (sourcesMap[src] || 0) + 1;
  });
  const topLeadSources = Object.entries(sourcesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const industriesMap: Record<string, number> = {};
  prospects.forEach((p) => {
    const ind = p.industry || 'Unknown';
    industriesMap[ind] = (industriesMap[ind] || 0) + 1;
  });
  const topIndustries = Object.entries(industriesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const countriesMap: Record<string, number> = {};
  prospects.forEach((p) => {
    const c = p.country || 'Unknown';
    countriesMap[c] = (countriesMap[c] || 0) + 1;
  });
  const topCountries = Object.entries(countriesMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyProspectGrowth = monthNames.map((m, idx) => {
    const count = prospects.filter((p) => {
      const d = new Date(p.dateAdded);
      return d.getMonth() === idx;
    }).length;
    return { name: m, prospects: count };
  });

  const monthlyRevenueTrend = monthNames.map((m, idx) => {
    const startedThisMonth = clients.filter((c) => {
      if (!c.startDate) return false;
      const d = new Date(c.startDate);
      return d.getMonth() === idx;
    });

    const activeUpToThisMonth = clients.filter((c) => {
      if (!c.startDate) return false;
      const d = new Date(c.startDate);
      return d.getMonth() <= idx;
    });

    const upfront = startedThisMonth.reduce((sum, c) => sum + (c.contractValue || 0), 0);
    const retainers = activeUpToThisMonth.reduce((sum, c) => sum + (c.monthlyRetainer || 0), 0);
    const totalMonthRevenue = upfront + retainers;

    return {
      name: m,
      revenue: Math.round(totalMonthRevenue),
      upfront: Math.round(upfront),
      retainers: Math.round(retainers)
    };
  });

  return {
    metrics: {
      totalProspects,
      activeProspects,
      totalClients,
      activeClients,
      landedDeals,
      failedDeals,
      pendingFollowups,
      mrr,
      totalUpfront,
      totalRevenueGenerated,
      totalContractValue,
      conversionRate,
      winRate,
      retentionRate,
    },
    charts: {
      pipelineFunnel,
      topLeadSources,
      topIndustries,
      topCountries,
      monthlyProspectGrowth,
      monthlyRevenueTrend,
      wonVsLost: [
        { name: 'Won (Landed)', value: landedDeals },
        { name: 'Lost (Failed)', value: failedDeals },
      ],
    },
  };
}

export function handleClientFallback<T>(url: string, method: string, options: any): T {
  const cleanUrl = url.split('?')[0];

  // Auth
  if (cleanUrl.includes('/api/auth/me')) {
    return {
      user: {
        id: 'usr_demo123',
        email: 'demo@prospectos.com',
        name: 'Demo Principal',
      }
    } as any;
  }

  // Analytics
  if (cleanUrl.includes('/api/analytics')) {
    return computeAnalyticsFallback() as any;
  }

  // Prospects
  if (cleanUrl.includes('/api/prospects')) {
    let list = getStored<Prospect[]>('prospectos_prospects', DEFAULT_PROSPECTS);
    if (method === 'GET') {
      return list as any;
    }
    if (method === 'POST' && cleanUrl.includes('bulk-update')) {
      const { ids, updates } = JSON.parse(options.body || '{}');
      list = list.map((p) => (ids.includes(p.id) ? { ...p, ...updates } : p));
      setStored('prospectos_prospects', list);
      return { success: true, updatedCount: ids.length } as any;
    }
    if (method === 'POST' && cleanUrl.includes('bulk-delete')) {
      const { ids } = JSON.parse(options.body || '{}');
      list = list.filter((p) => !ids.includes(p.id));
      setStored('prospectos_prospects', list);
      return { success: true, deletedCount: ids.length } as any;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newP: Prospect = {
        id: `prsp_${Date.now()}`,
        userId: 'usr_demo123',
        businessName: body.businessName || 'New Prospect',
        ownerName: body.ownerName || '',
        email: body.email || '',
        phone: body.phone || '',
        website: body.website || '',
        industry: body.industry || 'General',
        country: body.country || 'United States',
        city: body.city || '',
        address: body.address || '',
        source: body.source || 'Direct',
        linkedin: body.linkedin || '',
        instagram: body.instagram || '',
        facebook: body.facebook || '',
        notes: body.notes || '',
        priority: body.priority || 'Medium',
        tags: body.tags || [],
        dateAdded: new Date().toISOString(),
        status: body.status || 'New',
      };
      list.unshift(newP);
      setStored('prospectos_prospects', list);
      return newP as any;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const id = cleanUrl.split('/').pop();
      const body = JSON.parse(options.body || '{}');
      list = list.map((p) => (p.id === id ? { ...p, ...body } : p));
      setStored('prospectos_prospects', list);
      const updated = list.find((p) => p.id === id);
      return updated as any;
    }
    if (method === 'DELETE') {
      const id = cleanUrl.split('/').pop();
      list = list.filter((p) => p.id !== id);
      setStored('prospectos_prospects', list);
      return { success: true, message: 'Deleted' } as any;
    }
  }

  // Clients
  if (cleanUrl.includes('/api/clients')) {
    let list = getStored<Client[]>('prospectos_clients', DEFAULT_CLIENTS);
    if (method === 'GET') {
      return list as any;
    }
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newC: Client = {
        id: `clnt_${Date.now()}`,
        userId: 'usr_demo123',
        businessName: body.businessName || 'New Client',
        contactName: body.contactName || '',
        email: body.email || '',
        phone: body.phone || '',
        servicePurchased: body.servicePurchased || '',
        contractValue: Number(body.contractValue) || 0,
        monthlyRetainer: Number(body.monthlyRetainer) || 0,
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        renewalDate: body.renewalDate || '',
        deliveryDate: body.deliveryDate || '',
        paymentStatus: body.paymentStatus || 'Pending',
        invoiceStatus: body.invoiceStatus || 'Pending',
        notes: body.notes || '',
        priority: body.priority || 'Medium',
        internalNotes: body.internalNotes || '',
        status: body.status || 'Active',
      };
      list.unshift(newC);
      setStored('prospectos_clients', list);
      return newC as any;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const id = cleanUrl.split('/').pop();
      const body = JSON.parse(options.body || '{}');
      list = list.map((c) => (c.id === id ? { ...c, ...body } : c));
      setStored('prospectos_clients', list);
      return list.find((c) => c.id === id) as any;
    }
    if (method === 'DELETE') {
      const id = cleanUrl.split('/').pop();
      list = list.filter((c) => c.id !== id);
      setStored('prospectos_clients', list);
      return { success: true, message: 'Deleted' } as any;
    }
  }

  // Tasks
  if (cleanUrl.includes('/api/tasks')) {
    let list = getStored<Task[]>('prospectos_tasks', DEFAULT_TASKS);
    if (method === 'GET') return list as any;
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newT: Task = {
        id: `task_${Date.now()}`,
        userId: 'usr_demo123',
        clientId: body.clientId || '',
        title: body.title || 'Task',
        description: body.description || '',
        isCompleted: false,
        dueDate: body.dueDate || new Date().toISOString().split('T')[0],
        priority: body.priority || 'Medium',
        assignedTo: body.assignedTo || 'Demo User',
      };
      list.unshift(newT);
      setStored('prospectos_tasks', list);
      return newT as any;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const id = cleanUrl.split('/').pop();
      const body = JSON.parse(options.body || '{}');
      list = list.map((t) => (t.id === id ? { ...t, ...body } : t));
      setStored('prospectos_tasks', list);
      return list.find((t) => t.id === id) as any;
    }
    if (method === 'DELETE') {
      const id = cleanUrl.split('/').pop();
      list = list.filter((t) => t.id !== id);
      setStored('prospectos_tasks', list);
      return { success: true, message: 'Deleted' } as any;
    }
  }

  // Reminders
  if (cleanUrl.includes('/api/reminders')) {
    let list = getStored<Reminder[]>('prospectos_reminders', DEFAULT_REMINDERS);
    if (method === 'GET') return list as any;
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newR: Reminder = {
        id: `rem_${Date.now()}`,
        userId: 'usr_demo123',
        prospectId: body.prospectId,
        clientId: body.clientId,
        title: body.title || 'Reminder',
        description: body.description || '',
        triggerDate: body.triggerDate || new Date().toISOString(),
        isCompleted: false,
        isRecurring: !!body.isRecurring,
        intervalDays: body.intervalDays,
      };
      list.unshift(newR);
      setStored('prospectos_reminders', list);
      return newR as any;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const id = cleanUrl.split('/').pop();
      const body = JSON.parse(options.body || '{}');
      list = list.map((r) => (r.id === id ? { ...r, ...body } : r));
      setStored('prospectos_reminders', list);
      return list.find((r) => r.id === id) as any;
    }
    if (method === 'DELETE') {
      const id = cleanUrl.split('/').pop();
      list = list.filter((r) => r.id !== id);
      setStored('prospectos_reminders', list);
      return { success: true, message: 'Deleted' } as any;
    }
  }

  // Notes
  if (cleanUrl.includes('/api/notes')) {
    let list = getStored<Note[]>('prospectos_notes', DEFAULT_NOTES);
    if (method === 'GET') return list as any;
    if (method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const newN: Note = {
        id: `note_${Date.now()}`,
        userId: 'usr_demo123',
        prospectId: body.prospectId,
        clientId: body.clientId,
        title: body.title || 'Note',
        content: body.content || '',
        isPinned: !!body.isPinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.unshift(newN);
      setStored('prospectos_notes', list);
      return newN as any;
    }
    if (method === 'PUT' || method === 'PATCH') {
      const id = cleanUrl.split('/').pop();
      const body = JSON.parse(options.body || '{}');
      list = list.map((n) => (n.id === id ? { ...n, ...body } : n));
      setStored('prospectos_notes', list);
      return list.find((n) => n.id === id) as any;
    }
    if (method === 'DELETE') {
      const id = cleanUrl.split('/').pop();
      list = list.filter((n) => n.id !== id);
      setStored('prospectos_notes', list);
      return { success: true, message: 'Deleted' } as any;
    }
  }

  // Follow ups
  if (cleanUrl.includes('/api/follow-ups')) {
    const prospects = getStored<Prospect[]>('prospectos_prospects', DEFAULT_PROSPECTS);
    const clients = getStored<Client[]>('prospectos_clients', DEFAULT_CLIENTS);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const overdue: any[] = [];
    const today: any[] = [];
    const upcoming: any[] = [];

    const checkFollowUp = (item: any, type: 'prospect' | 'client') => {
      if (!item.nextFollowUpDate || item.followUpStatus === 'done' || item.followUpStatus === 'skipped') return;
      const fDateStr = new Date(item.nextFollowUpDate).toISOString().split('T')[0];
      const entry = { ...item, type };
      if (fDateStr < todayStr) overdue.push(entry);
      else if (fDateStr === todayStr) today.push(entry);
      else upcoming.push(entry);
    };

    prospects.forEach((p) => checkFollowUp(p, 'prospect'));
    clients.forEach((c) => checkFollowUp(c, 'client'));

    return {
      overdue,
      today,
      upcoming,
      totalCount: overdue.length + today.length + upcoming.length,
    } as any;
  }

  return [] as any;
}
