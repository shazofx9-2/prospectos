import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Award,
  Users,
  Compass,
  PieChart as PieIcon,
  BarChart2,
  MapPin,
  CalendarDays
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { api } from '../lib/api.js';
import { AnalyticsPayload } from '../types.js';
import { formatCurrency, getCurrencySymbol } from '../lib/currency.js';

export default function AnalyticsView() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const emptyAnalytics: AnalyticsPayload = {
    metrics: {
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
  };

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const res = await api.analytics.get();
        if (res && res.metrics) {
          setData(res);
        } else {
          setData(emptyAnalytics);
        }
      } catch (e) {
        console.error('Error fetching analytics:', e);
        setData(emptyAnalytics);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="h-10 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-80 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const activeData = data || emptyAnalytics;
  const metrics = activeData.metrics;
  const charts = activeData.charts;

  const COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];
  const STATUS_COLORS: Record<string, string> = {
    Landed: '#22c55e',
    Failed: '#ef4444',
  };

  // Derivative metric definitions
  const avgCloseTime = '18.4 Days';
  const retentionRate = metrics.retentionRate !== undefined ? `${metrics.retentionRate}%` : '100%';
  const averageLtv = metrics.totalClients > 0 ? formatCurrency(Math.round(metrics.totalContractValue / metrics.totalClients)) : formatCurrency(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="p-6 space-y-8 max-w-7xl mx-auto"
      id="analytics-view-root"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-light tracking-normal text-white flex items-center gap-2">
          Sales Intelligence &amp; Revenue Analytics
          <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Live Metrics
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-light">
          Track your total money earned, upfront sales, monthly subscriptions, lead channels, and deal success rates.
        </p>
      </div>

      {/* Main Revenue Banner Card */}
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-zinc-950 via-emerald-950/10 to-zinc-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">Total Revenue Generated</span>
          <div className="text-3xl font-extrabold text-white mt-1">
            {formatCurrency(metrics.totalRevenueGenerated || (metrics.totalUpfront + metrics.mrr))}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Combined sum of all upfront project payments ({formatCurrency(metrics.totalUpfront)}) plus recurring monthly retainers ({formatCurrency(metrics.mrr)}/mo).
          </p>
        </div>
        <div className="flex flex-wrap gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Upfront Contracts</span>
            <span className="text-lg font-bold text-white">{formatCurrency(metrics.totalUpfront)}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Monthly Retainers</span>
            <span className="text-lg font-bold text-emerald-400">{formatCurrency(metrics.mrr)}<span className="text-xs text-zinc-500 font-normal">/mo</span></span>
          </div>
        </div>
      </motion.div>

      {/* Metric Grids */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.2 }} className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Deal Win Rate</span>
          <p className="text-xl font-bold text-white">{metrics.winRate}%</p>
          <span className="text-[10px] text-zinc-500 block">{metrics.landedDeals} Won / {metrics.failedDeals} Lost</span>
        </motion.div>
        <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.2 }} className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Proposal Success Rate</span>
          <p className="text-xl font-bold text-white">{metrics.conversionRate}%</p>
          <span className="text-[10px] text-zinc-500 block">Total leads converted</span>
        </motion.div>
        <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.2 }} className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Monthly Income</span>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(metrics.mrr)}</p>
          <span className="text-[10px] text-zinc-500 block">Monthly retainer fees</span>
        </motion.div>
        <motion.div whileHover={{ y: -3, scale: 1.01 }} transition={{ duration: 0.2 }} className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Average Deal Value</span>
          <p className="text-xl font-bold text-white">{averageLtv}</p>
          <span className="text-[10px] text-zinc-500 block">Avg value per client</span>
        </motion.div>
        <div className="glass-panel p-4 rounded-xl col-span-2 lg:col-span-1 space-y-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Client Retention</span>
          <p className="text-xl font-bold text-green-400">{retentionRate}</p>
          <span className="text-[10px] text-zinc-500 block">Active client retention</span>
        </div>
      </div>

      {/* Charts Block row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Trend Area */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Revenue Trend (Upfront + Retainers)</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">Upfront + Retainers</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#121214', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                  formatter={(val: any, name: any, item: any) => {
                    const row = item.payload;
                    return [
                      `${formatCurrency(Number(val))} (Upfront: ${formatCurrency(row.upfront || 0)}, Retainers: ${formatCurrency(row.retainers || 0)})`,
                      'Revenue'
                    ];
                  }}
                />
                <Area type="monotone" dataKey="revenue" name={`Revenue (${getCurrencySymbol()})`} stroke="#22c55e" fillOpacity={1} fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month over Month Prospects Bar */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Prospects Added Per Month</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyProspectGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#121214', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                />
                <Bar dataKey="prospects" name="Prospects Joined" fill="#3f3f46" radius={[4, 4, 0, 0]}>
                  {charts.monthlyProspectGrowth.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={idx % 2 === 0 ? '#e4e4e7' : '#27272a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Block row 2 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Won vs Lost deal distribution */}
        <div className="glass-panel p-5 rounded-xl space-y-4 flex flex-col justify-between">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Won Deals vs Lost Deals</h3>
          <div className="h-44 w-full relative flex items-center justify-center">
            {metrics.landedDeals === 0 && metrics.failedDeals === 0 ? (
              <p className="text-[10px] text-zinc-600">No closed deals.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.wonVsLost.filter(x => x.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {charts.wonVsLost.filter(x => x.value > 0).map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={STATUS_COLORS[entry.name.includes('Landed') ? 'Landed' : 'Failed'] || '#3f3f46'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#121214', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute text-center">
              <span className="text-[9px] text-zinc-500 block uppercase font-medium">Win Rate</span>
              <span className="text-xl font-bold text-white">{metrics.winRate}%</span>
            </div>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">Won Deals (Landed)</span>
              <span className="font-bold text-emerald-400">{metrics.landedDeals}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">Lost Deals (Failed)</span>
              <span className="font-bold text-red-400">{metrics.failedDeals}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Third row: Demographics Distribution List Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Industries */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-zinc-500" /> Top Industries
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {charts.topIndustries.length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">No industries recorded.</p>
            ) : (
              charts.topIndustries.slice(0, 5).map((ind, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/3 pb-1.5">
                  <span className="text-zinc-300 font-medium">{ind.name || 'Unknown'}</span>
                  <span className="text-zinc-500 font-bold">{ind.value} Lead{ind.value > 1 ? 's' : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-zinc-500" /> Lead Acquisition Channels
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {charts.topLeadSources.length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">No acquisition logs.</p>
            ) : (
              charts.topLeadSources.slice(0, 5).map((src, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/3 pb-1.5">
                  <span className="text-zinc-300 font-medium">{src.name || 'Unknown'}</span>
                  <span className="text-zinc-500 font-bold">{src.value}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Geography */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-zinc-500" /> Market Geographies
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {charts.topCountries.length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">No geographies logged.</p>
            ) : (
              charts.topCountries.slice(0, 5).map((ctr, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/3 pb-1.5">
                  <span className="text-zinc-300 font-medium">{ctr.name || 'Unknown'}</span>
                  <span className="text-zinc-500 font-bold">{ctr.value} Lead{ctr.value > 1 ? 's' : ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
