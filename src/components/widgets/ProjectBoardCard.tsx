import React, { useState } from 'react';
import { Layers, Plus, Folder, X } from 'lucide-react';
import type { ProjectItem, ProjectStatus } from '../../types';

interface ProjectBoardCardProps {
  projects: ProjectItem[];
  onAddProject: (p: Omit<ProjectItem, 'id' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, patch: Partial<ProjectItem>) => void;
  onOpenProjectsView: () => void;
}

const STATUS_ORDER: ProjectStatus[] = ['Planning', 'In Progress', 'Active', 'Completed'];

const STATUS_STYLE: Record<ProjectStatus, string> = {
  'In Progress':
    'bg-purple-600/35 text-purple-200 border border-purple-400/45 shadow-[0_0_10px_rgba(147,51,234,0.3)]',
  Active:
    'bg-emerald-600/30 text-emerald-200 border border-emerald-400/45 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
  Planning:
    'bg-blue-600/30 text-sky-200 border border-sky-400/45 shadow-[0_0_10px_rgba(56,189,248,0.25)]',
  Completed:
    'bg-teal-600/30 text-teal-200 border border-teal-400/45',
};

export const ProjectBoardCard: React.FC<ProjectBoardCardProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onOpenProjectsView,
}) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddProject({
      name: name.trim(),
      description: '',
      status,
      progress: status === 'Completed' ? 100 : status === 'Active' ? 75 : status === 'In Progress' ? 40 : 10,
      tags: [],
    });
    setName('');
    setAdding(false);
  };

  const cycleStatus = (proj: ProjectItem) => {
    const idx = STATUS_ORDER.indexOf(proj.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    onUpdateProject(proj.id, { status: next });
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onOpenProjectsView}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14.5px] font-semibold text-white group-hover:text-purple-200 transition-colors">
              Project Board
            </h2>
          </button>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            title="Add project"
            className="w-6 h-6 rounded-lg hover:bg-purple-500/20 text-purple-200/80 hover:text-white flex items-center justify-center cursor-pointer"
          >
            {adding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="mb-2.5 flex gap-1.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name..."
              autoFocus
              className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white/8 border border-purple-400/40 text-xs text-white focus:outline-none"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="px-1.5 py-1 rounded-lg bg-[#161231] border border-purple-500/30 text-[11px] text-white"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-0.5">
          {projects.slice(0, 4).map((proj) => (
            <div
              key={proj.id}
              className="flex items-center justify-between gap-2 text-[12.5px] group"
            >
              <button
                type="button"
                onClick={onOpenProjectsView}
                className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-300 shrink-0" />
                <span className="text-slate-100 truncate group-hover:text-white">
                  {proj.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => cycleStatus(proj)}
                title="Click to cycle status"
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold cursor-pointer transition-transform active:scale-95 ${
                  STATUS_STYLE[proj.status]
                }`}
              >
                {proj.status}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
