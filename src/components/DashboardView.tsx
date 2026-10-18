import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  TrendingUp,
  Award,
  Coins,
  Wallet,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Mail,
  Trash2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api.js';
import { AnalyticsPayload, Prospect, Client, Task, Reminder, Note } from '../types.js';
import { SendEmailModal } from './SendEmailModal.jsx';
import { AppleToast } from './AppleToast.jsx';
import { formatCurrency } from '../lib/currency.js';
import { computeAnalyticsFallback, getCurrentUserId, getUserStoredData, handleClientFallback } from '../lib/clientStorage.js';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<AnalyticsPayload | null>(() => {
    try {
      return computeAnalyticsFallback();
    } catch {}
    return null;
  });
  const [prospects, setProspects] = useState<Prospect[]>(() => {
    try {
      const uid = getCurrentUserId();
      return getUserStoredData<Prospect>('prospects', uid);
    } catch {}
    return [];
  });
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const uid = getCurrentUserId();
      return getUserStoredData<Client>('clients', uid);
    } catch {}
    return [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const uid = getCurrentUserId();
      return getUserStoredData<Task>('tasks', uid);
    } catch {}
    return [];
  });
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const uid = getCurrentUserId();
      return getUserStoredData<Reminder>('reminders', uid);
    } catch {}
    return [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const uid = getCurrentUserId();
      return getUserStoredData<Note>('notes', uid);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => !data);

  // Follow-Ups state
  const [followUps, setFollowUps] = useState<{ overdue: any[]; today: any[]; upcoming: any[]; totalCount: number }>(() => {
    try {
      return handleClientFallback('/api/follow-ups', 'GET', {});
    } catch {}
    return { overdue: [], today: [], upcoming: [], totalCount: 0 };
  });
  const [activeFollowUpTab, setActiveFollowUpTab] = useState<'overdue' | 'today' | 'upcoming'>('overdue');
  const [selectedFollowUp, setSelectedFollowUp] = useState<any | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadFollowUpsData = async () => {
    try {
      const fuData = await api.followUps.list();
      setFollowUps(fuData);
      // Auto switch active tab to today or upcoming if overdue is empty
      if (fuData.overdue.length === 0 && fuData.today.length > 0) {
        setActiveFollowUpTab('today');
      } else if (fuData.overdue.length === 0 && fuData.today.length === 0 && fuData.upcoming.length > 0) {
        setActiveFollowUpTab('upcoming');
      }
    } catch (e) {
      console.error('Error loading follow-ups:', e);
    }
  };

  const handleDismissFollowUp = async (type: 'prospect' | 'client', id: string) => {
    try {
      await api.followUps.dismiss(type, id);
      setToastMsg('Follow-up dismissed');
      loadFollowUpsData();
    } catch (e: any) {
      console.error(e);
      setToastMsg('Failed to dismiss follow-up');
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      if (!data) setLoading(true);
      try {
        const [analyticsRes, prospectsRes, clientsRes, tasksRes, remindersRes, notesRes, followUpsRes] = await Promise.allSettled([
          api.analytics.get(),
          api.prospects.list(),
          api.clients.list(),
          api.tasks.list(),
          api.reminders.list(),
          api.notes.list(),
          api.followUps.list()
        ]);

        const pr = prospectsRes.status === 'fulfilled' && Array.isArray(prospectsRes.value) ? prospectsRes.value : [];
        const cl = clientsRes.status === 'fulfilled' && Array.isArray(clientsRes.value) ? clientsRes.value : [];
        const tk = tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value) ? tasksRes.value : [];
        const rm = remindersRes.status === 'fulfilled' && Array.isArray(remindersRes.value) ? remindersRes.value : [];
        const nt = notesRes.status === 'fulfilled' && Array.isArray(notesRes.value) ? notesRes.value : [];
        const fu = followUpsRes.status === 'fulfilled' && followUpsRes.value ? followUpsRes.value : { overdue: [], today: [], upcoming: [], totalCount: 0 };

        setProspects(pr);
        setClients(cl);
        setTasks(tk);
        setReminders(rm);
        setNotes(nt);
        setFollowUps(fu);

        if (fu.overdue && fu.overdue.length === 0 && fu.today && fu.today.length > 0) {
          setActiveFollowUpTab('today');
        } else if (fu.overdue && fu.overdue.length === 0 && (!fu.today || fu.today.length === 0) && fu.upcoming && fu.upcoming.length > 0) {
          setActiveFollowUpTab('upcoming');
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value && analyticsRes.value.metrics) {
          setData(analyticsRes.value);
        } else {
          // Construct client-side fallback analytics
          const mrr = cl.reduce((acc, c) => acc + (c.monthlyRetainer || 0), 0);
          const upfront = cl.reduce((acc, c) => acc + (c.contractValue || 0), 0);
          setData({
            metrics: {
              totalProspects: pr.length,
              activeProspects: pr.filter((p) => !['Landed', 'Failed'].includes(p.status)).length,
              totalClients: cl.length,
              activeClients: cl.filter((c) => c.status === 'Active').length,
              landedDeals: pr.filter((p) => p.status === 'Landed').length,
              failedDeals: pr.filter((p) => p.status === 'Failed').length,
              pendingFollowups: rm.filter((r) => !r.isCompleted).length,
              mrr,
              totalUpfront: upfront,
              totalRevenueGenerated: upfront + mrr,
              totalContractValue: upfront,
              conversionRate: pr.length > 0 ? Number(((pr.filter((p) => p.status === 'Landed').length / pr.length) * 100).toFixed(1)) : 0,
              winRate: 0,
              retentionRate: 100
            },
            charts: {
              pipelineFunnel: [],
              topLeadSources: [],
              topIndustries: [],
              topCountries: [],
              monthlyProspectGrowth: [],
              monthlyRevenueTrend: [],
              wonVsLost: []
            }
          });
        }
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        {/* Loading Skeletons */}
        <div className="h-10 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 lg:col-span-2 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalProspects: 0,
    activeProspects: 0,
    totalClients: 0,
    activeClients: 0,
    landedDeals: 0,
    failedDeals: 0,
    pendingFollowups: 0,
    mrr: 0,
    totalUpfront: 0,
    totalRevenueGenerated: 0,
    totalContractValue: 0,
    conversionRate: 0,
    winRate: 0,
    retentionRate: 100
  };
  const charts = data?.charts || {
    pipelineFunnel: [],
    topLeadSources: [],
    topIndustries: [],
    topCountries: [],
    monthlyProspectGrowth: [],
    monthlyRevenueTrend: [],
    wonVsLost: []
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-8 p-6 max-w-7xl mx-auto"
      id="dashboard-view-root"
    >
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-light text-white tracking-normal">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1 font-light">
            Overview of your total revenue, upfront sales, monthly income, and deal success rates.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('prospects')}
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-semibold rounded-lg cursor-pointer transition-all"
            id="dash-add-prospect-btn"
          >
            + New Prospect
          </button>
          <button
            onClick={() => onNavigate('clients')}
            className="px-4 py-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-xs font-semibold rounded-lg text-white cursor-pointer transition-all"
            id="dash-view-clients-btn"
          >
            Manage Clients
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Generated (Upfront + Monthly) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel rounded-xl p-5 relative overflow-hidden border border-emerald-500/20"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Total Revenue Generated</p>
              <h3 className="text-2xl font-bold text-white mt-2">
                {formatCurrency(metrics.totalRevenueGenerated || (metrics.totalUpfront + metrics.mrr))}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>Upfront: <strong className="text-white">{formatCurrency(metrics.totalUpfront)}</strong></span>
            <span>•</span>
            <span>Monthly: <strong className="text-white">{formatCurrency(metrics.mrr)}/mo</strong></span>
          </div>
        </motion.div>

        {/* Monthly Recurring Income */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel rounded-xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Monthly Recurring Income</p>
              <h3 className="text-2xl font-bold text-white mt-2">{formatCurrency(metrics.mrr)} <span className="text-xs font-normal text-zinc-400">/mo</span></h3>
            </div>
            <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="text-white font-medium">{metrics.activeClients} Active clients</span>
            <span>paying monthly retainers</span>
          </div>
        </motion.div>

        {/* Upfront Sales & Projects */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel rounded-xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Upfront Sales &amp; Projects</p>
              <h3 className="text-2xl font-bold text-white mt-2">{formatCurrency(metrics.totalUpfront)}</h3>
            </div>
            <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
              <Wallet className="w-5 h-5 text-zinc-300" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="text-zinc-300 font-medium">{metrics.totalClients} Signed Clients</span>
            <span>total contract value</span>
          </div>
        </motion.div>

        {/* Deal Success Rate */}
        <motion.div
          whileHover={{ y: -2 }}
          className="glass-panel rounded-xl p-5 relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Deal Success Rate</p>
              <h3 className="text-2xl font-bold text-white mt-2">{metrics.winRate}%</h3>
            </div>
            <div className="p-2.5 bg-white/5 rounded-lg border border-white/5">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="text-green-400 font-medium">{metrics.landedDeals} Won</span>
            <span>vs {metrics.failedDeals} Lost deals</span>
          </div>
        </motion.div>
      </div>

      {/* Secondary Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-panel rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Total Leads &amp; Prospects</span>
            <span className="text-base font-bold text-white">{metrics.totalProspects}</span>
          </div>
          <Users className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="glass-panel rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Active Sales Talks</span>
            <span className="text-base font-bold text-emerald-400">{metrics.activeProspects}</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="glass-panel rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Client Retention Rate</span>
            <span className="text-base font-bold text-white">{metrics.retentionRate ?? 100}%</span>
          </div>
          <Award className="w-4 h-4 text-zinc-500" />
        </div>
        <div className="glass-panel rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Lead Conversion Rate</span>
            <span className="text-base font-bold text-blue-400">{metrics.conversionRate}%</span>
          </div>
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
      </div>

      {/* Follow-Ups Widget */}
      <div className="glass-panel rounded-xl p-5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 text-zinc-300 rounded-lg border border-white/10">
              <Clock className="w-5 h-5 text-zinc-300" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Follow-Ups</p>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                Follow-Up Assistant
                {followUps.totalCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-zinc-800 text-zinc-300 border border-white/10 rounded-full">
                    {followUps.totalCount} Pending
                  </span>
                )}
              </h3>
            </div>
          </div>

          {/* Group Tabs: Overdue | Due Today | Upcoming */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/10 text-xs font-medium relative">
            <button
              onClick={() => setActiveFollowUpTab('overdue')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                activeFollowUpTab === 'overdue'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeFollowUpTab === 'overdue' && (
                <motion.div
                  layoutId="activeFollowUpTabPill"
                  className="absolute inset-0 bg-zinc-800 border border-white/20 rounded-lg shadow"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                />
              )}
              <span className="relative z-10">Overdue</span>
              <span className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] ${followUps.overdue.length > 0 ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                {followUps.overdue.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFollowUpTab('today')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                activeFollowUpTab === 'today'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeFollowUpTab === 'today' && (
                <motion.div
                  layoutId="activeFollowUpTabPill"
                  className="absolute inset-0 bg-zinc-800 border border-white/20 rounded-lg shadow"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                />
              )}
              <span className="relative z-10">Due Today</span>
              <span className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] ${followUps.today.length > 0 ? 'bg-zinc-700 text-white font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                {followUps.today.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFollowUpTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors relative cursor-pointer ${
                activeFollowUpTab === 'upcoming'
                  ? 'text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeFollowUpTab === 'upcoming' && (
                <motion.div
                  layoutId="activeFollowUpTabPill"
                  className="absolute inset-0 bg-zinc-800 border border-white/20 rounded-lg shadow"
                  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                />
              )}
              <span className="relative z-10">Upcoming (7D)</span>
              <span className="relative z-10 px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-400">
                {followUps.upcoming.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content List */}
        {(() => {
          const currentList = followUps[activeFollowUpTab] || [];
          if (currentList.length === 0) {
            return (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center bg-zinc-950/40 rounded-xl border border-white/5">
                <div className="p-3 bg-white/5 text-zinc-400 rounded-full mb-2 border border-white/10">
                  <CheckCircle2 className="w-6 h-6 text-zinc-300" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">
                  No follow-ups due — you're all caught up!
                </p>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  {activeFollowUpTab === 'overdue' && 'No overdue follow-ups found.'}
                  {activeFollowUpTab === 'today' && 'No follow-ups scheduled for today.'}
                  {activeFollowUpTab === 'upcoming' && 'No upcoming follow-ups scheduled for the next 7 days.'}
                </p>
              </div>
            );
          }

          return (
            <div className="divide-y divide-white/5 bg-zinc-950/40 rounded-xl border border-white/5 overflow-hidden">
              {currentList.map((item: any) => (
                <div
                  key={`${item.relatedType}_${item.id}`}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg shrink-0 mt-0.5 border bg-zinc-800/80 text-zinc-300 border-white/10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{item.contactName}</span>
                        <span className="text-xs text-zinc-400 truncate">({item.businessName})</span>
                        <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded border bg-white/5 text-zinc-300 border-white/10">
                          {item.relatedType}
                        </span>
                      </div>

                      {item.followUpNote && (
                        <p className="text-xs text-zinc-300 italic mt-1 line-clamp-1 bg-white/5 px-2 py-0.5 rounded border border-white/10 inline-block">
                          Note: "{item.followUpNote}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Due: {item.nextFollowUpDate ? item.nextFollowUpDate.split('T')[0] : 'N/A'}</span>
                        <span>•</span>
                        <span>{item.email || 'No email specified'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setSelectedFollowUp(item);
                        setShowSendModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg shadow flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Review &amp; Send</span>
                    </button>
                    <button
                      onClick={() => handleDismissFollowUp(item.relatedType, item.id)}
                      title="Dismiss follow-up"
                      className="p-1.5 text-zinc-400 hover:text-rose-400 bg-zinc-900 border border-white/10 hover:border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={showSendModal}
        onClose={() => {
          setShowSendModal(false);
          setSelectedFollowUp(null);
        }}
        contact={selectedFollowUp}
        onSuccess={(msg) => {
          setToastMsg(msg);
          loadFollowUpsData();
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <AppleToast message={toastMsg} onClose={() => setToastMsg(null)} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Revenue Trend Area Chart */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Monthly Revenue Growth</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Includes upfront project fees plus ongoing monthly retainers generated each month</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-white inline-block" /> Total Earned</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  formatter={(val: any, name: any, item: any) => {
                    const row = item.payload;
                    return [
                      `${formatCurrency(Number(val))} (Upfront: ${formatCurrency(row.upfront || 0)} + Retainers: ${formatCurrency(row.retainers || 0)})`,
                      'Total Earned'
                    ];
                  }}
                />
                <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
