/**
 * Forms-as-proposals (CFB pattern, Nakamas-sized).
 * AI stashes a draft → navigates → form applies fields; user submits.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type FormDraftId = 'event' | 'profile';
export type FormDraftFields = Record<string, string | boolean | number>;

export const FORM_DRAFT_ROUTES: Record<FormDraftId, string> = {
  event: '/create',
  profile: '/profile',
};

const KEY = (id: FormDraftId) => `parea_form_draft:${id}`;
const EVENT = 'parea:form-draft';
const MAX_AGE_MS = 10 * 60_000;

export function stashFormDraft(id: FormDraftId, fields: FormDraftFields, prompt?: string): void {
  const clean = Object.fromEntries(
    Object.entries(fields).filter(([, v]) => {
      if (typeof v === 'string') return v.trim() !== '';
      if (typeof v === 'boolean' || typeof v === 'number') return true;
      return false;
    }),
  );
  const note = prompt?.trim() || undefined;
  try {
    window.sessionStorage.setItem(
      KEY(id),
      JSON.stringify({ fields: clean, at: Date.now(), ...(note ? { prompt: note } : {}) }),
    );
  } catch {
    /* private mode */
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { id, fields: clean, prompt: note } }));
  } catch {
    /* no window */
  }
}

function takeBundle(id: FormDraftId, now: number): { fields: FormDraftFields; prompt?: string } | null {
  try {
    const raw = window.sessionStorage.getItem(KEY(id));
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY(id));
    const parsed = JSON.parse(raw) as { fields?: FormDraftFields; at?: number; prompt?: string };
    if (!parsed?.fields || typeof parsed.at !== 'number' || now - parsed.at > MAX_AGE_MS) return null;
    const prompt = typeof parsed.prompt === 'string' && parsed.prompt.trim() ? parsed.prompt.trim() : undefined;
    return { fields: parsed.fields, ...(prompt ? { prompt } : {}) };
  } catch {
    return null;
  }
}

export function takeFormDraft(id: FormDraftId, now = Date.now()): FormDraftFields | null {
  return takeBundle(id, now)?.fields ?? null;
}

/** Apply a waiting draft once the form is ready (e.g. after profile load). */
export function useFormDraft(
  id: FormDraftId,
  apply: (fields: FormDraftFields) => void,
  ready = true,
): { filled: string[]; prompt: string; dismiss: () => void } {
  const [filled, setFilled] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const applyBundle = useCallback((bundle: { fields: FormDraftFields; prompt?: string } | null) => {
    if (!bundle || Object.keys(bundle.fields).length === 0) return;
    applyRef.current(bundle.fields);
    setFilled(Object.keys(bundle.fields));
    setPrompt(bundle.prompt ?? '');
  }, []);

  useEffect(() => {
    if (!ready) return;
    applyBundle(takeBundle(id, Date.now()));
    const onDraft = (event: Event) => {
      const detail = (event as CustomEvent<{ id: FormDraftId }>).detail;
      if (detail?.id === id) applyBundle(takeBundle(id, Date.now()));
    };
    window.addEventListener(EVENT, onDraft);
    return () => window.removeEventListener(EVENT, onDraft);
  }, [id, ready, applyBundle]);

  return {
    filled,
    prompt,
    dismiss: () => {
      setFilled([]);
      setPrompt('');
    },
  };
}
