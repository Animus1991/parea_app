import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActionArgs, AiLang, RiskTier } from '../ai/types';

export type CopilotEngine = 'gemini' | 'local';
export type ActionStatus = 'pending' | 'done' | 'failed' | 'cancelled' | 'undone';

export interface CopilotActionCard {
  name: string;
  args: ActionArgs;
  risk: RiskTier;
  status: ActionStatus;
  previewEl?: string;
  previewEn?: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  /** User text (verbatim) or model free text (already in the user's language). */
  text?: string;
  /** Bilingual assistant text from the action registry / local engine. */
  el?: string;
  en?: string;
  /** Language the user wrote in for this turn — assistant replies follow it. */
  lang?: AiLang;
  eventIds?: string[];
  link?: { path: string; el: string; en: string };
  action?: CopilotActionCard;
  engine?: CopilotEngine;
  /** Short one-line status (used for tool results when the model writes the narrative). */
  compact?: boolean;
  /** Message is a human-in-the-loop confirmation prompt (renders Confirm / Cancel). */
  confirm?: boolean;
  /** The effect of this message was reverted with Undo. */
  undone?: boolean;
  error?: boolean;
  createdAt: number;
}

interface CopilotState {
  open: boolean;
  busy: boolean;
  engine: CopilotEngine | null;
  model: string | null;
  messages: CopilotMessage[];
  lastEventIds: string[];
  setOpen: (open: boolean) => void;
  toggle: () => void;
  setBusy: (busy: boolean) => void;
  setEngine: (engine: CopilotEngine, model?: string | null) => void;
  append: (msg: Omit<CopilotMessage, 'id' | 'createdAt'>) => string;
  update: (id: string, patch: Partial<CopilotMessage>) => void;
  updateAction: (id: string, patch: Partial<CopilotActionCard>) => void;
  setLastEventIds: (ids: string[]) => void;
  clear: () => void;
}

const MAX_MESSAGES = 60;
let seq = 0;

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set) => ({
      open: false,
      busy: false,
      engine: null,
      model: null,
      messages: [],
      lastEventIds: [],
      setOpen: (open) => set({ open }),
      toggle: () => set((s) => ({ open: !s.open })),
      setBusy: (busy) => set({ busy }),
      setEngine: (engine, model = null) => set({ engine, model }),
      append: (msg) => {
        seq += 1;
        const id = `cp_${Date.now().toString(36)}_${seq}`;
        set((s) => ({ messages: [...s.messages, { ...msg, id, createdAt: Date.now() }].slice(-MAX_MESSAGES) }));
        return id;
      },
      update: (id, patch) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      updateAction: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id && m.action ? { ...m, action: { ...m.action, ...patch } } : m)),
        })),
      setLastEventIds: (lastEventIds) => set({ lastEventIds }),
      clear: () => set({ messages: [], lastEventIds: [] }),
    }),
    {
      name: 'nakamas-copilot',
      partialize: (s) => ({
        // A pending confirmation cannot survive a reload (its closure is gone) → mark cancelled.
        messages: s.messages.slice(-MAX_MESSAGES).map((m) =>
          m.action?.status === 'pending' ? { ...m, action: { ...m.action, status: 'cancelled' as const } } : m,
        ),
        lastEventIds: s.lastEventIds,
      }),
    },
  ),
);
