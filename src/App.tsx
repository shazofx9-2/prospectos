import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Search,
  LogOut,
  User,
  X,
  Sparkles,
  ChevronRight,
  Menu
} from 'lucide-react';

import { getToken, removeToken, setToken, api } from './lib/api.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import LandingPage from './components/LandingPage.jsx';
import AuthPage from './components/AuthPage.jsx';
import DashboardView from './components/DashboardView.jsx';
import ProspectsView from './components/ProspectsView.jsx';
import ClientsView from './components/ClientsView.jsx';
import TasksView from './components/TasksView.jsx';
import CalendarView from './components/CalendarView.jsx';
import AnalyticsView from './components/AnalyticsView.jsx';
import SettingsView from './components/SettingsView.jsx';
import { WelcomeModal } from './components/WelcomeModal.js';
import ProspectOSLogo from './components/ProspectOSLogo';

import { Prospect, Client, Task, Note } from './types.js';

type ViewName =
  | 'dashboard'
  | 'prospects'
  | 'clients'
  | 'tasks'
  | 'calendar'
  | 'analytics'
  | 'settings';

export default function App() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewName>('dashboard');
  const [unauthView, setUnauthView] = useState<'landing' | 'login' | 'register'>('landing');

  // Command-K Search Overlay
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchProspects, setSearchProspects] = useState<Prospect[]>([]);
  const [searchClients, setSearchClients] = useState<Client[]>([]);
  const [searchTasks, setSearchTasks] = useState<Task[]>([]);
  const [searchNotes, setSearchNotes] = useState<Note[]>([]);

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logout confirmation modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Welcome onboarding modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const isWelcomed = localStorage.getItem(`prospectos_welcomed_${currentUser.id}`);
      if (!isWelcomed) {
        setShowWelcomeModal(true);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const savedToken = getToken();
    if (savedToken && savedToken.startsWith('fb_guest_')) {
      const gId = savedToken.replace('fb_', '');
      setCurrentUser({
        id: gId,
        email: 'guest@prospectos.com',
        name: 'Guest Explorer'
      });
      setTokenState(savedToken);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        const u = {
          id: user.uid,
          email: user.email || '',
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'User')
        };
        setCurrentUser(u);
        setTokenState(`fb_${user.uid}`);
        setToken(`fb_${user.uid}`);
        loadCurrentUser();
      } else {
        const currentTkn = getToken();
        if (currentTkn && currentTkn.startsWith('fb_guest_')) {
          // preserve guest session
        } else {
          removeToken();
          setTokenState(null);
          setCurrentUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Bind Command-K global key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Run Command-K search queries across tables
  useEffect(() => {
    if (!showSearch || !searchQuery) {
      setSearchProspects([]);
      setSearchClients([]);
      setSearchTasks([]);
      setSearchNotes([]);
      return;
    }

    const q = searchQuery.toLowerCase();

    const runSearch = async () => {
      try {
        const [pr, cl, tk, nt] = await Promise.all([
          api.prospects.list(),
          api.clients.list(),
          api.tasks.list(),
          api.notes.list()
        ]);

        setSearchProspects(pr.filter((x) => x.businessName.toLowerCase().includes(q) || (x.ownerName || '').toLowerCase().includes(q)));
        setSearchClients(cl.filter((x) => x.businessName.toLowerCase().includes(q) || (x.contactName || '').toLowerCase().includes(q)));
        setSearchTasks(tk.filter((x) => x.title.toLowerCase().includes(q)));
        setSearchNotes(nt.filter((x) => x.title.toLowerCase().includes(q) || x.content.toLowerCase().includes(q)));
      } catch (err) {
        console.error('Workspace command query error:', err);
      }
    };

    const timer = setTimeout(runSearch, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch]);

  useEffect(() => {
    document.documentElement.classList.remove('light-theme');
    document.documentElement.classList.add('dark');
  }, [currentUser]);

  const loadCurrentUser = async () => {
    try {
      const res = await api.auth.me();
      if (res?.user) {
        setCurrentUser(res.user);
        const u = res.user as any;
        if (u.theme) localStorage.setItem('prospectos_theme', u.theme);
        if (u.currency) localStorage.setItem('prospectos_currency', u.currency);
      }
    } catch (e) {
      if (auth.currentUser) {
        setCurrentUser((prev: any) => ({
          ...prev,
          id: auth.currentUser!.uid,
          email: auth.currentUser!.email || '',
          name: auth.currentUser!.displayName || (auth.currentUser!.email ? auth.currentUser!.email.split('@')[0] : 'User')
        }));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    removeToken();
    setTokenState(null);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setUnauthView('login');
  };

  // Rendering switch for dynamic viewport
  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={(v) => setCurrentView(v as ViewName)} />;
      case 'prospects':
        return <ProspectsView />;
      case 'clients':
        return <ClientsView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView currentUser={currentUser} onUserUpdate={loadCurrentUser} onUserLogout={handleLogout} />;
      default:
        return <DashboardView onNavigate={(v) => setCurrentView(v as ViewName)} />;
    }
  };

  const handleGuestLogin = () => {
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
    const guestUser = {
      id: guestId,
      email: 'guest@prospectos.com',
      name: 'Guest Explorer'
    };
    const tkn = `fb_${guestId}`;
    setToken(tkn);
    setTokenState(tkn);
    setCurrentUser(guestUser);
  };

  if (!token) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onOpenAuth={(isLoginMode = true) => setUnauthView(isLoginMode ? 'login' : 'register')}
        />
      );
    }
    return (
      <AuthPage
        initialIsLogin={unauthView === 'login'}
        onAuthSuccess={(user?: any) => {
          const currentTkn = getToken();
          setTokenState(currentTkn);
          if (user) {
            setCurrentUser(user);
          } else if (currentTkn && currentTkn.startsWith('fb_guest_')) {
            setCurrentUser({
              id: currentTkn.replace('fb_', ''),
              email: 'guest@prospectos.com',
              name: 'Guest Explorer'
            });
          }
        }}
        onBackToLanding={() => setUnauthView('landing')}
      />
    );
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Prospects CRM', icon: TrendingUp, view: 'prospects' },
    { name: 'Clients CRM', icon: Users, view: 'clients' },
    { name: 'Task Tracker', icon: CheckSquare, view: 'tasks' },
    { name: 'Timeline Calendar', icon: Calendar, view: 'calendar' },
    { name: 'Sales Intelligence', icon: BarChart3, view: 'analytics' },
    { name: 'Workspace Settings', icon: Settings, view: 'settings' }
  ] as const;

  return (
    <div className="min-h-screen bg-[#0f1011] flex text-zinc-300 font-sans antialiased" id="prospectos-app-root">
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#121315] border-r border-white/10 shrink-0 relative p-5 justify-between">
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between">
            <ProspectOSLogo className="w-6 h-6" showText textClassName="text-xs font-bold text-white uppercase tracking-widest font-mono" />
          </div>

          {/* Quick-Search Bar Trigger */}
          <button
            onClick={() => {
              setSearchQuery('');
              setShowSearch(true);
            }}
            className="w-full py-2 px-3.5 bg-white/3 border border-white/8 hover:border-white/15 rounded-lg flex items-center justify-between text-[10px] text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-500" />
              Search workspace...
            </span>
            <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[8px] font-mono shrink-0 text-zinc-500">
              Ctrl+K
            </span>
          </button>

          {/* Navigation link stacks */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentView === item.view;

              return (
                <button
                  key={item.view}
                  onClick={() => {
                    setCurrentView(item.view);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-colors cursor-pointer relative ${
                    isSelected
                      ? 'text-black font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-white/3'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="desktopActiveTabPill"
                      className="absolute inset-0 bg-white rounded-xl shadow-md"
                      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                    />
                  )}
                  <Icon className="w-4 h-4 shrink-0 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Identity Footer */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              {currentUser?.id?.startsWith('guest_') || currentUser?.email === 'guest@prospectos.com' ? (
                <Sparkles className="w-4 h-4 text-zinc-300" />
              ) : (
                <User className="w-4 h-4 text-zinc-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Workspace Principal'}
                </p>
                {(currentUser?.id?.startsWith('guest_') || currentUser?.email === 'guest@prospectos.com') && (
                  <span className="px-1.5 py-0.2 bg-zinc-800 text-zinc-300 border border-white/10 text-[9px] font-semibold rounded shrink-0">
                    Guest
                  </span>
                )}
              </div>
              {(currentUser?.id?.startsWith('guest_') || currentUser?.email === 'guest@prospectos.com') && (
                <p className="text-[10px] text-zinc-500 truncate">Demo Access Mode</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-2 bg-zinc-900 border border-white/5 hover:border-white/10 hover:bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center gap-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {currentUser?.id?.startsWith('guest_') || currentUser?.email === 'guest@prospectos.com' ? 'Exit Guest Mode' : 'Log Out'}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="lg:hidden h-14 bg-[#121315] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
          <ProspectOSLogo className="w-5 h-5" showText textClassName="text-xs font-bold text-white uppercase tracking-widest font-mono" />
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* DYNAMIC VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto bg-[#0f1011] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 16, scale: 0.985, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, scale: 0.985, filter: 'blur(10px)' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="w-full min-h-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-zinc-950 border-l border-white/8 p-5 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs font-black text-white tracking-widest uppercase">Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/5 text-zinc-400 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isSelected = currentView === item.view;

                    return (
                      <button
                        key={item.view}
                        onClick={() => {
                          setCurrentView(item.view);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/3'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {currentUser?.name || 'Demo Principal'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full py-2 bg-zinc-900 border border-white/5 text-zinc-300 font-bold text-[10px] flex items-center justify-center gap-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMAND-K SEARCH MODAL */}
      <AnimatePresence>
        {showSearch && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24">
            <div className="absolute inset-0" onClick={() => setShowSearch(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[70vh] text-xs"
              id="command-k-panel"
            >
              {/* Search bar header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/8">
                <Search className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Query prospects, clients, tasks, or briefing notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder-zinc-500"
                />
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-1 hover:bg-white/5 text-zinc-500 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search results body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {!searchQuery ? (
                  <div className="py-12 text-center flex flex-col items-center text-zinc-500">
                    <Search className="w-7 h-7 text-zinc-600 mb-2" />
                    <p className="font-semibold text-zinc-400">ProspectOS Workspace Search</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Begin typing to search company names, contacts, briefings, and checklist items.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Prospects Section */}
                    {searchProspects.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block px-2">Prospect Leads</span>
                        <div className="space-y-1">
                          {searchProspects.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setCurrentView('prospects');
                                setShowSearch(false);
                              }}
                              className="p-2.5 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <h4 className="font-semibold text-white">{p.businessName}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{p.ownerName} • {p.industry}</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clients Section */}
                    {searchClients.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block px-2">Retained Clients</span>
                        <div className="space-y-1">
                          {searchClients.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setCurrentView('clients');
                                setShowSearch(false);
                              }}
                              className="p-2.5 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <h4 className="font-semibold text-white">{c.businessName}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5">{c.contactName} • ${c.monthlyRetainer.toLocaleString()}/mo</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks Section */}
                    {searchTasks.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block px-2">Tasks &amp; Checklist Steps</span>
                        <div className="space-y-1">
                          {searchTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => {
                                setCurrentView('tasks');
                                setShowSearch(false);
                              }}
                              className="p-2.5 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <h4 className="font-semibold text-white">{t.title}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5">Due {t.dueDate} • {t.priority} Priority</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Section */}
                    {searchNotes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block px-2">Briefing Notes</span>
                        <div className="space-y-1">
                          {searchNotes.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setCurrentView('notes');
                                setShowSearch(false);
                              }}
                              className="p-2.5 hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <h4 className="font-semibold text-white">{n.title}</h4>
                                <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{n.content}</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No matches */}
                    {searchProspects.length === 0 &&
                      searchClients.length === 0 &&
                      searchTasks.length === 0 &&
                      searchNotes.length === 0 && (
                        <div className="py-12 text-center text-zinc-500 italic">
                          No matching workspace entities found for &quot;{searchQuery}&quot;
                        </div>
                      )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={() => setShowLogoutConfirm(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl relative space-y-5 border border-white/10 z-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Log Out</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Are you sure you want to log out?</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                You will be signed out of your ProspectOS workspace session.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg cursor-pointer transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIRST-TIME WELCOME ONBOARDING MODAL */}
      <AnimatePresence>
        {showWelcomeModal && currentUser && (
          <WelcomeModal
            userName={currentUser.name}
            onClose={() => {
              if (currentUser) {
                localStorage.setItem(`prospectos_welcomed_${currentUser.id}`, 'true');
              }
              setShowWelcomeModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
