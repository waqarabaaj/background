import React, { useState, useRef, useEffect } from 'react';
import { Camera, Download, Copy, Check, Pen, RotateCcw, Monitor } from 'lucide-react';

export const ScreenshotTool: React.FC = () => {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [penColor, setPenColor] = useState('#c084fc');
  const [drawing, setDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseImageRef = useRef<HTMLImageElement | null>(null);

  const hasChromeTabCapture =
    typeof chrome !== 'undefined' && Boolean(chrome.tabs && chrome.tabs.captureVisibleTab);

  const drawBaseImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      baseImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  useEffect(() => {
    if (imageDataUrl) {
      drawBaseImage(imageDataUrl);
    }
  }, [imageDataUrl]);

  const captureScreenOrWindow = async () => {
    setError(null);
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        audio: false,
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 120));

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth || 1920;
      tempCanvas.height = video.videoHeight || 1080;
      const ctx = tempCanvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

      stream.getTracks().forEach((t) => t.stop());
      setImageDataUrl(tempCanvas.toDataURL('image/png'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Screen capture cancelled.');
    } finally {
      setCapturing(false);
    }
  };

  const captureCurrentTab = () => {
    setError(null);
    if (!hasChromeTabCapture) return;
    setCapturing(true);
    chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
      setCapturing(false);
      if (chrome.runtime.lastError || !dataUrl) {
        setError(chrome.runtime.lastError?.message || 'Unable to capture tab.');
        return;
      }
      setImageDataUrl(dataUrl);
    });
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = Math.max(4, canvas.width / 260);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => setDrawing(false);

  const clearAnnotations = () => {
    if (imageDataUrl) drawBaseImage(imageDataUrl);
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `screenshot-${Date.now()}.png`;
    a.click();
  };

  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setError('Clipboard image copy blocked by browser permissions — use Download PNG.');
      }
    }, 'image/png');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-purple-500/20">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={capturing}
            onClick={captureScreenOrWindow}
            className="purple-glow-btn px-3.5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{capturing ? 'Capturing...' : 'Capture Window / Screen'}</span>
          </button>

          {hasChromeTabCapture && (
            <button
              type="button"
              disabled={capturing}
              onClick={captureCurrentTab}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Current Tab</span>
            </button>
          )}
        </div>

        {imageDataUrl && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-purple-500/20">
              <Pen className="w-3 h-3 text-slate-400" />
              {['#c084fc', '#f43f5e', '#38bdf8', '#facc15', '#34d399'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setPenColor(col)}
                  className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                    penColor === col ? 'scale-125 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={clearAnnotations}
              title="Reset annotations"
              className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-slate-300 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {imageDataUrl ? (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border border-purple-500/30 bg-black/60 max-h-[360px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="max-w-full max-h-[360px] object-contain cursor-crosshair touch-none"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tip: Draw directly on the preview to annotate before saving.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy PNG'}</span>
              </button>
              <button
                type="button"
                onClick={downloadPng}
                className="purple-glow-btn px-4 py-1.5 rounded-lg text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download PNG
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-purple-500/30 bg-black/25 py-14 text-center">
          <Camera className="w-10 h-10 text-purple-400/70 mx-auto mb-2.5" />
          <p className="text-sm text-slate-200 font-medium">
            Quick Capture & Annotate
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Grab any desktop window, screen, or tab — annotate right here, copy, or save PNG.
          </p>
        </div>
      )}
    </div>
  );
};
