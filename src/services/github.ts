import type { GitHubActivityData, GitHubContributionDay } from '../types';

const GH_CACHE_KEY = 'waqar_github_cache_v1';
const CACHE_TTL_MS = 15 * 60 * 1000;

function computeStreak(days: GitHubContributionDay[]): number {
  if (!days.length) return 0;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const todayStr = new Date().toISOString().slice(0, 10);
  let idx = sorted.length - 1;
  // Walk back to today or latest available date <= today
  while (idx >= 0 && sorted[idx].date > todayStr) idx--;
  if (idx < 0) return 0;
  // If today has 0 commits so far, streak still continues from yesterday
  if (sorted[idx].date === todayStr && sorted[idx].count === 0) {
    idx--;
  }
  let streak = 0;
  while (idx >= 0 && sorted[idx].count > 0) {
    streak++;
    idx--;
  }
  return streak;
}

function computeWeeklyCommits(days: GitHubContributionDay[]): number {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  return last7.reduce((sum, d) => sum + d.count, 0);
}

async function fetchViaGraphQL(
  username: string,
  token: string
): Promise<GitHubActivityData> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;
  const levelMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4,
  };

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!res.ok) throw new Error(`GitHub GraphQL error (${res.status})`);
  const json = await res.json();
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal) throw new Error('User not found or token lacks read:user scope');

  const days: GitHubContributionDay[] = [];
  for (const w of cal.weeks || []) {
    for (const d of w.contributionDays || []) {
      days.push({
        date: d.date,
        count: Number(d.contributionCount || 0),
        level: levelMap[d.contributionLevel] ?? 0,
      });
    }
  }

  return {
    username,
    streak: computeStreak(days),
    weeklyCommits: computeWeeklyCommits(days),
    totalLastYear: Number(cal.totalContributions || 0),
    days: days.slice(-112), // last 16 weeks (7 x 16 grid)
    profileUrl: `https://github.com/${encodeURIComponent(username)}`,
    source: 'graphql',
    updatedAt: Date.now(),
  };
}

export async function fetchGitHubActivity(
  username: string,
  token?: string,
  forceRefresh = false
): Promise<GitHubActivityData> {
  const cleanUser = username.trim().replace(/^@/, '');
  if (!cleanUser) {
    return {
      username: '',
      streak: 0,
      weeklyCommits: 0,
      totalLastYear: 0,
      days: [],
      profileUrl: 'https://github.com',
      source: 'unconfigured',
      updatedAt: Date.now(),
    };
  }

  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(GH_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as GitHubActivityData;
        if (
          cached.username.toLowerCase() === cleanUser.toLowerCase() &&
          Date.now() - cached.updatedAt < CACHE_TTL_MS &&
          !cached.error
        ) {
          return cached;
        }
      }
    } catch {
      // Ignore
    }
  }

  if (token && token.trim()) {
    try {
      const gql = await fetchViaGraphQL(cleanUser, token.trim());
      localStorage.setItem(GH_CACHE_KEY, JSON.stringify(gql));
      return gql;
    } catch {
      // Fall back to public contributions API
    }
  }

  // Public GitHub contributions API (no token needed!)
  const url = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(
    cleanUser
  )}?y=last`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `GitHub user "${cleanUser}" not found`
        : `GitHub API error (${res.status})`
    );
  }
  const json = await res.json();
  const contributions: GitHubContributionDay[] = Array.isArray(json.contributions)
    ? json.contributions.map((c: { date: string; count: number; level: number }) => ({
        date: c.date,
        count: Number(c.count || 0),
        level: Math.max(0, Math.min(4, Number(c.level || 0))) as 0 | 1 | 2 | 3 | 4,
      }))
    : [];

  const totalLastYear =
    typeof json.total?.lastYear === 'number'
      ? json.total.lastYear
      : contributions.reduce((acc, c) => acc + c.count, 0);

  const data: GitHubActivityData = {
    username: cleanUser,
    streak: computeStreak(contributions),
    weeklyCommits: computeWeeklyCommits(contributions),
    totalLastYear,
    days: contributions.slice(-112), // 16 weeks x 7 days
    profileUrl: `https://github.com/${encodeURIComponent(cleanUser)}`,
    source: 'live-api',
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(GH_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore
  }

  return data;
}
