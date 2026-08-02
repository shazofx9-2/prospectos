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
  Copy
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (isLoginMode?: boolean) => void;
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'crm' | 'tasks' | 'emails' | 'analytics'>('tasks');
  const [showContactModal, setShowContactModal] = useState(false);
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
      description: 'Automatically sync deal follow-ups, client meetings, and task deadlines directly with your Google Calendar in real-time.',
      badge: 'Google Calendar Sync',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'from-emerald-500/10 to-transparent'
    },
    {
      icon: Mail,
      title: 'Direct Follow-Up Emails',
      description: 'Dispatch personalized follow-up emails via Gmail using custom smart templates and client variable tags with 1 click.',
      badge: 'Gmail Integration',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      glow: 'from-blue-500/10 to-transparent'
    },
    {
      icon: TrendingUp,
      title: 'Drag-and-Drop Pipelines',
      description: 'Easily move leads through clear sales stages so you always know which contracts are ready to close.',
      badge: 'Sales Pipeline',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'from-purple-500/10 to-transparent'
    },
    {
      icon: Users,
      title: 'Simple Client Directory',
      description: 'Keep all client details, contact info, meeting notes, and deal values neatly organized in one clean view.',
      badge: 'Client Hub',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'from-amber-500/10 to-transparent'
    },
    {
      icon: CheckSquare,
      title: 'Automated Task Reminders',
      description: 'Set follow-up reminders and task checklists so no client email or meeting gets missed.',
      badge: 'Productivity',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'from-purple-500/10 to-transparent'
    },
    {
      icon: BarChart3,
      title: 'Clear Revenue Reports',
      description: 'Track your monthly revenue, deal win rates, and overall business growth with clean visual charts.',
      badge: 'Analytics',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glow: 'from-rose-500/10 to-transparent'
    },
    {
      icon: Calendar,
      title: 'Personalized Sales Schedule',
      description: 'Plan client calls, follow-ups, contract renewals, and key deadlines with an interactive calendar.',
      badge: 'Calendar',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      glow: 'from-indigo-500/10 to-transparent'
    },
    {
      icon: Search,
      title: 'Instant Workspace Search',
      description: 'Quickly find any prospect, active client, task item, or meeting note across your entire workspace.',
      badge: 'Quick Search',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'from-cyan-500/10 to-transparent'
    }
  ];

  const faqs = [
    {
      question: 'What is ProspectOS and how does it help my business?',
      answer: 'ProspectOS is a simple sales workspace that helps you manage potential clients, organize daily tasks, auto-sync tasks with Google Calendar, send follow-up emails via Gmail, track active deals, and view your revenue progress — all in one easy-to-use app.'
    },
    {
      question: 'How do auto-syncing tasks and follow-up emails work?',
      answer: 'ProspectOS integrates natively with Google Calendar and Gmail. Tasks and scheduled calls created in ProspectOS automatically sync to your Google Calendar, and you can send personalized follow-up emails with templates directly from any client or prospect card.'
    },
    {
      question: 'Can I manage both potential leads and existing clients?',
      answer: 'Yes! You can track potential leads in your Prospects pipeline, and once a deal is won, easily manage active client accounts and notes in the Clients section.'
    },
    {
      question: 'Can I customize email templates for different deal stages?',
      answer: 'Yes! You can save custom follow-up templates (e.g. Initial Outreach, Proposal Follow-Up, Meeting Recap) with dynamic variables like {contactName} and {businessName} for instant 1-click dispatch.'
    },
    {
      question: 'Is ProspectOS easy to use for beginners?',
      answer: 'Absolutely! ProspectOS features a clean, intuitive layout designed for everyone. You can search your workspace anytime using Ctrl+K and navigate smoothly between your deals, clients, tasks, and reports.'
    },
    {
      question: 'How do I get started?',
      answer: 'Click "Get Started Free" to create your account using your email and password, or explore the live interactive workspace preview right on this page.'
    }
  ];

  const testimonials = [
    {
      quote: 'ProspectOS transformed our agency pipeline. We closed 42% more deals in our first month because no lead ever fell through the cracks again.',
      author: 'Marcus Vance',
      role: 'Founder & CEO',
      company: 'Digital Marketing Agency',
      rating: 5,
      metric: '+42% Deal Closure'
    },
    {
      quote: 'ProspectOS gave us the exact framework we needed to scale our sales operations. By unifying lead qualification, active client retainers, and follow-ups in one workspace, we scaled from 12 to 65+ active clients without adding administrative overhead.',
      author: 'Elena Rostova',
      role: 'Head of Sales Operations',
      company: 'B2B SaaS & Tech Consulting',
      rating: 5,
      metric: '5x Scale in 6 Months'
    },
    {
      quote: 'Before ProspectOS, managing our client pipeline across separate spreadsheets was chaotic. Now our team has complete visibility over every deal stage and task, allowing us to double our monthly recurring revenue while reducing lead response time.',
      author: 'David Chen',
      role: 'Managing Director',
      company: 'Corporate Advisory & Growth Agency',
      rating: 5,
      metric: '2x MRR Growth'
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
          ? 'bg-[#0f1011]/60 backdrop-blur-2xl backdrop-saturate-180 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          : 'bg-[#0f1011]/20 backdrop-blur-md border-b border-white/5'
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
                <div className="p-3 rounded-lg bg-white/4 border border-emerald-500/30 bg-emerald-500/5 transition-all cursor-pointer">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>Horizon Healthcare</span>
                    <span className="text-emerald-400 font-mono">$50,000</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Onboarded as Active Client</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-emerald-400">
                    <span>Signed Contract Verified</span>
                    <span>✓ Synced</span>
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
            // Chromatic background tints matching Origin Financial feature category cards
            const cardBgClasses = [
              'bg-[#1a1b24] border-white/10 hover:border-[#847dff]/40',
              'bg-[#111d24] border-white/10 hover:border-[#00b3dd]/40',
              'bg-[#1c1824] border-white/10 hover:border-[#dd90d8]/40',
              'bg-[#151a24] border-white/10 hover:border-[#90b8f0]/40',
              'bg-[#2e2e2e]/80 border-white/10 hover:border-white/30',
              'bg-[#1a1b24] border-white/10 hover:border-[#847dff]/40',
              'bg-[#111d24] border-white/10 hover:border-[#00b3dd]/40',
              'bg-[#1c1824] border-white/10 hover:border-[#dd90d8]/40',
            ][idx % 8];

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className={`p-7 sm:p-8 rounded-[28px] border transition-all relative group flex flex-col justify-between ${cardBgClasses}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/10 text-zinc-300 font-medium uppercase tracking-widest border border-white/10">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-light text-white mb-2 leading-snug">{feat.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">{feat.description}</p>
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
                      <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                      Google Calendar Auto-Sync Tasks Engine
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Tasks automatically schedule onto your linked Google Calendar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-Sync Active
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {[
                    { task: 'Send revised SOW contract & proposal to Apex Solutions', priority: 'High', due: 'Today, 2:00 PM', syncStatus: 'Synced with Google Calendar' },
                    { task: 'Q3 Growth & Onboarding Call with Quantum Analytics', priority: 'Medium', due: 'Today, 4:30 PM', syncStatus: 'Synced with Google Calendar' },
                    { task: 'Follow up on deposit invoice #1084 with Vanguard Media', priority: 'High', due: 'Tomorrow, 9:00 AM', syncStatus: 'Synced with Google Calendar' }
                  ].map((t, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white/3 border border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-zinc-200">{t.task}</span>
                          <p className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {t.syncStatus}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">{t.priority}</span>
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
                  <span className="text-emerald-400 font-mono">Total Value: $310,000</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                    <span className="text-xs font-bold text-blue-400">1. Discovery Stage</span>
                    <p className="text-xs text-zinc-300 font-medium mt-2">Apex Solutions ($28k)</p>
                    <p className="text-[11px] text-zinc-500 mt-1">First demo call booked for Thursday</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/3 border border-amber-500/20">
                    <span className="text-xs font-bold text-amber-400">2. Proposal Sent</span>
                    <p className="text-xs text-zinc-300 font-medium mt-2">Global Zenith Inc ($65k)</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Reviewing pricing terms with VP</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/3 border border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-400">3. Closed Won</span>
                    <p className="text-xs text-zinc-300 font-medium mt-2">Hyperion Labs ($120k)</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Contract signed & onboarded</p>
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
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 rounded-[28px] bg-[#2e2e2e]/60 border border-white/10 flex flex-col justify-between relative"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-5 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-base text-zinc-200 leading-relaxed font-serif italic font-light mb-8">"{t.quote}"</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white font-sans">{t.author}</h4>
                  <p className="text-[11px] text-zinc-400">{t.role} • {t.company}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-medium bg-white/10 text-emerald-400 border border-white/10">
                  {t.metric}
                </span>
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
          <div>
            © {new Date().getFullYear()} ProspectOS Inc. All rights reserved.
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

                {/* Email Clean Link */}
                <div className="flex items-center justify-between py-2 px-1 text-zinc-300">
                  <a
                    href="mailto:prospectos.support@gmail.com"
                    className="flex items-center gap-3 hover:text-white transition-colors cursor-pointer group"
                  >
                    <Mail className="w-5 h-5 text-zinc-300 group-hover:text-white" />
                    <span className="text-sm font-medium">prospectos.support@gmail.com</span>
                  </a>
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
      </AnimatePresence>
    </div>
  );
}
