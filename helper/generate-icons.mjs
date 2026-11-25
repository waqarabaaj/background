/**
 * Generates crisp anti-aliased PNG extension icons (16, 48, 128)
 * with zero external dependencies using Node's built-in zlib.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function roundedRectSdf(x, y, cx, cy, hw, hh, r) {
  const dx = Math.abs(x - cx) - hw + r;
  const dy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const segs = [
    [0.22, 0.30, 0.35, 0.72],
    [0.35, 0.72, 0.50, 0.42],
    [0.50, 0.42, 0.65, 0.72],
    [0.65, 0.72, 0.78, 0.30],
  ];
  const strokeW = 0.055;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;

      const sdf = roundedRectSdf(u, v, 0.5, 0.5, 0.47, 0.47, 0.22);
      const aa = Math.max(0, Math.min(1, 0.5 - sdf * size));

      // Background cosmic purple gradient
      const grad = (u + v) * 0.5;
      let r = 20 + grad * 52;
      let g = 14 + grad * 22;
      let b = 46 + grad * 95;

      // Subtle glowing border
      const borderAlpha = Math.max(0, Math.min(1, 1 - Math.abs(sdf + 0.025) * size * 0.8));
      r = r * (1 - borderAlpha * 0.65) + 158 * borderAlpha * 0.65;
      g = g * (1 - borderAlpha * 0.65) + 104 * borderAlpha * 0.65;
      b = b * (1 - borderAlpha * 0.65) + 255 * borderAlpha * 0.65;

      // W glyph + subtle purple halo
      let minDist = 999;
      for (const [x1, y1, x2, y2] of segs) {
        minDist = Math.min(minDist, distToSegment(u, v, x1, y1, x2, y2));
      }

      const glow = Math.exp(-Math.pow(minDist / 0.12, 2)) * 0.55;
      r = Math.min(255, r + 139 * glow);
      g = Math.min(255, g + 92 * glow);
      b = Math.min(255, b + 246 * glow);

      const glyphAlpha = Math.max(0, Math.min(1, 0.5 - (minDist - strokeW) * size));
      r = r * (1 - glyphAlpha) + 255 * glyphAlpha;
      g = g * (1 - glyphAlpha) + 255 * glyphAlpha;
      b = b * (1 - glyphAlpha) + 255 * glyphAlpha;

      // Accent dot top-right
      const dotDist = Math.hypot(u - 0.78, v - 0.23);
      const dotAlpha = Math.max(0, Math.min(1, 0.5 - (dotDist - 0.048) * size));
      r = r * (1 - dotAlpha) + 216 * dotAlpha;
      g = g * (1 - dotAlpha) + 180 * dotAlpha;
      b = b * (1 - dotAlpha) + 254 * dotAlpha;

      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(Math.min(255, r));
      rgba[idx + 1] = Math.round(Math.min(255, g));
      rgba[idx + 2] = Math.round(Math.min(255, b));
      rgba[idx + 3] = Math.round(aa * 255);
    }
  }

  return encodePNG(size, size, rgba);
}

for (const size of [16, 48, 128]) {
  const filePath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, renderIcon(size));
  console.log(`Generated ${filePath}`);
}
