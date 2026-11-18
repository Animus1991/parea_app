import { appEnv } from './config/env';
import { createLogger } from './logger';

const log = createLogger('analytics');

export type AnalyticsEvent =
  | { name: 'page_view'; path: string; title?: string }
  | { name: 'command_palette_open' }
  | { name: 'next_best_action_click'; actionId: string }
  | { name: 'match_explain_view'; eventId: string }
  | { name: 'resume_strip_continue'; path: string }
  | { name: 'resume_strip_dismiss'; path: string }
  | { name: 'copilot_feedback'; messageId: string; helpful: boolean; reason?: 'wrong_result' | 'not_done' | 'unclear' };

export function trackEvent(event: AnalyticsEvent): void {
  if (!appEnv.enableAnalytics && !import.meta.env.DEV) return;
  log.debug('event', event);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nakamas:analytics', { detail: event }));
  }
}

export function trackPage(path: string, meta?: { title?: string }): void {
  trackEvent({ name: 'page_view', path, title: meta?.title });
}
