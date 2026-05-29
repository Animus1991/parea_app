/**
 * Optional Gemini integration for event copy and group icebreakers.
 * Requires GEMINI_API_KEY in .env / AI Studio secrets.
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string {
  return (
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    (typeof process !== 'undefined' &&
      (process as { env?: { GEMINI_API_KEY?: string } }).env?.GEMINI_API_KEY) ||
    ''
  );
}

export function isGeminiConfigured(): boolean {
  const key = getApiKey();
  return key.length > 10 && !key.includes('MY_GEMINI');
}

async function generateText(prompt: string): Promise<string | null> {
  const key = getApiKey();
  if (!isGeminiConfigured()) return null;

  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, {
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
    .map((l) => l.replace(/^\d+[\).\]]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}
