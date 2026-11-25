import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, CheckCircle2, Flame } from 'lucide-react';
import type { TaskItem, PomodoroSettings } from '../../types';
import type { PomodoroMode } from '../../hooks/usePomodoro';
import { ambientPlayer, type AmbientSoundType } from '../../services/sound';

interface FocusViewProps {
  pomodoro: {
    mode: PomodoroMode;
    running: boolean;
    remainingSec: number;
    progress: number;
    switchMode: (m: PomodoroMode) => void;
    toggleRunning: () => void;
    reset: () => void;
  };
  settings: PomodoroSettings;
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onUpdatePomodoro: (patch: Partial<PomodoroSettings>) => void;
}

export const FocusView: React.FC<FocusViewProps> = ({
  pomodoro,
  settings,
  tasks,
  onToggleTask,
  onUpdatePomodoro,
}) => {
  const [ambient, setAmbient] = useState<AmbientSoundType>(() => ambientPlayer.getActive());
  const [ambientVol, setAmbientVol] = useState(0.28);
  const openTasks = tasks.filter((t) => !t.completed);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(openTasks[0]?.id || '');

  useEffect(() => {
    if (!selectedTaskId && openTasks[0]) {
      setSelectedTaskId(openTasks[0].id);
    }
  }, [openTasks, selectedTaskId]);

  const handleAmbient = (next: AmbientSoundType) => {
    setAmbient(next);
    ambientPlayer.start(next, ambientVol);
  };

  const handleVolume = (vol: number) => {
    setAmbientVol(vol);
    ambientPlayer.setVolume(vol);
  };

  const mm = String(Math.floor(pomodoro.remainingSec / 60)).padStart(2, '0');
  const ss = String(pomodoro.remainingSec % 60).padStart(2, '0');
  const activeTask = tasks.find((t) => t.id === selectedTaskId);

  const size = 270;
  const stroke = 11;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * pomodoro.progress;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center">
        {/* Mode tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-black/35 border border-purple-500/20 mb-8">
          {(
            [
              { id: 'focus', label: `Deep Focus (${settings.focusMin}m)` },
              { id: 'short', label: `Short Break (${settings.shortBreakMin}m)` },
              { id: 'long', label: `Long Break (${settings.longBreakMin}m)` },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pomodoro.switchMode(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                pomodoro.mode === m.id
                  ? 'bg-purple-600 text-white shadow-[0_0_16px_rgba(147,51,234,0.75)]'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Giant Glowing Ring */}
        <div className="relative flex items-center justify-center mb-8">
          <svg width={size} height={size} className="-rotate-90 overflow-visible">
            <defs>
              <linearGradient id="focusRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e879f9" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <filter id="focusGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(139, 92, 246, 0.14)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="url(#focusRingGrad)"
              strokeWidth={stroke}
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              filter="url(#focusGlow)"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-bold tracking-tight text-white tabular-nums">
              {mm}:{ss}
            </span>
            <span className="text-sm text-purple-200/80 mt-2">
              {pomodoro.mode === 'focus'
                ? 'Stay locked in'
                : pomodoro.mode === 'short'
                ? 'Stretch & breathe'
                : 'Full recharge'}
            </span>
            <span className="mt-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-[11px] text-purple-200">
              <Flame className="w-3 h-3 text-amber-400" />
              {settings.completedSessions} sessions completed
            </span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pomodoro.toggleRunning}
            className="purple-glow-btn px-8 py-3 rounded-full text-sm font-semibold text-white flex items-center gap-2 cursor-pointer"
          >
            {pomodoro.running ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
            <span>{pomodoro.running ? 'Pause Focus' : 'Start Session'}</span>
          </button>
          <button
            type="button"
            onClick={pomodoro.reset}
            className="p-3 rounded-full bg-white/8 hover:bg-white/15 text-slate-200 cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom 2-Col: Active Focus Task + Real Web Audio Ambient Soundscapes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-white">Active Focus Task</h3>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
          >
            {openTasks.length === 0 ? (
              <option value="">All tasks completed!</option>
            ) : (
              openTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))
            )}
          </select>

          {activeTask && !activeTask.completed && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/12 border border-purple-400/30">
              <span className="text-sm text-white font-medium truncate">
                {activeTask.title}
              </span>
              <button
                type="button"
                onClick={() => onToggleTask(activeTask.id)}
                className="shrink-0 px-3 py-1 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-500/15">
            <label className="text-xs text-slate-400">
              Focus (min)
              <input
                type="number"
                min={1}
                max={120}
                value={settings.focusMin}
                onChange={(e) =>
                  onUpdatePomodoro({ focusMin: Math.max(1, Number(e.target.value) || 25) })
                }
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/7 border border-purple-500/25 text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              Short (min)
              <input
                type="number"
                min={1}
                max={30}
                value={settings.shortBreakMin}
                onChange={(e) =>
                  onUpdatePomodoro({ shortBreakMin: Math.max(1, Number(e.target.value) || 5) })
                }
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/7 border border-purple-500/25 text-white"
              />
            </label>
            <label className="text-xs text-slate-400">
              Long (min)
              <input
                type="number"
                min={1}
                max={60}
                value={settings.longBreakMin}
                onChange={(e) =>
                  onUpdatePomodoro({ longBreakMin: Math.max(1, Number(e.target.value) || 15) })
                }
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-white/7 border border-purple-500/25 text-white"
              />
            </label>
          </div>
        </div>

        {/* Real Synthesized Web Audio Ambient Soundscapes */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" />
              Ambient Focus Soundscape
            </h3>
            <span className="text-[11px] text-purple-300/75">Web Audio Live</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'off', label: 'Silence (Off)' },
                { id: 'rain', label: 'Soft Rain' },
                { id: 'brown-noise', label: 'Deep Brown Noise' },
                { id: 'cosmic-drone', label: 'Cosmic Space Drone' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleAmbient(s.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  ambient === s.id
                    ? 'bg-purple-600/40 border-purple-400 text-white shadow-[0_0_14px_rgba(147,51,234,0.45)]'
                    : 'bg-white/5 border-purple-500/20 text-slate-300 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Volume</span>
              <span>{Math.round(ambientVol * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.02}
              value={ambientVol}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
