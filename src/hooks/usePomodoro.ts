import { useState, useEffect, useRef, useCallback } from 'react';
import type { PomodoroSettings } from '../types';
import { playCompletionChime } from '../services/sound';

export type PomodoroMode = 'focus' | 'short' | 'long';

export function usePomodoro(
  settings: PomodoroSettings,
  onSessionComplete: () => void
) {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [running, setRunning] = useState(false);

  const getDurationSec = useCallback(
    (m: PomodoroMode) => {
      if (m === 'focus') return Math.max(1, settings.focusMin) * 60;
      if (m === 'short') return Math.max(1, settings.shortBreakMin) * 60;
      return Math.max(1, settings.longBreakMin) * 60;
    },
    [settings.focusMin, settings.shortBreakMin, settings.longBreakMin]
  );

  const [remainingSec, setRemainingSec] = useState<number>(() => getDurationSec('focus'));
  const endTimeRef = useRef<number | null>(null);
  const completedCallbackRef = useRef(onSessionComplete);
  completedCallbackRef.current = onSessionComplete;

  // Update remaining time when durations change while paused & at full duration or switching mode
  const switchMode = useCallback(
    (nextMode: PomodoroMode) => {
      setRunning(false);
      endTimeRef.current = null;
      setMode(nextMode);
      setRemainingSec(getDurationSec(nextMode));
    },
    [getDurationSec]
  );

  useEffect(() => {
    if (!running) {
      setRemainingSec(getDurationSec(mode));
    }
  }, [settings.focusMin, settings.shortBreakMin, settings.longBreakMin, mode, running, getDurationSec]);

  const toggleRunning = useCallback(() => {
    setRunning((prev) => {
      if (!prev) {
        const secs = remainingSec <= 0 ? getDurationSec(mode) : remainingSec;
        if (remainingSec <= 0) setRemainingSec(secs);
        endTimeRef.current = Date.now() + secs * 1000;
        if (
          settings.desktopNotifications &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'default'
        ) {
          Notification.requestPermission().catch(() => {});
        }
        return true;
      } else {
        endTimeRef.current = null;
        return false;
      }
    });
  }, [remainingSec, getDurationSec, mode, settings.desktopNotifications]);

  const reset = useCallback(() => {
    setRunning(false);
    endTimeRef.current = null;
    setRemainingSec(getDurationSec(mode));
  }, [getDurationSec, mode]);

  useEffect(() => {
    if (!running) {
      document.title = 'New Tab — Command Center';
      return;
    }

    const tick = () => {
      if (!endTimeRef.current) return;
      const diffSec = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (diffSec <= 0) {
        setRemainingSec(0);
        setRunning(false);
        endTimeRef.current = null;
        document.title = 'New Tab — Command Center';

        if (settings.soundEnabled) {
          playCompletionChime();
        }
        if (mode === 'focus') {
          completedCallbackRef.current();
        }
        if (
          settings.desktopNotifications &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          new Notification(
            mode === 'focus' ? 'Focus session complete!' : 'Break is over!',
            {
              body:
                mode === 'focus'
                  ? 'Great work! Take a short break to recharge.'
                  : 'Ready to dive back into deep focus?',
            }
          );
        }
      } else {
        setRemainingSec(diffSec);
        const mm = String(Math.floor(diffSec / 60)).padStart(2, '0');
        const ss = String(diffSec % 60).padStart(2, '0');
        const label = mode === 'focus' ? 'Focus' : mode === 'short' ? 'Short Break' : 'Long Break';
        document.title = `${mm}:${ss} • ${label}`;
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running, mode, settings.soundEnabled, settings.desktopNotifications]);

  const totalSec = getDurationSec(mode);
  const progress = totalSec > 0 ? Math.max(0, Math.min(1, (totalSec - remainingSec) / totalSec)) : 0;

  return {
    mode,
    running,
    remainingSec,
    totalSec,
    progress,
    switchMode,
    toggleRunning,
    reset,
  };
}
