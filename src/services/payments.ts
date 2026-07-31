/**
 * Payments / payouts — Stripe when env configured, otherwise honest demo.
 */
import { appEnv } from '../lib/config/env';

export function isStripeConfigured(): boolean {
  return Boolean(appEnv.stripePublishableKey || appEnv.stripeCheckoutUrl);
}

export function getStripePublishableKey(): string {
  return appEnv.stripePublishableKey;
}

/** Opens Checkout / Payment Link in a new tab when URL is configured. */
export function openStripeCheckout(returnPath = '/wallet'): boolean {
  const url = appEnv.stripeCheckoutUrl;
  if (!url) return false;
  try {
    const target = new URL(url);
    if (typeof window !== 'undefined') {
      target.searchParams.set('return_url', `${window.location.origin}${returnPath}`);
    }
    window.open(target.toString(), '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
}
