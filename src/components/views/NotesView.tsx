import React, { useState, useEffect } from 'react';
import { FileText, Plus, Pin, Trash2, Download, Search, Eye, Edit3 } from 'lucide-react';
import type { NoteItem } from '../../types';

interface NotesViewProps {
  notes: NoteItem[];
  initialSelectedId: string | null;
  onAddNote: (title: string, content?: string) => NoteItem;
  onUpdateNote: (id: string, patch: Partial<NoteItem>) => void;
  onDeleteNote: (id: string) => void;
}

function renderSimpleMarkdown(md: string): string {
  const esc = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc
    .replace(/^### (.*)$/gm, '<h3 class="text-base font-bold text-purple-200 mt-3 mb-1">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-lg font-bold text-white mt-4 mb-1.5">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="text-xl font-bold text-white mt-2 mb-2">$1</h1>')
    .replace(/^- \[x\] (.*)$/gm, '<div class="flex items-center gap-2 text-emerald-300"><span>☑</span><span class="line-through opacity-75">$1</span></div>')
    .replace(/^- \[ \] (.*)$/gm, '<div class="flex items-center gap-2 text-slate-200"><span>☐</span><span>$1</span></div>')
    .replace(/^- (.*)$/gm, '<div class="flex items-start gap-2 text-slate-200"><span class="text-purple-400">•</span><span>$1</span></div>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 text-xs font-mono">$1</code>')
    .replace(/\n/g, '<br/>');
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  initialSelectedId,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedId || notes[0]?.id || ''
  );
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (initialSelectedId) setSelectedId(initialSelectedId);
  }, [initialSelectedId]);

  const sorted = [...notes]
    .filter(
      (n) =>
        !search.trim() ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const active = notes.find((n) => n.id === selectedId) || sorted[0] || null;

  const handleCreate = () => {
    const created = onAddNote('Untitled Note', '# New Note\n\n- ');
    setSelectedId(created.id);
    setPreview(false);
  };

  const exportMarkdown = () => {
    if (!active) return;
    const blob = new Blob([active.content || active.title], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-3 grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-140px)] min-h-[500px]">
      {/* Left Note List */}
      <div className="lg:col-span-4 glass-card rounded-2xl p-4 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> Notes ({notes.length})
          </h2>
          <button
            type="button"
            onClick={handleCreate}
            className="purple-glow-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/7 border border-purple-500/25 text-xs text-white focus:outline-none focus:border-purple-400"
          />
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
          {sorted.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => setSelectedId(note.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                active?.id === note.id
                  ? 'bg-purple-600/30 border-purple-400/55 text-white'
                  : 'bg-white/[0.03] border-transparent hover:bg-white/[0.07] text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold truncate">{note.title}</span>
                {note.pinned && <Pin className="w-3 h-3 text-purple-300 shrink-0" />}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-1">
                {note.content.replace(/[#*\-`]/g, '').trim() || 'Empty note'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Markdown Editor / Preview */}
      <div className="lg:col-span-8 glass-card rounded-2xl p-5 flex flex-col min-h-0">
        {active ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-purple-500/20">
              <input
                type="text"
                value={active.title}
                onChange={(e) => onUpdateNote(active.id, { title: e.target.value })}
                className="flex-1 min-w-[200px] bg-transparent text-lg font-bold text-white focus:outline-none"
                placeholder="Note title..."
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreview((p) => !p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                    preview
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/8 text-slate-200 hover:bg-white/15'
                  }`}
                >
                  {preview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{preview ? 'Edit' : 'Preview'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateNote(active.id, { pinned: !active.pinned })}
                  title="Pin to Home Notes card"
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    active.pinned
                      ? 'bg-purple-600/40 text-purple-200'
                      : 'bg-white/8 text-slate-400 hover:text-white'
                  }`}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={exportMarkdown}
                  title="Download .md"
                  className="p-1.5 rounded-lg bg-white/8 text-slate-300 hover:text-white cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteNote(active.id)}
                  title="Delete note"
                  className="p-1.5 rounded-lg bg-white/8 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {preview ? (
              <div
                className="flex-1 overflow-y-auto text-sm leading-relaxed text-slate-200 pr-2"
                dangerouslySetInnerHTML={{
                  __html: renderSimpleMarkdown(active.content),
                }}
              />
            ) : (
              <textarea
                value={active.content}
                onChange={(e) => onUpdateNote(active.id, { content: e.target.value })}
                placeholder="Write in Markdown... (# headings, - bullets, - [ ] checkboxes, **bold**, `code`)"
                className="flex-1 w-full bg-transparent text-sm font-mono leading-relaxed text-slate-100 focus:outline-none resize-none"
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Select a note or click &quot;New&quot; to start writing.
          </div>
        )}
      </div>
    </div>
  );
};
