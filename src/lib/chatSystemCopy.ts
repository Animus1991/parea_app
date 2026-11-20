/**
 * System chat bodies are stored as stable keys (or legacy English sentences).
 * Translate at render so Greek and English users see the same meaning.
 */
export const SYS_COORDINATION_UNLOCKED = 'sys.coordination_unlocked';
export const SYS_DM_UNLOCKED = 'sys.dm_unlocked';

type Pair = readonly [el: string, en: string];

const BODIES: Record<string, Pair> = {
  [SYS_COORDINATION_UNLOCKED]: [
    'Η ομάδα επιβεβαιώθηκε. Πείτε γεια στα Nakamas σας και συμφωνήστε πού θα συναντηθείτε.',
    'Your group is confirmed. Say hi to your Nakamas and agree where to meet.',
  ],
  'Coordination chat unlocked after mutual accept.': [
    'Η ομάδα επιβεβαιώθηκε. Πείτε γεια στα Nakamas σας και συμφωνήστε πού θα συναντηθείτε.',
    'Your group is confirmed. Say hi to your Nakamas and agree where to meet.',
  ],
  [SYS_DM_UNLOCKED]: [
    'Η προσωπική συνομιλία άνοιξε μεταξύ των συνδέσεών σας.',
    'Direct message unlocked between connections.',
  ],
  'Direct message unlocked between connections.': [
    'Η προσωπική συνομιλία άνοιξε μεταξύ των συνδέσεών σας.',
    'Direct message unlocked between connections.',
  ],
};

const HAS_GREEK = /[Α-ωΆ-ώ]/;

export function localizeSystemBody(
  body: string,
  t: (el: string, en?: string) => string,
): string {
  const mapped = BODIES[body];
  if (mapped) return t(mapped[0], mapped[1]);
  const slash = body.indexOf(' / ');
  if (slash > 0) {
    const left = body.slice(0, slash).trim();
    const right = body.slice(slash + 3).trim();
    if (HAS_GREEK.test(right) && !HAS_GREEK.test(left)) return t(right, left);
    if (HAS_GREEK.test(left) && !HAS_GREEK.test(right)) return t(left, right);
  }
  return body;
}

export const GROUP_CHAT_STARTERS: Pair[] = [
  ['Γεια σε όλους! 👋', 'Hey everyone! 👋'],
  ['Τι ώρα να είμαστε εκεί;', 'What time should we be there?'],
  ['Ποιος θέλει καφέ πριν;', 'Anyone for coffee first?'],
];
