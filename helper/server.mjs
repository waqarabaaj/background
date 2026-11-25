#!/usr/bin/env node
/**
 * Lightweight zero-dependency Windows System Telemetry & Companion Server
 * Streams real CPU %, RAM %, Disk %, and live Network Up/Down Mbps over HTTP/SSE.
 * Also serves the built ./dist directory when visited directly at http://127.0.0.1:4789
 */
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const PORT = Number(process.env.PORT || 4789);
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

let prevCpuSnapshot = snapshotCpus();
let prevNetSnapshot = null;
let latestMetrics = null;
const history = [];
const sseClients = new Set();

function snapshotCpus() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total +=
      cpu.times.user +
      cpu.times.nice +
      cpu.times.sys +
      cpu.times.irq +
      cpu.times.idle;
  }
  return { idle, total, count: cpus.length, model: cpus[0]?.model || 'CPU' };
}

function getCpuPercent() {
  const curr = snapshotCpus();
  const totalDiff = curr.total - prevCpuSnapshot.total;
  const idleDiff = curr.idle - prevCpuSnapshot.idle;
  prevCpuSnapshot = curr;
  if (totalDiff <= 0) return 0;
  const usage = ((totalDiff - idleDiff) / totalDiff) * 100;
  return Math.max(0, Math.min(100, Math.round(usage)));
}

function getMemoryInfo() {
  const totalBytes = os.totalmem();
  const freeBytes = os.freemem();
  const usedBytes = totalBytes - freeBytes;
  const percent = Math.round((usedBytes / totalBytes) * 100);
  const toGB = (b) => Math.round((b / 1024 ** 3) * 10) / 10;
  return {
    percent: Math.max(0, Math.min(100, percent)),
    usedGB: toGB(usedBytes),
    totalGB: toGB(totalBytes),
  };
}

function getDiskInfo() {
  const driveRoot = process.platform === 'win32'
    ? `${process.env.SystemDrive || 'C:'}\\`
    : '/';
  try {
    const stat = fs.statfsSync(driveRoot);
    const totalBytes = stat.blocks * stat.bsize;
    const freeBytes = stat.bfree * stat.bsize;
    const usedBytes = Math.max(0, totalBytes - freeBytes);
    const percent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
    const toGB = (b) => Math.round((b / 1024 ** 3) * 10) / 10;
    return {
      drive: driveRoot.replace('\\', ''),
      percent: Math.max(0, Math.min(100, percent)),
      usedGB: toGB(usedBytes),
      totalGB: toGB(totalBytes),
    };
  } catch {
    return { drive: driveRoot, percent: 0, usedGB: 0, totalGB: 0 };
  }
}

function readWindowsNetBytes() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(null);
      return;
    }
    execFile('netstat', ['-e'], { timeout: 1200, windowsHide: true }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        // Matches "Bytes   123456789   987654321" across Windows locales
        const nums = line.match(/\d+/g);
        if (nums && nums.length >= 2 && /bytes/i.test(line)) {
          resolve({
            rxBytes: Number(nums[0]),
            txBytes: Number(nums[1]),
            ts: Date.now(),
          });
          return;
        }
      }
      // Fallback: first line containing two large integer counters
      for (const line of lines) {
        const nums = line.match(/\d{4,}/g);
        if (nums && nums.length >= 2) {
          resolve({
            rxBytes: Number(nums[0]),
            txBytes: Number(nums[1]),
            ts: Date.now(),
          });
          return;
        }
      }
      resolve(null);
    });
  });
}

async function sampleMetrics() {
  const cpu = getCpuPercent();
  const ram = getMemoryInfo();
  const disk = getDiskInfo();

  let downMbps = 0;
  let upMbps = 0;

  const netNow = await readWindowsNetBytes();
  if (netNow && prevNetSnapshot) {
    const dtSec = (netNow.ts - prevNetSnapshot.ts) / 1000;
    if (dtSec > 0.2) {
      const rxDiff = Math.max(0, netNow.rxBytes - prevNetSnapshot.rxBytes);
      const txDiff = Math.max(0, netNow.txBytes - prevNetSnapshot.txBytes);
      downMbps = Math.round(((rxDiff * 8) / (dtSec * 1_000_000)) * 100) / 100;
      upMbps = Math.round(((txDiff * 8) / (dtSec * 1_000_000)) * 100) / 100;
    }
  }
  if (netNow) {
    prevNetSnapshot = netNow;
  }

  const point = {
    ts: Date.now(),
    cpu,
    ram: ram.percent,
    disk: disk.percent,
    upMbps,
    downMbps,
  };

  history.push(point);
  if (history.length > 32) history.shift();

  latestMetrics = {
    source: 'windows-companion',
    hostname: os.hostname(),
    platform: process.platform,
    uptimeSec: Math.round(os.uptime()),
    cpu,
    cpuCores: prevCpuSnapshot.count,
    cpuModel: prevCpuSnapshot.model,
    ram: ram.percent,
    ramUsedGB: ram.usedGB,
    ramTotalGB: ram.totalGB,
    disk: disk.percent,
    diskDrive: disk.drive,
    diskUsedGB: disk.usedGB,
    diskTotalGB: disk.totalGB,
    upMbps,
    downMbps,
    history: [...history],
    updatedAt: point.ts,
  };

  const payload = `data: ${JSON.stringify(latestMetrics)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
}

function serveStatic(reqUrl, res) {
  if (!fs.existsSync(DIST_DIR)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        service: 'Waqar Command Center Companion',
        status: 'running',
        endpoints: ['/api/health', '/api/metrics', '/api/metrics/stream'],
        note: 'Run "npm run build" to also serve the homepage UI from this server.',
      })
    );
    return;
  }

  let pathname = reqUrl.pathname === '/' ? '/index.html' : reqUrl.pathname;
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  if (!filePath.startsWith(DIST_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (reqUrl.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        service: 'waqar-homepage-helper',
        hostname: os.hostname(),
        platform: process.platform,
        uptimeSec: Math.round(os.uptime()),
      })
    );
    return;
  }

  if (reqUrl.pathname === '/api/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(latestMetrics || { status: 'initializing' }));
    return;
  }

  if (reqUrl.pathname === '/api/metrics/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    sseClients.add(res);
    if (latestMetrics) {
      res.write(`data: ${JSON.stringify(latestMetrics)}\n\n`);
    }
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  serveStatic(reqUrl, res);
});

await sampleMetrics();
setInterval(() => {
  sampleMetrics().catch(() => {});
}, 1500);

server.listen(PORT, HOST, () => {
  console.log(`[Homepage Companion] Running at http://${HOST}:${PORT}`);
  console.log(`[Homepage Companion] Live telemetry: http://${HOST}:${PORT}/api/metrics`);
  if (fs.existsSync(DIST_DIR)) {
    console.log(`[Homepage Companion] Dashboard UI also available at http://${HOST}:${PORT}`);
  }
});
