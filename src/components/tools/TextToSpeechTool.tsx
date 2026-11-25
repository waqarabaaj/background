import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';

export const TextToSpeechTool: React.FC = () => {
  const [text, setText] = useState(
    'Stay focused, stay consistent, and ship your goals. Welcome to your Chrome Command Center.'
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('');
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const loadVoices = () => {
      const list = synth.getVoices();
      setVoices(list);
      if (list.length > 0 && !selectedVoiceUri) {
        const preferred =
          list.find((v) => /natural|google|microsoft.*online/i.test(v.name) && v.lang.startsWith('en')) ||
          list.find((v) => v.lang.startsWith('en')) ||
          list[0];
        if (preferred) setSelectedVoiceUri(preferred.voiceURI);
      }
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSpeak = () => {
    const synth = window.speechSynthesis;
    if (!synth || !text.trim()) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === selectedVoiceUri);
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.pitch = pitch;
    utter.volume = volume;
    utter.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };
    utter.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utter.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    synth.speak(utter);
  };

  const handlePauseResume = () => {
    const synth = window.speechSynthesis;
    if (!synth || !speaking) return;
    if (paused) {
      synth.resume();
      setPaused(false);
    } else {
      synth.pause();
      setPaused(true);
    }
  };

  const handleStop = () => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPaused(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type any text to read aloud..."
        className="w-full p-3.5 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-purple-400"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1">System / Chrome Voice ({voices.length})</label>
          <select
            value={selectedVoiceUri}
            onChange={(e) => setSelectedVoiceUri(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
          >
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="block text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Speed</span>
              <span>{rate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full mt-2 accent-purple-500"
            />
          </label>
          <label className="block text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Pitch</span>
              <span>{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full mt-2 accent-purple-500"
            />
          </label>
          <label className="block text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Vol</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full mt-2 accent-purple-500"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Volume2 className={`w-4 h-4 ${speaking ? 'text-purple-400 animate-pulse' : ''}`} />
          <span>
            {speaking ? (paused ? 'Paused' : 'Speaking aloud...') : `${text.length} characters`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {speaking && (
            <>
              <button
                type="button"
                onClick={handlePauseResume}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer"
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-white" /> Stop
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSpeak}
            className="purple-glow-btn px-5 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Speak Now
          </button>
        </div>
      </div>
    </div>
  );
};
