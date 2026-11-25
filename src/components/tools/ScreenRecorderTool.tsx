import React, { useState, useRef, useEffect } from 'react';
import { Video, Square, Pause, Play, Download, Mic, MicOff, Volume2, Trash2 } from 'lucide-react';

export const ScreenRecorderTool: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'ready'>('idle');
  const [includeMic, setIncludeMic] = useState(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileSizeBytes, setFileSizeBytes] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const stopAllStreams = () => {
    streamsRef.current.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streamsRef.current = [];
  };

  const startRecording = async () => {
    setError(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: includeSystemAudio,
      });
      streamsRef.current.push(displayStream);

      let finalStream = displayStream;

      if (includeMic) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamsRef.current.push(micStream);

          const audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();
          if (displayStream.getAudioTracks().length > 0) {
            audioCtx.createMediaStreamSource(displayStream).connect(dest);
          }
          audioCtx.createMediaStreamSource(micStream).connect(dest);

          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch {
          // Proceed without mic if denied
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(finalStream, { mimeType })
        : new MediaRecorder(finalStream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        setFileSizeBytes(blob.size);
        setStatus('ready');
        stopAllStreams();
      };

      // Stop if user clicks Chrome's native "Stop sharing" button
      displayStream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setElapsedSec(0);
      setStatus('recording');

      timerRef.current = window.setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    } catch (e) {
      stopAllStreams();
      setError(e instanceof Error ? e.message : 'Screen capture was cancelled or denied.');
      setStatus('idle');
    }
  };

  const togglePause = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStatus('paused');
    } else if (rec.state === 'paused') {
      rec.resume();
      timerRef.current = window.setInterval(() => setElapsedSec((s) => s + 1), 1000);
      setStatus('recording');
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
  };

  const downloadRecording = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `screen-recording-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`;
    a.click();
  };

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 border border-purple-500/20">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={status === 'recording' || status === 'paused'}
            onClick={() => setIncludeMic((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
              includeMic
                ? 'bg-purple-600/30 border-purple-400/50 text-purple-100'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {includeMic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span>Microphone {includeMic ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            disabled={status === 'recording' || status === 'paused'}
            onClick={() => setIncludeSystemAudio((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
              includeSystemAudio
                ? 'bg-purple-600/30 border-purple-400/50 text-purple-100'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Tab/System Audio {includeSystemAudio ? 'On' : 'Off'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(status === 'recording' || status === 'paused') && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-xs font-mono text-rose-200">
              <span
                className={`w-2 h-2 rounded-full bg-rose-400 ${
                  status === 'recording' ? 'animate-pulse' : ''
                }`}
              />
              {mm}:{ss}
            </span>
          )}

          {status === 'idle' || status === 'ready' ? (
            <button
              type="button"
              onClick={startRecording}
              className="purple-glow-btn px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>{status === 'ready' ? 'Record Again' : 'Start Screen Recording'}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
              >
                {status === 'recording' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{status === 'recording' ? 'Pause' : 'Resume'}</span>
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
          {error}
        </div>
      )}

      {videoUrl ? (
        <div className="space-y-3">
          <video
            src={videoUrl}
            controls
            className="w-full max-h-[340px] rounded-xl bg-black border border-purple-500/25"
          />
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              Recorded clip ready • {(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB (.webm)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(videoUrl);
                  setVideoUrl(null);
                  setStatus('idle');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard
              </button>
              <button
                type="button"
                onClick={downloadRecording}
                className="purple-glow-btn px-4 py-1.5 rounded-lg text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download WebM
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-purple-500/30 bg-black/25 py-14 text-center">
          <Video className="w-10 h-10 text-purple-400/70 mx-auto mb-2.5" />
          <p className="text-sm text-slate-200 font-medium">
            {status === 'recording'
              ? 'Recording your screen live...'
              : status === 'paused'
              ? 'Recording paused'
              : 'Record any window, screen, or Chrome tab locally'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            100% local in-browser MediaRecorder — zero uploads, instant .webm download.
          </p>
        </div>
      )}
    </div>
  );
};
