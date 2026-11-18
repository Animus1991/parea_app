import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAiAuditStore } from '../store/aiAuditStore';
import { useStore } from '../store';
import { sendToCopilot, undoAction, cancelAction } from './copilot';
import { useCopilotStore } from '../store/copilotStore';

describe('Nakamas AI audit log', () => {
  beforeEach(() => {
    useAiAuditStore.getState().clear();
    // No server in tests: the copilot falls back to the local engine.
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
  });

  it('records executed actions without free text and marks undo', async () => {
    const before = useStore.getState().theme;
    await sendToCopilot('βάλε σκοτεινό θέμα');
    const entry = useAiAuditStore.getState().entries.find((e) => e.action === 'set_theme');
    expect(entry).toMatchObject({ status: 'done', risk: 'safe', engine: 'local', argKeys: ['theme'] });
    expect(entry?.messageId).toBeTruthy();
    expect(undoAction(entry!.messageId!)).toBe(true);
    expect(useAiAuditStore.getState().entries.find((e) => e.id === entry!.id)?.status).toBe('undone');
    expect(useStore.getState().theme).toBe(before);
  });

  it('records cancelled confirmations', async () => {
    await sendToCopilot('κάνε το προφίλ μου ιδιωτικό');
    const pending = useCopilotStore.getState().messages.filter((m) => m.action?.status === 'pending').at(-1);
    expect(pending).toBeTruthy();
    cancelAction(pending!.id);
    expect(useAiAuditStore.getState().entries[0]).toMatchObject({ action: 'update_privacy', status: 'cancelled', risk: 'confirm' });
  });
});
