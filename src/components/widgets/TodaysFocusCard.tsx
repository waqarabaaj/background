import React, { useState } from 'react';
import { Target, Plus, Check, Trash2 } from 'lucide-react';
import type { TaskItem } from '../../types';

interface TodaysFocusCardProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenTasksView: () => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  tasks,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onOpenTasksView,
}) => {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const focusTasks = tasks.filter((t) => t.pinnedToToday);
  const total = focusTasks.length;
  const completed = focusTasks.filter((t) => t.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim());
    setNewTitle('');
    setAdding(false);
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onOpenTasksView}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <Target className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14.5px] font-semibold text-white group-hover:text-purple-200 transition-colors">
              Today&apos;s Focus
            </h2>
          </button>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            title="Add today's focus task"
            className="w-6 h-6 rounded-lg hover:bg-purple-500/20 text-purple-200/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Progress header + glowing bar */}
        <div className="flex items-center justify-between text-[11.5px] mb-1.5">
          <span className="text-slate-300/80">
            {completed} of {total} completed
          </span>
          <span className="font-semibold text-purple-200 tabular-nums">{percent}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-purple-950/80 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-400 shadow-[0_0_12px_rgba(168,85,247,0.85)] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="mb-2.5 flex gap-1.5">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New focus task..."
              autoFocus
              className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white/8 border border-purple-400/40 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        {/* Checklist */}
        <ul className="space-y-1.5 max-h-[132px] overflow-y-auto pr-0.5">
          {focusTasks.length === 0 ? (
            <li className="text-xs text-slate-400 py-3 text-center">
              No focus tasks yet. Click + to add one.
            </li>
          ) : (
            focusTasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center justify-between gap-2 text-[12.5px] py-0.5"
              >
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded-[5px] shrink-0 flex items-center justify-center border transition-all ${
                      task.completed
                        ? 'bg-purple-600 border-purple-400 shadow-[0_0_8px_rgba(147,51,234,0.75)]'
                        : 'border-slate-500/70 bg-white/[0.03] group-hover:border-purple-400'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </span>
                  <span
                    className={`truncate transition-colors ${
                      task.completed
                        ? 'text-slate-300/65 line-through decoration-purple-400/60'
                        : 'text-slate-100/95 group-hover:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  title="Delete task"
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
