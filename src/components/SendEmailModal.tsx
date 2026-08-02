import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Mail, CheckCircle2, ChevronDown, User, AlertCircle, Save } from 'lucide-react';
import { api } from '../lib/api.js';
import { SenderAccount, EmailTemplate } from '../types.js';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    relatedType: 'prospect' | 'client';
    contactName: string;
    businessName: string;
    email: string;
    dateAdded?: string;
  } | null;
  onSuccess: (msg: string) => void;
}

export function SendEmailModal({ isOpen, onClose, contact, onSuccess }: SendEmailModalProps) {
  const [senderAccounts, setSenderAccounts] = useState<SenderAccount[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contact) {
      setRecipientEmail(contact.email || '');
      loadData();
    }
  }, [isOpen, contact]);

  async function loadData() {
    setError(null);
    try {
      const [accountsData, templatesData] = await Promise.all([
        api.senderAccounts.list(),
        api.emailTemplates.list()
      ]);

      setSenderAccounts(accountsData);
      setTemplates(templatesData);

      if (accountsData.length > 0) {
        setSelectedSenderId(accountsData[0].id);
      }

      // Default template selection
      const defTmpl = templatesData.find((t: any) => t.isDefault) || templatesData[0];
      if (defTmpl) {
        setSelectedTemplateId(defTmpl.id);
        applyTemplate(defTmpl);
      } else {
        // Fallback default content
        const firstName = getFirstName(contact?.contactName || contact?.businessName || '');
        setSubject(`Following up regarding ${contact?.businessName || 'our business'}`);
        setBody(`Hi ${firstName},\n\nI wanted to follow up on our previous conversation regarding ${contact?.businessName || 'your business'}.\n\nLet me know when you have a moment to connect!\n\nBest regards,\nProspectOS Sales Team`);
      }
    } catch (e: any) {
      console.error('Error loading email send modal data:', e);
    }
  }

  function getFirstName(fullName: string) {
    if (!fullName) return 'there';
    return fullName.trim().split(' ')[0] || fullName;
  }

  function applyTemplate(tmpl: EmailTemplate) {
    if (!contact) return;
    const firstName = getFirstName(contact.contactName || contact.businessName);
    const fullName = contact.contactName || contact.businessName;
    const company = contact.businessName || 'your company';
    const lastContactDate = contact.dateAdded ? contact.dateAdded.split('T')[0] : 'recently';
    const senderName = 'ProspectOS Sales Team';

    const subst = (text: string) => {
      return text
        .replace(/\{\{\s*first_name\s*\}\}/g, firstName)
        .replace(/\{\{\s*full_name\s*\}\}/g, fullName)
        .replace(/\{\{\s*company\s*\}\}/g, company)
        .replace(/\{\{\s*sender_name\s*\}\}/g, senderName)
        .replace(/\{\{\s*last_contact_date\s*\}\}/g, lastContactDate);
    };

    setSubject(subst(tmpl.subject));
    setBody(subst(tmpl.body));
  }

  function handleTemplateChange(tmplId: string) {
    setSelectedTemplateId(tmplId);
    if (!tmplId) return;
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      applyTemplate(tmpl);
    }
  }

  function insertVariable(varTag: string) {
    setBody((prev) => prev + ` ${varTag}`);
  }

  async function handleSaveAsNewTemplate() {
    if (!subject.trim() || !body.trim()) {
      setError('Please provide subject line and body to save template');
      return;
    }

    const templateName = prompt('Enter a name for this custom template:', 'Custom Follow-Up Template');
    if (!templateName) return;

    setSavingTemplate(true);
    try {
      const created = await api.emailTemplates.create({
        name: templateName.trim(),
        subject: subject.trim(),
        body: body.trim(),
        isDefault: false
      });
      setTemplates((prev) => [...prev, created]);
      setSelectedTemplateId(created.id);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSend() {
    if (!contact) return;
    if (!recipientEmail.trim()) {
      setError('Please specify a valid recipient email address');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      setError('Please provide a subject line and email body');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await api.followUps.send({
        relatedId: contact.id,
        relatedType: contact.relatedType,
        recipientEmail: recipientEmail.trim(),
        senderAccountId: selectedSenderId || undefined,
        templateId: selectedTemplateId || undefined,
        subject: subject.trim(),
        body: body.trim()
      });

      if (res.success) {
        onSuccess(res.message || `Follow-up email sent to ${recipientEmail.trim()}!`);
        onClose();
      } else {
        setError('Failed to send email. Please try again.');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred while sending email');
    } finally {
      setSending(false);
    }
  }

  if (!isOpen || !contact) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200 border border-white/10">
                <Send className="w-5 h-5 text-zinc-300" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  Review & Send Follow-Up
                  <span className="px-2 py-0.5 text-xs font-mono uppercase bg-zinc-800 text-zinc-300 border border-white/10 rounded">
                    {contact.relatedType}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Target: <span className="text-zinc-200 font-medium">{contact.contactName}</span> ({contact.businessName})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient & From Account bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  To (Recipient Email)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-white/30 pr-10"
                    placeholder="name@company.com"
                  />
                  <Mail className="w-4 h-4 text-zinc-500 absolute right-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  From (Connected Inbox)
                </label>
                {senderAccounts.length > 0 ? (
                  <div className="relative">
                    <select
                      value={selectedSenderId}
                      onChange={(e) => setSelectedSenderId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-white/30 appearance-none pr-8 cursor-pointer"
                    >
                      {senderAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.emailAddress} ({acc.provider})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                ) : (
                  <div className="px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-zinc-300 flex items-center justify-between">
                    <span>Default Outlet ({contact.email || 'user@prospectos.com'})</span>
                    <span className="text-[10px] text-zinc-400 font-mono">CONNECTED</span>
                  </div>
                )}
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Select Email Template
                </label>
                <button
                  type="button"
                  onClick={handleSaveAsNewTemplate}
                  disabled={savingTemplate}
                  className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>Save as Template</span>
                </button>
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-white/30 appearance-none pr-8 cursor-pointer"
              >
                <option value="">-- Select template or write custom --</option>
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} {tmpl.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Email Body Content
                </label>
                {/* Insert Variable Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-500">Insert tag:</span>
                  {['{{first_name}}', '{{company}}', '{{sender_name}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag)}
                      className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 rounded border border-white/10 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                placeholder="Write your follow-up message here..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/30 resize-none font-sans leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-white/10 bg-zinc-950/60 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !contact.email}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Follow-Up Email</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
