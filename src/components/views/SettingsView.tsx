import React, { useState, useEffect } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import type { AIProvider, AppData, UserSettings } from '../../types';
import { PROVIDER_DEFAULTS } from '../../services/aiAssistant';

interface SettingsViewProps {
  data: AppData;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onImportData: (json: string) => { ok: boolean; error?: string };
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onUpdateSettings,
  onImportData,
  onResetAll,
}) => {
  const { settings } = data;
  const [helperOnline, setHelperOnline] = useState<boolean | null>(null);
  const [helperHost, setHelperHost] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const checkHelper = async () => {
    setHelperOnline(null);
    try {
      const res = await fetch(`${settings.helperUrl.replace(/\/+$/, '')}/api/health`);
      if (res.ok) {
        const json = await res.json();
        setHelperOnline(true);
        setHelperHost(json.hostname || 'Windows PC');
        return;
      }
    } catch {
      // Offline
    }
    setHelperOnline(false);
  };

  useEffect(() => {
    checkHelper();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.helperUrl]);

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waqar-homepage-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Backup JSON downloaded.');
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = onImportData(String(reader.result || ''));
      setStatusMsg(res.ok ? 'Backup restored successfully!' : `Import failed: ${res.error}`);
    };
    reader.readAsText(file);
  };

  const handleWallpaperUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateSettings({
        wallpaperPreset: 'custom',
        customWallpaperDataUrl: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto py-3 pb-10 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" /> Command Center Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          All preferences and keys are stored strictly locally in your Chrome storage.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-purple-600/25 border border-purple-400/45 text-xs text-purple-100">
          {statusMsg}
        </div>
      )}

      {/* Profile & Appearance */}
      <section className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">
          Profile & Display
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-slate-300">
            Display Name
            <input
              type="text"
              value={settings.userName}
              onChange={(e) => onUpdateSettings({ userName: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Motivation Tagline
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => onUpdateSettings({ tagline: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Clock Format
            <select
              value={settings.timeFormat}
              onChange={(e) =>
                onUpdateSettings({ timeFormat: e.target.value as '12h' | '24h' })
              }
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
            >
              <option value="12h">12-Hour (4:28 PM)</option>
              <option value="24h">24-Hour (16:28)</option>
            </select>
          </label>
          <label className="block text-xs text-slate-300">
            Temperature Unit
            <select
              value={settings.tempUnit}
              onChange={(e) =>
                onUpdateSettings({ tempUnit: e.target.value as 'C' | 'F' })
              }
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
            >
              <option value="C">Celsius (°C)</option>
              <option value="F">Fahrenheit (°F)</option>
            </select>
          </label>
        </div>

        {/* Wallpaper */}
        <div className="pt-2 border-t border-purple-500/15">
          <div className="text-xs text-slate-300 mb-2">Hero Backdrop Wallpaper</div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['cosmic-peaks', 'Cosmic Peaks (Default)'],
                ['aurora-violet', 'Aurora Violet Mesh'],
                ['midnight-minimal', 'Midnight Minimal'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => onUpdateSettings({ wallpaperPreset: id })}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                  settings.wallpaperPreset === id
                    ? 'bg-purple-600/40 border-purple-400 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
            <label className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/8 hover:bg-white/15 border border-purple-400/30 text-purple-200 flex items-center gap-1.5 cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5" /> Upload Custom Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleWallpaperUpload(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      </section>

      {/* GitHub Integration */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">
          GitHub Activity (Real Live Graph)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-slate-300">
            GitHub Username
            <input
              type="text"
              value={settings.githubUsername}
              onChange={(e) => onUpdateSettings({ githubUsername: e.target.value })}
              placeholder="e.g. your-github-handle"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Personal Access Token (Optional — includes private commits)
            <input
              type="password"
              value={settings.githubToken}
              onChange={(e) => onUpdateSettings({ githubToken: e.target.value })}
              placeholder="ghp_... (optional)"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
        </div>
      </section>

      {/* AI Assistant Config */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">
          AI Assistant Provider
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-slate-300">
            Provider
            <select
              value={settings.aiProvider}
              onChange={(e) => {
                const p = e.target.value as AIProvider;
                onUpdateSettings({
                  aiProvider: p,
                  aiModel: PROVIDER_DEFAULTS[p].defaultModel,
                  aiBaseUrl: PROVIDER_DEFAULTS[p].baseUrl,
                });
              }}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
            >
              {(Object.keys(PROVIDER_DEFAULTS) as AIProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_DEFAULTS[p].label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-300">
            Model Name
            <input
              type="text"
              value={settings.aiModel}
              onChange={(e) => onUpdateSettings({ aiModel: e.target.value })}
              placeholder={PROVIDER_DEFAULTS[settings.aiProvider].defaultModel}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-300">
            API Key {settings.aiProvider === 'ollama' ? '(Not needed for local Ollama)' : ''}
            <input
              type="password"
              value={settings.aiApiKey}
              onChange={(e) => onUpdateSettings({ aiApiKey: e.target.value })}
              placeholder="Paste API key..."
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
          <label className="block text-xs text-slate-300">
            Base URL (for Ollama or custom endpoints)
            <input
              type="text"
              value={settings.aiBaseUrl}
              onChange={(e) => onUpdateSettings({ aiBaseUrl: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white"
            />
          </label>
        </div>
      </section>

      {/* Windows Companion Server */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">
            Windows System Monitor Companion
          </h3>
          <div className="flex items-center gap-2 text-xs">
            {helperOnline === true ? (
              <span className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" /> Connected ({helperHost})
              </span>
            ) : helperOnline === false ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <XCircle className="w-4 h-4" /> Offline (using Chrome/Browser fallback)
              </span>
            ) : (
              <span className="text-slate-400">Checking...</span>
            )}
            <button
              type="button"
              onClick={checkHelper}
              className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-slate-200 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-300/85">
          Run <code className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">npm run helper</code> or double-click{' '}
          <code className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">helper\start-helper.bat</code> to stream 100% real Windows CPU, RAM, Disk, and live Network Mbps. To auto-start silently with Windows, run{' '}
          <code className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200">helper\install-startup.ps1</code>.
        </p>
        <input
          type="text"
          value={settings.helperUrl}
          onChange={(e) => onUpdateSettings({ helperUrl: e.target.value })}
          className="w-full max-w-sm px-3 py-1.5 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white"
        />
      </section>

      {/* Backup & Reset */}
      <section className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Backup & Data Portability</h3>
          <p className="text-xs text-slate-400">
            Export all tasks, projects, notes, calendar events, shortcuts, and bookmarks as JSON.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportBackup}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset all dashboard data back to defaults?')) {
                onResetAll();
                setStatusMsg('Dashboard reset to defaults.');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/35 text-xs font-medium text-rose-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </div>
      </section>
    </div>
  );
};
