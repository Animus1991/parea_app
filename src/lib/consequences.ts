/**
 * Graduated consequences (Φ27, after Timeleft's warnings → bans), tied to
 * reliability and always explained in plain words, with a way to appeal.
 *
 * Ladder over the last 90 days (accepted appeals do not count):
 *   1 strike  → warning
 *   2 strikes → 7-day pause from groups with strangers
 *   3+        → paused until the safety team reviews the account
 */
import type { Strike, StrikeKind } from '../types/outings';

export const STRIKE_WINDOW_DAYS = 90;
export const PAUSE_DAYS = 7;
const DAY = 86_400_000;

export const STRIKE_RELIABILITY: Record<StrikeKind, number> = {
  no_show: -15,
  late_cancel: -8,
  report_upheld: -10,
};

/** Reliability reward for a confirmed arrival. */
export const ATTENDED_RELIABILITY = 3;

export function activeStrikes(strikes: Strike[], userId: string, now = Date.now()): Strike[] {
  return strikes
    .filter((s) => s.userId === userId && s.appeal?.status !== 'accepted' && now - Date.parse(s.at) <= STRIKE_WINDOW_DAYS * DAY)
    .sort((a, b) => a.at.localeCompare(b.at));
}

export type StandingLevel = 'good' | 'warning' | 'paused' | 'review';

export interface Standing {
  level: StandingLevel;
  active: number;
  pausedUntil?: string;
  titleEl: string;
  titleEn: string;
  explainEl: string;
  explainEn: string;
}

export function standingFor(strikes: Strike[], userId: string, now = Date.now()): Standing {
  const act = activeStrikes(strikes, userId, now);
  const n = act.length;
  if (n === 0) {
    return {
      level: 'good',
      active: 0,
      titleEl: 'Όλα καλά',
      titleEn: 'All good',
      explainEl: 'Δεν έχεις καμία παράλειψη τις τελευταίες 90 ημέρες.',
      explainEn: 'You have no missed outings in the last 90 days.',
    };
  }
  if (n === 1) {
    return {
      level: 'warning',
      active: 1,
      titleEl: 'Προειδοποίηση',
      titleEn: 'Warning',
      explainEl: 'Μία παράλειψη τις τελευταίες 90 ημέρες. Μια δεύτερη σημαίνει παύση 7 ημερών από ομάδες με αγνώστους.',
      explainEn: 'One missed outing in the last 90 days. A second one means a 7-day pause from groups with strangers.',
    };
  }
  if (n === 2) {
    const until = Date.parse(act[1].at) + PAUSE_DAYS * DAY;
    if (until > now) {
      return {
        level: 'paused',
        active: 2,
        pausedUntil: new Date(until).toISOString(),
        titleEl: 'Παύση 7 ημερών',
        titleEn: '7-day pause',
        explainEl: 'Δύο παραλείψεις σε 90 ημέρες. Μέχρι να λήξει η παύση δεν μπαίνεις σε ομάδες με αγνώστους· οι φίλοι σου μπορούν ακόμα να σε καλούν.',
        explainEn: 'Two missed outings in 90 days. Until the pause ends you cannot join groups with strangers; friends can still invite you.',
      };
    }
    return {
      level: 'warning',
      active: 2,
      titleEl: 'Τελευταία προειδοποίηση',
      titleEn: 'Final warning',
      explainEl: 'Η παύση έληξε. Μια τρίτη παράλειψη σε 90 ημέρες στέλνει τον λογαριασμό σε έλεγχο.',
      explainEn: 'The pause has ended. A third missed outing in 90 days sends the account for review.',
    };
  }
  return {
    level: 'review',
    active: n,
    titleEl: 'Σε έλεγχο',
    titleEn: 'Under review',
    explainEl: 'Τρεις ή περισσότερες παραλείψεις σε 90 ημέρες. Η ομάδα ασφαλείας εξετάζει τον λογαριασμό· μέχρι τότε δεν μπαίνεις σε ομάδες με αγνώστους.',
    explainEn: 'Three or more missed outings in 90 days. The safety team is reviewing the account; until then you cannot join groups with strangers.',
  };
}

/** Joining groups with strangers is blocked while paused or under review. */
export function standingBlocksJoining(standing: Standing): boolean {
  return standing.level === 'paused' || standing.level === 'review';
}

export function strikeLabel(kind: StrikeKind, t: (el: string, en: string) => string): string {
  switch (kind) {
    case 'no_show':
      return t('Δεν εμφανίστηκε', 'No-show');
    case 'late_cancel':
      return t('Ακύρωση την τελευταία στιγμή', 'Late cancellation');
    case 'report_upheld':
      return t('Αναφορά που επιβεβαιώθηκε', 'Upheld report');
  }
}
