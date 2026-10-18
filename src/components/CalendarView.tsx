import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  RefreshCw,
  AlertCircle,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  Briefcase,
  HelpCircle
} from 'lucide-react';
import { api } from '../lib/api.js';
import { getCurrentUserId, getUserStoredData } from '../lib/clientStorage.js';
import { Client, Task, Reminder } from '../types.js';
import { AppleToast } from './AppleToast.jsx';

interface CalendarEvent {
  id: string;
  type: 'delivery' | 'renewal' | 'task' | 'reminder';
  title: string;
  date: string; // YYYY-MM-DD
  clientName?: string;
  priority?: 'Low' | 'Medium' | 'High';
  isCompleted?: boolean;
  rawTask?: Task;
}

export default function CalendarView() {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Client>('clients', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [prospects, setProspects] = useState<any[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<any>('prospects', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Task>('tasks', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const uid = getCurrentUserId();
      const local = getUserStoredData<Reminder>('reminders', uid);
      if (Array.isArray(local) && local.length > 0) return local;
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => clients.length === 0 && tasks.length === 0);

  // Selected Day for Detail Sheet / Quick Add
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // New task form fields
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskClientId, setNewTaskClientId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskAddTime, setNewTaskAddTime] = useState(false);
  const [newTaskTime, setNewTaskTime] = useState('09:00');

  const [notif, setNotif] = useState<string | null>(null);

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

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [showGoogleHelpModal, setShowGoogleHelpModal] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, []);

  const triggerToast = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const handleSyncGoogleCalendar = async () => {
    setSyncingGoogle(true);
    try {
      const res = await api.tasks.syncGoogleCalendar();
      triggerToast(res.message);
      loadCalendarData();
    } catch (e: any) {
      triggerToast(e.message || 'Failed to sync with Google Calendar');
    } finally {
      setSyncingGoogle(false);
    }
  };

  async function loadCalendarData(showLoading = false) {
    if (showLoading && clients.length === 0 && tasks.length === 0) setLoading(true);
    try {
      const [clientsRes, prospectsRes, tasksRes, remindersRes] = await Promise.all([
        api.clients.list(),
        api.prospects.list(),
        api.tasks.list(),
        api.reminders.list()
      ]);
      if (Array.isArray(clientsRes) && clientsRes.length > 0) setClients(clientsRes);
      if (Array.isArray(prospectsRes) && prospectsRes.length > 0) setProspects(prospectsRes);
      if (Array.isArray(tasksRes) && tasksRes.length > 0) setTasks(tasksRes);
      if (Array.isArray(remindersRes) && remindersRes.length > 0) setReminders(remindersRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Helper to extract YYYY-MM-DD consistently from ISO or date string
  const normalizeDateStr = (dateStr?: string): string => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  // Compile calendar events from database lists
  const events: CalendarEvent[] = [];

  clients.forEach((c) => {
    if (c.deliveryDate) {
      const dateStr = normalizeDateStr(c.deliveryDate);
      if (dateStr) {
        events.push({
          id: `delivery-${c.id}`,
          type: 'delivery',
          title: `Delivery: ${c.businessName}`,
          date: dateStr,
          clientName: c.businessName,
          priority: c.priority,
        });
      }
    }
    if (c.renewalDate) {
      const dateStr = normalizeDateStr(c.renewalDate);
      if (dateStr) {
        events.push({
          id: `renewal-${c.id}`,
          type: 'renewal',
          title: `SLA Renewal: ${c.businessName}`,
          date: dateStr,
          clientName: c.businessName,
          priority: 'High',
        });
      }
    }
  });

  tasks.forEach((t) => {
    if (t.dueDate) {
      const dateStr = normalizeDateStr(t.dueDate);
      if (dateStr) {
        const client = clients.find((c) => c.id === t.clientId);
        const timeFormatted = t.dueTime ? formatTime12h(t.dueTime) : '';
        events.push({
          id: `task-${t.id}`,
          type: 'task',
          title: timeFormatted ? `[${timeFormatted}] ${t.title}` : t.title,
          date: dateStr,
          clientName: client?.businessName,
          priority: t.priority,
          isCompleted: t.isCompleted,
          rawTask: t,
        });
      }
    }
  });

  reminders.forEach((r) => {
    if (r.triggerDate && !r.isCompleted) {
      // Only include reminder if its associated client or prospect actually exists
      const hasValidClient = r.clientId ? clients.some((c) => c.id === r.clientId) : false;
      const hasValidProspect = r.prospectId ? prospects.some((p) => p.id === r.prospectId) : false;

      if (hasValidClient || hasValidProspect) {
        const dateStr = normalizeDateStr(r.triggerDate);
        if (dateStr) {
          events.push({
            id: `reminder-${r.id}`,
            type: 'reminder',
            title: `Follow Up: ${r.title}`,
            date: dateStr,
          });
        }
      }
    }
  });

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: (Date | null)[] = [];

  // Padding days from previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }

  // Days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    daysGrid.push(new Date(year, month, d));
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatMonthName = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const formatDateToYMD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDate = (date: Date) => {
    const dStr = formatDateToYMD(date);
    return events.filter((e) => e.date === dStr);
  };

  // Actions on Tasks directly from Calendar
  const handleToggleTask = async (task: Task) => {
    const updatedStatus = !task.isCompleted;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isCompleted: updatedStatus } : t)));
    triggerToast(updatedStatus ? 'Task completed' : 'Task marked pending');
    try {
      await api.tasks.update(task.id, { isCompleted: updatedStatus });
    } catch (e) {
      console.error(e);
      loadCalendarData();
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    triggerToast('Task deleted');
    try {
      await api.tasks.delete(id);
    } catch (e: any) {
      console.error(e);
      triggerToast(e.message || 'Failed to delete task');
      loadCalendarData();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate) return;

    const targetClientId = newTaskClientId || (clients[0]?.id || '');
    if (!targetClientId) {
      triggerToast('Please add a client first');
      return;
    }

    try {
      const created = await api.tasks.create({
        clientId: targetClientId,
        title: newTaskTitle,
        description: newTaskDescription,
        dueDate: newTaskDate,
        dueTime: newTaskAddTime ? newTaskTime : undefined,
        addTime: newTaskAddTime,
        priority: newTaskPriority,
      });

      setTasks((prev) => [...prev, created]);
      triggerToast('Task scheduled on Calendar');
      setShowAddTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskAddTime(false);
      setNewTaskTime('09:00');
    } catch (e: any) {
      console.error(e);
      triggerToast(e.message || 'Failed to schedule task');
    }
  };

  const openAddTaskForDate = (date: Date) => {
    setNewTaskDate(formatDateToYMD(date));
    if (clients.length > 0) setNewTaskClientId(clients[0].id);
    setNewTaskAddTime(false);
    setNewTaskTime('09:00');
    setShowAddTaskModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="p-6 max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-80px)]"
      id="calendar-view-root"
    >
      <AppleToast message={notif} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-serif font-light tracking-normal text-white flex items-center gap-2">
            Workspace Calendar
            <span className="text-xs font-mono font-normal text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
              Live Task Sync
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-light">
            Track target delivery timelines, contract SLA renewals, and synced task due dates in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSyncGoogleCalendar}
              disabled={syncingGoogle}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              title="Sync app tasks automatically to Google Calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
              <span>{syncingGoogle ? 'Syncing...' : 'Sync Google Calendar'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGoogleHelpModal(true)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Why does Google show 'App isn't verified' screen?"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => openAddTaskForDate(new Date())}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Task
          </button>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-zinc-950/50 border border-white/5 p-1 rounded-lg">
            <button
              onClick={prevMonth}
              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-white px-2.5 min-w-[120px] text-center">
              {formatMonthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-white/5 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-zinc-500 p-6 shrink-0">Loading calendar schedule...</p>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/20 border border-white/5 rounded-xl overflow-hidden shadow-2xl">
          {/* Days of week titles */}
          <div className="grid grid-cols-7 bg-zinc-950/80 border-b border-white/5 text-[10px] font-bold uppercase text-zinc-500 text-center py-2 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Days Grid cells */}
          <div className="flex-1 grid grid-cols-7 min-h-0 divide-x divide-y divide-white/4">
            {daysGrid.map((day, idx) => {
              const dayEvents = day ? getEventsForDate(day) : [];
              const isToday = day ? day.toDateString() === new Date().toDateString() : false;
              const isSelected = selectedDay && day && selectedDay.toDateString() === day.toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(day)}
                  className={`p-2 min-h-0 flex flex-col justify-between overflow-hidden relative transition-colors cursor-pointer ${
                    !day ? 'bg-zinc-950/10 cursor-default' : 'hover:bg-white/3'
                  } ${isToday ? 'bg-white/2' : ''} ${isSelected ? 'ring-1 ring-white/30 bg-white/4' : ''}`}
                >
                  {day && (
                    <div className="flex justify-between items-start shrink-0">
                      <span
                        className={`text-[10px] font-semibold flex items-center justify-center w-5 h-5 rounded-full ${
                          isToday ? 'bg-white text-black font-extrabold shadow-md' : 'text-zinc-400'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[8px] bg-white/5 text-zinc-400 border border-white/8 px-1.5 py-0.5 rounded-full font-bold">
                          {dayEvents.length} Event{dayEvents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Day Events Viewport */}
                  {day && dayEvents.length > 0 && (
                    <div className="flex-1 mt-1.5 space-y-1 overflow-y-auto pr-0.5 scrollbar-none select-none">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className={`p-1.5 rounded text-[8px] font-semibold border truncate max-w-full flex items-center gap-1 leading-none transition-all ${
                            ev.type === 'delivery'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                              : ev.type === 'renewal'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/15'
                              : ev.type === 'task'
                              ? ev.isCompleted
                                ? 'bg-zinc-900/60 text-zinc-500 border-white/5 line-through'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/15'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                          }`}
                          title={`${ev.title}${ev.clientName ? ` (${ev.clientName})` : ''}`}
                        >
                          {ev.type === 'delivery' && <FileCheck className="w-2.5 h-2.5 shrink-0" />}
                          {ev.type === 'renewal' && <RefreshCw className="w-2.5 h-2.5 shrink-0" />}
                          {ev.type === 'task' &&
                            (ev.isCompleted ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                            ))}
                          {ev.type === 'reminder' && <AlertCircle className="w-2.5 h-2.5 shrink-0" />}
                          <span className="truncate">{ev.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[7px] text-zinc-500 text-right font-medium">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Schedule Detail Sheet / Drawer */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-end"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ x: '100%', filter: 'blur(10px)' }}
              animate={{ x: 0, filter: 'blur(0px)' }}
              exit={{ x: '100%', filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-md bg-zinc-900 border-l border-white/10 h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {selectedDay.toLocaleDateString(undefined, {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {getEventsForDate(selectedDay).length} Scheduled Item(s)
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Day Items List */}
                <div className="space-y-3">
                  {getEventsForDate(selectedDay).length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-500 font-medium">No items scheduled for this date.</p>
                      <button
                        onClick={() => openAddTaskForDate(selectedDay)}
                        className="mt-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        + Schedule Task
                      </button>
                    </div>
                  ) : (
                    getEventsForDate(selectedDay).map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                          ev.type === 'delivery'
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                            : ev.type === 'renewal'
                            ? 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                            : ev.type === 'task'
                            ? ev.isCompleted
                              ? 'bg-zinc-950/40 border-white/5 text-zinc-500'
                              : 'bg-sky-950/20 border-sky-500/20 text-sky-300'
                            : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {ev.type === 'task' && ev.rawTask ? (
                            <button
                              onClick={() => handleToggleTask(ev.rawTask!)}
                              className="mt-0.5 text-zinc-400 hover:text-white cursor-pointer shrink-0"
                            >
                              <CheckCircle2
                                className={`w-4 h-4 ${ev.isCompleted ? 'text-emerald-400 fill-emerald-400/20' : ''}`}
                              />
                            </button>
                          ) : ev.type === 'delivery' ? (
                            <FileCheck className="w-4 h-4 mt-0.5 shrink-0" />
                          ) : ev.type === 'renewal' ? (
                            <RefreshCw className="w-4 h-4 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <h4
                              className={`text-xs font-semibold leading-snug ${
                                ev.isCompleted ? 'line-through text-zinc-500' : 'text-white'
                              }`}
                            >
                              {ev.title}
                            </h4>
                            {ev.clientName && (
                              <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-zinc-500" />
                                {ev.clientName}
                              </p>
                            )}
                          </div>
                        </div>

                        {ev.type === 'task' && ev.rawTask && (
                          <button
                            onClick={() => handleDeleteTask(ev.rawTask!.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 cursor-pointer shrink-0"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => openAddTaskForDate(selectedDay)}
                  className="w-full py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Add Task For This Date
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddTaskModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddTaskModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.95, opacity: 0, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Schedule Calendar Task
                </h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Follow up on proposal"
                    className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div className="space-y-2 pt-1 pb-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="calendarTaskAddTime"
                      checked={newTaskAddTime}
                      onChange={(e) => setNewTaskAddTime(e.target.checked)}
                      className="rounded border-white/10 text-white bg-transparent focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor="calendarTaskAddTime" className="text-zinc-400 font-medium cursor-pointer select-none flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      Add Time
                    </label>
                  </div>

                  {newTaskAddTime && (
                    <div className="p-3 bg-zinc-950/80 border border-white/10 rounded-xl space-y-2.5 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-zinc-400 font-semibold">Scheduled Time</label>
                        <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {formatTime12h(newTaskTime)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={newTaskTime}
                          onChange={(e) => setNewTaskTime(e.target.value)}
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
                            onClick={() => setNewTaskTime(t.val)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                              newTaskTime === t.val
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

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Assign Client</label>
                  <select
                    value={newTaskClientId}
                    onChange={(e) => setNewTaskClientId(e.target.value)}
                    className="w-full p-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Low', 'Medium', 'High'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setNewTaskPriority(p)}
                        className={`py-2 rounded-xl font-semibold border text-center cursor-pointer transition-all ${
                          newTaskPriority === p
                            ? 'bg-white/15 text-white border-white/30'
                            : 'bg-zinc-950 text-zinc-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 cursor-pointer shadow-lg"
                  >
                    Save &amp; Sync
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Google OAuth Verification Info Modal */}
        {showGoogleHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowGoogleHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#18191b] border border-white/15 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-light text-xl text-white">Google Verification Guide</h3>
                    <p className="text-xs text-zinc-400">Why Google shows "App isn't verified" and how to proceed</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoogleHelpModal(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-light">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                  <strong className="font-semibold block mb-1">What is this warning?</strong>
                  Google automatically displays <span className="underline">"Google hasn't verified this app"</span> for any custom or new application requesting access to sensitive Google APIs (like Calendar or Gmail) before it undergoes Google's verification process.
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">How to connect immediately (Quick Bypass):</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 pl-1">
                    <li>When the Google popup appears, click <strong>"Advanced"</strong> at the bottom left.</li>
                    <li>Click <strong>"Go to ProspectOS (unverified)"</strong> (or Go to app).</li>
                    <li>Click <strong>"Allow" / "Continue"</strong> to finish granting permissions.</li>
                  </ol>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white">Why is a Service Account the Project Owner?</h4>
                  <p className="text-zinc-400">
                    In AI Studio Build, OAuth clients are provisioned automatically by AI Studio's system service account on your behalf. Because AI Studio manages the underlying Cloud project, you don't need to manually configure GCP Console.
                  </p>
                  <p className="text-zinc-300 font-medium pt-1">
                    To connect your Google Calendar: simply click <strong>"Advanced"</strong> &rarr; <strong>"Go to ProspectOS (unverified)"</strong>. This is standard behavior for development builds and grants your app access securely.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGoogleHelpModal(false)}
                  className="px-5 py-2 rounded-lg bg-white text-black font-medium text-xs hover:bg-zinc-200 cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
