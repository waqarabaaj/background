import React, { useState } from 'react';
import { Timer, Settings, Maximize2, Play, Pause, RotateCcw } from 'lucide-react';
import type { PomodoroSettings } from '../../types';
import type { PomodoroMode } from '../../hooks/usePomodoro';

interface PomodoroCardProps {
  mode: PomodoroMode;
  running: boolean;
  remainingSec: number;
  progress: number;
  settings: PomodoroSettings;
  onSwitchMode: (mode: PomodoroMode) => void;
  onToggleRunning: () => void;
  onReset: () => void;
  onUpdateSettings: (patch: Partial<PomodoroSettings>) => void;
  onExpand: () => void;
}

export const PomodoroCard: React.FC<PomodoroCardProps> = ({
  mode,
  running,
  remainingSec,
  progress,
  settings,
  onSwitchMode,
  onToggleRunning,
  onReset,
  onUpdateSettings,
  onExpand,
}) => {
  const [configOpen, setConfigOpen] = useState(false);

  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');
  const modeLabel =
    mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break';

  // Ring geometry (270-degree sleek arc like mockup)
  const size = 148;
  const stroke = 8;
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.78; // sleek open-bottom gauge arc
  const arcLength = circumference * arcFraction;
  const activeLength = Math.max(arcLength * (1 - progress), 6);

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-400" />
          <h2 className="text-[14.5px] font-semibold text-white">Pomodoro</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setConfigOpen((c) => !c)}
            title="Timer settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onExpand}
            title="Open full Focus mode"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-500/20 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline quick settings */}
      {configOpen && (
        <div className="absolute right-3 top-11 z-30 w-56 rounded-xl bg-[#14112b]/96 backdrop-blur-xl border border-purple-400/40 p-3 shadow-2xl space-y-2 text-xs">
          <div className="font-semibold text-purple-200 mb-1">Durations (min)</div>
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="text-[10px] text-slate-400">Focus</span>
              <input
                type="number"
                min={1}
                max={120}
                value={settings.focusMin}
                onChange={(e) =>
                  onUpdateSettings({ focusMin: Math.max(1, Number(e.target.value) || 25) })
                }
                className="w-full mt-0.5 px-2 py-1 rounded-lg bg-white/8 border border-purple-500/25 text-white"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-slate-400">Short</span>
              <input
                type="number"
                min={1}
                max={30}
                value={settings.shortBreakMin}
                onChange={(e) =>
                  onUpdateSettings({ shortBreakMin: Math.max(1, Number(e.target.value) || 5) })
                }
                className="w-full mt-0.5 px-2 py-1 rounded-lg bg-white/8 border border-purple-500/25 text-white"
              />
            </label>
            <label className="block">
              <span className="text-[10px] text-slate-400">Long</span>
              <input
                type="number"
                min={1}
                max={60}
                value={settings.longBreakMin}
                onChange={(e) =>
                  onUpdateSettings({ longBreakMin: Math.max(1, Number(e.target.value) || 15) })
                }
                className="w-full mt-0.5 px-2 py-1 rounded-lg bg-white/8 border border-purple-500/25 text-white"
              />
            </label>
          </div>
          <label className="flex items-center justify-between pt-1 cursor-pointer">
            <span className="text-slate-300">Chime sound</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              className="accent-purple-500"
            />
          </label>
        </div>
      )}

      {/* Center Circular Arc Gauge */}
      <div className="flex flex-col items-center justify-center my-1">
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} className="overflow-visible">
            <defs>
              <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <filter id="pomoGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g transform={`rotate(130 ${size / 2} ${size / 2})`}>
              {/* Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(139, 92, 246, 0.16)"
                strokeWidth={stroke}
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Active Glow Arc */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="url(#pomoGrad)"
                strokeWidth={stroke}
                strokeDasharray={`${activeLength} ${circumference}`}
                strokeLinecap="round"
                filter="url(#pomoGlow)"
                className="transition-all duration-300"
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
            <span className="text-[28px] font-semibold tracking-tight text-white tabular-nums leading-none">
              {mm}:{ss}
            </span>
            <span className="text-[12px] text-purple-200/75 mt-1">{modeLabel}</span>
          </div>
        </div>

        {/* Start / Pause + Reset */}
        <div className="flex items-center gap-2 -mt-2 mb-3">
          <button
            type="button"
            onClick={onToggleRunning}
            className="purple-glow-btn px-6 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{running ? 'Pause' : 'Start'}</span>
          </button>
          {(running || progress > 0) && (
            <button
              type="button"
              onClick={onReset}
              title="Reset timer"
              className="p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Pills */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/25 border border-purple-500/15">
        {(
          [
            { id: 'focus', label: 'Pomodoro' },
            { id: 'short', label: 'Short Break' },
            { id: 'long', label: 'Long Break' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSwitchMode(tab.id)}
            className={`py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              mode === tab.id
                ? 'bg-purple-600/80 text-white shadow-[0_0_12px_rgba(147,51,234,0.6)]'
                : 'text-slate-300/75 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
