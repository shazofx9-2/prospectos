import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
  X,
  FileText,
  Upload,
  Download,
  AlertTriangle,
  AlertCircle,
  FolderOpen,
  ArrowUpRight,
  Edit2,
  Mail,
  Send
} from 'lucide-react';
import { api } from '../lib/api.js';
import { handleClientFallback, getCurrentUserId, getUserStoredData } from '../lib/clientStorage.js';
import { Client, Task, FileMetadata, ClientStatus } from '../types.js';
import { AppleToast } from './AppleToast.jsx';
import { SendEmailModal } from './SendEmailModal.jsx';
import { formatCurrency, getCurrencySymbol } from '../lib/currency.js';

const CLIENT_STATUSES: ClientStatus[] = [
  'Active',
  'Paused',
  'Completed',
  'Cancelled',
  'Lost',
  'Renewing'
];

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Client>('clients', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Client>('clients', uid);
      if (Array.isArray(local) && local.length > 0) return local[0];
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => clients.length === 0);

  // Detail panel states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileMetadata[]>([]);

  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskAssigned, setNewTaskAssigned] = useState('');

  // Client form state
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientFormMode, setClientFormMode] = useState<'create' | 'edit'>('create');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [cBusinessName, setCBusinessName] = useState('');
  const [cContactName, setCContactName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cServicePurchased, setCServicePurchased] = useState('');
  const [cContractValue, setCContractValue] = useState('');
  const [cMonthlyRetainer, setCMonthlyRetainer] = useState('');
  const [cStartDate, setCStartDate] = useState('');
  const [cRenewalDate, setCRenewalDate] = useState('');
  const [cDeliveryDate, setCDeliveryDate] = useState('');
  const [cPaymentStatus, setCPaymentStatus] = useState<'Paid' | 'Pending' | 'Overdue'>('Pending');
  const [cInvoiceStatus, setCInvoiceStatus] = useState<'Sent' | 'Pending' | 'Paid'>('Pending');
  const [cNotes, setCNotes] = useState('');
  const [cPriority, setCPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [cInternalNotes, setCInternalNotes] = useState('');
  const [cStatus, setCStatus] = useState<ClientStatus>('Active');

  // Follow-Up state for clients form
  const [cFollowUpPreset, setCFollowUpPreset] = useState('none');
  const [cCustomFollowUpDate, setCCustomFollowUpDate] = useState('');
  const [cFollowUpNote, setCFollowUpNote] = useState('');

  // Follow-Up Email Modal States
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [sendEmailContact, setSendEmailContact] = useState<{
    id: string;
    relatedType: 'prospect' | 'client';
    contactName: string;
    businessName: string;
    email: string;
  } | null>(null);

  const openClientEmailModal = (c: Client) => {
    setSendEmailContact({
      id: c.id,
      relatedType: 'client',
      contactName: c.contactName || c.businessName,
      businessName: c.businessName,
      email: c.email || ''
    });
    setShowSendEmailModal(true);
  };

  // Delete Confirmation state
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteClientLoading, setDeleteClientLoading] = useState(false);

  // Quick Follow-Up Modal for Clients
  const [followUpClientModal, setFollowUpClientModal] = useState<Client | null>(null);
  const [quickClientPreset, setQuickClientPreset] = useState<string>('3d');
  const [quickClientCustomDate, setQuickClientCustomDate] = useState<string>('');
  const [quickClientNote, setQuickClientNote] = useState<string>('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientSubsystems(selectedClient.id);
    }
  }, [selectedClient]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  async function loadClients(showLoading = false) {
    if (showLoading && clients.length === 0) setLoading(true);
    try {
      const data = await api.clients.list();
      const activeList = Array.isArray(data) ? data : [];
      if (activeList.length > 0) {
        setClients(activeList);
        if (selectedClient) {
          const matching = activeList.find((x) => x.id === selectedClient.id);
          if (matching) setSelectedClient(matching);
        } else if (activeList[0]) {
          setSelectedClient(activeList[0]);
        }
      }
    } catch (e) {
      console.error(e);
      const fallback = handleClientFallback<Client[]>('/api/clients', 'GET', {});
      const activeList = Array.isArray(fallback) ? fallback : [];
      if (activeList.length > 0) {
        setClients(activeList);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadClientSubsystems(clientId: string) {
    try {
      const [tasksData, filesData] = await Promise.all([
        api.tasks.list(clientId),
        api.files.list({ clientId })
      ]);
      setTasks(tasksData);
      setFiles(filesData);
    } catch (e) {
      console.error('Error loading client subsystems:', e);
    }
  }

  // Task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newTaskTitle) return;

    try {
      const task = await api.tasks.create({
        clientId: selectedClient.id,
        title: newTaskTitle,
        dueDate: newTaskDueDate || undefined,
        priority: newTaskPriority,
        assignedTo: newTaskAssigned
      });
      setNewTaskTitle('');
      setNewTaskAssigned('');
      triggerToast('Added checklist task');
      loadClientSubsystems(selectedClient.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!selectedClient) return;
    try {
      await api.tasks.update(task.id, { isCompleted: !task.isCompleted });
      loadClientSubsystems(selectedClient.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedClient) return;
    try {
      await api.tasks.delete(taskId);
      loadClientSubsystems(selectedClient.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Base64 file upload helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClient) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = (event.target?.result as string).split(',')[1];
      try {
        await api.files.upload({
          name: file.name,
          size: file.size,
          type: file.type,
          base64Data,
          clientId: selectedClient.id
        });
        triggerToast('Document uploaded successfully');
        loadClientSubsystems(selectedClient.id);
      } catch (err) {
        console.error(err);
        alert('File upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = async (id: string) => {
    if (!selectedClient) return;
    try {
      await api.files.delete(id);
      triggerToast('Document removed');
      loadClientSubsystems(selectedClient.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Client CRUD submissions
  const handleClientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cBusinessName) return;

    const calculatedFollowUpDate = (() => {
      if (cFollowUpPreset === 'none') return null;
      if (cFollowUpPreset === 'custom') return cCustomFollowUpDate || null;
      const now = new Date();
      if (cFollowUpPreset === '1d') now.setDate(now.getDate() + 1);
      else if (cFollowUpPreset === '3d') now.setDate(now.getDate() + 3);
      else if (cFollowUpPreset === '1w') now.setDate(now.getDate() + 7);
      else if (cFollowUpPreset === '2w') now.setDate(now.getDate() + 14);
      else if (cFollowUpPreset === '1m') now.setMonth(now.getMonth() + 1);
      return now.toISOString().split('T')[0];
    })();

    const payload = {
      businessName: cBusinessName,
      contactName: cContactName,
      email: cEmail,
      phone: cPhone,
      servicePurchased: cServicePurchased,
      contractValue: Number(cContractValue) || 0,
      monthlyRetainer: Number(cMonthlyRetainer) || 0,
      startDate: cStartDate,
      renewalDate: cRenewalDate,
      deliveryDate: cDeliveryDate,
      paymentStatus: cPaymentStatus,
      invoiceStatus: cInvoiceStatus,
      notes: cNotes,
      priority: cPriority,
      internalNotes: cInternalNotes,
      status: cStatus,
      nextFollowUpDate: calculatedFollowUpDate,
      followUpStatus: calculatedFollowUpDate ? 'pending' : 'none',
      followUpNote: cFollowUpNote.trim() || null
    };

    try {
      if (clientFormMode === 'create') {
        const created = await api.clients.create(payload);
        setSelectedClient(created);
        triggerToast('New client successfully onboarded!');
      } else if (editingClientId) {
        const updated = await api.clients.update(editingClientId, payload);
        if (selectedClient?.id === editingClientId) {
          setSelectedClient(updated);
        }
        triggerToast('Client attributes synchronized.');
      }
      setShowClientForm(false);
      resetClientFormFields();
      await loadClients();
    } catch (err: any) {
      alert(err.message || 'Error saving client');
    }
  };

  const resetClientFormFields = () => {
    setEditingClientId(null);
    setCBusinessName('');
    setCContactName('');
    setCEmail('');
    setCPhone('');
    setCServicePurchased('');
    setCContractValue('');
    setCMonthlyRetainer('');
    setCStartDate('');
    setCRenewalDate('');
    setCDeliveryDate('');
    setCPaymentStatus('Pending');
    setCInvoiceStatus('Pending');
    setCNotes('');
    setCPriority('Medium');
    setCInternalNotes('');
    setCStatus('Active');
    setCFollowUpPreset('none');
    setCCustomFollowUpDate('');
    setCFollowUpNote('');
  };

  const openEditClient = (c: Client) => {
    setClientFormMode('edit');
    setEditingClientId(c.id);
    setCBusinessName(c.businessName);
    setCContactName(c.contactName);
    setCEmail(c.email);
    setCPhone(c.phone);
    setCServicePurchased(c.servicePurchased);
    setCContractValue(c.contractValue.toString());
    setCMonthlyRetainer(c.monthlyRetainer.toString());
    setCStartDate(c.startDate);
    setCRenewalDate(c.renewalDate);
    setCDeliveryDate(c.deliveryDate);
    setCPaymentStatus(c.paymentStatus);
    setCInvoiceStatus(c.invoiceStatus);
    setCNotes(c.notes);
    setCPriority(c.priority);
    setCInternalNotes(c.internalNotes);
    setCStatus(c.status);
    if (c.nextFollowUpDate) {
      setCFollowUpPreset('custom');
      setCCustomFollowUpDate(c.nextFollowUpDate.split('T')[0]);
    } else {
      setCFollowUpPreset('none');
      setCCustomFollowUpDate('');
    }
    setCFollowUpNote(c.followUpNote || '');
    setShowClientForm(true);
  };

  const handleDeleteClient = (id: string, name: string) => {
    setClientToDelete({ id, name });
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    const { id, name } = clientToDelete;
    setDeleteClientLoading(true);
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
    try {
      await api.clients.delete(id);
      triggerToast(`Client "${name}" has been removed`);
    } catch (e: any) {
      console.error(e);
      triggerToast(e.message || 'Failed to delete client');
      loadClients();
    } finally {
      setDeleteClientLoading(false);
      setClientToDelete(null);
    }
  };

  const openClientFollowUpModal = (c: Client) => {
    setFollowUpClientModal(c);
    if (c.nextFollowUpDate) {
      setQuickClientPreset('custom');
      setQuickClientCustomDate(c.nextFollowUpDate.split('T')[0]);
    } else {
      setQuickClientPreset('3d');
      setQuickClientCustomDate('');
    }
    setQuickClientNote(c.followUpNote || '');
  };

  const handleSaveClientFollowUp = async () => {
    if (!followUpClientModal) return;

    const calculatedFollowUpDate = (() => {
      if (quickClientPreset === 'none') return null;
      if (quickClientPreset === 'custom') return quickClientCustomDate || null;
      const now = new Date();
      if (quickClientPreset === '1d') now.setDate(now.getDate() + 1);
      else if (quickClientPreset === '3d') now.setDate(now.getDate() + 3);
      else if (quickClientPreset === '1w') now.setDate(now.getDate() + 7);
      else if (quickClientPreset === '2w') now.setDate(now.getDate() + 14);
      else if (quickClientPreset === '1m') now.setMonth(now.getMonth() + 1);
      return now.toISOString().split('T')[0];
    })();

    try {
      await api.clients.update(followUpClientModal.id, {
        nextFollowUpDate: calculatedFollowUpDate,
        followUpStatus: calculatedFollowUpDate ? 'pending' : 'none',
        followUpNote: quickClientNote.trim() || null
      });
      triggerToast(`Follow-up scheduled for client "${followUpClientModal.businessName}"`);
      setFollowUpClientModal(null);
      loadClients();
    } catch (e: any) {
      triggerToast(e.message || 'Failed to save client follow-up');
    }
  };

  // Calculate task progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="p-6 max-w-7xl mx-auto flex flex-col gap-6 relative"
      id="clients-view-root"
    >
      <AppleToast message={toastMsg} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light tracking-normal text-white flex items-center gap-2">
            Client Portfolio CRM
            <span className="text-xs font-mono font-normal text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              {clients.length} Retained
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            Oversee SLA timelines, monthly billing health, checklist deliverables, and client documents.
          </p>
        </div>

        <button
          onClick={() => {
            setClientFormMode('create');
            resetClientFormFields();
            setShowClientForm(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start"
          id="onboard-client-btn"
        >
          <Plus className="w-4 h-4" /> Onboard Client
        </button>
      </div>

      {/* Clients Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Client Table Portfolio */}
        <div className="lg:col-span-2 glass-panel rounded-xl overflow-hidden border border-white/8">
          {loading ? (
            <p className="p-6 text-xs text-zinc-500">Loading client records...</p>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Users className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-sm font-semibold text-zinc-400">No active clients yet</p>
              <p className="text-xs text-zinc-600 mt-1">Onboard a client manually or mark a prospect as &apos;Landed&apos;.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-white/8 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Company Name</th>
                    <th className="p-3.5">Key Contact</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Retainer / Model</th>
                    <th className="p-3.5">Billing</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`border-b border-white/5 cursor-pointer transition-colors ${
                        selectedClient?.id === c.id ? 'bg-white/5 text-white' : 'hover:bg-white/3 text-zinc-300'
                      }`}
                    >
                      <td className="p-3.5 font-semibold text-white">{c.businessName}</td>
                      <td className="p-3.5">{c.contactName}</td>
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.status}
                          onChange={async (e) => {
                            try {
                              await api.clients.update(c.id, { ...c, status: e.target.value as any });
                              loadClients();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none focus:border-white/25 ${
                            c.status === 'Active' ? 'text-green-400' :
                            c.status === 'Renewing' ? 'text-blue-400' :
                            c.status === 'Paused' ? 'text-yellow-400' : 'text-zinc-400'
                          }`}
                        >
                          <option value="Active" className="text-white bg-zinc-950">Active</option>
                          <option value="Paused" className="text-white bg-zinc-950">Paused</option>
                          <option value="Completed" className="text-white bg-zinc-950">Completed</option>
                          <option value="Cancelled" className="text-white bg-zinc-950">Cancelled</option>
                          <option value="Lost" className="text-white bg-zinc-950">Lost</option>
                          <option value="Renewing" className="text-white bg-zinc-950">Renewing</option>
                        </select>
                      </td>
                      <td className="p-3.5">
                        {c.monthlyRetainer > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                            {formatCurrency(c.monthlyRetainer)}/mo Retainer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-white/5 text-zinc-300 px-2 py-0.5 rounded font-semibold border border-white/5">
                            {formatCurrency(c.contractValue)} One-Time
                          </span>
                        )}
                      </td>
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.paymentStatus}
                          onChange={async (e) => {
                            try {
                              await api.clients.update(c.id, { ...c, paymentStatus: e.target.value as any });
                              loadClients();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-semibold cursor-pointer focus:outline-none focus:border-white/25 ${
                            c.paymentStatus === 'Paid' ? 'text-green-300' :
                            c.paymentStatus === 'Overdue' ? 'text-red-300' : 'text-zinc-400'
                          }`}
                        >
                          <option value="Paid" className="text-white bg-zinc-950">Paid</option>
                          <option value="Pending" className="text-white bg-zinc-950">Pending</option>
                          <option value="Overdue" className="text-white bg-zinc-950">Overdue</option>
                        </select>
                      </td>
                      <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={c.priority}
                          onChange={async (e) => {
                            try {
                              await api.clients.update(c.id, { ...c, priority: e.target.value as any });
                              loadClients();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className={`bg-zinc-950 border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer focus:outline-none focus:border-white/25 ${
                            c.priority === 'High' ? 'text-red-400' : c.priority === 'Medium' ? 'text-yellow-400' : 'text-zinc-500'
                          }`}
                        >
                          <option value="Low" className="text-white bg-zinc-950">Low</option>
                          <option value="Medium" className="text-white bg-zinc-950">Medium</option>
                          <option value="High" className="text-white bg-zinc-950">High</option>
                        </select>
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openClientEmailModal(c)}
                            className="p-1 hover:bg-blue-500/10 text-blue-400 hover:text-blue-300 rounded inline-flex cursor-pointer"
                            title="Send Email Follow-Up"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openClientFollowUpModal(c)}
                            className="p-1 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 rounded inline-flex cursor-pointer"
                            title="Schedule Follow-Up"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditClient(c)}
                            className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded inline-flex cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(c.id, c.businessName)}
                            className="p-1 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded inline-flex cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Slide-out / Nested Details Operational Workspace */}
        <div className="glass-panel rounded-xl p-5 space-y-6">
          {!selectedClient ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <FolderOpen className="w-10 h-10 text-zinc-800 mb-3" />
              <p className="text-xs font-semibold text-zinc-400">Select a client profile</p>
              <p className="text-[10px] text-zinc-600 mt-1">Click any client row to operate checklists and file archives.</p>
            </div>
          ) : (
            <div className="space-y-6 text-xs" id="client-operational-panel">
              {/* Client Brief */}
              <div className="border-b border-white/8 pb-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedClient.businessName}</h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{selectedClient.contactName} • {selectedClient.email || 'No email'}</p>
                    <button
                      onClick={() => openClientEmailModal(selectedClient)}
                      className="mt-2.5 px-3 py-1.5 bg-white text-black font-bold text-[11px] rounded-lg hover:bg-zinc-200 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> Send Email Follow-Up
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditClient(selectedClient)}
                      className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
                      title="Edit Client Attributes"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="p-1 text-zinc-500 hover:text-white rounded hover:bg-white/5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="bg-white/5 text-[9px] text-zinc-300 px-2 py-0.5 rounded border border-white/5">
                    Starts: {selectedClient.startDate}
                  </span>
                  <span className="bg-white/5 text-[9px] text-zinc-300 px-2 py-0.5 rounded border border-white/5">
                    Renews: {selectedClient.renewalDate}
                  </span>
                </div>
              </div>

              {/* Finance Widget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/3 border border-white/5 rounded-lg">
                  <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">Contract Value</span>
                  <p className="text-sm font-extrabold text-white mt-1">
                    {formatCurrency(selectedClient.contractValue)}
                  </p>
                </div>
                <div className="p-3 bg-white/3 border border-white/5 rounded-lg">
                  <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-wide">Monthly Retainer</span>
                  <p className="text-sm font-extrabold text-white mt-1">
                    {formatCurrency(selectedClient.monthlyRetainer)}/mo
                  </p>
                </div>
              </div>

              {/* Checklist / Task Manager */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h4 className="font-bold text-white uppercase tracking-wide text-[10px]">Client Deliverables Checklist</h4>
                  <span className="text-[10px] text-zinc-500 font-semibold">{progressPct}% Done</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-white h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>

                {/* Interactive checklist list */}
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {tasks.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 italic py-1">No tasks created. Add one below!</p>
                  ) : (
                    tasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-2 p-2 rounded bg-white/2 hover:bg-white/4 border border-white/3">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={t.isCompleted}
                            onChange={() => handleToggleTask(t)}
                            className="rounded border-white/10 text-white cursor-pointer bg-transparent"
                          />
                          <span className={`text-[10px] truncate max-w-[150px] ${t.isCompleted ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>
                            {t.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="text-zinc-600 hover:text-red-400 p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add task inline form */}
                <form onSubmit={handleCreateTask} className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Create a critical deliverable..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-zinc-900 border border-white/10 rounded text-[10px] text-white focus:outline-none focus:border-white/20"
                  />
                  <button
                    type="submit"
                    className="px-2.5 bg-white text-black font-semibold rounded hover:bg-zinc-200 cursor-pointer text-[10px]"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLIENT CREATION/EDIT MODAL WITH ANIMATION */}
      <AnimatePresence>
        {showClientForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowClientForm(false);
              resetClientFormFields();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative space-y-6"
            >
              <div className="flex justify-between items-center border-b border-white/8 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {clientFormMode === 'create' ? 'Onboard Client' : 'Update Client Attributes'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowClientForm(false);
                    resetClientFormFields();
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors focus:outline-none"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            <form onSubmit={handleClientFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={cBusinessName}
                    onChange={(e) => setCBusinessName(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="Nova Commerce"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Primary Contact</label>
                  <input
                    type="text"
                    value={cContactName}
                    onChange={(e) => setCContactName(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="Elena Rostova"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Contact Email</label>
                  <input
                    type="email"
                    value={cEmail}
                    onChange={(e) => setCEmail(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="elena@novacommerce.io"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Contact Phone</label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="+1 (555) 017-8822"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Service / Product Purchased</label>
                  <input
                    type="text"
                    value={cServicePurchased}
                    onChange={(e) => setCServicePurchased(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="Headless Next.js Integration"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Contract Setup Value ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    value={cContractValue}
                    onChange={(e) => setCContractValue(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="18000"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Monthly Retainer Value ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    value={cMonthlyRetainer}
                    onChange={(e) => setCMonthlyRetainer(e.target.value)}
                    className="w-full p-2.5 glass-input"
                    placeholder="2500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Client Priority</label>
                  <select
                    value={cPriority}
                    onChange={(e) => setCPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Agreement Start Date</label>
                  <input
                    type="date"
                    value={cStartDate}
                    onChange={(e) => setCStartDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">SLA Renewal Date</label>
                  <input
                    type="date"
                    value={cRenewalDate}
                    onChange={(e) => setCRenewalDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Target Delivery Date</label>
                  <input
                    type="date"
                    value={cDeliveryDate}
                    onChange={(e) => setCDeliveryDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Client Lifecycle Status</label>
                  <select
                    value={cStatus}
                    onChange={(e) => setCStatus(e.target.value as ClientStatus)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  >
                    {CLIENT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Payment Status</label>
                  <select
                    value={cPaymentStatus}
                    onChange={(e) => setCPaymentStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Invoice Status</label>
                  <select
                    value={cInvoiceStatus}
                    onChange={(e) => setCInvoiceStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Sent">Sent</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {/* Follow-Up Section */}
              <div className="p-4 bg-zinc-950/60 border border-white/10 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="font-semibold text-xs text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Follow-Up Reminder
                  </h4>
                  <span className="text-[10px] text-zinc-500">Schedule automatic follow-up prompt</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium text-xs">Follow-up Schedule</label>
                    <select
                      value={cFollowUpPreset}
                      onChange={(e) => setCFollowUpPreset(e.target.value)}
                      className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 text-xs focus:outline-none"
                    >
                      <option value="none">No follow-up</option>
                      <option value="1d">In 1 day</option>
                      <option value="3d">In 3 days</option>
                      <option value="1w">In 1 week</option>
                      <option value="2w">In 2 weeks</option>
                      <option value="1m">In 1 month</option>
                      <option value="custom">Custom date</option>
                    </select>
                  </div>

                  {cFollowUpPreset === 'custom' && (
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium text-xs">Custom Date</label>
                      <input
                        type="date"
                        value={cCustomFollowUpDate}
                        onChange={(e) => setCCustomFollowUpDate(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-200 text-xs focus:outline-none"
                      />
                    </div>
                  )}

                  <div className={`space-y-1.5 ${cFollowUpPreset === 'custom' ? 'col-span-2' : ''}`}>
                    <label className="text-zinc-400 font-medium text-xs">Follow-Up Note (Optional)</label>
                    <input
                      type="text"
                      value={cFollowUpNote}
                      onChange={(e) => setCFollowUpNote(e.target.value)}
                      className="w-full p-2.5 glass-input text-xs"
                      placeholder="E.g., Check quarterly review roadmap"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Operation & Retainer Notes</label>
                <textarea
                  value={cNotes}
                  onChange={(e) => setCNotes(e.target.value)}
                  className="w-full p-2.5 glass-input min-h-[60px]"
                  placeholder="Describe scope, technology stack, and deliverables..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Internal Admin Logs</label>
                <textarea
                  value={cInternalNotes}
                  onChange={(e) => setCInternalNotes(e.target.value)}
                  className="w-full p-2.5 glass-input min-h-[60px]"
                  placeholder="Private notes (delivery checklists, team metrics)..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 cursor-pointer transition-colors"
              >
                {clientFormMode === 'create' ? 'Confirm and Onboard Client' : 'Synchronize Client attributes'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* QUICK CLIENT FOLLOW-UP SCHEDULE MODAL */}
    <AnimatePresence>
      {followUpClientModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setFollowUpClientModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-amber-500/25"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Client Follow-Up Reminder
                </h3>
              </div>
              <button
                onClick={() => setFollowUpClientModal(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Schedule follow-up reminder date and note for client <span className="text-white font-semibold">{followUpClientModal.businessName}</span>.
            </p>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 font-medium text-[10px] uppercase">Schedule Preset</label>
                <select
                  value={quickClientPreset}
                  onChange={(e) => setQuickClientPreset(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/10 rounded-lg text-white"
                >
                  <option value="none">No Follow-Up</option>
                  <option value="1d">In 1 Day</option>
                  <option value="3d">In 3 Days</option>
                  <option value="1w">In 1 Week</option>
                  <option value="2w">In 2 Weeks</option>
                  <option value="1m">In 1 Month</option>
                  <option value="custom">Custom Date</option>
                </select>
              </div>

              {quickClientPreset === 'custom' && (
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium text-[10px] uppercase">Custom Date</label>
                  <input
                    type="date"
                    value={quickClientCustomDate}
                    onChange={(e) => setQuickClientCustomDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-zinc-400 font-medium text-[10px] uppercase">Follow-Up Note</label>
                <input
                  type="text"
                  placeholder="e.g. Conduct monthly review call"
                  value={quickClientNote}
                  onChange={(e) => setQuickClientNote(e.target.value)}
                  className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setFollowUpClientModal(null)}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClientFollowUp}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer text-xs"
              >
                Save Schedule
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* CLIENT DELETE CONFIRMATION MODAL */}
    <AnimatePresence>
      {clientToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setClientToDelete(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-red-500/30 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Client Profile?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to delete client <span className="text-white font-semibold">&quot;{clientToDelete.name}&quot;</span>? All associated deliverables and records will be removed.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={deleteClientLoading}
                onClick={() => setClientToDelete(null)}
                className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white font-medium cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteClientLoading}
                onClick={confirmDeleteClient}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {deleteClientLoading ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Send Email Follow-Up Modal */}
    <SendEmailModal
      isOpen={showSendEmailModal}
      onClose={() => {
        setShowSendEmailModal(false);
        setSendEmailContact(null);
      }}
      contact={sendEmailContact}
      onSuccess={(msg) => {
        triggerToast(msg);
        loadClients();
      }}
    />
  </motion.div>
);
}
