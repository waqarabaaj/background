import React, { useState } from 'react';
import { Upload, Download, Copy, Check, ArrowRight, Image as ImageIcon, FileCode2 } from 'lucide-react';
import yaml from 'js-yaml';

type ImageTargetFormat = 'image/png' | 'image/jpeg' | 'image/webp';
type DataConversionMode =
  | 'json-to-yaml'
  | 'yaml-to-json'
  | 'json-to-csv'
  | 'csv-to-json'
  | 'text-to-base64'
  | 'base64-to-text';

function jsonToCsv(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return '';
  const keys = Array.from(
    new Set(arr.flatMap((row) => (row && typeof row === 'object' ? Object.keys(row) : [])))
  );
  const escape = (val: unknown) => {
    const s = val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    keys.map(escape).join(','),
    ...arr.map((row) => keys.map((k) => escape((row as Record<string, unknown>)[k])).join(',')),
  ].join('\n');
}

function csvToJson(csvStr: string): string {
  const lines = csvStr
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return '[]';
  const parseLine = (line: string) => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((l) => {
    const vals = parseLine(l);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i] ?? '';
    });
    return obj;
  });
  return JSON.stringify(rows, null, 2);
}

export const FileConverterTool: React.FC = () => {
  const [tab, setTab] = useState<'image' | 'data'>('image');

  // Image converter state
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageTargetFormat>('image/webp');
  const [quality, setQuality] = useState(0.9);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState(0);
  const [converting, setConverting] = useState(false);

  // Data converter state
  const [dataMode, setDataMode] = useState<DataConversionMode>('json-to-yaml');
  const [dataInput, setDataInput] = useState(
    '[\n  { "name": "Medicare Automation", "status": "In Progress", "progress": 68 },\n  { "name": "Khanam Crafts", "status": "Active", "progress": 82 }\n]'
  );
  const [dataOutput, setDataOutput] = useState('');
  const [dataError, setDataError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImagePick = (file: File | undefined) => {
    if (!file) return;
    setSourceFile(file);
    setConvertedUrl(null);
    const reader = new FileReader();
    reader.onload = () => setSourcePreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const convertImage = () => {
    if (!sourcePreview) return;
    setConverting(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          setConverting(false);
          if (!blob) return;
          if (convertedUrl) URL.revokeObjectURL(convertedUrl);
          setConvertedUrl(URL.createObjectURL(blob));
          setConvertedSize(blob.size);
        },
        targetFormat,
        quality
      );
    };
    img.src = sourcePreview;
  };

  const extFromMime = (mime: ImageTargetFormat) =>
    mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpg' : 'webp';

  const runDataConvert = () => {
    setDataError(null);
    try {
      let out = '';
      switch (dataMode) {
        case 'json-to-yaml':
          out = yaml.dump(JSON.parse(dataInput));
          break;
        case 'yaml-to-json':
          out = JSON.stringify(yaml.load(dataInput), null, 2);
          break;
        case 'json-to-csv':
          out = jsonToCsv(dataInput);
          break;
        case 'csv-to-json':
          out = csvToJson(dataInput);
          break;
        case 'text-to-base64':
          out = btoa(unescape(encodeURIComponent(dataInput)));
          break;
        case 'base64-to-text':
          out = decodeURIComponent(escape(atob(dataInput.trim())));
          break;
      }
      setDataOutput(out);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Conversion failed');
    }
  };

  const copyDataOutput = async () => {
    if (!dataOutput) return;
    await navigator.clipboard.writeText(dataOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadDataOutput = () => {
    if (!dataOutput) return;
    const ext = dataMode.endsWith('yaml')
      ? 'yaml'
      : dataMode.endsWith('json')
      ? 'json'
      : dataMode.endsWith('csv')
      ? 'csv'
      : 'txt';
    const blob = new Blob([dataOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Mode Switch */}
      <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-purple-500/20 w-fit">
        <button
          type="button"
          onClick={() => setTab('image')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
            tab === 'image' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Image Converter (PNG/JPG/WebP)
        </button>
        <button
          type="button"
          onClick={() => setTab('data')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
            tab === 'data' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" /> Data Converter (JSON/CSV/YAML/Base64)
        </button>
      </div>

      {tab === 'image' ? (
        <div className="space-y-4">
          <label className="block rounded-xl border border-dashed border-purple-400/40 bg-white/[0.03] hover:bg-purple-500/10 p-6 text-center cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImagePick(e.target.files?.[0])}
            />
            <Upload className="w-7 h-7 text-purple-300 mx-auto mb-2" />
            <div className="text-sm font-medium text-white">
              {sourceFile ? sourceFile.name : 'Click to select any PNG, JPG, WebP, SVG, or BMP'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {sourceFile
                ? `Original size: ${(sourceFile.size / 1024).toFixed(1)} KB`
                : 'Converted 100% locally in your browser — files never leave your PC'}
            </div>
          </label>

          {sourcePreview && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="rounded-xl overflow-hidden border border-purple-500/25 bg-black/40 p-2 flex items-center justify-center h-48">
                <img
                  src={convertedUrl || sourcePreview}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Target Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { mime: 'image/webp', label: 'WebP' },
                        { mime: 'image/png', label: 'PNG' },
                        { mime: 'image/jpeg', label: 'JPG' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.mime}
                        type="button"
                        onClick={() => setTargetFormat(f.mime)}
                        className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                          targetFormat === f.mime
                            ? 'bg-purple-600/40 border-purple-400 text-white'
                            : 'bg-white/5 border-white/10 text-slate-300'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {targetFormat !== 'image/png' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Quality</span>
                      <span>{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={convertImage}
                  disabled={converting}
                  className="purple-glow-btn w-full py-2 rounded-xl text-xs font-semibold text-white cursor-pointer"
                >
                  {converting ? 'Converting...' : `Convert to ${extFromMime(targetFormat).toUpperCase()}`}
                </button>

                {convertedUrl && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-xs">
                    <span className="text-emerald-200">
                      Ready: {(convertedSize / 1024).toFixed(1)} KB
                    </span>
                    <a
                      href={convertedUrl}
                      download={`${(sourceFile?.name || 'image').replace(/\.[^.]+$/, '')}.${extFromMime(
                        targetFormat
                      )}`}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dataMode}
              onChange={(e) => setDataMode(e.target.value as DataConversionMode)}
              className="px-3 py-1.5 rounded-xl bg-[#161231] border border-purple-500/35 text-xs text-white"
            >
              <option value="json-to-yaml">JSON → YAML</option>
              <option value="yaml-to-json">YAML → JSON</option>
              <option value="json-to-csv">JSON → CSV</option>
              <option value="csv-to-json">CSV → JSON</option>
              <option value="text-to-base64">Text → Base64</option>
              <option value="base64-to-text">Base64 → Text</option>
            </select>
            <button
              type="button"
              onClick={runDataConvert}
              className="purple-glow-btn px-4 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <span>Convert</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {dataOutput && (
              <>
                <button
                  type="button"
                  onClick={copyDataOutput}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={downloadDataOutput}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Save File
                </button>
              </>
            )}
          </div>

          {dataError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
              {dataError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <textarea
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              rows={10}
              placeholder="Paste source text/data here..."
              className="w-full p-3 rounded-xl bg-black/35 border border-purple-500/25 text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-400"
            />
            <textarea
              readOnly
              value={dataOutput}
              rows={10}
              placeholder="Converted output will appear here..."
              className="w-full p-3 rounded-xl bg-black/50 border border-purple-500/20 text-xs font-mono text-purple-100 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
