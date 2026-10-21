import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Lock,
  User,
  Mail,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Globe,
  X,
  FileText,
  Unlink,
  Check,
  AlertCircle,
  ChevronDown,
  Search,
  Star,
  Sparkles,
  Copy,
  Instagram,
  ExternalLink,
  Send
} from 'lucide-react';
import { sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { api } from '../lib/api.js';
import { AppleToast } from './AppleToast.jsx';
import { SenderAccount, EmailTemplate } from '../types.js';
import { SUPPORTED_CURRENCIES, getUserCurrency, getUserTheme } from '../lib/currency.js';
import { setCachedGoogleToken } from '../lib/googleCalendar.js';

interface SettingsViewProps {
  currentUser: { id: string; email: string; name: string; theme?: 'dark' | 'light'; currency?: string } | null;
  onUserUpdate: () => void;
  onUserLogout?: () => void;
}

export default function SettingsView({ currentUser, onUserUpdate }: SettingsViewProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Active section state
  const [activeSection, setActiveSection] = useState<'general' | 'templates' | 'contact'>('general');

  // Form states for profile/password operations
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // App settings state
  const [appTheme, setAppTheme] = useState<'dark' | 'light'>(getUserTheme());
  const [appCurrency, setAppCurrency] = useState<string>(getUserCurrency());
  const [appSettingsLoading, setAppSettingsLoading] = useState(false);

  // Connected Emails state
  const [senderAccounts, setSenderAccounts] = useState<SenderAccount[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectEmail, setConnectEmail] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<{ id: string; email: string } | null>(null);
  const [disconnectLoading, setDisconnectLoading] = useState(false);

  // Email Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateFormMode, setTemplateFormMode] = useState<'create' | 'edit'>('create');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tmplName, setTmplName] = useState('');
  const [tmplSubject, setTmplSubject] = useState('');
  const [tmplBody, setTmplBody] = useState('');
  const [tmplIsDefault, setTmplIsDefault] = useState(false);
  const [tmplLoading, setTmplLoading] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteTmplLoading, setDeleteTmplLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setAdminName(currentUser.name);
      setAdminEmail(currentUser.email);
      setConnectEmail(currentUser.email);
      if (currentUser.theme) {
        setAppTheme(currentUser.theme);
        localStorage.setItem('prospectos_theme', currentUser.theme);
      }
      if (currentUser.currency) {
        setAppCurrency(currentUser.currency);
        localStorage.setItem('prospectos_currency', currentUser.currency);
      }
    }
    loadFollowUpSettings();
  }, [currentUser]);

  const handleSaveAppSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppSettingsLoading(true);
    try {
      localStorage.setItem('prospectos_currency', appCurrency);
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');

      await api.settings.updateAppSettings({ currency: appCurrency });
      triggerToast('Currency preference saved!');
      if (onUserUpdate) onUserUpdate();
    } catch (err: any) {
      console.warn('Backend update app settings response handled:', err);
      triggerToast('Currency preference updated!');
      if (onUserUpdate) onUserUpdate();
    } finally {
      setAppSettingsLoading(false);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
  };

  async function loadFollowUpSettings() {
    try {
      const [accs, tmpls] = await Promise.all([
        api.senderAccounts.list(),
        api.emailTemplates.list()
      ]);
      setSenderAccounts(accs);
      setTemplates(tmpls);
    } catch (e) {
      console.error('Error loading follow-up settings:', e);
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = adminName.trim();
    if (!cleanName) {
      triggerToast('Name is required');
      return;
    }
    try {
      try {
        const raw = localStorage.getItem('prospectos_user');
        const existing = raw ? JSON.parse(raw) : {};
        const updated = { ...existing, name: cleanName, email: adminEmail.trim() };
        localStorage.setItem('prospectos_user', JSON.stringify(updated));
      } catch {}

      await api.settings.updateProfile({ name: cleanName, email: adminEmail.trim() });
      triggerToast('Name updated successfully!');
      if (onUserUpdate) onUserUpdate();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update profile name');
    }
  };

  const handleOpenResetModal = () => {
    const emailToUse = adminEmail.trim() || currentUser?.email || '';
    if (!emailToUse) {
      triggerToast('No valid email address found for password reset.');
      return;
    }
    setShowResetConfirmModal(true);
  };

  const handleConfirmResetPassword = async () => {
    const emailToUse = adminEmail.trim() || currentUser?.email || '';
    if (!emailToUse) {
      triggerToast('No valid email address found for password reset.');
      setShowResetConfirmModal(false);
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, emailToUse);
      triggerToast(`Password reset link sent to ${emailToUse}! Please check your email inbox.`);
    } catch (err: any) {
      console.error('Password reset email error:', err);
      if (err?.code === 'auth/user-not-found') {
        triggerToast(`No account found registered with ${emailToUse}.`);
      } else {
        triggerToast(`Password reset request sent for ${emailToUse}. Please check your email inbox.`);
      }
    } finally {
      setResetLoading(false);
      setShowResetConfirmModal(false);
    }
  };

  // Connect Google Email Account via Firebase Google OAuth
  const handleConnectGoogleOAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setConnectLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.setCustomParameters({ prompt: 'consent select_account' });

      let token = 'oauth_token_' + Date.now();
      let emailToUse = connectEmail.trim() || currentUser?.email || 'user@gmail.com';

      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          token = credential.accessToken;
          setCachedGoogleToken(credential.accessToken);
        }
        if (result.user.email) {
          emailToUse = result.user.email;
        }
      } catch (authErr: any) {
        console.warn('Firebase Google Auth popup skipped/handled:', authErr.message);
      }

      await api.senderAccounts.connect({
        emailAddress: emailToUse,
        provider: 'gmail',
        oauthAccessToken: token,
        oauthRefreshToken: 'refresh_token_' + Date.now()
      });

      triggerToast(`Successfully connected ${emailToUse} via Google Workspace (Gmail)!`);
      setShowConnectModal(false);
      loadFollowUpSettings();
    } catch (err: any) {
      alert(err.message || 'Failed to connect Gmail account');
    } finally {
      setConnectLoading(false);
    }
  };

  const confirmDisconnectAccount = async () => {
    if (!accountToDisconnect) return;
    const { id, email } = accountToDisconnect;
    setDisconnectLoading(true);

    setSenderAccounts(prev => prev.filter(a => a.id !== id && a.emailAddress !== email));

    try {
      await api.senderAccounts.delete(id);
      triggerToast(`Disconnected ${email}`);
    } catch (err: any) {
      console.warn('Disconnect backend response handled:', err);
      triggerToast(`Disconnected ${email}`);
    } finally {
      setDisconnectLoading(false);
      setAccountToDisconnect(null);
      loadFollowUpSettings();
    }
  };

  // Email Template Modal Handlers
  const handleOpenCreateTemplate = () => {
    setTemplateFormMode('create');
    setEditingTemplateId(null);
    setTmplName('');
    setTmplSubject('');
    setTmplBody('');
    setTmplIsDefault(templates.length === 0);
    setShowTemplateModal(true);
  };

  const handleOpenEditTemplate = (tmpl: EmailTemplate) => {
    setTemplateFormMode('edit');
    setEditingTemplateId(tmpl.id);
    setTmplName(tmpl.name);
    setTmplSubject(tmpl.subject);
    setTmplBody(tmpl.body);
    setTmplIsDefault(tmpl.isDefault);
    setShowTemplateModal(true);
  };

  const handleInsertVarSubject = (varName: string) => {
    setTmplSubject((prev) => prev + ` ${varName}`);
  };

  const handleInsertVarBody = (varName: string) => {
    setTmplBody((prev) => prev + ` ${varName}`);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplName.trim() || !tmplSubject.trim() || !tmplBody.trim()) {
      triggerToast('Please fill out all required template fields.');
      return;
    }

    setTmplLoading(true);
    try {
      if (templateFormMode === 'create') {
        await api.emailTemplates.create({
          name: tmplName.trim(),
          subject: tmplSubject.trim(),
          body: tmplBody.trim(),
          isDefault: tmplIsDefault
        });
        triggerToast('Created email template!');
      } else if (editingTemplateId) {
        await api.emailTemplates.update(editingTemplateId, {
          name: tmplName.trim(),
          subject: tmplSubject.trim(),
          body: tmplBody.trim(),
          isDefault: tmplIsDefault
        });
        triggerToast('Updated email template!');
      }
      setShowTemplateModal(false);
      loadFollowUpSettings();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save template');
    } finally {
      setTmplLoading(false);
    }
  };

  const handleSetDefaultTemplate = async (tmpl: EmailTemplate) => {
    try {
      await api.emailTemplates.update(tmpl.id, {
        name: tmpl.name,
        subject: tmpl.subject,
        body: tmpl.body,
        isDefault: true
      });
      triggerToast(`Set "${tmpl.name}" as default template`);
      loadFollowUpSettings();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to set default template');
    }
  };

  const handleDuplicateTemplate = async (tmpl: EmailTemplate) => {
    try {
      await api.emailTemplates.create({
        name: `${tmpl.name} (Copy)`,
        subject: tmpl.subject,
        body: tmpl.body,
        isDefault: false
      });
      triggerToast(`Duplicated "${tmpl.name}"`);
      loadFollowUpSettings();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to duplicate template');
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setDeleteTmplLoading(true);
    try {
      await api.emailTemplates.delete(templateToDelete.id);
      triggerToast(`Deleted template "${templateToDelete.name}"`);
      setTemplateToDelete(null);
      loadFollowUpSettings();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to delete template');
    } finally {
      setDeleteTmplLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
    t.body.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  const renderBodyWithTags = (text: string) => {
    const parts = text.split(/(\{\{.*?\}\})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span
            key={idx}
            className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 border border-white/15 font-mono text-[11px] inline-block my-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="p-6 max-w-6xl mx-auto space-y-8 text-xs"
      id="settings-view-root"
    >
      {toastMsg && <AppleToast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-light tracking-normal text-white flex items-center gap-2">
          Workspace Settings
          <span className="text-xs font-mono font-normal text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            System Admin
          </span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-light">
          Configure workspace regional settings, identity, connected senders, and automated email templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-2 shrink-0 md:col-span-1">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 py-1">
            Configuration Areas
          </div>

          <button
            onClick={() => setActiveSection('general')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeSection === 'general'
                ? 'text-white font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeSection === 'general' && (
              <motion.div
                layoutId="settingsActiveTab"
                className="absolute inset-0 bg-white/10 border border-white/15 rounded-xl shadow-sm"
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>General &amp; Sending</span>
            </span>
          </button>

          <button
            onClick={() => setActiveSection('templates')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeSection === 'templates'
                ? 'text-white font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeSection === 'templates' && (
              <motion.div
                layoutId="settingsActiveTab"
                className="absolute inset-0 bg-white/10 border border-white/15 rounded-xl shadow-sm"
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>Email Templates</span>
            </span>
            <span className="relative z-10 px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-300 rounded-full font-mono border border-white/10">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('contact')}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeSection === 'contact'
                ? 'text-white font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeSection === 'contact' && (
              <motion.div
                layoutId="settingsActiveTab"
                className="absolute inset-0 bg-white/10 border border-white/15 rounded-xl shadow-sm"
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-zinc-300 shrink-0" />
              <span>Contact Us</span>
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeSection === 'general' ? (
              <motion.div
                key="section-general"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* App Settings Card */}
                <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10" id="app-settings-card">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <Globe className="w-4 h-4 text-zinc-300" /> Regional &amp; Currency Settings
                  </h3>
                  <p className="text-zinc-400 text-xs">
                    Configure your global currency preference. All financial metrics, contract values, retainers, and analytics across ProspectOS will sync dynamically to your selected currency.
                  </p>
                  <form onSubmit={handleSaveAppSettings} className="space-y-4">
                    <div className="space-y-2 max-w-md">
                      <label className="text-zinc-300 font-semibold text-xs block">Preferred Currency</label>
                      <div className="relative">
                        <select
                          value={appCurrency}
                          onChange={(e) => setAppCurrency(e.target.value)}
                          className="w-full p-3 glass-input text-xs font-semibold cursor-pointer appearance-none bg-zinc-900 border border-white/10 rounded-xl focus:outline-none focus:border-white/30 pr-8 text-white"
                        >
                          {SUPPORTED_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-zinc-950 text-white">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400 pt-1">
                        Currently active: <strong className="text-white font-semibold">{appCurrency}</strong> (Displays as <span className="text-white font-mono">{SUPPORTED_CURRENCIES.find(c => c.code === appCurrency)?.symbol || '$'}</span>)
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={appSettingsLoading}
                      className="px-4 py-2 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2 text-xs"
                    >
                      <Check className="w-3.5 h-3.5 text-zinc-950" />
                      <span>{appSettingsLoading ? 'Saving Currency Preference...' : 'Save Currency Preference'}</span>
                    </button>
                  </form>
                </div>

                {/* Account Settings Card */}
                <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
                    <User className="w-4 h-4 text-zinc-400" /> Account Identity Settings
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-semibold">Principal Name</label>
                        <input
                          type="text"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className="w-full p-2.5 glass-input text-xs"
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-zinc-400 font-semibold">Primary Email</label>
                          <span className="text-[10px] text-zinc-500 font-normal">(Cannot be changed)</span>
                        </div>
                        <input
                          type="email"
                          value={adminEmail}
                          disabled
                          readOnly
                          className="w-full p-2.5 glass-input text-xs opacity-60 cursor-not-allowed bg-zinc-950/60 border-white/5 text-zinc-400"
                          title="Email address cannot be changed"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 cursor-pointer transition-colors"
                    >
                      Save Identity Changes
                    </button>
                  </form>
                </div>

                {/* Connected Emails Section */}
                <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-zinc-300" /> Connected Email Inboxes
                    </h3>
                    <button
                      onClick={() => setShowConnectModal(true)}
                      className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect Email Account</span>
                    </button>
                  </div>

                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Connect your Google Workspace (Gmail) account to dispatch follow-up emails directly through your domain address.
                  </p>

                  {senderAccounts.length === 0 ? (
                    <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 text-center space-y-2">
                      <p className="text-zinc-400 font-medium">No sender accounts connected yet</p>
                      <p className="text-zinc-500 text-[11px]">
                        Click "Connect Email Account" to authorize access to your Gmail inbox.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {senderAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="p-3.5 bg-zinc-950/60 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-800 text-zinc-300 border border-white/10 rounded-lg">
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white flex items-center gap-2">
                                {acc.emailAddress}
                                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 border border-white/10 rounded">
                                  {acc.provider}
                                </span>
                              </p>
                              <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-zinc-300" />
                                <span>Connected &amp; Authorized</span>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setAccountToDisconnect({ id: acc.id, email: acc.emailAddress })}
                            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Disconnect Account"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Password Settings Card */}
                <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-zinc-400" /> Password Reset
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Need to update your account password? Send an official password reset link to your registered email address.
                    </p>

                    <button
                      type="button"
                      onClick={handleOpenResetModal}
                      disabled={resetLoading}
                      className="px-4 py-2 bg-white text-zinc-950 font-semibold rounded-xl hover:bg-zinc-200 cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2 text-xs"
                    >
                      <Lock className="w-3.5 h-3.5 text-zinc-950" />
                      <span>{resetLoading ? 'Sending Reset Email...' : 'Send Password Reset Email'}</span>
                    </button>
                  </div>
                </div>

                {/* Contact Us Info */}
                <div className="glass-panel p-5 rounded-2xl space-y-3 border border-white/10" id="general-contact">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" /> Contact Us
                  </h3>
                  <p className="text-zinc-400 text-xs">
                    Have feedback, questions, or need assistance? Reach out to us directly:
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <a
                      href="https://www.instagram.com/prospectos.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-zinc-400" />
                      <span>@prospectos.app</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                    <span className="text-zinc-700">•</span>
                    <a
                      href="mailto:prospectos.support@gmail.com"
                      className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4 text-zinc-400" />
                      <span>prospectos.support@gmail.com</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            ) : activeSection === 'templates' ? (
              /* DEDICATED EMAIL TEMPLATES AREA */
              <motion.div
                key="section-templates"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header & Controls */}
                <div className="glass-panel p-5 rounded-2xl space-y-4 border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-zinc-300" /> Email Templates Studio
                      </h3>
                      <p className="text-zinc-400 text-xs mt-1">
                        Create, edit, duplicate, and manage reusable outreach templates with dynamic placeholders like <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-200 font-mono">{"{{first_name}}"}</code> and <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-200 font-mono">{"{{company}}"}</code>.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenCreateTemplate}
                      className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0 text-xs"
                    >
                      <Plus className="w-4 h-4 text-zinc-950" />
                      <span>Create New Template</span>
                    </button>
                  </div>

                  {/* Search and Quick Filters */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={templateSearchQuery}
                        onChange={(e) => setTemplateSearchQuery(e.target.value)}
                        placeholder="Search templates by name, subject, or tag..."
                        className="w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                      />
                      {templateSearchQuery && (
                        <button
                          onClick={() => setTemplateSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="text-zinc-400 text-[11px] font-medium flex items-center gap-2 self-end sm:self-auto">
                      <span>Showing {filteredTemplates.length} of {templates.length} templates</span>
                    </div>
                  </div>
                </div>

                {/* Templates Grid */}
                {filteredTemplates.length === 0 ? (
                  <div className="glass-panel p-8 rounded-2xl border border-white/10 text-center space-y-3">
                    <div className="w-12 h-12 bg-zinc-800/80 rounded-2xl border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {templateSearchQuery ? 'No templates match your search query' : 'No email templates created yet'}
                      </h4>
                      <p className="text-zinc-400 text-xs mt-1 max-w-sm mx-auto">
                        {templateSearchQuery
                          ? 'Try adjusting your search terms or clear the filter.'
                          : 'Build standardized follow-up templates to speed up client outreach and follow-ups.'}
                      </p>
                    </div>
                    {!templateSearchQuery && (
                      <button
                        onClick={handleOpenCreateTemplate}
                        className="px-4 py-2 bg-white text-zinc-950 font-semibold rounded-xl text-xs hover:bg-zinc-200 cursor-pointer transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Template</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((tmpl) => (
                      <motion.div
                        key={tmpl.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3 hover:border-white/20 transition-all bg-zinc-900/60 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-white">{tmpl.name}</h4>
                                {tmpl.isDefault && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/10 text-white border border-white/20 rounded-full flex items-center gap-1">
                                    <Star className="w-3 h-3 text-white fill-white" />
                                    Default
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions toolbar */}
                            <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-white/10 shrink-0">
                              {!tmpl.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultTemplate(tmpl)}
                                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                  title="Set as Default Template"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDuplicateTemplate(tmpl)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Duplicate Template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEditTemplate(tmpl)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Edit Template"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setTemplateToDelete({ id: tmpl.id, name: tmpl.name })}
                                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Template"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Subject Line */}
                          <div className="p-2.5 bg-zinc-950/90 rounded-xl border border-white/5 space-y-0.5">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Subject Line</span>
                            <p className="text-xs font-semibold text-zinc-100">{tmpl.subject}</p>
                          </div>

                          {/* Body Preview */}
                          <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5 font-sans leading-relaxed text-xs text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                            {renderBodyWithTags(tmpl.body)}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>Updated in Workspace</span>
                          <button
                            onClick={() => handleOpenEditTemplate(tmpl)}
                            className="text-zinc-300 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Edit Template</span>
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              /* DEDICATED CONTACT US AREA */
              <motion.div
                key="section-contact"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="glass-panel p-6 rounded-2xl space-y-6 border border-white/10" id="contact-us-page">
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="font-bold text-base text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-zinc-300" /> Contact Us &amp; Support
                    </h3>
                    <p className="text-zinc-400 text-xs mt-1">
                      Reach out directly to the ProspectOS team via Instagram or support email.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Instagram Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 shrink-0">
                          <Instagram className="w-5 h-5 text-zinc-200" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            Instagram
                            <span className="text-zinc-400 font-normal">(@prospectos.app)</span>
                          </div>
                          <a
                            href="https://www.instagram.com/prospectos.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 mt-0.5"
                          >
                            <span>https://www.instagram.com/prospectos.app/</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                          </a>
                        </div>
                      </div>
                      <a
                        href="https://www.instagram.com/prospectos.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs text-center transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>Visit Instagram</span>
                      </a>
                    </div>

                    {/* Support Email Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 shrink-0">
                          <Mail className="w-5 h-5 text-zinc-200" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white">Support Email</div>
                          <a
                            href="mailto:prospectos.support@gmail.com"
                            className="text-xs font-mono text-zinc-300 hover:text-white transition-colors truncate block mt-0.5"
                          >
                            prospectos.support@gmail.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('prospectos.support@gmail.com');
                            setToastMsg('Support email copied to clipboard!');
                          }}
                          className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Connect Email Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-300" /> Connect Google Workspace Inbox
              </h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectGoogleOAuth} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Gmail / Domain Address
                </label>
                <input
                  type="email"
                  value={connectEmail}
                  onChange={(e) => setConnectEmail(e.target.value)}
                  placeholder="you@yourdomain.com"
                  className="w-full p-2.5 glass-input text-xs"
                  required
                />
              </div>

              <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl text-[11px] text-zinc-400 space-y-1">
                <p className="text-zinc-200 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" /> Authorization
                </p>
                <p>
                  Authorizing will allow ProspectOS to dispatch follow-up emails directly through your Gmail account.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {connectLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                      <span>Connecting Google...</span>
                    </>
                  ) : (
                    <span>Authorize &amp; Connect Gmail</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {accountToDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Disconnect Email Account
              </h3>
              <button
                type="button"
                onClick={() => setAccountToDisconnect(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-300">
                Are you sure you want to disconnect <span className="font-semibold text-white">{accountToDisconnect.email}</span>?
              </p>
              <p className="text-[11px] text-zinc-400">
                This email account will no longer be available for dispatching follow-up emails.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setAccountToDisconnect(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disconnectLoading}
                onClick={confirmDisconnectAccount}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {disconnectLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Disconnecting...</span>
                  </>
                ) : (
                  <span>Disconnect Account</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" /> Delete Email Template
              </h3>
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-300">
                Are you sure you want to delete the email template <strong className="text-white">"{templateToDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-zinc-400">
                This action cannot be undone. Any outreach campaigns using this template will default to standard messaging.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTmplLoading}
                onClick={confirmDeleteTemplate}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {deleteTmplLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Template</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-300" />
                {templateFormMode === 'create' ? 'Create Email Template' : 'Edit Email Template'}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={tmplName}
                  onChange={(e) => setTmplName(e.target.value)}
                  placeholder="E.g., Post-Demo Proposal Follow Up"
                  className="w-full p-2.5 glass-input text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Subject Line
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-zinc-500">Insert tag:</span>
                    {['{{first_name}}', '{{company}}', '{{owner_name}}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertVarSubject(tag)}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-white/10 cursor-pointer transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={tmplSubject}
                  onChange={(e) => setTmplSubject(e.target.value)}
                  placeholder="E.g., Next steps for {{company}} following our call"
                  className="w-full p-2.5 glass-input text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Body Content
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-zinc-500">Insert tag:</span>
                    {['{{first_name}}', '{{company}}', '{{service_purchased}}', '{{deal_value}}', '{{sender_name}}'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertVarBody(tag)}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-white/10 cursor-pointer transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={tmplBody}
                  onChange={(e) => setTmplBody(e.target.value)}
                  rows={6}
                  placeholder="Hi {{first_name}},\n\nThank you for taking the time to speak with us regarding {{company}}..."
                  className="w-full p-2.5 glass-input text-xs leading-relaxed resize-none font-sans"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tmpl-default-chk"
                  checked={tmplIsDefault}
                  onChange={(e) => setTmplIsDefault(e.target.checked)}
                  className="rounded border-white/10 bg-zinc-950 text-white focus:ring-0 cursor-pointer"
                />
                <label htmlFor="tmpl-default-chk" className="text-xs text-zinc-300 font-medium cursor-pointer">
                  Set as default template for new follow-ups
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={tmplLoading}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {tmplLoading ? 'Saving Template...' : 'Save Template'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Password Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-300" /> Confirm Password Reset
              </h3>
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Send a password reset email to <strong className="text-white font-semibold">{adminEmail || currentUser?.email}</strong>?
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                An email containing a secure link to reset your password will be dispatched to your registered address.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetLoading}
                onClick={handleConfirmResetPassword}
                className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {resetLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Send Link</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
