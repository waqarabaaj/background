import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Edit3, Check } from 'lucide-react';
import type { GitHubActivityData, GitHubContributionDay } from '../../types';
import { fetchGitHubActivity } from '../../services/github';

interface GitHubActivityCardProps {
  username: string;
  token?: string;
  onSaveUsername: (username: string) => void;
}

const LEVEL_CLASSES: Record<number, string> = {
  0: 'bg-purple-950/70 border border-purple-500/10',
  1: 'bg-purple-800/75',
  2: 'bg-purple-600/85',
  3: 'bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.55)]',
  4: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.75)]',
};

// Subtle empty grid when no username connected yet
const PLACEHOLDER_GRID: GitHubContributionDay[] = Array.from({ length: 112 }, (_, i) => ({
  date: '',
  count: 0,
  level: 0,
  ...(i === 999 ? {} : {}),
}));

export const GitHubActivityCard: React.FC<GitHubActivityCardProps> = ({
  username,
  token,
  onSaveUsername,
}) => {
  const [activity, setActivity] = useState<GitHubActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!username);
  const [inputUser, setInputUser] = useState(username);
  const [hovered, setHovered] = useState<GitHubContributionDay | null>(null);

  const load = async (user: string, force = false) => {
    if (!user.trim()) {
      setActivity(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGitHubActivity(user, token, force);
      setActivity(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load GitHub data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInputUser(username);
    if (username) {
      setEditing(false);
      load(username, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, token]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputUser.trim().replace(/^@/, '');
    if (!cleaned) return;
    onSaveUsername(cleaned);
    setEditing(false);
    load(cleaned, true);
  };

  const days = activity?.days?.length ? activity.days : PLACEHOLDER_GRID;
  // Organize into 16 columns x 7 rows (weeks left->right)
  const columns: GitHubContributionDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.03 11.03 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.15v3.19c0 .31.21.66.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
            <h2 className="text-[14.5px] font-semibold text-white">GitHub Activity</h2>
          </div>

          <div className="flex items-center gap-1">
            {username && (
              <button
                type="button"
                onClick={() => load(username, true)}
                title="Refresh GitHub activity"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              title="Set GitHub username"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <a
              href={activity?.profileUrl || 'https://github.com'}
              target="_blank"
              rel="noreferrer"
              title="Open GitHub profile"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Connect username form */}
        {editing ? (
          <form onSubmit={handleSave} className="mb-2.5 flex gap-1.5">
            <input
              type="text"
              value={inputUser}
              onChange={(e) => setInputUser(e.target.value)}
              placeholder="GitHub username (e.g. torvalds)"
              className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-white/8 border border-purple-400/40 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3 h-3" /> Connect
            </button>
          </form>
        ) : (
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-bold text-white tabular-nums">
                {activity ? activity.streak : 0}
              </span>
              <span className="text-xs text-slate-300">day streak 🔥</span>
            </div>
            <span className="text-[11px] text-purple-300/80">@{username}</span>
          </div>
        )}

        {error && (
          <div className="text-[11px] text-rose-300 mb-2 truncate" title={error}>
            {error}
          </div>
        )}

        {/* 16x7 Contribution Heatmap Grid */}
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          onMouseLeave={() => setHovered(null)}
        >
          {columns.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-[3px]">
              {week.map((day, dIdx) => (
                <div
                  key={`${wIdx}-${dIdx}`}
                  onMouseEnter={() => day.date && setHovered(day)}
                  className={`aspect-square rounded-[2.5px] transition-transform hover:scale-125 ${
                    LEVEL_CLASSES[day.level]
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Footer info / hover tooltip */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-300/80">
        {hovered ? (
          <span className="text-purple-200 truncate">
            {hovered.count} contribution{hovered.count === 1 ? '' : 's'} on {hovered.date}
          </span>
        ) : activity ? (
          <>
            <span>
              This week: <strong className="text-white">{activity.weeklyCommits} commits</strong>
            </span>
            <span className="text-slate-400">{activity.totalLastYear} / yr</span>
          </>
        ) : (
          <span className="text-slate-400">Connect GitHub username for live graph</span>
        )}
      </div>
    </div>
  );
};
