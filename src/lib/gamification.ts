import type { User } from '../types';

export interface BadgeDef {
  id: string;
  emoji: string;
  labelEl: string;
  labelEn: string;
  descriptionEl: string;
  descriptionEn: string;
  unlocked?: boolean;
}

/** Unified badge catalogue (Φ19.4) — superset of Achievements + Leaderboard definitions. */
export const BADGES_CATALOGUE: BadgeDef[] = [
  { id: 'b1', emoji: '🏅', labelEl: 'Πρώτη Εμπειρία', labelEn: 'First Timer', descriptionEl: 'Παρακολούθησες 1η εκδήλωση', descriptionEn: 'Attended your first event', unlocked: true },
  { id: 'b2', emoji: '🦋', labelEl: 'Κοινωνική Πεταλούδα', labelEn: 'Social Butterfly', descriptionEl: 'Εντάχθηκες σε 3 ομάδες', descriptionEn: 'Joined 3 different groups', unlocked: true },
  { id: 'b3', emoji: '⭐', labelEl: 'Αστέρι Αξιοπιστίας', labelEn: 'Reliability Star', descriptionEl: 'Διατήρησε 90%+ αξιοπιστία', descriptionEn: 'Maintained 90%+ reliability', unlocked: false },
  { id: 'b4', emoji: '🔥', labelEl: 'Φλόγα', labelEn: 'On Fire', descriptionEl: 'Ενεργός 4 εβδομάδες σερί', descriptionEn: '4 consecutive active weeks', unlocked: false },
  { id: 'b5', emoji: '🌍', labelEl: 'Εξερευνητής', labelEn: 'Explorer', descriptionEl: 'Δοκίμασες 4 κατηγορίες', descriptionEn: 'Tried 4 different categories', unlocked: true },
  { id: 'b6', emoji: '🎯', labelEl: 'Πρωτοπόρος', labelEn: 'Trailblazer', descriptionEl: 'Δημιούργησες γεμάτη ομάδα', descriptionEn: 'Created a full group', unlocked: false },
  { id: 'b7', emoji: '⚡', labelEl: 'Αστραπή', labelEn: 'Lightning', descriptionEl: 'Εγγραφή εντός 1 λεπτού', descriptionEn: 'Joined within 1 minute of posting', unlocked: false },
  { id: 'b8', emoji: '🏆', labelEl: 'Πρωταθλητής', labelEn: 'Champion', descriptionEl: 'Top 3 στη κατάταξη', descriptionEn: 'Top 3 on leaderboard', unlocked: false },
];

export function computeUserXp(
  user: Pick<User, 'reliabilityScore' | 'badges' | 'connections'>,
  isMe: boolean,
  feedbackCount: number,
  bonusXp = 0,
): number {
  const base = (user.reliabilityScore ?? 50) * 2;
  const badgesBonus = (user.badges?.length ?? 0) * 50;
  const eventsBonus = isMe
    ? feedbackCount * 50
    : Math.floor((user.reliabilityScore ?? 50) / 10) * 30;
  return base + badgesBonus + eventsBonus + bonusXp;
}

export function levelForXp(xp: number): {
  level: number;
  titleEl: string;
  titleEn: string;
  nextAt: number;
} {
  const level = Math.floor(xp / 200) + 1;
  const nextAt = level * 200;
  const titles: Record<number, [string, string]> = {
    1: ['Νέος Εξερευνητής', 'New Explorer'],
    2: ['Ενεργό Μέλος', 'Active Member'],
    3: ['Έμπειρος Συμμετέχων', 'Seasoned Participant'],
    4: ['Κοινωνικός Πρωταθλητής', 'Community Champion'],
  };
  const [titleEl, titleEn] = titles[Math.min(level, 4)] ?? titles[4];
  return { level, titleEl, titleEn, nextAt };
}
