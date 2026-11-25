export type NavSection =
  | 'home'
  | 'focus'
  | 'tasks'
  | 'projects'
  | 'notes'
  | 'calendar'
  | 'ai'
  | 'settings';

export type ToolId =
  | 'pomodoro'
  | 'screen-recorder'
  | 'screenshot'
  | 'file-converter'
  | 'unit-converter'
  | 'qr-generator'
  | 'text-to-speech';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  pinnedToToday: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  createdAt: string;
}

export type ProjectStatus = 'Planning' | 'Active' | 'In Progress' | 'Completed';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  repoUrl?: string;
  liveUrl?: string;
  tags: string[];
  updatedAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  tags: string[];
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  durationMin: number;
  category: 'meeting' | 'study' | 'work' | 'personal';
  notes?: string;
}

export interface BookmarkLink {
  id: string;
  title: string;
  url: string;
}

export type FolderColor =
  | 'purple'
  | 'blue'
  | 'emerald'
  | 'amber'
  | 'violet'
  | 'fuchsia';

export interface BookmarkFolder {
  id: string;
  name: string;
  color: FolderColor;
  links: BookmarkLink[];
}

export type ShortcutIconType =
  | 'gmail'
  | 'drive'
  | 'calendar'
  | 'notion'
  | 'github'
  | 'chatgpt'
  | 'figma'
  | 'linkedin'
  | 'custom';

export interface ShortcutItem {
  id: string;
  name: string;
  url: string;
  iconType: ShortcutIconType;
  customColor?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
}

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'openrouter' | 'ollama';

export interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  soundEnabled: boolean;
  desktopNotifications: boolean;
  completedSessions: number;
}

export type SearchEngineId = 'google' | 'duckduckgo' | 'perplexity' | 'bing' | 'youtube';

export interface UserSettings {
  userName: string;
  tagline: string;
  timeFormat: '12h' | '24h';
  tempUnit: 'C' | 'F';
  weatherCity: string;
  weatherCountry: string;
  weatherLat: number;
  weatherLon: number;
  searchEngine: SearchEngineId;
  wallpaperPreset: 'cosmic-peaks' | 'aurora-violet' | 'midnight-minimal' | 'custom';
  customWallpaperDataUrl: string;
  githubUsername: string;
  githubToken: string;
  helperUrl: string;
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  aiIncludeContext: boolean;
  syncChromeBookmarks: boolean;
  pomodoro: PomodoroSettings;
}

export interface AppData {
  tasks: TaskItem[];
  projects: ProjectItem[];
  notes: NoteItem[];
  events: CalendarEvent[];
  bookmarkFolders: BookmarkFolder[];
  shortcuts: ShortcutItem[];
  chatMessages: ChatMessage[];
  settings: UserSettings;
}

export interface WeatherForecastDay {
  date: string;
  code: number;
  tempMaxC: number;
  tempMinC: number;
}

export interface WeatherData {
  city: string;
  country: string;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  daily: WeatherForecastDay[];
  updatedAt: number;
}

export interface SystemMetricPoint {
  ts: number;
  cpu: number;
  ram: number;
  disk: number;
  upMbps: number;
  downMbps: number;
}

export interface SystemMetrics {
  source: 'windows-companion' | 'chrome-native' | 'browser-sensor';
  hostname?: string;
  cpu: number;
  cpuCores?: number;
  cpuModel?: string;
  ram: number;
  ramUsedGB?: number;
  ramTotalGB?: number;
  disk: number;
  diskDrive?: string;
  diskUsedGB?: number;
  diskTotalGB?: number;
  upMbps: number;
  downMbps: number;
  history: SystemMetricPoint[];
  updatedAt: number;
}

export interface GitHubContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubActivityData {
  username: string;
  streak: number;
  weeklyCommits: number;
  totalLastYear: number;
  days: GitHubContributionDay[];
  profileUrl: string;
  source: 'live-api' | 'graphql' | 'unconfigured';
  error?: string;
  updatedAt: number;
}
