/**
 * Gemini function-calling transport for the copilot.
 *
 * Default: same-origin server proxy (`/api/ai/copilot`) so the API key stays
 * server-side. Optional: direct REST call when the deployer explicitly opts in
 * with `VITE_AI_USE_PROXY=false` + `VITE_GEMINI_API_KEY`.
 */
import { appEnv } from '../lib/config/env';

export interface GeminiFunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

export interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
  thoughtSignature?: string;
  [key: string]: unknown;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface CopilotModelResponse {
  text: string;
  functionCalls: GeminiFunctionCall[];
  /** Raw model content to echo back verbatim on the next round (keeps thought signatures). */
  content?: GeminiContent;
}

export interface EngineStatus {
  available: boolean;
  model: string | null;
  via: 'proxy' | 'direct' | 'none';
}

const DIRECT_MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = 25_000;

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await p(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

let cachedStatus: { at: number; value: EngineStatus } | null = null;

/** Detects whether a cloud model is reachable. Cached for 60 s; failures cached for 20 s. */
export async function getEngineStatus(force = false): Promise<EngineStatus> {
  if (!force && cachedStatus && Date.now() - cachedStatus.at < (cachedStatus.value.available ? 60_000 : 20_000)) {
    return cachedStatus.value;
  }
  let value: EngineStatus = { available: false, model: null, via: 'none' };
  if (!appEnv.aiUseProxy) {
    const key = appEnv.geminiApiKey;
    if (key && key.length > 10 && !key.includes('MY_GEMINI')) value = { available: true, model: DIRECT_MODEL, via: 'direct' };
  } else {
    try {
      const res = await withTimeout((signal) => fetch(`${appEnv.apiBaseUrl}/api/ai/status`, { signal }), 3000);
      const type = res.headers.get('content-type') ?? '';
      if (res.ok && type.includes('application/json')) {
        const data = (await res.json()) as { configured?: boolean; model?: string };
        if (data.configured) value = { available: true, model: data.model ?? null, via: 'proxy' };
      }
    } catch {
      /* offline or vite-only dev server → local engine */
    }
  }
  cachedStatus = { at: Date.now(), value };
  return value;
}

export function markEngineUnavailable(): void {
  cachedStatus = { at: Date.now(), value: { available: false, model: null, via: 'none' } };
}

export async function callCopilotModel(input: {
  system: string;
  contents: GeminiContent[];
  tools: unknown[];
}): Promise<CopilotModelResponse> {
  const status = await getEngineStatus();
  if (!status.available) throw new Error('copilot model unavailable');

  if (status.via === 'proxy') {
    const res = await withTimeout(
      (signal) =>
        fetch(`${appEnv.apiBaseUrl}/api/ai/copilot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal,
        }),
      TIMEOUT_MS,
    );
    if (!res.ok) throw new Error(`copilot proxy ${res.status}`);
    const data = (await res.json()) as Partial<CopilotModelResponse>;
    return { text: data.text ?? '', functionCalls: data.functionCalls ?? [], content: data.content };
  }

  // Direct REST (explicit opt-in only).
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DIRECT_MODEL}:generateContent?key=${encodeURIComponent(appEnv.geminiApiKey)}`;
  const res = await withTimeout(
    (signal) =>
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: input.contents,
          tools: [{ functionDeclarations: input.tools }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
        signal,
      }),
    TIMEOUT_MS,
  );
  if (!res.ok) throw new Error(`gemini ${res.status}`);
  const data = await res.json();
  const content = data?.candidates?.[0]?.content as GeminiContent | undefined;
  const parts = content?.parts ?? [];
  return {
    text: parts.map((p) => p.text ?? '').join('').trim(),
    functionCalls: parts.filter((p) => p.functionCall).map((p) => p.functionCall as GeminiFunctionCall),
    content,
  };
}
