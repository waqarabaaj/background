import React, { useState } from 'react';
import { Layers, Plus, ExternalLink, Trash2, X } from 'lucide-react';
import type { ProjectItem, ProjectStatus } from '../../types';

interface ProjectsViewProps {
  projects: ProjectItem[];
  onAddProject: (p: Omit<ProjectItem, 'id' | 'updatedAt'>) => void;
  onUpdateProject: (id: string, patch: Partial<ProjectItem>) => void;
  onDeleteProject: (id: string) => void;
}

const COLUMNS: Array<{ status: ProjectStatus; accent: string }> = [
  { status: 'Planning', accent: 'text-sky-300 border-sky-400/35' },
  { status: 'In Progress', accent: 'text-purple-300 border-purple-400/35' },
  { status: 'Active', accent: 'text-emerald-300 border-emerald-400/35' },
  { status: 'Completed', accent: 'text-teal-300 border-teal-400/35' },
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('In Progress');
  const [repoUrl, setRepoUrl] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddProject({
      name: name.trim(),
      description: description.trim(),
      status,
      progress: status === 'Completed' ? 100 : status === 'Active' ? 70 : status === 'In Progress' ? 35 : 10,
      repoUrl: repoUrl.trim() || undefined,
      tags: tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setName('');
    setDescription('');
    setRepoUrl('');
    setTagsRaw('');
    setCreating(false);
  };

  return (
    <div className="py-3 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> Project Board
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track milestones, progress, and live repositories across your projects
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="purple-glow-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = projects.filter((p) => p.status === col.status);
          return (
            <div key={col.status} className="glass-card rounded-2xl p-3.5 flex flex-col gap-3 min-h-[380px]">
              <div className={`flex items-center justify-between pb-2 border-b ${col.accent}`}>
                <span className="text-xs font-bold uppercase tracking-wider">{col.status}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/8 text-[11px] text-slate-300">
                  {items.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {items.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-xl bg-white/[0.04] border border-purple-500/20 hover:border-purple-400/50 p-3.5 space-y-2.5 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white leading-snug">
                        {proj.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(proj.id)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {proj.description && (
                      <p className="text-xs text-slate-300/80 leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    {/* Progress slider */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Progress</span>
                        <span className="text-purple-200 font-semibold">{proj.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={proj.progress}
                        onChange={(e) =>
                          onUpdateProject(proj.id, { progress: Number(e.target.value) })
                        }
                        className="w-full h-1.5 accent-purple-500 cursor-pointer"
                      />
                    </div>

                    {proj.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-purple-500/15 text-[10px] text-purple-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/8">
                      <select
                        value={proj.status}
                        onChange={(e) =>
                          onUpdateProject(proj.id, {
                            status: e.target.value as ProjectStatus,
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-[#161231] border border-purple-500/25 text-[11px] text-slate-200"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.status}
                          </option>
                        ))}
                      </select>

                      {proj.repoUrl && (
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-purple-300 hover:text-purple-100 flex items-center gap-1"
                        >
                          Repo <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {creating && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCreating(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreate}
            className="glass-card rounded-2xl p-5 w-full max-w-md border-purple-400/45 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Create Project</h3>
              <button type="button" onClick={() => setCreating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
              >
                {COLUMNS.map((c) => (
                  <option key={c.status} value={c.status}>
                    {c.status}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                placeholder="Tags (comma separated)"
                className="px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
              />
            </div>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Repository URL (optional)"
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/8 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="purple-glow-btn px-4 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
