import type { TrustTier } from '../types';
import { tierLabelEl, tierLabelEn } from './trust';

type TFn = (gr: string, en: string) => string;

/** Human-readable participation rule for EventDetail meta (i18n). */
export function getEventParticipationRuleText(tier: TrustTier, t: TFn): string {
  if (tier === '3_high_trust') {
    return t('απαιτείται επαληθευμένος λογαριασμός', 'verified account required');
  }
  if (tier === '2_confirmed') {
    return t('απαιτείται επιβεβαιωμένος λογαριασμός', 'confirmed account required');
  }
  return t(
    `ανοιχτό σε ${tierLabelEl(tier).toLowerCase()}`,
    `open to ${tierLabelEn(tier).toLowerCase()} accounts`,
  );
}
