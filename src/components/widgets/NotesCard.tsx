import React, { useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import type { NoteItem } from '../../types';

interface NotesCardProps {
  notes: NoteItem[];
  onAddNote: (title: string) => NoteItem;
  onSelectNote: (noteId: string) => void;
  onOpenNotesView: () => void;
}

export const NotesCard: React.FC<NotesCardProps> = ({
  notes,
  onAddNote,
  onSelectNote,
  onOpenNotesView,
}) => {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const visibleNotes = [...notes]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned))
    .slice(0, 5);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddNote(title.trim());
    setTitle('');
    setAdding(false);
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onOpenNotesView}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14.5px] font-semibold text-white group-hover:text-purple-200 transition-colors">
              Notes
            </h2>
          </button>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            title="Quick add note"
            className="w-6 h-6 rounded-lg hover:bg-purple-500/20 text-purple-200/80 hover:text-white flex items-center justify-center cursor-pointer"
          >
            {adding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {adding && (
          <form onSubmit={handleAdd} className="mb-2.5 flex gap-1.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quick note title..."
              autoFocus
              className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white/8 border border-purple-400/40 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white cursor-pointer"
            >
              Add
            </button>
          </form>
        )}

        <ul className="space-y-2 max-h-[120px] overflow-y-auto pr-0.5">
          {visibleNotes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => onSelectNote(note.id)}
                className="w-full flex items-center gap-2 text-left text-[12.5px] text-slate-200/90 hover:text-purple-200 transition-colors cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span className="truncate">{note.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
