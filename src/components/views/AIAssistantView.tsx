import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Square, Trash2, Settings, Copy, Check, Brain } from 'lucide-react';
import type { AIProvider, AppData, ChatMessage, UserSettings } from '../../types';
import {
  PROVIDER_DEFAULTS,
  buildWorkspaceContext,
  streamAIResponse,
} from '../../services/aiAssistant';
import { uid } from '../../store/useAppStore';

interface AIAssistantViewProps {
  data: AppData;
  onSetMessages: (
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onOpenSettings: () => void;
}

const SUGGESTIONS = [
  'Plan my next 3 hours based on my open tasks and today’s schedule',
  'Summarize my active projects and suggest the highest-impact next step',
  'Create a concise study checklist from my pinned notes',
  'Write a clean TypeScript debounce utility with types',
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  data,
  onSetMessages,
  onUpdateSettings,
  onOpenSettings,
}) => {
  const { settings, chatMessages } = data;
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, streaming]);

  const providerMeta = PROVIDER_DEFAULTS[settings.aiProvider];
  const needsKeyWarning = providerMeta.needsKey && !settings.aiApiKey.trim();

  const sendMessage = async (rawText: string) => {
    const content = rawText.trim();
    if (!content || streaming) return;
    setError(null);

    const userMsg: ChatMessage = {
      id: uid('msg'),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    const assistantId = uid('msg');
    const assistantPlaceholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      model: settings.aiModel || providerMeta.defaultModel,
    };

    const nextHistory = [...chatMessages, userMsg];
    onSetMessages([...nextHistory, assistantPlaceholder]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAIResponse({
        provider: settings.aiProvider,
        apiKey: settings.aiApiKey,
        model: settings.aiModel || providerMeta.defaultModel,
        baseUrl: settings.aiBaseUrl,
        messages: nextHistory,
        systemContext: settings.aiIncludeContext ? buildWorkspaceContext(data) : undefined,
        signal: controller.signal,
        onToken: (chunk) => {
          onSetMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
      });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        const msg = e instanceof Error ? e.message : 'AI request failed';
        setError(msg);
        onSetMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content.length > 0));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const handleCopy = async (msg: ChatMessage) => {
    await navigator.clipboard.writeText(msg.content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div className="max-w-5xl mx-auto py-3 flex flex-col h-[calc(100vh-140px)] min-h-[520px] glass-card rounded-2xl overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-purple-500/20 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/35 border border-purple-400/50 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-200" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Assistant</h2>
            <p className="text-[11px] text-slate-400">
              Live streaming • {providerMeta.label} ({settings.aiModel || providerMeta.defaultModel})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={settings.aiProvider}
            onChange={(e) => {
              const p = e.target.value as AIProvider;
              onUpdateSettings({
                aiProvider: p,
                aiModel: PROVIDER_DEFAULTS[p].defaultModel,
              });
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#161231] border border-purple-500/30 text-xs text-white"
          >
            {(Object.keys(PROVIDER_DEFAULTS) as AIProvider[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_DEFAULTS[p].label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ aiIncludeContext: !settings.aiIncludeContext })
            }
            title="Include your live tasks, projects, calendar & notes as AI context"
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
              settings.aiIncludeContext
                ? 'bg-purple-600/35 border-purple-400/50 text-purple-100'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Workspace Context {settings.aiIncludeContext ? 'On' : 'Off'}</span>
          </button>

          {chatMessages.length > 0 && (
            <button
              type="button"
              onClick={() => onSetMessages([])}
              title="Clear conversation"
              className="p-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-slate-300 hover:text-rose-300 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Configure API Key & Model"
            className="p-1.5 rounded-xl bg-white/8 hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Inline API Key Setup Banner if missing */}
      {needsKeyWarning && (
        <div className="px-5 py-3 bg-purple-600/15 border-b border-purple-400/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-purple-100">
            Enter your <strong>{providerMeta.label}</strong> API key (stored locally in your browser) or switch to <strong>Ollama (Local, Free)</strong>:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={settings.aiApiKey}
              onChange={(e) => onUpdateSettings({ aiApiKey: e.target.value })}
              placeholder={`Paste ${providerMeta.label} API key...`}
              className="px-3 py-1 rounded-lg bg-black/40 border border-purple-400/40 text-xs text-white w-56 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/25 border border-purple-400/40 flex items-center justify-center mb-3 shadow-[0_0_24px_rgba(139,92,246,0.4)]">
              <Sparkles className="w-6 h-6 text-purple-300" />
            </div>
            <h3 className="text-lg font-bold text-white">
              How can I help you ship today, {settings.userName}?
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Powered by real streaming {providerMeta.label}. Toggle Workspace Context to let me read your live tasks, notes, projects, and calendar.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="text-left p-3 rounded-xl bg-white/[0.04] hover:bg-purple-500/15 border border-purple-500/20 hover:border-purple-400/50 text-xs text-slate-200 transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap relative group ${
                  msg.role === 'user'
                    ? 'bg-purple-600/80 text-white rounded-br-sm'
                    : 'bg-white/[0.06] border border-purple-500/20 text-slate-100 rounded-bl-sm'
                }`}
              >
                {msg.content || (
                  <span className="inline-flex gap-1 text-purple-300 animate-pulse">
                    Thinking...
                  </span>
                )}
                {msg.role === 'assistant' && msg.content && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg)}
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md bg-black/40 text-slate-300 hover:text-white transition-opacity cursor-pointer"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-3.5 border-t border-purple-500/20 bg-black/25 flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything — code, study prep, planning, or summarize your dashboard..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/7 border border-purple-500/30 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-400"
        />
        {streaming ? (
          <button
            type="button"
            onClick={handleStop}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-white" /> Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="purple-glow-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-45 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        )}
      </form>
    </div>
  );
};
