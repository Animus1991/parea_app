/**
 * Support contact — live channel when VITE_SUPPORT_URL / VITE_SUPPORT_EMAIL set.
 */
import { appEnv } from '../lib/config/env';
import { safeExternalUrl } from '../lib/safeUrl';

export function isLiveSupportConfigured(): boolean {
  return Boolean(appEnv.supportUrl || appEnv.supportEmail);
}

export function getSupportHref(): string | null {
  if (appEnv.supportUrl) {
    const safe = safeExternalUrl(appEnv.supportUrl);
    if (safe) return safe;
  }
  if (appEnv.supportEmail) {
    const email = appEnv.supportEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    const subject = encodeURIComponent('Nakamas support');
    return `mailto:${email}?subject=${subject}`;
  }
  return null;
}

/** Opens live support channel; returns false when only demo is available. */
export function openLiveSupport(): boolean {
  const href = getSupportHref();
  if (!href) return false;
  if (href.startsWith('mailto:')) {
    window.location.href = href;
    return true;
  }
  window.open(href, '_blank', 'noopener,noreferrer');
  return true;
}
