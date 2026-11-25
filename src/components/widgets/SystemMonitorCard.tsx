import React, { useEffect, useState } from 'react';
import { Activity, Wifi, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import type { SystemMetrics } from '../../types';
import { fetchSystemMetrics, runLiveBandwidthTest } from '../../services/systemMonitor';

interface SystemMonitorCardProps {
  helperUrl: string;
  onOpenSettings: () => void;
}

function RadialGauge({
  label,
  percent,
  strokeStart,
  strokeEnd,
  tooltip,
}: {
  label: string;
  percent: number;
  strokeStart: string;
  strokeEnd: string;
  tooltip?: string;
}) {
  const size = 76;
  const strokeW = 5.5;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circ - (clamped / 100) * circ;
  const gradId = `gauge_${label}`;

  return (
    <div className="flex flex-col items-center" title={tooltip}>
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={strokeStart} />
              <stop offset="100%" stopColor={strokeEnd} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(148, 163, 184, 0.14)"
            strokeWidth={strokeW}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeW}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-300/80 font-medium leading-none">{label}</span>
          <span className="text-[14px] font-bold text-white tabular-nums mt-0.5">
            {clamped}%
          </span>
        </div>
      </div>
    </div>
  );
}

export const SystemMonitorCard: React.FC<SystemMonitorCardProps> = ({
  helperUrl,
  onOpenSettings,
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [testingSpeed, setTestingSpeed] = useState(false);
  const [speedOverride, setSpeedOverride] = useState<{ downMbps: number; latencyMs: number } | null>(
    null
  );

  useEffect(() => {
    let active = true;
    const poll = async () => {
      const m = await fetchSystemMetrics(helperUrl);
      if (active) setMetrics(m);
    };
    poll();
    const id = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(id);
    };
  }, [helperUrl]);

  const handleSpeedTest = async () => {
    setTestingSpeed(true);
    try {
      const res = await runLiveBandwidthTest();
      setSpeedOverride(res);
    } finally {
      setTestingSpeed(false);
    }
  };

  // Build smooth SVG sparkline from real live history
  const points = metrics?.history?.length
    ? metrics.history.map((h) => Math.max(4, h.cpu * 0.6 + h.ram * 0.4))
    : [18, 22, 20, 26, 24, 30, 28, 34, 29, 25];

  const sparkW = 240;
  const sparkH = 44;
  const maxVal = Math.max(60, ...points);
  const coords = points.map((v, i) => {
    const x = points.length === 1 ? sparkW : (i / (points.length - 1)) * sparkW;
    const y = sparkH - (v / maxVal) * (sparkH - 6) - 3;
    return [x, y] as const;
  });

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${sparkW} ${sparkH} L 0 ${sparkH} Z`;

  const sourceMeta =
    metrics?.source === 'windows-companion'
      ? { label: 'Live PC', dot: 'bg-emerald-400 shadow-[0_0_8px_#34d399]', tip: `Real Windows telemetry (${metrics.hostname || 'PC'})` }
      : metrics?.source === 'chrome-native'
      ? { label: 'Chrome API', dot: 'bg-purple-400 shadow-[0_0_8px_#c084fc]', tip: 'Live Chrome Extension CPU & RAM telemetry' }
      : { label: 'Browser', dot: 'bg-amber-400', tip: 'Run helper/start-helper.bat for full Windows CPU/RAM/Disk/Net' };

  const displayDown =
    metrics?.source === 'windows-companion'
      ? metrics.downMbps
      : speedOverride?.downMbps ?? metrics?.downMbps ?? 0;
  const displayUp = metrics?.upMbps ?? 0;

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <h2 className="text-[14.5px] font-semibold text-white">System Monitor</h2>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          title={sourceMeta.tip}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/6 hover:bg-white/12 text-[10.5px] text-slate-300 cursor-pointer"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${sourceMeta.dot}`} />
          <span>{sourceMeta.label}</span>
        </button>
      </div>

      {/* 3 Radial Gauges */}
      <div className="grid grid-cols-3 gap-2 my-1">
        <RadialGauge
          label="CPU"
          percent={metrics?.cpu ?? 0}
          strokeStart="#38bdf8"
          strokeEnd="#818cf8"
          tooltip={
            metrics?.cpuModel
              ? `${metrics.cpuModel} (${metrics.cpuCores || '?'} threads)`
              : 'CPU Utilization'
          }
        />
        <RadialGauge
          label="RAM"
          percent={metrics?.ram ?? 0}
          strokeStart="#c084fc"
          strokeEnd="#7c3aed"
          tooltip={
            metrics?.ramTotalGB
              ? metrics.source === 'browser-sensor'
                ? `JS Heap: ${metrics.ramUsedGB} / ${metrics.ramTotalGB} MB`
                : `Memory: ${metrics.ramUsedGB} / ${metrics.ramTotalGB} GB`
              : 'Memory Usage'
          }
        />
        <RadialGauge
          label="Disk"
          percent={metrics?.disk ?? 0}
          strokeStart="#2dd4bf"
          strokeEnd="#6366f1"
          tooltip={
            metrics?.diskTotalGB
              ? `${metrics.diskDrive || 'Disk'}: ${metrics.diskUsedGB} / ${metrics.diskTotalGB} GB`
              : 'Storage Usage'
          }
        />
      </div>

      {/* Live Sparkline Wave */}
      <div className="my-2">
        <svg
          viewBox={`0 0 ${sparkW} ${sparkH}`}
          className="w-full h-11 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#sparkFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#c084fc"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Network Speed Row */}
      <div className="flex items-center justify-between pt-1.5 border-t border-purple-500/15 text-[11.5px]">
        <div className="flex items-center gap-2 text-slate-300">
          <Wifi className="w-3.5 h-3.5 text-purple-300" />
          <span className="flex items-center gap-0.5 text-emerald-400 font-medium tabular-nums">
            <ArrowUp className="w-3 h-3" />
            {displayUp.toFixed(1)} Mbps
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-sky-400 font-medium tabular-nums">
            <ArrowDown className="w-3 h-3" />
            {displayDown.toFixed(1)} Mbps
          </span>
          <button
            type="button"
            onClick={handleSpeedTest}
            disabled={testingSpeed}
            title="Run live download speed check"
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${testingSpeed ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
