import { formatEur } from './money';

/**
 * Single demo wallet ledger for UI + AI until a real payout store exists.
 * Organizer live ticket revenue is separate (event × members) and bridges here.
 */
export const WALLET_DEMO = {
  availableEur: 345.5,
  pendingEur: 85,
  bankLabelEl: 'Chase ****4092 (demo)',
  bankLabelEn: 'Chase ****4092 (demo)',
} as const;

/** Balances always show cents, in the reader's language. */
export function formatWalletEur(n: number, language: 'el' | 'en'): string {
  return formatEur(n, language, true);
}
