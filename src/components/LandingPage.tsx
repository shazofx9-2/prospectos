import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ProspectOSLogo from './ProspectOSLogo';
import {
  TrendingUp,
  Users,
  CheckSquare,
  BarChart3,
  Shield,
  Zap,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  Star,
  ArrowRight,
  Database,
  Search,
  Activity,
  Layers,
  Calendar,
  Lock,
  Building2,
  Sliders,
  UserPlus,
  HelpCircle,
  MessageSquare,
  Play,
  Flame,
  Globe,
  X,
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  Instagram,
  ExternalLink,
  Copy,
  FileText,
  ShieldCheck,
  Scale
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (isLoginMode?: boolean) => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'crm' | 'tasks' | 'emails' | 'analytics'>('tasks');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('prospectos.support@gmail.com');
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    {
      icon: RefreshCw,
      title: 'Auto-Syncing Tasks & Calendar',
      description: 'Synchronize deal follow-ups, client discovery calls, and task deadlines directly with your Google Calendar in real time.',
      badge: 'Google Calendar Sync',
    },
    {
      icon: Mail,
      title: 'Direct Follow-Up Emails',
      description: 'Dispatch personalized follow-up sequences via Gmail using custom smart templates and dynamic prospect tags with 1 click.',
      badge: 'Gmail Integration',
    },
    {
      icon: TrendingUp,
      title: 'Visual Deal Pipelines',
      description: 'Track leads across customizable stages from initial contact to proposal and signed contracts with full revenue forecasting.',
      badge: 'Sales Pipeline',
    },
    {
      icon: Users,
      title: 'Unified Client Directory',
      description: 'Manage active retainer contracts, client communications, project deliverables, and SLA renewals in one command hub.',
      badge: 'Client CRM',
    },
    {
      icon: CheckSquare,
      title: 'Automated Task Reminders',
      description: 'Set smart follow-up triggers and operational checklists so zero client commitments or outreach opportunities slip by.',
      badge: 'Workflow & Tasks',
    },
    {
      icon: BarChart3,
      title: 'Revenue & Growth Intelligence',
      description: 'Monitor monthly recurring revenue (MRR), deal win rates, and contract close velocity with clean, audit-ready reports.',
      badge: 'Sales Intelligence',
    },
    {
      icon: Calendar,
      title: 'Interactive Sales Schedule',
      description: 'Orchestrate client calls, onboarding deadlines, follow-up dates, and recurring contract renewals on an executive timeline.',
      badge: 'Timeline Calendar',
    },
    {
      icon: Search,
      title: 'Instant Command-K Search',
      description: 'Query any prospect lead, active retainer client, task item, or meeting briefing note instantly with Ctrl+K keyboard shortcut.',
      badge: 'Instant Search',
    }
  ];

  const faqs = [
    {
      question: 'What is ProspectOS and how does it help my business?',
      answer: 'ProspectOS is an executive sales workspace built for agencies, consultants, and B2B growth teams. It unifies prospective lead pipelines, active client retainers, Google Calendar synchronization, Gmail outreach, and revenue tracking into one secure application.'
    },
    {
      question: 'How do auto-syncing tasks and follow-up emails work?',
      answer: 'ProspectOS integrates natively with Google Calendar and Gmail. Tasks and scheduled calls created in ProspectOS automatically sync to your Google Calendar, and you can send personalized follow-up emails with templates directly from any client or prospect card.'
    },
    {
      question: 'Can I manage both potential leads and existing clients?',
      answer: 'Yes! You can track potential leads in your Prospects pipeline, and once a deal is won, easily convert it with 1 click to active client accounts, retainer agreements, and delivery tasks in the Clients CRM.'
    },
    {
      question: 'Can I customize email templates for different deal stages?',
      answer: 'Yes! You can save custom follow-up templates (e.g. Initial Outreach, Proposal Follow-Up, Meeting Recap) with dynamic variables like {contactName} and {businessName} for instant 1-click dispatch.'
    },
    {
      question: 'Is ProspectOS easy to use for teams?',
      answer: 'Absolutely. ProspectOS features a clean, responsive layout designed for rapid daily operations. You can search your workspace anytime using Ctrl+K and navigate smoothly between your deals, clients, tasks, and reports.'
    },
    {
      question: 'How do I get started?',
      answer: 'Click "Get Started Free" to create your account or explore the live interactive demo workspace right on this page.'
    }
  ];

  const testimonials = [
    {
      quote: 'ProspectOS completely transformed our agency pipeline. We closed 42% more deals in our first 30 days because no qualified lead ever fell through the cracks again.',
      author: 'Marcus Vance',
      role: 'Founder & CEO',
      company: 'Apex Digital Agency',
      rating: 5,
      metric: '+42% Closed Deals',
      timeframe: 'First 30 days',
      initials: 'MV'
    },
    {
      quote: 'ProspectOS gave us the exact framework we needed to scale our sales operations. Unifying prospect outreach, retainer billing, and Google Calendar follow-ups helped us scale from 12 to 65+ active clients without adding administrative overhead.',
      author: 'Elena Rostova',
      role: 'Head of Sales Operations',
      company: 'Vanguard Consulting',
      rating: 5,
      metric: '5x Client Retainers',
      timeframe: '6-Month Scale',
      initials: 'ER'
    },
    {
      quote: 'Before ProspectOS, managing our client pipeline across separate spreadsheets was chaotic. Now our team has complete visibility over every deal stage and task, allowing us to double our monthly recurring revenue with zero friction.',
      author: 'David Chen',
      role: 'Managing Director',
      company: 'Starlight Ventures',
      rating: 5,
      metric: '2.4x MRR Growth',
      timeframe: '90-Day Result',
      initials: 'DC'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f1011] text-[#f5f5f7] font-sans selection:bg-white/20 selection:text-white relative">
      {/* Background ambient subtle atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-gradient-to-b from-white/5 via-zinc-800/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-zinc-900/10 blur-[160px] pointer-events-none -z-10" />

      {/* TOP NAVIGATION BAR - STICKY FROSTED APPLE GLASS UI */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0f1011]/30 backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'bg-transparent backdrop-blur-sm border-b border-white/5'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <ProspectOSLogo className="w-8 h-8" showText textClassName="text-sm font-bold tracking-widest text-white uppercase font-mono" />

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-zinc-400">
            {[
              { id: 'features', label: 'Features' },
              { id: 'demo', label: 'Interactive Demo' },
              { id: 'testimonials', label: 'Testimonials' },
              { id: 'faqs', label: 'FAQs' }
            ].map((item) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => scrollToSection(e, item.id)}
                whileHover={{ y: -1, color: '#ffffff' }}
                whileTap={{ y: 1 }}
                className="hover:text-white transition-colors cursor-pointer relative py-1"
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth(true)}
              className="text-xs font-medium px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer font-sans"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth(false)}
              className="text-xs font-medium px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-sans"
            >
              Get Started Free
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Promo Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block mb-6"
        >
          <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-zinc-300 font-mono text-[11px] uppercase tracking-[0.18em]">
            PROSPECTOS SALES OS • AUTOMATED CALENDAR & GMAIL WORKSPACE
          </span>
        </motion.div>

        {/* Main Serif Display Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light tracking-normal text-white max-w-5xl mx-auto leading-[0.96]"
        >
          Organize your sales & win more clients with <span className="italic font-serif font-light text-zinc-200">effortless clarity.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-light leading-relaxed"
        >
          ProspectOS is a modern sales CRM built to help you organize leads, <strong className="text-white font-normal">auto-sync tasks with Google Calendar</strong>, and <strong className="text-white font-normal">dispatch follow-up emails via Gmail</strong> with ease.
        </motion.p>

        {/* CTA Button Stack */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => onOpenAuth(false)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-lg"
          >
            Create Your Free Account
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Live App Mockup Frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative mx-auto max-w-6xl rounded-2xl p-2 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 shadow-2xl backdrop-blur-xl"
        >
          <div className="bg-[#0f1011] rounded-xl overflow-hidden border border-white/10 p-4 sm:p-6 text-left">
            {/* Top Bar Window Mock */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="ml-4 text-xs font-mono text-zinc-500 hidden sm:inline">app.prospectos.com/pipeline</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded text-zinc-400 flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-zinc-400" /> Search Workspace (Ctrl+K)
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-zinc-400 font-mono">Live Workspace</span>
              </div>
            </div>

            {/* Simulated Live Dashboard Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Active Pipeline Value</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-extrabold text-white mt-2">$248,500</p>
                <span className="text-[10px] text-emerald-400 font-medium">↑ 18.4% this month</span>
              </div>
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Total Prospects</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-extrabold text-white mt-2">124 Leads</p>
                <span className="text-[10px] text-zinc-500 font-medium">32 Qualified Stage</span>
              </div>
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Closed Client ARR</span>
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-extrabold text-white mt-2">$94,200</p>
                <span className="text-[10px] text-amber-400 font-medium">18 Active Retainers</span>
              </div>
              <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Tasks Completed</span>
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-extrabold text-white mt-2">94% Rate</p>
                <span className="text-[10px] text-purple-400 font-medium">Zero Overdue Tasks</span>
              </div>
            </div>

            {/* Simulated Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/8 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pb-2 border-b border-white/8">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    New Leads (4)
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">$48,000</span>
                </div>
                <div className="p-3 rounded-lg bg-white/4 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>Acme Enterprise Corp</span>
                    <span className="text-emerald-400 font-mono">$22,000</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">SaaS Onboarding & Integration</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Contact: Sarah Jenkins</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">High Intent</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/4 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>Nexus Tech Labs</span>
                    <span className="text-emerald-400 font-mono">$14,500</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Retainer Proposal Submitted</p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/8 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pb-2 border-b border-white/8">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    In Negotiation (3)
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">$85,000</span>
                </div>
                <div className="p-3 rounded-lg bg-white/4 border border-amber-500/30 bg-amber-500/5 transition-all cursor-pointer">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>Apex Global Logistics</span>
                    <span className="text-emerald-400 font-mono">$45,000</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Contract Review in Final Stage</p>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-amber-400">Closing Expected Friday</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">Priority</span>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/8 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pb-2 border-b border-white/8">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Closed Won (5)
                  </span>
                  <span className="text-zinc-500 font-mono text-[10px]">$115,500</span>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/25 hover:border-white/50 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,255,255,0.04)]">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>Horizon Healthcare</span>
                    <span className="text-white font-mono font-semibold">$50,000</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Onboarded as Active Client</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-300">
                    <span>Signed Contract Verified</span>
                    <span className="text-white font-medium">✓ Synced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase block mb-3">ENGINEERED FOR GROWTH</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-normal leading-tight">
            Everything you need to close deals &amp; scale client accounts
          </h2>
          <p className="text-zinc-400 text-base mt-4 font-light max-w-xl mx-auto">
            Built from the ground up for modern B2B sales teams, agency owners, and client managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="p-7 sm:p-8 rounded-2xl bg-gradient-to-b from-[#18191d] to-[#121316] border border-white/15 hover:border-white/60 hover:shadow-[0_0_25px_rgba(255,255,255,0.08),0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-300 relative group flex flex-col justify-between overflow-hidden"
              >
                {/* Top specular subtle white rim light */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:via-white/70 transition-all duration-300" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:bg-white group-hover:text-black group-hover:border-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-300 shrink-0">
                      <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/15 text-zinc-300 group-hover:border-white/40 group-hover:text-white transition-all">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 leading-snug font-sans tracking-tight group-hover:text-white transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-zinc-400 font-normal leading-relaxed group-hover:text-zinc-300 transition-colors">
                    {feat.description}
                  </p>
                </div>

                {/* Subtle interactive footer detail */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 group-hover:text-white flex items-center gap-1.5 transition-colors">
                    <span>Built-in standard</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-white" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE FEATURE SHOWCASE / DEMO TABS */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-950/80 border border-white/10 relative overflow-hidden backdrop-blur-2xl">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Interactive Workspace</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Explore ProspectOS core capabilities
            </h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-white/8 pb-4">
            {[
              { id: 'tasks', label: 'Auto-Sync Tasks & Calendar', icon: RefreshCw },
              { id: 'emails', label: 'Send Follow-Up Emails', icon: Mail },
              { id: 'pipeline', label: 'Prospects CRM Pipeline', icon: TrendingUp },
              { id: 'crm', label: 'Clients Account Hub', icon: Users },
              { id: 'analytics', label: 'Sales Intelligence', icon: BarChart3 }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Content Display */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/8 min-h-[320px]">
            {activeTab === 'tasks' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/8">
                  <div>
                    <span className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-white animate-spin-slow" />
                      Google Calendar Auto-Sync Tasks Engine
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Tasks automatically schedule onto your linked Google Calendar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-mono flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Auto-Sync Active
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { task: 'Send revised SOW contract & proposal to Apex Solutions', priority: 'High', due: 'Today, 2:00 PM', syncStatus: 'Synced with Google Calendar' },
                    { task: 'Q3 Growth & Onboarding Call with Quantum Analytics', priority: 'Medium', due: 'Today, 4:30 PM', syncStatus: 'Synced with Google Calendar' },
                    { task: 'Follow up on deposit invoice #1084 with Vanguard Media', priority: 'High', due: 'Tomorrow, 9:00 AM', syncStatus: 'Synced with Google Calendar' }
                  ].map((t, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/3 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-zinc-200">{t.task}</span>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" /> {t.syncStatus}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-white/10 text-zinc-200 border border-white/15 font-medium">{t.priority}</span>
                        <span className="text-zinc-400 font-mono">{t.due}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'emails' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/8">
                  <div>
                    <span className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      Direct Gmail Follow-Up Dispatcher
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Send personalized follow-ups with templates directly to prospects & clients</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono">
                    Gmail Connected
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/8">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Recipient</span>
                      <p className="text-white font-medium mt-0.5">Sarah Jenkins &lt;sarah@acme.com&gt;</p>
                      <span className="text-[10px] text-blue-400">Prospect • Acme Enterprise Corp</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/8">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Template Selected</span>
                      <p className="text-emerald-400 font-medium mt-0.5">Proposal Review Follow-Up</p>
                      <span className="text-[10px] text-zinc-400">Auto-populates contact variables</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-white/8 font-mono text-xs text-zinc-300 leading-relaxed">
                    <p className="text-zinc-500 text-[10px] uppercase mb-1 font-sans">Subject: Following up on our growth proposal for Acme Enterprise Corp</p>
                    <p className="text-xs text-zinc-300">
                      Hi Sarah,
                      <br /><br />
                      I wanted to check in regarding the growth proposal we discussed on Tuesday for Acme Enterprise Corp. Let me know if you have any questions before our call tomorrow!
                      <br /><br />
                      Best regards,<br />
                      ProspectOS Sales Operations
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer">
                      <Send className="w-3.5 h-3.5" />
                      Send Follow-Up via Gmail
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pipeline' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-between items-center text-xs text-zinc-400 pb-2 border-b border-white/8">
                  <span className="font-semibold text-white">Visual Lead Qualification Stages</span>
                  <span className="text-white font-mono font-medium">Total Value: $310,000</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/3 border border-white/10 hover:border-white/30 transition-all">
                    <span className="text-xs font-bold text-zinc-300">1. Discovery Stage</span>
                    <p className="text-xs text-zinc-200 font-medium mt-2">Apex Solutions ($28k)</p>
                    <p className="text-[11px] text-zinc-500 mt-1">First demo call booked for Thursday</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/3 border border-white/15 hover:border-white/30 transition-all">
                    <span className="text-xs font-bold text-zinc-200">2. Proposal Sent</span>
                    <p className="text-xs text-zinc-200 font-medium mt-2">Global Zenith Inc ($65k)</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Reviewing pricing terms with VP</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/30 hover:border-white/60 transition-all shadow-[0_0_15px_rgba(255,255,255,0.04)]">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      3. Closed Won
                    </span>
                    <p className="text-xs text-white font-semibold mt-2">Hyperion Labs ($120k)</p>
                    <p className="text-[11px] text-zinc-400 mt-1">Contract signed &amp; onboarded</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'crm' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-between items-center text-xs text-zinc-400 pb-2 border-b border-white/8">
                  <span className="font-semibold text-white">Active Client Onboarding & Retainers</span>
                  <span className="text-blue-400 font-mono">18 Active Accounts</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Quantum Analytics', mrr: '$8,500/mo', status: 'Active Retainer', contact: 'Alex Rivera' },
                    { name: 'Vanguard Media Group', mrr: '$12,000/mo', status: 'Onboarding Phase', contact: 'Rachel Zhang' },
                    { name: 'Starlight Tech', mrr: '$5,000/mo', status: 'Renewal Pending', contact: 'Marcus Vance' }
                  ].map((client, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-white/3 border border-white/8 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white">{client.name}</h4>
                        <p className="text-[11px] text-zinc-400">Primary Contact: {client.contact}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">{client.mrr}</span>
                        <p className="text-[10px] text-zinc-500">{client.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-between items-center text-xs text-zinc-400 pb-2 border-b border-white/8">
                  <span className="font-semibold text-white">Sales Intelligence & Revenue Metrics</span>
                  <span className="text-amber-400 font-mono">Q3 Target: $500,000</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Avg Deal Velocity</span>
                    <p className="text-xl font-bold text-white mt-1">14 Days</p>
                    <span className="text-[10px] text-emerald-400">3 days faster than Q2</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Lead Win Rate</span>
                    <p className="text-xl font-bold text-white mt-1">38.2%</p>
                    <span className="text-[10px] text-emerald-400">↑ 4.1% MoM</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8 text-center">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Monthly Recurring</span>
                    <p className="text-xl font-bold text-white mt-1">$48,200</p>
                    <span className="text-[10px] text-zinc-400">100% On-time Payments</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase block mb-3">TRUSTED BY SALES LEADERS</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-normal leading-tight">
            Loved by founders, agencies, &amp; high-growth sales teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ y: -4 }}
              className="p-7 sm:p-8 rounded-2xl bg-gradient-to-b from-[#18191d] to-[#121316] border border-white/15 hover:border-white/60 hover:shadow-[0_0_25px_rgba(255,255,255,0.08),0_20px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between relative overflow-hidden transition-all duration-300 group"
            >
              {/* Top specular subtle white rim light */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:via-white/70 transition-all duration-300" />

              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/20 flex items-center justify-center font-bold text-xs text-white tracking-wider font-mono shadow-sm group-hover:border-white/50 group-hover:bg-white/15 transition-all">
                    {t.initials}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/15 group-hover:border-white/35 transition-colors">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                    Verified Client
                  </span>
                </div>

                <p className="text-sm sm:text-[14px] text-zinc-200 leading-relaxed font-normal mb-8">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white font-sans truncate">{t.author}</h4>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{t.role} · {t.company}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-white tabular-nums block font-mono px-2.5 py-1 rounded-lg bg-white/10 border border-white/20">
                    {t.metric}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1 font-mono">
                    {t.timeframe}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQS) */}
      <section id="faqs" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[11px] font-mono tracking-[0.2em] text-zinc-400 uppercase block mb-3">GOT QUESTIONS?</span>
          <h2 className="text-3xl sm:text-5xl font-serif font-light text-white tracking-normal">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#18191b] border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-white flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed border-t border-white/5 pt-4"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM CTA BANNER - SEAMLESS BLEND */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-light text-white tracking-normal leading-tight">
            Ready to organize your sales &amp; grow?
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-4 mb-10 font-light">
            Join business owners who use ProspectOS to manage potential leads, track active clients, and boost earnings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth(false)}
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenAuth(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-lg bg-transparent hover:bg-white/5 text-white font-medium text-sm border border-white/20 transition-all cursor-pointer"
            >
              Sign In to Workspace
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-zinc-500 font-sans">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <ProspectOSLogo className="w-6 h-6" showText textClassName="font-bold text-white uppercase tracking-wider font-mono" />
            <span>• Enterprise Sales Operating System</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-zinc-400 font-medium">
            <span className="flex items-center gap-2 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-white transition-colors cursor-pointer">Features</a>
            <a href="#faqs" onClick={(e) => scrollToSection(e, 'faqs')} className="hover:text-white transition-colors cursor-pointer">FAQs</a>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-white transition-colors cursor-pointer text-zinc-300"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="hover:text-white transition-colors cursor-pointer text-zinc-300"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="hover:text-white transition-colors cursor-pointer font-semibold text-zinc-300 flex items-center gap-1.5"
            >
              Contact Us
            </button>
            <a
              href="https://www.instagram.com/prospectos.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="Follow ProspectOS on Instagram"
              aria-label="Instagram"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Instagram className="w-4 h-4 text-zinc-300" />
              <span className="hidden sm:inline font-medium">@prospectos.app</span>
            </a>
            <button onClick={() => onOpenAuth(true)} className="hover:text-white transition-colors cursor-pointer">
              Sign In
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 border-t border-white/5 pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span>© {new Date().getFullYear()} ProspectOS Inc. All rights reserved.</span>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="hover:text-white transition-colors cursor-pointer text-zinc-400"
            >
              Privacy Policy
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="hover:text-white transition-colors cursor-pointer text-zinc-400"
            >
              Terms of Service
            </button>
          </div>
          <div className="flex items-center gap-6 text-zinc-400">
            <a
              href="mailto:prospectos.support@gmail.com"
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>prospectos.support@gmail.com</span>
            </a>
            <a
              href="https://www.instagram.com/prospectos.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-zinc-400"
            >
              <Instagram className="w-3.5 h-3.5 text-zinc-400" />
              <span>@prospectos.app</span>
            </a>
          </div>
        </div>
      </footer>

      {/* CONTACT US MODAL */}
      <AnimatePresence>
        {showContactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18191b] border border-white/15 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-light text-lg text-white">Contact Us</h3>
                    <p className="text-[11px] text-zinc-400">Get in touch with our team directly</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Minimal Clean Contact Links (No Boxes) */}
              <div className="space-y-4 pt-1">
                {/* Instagram Clean Link */}
                <a
                  href="https://www.instagram.com/prospectos.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors py-2 px-1 cursor-pointer group"
                >
                  <Instagram className="w-5 h-5 text-zinc-300 group-hover:text-white" />
                  <span className="text-sm font-medium">@prospectos.app</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-500 ml-auto group-hover:text-white transition-colors" />
                </a>

                {/* Email Display */}
                <div className="flex items-center justify-between py-2 px-1 text-zinc-300">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-zinc-300" />
                    <span className="text-sm font-medium">prospectos.support@gmail.com</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="text-xs font-mono px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-300 transition-colors cursor-pointer"
                  >
                    {copiedToast ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="text-center text-[11px] text-zinc-500 pt-2 border-t border-white/5">
                Our support team typically responds within 24 hours.
              </div>
            </motion.div>
          </div>
        )}

        {/* PRIVACY POLICY MODAL */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18191b] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-light text-xl text-white">Privacy Policy</h3>
                    <p className="text-xs text-zinc-400">Effective Date: August 1, 2026 • ProspectOS Inc.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">1. Overview & Commitment</h4>
                  <p>
                    At ProspectOS, accessible from app.prospectos.com, we prioritize your privacy. This Privacy Policy outlines the types of information we collect, how we use it, and the strict safeguards we enforce to keep your sales and account data protected.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">2. Information We Collect</h4>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
                    <li><strong className="text-zinc-200">Account Credentials:</strong> Email address, display name, and securely hashed passwords upon registration.</li>
                    <li><strong className="text-zinc-200">Workspace Data:</strong> Leads, deal stages, client contact cards, task checklists, revenue metrics, and custom follow-up email templates created within your account.</li>
                    <li><strong className="text-zinc-200">Google Workspace Data (OAuth):</strong> When you link Google Calendar or Gmail, we request scoped access strictly to sync tasks/events to your calendar and send requested email follow-ups on your behalf.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">3. How We Use Your Data</h4>
                  <p>
                    We process your information exclusively to operate and deliver ProspectOS core features:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1 mt-1">
                    <li>To organize your sales pipeline, tasks, and client records.</li>
                    <li>To sync user-created tasks directly to your connected Google Calendar.</li>
                    <li>To dispatch follow-up emails via Gmail when you click "Send Follow-Up".</li>
                    <li>To provide customer support and service updates.</li>
                  </ul>
                  <p className="mt-2 text-emerald-400 font-normal">
                    We DO NOT sell, rent, monetize, or share your personal or workspace data with advertisers or unauthorized third parties.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">4. Google API Limited Use Compliance</h4>
                  <p className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300">
                    ProspectOS’s use and transfer to any other app of information received from Google APIs will adhere to the <strong className="text-white">Google API Services User Data Policy</strong>, including the Limited Use requirements. Your Google credentials and tokens are encrypted at rest and never shared.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">5. Data Retention & Deletion</h4>
                  <p>
                    Your data is retained for as long as your account remains active. You can request complete deletion of your account, workspace data, and OAuth tokens at any time by contacting our support team at <strong className="text-white">prospectos.support@gmail.com</strong>.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">6. Contact Us</h4>
                  <p>
                    If you have questions or concerns regarding this Privacy Policy, please reach out to us at <a href="mailto:prospectos.support@gmail.com" className="text-blue-400 underline">prospectos.support@gmail.com</a>.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end shrink-0 bg-black/40">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-5 py-2 rounded-lg bg-white text-black font-medium text-xs hover:bg-zinc-200 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* TERMS OF SERVICE MODAL */}
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#18191b] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-light text-xl text-white">Terms of Service</h3>
                    <p className="text-xs text-zinc-400">Effective Date: August 1, 2026 • ProspectOS Inc.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">1. Acceptance of Terms</h4>
                  <p>
                    By creating an account, accessing, or using ProspectOS ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree with these Terms, you must not access or use the Service.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">2. Description of Service</h4>
                  <p>
                    ProspectOS provides a cloud-based sales workspace, pipeline management tool, client directory, task organization system, Google Calendar auto-synchronization, and Gmail follow-up email features for sales professionals and agency teams.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">3. User Responsibilities & Acceptable Use</h4>
                  <p>
                    You are solely responsible for maintaining the security of your account login information. You agree not to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1 mt-1">
                    <li>Use the Service to transmit unsolicited commercial emails (SPAM) or unauthorized bulk communications.</li>
                    <li>Attempt to reverse engineer, disrupt, or compromise the infrastructure of ProspectOS.</li>
                    <li>Violate any local, state, or international laws or regulations in connection with your sales activities.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">4. Third-Party Integrations</h4>
                  <p>
                    ProspectOS allows optional integration with third-party services, including Google Calendar and Gmail. Your use of such third-party services is subject to their respective terms and policies. ProspectOS is not responsible for outages or modifications made by third-party providers.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">5. Intellectual Property</h4>
                  <p>
                    ProspectOS, its logos, software code, user interface design, and trademarks are the exclusive property of ProspectOS Inc. You retain full ownership of all data, text, and media uploaded into your workspace.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">6. Limitation of Liability</h4>
                  <p>
                    ProspectOS is provided on an "AS IS" and "AS AVAILABLE" basis. To the maximum extent permitted by law, ProspectOS Inc. shall not be liable for any indirect, incidental, or consequential damages arising out of your use of or inability to use the Service.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">7. Modifications & Termination</h4>
                  <p>
                    We reserve the right to modify these Terms at any time. Continued use of the Service after updates constitutes acceptance of the modified Terms. We may suspend or terminate accounts that violate these Terms.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">8. Contact Information</h4>
                  <p>
                    For any questions regarding these Terms of Service, please contact us at <a href="mailto:prospectos.support@gmail.com" className="text-blue-400 underline">prospectos.support@gmail.com</a>.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end shrink-0 bg-black/40">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-5 py-2 rounded-lg bg-white text-black font-medium text-xs hover:bg-zinc-200 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
