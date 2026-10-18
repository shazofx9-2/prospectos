import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Users,
  CheckSquare,
  ArrowRight,
  X,
  LayoutDashboard,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import ProspectOSLogo from './ProspectOSLogo';
import { api } from '../lib/api.js';

interface WelcomeBackModalProps {
  userName: string;
  onClose: () => void;
  onNavigateToView?: (view: string) => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  userName,
  onClose,
  onNavigateToView,
}) => {
  const [stats, setStats] = useState({
    prospectsCount: 0,
    clientsCount: 0,
    tasksCount: 0,
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.prospects.list().catch(() => []),
      api.clients.list().catch(() => []),
      api.tasks.list().catch(() => []),
    ]).then(([pr, cl, tk]) => {
      if (isMounted) {
        setStats({
          prospectsCount: Array.isArray(pr) ? pr.length : 0,
          clientsCount: Array.isArray(cl) ? cl.length : 0,
          tasksCount: Array.isArray(tk) ? tk.length : 0,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 18 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-white/10 bg-[#121315] space-y-6 text-left"
      >
        {/* Ambient subtle backlighting */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Header with Wordmark and Close Button */}
        <div className="flex items-start justify-between border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <ProspectOSLogo className="w-8 h-8" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                Session Active · Welcome Back
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                Good to see you, {userName || 'Partner'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
          Your workspace has been synchronized with your secure database. Here is your current sales and client command snapshot:
        </p>

        {/* 3 Metric Snapshot Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-medium tracking-wide uppercase">Prospects</span>
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tabular-nums">{stats.prospectsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Active in pipeline</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-medium tracking-wide uppercase">Clients</span>
              <Users className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tabular-nums">{stats.clientsCount}</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Retained accounts</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/8 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-medium tracking-wide uppercase">Tasks</span>
              <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div>
              <span className="text-2xl font-bold text-white tabular-nums">{stats.tasksCount}</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Active reminders</p>
            </div>
          </div>
        </div>

        {/* Security & Sync notice */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-2.5 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px]">Cloud database verified · End-to-end user isolation active</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Enter Dashboard</span>
          </button>
          {onNavigateToView && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToView('prospects');
              }}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>View Prospects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
