import { DB, Prospect, Client, Task, Reminder, Note } from './db.js';
import { hashPassword } from './auth.js';

export async function seedDemoData() {
  try {
    const users = DB.query('users');
    if (users.length > 0) {
      return; // Already seeded
    }

    console.log('Seeding ProspectOS demo data...');

    // 1. Create demo user
    const demoUserId = 'usr_demo123';
    const passwordHash = await hashPassword('password123');

    DB.insert('users', {
      id: demoUserId,
      email: 'demo@prospectos.com',
      passwordHash,
      name: 'Demo Principal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Seed Prospects
    const prospects: Prospect[] = [
      {
        id: 'prsp_seed1',
        userId: demoUserId,
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
        userId: demoUserId,
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
        userId: demoUserId,
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
        userId: demoUserId,
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
        notes: 'Booked demo via the Calendly widget. Focused on real-time driver dispatch CRM pipelines.',
        priority: 'Medium',
        tags: ['Logistics', 'Enterprise'],
        dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Contacted',
      },
      {
        id: 'prsp_seed5',
        userId: demoUserId,
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
        notes: 'Initial pitch sent. Awaiting feedback from their security operations director.',
        priority: 'Low',
        tags: ['Security', 'SaaS', 'UK'],
        dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'New',
      },
      {
        id: 'prsp_seed6',
        userId: demoUserId,
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
      },
      {
        id: 'prsp_seed7',
        userId: demoUserId,
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
        notes: 'Lost to internal build. Decided to hire in-house devs instead.',
        priority: 'Medium',
        tags: ['Solar', 'In-house Build'],
        dateAdded: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Failed',
      },
      {
        id: 'prsp_seed8',
        userId: demoUserId,
        businessName: 'Quantum Biotech',
        ownerName: 'Dr. Alexis Vance',
        email: 'alexis.vance@quantumbiotech.org',
        phone: '+1 (555) 018-4722',
        website: 'quantumbiotech.org',
        industry: 'Biotech',
        country: 'United States',
        city: 'Boston',
        address: '75 Binney St',
        source: 'Conference Lead',
        linkedin: '',
        instagram: '',
        facebook: '',
        notes: 'Followed up three times but ghosted. Archiving for next quarter re-engagement.',
        priority: 'Low',
        tags: ['Biotech', 'No Response'],
        dateAdded: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Ghosted',
      }
    ];

    for (const p of prospects) {
      DB.insert('prospects', p);
    }

    // 3. Seed Clients (Nova Commerce is the converted prospect)
    const clients: Client[] = [
      {
        id: 'clnt_seed1',
        userId: demoUserId,
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
        notes: 'Elite Shopify hydrogen build. Phase 1 deployment is highly successful. Working on SEO next.',
        priority: 'High',
        internalNotes: 'Elena is highly responsive. Submit weekly reports on Monday morning.',
        status: 'Active',
      },
      {
        id: 'clnt_seed2',
        userId: demoUserId,
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
        id: 'clnt_seed3',
        userId: demoUserId,
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

    for (const c of clients) {
      DB.insert('clients', c);
    }

    // 4. Seed Tasks for Clients
    const tasks: Task[] = [
      {
        id: 'task_seed1',
        userId: demoUserId,
        clientId: 'clnt_seed1', // Nova Commerce
        title: 'Optimize Core Web Vitals',
        description: 'Compress image bundles, structure lazy imports, and configure Cloudflare caching headers.',
        isCompleted: true,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'Alex Mercer',
      },
      {
        id: 'task_seed2',
        userId: demoUserId,
        clientId: 'clnt_seed1', // Nova Commerce
        title: 'Integrate Stripe Payment Gateway',
        description: 'Configure customer portal subscriptions, stripe webhooks, and invoice receipts template.',
        isCompleted: false,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'Emma Watson',
      },
      {
        id: 'task_seed3',
        userId: demoUserId,
        clientId: 'clnt_seed1', // Nova Commerce
        title: 'Conduct Final SEO Handover Audit',
        description: 'Format schema.org JSON-LD microdata, redirect legacy broken links, and submit sitemap to Google Search Console.',
        isCompleted: false,
        dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'Medium',
        assignedTo: 'Sarah Connor',
      },
      {
        id: 'task_seed4',
        userId: demoUserId,
        clientId: 'clnt_seed2', // Acme Global
        title: 'Harden Docker Base Containers',
        description: 'Conduct non-root user verification, run Trivy vulnerability scanning, and fix base image CVEs.',
        isCompleted: true,
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'Linus Torvalds',
      },
      {
        id: 'task_seed5',
        userId: demoUserId,
        clientId: 'clnt_seed2', // Acme Global
        title: 'Conduct Disaster Recovery Drill',
        description: 'Perform real-time database restore dry run, check AWS multi-region failover, and measure restore RTO/RPO metrics.',
        isCompleted: false,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'High',
        assignedTo: 'DevOps Lead',
      },
      {
        id: 'task_seed6',
        userId: demoUserId,
        clientId: 'clnt_seed3', // Prism Designs
        title: 'Launch Webflow Custom Animations',
        description: 'Implement scroll-triggered GSAP animations, 3D card layout hover skew, and premium typography page fade-ins.',
        isCompleted: true,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'Medium',
        assignedTo: 'Maya Lin',
      }
    ];

    for (const t of tasks) {
      DB.insert('tasks', t);
    }

    // 5. Seed Reminders (Follow-Ups)
    const reminders: Reminder[] = [
      {
        id: 'rem_seed1',
        userId: demoUserId,
        prospectId: 'prsp_seed1', // Starlight
        title: 'Send Revised Contract Draft',
        description: 'Refactor pricing module to include a custom quarterly SLA rider.',
        triggerDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        isRecurring: false,
      },
      {
        id: 'rem_seed2',
        userId: demoUserId,
        prospectId: 'prsp_seed2', // Apex Healthtech
        title: 'Follow Up on HIPAA Proposal',
        description: 'Acknowledge email sent on Tuesday. Offer security operations sync-up call.',
        triggerDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        isRecurring: false,
      },
      {
        id: 'rem_seed3',
        userId: demoUserId,
        clientId: 'clnt_seed3', // Prism Designs
        title: 'Invoice Payment Clearance Ping',
        description: 'Verify payment receipt has cleared Stripe dashboard.',
        triggerDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Overdue reminder
        isCompleted: false,
        isRecurring: false,
      },
      {
        id: 'rem_seed4',
        userId: demoUserId,
        clientId: 'clnt_seed1',
        title: 'Weekly Deliverables Checkin',
        description: 'Status update on core Web Vitals performance benchmarks.',
        triggerDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        isCompleted: false,
        isRecurring: true,
        intervalDays: 7,
      }
    ];

    for (const r of reminders) {
      DB.insert('reminders', r);
    }

    // 6. Seed Notes
    const notes: Note[] = [
      {
        id: 'note_seed1',
        userId: demoUserId,
        prospectId: 'prsp_seed1',
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
        id: 'note_seed2',
        userId: demoUserId,
        clientId: 'clnt_seed1',
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

    for (const n of notes) {
      DB.insert('notes', n);
    }

    console.log('Seeding completed successfully!');
  } catch (e) {
    console.error('Error during data seeding:', e);
  }
}

export function seedSampleForUser(targetUserId: string) {
  try {
    const existingProspects = DB.query('prospects').filter((p) => p.userId === targetUserId);
    if (existingProspects.length > 0) return; // already seeded

    const randSuffix = Math.random().toString(36).substring(2, 7);

    // 1. Seed Prospects for Guest
    const prospects: Prospect[] = [
      {
        id: `prsp_gst1_${randSuffix}`,
        userId: targetUserId,
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
        nextFollowUpDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        followUpStatus: 'pending',
        followUpNote: 'Send updated enterprise contract quote'
      },
      {
        id: `prsp_gst2_${randSuffix}`,
        userId: targetUserId,
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
        tags: ['Healthcare', 'B2B'],
        dateAdded: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Proposal Sent',
        nextFollowUpDate: new Date().toISOString(),
        followUpStatus: 'pending',
        followUpNote: 'Follow up on proposal review'
      },
      {
        id: `prsp_gst3_${randSuffix}`,
        userId: targetUserId,
        businessName: 'Lumina Creative Agency',
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
        instagram: '',
        facebook: '',
        notes: 'Inbound referral from agency partner. Looking for systems audit and operations automation.',
        priority: 'High',
        tags: ['Agency', 'Creative'],
        dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Meeting Scheduled',
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        followUpStatus: 'pending',
        followUpNote: 'Prepare pitch deck presentation'
      }
    ];

    for (const p of prospects) DB.insert('prospects', p);

    // 2. Seed Clients for Guest
    const clients: Client[] = [
      {
        id: `clnt_gst1_${randSuffix}`,
        userId: targetUserId,
        businessName: 'Nexus E-Commerce',
        contactName: 'Alex Rivera',
        email: 'alex@nexusecom.com',
        phone: '+1 (555) 018-3322',
        servicePurchased: 'Headless Shopify Hydrogen Rebuild',
        contractValue: 18500,
        monthlyRetainer: 2500,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        renewalDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        paymentStatus: 'Paid',
        invoiceStatus: 'Sent',
        notes: 'Monthly retainer covering conversion optimization and fast UI updates.',
        priority: 'High',
        internalNotes: 'Client renewed 6-month extension.',
        status: 'Active',
        nextFollowUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        followUpStatus: 'pending',
        followUpNote: 'Check-in regarding monthly sprint achievements'
      }
    ];

    for (const c of clients) DB.insert('clients', c);

    // 3. Seed Tasks for Guest
    const tasks: Task[] = [
      {
        id: `tsk_gst1_${randSuffix}`,
        userId: targetUserId,
        clientId: `clnt_gst1_${randSuffix}`,
        title: 'Review Starlight Ventures Contract Draft',
        description: 'Verify legal indemnity clause before sending final DocuSign.',
        dueDate: new Date().toISOString(),
        priority: 'High',
        isCompleted: false,
        assignedTo: 'Guest Explorer'
      },
      {
        id: `tsk_gst2_${randSuffix}`,
        userId: targetUserId,
        clientId: `clnt_gst1_${randSuffix}`,
        title: 'Send Quarterly Roadmap to Nexus E-Commerce',
        description: 'Detailing Q3 conversion optimization goals.',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'Medium',
        isCompleted: false,
        assignedTo: 'Guest Explorer'
      }
    ];

    for (const t of tasks) DB.insert('tasks', t);

    // 4. Seed Notes for Guest
    const notes: Note[] = [
      {
        id: `note_gst1_${randSuffix}`,
        userId: targetUserId,
        prospectId: `prsp_gst1_${randSuffix}`,
        title: 'Sarah Jenkins Negotiation Brief',
        content: `### High-Priority Enterprise Opportunity
Sarah is very excited about the automated follow-up module in ProspectOS.
- **Budget**: $12k setup + $2.5k monthly retainer
- **Competitors**: Salesforce, HubSpot
- **Key Advantage**: Rapid pipeline tracking & native email sending`,
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const n of notes) DB.insert('notes', n);

  } catch (e) {
    console.error('Error seeding guest sample data:', e);
  }
}

export function ensureUserSeeded(userId: string) {
  if (userId) {
    seedSampleForUser(userId);
  }
}

