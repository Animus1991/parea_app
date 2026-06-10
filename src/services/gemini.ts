/**
 * Gemini integration — routes through server proxy when configured (P2 security).
 */
import { appEnv } from '../lib/config/env';

const DIRECT_API =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getClientApiKey(): string {
  return (
    appEnv.geminiApiKey ||
    (typeof process !== 'undefined' &&
      (process as { env?: { GEMINI_API_KEY?: string } }).env?.GEMINI_API_KEY) ||
    ''
  );
}

export function isGeminiConfigured(): boolean {
  if (appEnv.aiUseProxy) return true;
  const key = getClientApiKey();
  return key.length > 10 && !key.includes('MY_GEMINI');
}

async function generateText(prompt: string): Promise<string | null> {
  if (!isGeminiConfigured()) return null;

  try {
    if (appEnv.aiUseProxy) {
      const base = appEnv.apiBaseUrl || '';
      const res = await fetch(`${base}/api/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, model: 'gemini-2.0-flash' }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { text?: string };
      return typeof data.text === 'string' ? data.text.trim() : null;
    }

    const key = getClientApiKey();
    const res = await fetch(`${DIRECT_API}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === 'string' ? text.trim() : null;
  } catch {
    return null;
  }
}

export async function generateEventBlurb(
  title: string,
  category: string,
  language: 'el' | 'en',
): Promise<string | null> {
  const lang = language === 'el' ? 'Greek' : 'English';
  return generateText(
    `Write a warm 2-sentence event description in ${lang} for a social companion app (not dating). Event: "${title}", category: ${category}. No hashtags.`,
  );
}

export async function generateGroupIcebreakers(
  eventTitle: string,
  interests: string[],
  language: 'el' | 'en',
): Promise<string[] | null> {
  const lang = language === 'el' ? 'Greek' : 'English';
  const text = await generateText(
    `Suggest exactly 3 short icebreaker questions in ${lang} for a small group attending "${eventTitle}". Shared interests: ${interests.slice(0, 5).join(', ') || 'general'}. Return as numbered list only.`,
  );
  if (!text) return null;
  return text
    .split(/\n/)
    .map((l) => l.replace(/^\d+[.)\\]]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}
