import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Wifi, Link as LinkIcon, Mail } from 'lucide-react';

type QRMode = 'text' | 'wifi' | 'email';

export const QRGeneratorTool: React.FC = () => {
  const [mode, setMode] = useState<QRMode>('text');
  const [text, setText] = useState('https://github.com');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiEnc, setWifiEnc] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [emailTo, setEmailTo] = useState('');
  const [emailSubj, setEmailSubj] = useState('');

  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#131029');
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [pngUrl, setPngUrl] = useState<string>('');
  const [svgStr, setSvgStr] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const payload =
    mode === 'text'
      ? text || ' '
      : mode === 'wifi'
      ? `WIFI:T:${wifiEnc};S:${wifiSsid};P:${wifiPass};;`
      : `mailto:${emailTo}?subject=${encodeURIComponent(emailSubj)}`;

  useEffect(() => {
    let active = true;
    const opts = {
      width: 320,
      margin: 2,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    };

    Promise.all([
      QRCode.toDataURL(payload, opts),
      QRCode.toString(payload, { ...opts, type: 'svg' }),
    ])
      .then(([dataUrl, svg]) => {
        if (!active) return;
        setPngUrl(dataUrl);
        setSvgStr(svg);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [payload, fgColor, bgColor, ecLevel]);

  const downloadPng = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `qr-code-${Date.now()}.png`;
    a.click();
  };

  const downloadSvg = () => {
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPayload = async () => {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
      <div className="space-y-3">
        {/* Type Tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-black/30 border border-purple-500/20">
          {(
            [
              { id: 'text', label: 'URL / Text', icon: LinkIcon },
              { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
              { id: 'email', label: 'Email', icon: Mail },
            ] as const
          ).map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === m.id ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {mode === 'text' && (
          <div>
            <label className="block text-xs text-slate-300 mb-1">Content or URL</label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter any URL, text, or note..."
              className="w-full p-3 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-400"
            />
          </div>
        )}

        {mode === 'wifi' && (
          <div className="space-y-2.5">
            <input
              type="text"
              value={wifiSsid}
              onChange={(e) => setWifiSsid(e.target.value)}
              placeholder="Network Name (SSID)"
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white focus:outline-none"
            />
            <input
              type="text"
              value={wifiPass}
              onChange={(e) => setWifiPass(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white focus:outline-none"
            />
            <select
              value={wifiEnc}
              onChange={(e) => setWifiEnc(e.target.value as 'WPA' | 'WEP' | 'nopass')}
              className="w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
            >
              <option value="WPA">WPA / WPA2 / WPA3</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Open (No Password)</option>
            </select>
          </div>
        )}

        {mode === 'email' && (
          <div className="space-y-2.5">
            <input
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="Recipient email"
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white focus:outline-none"
            />
            <input
              type="text"
              value={emailSubj}
              onChange={(e) => setEmailSubj(e.target.value)}
              placeholder="Subject line"
              className="w-full px-3 py-2 rounded-xl bg-white/7 border border-purple-500/30 text-xs text-white focus:outline-none"
            />
          </div>
        )}

        {/* Style Controls */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <label className="block text-xs text-slate-300">
            <span>Foreground</span>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="mt-1 w-full h-8 rounded-lg bg-transparent cursor-pointer"
            />
          </label>
          <label className="block text-xs text-slate-300">
            <span>Background</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="mt-1 w-full h-8 rounded-lg bg-transparent cursor-pointer"
            />
          </label>
          <label className="block text-xs text-slate-300">
            <span>Correction</span>
            <select
              value={ecLevel}
              onChange={(e) => setEcLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
              className="mt-1 w-full h-8 px-2 rounded-lg bg-[#161231] border border-purple-500/30 text-xs text-white"
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Live Preview + Downloads */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/30 border border-purple-500/25">
        {pngUrl && (
          <img
            src={pngUrl}
            alt="Generated QR Code"
            className="w-56 h-56 rounded-xl shadow-[0_0_24px_rgba(139,92,246,0.35)]"
          />
        )}
        <div className="flex flex-wrap justify-center gap-2 w-full">
          <button
            type="button"
            onClick={downloadPng}
            className="purple-glow-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> PNG
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> SVG
          </button>
          <button
            type="button"
            onClick={copyPayload}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Text'}
          </button>
        </div>
      </div>
    </div>
  );
};
