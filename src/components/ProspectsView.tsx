import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Grid,
  List,
  Table as TableIcon,
  ChevronDown,
  Trash2,
  Edit3,
  Check,
  CheckCircle,
  MoreVertical,
  Plus,
  ArrowRight,
  TrendingUp,
  Tag,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  ExternalLink,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Prospect, ProspectStatus } from '../types.js';
import { AppleToast } from './AppleToast.jsx';
import { formatCurrency, getCurrencySymbol } from '../lib/currency.js';

const STATUS_OPTIONS: ProspectStatus[] = [
  'New',
  'Contacted',
  'Follow Up',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiating',
  'Landed',
  'Failed',
  'Ghosted',
  'Not Interested',
  'Archived'
];

export default function ProspectsView() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'card' | 'table' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'dateAdded' | 'priority' | 'businessName'>('dateAdded');

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Form Modals state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [source, setSource] = useState('Manual');
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [tagsText, setTagsText] = useState('');
  const [status, setStatus] = useState<ProspectStatus>('New');

  // Inline client contract options in Main Form
  const [formContractType, setFormContractType] = useState<'monthly' | 'one_time'>('monthly');
  const [formContractValue, setFormContractValue] = useState<number>(12000);
  const [formMonthlyRetainer, setFormMonthlyRetainer] = useState<number>(1500);
  const [formServicePurchased, setFormServicePurchased] = useState('Premium CRM Implementation');

  // Follow-Up form fields
  const [followUpPreset, setFollowUpPreset] = useState<string>('none');
  const [customFollowUpDate, setCustomFollowUpDate] = useState<string>('');
  const [followUpNote, setFollowUpNote] = useState<string>('');

  // Delete Confirmation Modal states
  const [prospectToDelete, setProspectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Quick Follow-Up Schedule Modal states
  const [followUpProspectModal, setFollowUpProspectModal] = useState<Prospect | null>(null);
  const [quickFollowUpPreset, setQuickFollowUpPreset] = useState<string>('3d');
  const [quickCustomFollowUpDate, setQuickCustomFollowUpDate] = useState<string>('');
  const [quickFollowUpNote, setQuickFollowUpNote] = useState<string>('');

  // Landed Quick-change Confirmation Modal states
  const [landedConfirmProspect, setLandedConfirmProspect] = useState<Prospect | null>(null);
  const [confirmServicePurchased, setConfirmServicePurchased] = useState('Premium CRM Implementation');
  const [confirmContractType, setConfirmContractType] = useState<'monthly' | 'one_time'>('monthly');
  const [confirmContractValue, setConfirmContractValue] = useState<number>(12000);
  const [confirmMonthlyRetainer, setConfirmMonthlyRetainer] = useState<number>(1500);
  const [confirmStartDate, setConfirmStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [confirmDeliveryDate, setConfirmDeliveryDate] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [confirmRenewalDate, setConfirmRenewalDate] = useState<string>(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [confirmFollowUpPreset, setConfirmFollowUpPreset] = useState<string>('none');
  const [confirmCustomFollowUpDate, setConfirmCustomFollowUpDate] = useState<string>('');
  const [confirmFollowUpNote, setConfirmFollowUpNote] = useState<string>('');

  const [notif, setNotif] = useState<string | null>(null);

  useEffect(() => {
    loadProspects();
  }, []);

  async function loadProspects(showLoading = false) {
    if (showLoading || prospects.length === 0) setLoading(true);
    try {
      const data = await api.prospects.list();
      setProspects(data);
    } catch (e) {
      console.error('Error fetching prospects:', e);
    } finally {
      setLoading(false);
    }
  }

  const triggerNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  // Selection toggle
  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProspects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProspects.map((p) => p.id));
    }
  };

  // Status rapid update
  const handleQuickStatusUpdate = async (id: string, newStatus: ProspectStatus) => {
    if (newStatus === 'Landed') {
      const p = prospects.find((x) => x.id === id);
      if (p) {
        setLandedConfirmProspect(p);
        // Set sensible defaults for confirmation
        setConfirmServicePurchased('Premium CRM Implementation');
        setConfirmContractType('monthly');
        setConfirmContractValue(12000);
        setConfirmMonthlyRetainer(1500);
        setConfirmStartDate(new Date().toISOString().split('T')[0]);
        setConfirmDeliveryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        setConfirmRenewalDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
        if (p.nextFollowUpDate) {
          setConfirmFollowUpPreset('custom');
          setConfirmCustomFollowUpDate(p.nextFollowUpDate.split('T')[0]);
        } else {
          setConfirmFollowUpPreset('none');
          setConfirmCustomFollowUpDate('');
        }
        setConfirmFollowUpNote(p.followUpNote || '');
        return;
      }
    }

    try {
      await api.prospects.update(id, { status: newStatus });
      triggerNotification(`Status updated to ${newStatus}`);
      loadProspects();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmLanded = async () => {
    if (!landedConfirmProspect) return;

    const calculatedFollowUpDate = (() => {
      if (confirmFollowUpPreset === 'none') return null;
      if (confirmFollowUpPreset === 'custom') return confirmCustomFollowUpDate || null;
      const now = new Date();
      if (confirmFollowUpPreset === '1d') now.setDate(now.getDate() + 1);
      else if (confirmFollowUpPreset === '3d') now.setDate(now.getDate() + 3);
      else if (confirmFollowUpPreset === '1w') now.setDate(now.getDate() + 7);
      else if (confirmFollowUpPreset === '2w') now.setDate(now.getDate() + 14);
      else if (confirmFollowUpPreset === '1m') now.setMonth(now.getMonth() + 1);
      return now.toISOString().split('T')[0];
    })();

    try {
      await api.prospects.update(landedConfirmProspect.id, {
        status: 'Landed',
        servicePurchased: confirmServicePurchased,
        contractType: confirmContractType,
        contractValue: confirmContractValue,
        monthlyRetainer: confirmContractType === 'one_time' ? 0 : confirmMonthlyRetainer,
        startDate: confirmStartDate,
        deliveryDate: confirmDeliveryDate,
        renewalDate: confirmRenewalDate,
        nextFollowUpDate: calculatedFollowUpDate,
        followUpStatus: calculatedFollowUpDate ? 'pending' : 'none',
        followUpNote: confirmFollowUpNote.trim() || null
      });
      triggerNotification(`Landed! "${landedConfirmProspect.businessName}" converted to Client successfully.`);
      setLandedConfirmProspect(null);
      loadProspects();
    } catch (e: any) {
      alert(e.message || 'Promotion failed');
    }
  };

  // Quick Follow-Up helper
  const openQuickFollowUp = (p: Prospect) => {
    setFollowUpProspectModal(p);
    if (p.nextFollowUpDate) {
      setQuickFollowUpPreset('custom');
      setQuickCustomFollowUpDate(p.nextFollowUpDate.split('T')[0]);
    } else {
      setQuickFollowUpPreset('3d');
      setQuickCustomFollowUpDate('');
    }
    setQuickFollowUpNote(p.followUpNote || '');
  };

  const handleSaveQuickFollowUp = async () => {
    if (!followUpProspectModal) return;

    const calculatedFollowUpDate = (() => {
      if (quickFollowUpPreset === 'none') return null;
      if (quickFollowUpPreset === 'custom') return quickCustomFollowUpDate || null;
      const now = new Date();
      if (quickFollowUpPreset === '1d') now.setDate(now.getDate() + 1);
      else if (quickFollowUpPreset === '3d') now.setDate(now.getDate() + 3);
      else if (quickFollowUpPreset === '1w') now.setDate(now.getDate() + 7);
      else if (quickFollowUpPreset === '2w') now.setDate(now.getDate() + 14);
      else if (quickFollowUpPreset === '1m') now.setMonth(now.getMonth() + 1);
      return now.toISOString().split('T')[0];
    })();

    try {
      await api.prospects.update(followUpProspectModal.id, {
        nextFollowUpDate: calculatedFollowUpDate,
        followUpStatus: calculatedFollowUpDate ? 'pending' : 'none',
        followUpNote: quickFollowUpNote.trim() || null
      });
      triggerNotification(`Follow-up scheduled for "${followUpProspectModal.businessName}"`);
      setFollowUpProspectModal(null);
      loadProspects();
    } catch (e: any) {
      triggerNotification(e.message || 'Failed to update follow-up');
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: ProspectStatus) => {
    try {
      await api.prospects.bulkUpdate(selectedIds, { status: newStatus });
      triggerNotification(`Updated ${selectedIds.length} prospects to ${newStatus}`);
      setSelectedIds([]);
      setShowBulkMenu(false);
      loadProspects();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete handlers with Confirmation
  const handleDeleteSingle = (id: string, name: string) => {
    setProspectToDelete({ id, name });
  };

  const confirmDeleteSingle = async () => {
    if (!prospectToDelete) return;
    const { id, name } = prospectToDelete;
    setDeleteLoading(true);
    setProspects((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.prospects.delete(id);
      triggerNotification(`Deleted prospect "${name}"`);
    } catch (e: any) {
      console.error(e);
      triggerNotification(e.message || 'Failed to delete prospect');
      loadProspects();
    } finally {
      setDeleteLoading(false);
      setProspectToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = [...selectedIds];
    setDeleteLoading(true);
    setProspects((prev) => prev.filter((p) => !idsToDelete.includes(p.id)));
    setSelectedIds([]);
    setShowBulkMenu(false);
    try {
      await api.prospects.bulkDelete(idsToDelete);
      triggerNotification(`Successfully deleted ${idsToDelete.length} prospects.`);
    } catch (e: any) {
      console.error(e);
      triggerNotification(e.message || 'Failed to delete selected prospects');
      loadProspects();
    } finally {
      setDeleteLoading(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  // Form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return;

    const calculatedFollowUpDate = (() => {
      if (followUpPreset === 'none') return null;
      if (followUpPreset === 'custom') return customFollowUpDate || null;
      const now = new Date();
      if (followUpPreset === '1d') now.setDate(now.getDate() + 1);
      else if (followUpPreset === '3d') now.setDate(now.getDate() + 3);
      else if (followUpPreset === '1w') now.setDate(now.getDate() + 7);
      else if (followUpPreset === '2w') now.setDate(now.getDate() + 14);
      else if (followUpPreset === '1m') now.setMonth(now.getMonth() + 1);
      return now.toISOString().split('T')[0];
    })();

    const payload = {
      businessName,
      ownerName,
      email,
      phone,
      website,
      industry,
      country,
      city,
      address,
      source,
      linkedin,
      instagram,
      facebook,
      notes,
      priority,
      status,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      nextFollowUpDate: calculatedFollowUpDate,
      followUpStatus: calculatedFollowUpDate ? 'pending' : 'none',
      followUpNote: followUpNote.trim() || null,
      // Include inline client contract fields if marked as Landed
      ...(status === 'Landed' ? {
        contractType: formContractType,
        contractValue: formContractValue,
        monthlyRetainer: formContractType === 'one_time' ? 0 : formMonthlyRetainer,
        servicePurchased: formServicePurchased,
      } : {})
    };

    try {
      if (formMode === 'create') {
        await api.prospects.create(payload);
        triggerNotification('Created new prospect successfully!');
      } else if (editingId) {
        await api.prospects.update(editingId, payload);
        triggerNotification('Prospect details updated successfully.');
      }
      setShowForm(false);
      resetFormFields();
      loadProspects();
    } catch (err: any) {
      alert(err.message || 'Failed to submit form');
    }
  };

  const resetFormFields = () => {
    setBusinessName('');
    setOwnerName('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setIndustry('');
    setCountry('');
    setCity('');
    setAddress('');
    setSource('Manual');
    setLinkedin('');
    setInstagram('');
    setFacebook('');
    setNotes('');
    setPriority('Medium');
    setTagsText('');
    setStatus('New');
    setFormContractType('monthly');
    setFormContractValue(12000);
    setFormMonthlyRetainer(1500);
    setFormServicePurchased('Premium CRM Implementation');
    setFollowUpPreset('none');
    setCustomFollowUpDate('');
    setFollowUpNote('');
    setEditingId(null);
  };

  const handleOpenEdit = (p: Prospect) => {
    setFormMode('edit');
    setEditingId(p.id);
    setBusinessName(p.businessName);
    setOwnerName(p.ownerName);
    setEmail(p.email);
    setPhone(p.phone);
    setWebsite(p.website);
    setIndustry(p.industry);
    setCountry(p.country);
    setCity(p.city);
    setAddress(p.address);
    setSource(p.source);
    setLinkedin(p.linkedin);
    setInstagram(p.instagram);
    setFacebook(p.facebook);
    setNotes(p.notes);
    setPriority(p.priority);
    setStatus(p.status);
    setTagsText((p.tags || []).join(', '));
    if (p.nextFollowUpDate) {
      setFollowUpPreset('custom');
      setCustomFollowUpDate(p.nextFollowUpDate.split('T')[0]);
    } else {
      setFollowUpPreset('none');
      setCustomFollowUpDate('');
    }
    setFollowUpNote(p.followUpNote || '');
    setShowForm(true);
  };

  // Filter & Sort logic
  const filteredProspects = prospects
    .filter((p) => {
      const matchSearch =
        p.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;
      const matchPriority = selectedPriority === 'All' || p.priority === selectedPriority;

      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'businessName') {
        return a.businessName.localeCompare(b.businessName);
      }
      if (sortBy === 'priority') {
        const pMap = { High: 3, Medium: 2, Low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      // dateAdded
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="prospects-view-root">
      {/* Toast Notification */}
      <AppleToast message={notif} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light tracking-normal text-white flex items-center gap-2">
            Prospects CRM
            <span className="text-xs font-mono font-normal text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              {filteredProspects.length} Matches
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            Convert leads, track engagement history, and segment deals through robust filtering.
          </p>
        </div>

        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <div className="flex gap-1.5 items-center bg-white/5 px-3 py-1.5 border border-white/10 rounded-lg shrink-0">
              <span className="text-xs text-zinc-300 font-semibold">{selectedIds.length} Selected</span>
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/5 flex items-center text-[10px] gap-1 cursor-pointer"
                >
                  Bulk Edit <ChevronDown className="w-3 h-3" />
                </button>
                {showBulkMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-1 z-40">
                    <p className="text-[9px] text-zinc-500 uppercase font-semibold px-2 py-1">Set Status</p>
                    {STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        onClick={() => handleBulkStatusUpdate(st)}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5 hover:text-white rounded"
                      >
                        {st}
                      </button>
                    ))}
                    <div className="border-t border-white/5 my-1" />
                    <button
                      onClick={handleBulkDelete}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950/20 rounded flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setFormMode('create');
              resetFormFields();
              setShowForm(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            id="add-prospect-cta"
          >
            <Plus className="w-4 h-4" /> Add Prospect
          </button>
        </div>
      </div>

      {/* Control Panel: Search, Filters, View Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-zinc-950/50 border border-white/5 p-4 rounded-xl">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute inset-y-0 left-3 my-auto w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by company, tag, city, industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs glass-input"
          />
        </div>

        {/* Filters Panel */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-900 border border-white/8 rounded-lg appearance-none text-zinc-300 focus:outline-none focus:border-white/20"
            >
              <option value="All">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>

          <div className="flex-1 relative">
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-900 border border-white/8 rounded-lg appearance-none text-zinc-300 focus:outline-none focus:border-white/20"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Sorting and View Type Toggles */}
        <div className="flex justify-between items-center gap-2">
          <div className="relative flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-zinc-900 border border-white/8 rounded-lg appearance-none text-zinc-300 focus:outline-none"
            >
              <option value="dateAdded">Sort: Date Added</option>
              <option value="priority">Sort: Priority</option>
              <option value="businessName">Sort: Company Name</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
          </div>

          <div className="flex border border-white/8 rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setViewType('card')}
              className={`p-2 cursor-pointer ${viewType === 'card' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Grid Layout"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewType('table')}
              className={`p-2 cursor-pointer ${viewType === 'table' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Table Layout"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-2 cursor-pointer ${viewType === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="List Layout"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid/Table/List Viewport */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-500">
          Loading prospects database...
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center bg-zinc-950/20 border border-white/5 rounded-2xl">
          <Filter className="w-10 h-10 text-zinc-700 mb-2" />
          <p className="text-sm font-semibold text-zinc-400">No prospects matched these criteria</p>
          <p className="text-xs text-zinc-600 mt-1">Try widening your filters or starting a new prospect entry.</p>
        </div>
      ) : (
        <>
          {/* CARD GRID VIEW */}
          {viewType === 'card' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProspects.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: -15 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`glass-panel rounded-xl p-5 relative flex flex-col justify-between border-t-2 ${
                      p.priority === 'High' ? 'border-t-red-500/50' :
                      p.priority === 'Medium' ? 'border-t-yellow-500/50' : 'border-t-zinc-600/50'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => handleSelectRow(p.id)}
                            className="rounded border-white/10 text-white bg-transparent focus:ring-0 cursor-pointer"
                          />
                          <h3 className="font-semibold text-sm text-white truncate max-w-[150px]" title={p.businessName}>
                            {p.businessName}
                          </h3>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openQuickFollowUp(p)}
                            className="p-1 hover:bg-amber-500/10 rounded text-amber-400 hover:text-amber-300 cursor-pointer"
                            title="Schedule Follow-Up"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(p.id, p.businessName)}
                            className="p-1 hover:bg-red-950/20 rounded text-zinc-400 hover:text-red-400 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 block font-medium truncate max-w-[120px]">
                          Owner: {p.ownerName || 'Unknown'}
                        </span>
                        <div className="relative">
                          <select
                            value={p.status}
                            onChange={(e) => handleQuickStatusUpdate(p.id, e.target.value as ProspectStatus)}
                            className={`text-[9px] px-2 py-1 rounded bg-zinc-900 border font-bold ${
                              p.status === 'Landed' ? 'text-green-400 border-green-500/20' :
                              p.status === 'Failed' ? 'text-red-400 border-red-500/20' :
                              p.status === 'Proposal Sent' || p.status === 'Negotiating' ? 'text-blue-400 border-blue-500/20' : 'text-zinc-400 border-white/5'
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Meta info block */}
                      <div className="space-y-1 pt-2 border-t border-white/5 text-[10px] text-zinc-500">
                        {p.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-zinc-600" />
                            <span className="truncate">{p.email}</span>
                          </div>
                        )}
                        {p.industry && (
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3 h-3 text-zinc-600" />
                            <span>{p.industry}</span>
                          </div>
                        )}
                        {(p.city || p.country) && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-zinc-600" />
                            <span>{p.city}{p.city && p.country ? ', ' : ''}{p.country}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1">
                      {p.tags.map((tag, i) => (
                        <span key={i} className="text-[8px] bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewType === 'table' && (
            <div className="glass-panel rounded-xl overflow-hidden border border-white/8">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950/80 border-b border-white/8 text-zinc-400 font-semibold uppercase tracking-wider">
                      <th className="p-3.5 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredProspects.length && filteredProspects.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-white/10 text-white focus:ring-0 cursor-pointer bg-transparent"
                        />
                      </th>
                      <th className="p-3.5">Company Name</th>
                      <th className="p-3.5">Owner</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Priority</th>
                      <th className="p-3.5">Industry</th>
                      <th className="p-3.5">Source</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredProspects.map((p) => (
                        <motion.tr
                          key={p.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.18 }}
                          className="border-b border-white/5 hover:bg-white/3 transition-colors text-zinc-300"
                        >
                          <td className="p-3.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => handleSelectRow(p.id)}
                              className="rounded border-white/10 text-white focus:ring-0 cursor-pointer bg-transparent"
                            />
                          </td>
                          <td className="p-3.5 font-medium text-white">{p.businessName}</td>
                          <td className="p-3.5">{p.ownerName || '—'}</td>
                          <td className="p-3.5">
                            <select
                              value={p.status}
                              onChange={(e) => handleQuickStatusUpdate(p.id, e.target.value as ProspectStatus)}
                              className="text-[10px] bg-zinc-900 border border-white/5 rounded px-2 py-1 focus:outline-none"
                            >
                              {STATUS_OPTIONS.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                              p.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                              p.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-zinc-500/15 text-zinc-400'
                            }`}>
                              {p.priority}
                            </span>
                          </td>
                          <td className="p-3.5 truncate max-w-[120px]">{p.industry || '—'}</td>
                          <td className="p-3.5 text-zinc-500 text-[10px]">{p.source}</td>
                          <td className="p-3.5 text-right space-x-1 shrink-0">
                            <button
                              onClick={() => openQuickFollowUp(p)}
                              className="p-1 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 rounded inline-flex cursor-pointer"
                              title="Schedule Follow-Up"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1 hover:bg-white/5 text-zinc-400 hover:text-white rounded inline-flex cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSingle(p.id, p.businessName)}
                              className="p-1 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded inline-flex cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {viewType === 'list' && (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredProspects.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-white/3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleSelectRow(p.id)}
                        className="rounded border-white/10 text-white bg-transparent focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">{p.businessName}</h4>
                        <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                          {p.ownerName ? `${p.ownerName} • ` : ''}{p.email || 'No email'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        p.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                        p.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-zinc-500/15 text-zinc-400'
                      }`}>
                        {p.priority} Priority
                      </span>

                      <select
                        value={p.status}
                        onChange={(e) => handleQuickStatusUpdate(p.id, e.target.value as ProspectStatus)}
                        className="text-[10px] bg-zinc-900 border border-white/8 rounded px-2.5 py-1 text-zinc-300 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openQuickFollowUp(p)}
                          className="p-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg cursor-pointer"
                          title="Schedule Follow-Up"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 bg-white/5 border border-white/8 text-zinc-400 hover:text-white hover:bg-white/8 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(p.id, p.businessName)}
                          className="p-1.5 bg-red-950/10 border border-red-950/30 text-zinc-400 hover:text-red-400 hover:bg-red-950/35 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* FORM DRAWER MODAL WITH ANIMATION */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowForm(false);
              resetFormFields();
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
                <h3 className="text-base font-bold text-white">
                  {formMode === 'create' ? 'Create Prospect Entry' : 'Edit Prospect Profile'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetFormFields();
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Cancel & Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {/* Primary info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Business Name *</label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="E.g., Starlight Co"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Owner Name</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="E.g., Sarah Connor"
                    />
                  </div>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="sarah@starlight.co"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="starlight.co"
                    />
                  </div>
                </div>

                {/* Industry / Geography */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="E.g., SaaS"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="United States"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="San Francisco"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Source</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="LinkedIn Outbound"
                    />
                  </div>
                </div>

                {/* Social Channels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">LinkedIn URL</label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="linkedin.com/in/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Instagram Username</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Facebook URL</label>
                    <input
                      type="text"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="facebook.com/..."
                    />
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProspectStatus)}
                      className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      className="w-full p-2.5 glass-input"
                      placeholder="SaaS, Enterprise, Hot"
                    />
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
                        value={followUpPreset}
                        onChange={(e) => setFollowUpPreset(e.target.value)}
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

                    {followUpPreset === 'custom' && (
                      <div className="space-y-1.5">
                        <label className="text-zinc-400 font-medium text-xs">Custom Date</label>
                        <input
                          type="date"
                          value={customFollowUpDate}
                          onChange={(e) => setCustomFollowUpDate(e.target.value)}
                          className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-200 text-xs focus:outline-none"
                        />
                      </div>
                    )}

                    <div className={`space-y-1.5 ${followUpPreset === 'custom' ? 'col-span-2' : ''}`}>
                      <label className="text-zinc-400 font-medium text-xs">Follow-Up Note (Optional)</label>
                      <input
                        type="text"
                        value={followUpNote}
                        onChange={(e) => setFollowUpNote(e.target.value)}
                        className="w-full p-2.5 glass-input text-xs"
                        placeholder="E.g., Send updated pricing proposal"
                      />
                    </div>
                  </div>
                </div>

                {/* Collapsible Client Contract Settings inside form */}
                {status === 'Landed' && (
                  <div className="p-4 bg-zinc-950/60 border border-emerald-500/20 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Client Contract Settings
                      </h4>
                      <span className="text-[10px] text-zinc-500">Required for Landing promotion</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-zinc-400 font-medium">Service / Product Purchased</label>
                        <input
                          type="text"
                          value={formServicePurchased}
                          onChange={(e) => setFormServicePurchased(e.target.value)}
                          className="w-full p-2.5 glass-input"
                          placeholder="E.g., Custom Premium CRM Build"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-zinc-400 font-medium">Contract Type</label>
                        <select
                          value={formContractType}
                          onChange={(e) => setFormContractType(e.target.value as any)}
                          className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                        >
                          <option value="monthly">Monthly Retainer</option>
                          <option value="one_time">One-Time Project</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formContractType === 'monthly' ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-zinc-400 font-medium">Monthly Retainer Price</label>
                            <input
                              type="number"
                              value={formMonthlyRetainer}
                              onChange={(e) => setFormMonthlyRetainer(Number(e.target.value))}
                              className="w-full p-2.5 glass-input"
                              min="0"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-zinc-400 font-medium">Upfront / Setup Value</label>
                            <input
                              type="number"
                              value={formContractValue}
                              onChange={(e) => setFormContractValue(Number(e.target.value))}
                              className="w-full p-2.5 glass-input"
                              min="0"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1.5 col-span-2">
                          <label className="text-zinc-400 font-medium">One-Time Project Price ({getCurrencySymbol()})</label>
                          <input
                            type="number"
                            value={formContractValue}
                            onChange={(e) => setFormContractValue(Number(e.target.value))}
                            className="w-full p-2.5 glass-input"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-normal border-t border-white/5 pt-2">
                      Landing a prospect immediately creates a corresponding record in the Clients CRM under active billing.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 glass-input min-h-[80px]"
                    placeholder="E.g., met Sarah Jenkins at SaaSCon. Described operations automation pipeline constraints."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetFormFields();
                    }}
                    className="flex-1 py-2.5 bg-zinc-900 border border-white/10 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-800 hover:text-white cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 cursor-pointer transition-colors"
                  >
                    {formMode === 'create' ? 'Create Prospect Entry' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LANDED CONFIRMATION MODAL WITH ANIMATION */}
      <AnimatePresence>
        {landedConfirmProspect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setLandedConfirmProspect(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 border border-emerald-500/25"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Promote to Landed Client
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLandedConfirmProspect(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Confirm contract values and billing details before converting <span className="text-white font-semibold">{landedConfirmProspect.businessName}</span> to an Active client.
              </p>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium text-[10px] uppercase">Service Name</label>
                  <input
                    type="text"
                    value={confirmServicePurchased}
                    onChange={(e) => setConfirmServicePurchased(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white font-medium"
                    placeholder="Service description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium text-[10px] uppercase">Contract Model</label>
                    <select
                      value={confirmContractType}
                      onChange={(e) => setConfirmContractType(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                    >
                      <option value="monthly">Monthly Retainer</option>
                      <option value="one_time">One-Time Project</option>
                    </select>
                  </div>

                  {confirmContractType === 'one_time' ? (
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium text-[10px] uppercase">Project Value ({getCurrencySymbol()})</label>
                      <input
                        type="number"
                        value={confirmContractValue}
                        onChange={(e) => setConfirmContractValue(Number(e.target.value))}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                        min="0"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium text-[10px] uppercase">Monthly Retainer ({getCurrencySymbol()}/mo)</label>
                      <input
                        type="number"
                        value={confirmMonthlyRetainer}
                        onChange={(e) => setConfirmMonthlyRetainer(Number(e.target.value))}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {confirmContractType === 'monthly' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium text-[10px] uppercase">Upfront / Setup Value ({getCurrencySymbol()})</label>
                      <input
                        type="number"
                        value={confirmContractValue}
                        onChange={(e) => setConfirmContractValue(Number(e.target.value))}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                        min="0"
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <p className="text-[10px] text-zinc-500 leading-normal">
                        Specify setup or upfront payment required beside the monthly fee.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 font-medium text-[10px] uppercase">Start Date</label>
                    <input
                      type="date"
                      value={confirmStartDate}
                      onChange={(e) => setConfirmStartDate(e.target.value)}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-zinc-300"
                    />
                  </div>

                  {confirmContractType === 'monthly' ? (
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium text-[10px] uppercase">Annual Renewal</label>
                      <input
                        type="date"
                        value={confirmRenewalDate}
                        onChange={(e) => setConfirmRenewalDate(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-zinc-300"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-zinc-400 font-medium text-[10px] uppercase">Target Delivery</label>
                      <input
                        type="date"
                        value={confirmDeliveryDate}
                        onChange={(e) => setConfirmDeliveryDate(e.target.value)}
                        className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-zinc-300"
                      />
                    </div>
                  )}
                </div>

                {/* Follow-Up Schedule Section in Landed Modal */}
                <div className="space-y-3 pt-3 border-t border-white/8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <label className="text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                      Follow-Up Reminder Schedule
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-zinc-400 font-medium text-[10px] uppercase">Schedule Preset</label>
                      <select
                        value={confirmFollowUpPreset}
                        onChange={(e) => setConfirmFollowUpPreset(e.target.value)}
                        className="w-full p-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-xs"
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

                    {confirmFollowUpPreset === 'custom' && (
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-medium text-[10px] uppercase">Custom Date</label>
                        <input
                          type="date"
                          value={confirmCustomFollowUpDate}
                          onChange={(e) => setConfirmCustomFollowUpDate(e.target.value)}
                          className="w-full p-2 bg-zinc-950 border border-white/10 rounded-lg text-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium text-[10px] uppercase">Follow-Up Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Call client to verify onboarding checklist"
                      value={confirmFollowUpNote}
                      onChange={(e) => setConfirmFollowUpNote(e.target.value)}
                      className="w-full p-2 bg-zinc-950 border border-white/10 rounded-lg text-white text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setLandedConfirmProspect(null)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 font-medium hover:text-white hover:bg-white/10 cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLanded}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold cursor-pointer text-xs flex items-center justify-center transition-colors"
                >
                  Confirm Conversion
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK FOLLOW-UP SCHEDULE MODAL */}
      <AnimatePresence>
        {followUpProspectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setFollowUpProspectModal(null)}
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
                    Schedule Follow-Up
                  </h3>
                </div>
                <button
                  onClick={() => setFollowUpProspectModal(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300">
                Set follow-up reminder date and notes for <span className="text-white font-semibold">{followUpProspectModal.businessName}</span>.
              </p>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium text-[10px] uppercase">Schedule Preset</label>
                  <select
                    value={quickFollowUpPreset}
                    onChange={(e) => setQuickFollowUpPreset(e.target.value)}
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

                {quickFollowUpPreset === 'custom' && (
                  <div className="space-y-1">
                    <label className="text-zinc-400 font-medium text-[10px] uppercase">Custom Date</label>
                    <input
                      type="date"
                      value={quickCustomFollowUpDate}
                      onChange={(e) => setQuickCustomFollowUpDate(e.target.value)}
                      className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium text-[10px] uppercase">Follow-Up Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Re-engage regarding retainer offer"
                    value={quickFollowUpNote}
                    onChange={(e) => setQuickFollowUpNote(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setFollowUpProspectModal(null)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuickFollowUp}
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer text-xs"
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SINGLE PROSPECT DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {prospectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setProspectToDelete(null)}
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
                <h3 className="text-base font-bold text-white">Delete Prospect?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold">&quot;{prospectToDelete.name}&quot;</span>? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  disabled={deleteLoading}
                  onClick={() => setProspectToDelete(null)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white font-medium cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteLoading}
                  onClick={confirmDeleteSingle}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Prospect'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BULK PROSPECT DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowBulkDeleteConfirm(false)}
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
                <h3 className="text-base font-bold text-white">Bulk Delete Prospects?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Are you sure you want to delete <span className="text-white font-semibold">{selectedIds.length} selected prospects</span>? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  disabled={deleteLoading}
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white font-medium cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteLoading}
                  onClick={confirmBulkDelete}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : `Delete ${selectedIds.length} Prospects`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
