/**
 * Support contact — live channel when VITE_SUPPORT_URL / VITE_SUPPORT_EMAIL set.
 */
import { appEnv } from '../lib/config/env';

export function isLiveSupportConfigured(): boolean {
  return Boolean(appEnv.supportUrl || appEnv.supportEmail);
}

export function getSupportHref(): string | null {
  if (appEnv.supportUrl) return appEnv.supportUrl;
  if (appEnv.supportEmail) {
    const subject = encodeURIComponent('Nakamas support');
    return `mailto:${appEnv.supportEmail}?subject=${subject}`;
  }
  return null;
}

/** Opens live support channel; returns false when only demo is available. */
export function openLiveSupport(): boolean {
  const href = getSupportHref();
  if (!href) return false;
  window.open(href, '_blank', 'noopener,noreferrer');
  return true;
}
