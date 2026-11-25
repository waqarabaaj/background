import React, { useState } from 'react';
import { Check, Plus, Trash2, Pin, Search, CheckSquare } from 'lucide-react';
import type { TaskItem } from '../../types';
import { formatLocalDateISO } from '../../store/useAppStore';

interface TasksViewProps {
  tasks: TaskItem[];
  onAddTask: (title: string, opts?: Partial<Omit<TaskItem, 'id' | 'title' | 'createdAt'>>) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (id: string, patch: Partial<TaskItem>) => void;
  onDeleteTask: (id: string) => void;
}

const PRIORITY_BADGE: Record<TaskItem['priority'], string> = {
  high: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
  medium: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  low: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
};

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'active' | 'done'>('all');
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [category, setCategory] = useState('Study');
  const [dueDate, setDueDate] = useState(() => formatLocalDateISO());
  const [pinnedToToday, setPinnedToToday] = useState(true);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim(), { priority, category, dueDate, pinnedToToday });
    setTitle('');
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'today' && !t.pinnedToToday) return false;
    if (filter === 'active' && t.completed) return false;
    if (filter === 'done' && !t.completed) return false;
    if (search.trim() && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-5xl mx-auto py-3 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-400" /> Tasks & Focus Queue
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {doneCount} of {tasks.length} tasks completed — pin items to display them on Today&apos;s Focus
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 pr-3 py-1.5 rounded-xl bg-white/7 border border-purple-500/25 text-xs text-white focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Add Task Bar */}
      <form
        onSubmit={handleAdd}
        className="glass-card rounded-2xl p-4 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center"
      >
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task..."
          className="md:col-span-5 px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-400"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskItem['priority'])}
          className="md:col-span-2 px-2.5 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
        >
          <option value="high">High Priority</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="md:col-span-2 px-2.5 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="md:col-span-2 px-2 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
        />
        <button
          type="submit"
          className="md:col-span-1 purple-glow-btn py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
        <label className="md:col-span-12 flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={pinnedToToday}
            onChange={(e) => setPinnedToToday(e.target.checked)}
            className="accent-purple-500"
          />
          <span>Pin directly to Home &quot;Today&apos;s Focus&quot; card</span>
        </label>
      </form>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(
          [
            ['all', `All (${tasks.length})`],
            ['today', `Today's Focus (${tasks.filter((t) => t.pinnedToToday).length})`],
            ['active', `Open (${tasks.filter((t) => !t.completed).length})`],
            ['done', `Completed (${doneCount})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
              filter === id
                ? 'bg-purple-600 text-white'
                : 'bg-white/6 text-slate-300 hover:bg-white/12'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-sm text-slate-400">
            No tasks match this filter.
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              className="glass-card rounded-xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border cursor-pointer ${
                    task.completed
                      ? 'bg-purple-600 border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.7)]'
                      : 'border-slate-500 hover:border-purple-400'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      task.completed ? 'line-through text-slate-400' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>{task.category}</span>
                    {task.dueDate && <span>• Due {task.dueDate}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium border capitalize ${
                    PRIORITY_BADGE[task.priority]
                  }`}
                >
                  {task.priority}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTask(task.id, { pinnedToToday: !task.pinnedToToday })
                  }
                  title={task.pinnedToToday ? "Unpin from Today's Focus" : "Pin to Today's Focus"}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    task.pinnedToToday
                      ? 'bg-purple-600/35 text-purple-200'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/10 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
