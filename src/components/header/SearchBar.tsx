import React, { useState, useRef } from 'react';
import { Mic, MicOff, Camera } from 'lucide-react';
import type { SearchEngineId } from '../../types';

interface SearchBarProps {
  engine: SearchEngineId;
  onChangeEngine: (engine: SearchEngineId) => void;
}

const ENGINES: Record<
  SearchEngineId,
  { name: string; placeholder: string; buildUrl: (q: string) => string }
> = {
  google: {
    name: 'Google',
    placeholder: 'Search Google or type a URL',
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    placeholder: 'Search DuckDuckGo or type a URL',
    buildUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  perplexity: {
    name: 'Perplexity',
    placeholder: 'Ask Perplexity or type a URL',
    buildUrl: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`,
  },
  bing: {
    name: 'Bing',
    placeholder: 'Search Bing or type a URL',
    buildUrl: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  },
  youtube: {
    name: 'YouTube',
    placeholder: 'Search YouTube or type a URL',
    buildUrl: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  },
};

function looksLikeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) return `http://${trimmed}`;
  if (/^[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})(\/.*)?$/.test(trimmed) && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return null;
}

export const SearchBar: React.FC<SearchBarProps> = ({ engine, onChangeEngine }) => {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [engineMenuOpen, setEngineMenuOpen] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const currentEngine = ENGINES[engine] || ENGINES.google;

  const submitQuery = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const directUrl = looksLikeUrl(trimmed);
    const target = directUrl || currentEngine.buildUrl(trimmed);
    window.location.href = target;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(query);
  };

  const handleVoiceSearch = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert('Voice search requires Chrome Web Speech API support.');
      return;
    }

    const recognition = new SpeechRecognitionCtor() as {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    };

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setQuery(transcript);
        submitQuery(transcript);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <div className="relative w-full max-w-[660px] mx-auto">
      <form
        onSubmit={handleSubmit}
        className="glass-pill rounded-full px-4 py-2.5 flex items-center gap-3 focus-within:border-purple-400/80 focus-within:shadow-[0_0_28px_rgba(139,92,246,0.5)] transition-all"
      >
        {/* Engine switcher button with official Google G icon */}
        <button
          type="button"
          onClick={() => setEngineMenuOpen((o) => !o)}
          title={`Search engine: ${currentEngine.name} (click to switch)`}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
        >
          {engine === 'google' ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          ) : (
            <span className="text-xs font-bold text-purple-200 uppercase">
              {currentEngine.name.slice(0, 2)}
            </span>
          )}
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={listening ? 'Listening... speak now' : currentEngine.placeholder}
          className="flex-1 bg-transparent text-[14.5px] text-white placeholder:text-slate-300/65 focus:outline-none"
          autoComplete="off"
        />

        {/* Real Web Speech Voice Search */}
        <button
          type="button"
          onClick={handleVoiceSearch}
          title={listening ? 'Stop voice search' : 'Search by voice'}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
            listening
              ? 'bg-rose-500/30 text-rose-300 animate-pulse'
              : 'hover:bg-white/10 text-sky-400'
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Google Lens visual search */}
        <a
          href="https://lens.google.com/"
          title="Open Google Lens visual search"
          className="p-1.5 rounded-full hover:bg-white/10 text-amber-300 transition-colors"
        >
          <Camera className="w-4 h-4" />
        </a>
      </form>

      {engineMenuOpen && (
        <div className="absolute left-3 mt-2 w-44 rounded-xl bg-[#14112c]/96 backdrop-blur-xl border border-purple-500/35 shadow-2xl p-1.5 z-40">
          {(Object.keys(ENGINES) as SearchEngineId[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChangeEngine(key);
                setEngineMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                engine === key
                  ? 'bg-purple-600/40 text-white'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              {ENGINES[key].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
