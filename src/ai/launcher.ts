import { useCopilotStore } from '../store/copilotStore';

/**
 * Lightweight launcher for the copilot UI — opens the panel synchronously and
 * only loads the full copilot engine/actions bundle when a prompt is sent.
 */
export function openCopilot(prompt?: string): void {
  useCopilotStore.getState().setOpen(true);
  if (prompt) {
    void import('./copilot').then(({ sendToCopilot }) => sendToCopilot(prompt));
  }
}

export function preloadCopilot(): void {
  void import('../components/copilot/CopilotPanel');
}
