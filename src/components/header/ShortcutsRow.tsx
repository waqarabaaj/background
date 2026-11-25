import React, { useState } from 'react';
import { Plus, X, Globe } from 'lucide-react';
import type { ShortcutItem } from '../../types';

interface ShortcutsRowProps {
  shortcuts: ShortcutItem[];
  onAdd: (item: Omit<ShortcutItem, 'id'>) => void;
  onDelete: (id: string) => void;
}

function ShortcutIcon({ item }: { item: ShortcutItem }) {
  switch (item.iconType) {
    case 'gmail':
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8">
          <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z" />
          <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z" />
          <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17" />
          <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z" />
          <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z" />
        </svg>
      );
    case 'drive':
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8">
          <path fill="#ffc107" d="M17 6L31 6 45 30 31 30z" />
          <path fill="#1976d2" d="M9.875 42L16.938 30 45 30 38 42z" />
          <path fill="#4caf50" d="M3 30.125L9.875 42 24 18 17 6z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 48 48" className="w-8 h-8">
          <rect x="6" y="8" width="36" height="34" rx="5" fill="#fff" />
          <path fill="#1976d2" d="M6 13a5 5 0 0 1 5-5h26a5 5 0 0 1 5 5v5H6v-5z" />
          <path fill="#4caf50" d="M36 42h1a5 5 0 0 0 5-5v-1h-6v6z" />
          <path fill="#fbc02d" d="M6 36v1a5 5 0 0 0 5 5h1v-6H6z" />
          <path fill="#e53935" d="M36 36h6v-6h-6v6z" />
          <text x="24" y="34" textAnchor="middle" fill="#1976d2" fontSize="16" fontWeight="800" fontFamily="sans-serif">
            {new Date().getDate()}
          </text>
        </svg>
      );
    case 'notion':
      return (
        <div className="w-8 h-8 rounded-lg bg-white text-slate-950 font-serif font-black text-xl flex items-center justify-center shadow-sm">
          N
        </div>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.03 11.03 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15v3.19c0 .31.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
      );
    case 'chatgpt':
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 stroke-emerald-400 fill-none" strokeWidth="1.6">
          <path d="M12 2.5a4.5 4.5 0 0 1 4.1 2.65 4.5 4.5 0 0 1 3.55 6.85 4.5 4.5 0 0 1-1.9 7.25A4.5 4.5 0 0 1 12 21.5a4.5 4.5 0 0 1-4.1-2.65 4.5 4.5 0 0 1-3.55-6.85 4.5 4.5 0 0 1 1.9-7.25A4.5 4.5 0 0 1 12 2.5z" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
    case 'figma':
      return (
        <svg viewBox="0 0 38 57" className="w-6 h-8">
          <path fill="#1abcfe" d="M19 28.5A9.5 9.5 0 1 1 28.5 19 9.5 9.5 0 0 1 19 28.5z" />
          <path fill="#0acf83" d="M9.5 47.5A9.5 9.5 0 0 1 19 38v9.5a9.5 9.5 0 0 1-9.5 0z" />
          <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 0 0 0-19H19z" />
          <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
          <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
        </svg>
      );
    case 'linkedin':
      return (
        <div className="w-8 h-8 rounded-lg bg-[#0a66c2] text-white font-bold text-lg flex items-center justify-center">
          in
        </div>
      );
    default: {
      let host = '';
      try {
        host = new URL(item.url).hostname;
      } catch {
        // Ignore
      }
      return host ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
          alt={item.name}
          className="w-7 h-7 rounded-md"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <Globe className="w-7 h-7 text-purple-300" />
      );
    }
  }
}

export const ShortcutsRow: React.FC<ShortcutsRowProps> = ({
  shortcuts,
  onAdd,
  onDelete,
}) => {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    const formattedUrl = /^https?:\/\//i.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    onAdd({
      name: name.trim(),
      url: formattedUrl,
      iconType: 'custom',
    });
    setName('');
    setUrl('');
    setAdding(false);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-center gap-2.5 xl:gap-3">
        {shortcuts.map((item) => (
          <div key={item.id} className="relative group">
            <a
              href={item.url}
              className="shortcut-tile w-[76px] h-[78px] xl:w-[82px] xl:h-[82px] rounded-2xl flex flex-col items-center justify-center gap-1.5 px-1.5"
            >
              <div className="h-8 flex items-center justify-center">
                <ShortcutIcon item={item} />
              </div>
              <span className="text-[11.5px] font-medium text-slate-200/90 truncate max-w-full">
                {item.name}
              </span>
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onDelete(item.id);
              }}
              title={`Remove ${item.name}`}
              className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#1a1536] border border-purple-400/50 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-opacity cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* + Add Tile */}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="shortcut-tile w-[76px] h-[78px] xl:w-[82px] xl:h-[82px] rounded-2xl flex flex-col items-center justify-center gap-1.5 border-dashed border-purple-400/35 hover:border-purple-400/75 cursor-pointer"
        >
          <Plus className="w-6 h-6 text-purple-200/80" />
          <span className="text-[11.5px] font-medium text-slate-300/80">Add</span>
        </button>
      </div>

      {/* Add Shortcut Modal */}
      {adding && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAdding(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="glass-card rounded-2xl p-5 w-full max-w-sm border-purple-400/40"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Add Shortcut</h3>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. YouTube"
                  className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">URL</label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com"
                  className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/8 text-xs font-medium text-slate-200 hover:bg-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="purple-glow-btn px-4 py-1.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
              >
                Save Shortcut
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
