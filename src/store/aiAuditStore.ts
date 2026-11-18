import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RiskTier } from '../ai/types';

export type AiAuditStatus = 'done' | 'failed' | 'cancelled' | 'undone' | 'denied';

export interface AiAuditEntry {
  id: string;
  at: string;
  userId: string | null;
  action: string;
  risk: RiskTier | 'unknown';
  status: AiAuditStatus;
  engine: 'local' | 'gemini';
  /** Argument names only: free text (messages, bio) is never stored here. */
  argKeys: string[];
  /** Conversation message that holds the undo handle, to mark it undone later. */
  messageId?: string;
}

interface AiAuditState {
  entries: AiAuditEntry[];
  record: (entry: Omit<AiAuditEntry, 'id' | 'at'>) => string;
  markUndone: (messageId: string) => void;
  clear: () => void;
}

const MAX_ENTRIES = 200;

/**
 * Audit trail of every action Nakamas AI executed, was refused or had
 * cancelled (audit 2026-11-14 §8 #15: proactive AI only after an audit log).
 * Privacy-minimised: action name, risk, outcome, engine and argument names.
 */
export const useAiAuditStore = create<AiAuditState>()(
  persist(
    (set) => ({
      entries: [],
      record: (entry) => {
        const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({ entries: [{ ...entry, id, at: new Date().toISOString() }, ...s.entries].slice(0, MAX_ENTRIES) }));
        return id;
      },
      markUndone: (messageId) =>
        set((s) => ({ entries: s.entries.map((e) => (e.messageId === messageId ? { ...e, status: 'undone' } : e)) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'nakamas-ai-audit', version: 1 },
  ),
);
