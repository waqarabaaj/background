import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AppData,
  TaskItem,
  ProjectItem,
  NoteItem,
  CalendarEvent,
  BookmarkFolder,
  BookmarkLink,
  ShortcutItem,
  ChatMessage,
  UserSettings,
} from '../types';

const STORAGE_KEY = 'waqar_command_center_v1';

export function formatLocalDateISO(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return formatLocalDateISO(d);
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultData(): AppData {
  const today = new Date();
  const todayISO = formatLocalDateISO(today);
  const tomorrowISO = addDaysISO(today, 1);
  const nextWeekISO = addDaysISO(today, 3);

  return {
    tasks: [
      {
        id: 't1',
        title: 'Prepare Open Doors exam',
        completed: true,
        pinnedToToday: true,
        priority: 'high',
        category: 'Study',
        dueDate: todayISO,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 't2',
        title: 'Update Pavia documents',
        completed: true,
        pinnedToToday: true,
        priority: 'high',
        category: 'Scholarships',
        dueDate: todayISO,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 't3',
        title: 'Finalize UCY lab email draft',
        completed: true,
        pinnedToToday: true,
        priority: 'medium',
        category: 'Research',
        dueDate: todayISO,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: 't4',
        title: 'Code automation queue',
        completed: false,
        pinnedToToday: true,
        priority: 'high',
        category: 'Projects',
        dueDate: todayISO,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 't5',
        title: 'Gym / Workout',
        completed: false,
        pinnedToToday: true,
        priority: 'medium',
        category: 'Health',
        dueDate: todayISO,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 't6',
        title: 'Read AI research paper',
        completed: false,
        pinnedToToday: false,
        priority: 'medium',
        category: 'Research',
        dueDate: tomorrowISO,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 't7',
        title: 'Review Khanam Crafts checkout flow',
        completed: false,
        pinnedToToday: false,
        priority: 'medium',
        category: 'Projects',
        dueDate: tomorrowISO,
        createdAt: new Date().toISOString(),
      },
      {
        id: 't8',
        title: 'Benchmark TinyML quantized model',
        completed: false,
        pinnedToToday: false,
        priority: 'low',
        category: 'Research',
        dueDate: nextWeekISO,
        createdAt: new Date().toISOString(),
      },
    ],
    projects: [
      {
        id: 'p1',
        name: 'Medicare Automation',
        description: 'Automated task queue, monitoring pipeline, and status dashboard for Medicare workflows.',
        status: 'In Progress',
        progress: 68,
        repoUrl: 'https://github.com',
        tags: ['Automation', 'Queue', 'TypeScript'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p2',
        name: 'Khanam Crafts (E-commerce)',
        description: 'Modern artisan e-commerce storefront with fast catalog search and checkout experience.',
        status: 'Active',
        progress: 82,
        repoUrl: 'https://github.com',
        tags: ['E-commerce', 'Web', 'UI'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'p3',
        name: 'UCY Research Plan (TinyML)',
        description: 'Research proposal, literature review, and edge inference benchmarks for TinyML systems.',
        status: 'Planning',
        progress: 30,
        tags: ['TinyML', 'AI', 'Research'],
        updatedAt: new Date().toISOString(),
      },
    ],
    notes: [
      {
        id: 'n1',
        title: 'UCY: Lab fit + research questions',
        content:
          '# UCY Lab Fit & Questions\n\n- Align TinyML efficiency work with embedded AI lab focus\n- Ask about hardware testbeds (Cortex-M / ESP32 / Jetson)\n- Prepare 2-minute summary of past automation & ML projects',
        pinned: true,
        tags: ['Research', 'UCY'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'n2',
        title: 'Open Doors: Math + AI (20 Nov)',
        content:
          '# Open Doors Exam Prep\n\n- Linear Algebra: eigenvalues, SVD, matrix calculus\n- Probability & Statistics: Bayes, distributions, MLE\n- Machine Learning: regularization, backprop, transformers',
        pinned: true,
        tags: ['Study', 'Exam'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'n3',
        title: 'Pavia: docs + IELTS (till April)',
        content:
          '# University of Pavia Checklist\n\n- [x] Transcripts & degree attestation\n- [x] Updated CV & SOP\n- [ ] IELTS Academic target score 7.5+\n- [ ] Reference letters uploaded before April deadline',
        pinned: true,
        tags: ['Scholarships'],
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'n4',
        title: 'Huawei: automation & monitoring',
        content:
          '# Huawei Automation Notes\n\n- Telemetry alert thresholds & automated recovery triggers\n- Structured logging with queue backpressure metrics\n- Daily digest summary script',
        pinned: true,
        tags: ['Automation', 'Ops'],
        updatedAt: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 'e1',
        title: 'UCY Interview (10 min)',
        date: todayISO,
        startTime: '17:00',
        durationMin: 15,
        category: 'meeting',
        notes: 'Quick intro call on TinyML research fit.',
      },
      {
        id: 'e2',
        title: 'Open Doors Exam Prep',
        date: todayISO,
        startTime: '19:00',
        durationMin: 90,
        category: 'study',
        notes: 'Timed practice problems for Math & AI track.',
      },
      {
        id: 'e3',
        title: 'Project: Queue System',
        date: todayISO,
        startTime: '20:00',
        durationMin: 60,
        category: 'work',
        notes: 'Implement retry workers & dead-letter monitor.',
      },
      {
        id: 'e4',
        title: 'TinyML Paper Review',
        date: tomorrowISO,
        startTime: '11:00',
        durationMin: 45,
        category: 'study',
        notes: 'Summarize quantization benchmarks.',
      },
    ],
    bookmarkFolders: [
      {
        id: 'bf1',
        name: 'Study',
        color: 'purple',
        links: [
          { id: 'bl1', title: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu' },
          { id: 'bl2', title: 'Khan Academy', url: 'https://www.khanacademy.org' },
          { id: 'bl3', title: '3Blue1Brown', url: 'https://www.3blue1brown.com' },
        ],
      },
      {
        id: 'bf2',
        name: 'Research',
        color: 'blue',
        links: [
          { id: 'bl4', title: 'Google Scholar', url: 'https://scholar.google.com' },
          { id: 'bl5', title: 'arXiv CS.AI', url: 'https://arxiv.org/list/cs.AI/recent' },
          { id: 'bl6', title: 'Papers With Code', url: 'https://paperswithcode.com' },
        ],
      },
      {
        id: 'bf3',
        name: 'Jobs',
        color: 'emerald',
        links: [
          { id: 'bl7', title: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs' },
          { id: 'bl8', title: 'Wellfound', url: 'https://wellfound.com' },
          { id: 'bl9', title: 'YC Work at a Startup', url: 'https://www.workatastartup.com' },
        ],
      },
      {
        id: 'bf4',
        name: 'Scholarships',
        color: 'amber',
        links: [
          { id: 'bl10', title: 'Open Doors Russia', url: 'https://od.globaluni.ru' },
          { id: 'bl11', title: 'University of Pavia', url: 'https://portale.unipv.it' },
          { id: 'bl12', title: 'DAAD Scholarships', url: 'https://www.daad.de' },
        ],
      },
      {
        id: 'bf5',
        name: 'Tools',
        color: 'violet',
        links: [
          { id: 'bl13', title: 'Excalidraw', url: 'https://excalidraw.com' },
          { id: 'bl14', title: 'Regex101', url: 'https://regex101.com' },
          { id: 'bl15', title: 'Can I Use', url: 'https://caniuse.com' },
        ],
      },
      {
        id: 'bf6',
        name: 'Projects',
        color: 'fuchsia',
        links: [
          { id: 'bl16', title: 'GitHub', url: 'https://github.com' },
          { id: 'bl17', title: 'Vercel Dashboard', url: 'https://vercel.com/dashboard' },
          { id: 'bl18', title: 'Cloudflare', url: 'https://dash.cloudflare.com' },
        ],
      },
    ],
    shortcuts: [
      { id: 's1', name: 'Gmail', url: 'https://mail.google.com', iconType: 'gmail' },
      { id: 's2', name: 'Drive', url: 'https://drive.google.com', iconType: 'drive' },
      { id: 's3', name: 'Calendar', url: 'https://calendar.google.com', iconType: 'calendar' },
      { id: 's4', name: 'Notion', url: 'https://www.notion.so', iconType: 'notion' },
      { id: 's5', name: 'GitHub', url: 'https://github.com', iconType: 'github' },
      { id: 's6', name: 'ChatGPT', url: 'https://chatgpt.com', iconType: 'chatgpt' },
      { id: 's7', name: 'Figma', url: 'https://www.figma.com', iconType: 'figma' },
      { id: 's8', name: 'LinkedIn', url: 'https://www.linkedin.com', iconType: 'linkedin' },
    ],
    chatMessages: [],
    settings: {
      userName: 'Waqar',
      tagline: 'Stay focused, stay consistent, and ship your goals.',
      timeFormat: '12h',
      tempUnit: 'C',
      weatherCity: 'Gilgit',
      weatherCountry: 'Pakistan',
      weatherLat: 35.9208,
      weatherLon: 74.3089,
      searchEngine: 'google',
      wallpaperPreset: 'cosmic-peaks',
      customWallpaperDataUrl: '',
      githubUsername: '',
      githubToken: '',
      helperUrl: 'http://127.0.0.1:4789',
      aiProvider: 'gemini',
      aiApiKey: '',
      aiModel: 'gemini-2.5-flash',
      aiBaseUrl: 'http://localhost:11434',
      aiIncludeContext: true,
      syncChromeBookmarks: false,
      pomodoro: {
        focusMin: 25,
        shortBreakMin: 5,
        longBreakMin: 15,
        soundEnabled: true,
        desktopNotifications: true,
        completedSessions: 0,
      },
    },
  };
}

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    Boolean(chrome.storage && chrome.storage.local)
  );
}

async function loadPersistedData(): Promise<AppData | null> {
  try {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      if (result && result[STORAGE_KEY]) {
        return result[STORAGE_KEY] as AppData;
      }
    }
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as AppData;
    }
  } catch {
    // Ignore corrupt JSON
  }
  return null;
}

function savePersistedData(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }

  try {
    if (hasChromeStorage()) {
      chrome.storage.local.set({ [STORAGE_KEY]: data }).catch(() => {});
    }
  } catch {
    // Ignore outside extension context
  }
}

function mergeWithDefaults(stored: Partial<AppData> | null): AppData {
  const defaults = createDefaultData();
  if (!stored) return defaults;
  return {
    tasks: Array.isArray(stored.tasks) ? stored.tasks : defaults.tasks,
    projects: Array.isArray(stored.projects) ? stored.projects : defaults.projects,
    notes: Array.isArray(stored.notes) ? stored.notes : defaults.notes,
    events: Array.isArray(stored.events) ? stored.events : defaults.events,
    bookmarkFolders: Array.isArray(stored.bookmarkFolders)
      ? stored.bookmarkFolders
      : defaults.bookmarkFolders,
    shortcuts: Array.isArray(stored.shortcuts) ? stored.shortcuts : defaults.shortcuts,
    chatMessages: Array.isArray(stored.chatMessages) ? stored.chatMessages : defaults.chatMessages,
    settings: {
      ...defaults.settings,
      ...(stored.settings || {}),
      pomodoro: {
        ...defaults.settings.pomodoro,
        ...(stored.settings?.pomodoro || {}),
      },
    },
  };
}

export function useAppStore() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return mergeWithDefaults(JSON.parse(raw));
    } catch {
      // Fallback
    }
    return createDefaultData();
  });
  const [hydrated, setHydrated] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    loadPersistedData().then((stored) => {
      if (!active) return;
      if (stored) {
        setData(mergeWithDefaults(stored));
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      savePersistedData(data);
    }, 150);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [data, hydrated]);

  // Tasks
  const addTask = useCallback(
    (title: string, opts?: Partial<Omit<TaskItem, 'id' | 'title' | 'createdAt'>>) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newTask: TaskItem = {
        id: uid('task'),
        title: trimmed,
        completed: false,
        pinnedToToday: opts?.pinnedToToday ?? true,
        priority: opts?.priority ?? 'medium',
        category: opts?.category ?? 'General',
        dueDate: opts?.dueDate ?? formatLocalDateISO(),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    },
    []
  );

  const toggleTask = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<TaskItem>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, []);

  // Projects
  const addProject = useCallback(
    (project: Omit<ProjectItem, 'id' | 'updatedAt'>) => {
      const item: ProjectItem = {
        ...project,
        id: uid('proj'),
        updatedAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, projects: [item, ...prev.projects] }));
    },
    []
  );

  const updateProject = useCallback((id: string, patch: Partial<ProjectItem>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
  }, []);

  // Notes
  const addNote = useCallback(
    (title: string, content = '', tags: string[] = [], pinned = true): NoteItem => {
      const item: NoteItem = {
        id: uid('note'),
        title: title.trim() || 'Untitled Note',
        content,
        pinned,
        tags,
        updatedAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, notes: [item, ...prev.notes] }));
      return item;
    },
    []
  );

  const updateNote = useCallback((id: string, patch: Partial<NoteItem>) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      ),
    }));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setData((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) }));
  }, []);

  // Calendar Events
  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const item: CalendarEvent = { ...event, id: uid('evt') };
    setData((prev) => ({
      ...prev,
      events: [...prev.events, item].sort((a, b) =>
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
      ),
    }));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setData((prev) => ({ ...prev, events: prev.events.filter((e) => e.id !== id) }));
  }, []);

  // Shortcuts
  const addShortcut = useCallback((shortcut: Omit<ShortcutItem, 'id'>) => {
    const item: ShortcutItem = { ...shortcut, id: uid('sc') };
    setData((prev) => ({ ...prev, shortcuts: [...prev.shortcuts, item] }));
  }, []);

  const deleteShortcut = useCallback((id: string) => {
    setData((prev) => ({ ...prev, shortcuts: prev.shortcuts.filter((s) => s.id !== id) }));
  }, []);

  // Bookmarks
  const addBookmarkFolder = useCallback(
    (name: string, color: BookmarkFolder['color']) => {
      const folder: BookmarkFolder = { id: uid('bf'), name: name.trim(), color, links: [] };
      setData((prev) => ({ ...prev, bookmarkFolders: [...prev.bookmarkFolders, folder] }));
    },
    []
  );

  const addBookmarkLink = useCallback((folderId: string, title: string, url: string) => {
    const link: BookmarkLink = {
      id: uid('bl'),
      title: title.trim() || url,
      url: /^https?:\/\//i.test(url) ? url : `https://${url}`,
    };
    setData((prev) => ({
      ...prev,
      bookmarkFolders: prev.bookmarkFolders.map((f) =>
        f.id === folderId ? { ...f, links: [...f.links, link] } : f
      ),
    }));
  }, []);

  const deleteBookmarkLink = useCallback((folderId: string, linkId: string) => {
    setData((prev) => ({
      ...prev,
      bookmarkFolders: prev.bookmarkFolders.map((f) =>
        f.id === folderId ? { ...f, links: f.links.filter((l) => l.id !== linkId) } : f
      ),
    }));
  }, []);

  const deleteBookmarkFolder = useCallback((folderId: string) => {
    setData((prev) => ({
      ...prev,
      bookmarkFolders: prev.bookmarkFolders.filter((f) => f.id !== folderId),
    }));
  }, []);

  // Chat messages
  const setChatMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setData((prev) => ({
        ...prev,
        chatMessages:
          typeof updater === 'function' ? updater(prev.chatMessages) : updater,
      }));
    },
    []
  );

  // Settings
  const updateSettings = useCallback((patch: Partial<UserSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
        pomodoro: patch.pomodoro
          ? { ...prev.settings.pomodoro, ...patch.pomodoro }
          : prev.settings.pomodoro,
      },
    }));
  }, []);

  const incrementPomodoroSessions = useCallback(() => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        pomodoro: {
          ...prev.settings.pomodoro,
          completedSessions: prev.settings.pomodoro.completedSessions + 1,
        },
      },
    }));
  }, []);

  const importData = useCallback((rawJson: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(rawJson);
      const merged = mergeWithDefaults(parsed);
      setData(merged);
      savePersistedData(merged);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
    }
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = createDefaultData();
    setData(fresh);
    savePersistedData(fresh);
  }, []);

  return {
    data,
    hydrated,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    addNote,
    updateNote,
    deleteNote,
    addEvent,
    deleteEvent,
    addShortcut,
    deleteShortcut,
    addBookmarkFolder,
    addBookmarkLink,
    deleteBookmarkLink,
    deleteBookmarkFolder,
    setChatMessages,
    updateSettings,
    incrementPomodoroSessions,
    importData,
    resetAllData,
  };
}
