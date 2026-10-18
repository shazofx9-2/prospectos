import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Clock, Plus, Trash2, Calendar, User, Briefcase, Filter, X, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';
import { getCurrentUserId, getUserStoredData } from '../lib/clientStorage.js';
import { Task, Client } from '../types.js';
import { AppleToast } from './AppleToast.jsx';

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Task>('tasks', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Client>('clients', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => tasks.length === 0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [addTime, setAddTime] = useState(false);
  const [dueTime, setDueTime] = useState('09:00');
  const [clientId, setClientId] = useState('');

  const [notif, setNotif] = useState<string | null>(null);
  const [syncingGoogle, setSyncingGoogle] = useState(false);

  useEffect(() => {
    loadTasksAndClients();
  }, []);

  const triggerNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const handleSyncGoogleCalendar = async () => {
    setSyncingGoogle(true);
    try {
      const res = await api.tasks.syncGoogleCalendar();
      triggerNotif(res.message);
      loadTasksAndClients();
    } catch (e: any) {
      triggerNotif(e.message || 'Failed to sync with Google Calendar');
    } finally {
      setSyncingGoogle(false);
    }
  };

  // Helper to format local date YYYY-MM-DD
  const formatLocalDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper to format 24h time string to 12h AM/PM
  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${mStr || '00'} ${ampm}`;
  };

  async function loadTasksAndClients(showLoading = false) {
    if (showLoading && tasks.length === 0) setLoading(true);
    try {
      const [tasksRes, clientsRes] = await Promise.all([
        api.tasks.list(),
        api.clients.list()
      ]);
      if (Array.isArray(tasksRes) && tasksRes.length > 0) setTasks(tasksRes);
      if (Array.isArray(clientsRes) && clientsRes.length > 0) setClients(clientsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleTask = async (task: Task) => {
    const updatedStatus = !task.isCompleted;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: updatedStatus } : t)));
    triggerNotif(updatedStatus ? 'Task marked as completed!' : 'Task marked as pending');
    try {
      await api.tasks.update(task.id, { isCompleted: updatedStatus });
    } catch (e) {
      console.error(e);
      loadTasksAndClients();
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    triggerNotif('Task deleted');
    try {
      await api.tasks.delete(id);
    } catch (e: any) {
      console.error(e);
      triggerNotif(e.message || 'Failed to delete task');
      loadTasksAndClients();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      const created = await api.tasks.create({
        clientId: clientId || undefined,
        title,
        description,
        dueDate: dueDate || undefined,
        dueTime: addTime ? dueTime : undefined,
        priority,
        addTime
      });
      setTasks((prev) => [created, ...prev]);
      setShowForm(false);
      resetFormFields();
      triggerNotif('Created new task successfully');
    } catch (e: any) {
      console.error(e);
      triggerNotif(e.message || 'Failed to create task');
      loadTasksAndClients();
    }
  };

  const resetFormFields = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('09:00');
    setPriority('Medium');
    setClientId('');
    setAddTime(false);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && !t.isCompleted) ||
      (statusFilter === 'Completed' && t.isCompleted);

    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchClient = clientFilter === 'All' || t.clientId === clientFilter;

    return matchStatus && matchPriority && matchClient;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="p-6 space-y-6 max-w-7xl mx-auto"
      id="tasks-view-root"
    >
      <AppleToast message={notif} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light tracking-normal text-white flex items-center gap-2">
            Tasks &amp; Checklists
            <span className="text-xs font-mono font-normal text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              {filteredTasks.length} Visible
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            Aggregate checklist steps, verify due dates, and confirm assignment completions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start">
          <button
            onClick={handleSyncGoogleCalendar}
            disabled={syncingGoogle}
            className="px-3.5 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Sync all tasks to Google Calendar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
            <span>{syncingGoogle ? 'Syncing...' : 'Sync Google Calendar'}</span>
          </button>

          <button
            onClick={() => {
              if (clients.length === 0) {
                alert('Onboard a client first before creating tasks.');
                return;
              }
              setClientId(clients[0].id);
              setShowForm(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
            id="global-add-task-btn"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-950/50 border border-white/5 p-4 rounded-xl">
        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase">Status</label>
          <div className="flex bg-zinc-900 border border-white/8 rounded-lg overflow-hidden p-0.5">
            {['Pending', 'Completed', 'All'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st as any)}
                className={`flex-1 py-1.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                  statusFilter === st ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase">Filter by Client</label>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full p-2 bg-zinc-900 border border-white/8 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-white/20"
          >
            <option value="All">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-zinc-500 font-semibold uppercase">Priority Level</label>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full p-2 bg-zinc-900 border border-white/8 rounded-lg text-xs text-zinc-300 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-end justify-end">
          <button
            onClick={() => {
              setStatusFilter('Pending');
              setPriorityFilter('All');
              setClientFilter('All');
            }}
            className="text-xs text-zinc-400 hover:text-white underline cursor-pointer p-2"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Tasks viewport */}
      {loading ? (
        <p className="text-xs text-zinc-500 p-6">Loading tasks...</p>
      ) : filteredTasks.length === 0 ? (
        <div className="h-60 border border-white/5 bg-zinc-950/20 rounded-2xl flex flex-col items-center justify-center text-center">
          <CheckSquare className="w-10 h-10 text-zinc-700 mb-2" />
          <p className="text-xs font-semibold text-zinc-400">All caught up!</p>
          <p className="text-[10px] text-zinc-600 mt-1">No tasks matching current filters.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((t) => {
            const client = clients.find((c) => c.id === t.clientId);
            
            // Check overdue using local date calculations to avoid timezone shifts
            const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
            const isOverdue = !t.isCompleted && t.dueDate < todayStr;

            return (
              <div
                key={t.id}
                className="glass-panel p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/3 transition-all"
                id={`task-item-${t.id}`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <input
                    type="checkbox"
                    checked={t.isCompleted}
                    onChange={() => handleToggleTask(t)}
                    className="mt-0.5 rounded border-white/10 text-white bg-transparent focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0">
                    <h3 className={`font-semibold text-xs ${t.isCompleted ? 'line-through text-zinc-600' : 'text-white'}`}>
                      {t.title}
                    </h3>
                    {t.description && (
                      <p className="text-[10px] text-zinc-500 line-clamp-2 max-w-xl">{t.description}</p>
                    )}
                    {/* Meta labels row */}
                    <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-zinc-500 pt-1">
                      {client && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-zinc-600" />
                          {client.businessName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        Due {formatLocalDateString(t.dueDate)}
                        {t.addTime && t.dueTime && (
                          <span className="text-sky-400 font-semibold ml-1 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                            <Clock className="w-2.5 h-2.5 inline mr-1" />
                            {formatTime12h(t.dueTime)}
                          </span>
                        )}
                      </span>
                      
                      <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2.5">
                        <input
                          type="checkbox"
                          id={`add-time-list-${t.id}`}
                          checked={!!t.addTime}
                          onChange={async (e) => {
                            try {
                              await api.tasks.update(t.id, {
                                addTime: e.target.checked,
                                dueTime: e.target.checked ? (t.dueTime || '09:00') : undefined
                              });
                              loadTasksAndClients();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="rounded border-white/10 text-white bg-transparent focus:ring-0 cursor-pointer w-3.5 h-3.5"
                        />
                        <label htmlFor={`add-time-list-${t.id}`} className="text-[9px] text-zinc-400 cursor-pointer select-none">
                          Add Time
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  {isOverdue && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-red-950/40 border border-red-900/50 rounded-full text-red-300 font-bold animate-pulse">
                      Overdue
                    </span>
                  )}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    t.priority === 'High' ? 'bg-red-500/10 text-red-400' :
                    t.priority === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-zinc-500/15 text-zinc-400'
                  }`}>
                    {t.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASK CREATION MODAL WITH ANIMATION */}
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
              className="glass-panel rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-5"
            >
              <div className="flex justify-between items-center border-b border-white/8 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  Create Operational Task
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetFormFields();
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors focus:outline-none"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Assign to Client *</label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 glass-input"
                  placeholder="Core Web Vitals Performance Audit"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 glass-input min-h-[60px]"
                  placeholder="Describe explicit steps to completion..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-medium">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-900 border border-white/8 rounded-lg text-zinc-300 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-1 pb-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="addTimeCheckbox"
                    checked={addTime}
                    onChange={(e) => setAddTime(e.target.checked)}
                    className="rounded border-white/10 text-white bg-transparent focus:ring-0 cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="addTimeCheckbox" className="text-zinc-400 font-medium cursor-pointer select-none flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    Add Time
                  </label>
                </div>

                {addTime && (
                  <div className="p-3 bg-zinc-950/80 border border-white/10 rounded-xl space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-zinc-400 font-semibold">Scheduled Time</label>
                      <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                        {formatTime12h(dueTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                        className="p-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 text-xs w-full"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: '9:00 AM', val: '09:00' },
                        { label: '12:00 PM', val: '12:00' },
                        { label: '2:30 PM', val: '14:30' },
                        { label: '5:00 PM', val: '17:00' },
                        { label: '8:00 PM', val: '20:00' },
                      ].map((t) => (
                        <button
                          type="button"
                          key={t.val}
                          onClick={() => setDueTime(t.val)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                            dueTime === t.val
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'bg-zinc-900 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 cursor-pointer transition-colors"
              >
                Create Task
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);
}
