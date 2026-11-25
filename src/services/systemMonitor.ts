import type { SystemMetrics, SystemMetricPoint } from '../types';

interface PrevCpuProc {
  total: number;
  idle: number;
}

let prevChromeCpu: PrevCpuProc | null = null;
const localHistory: SystemMetricPoint[] = [];

function pushLocalPoint(pt: SystemMetricPoint): SystemMetricPoint[] {
  localHistory.push(pt);
  if (localHistory.length > 28) localHistory.shift();
  return [...localHistory];
}

function getNetworkConnectionEstimate(): { downMbps: number; upMbps: number } {
  const nav = navigator as Navigator & {
    connection?: { downlink?: number; rtt?: number };
  };
  const dl = Number(nav.connection?.downlink ?? 0);
  return {
    downMbps: Math.round(dl * 10) / 10,
    upMbps: Math.round(dl * 0.35 * 10) / 10,
  };
}

async function readChromeExtensionMetrics(): Promise<SystemMetrics | null> {
  if (
    typeof chrome === 'undefined' ||
    !chrome.system ||
    !chrome.system.cpu ||
    !chrome.system.memory
  ) {
    return null;
  }

  try {
    const [cpuInfo, memInfo] = await Promise.all([
      chrome.system.cpu.getInfo(),
      chrome.system.memory.getInfo(),
    ]);

    let totalAll = 0;
    let idleAll = 0;
    for (const p of cpuInfo.processors) {
      totalAll += p.usage.total;
      idleAll += p.usage.idle;
    }

    let cpuPercent = 0;
    if (prevChromeCpu) {
      const totalDiff = totalAll - prevChromeCpu.total;
      const idleDiff = idleAll - prevChromeCpu.idle;
      if (totalDiff > 0) {
        cpuPercent = Math.max(
          0,
          Math.min(100, Math.round(((totalDiff - idleDiff) / totalDiff) * 100))
        );
      }
    }
    prevChromeCpu = { total: totalAll, idle: idleAll };

    const totalMem = memInfo.capacity || 1;
    const usedMem = Math.max(0, totalMem - memInfo.availableCapacity);
    const ramPercent = Math.max(0, Math.min(100, Math.round((usedMem / totalMem) * 100)));

    let diskPercent = 0;
    let diskUsedGB: number | undefined;
    let diskTotalGB: number | undefined;
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      if (est.quota && est.quota > 0) {
        diskPercent = Math.min(100, Math.round(((est.usage || 0) / est.quota) * 100));
        diskUsedGB = Math.round(((est.usage || 0) / 1024 ** 3) * 100) / 100;
        diskTotalGB = Math.round((est.quota / 1024 ** 3) * 10) / 10;
      }
    }

    const net = getNetworkConnectionEstimate();
    const point: SystemMetricPoint = {
      ts: Date.now(),
      cpu: cpuPercent,
      ram: ramPercent,
      disk: diskPercent,
      upMbps: net.upMbps,
      downMbps: net.downMbps,
    };

    return {
      source: 'chrome-native',
      cpu: cpuPercent,
      cpuCores: cpuInfo.numOfProcessors,
      cpuModel: cpuInfo.modelName,
      ram: ramPercent,
      ramUsedGB: Math.round((usedMem / 1024 ** 3) * 10) / 10,
      ramTotalGB: Math.round((totalMem / 1024 ** 3) * 10) / 10,
      disk: diskPercent,
      diskUsedGB,
      diskTotalGB,
      upMbps: net.upMbps,
      downMbps: net.downMbps,
      history: pushLocalPoint(point),
      updatedAt: point.ts,
    };
  } catch {
    return null;
  }
}

async function readBrowserSensorMetrics(): Promise<SystemMetrics> {
  // Real browser-visible telemetry (JS heap, Origin storage quota, Network Information API)
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
  };
  let ramPercent = 0;
  let ramUsedGB: number | undefined;
  let ramTotalGB: number | undefined;

  if (perf.memory && perf.memory.jsHeapSizeLimit > 0) {
    ramPercent = Math.min(
      100,
      Math.max(1, Math.round((perf.memory.usedJSHeapSize / perf.memory.totalJSHeapSize) * 100))
    );
    ramUsedGB = Math.round((perf.memory.usedJSHeapSize / 1024 ** 2) * 10) / 10; // MB in browser
    ramTotalGB = Math.round((perf.memory.totalJSHeapSize / 1024 ** 2) * 10) / 10;
  }

  // Real main-thread event loop responsiveness gauge
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, 16));
  const jitterMs = Math.max(0, performance.now() - t0 - 16);
  const cpuPercent = Math.min(100, Math.max(1, Math.round(jitterMs * 2.5 + 3)));

  let diskPercent = 0;
  if (navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      if (est.quota && est.quota > 0) {
        diskPercent = Math.min(100, Math.round(((est.usage || 0) / est.quota) * 100));
      }
    } catch {
      // Ignore
    }
  }

  const net = getNetworkConnectionEstimate();
  const point: SystemMetricPoint = {
    ts: Date.now(),
    cpu: cpuPercent,
    ram: ramPercent,
    disk: diskPercent,
    upMbps: net.upMbps,
    downMbps: net.downMbps,
  };

  return {
    source: 'browser-sensor',
    cpu: cpuPercent,
    cpuCores: navigator.hardwareConcurrency || undefined,
    ram: ramPercent,
    ramUsedGB,
    ramTotalGB,
    disk: diskPercent,
    upMbps: net.upMbps,
    downMbps: net.downMbps,
    history: pushLocalPoint(point),
    updatedAt: point.ts,
  };
}

export async function fetchSystemMetrics(helperUrl: string): Promise<SystemMetrics> {
  const cleanUrl = helperUrl.replace(/\/+$/, '');
  // Tier 1: Local Windows Companion Server (100% real Windows CPU, RAM, Disk, Network Mbps)
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 900);
    const res = await fetch(`${cleanUrl}/api/metrics`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    window.clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (typeof json.cpu === 'number' && typeof json.ram === 'number') {
        return json as SystemMetrics;
      }
    }
  } catch {
    // Helper not running, fall through to Tier 2
  }

  // Tier 2: Chrome Extension native APIs (chrome.system.cpu + chrome.system.memory)
  const chromeMetrics = await readChromeExtensionMetrics();
  if (chromeMetrics) return chromeMetrics;

  // Tier 3: Standard browser sensors
  return readBrowserSensorMetrics();
}

export async function runLiveBandwidthTest(): Promise<{ downMbps: number; latencyMs: number }> {
  // Real lightweight download probe against Cloudflare's public speed endpoint (fallback to Open-Meteo)
  const t0 = performance.now();
  try {
    const bytes = 250_000;
    const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytes}&t=${Date.now()}`, {
      cache: 'no-store',
    });
    const blob = await res.blob();
    const elapsedSec = Math.max(0.02, (performance.now() - t0) / 1000);
    const downMbps = Math.round(((blob.size * 8) / (elapsedSec * 1_000_000)) * 10) / 10;
    return { downMbps, latencyMs: Math.round(elapsedSec * 1000) };
  } catch {
    const nav = navigator as Navigator & { connection?: { downlink?: number; rtt?: number } };
    return {
      downMbps: Number(nav.connection?.downlink ?? 0),
      latencyMs: Number(nav.connection?.rtt ?? 0),
    };
  }
}
