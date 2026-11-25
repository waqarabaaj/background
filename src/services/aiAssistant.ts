import type { AIProvider, AppData, ChatMessage } from '../types';

export interface AIRequestOptions {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  messages: ChatMessage[];
  systemContext?: string;
  onToken: (chunk: string) => void;
  signal?: AbortSignal;
}

export const PROVIDER_DEFAULTS: Record<
  AIProvider,
  { label: string; defaultModel: string; models: string[]; baseUrl: string; needsKey: boolean }
> = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    needsKey: true,
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
    baseUrl: 'https://api.openai.com/v1',
    needsKey: true,
  },
  groq: {
    label: 'Groq (Fast)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'qwen-qwq-32b'],
    baseUrl: 'https://api.groq.com/openai/v1',
    needsKey: true,
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'google/gemini-2.5-flash',
    models: ['google/gemini-2.5-flash', 'anthropic/claude-3.7-sonnet', 'openai/gpt-4o-mini'],
    baseUrl: 'https://openrouter.ai/api/v1',
    needsKey: true,
  },
  ollama: {
    label: 'Ollama (Local, Free)',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'qwen2.5:7b', 'deepseek-r1:8b', 'mistral'],
    baseUrl: 'http://localhost:11434',
    needsKey: false,
  },
};

export function buildWorkspaceContext(data: AppData): string {
  const openTasks = data.tasks.filter((t) => !t.completed).slice(0, 8);
  const doneCount = data.tasks.filter((t) => t.completed).length;
  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = data.events.filter((e) => e.date === today);
  const pinnedNotes = data.notes.filter((n) => n.pinned).slice(0, 5);

  return [
    `You are ${data.settings.userName}'s personal AI assistant inside their Chrome Command Center homepage.`,
    `Current date/time: ${new Date().toLocaleString()}.`,
    `Tasks summary: ${doneCount}/${data.tasks.length} completed. Open tasks: ${
      openTasks.map((t) => `[${t.priority}] ${t.title}`).join('; ') || 'None'
    }.`,
    `Today's schedule: ${
      todayEvents.map((e) => `${e.startTime} ${e.title}`).join('; ') || 'No events today'
    }.`,
    `Active projects: ${data.projects
      .map((p) => `${p.name} (${p.status}, ${p.progress}%)`)
      .join('; ')}.`,
    `Pinned notes: ${pinnedNotes.map((n) => n.title).join('; ')}.`,
    `Be concise, practical, and helpful.`,
  ].join('\n');
}

async function streamGemini(opts: AIRequestOptions): Promise<string> {
  const model = opts.model || PROVIDER_DEFAULTS.gemini.defaultModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:streamGenerateContent?alt=sse&key=${encodeURIComponent(opts.apiKey.trim())}`;

  const contents = opts.messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (opts.systemContext) {
    body.systemInstruction = { parts: [{ text: opts.systemContext }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 220)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Streaming not supported by response');
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          full += text;
          opts.onToken(text);
        }
      } catch {
        // Ignore partial chunk
      }
    }
  }
  return full;
}

async function streamOpenAICompatible(opts: AIRequestOptions): Promise<string> {
  const defaults = PROVIDER_DEFAULTS[opts.provider];
  const baseUrl = (opts.baseUrl || defaults.baseUrl).replace(/\/+$/, '');
  const model = opts.model || defaults.defaultModel;

  const messages = [
    ...(opts.systemContext ? [{ role: 'system', content: opts.systemContext }] : []),
    ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${opts.apiKey.trim()}`,
  };
  if (opts.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Waqar Command Center';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, stream: true }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${defaults.label} API ${res.status}: ${errText.slice(0, 220)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Streaming not supported');
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          opts.onToken(delta);
        }
      } catch {
        // Ignore
      }
    }
  }
  return full;
}

async function streamOllama(opts: AIRequestOptions): Promise<string> {
  const baseUrl = (opts.baseUrl || PROVIDER_DEFAULTS.ollama.baseUrl).replace(/\/+$/, '');
  const model = opts.model || PROVIDER_DEFAULTS.ollama.defaultModel;
  const messages = [
    ...(opts.systemContext ? [{ role: 'system', content: opts.systemContext }] : []),
    ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama ${res.status}: ${errText.slice(0, 220)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('Streaming unavailable');
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        const chunk = parsed?.message?.content;
        if (chunk) {
          full += chunk;
          opts.onToken(chunk);
        }
      } catch {
        // Ignore
      }
    }
  }
  return full;
}

export async function streamAIResponse(opts: AIRequestOptions): Promise<string> {
  if (PROVIDER_DEFAULTS[opts.provider].needsKey && !opts.apiKey.trim()) {
    throw new Error(
      `Add your ${PROVIDER_DEFAULTS[opts.provider].label} API key in Settings (or switch to local Ollama) to chat.`
    );
  }
  if (opts.provider === 'gemini') return streamGemini(opts);
  if (opts.provider === 'ollama') return streamOllama(opts);
  return streamOpenAICompatible(opts);
}
