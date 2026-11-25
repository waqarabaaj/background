import React, { useState, useEffect } from 'react';
import { Bookmark, Folder, Plus, X, ExternalLink, Trash2, Chrome } from 'lucide-react';
import type { BookmarkFolder, FolderColor } from '../../types';
import {
  isChromeBookmarksAvailable,
  fetchChromeBookmarkFolders,
} from '../../services/chromeBookmarks';

interface BookmarksCardProps {
  folders: BookmarkFolder[];
  syncChromeBookmarks: boolean;
  onToggleSyncChrome: (enabled: boolean) => void;
  onAddLink: (folderId: string, title: string, url: string) => void;
  onDeleteLink: (folderId: string, linkId: string) => void;
}

const FOLDER_STYLE: Record<FolderColor, { bg: string; icon: string }> = {
  purple: {
    bg: 'bg-purple-500/16 border-purple-400/35 hover:border-purple-400/70',
    icon: 'text-purple-300',
  },
  blue: {
    bg: 'bg-sky-500/16 border-sky-400/35 hover:border-sky-400/70',
    icon: 'text-sky-300',
  },
  emerald: {
    bg: 'bg-emerald-500/16 border-emerald-400/35 hover:border-emerald-400/70',
    icon: 'text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-500/16 border-amber-400/35 hover:border-amber-400/70',
    icon: 'text-amber-300',
  },
  violet: {
    bg: 'bg-violet-500/16 border-violet-400/35 hover:border-violet-400/70',
    icon: 'text-violet-300',
  },
  fuchsia: {
    bg: 'bg-fuchsia-500/16 border-fuchsia-400/35 hover:border-fuchsia-400/70',
    icon: 'text-fuchsia-300',
  },
};

export const BookmarksCard: React.FC<BookmarksCardProps> = ({
  folders,
  syncChromeBookmarks,
  onToggleSyncChrome,
  onAddLink,
  onDeleteLink,
}) => {
  const [chromeFolders, setChromeFolders] = useState<BookmarkFolder[]>([]);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const chromeAvailable = isChromeBookmarksAvailable();

  useEffect(() => {
    if (syncChromeBookmarks && chromeAvailable) {
      fetchChromeBookmarkFolders()
        .then(setChromeFolders)
        .catch(() => setChromeFolders([]));
    }
  }, [syncChromeBookmarks, chromeAvailable]);

  const displayedFolders =
    syncChromeBookmarks && chromeFolders.length > 0 ? chromeFolders.slice(0, 6) : folders;

  const activeFolder =
    displayedFolders.find((f) => f.id === openFolderId) || null;
  const isReadonlyChrome = activeFolder?.id.startsWith('chrome_folder_') ?? false;

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFolder || !linkUrl.trim()) return;
    onAddLink(activeFolder.id, linkTitle.trim() || linkUrl.trim(), linkUrl.trim());
    setLinkTitle('');
    setLinkUrl('');
  };

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-400" />
            <h2 className="text-[14.5px] font-semibold text-white">Bookmarks</h2>
          </div>
          {chromeAvailable && (
            <button
              type="button"
              onClick={() => onToggleSyncChrome(!syncChromeBookmarks)}
              title={
                syncChromeBookmarks
                  ? 'Showing live Chrome Bookmarks (click for custom folders)'
                  : 'Sync live Chrome Bookmarks'
              }
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${
                syncChromeBookmarks
                  ? 'bg-purple-600/50 text-purple-100 border border-purple-400/50'
                  : 'bg-white/6 text-slate-400 hover:text-white'
              }`}
            >
              <Chrome className="w-3 h-3" />
              <span>{syncChromeBookmarks ? 'Chrome' : 'Sync'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {displayedFolders.slice(0, 6).map((folder) => {
            const st = FOLDER_STYLE[folder.color] || FOLDER_STYLE.purple;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setOpenFolderId(folder.id)}
                className={`rounded-xl border px-2.5 py-2.5 flex items-center gap-1.5 text-left transition-all cursor-pointer ${st.bg}`}
              >
                <Folder className={`w-3.5 h-3.5 shrink-0 ${st.icon}`} />
                <span className="text-[11.5px] font-medium text-slate-100 truncate">
                  {folder.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Folder Links Modal */}
      {activeFolder && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenFolderId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card rounded-2xl p-5 w-full max-w-md border-purple-400/45"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Folder
                  className={`w-5 h-5 ${(FOLDER_STYLE[activeFolder.color] || FOLDER_STYLE.purple).icon}`}
                />
                <h3 className="text-base font-semibold text-white">
                  {activeFolder.name}
                </h3>
                <span className="text-xs text-slate-400">
                  ({activeFolder.links.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpenFolderId(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto mb-4">
              {activeFolder.links.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  No links in this folder yet.
                </div>
              ) : (
                activeFolder.links.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-purple-500/15 transition-colors"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-sm text-slate-100 hover:text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{link.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{link.url}</div>
                      </div>
                    </a>
                    {!isReadonlyChrome && (
                      <button
                        type="button"
                        onClick={() => onDeleteLink(activeFolder.id, link.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {!isReadonlyChrome && (
              <form onSubmit={handleAddLink} className="space-y-2 pt-3 border-t border-purple-500/20">
                <div className="text-xs font-medium text-purple-200">Add bookmark</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="Title"
                    className="px-2.5 py-1.5 rounded-lg bg-white/7 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                  <input
                    type="text"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="px-2.5 py-1.5 rounded-lg bg-white/7 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <button
                  type="submit"
                  className="purple-glow-btn w-full py-1.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add to {activeFolder.name}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
