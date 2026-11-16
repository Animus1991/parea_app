/**
 * «Το στυλ παρέας μου» (Φ27, after Timeleft's personality test and Pie's AI
 * quiz). Five optional answers; the result is always explained, never a
 * hidden score.
 */
import type { VibeProfile } from '../types/outings';

type T = (el: string, en: string) => string;

export interface VibeQuestion {
  key: 'pace' | 'noise' | 'talk' | 'budget' | 'lang';
  el: string;
  en: string;
  options: { value: VibeProfile[keyof VibeProfile]; el: string; en: string }[];
}

export const VIBE_QUESTIONS: VibeQuestion[] = [
  {
    key: 'pace',
    el: 'Τι ρυθμό θέλεις σε μια έξοδο;',
    en: 'What pace do you like on a night out?',
    options: [
      { value: 1, el: 'Χαλαρά', en: 'Easy-going' },
      { value: 2, el: 'Ενδιάμεσα', en: 'In between' },
      { value: 3, el: 'Έντονα', en: 'Full on' },
    ],
  },
  {
    key: 'noise',
    el: 'Πού νιώθεις πιο άνετα;',
    en: 'Where do you feel most comfortable?',
    options: [
      { value: 1, el: 'Ήσυχα μέρη', en: 'Quiet places' },
      { value: 2, el: 'Ό,τι να ’ναι', en: 'Anything' },
      { value: 3, el: 'Ζωηρά μέρη', en: 'Lively places' },
    ],
  },
  {
    key: 'talk',
    el: 'Στη συζήτηση…',
    en: 'In conversation…',
    options: [
      { value: 1, el: 'Ακούω περισσότερο', en: 'I listen more' },
      { value: 2, el: 'Ισορροπία', en: 'Balanced' },
      { value: 3, el: 'Μιλάω περισσότερο', en: 'I talk more' },
    ],
  },
  {
    key: 'budget',
    el: 'Συνηθισμένος προϋπολογισμός για μια έξοδο;',
    en: 'Usual budget for a night out?',
    options: [
      { value: 1, el: '€ οικονομικά', en: '€ budget' },
      { value: 2, el: '€€ μέτρια', en: '€€ mid-range' },
      { value: 3, el: '€€€ χωρίς όριο', en: '€€€ no limit' },
    ],
  },
  {
    key: 'lang',
    el: 'Σε ποια γλώσσα θέλεις να μιλάτε;',
    en: 'Which language do you want to speak?',
    options: [
      { value: 'el', el: 'Ελληνικά', en: 'Greek' },
      { value: 'en', el: 'Αγγλικά', en: 'English' },
      { value: 'both', el: 'Και τα δύο', en: 'Both' },
    ],
  },
];

function optionLabel(key: VibeQuestion['key'], value: unknown, t: T): string {
  const q = VIBE_QUESTIONS.find((x) => x.key === key);
  const o = q?.options.find((x) => x.value === value);
  return o ? t(o.el, o.en) : '';
}

export function isCompleteVibe(v: Partial<VibeProfile> | undefined): v is VibeProfile {
  return Boolean(v && v.pace && v.noise && v.talk && v.budget && v.lang);
}

/**
 * Similarity 0–1 between two people, plus plain reasons. Scales count
 * matches (0 apart) fully and neighbours (1 apart) half; languages match when
 * they share one.
 */
export function vibeSimilarity(a: VibeProfile | undefined, b: VibeProfile | undefined, t: T): { score: number; reasons: string[] } | null {
  if (!isCompleteVibe(a) || !isCompleteVibe(b)) return null;
  const scale = (x: number, y: number) => (x === y ? 1 : Math.abs(x - y) === 1 ? 0.5 : 0);
  const langOk = a.lang === 'both' || b.lang === 'both' || a.lang === b.lang;
  const parts = [scale(a.pace, b.pace), scale(a.noise, b.noise), scale(a.talk, b.talk), scale(a.budget, b.budget), langOk ? 1 : 0];
  const reasons: string[] = [];
  if (a.pace === b.pace) reasons.push(t(`Ίδιος ρυθμός (${optionLabel('pace', a.pace, t).toLowerCase()})`, `Same pace (${optionLabel('pace', a.pace, t).toLowerCase()})`));
  if (a.noise === b.noise) reasons.push(t(`Ίδια μέρη (${optionLabel('noise', a.noise, t).toLowerCase()})`, `Same places (${optionLabel('noise', a.noise, t).toLowerCase()})`));
  if (a.budget === b.budget) reasons.push(t('Ίδιος προϋπολογισμός', 'Same budget'));
  if (!langOk) reasons.push(t('Διαφορετική γλώσσα', 'Different language'));
  return { score: parts.reduce((x, y) => x + y, 0) / parts.length, reasons };
}

/** How well a person fits a group: average similarity to members who answered. */
export function groupVibeFit(
  me: VibeProfile | undefined,
  members: (VibeProfile | undefined)[],
  t: T,
): { score: number; answered: number; reasons: string[] } | null {
  if (!isCompleteVibe(me)) return null;
  const sims = members.map((m) => vibeSimilarity(me, m, t)).filter((x): x is NonNullable<typeof x> => x !== null);
  if (sims.length === 0) return null;
  const score = sims.reduce((s, x) => s + x.score, 0) / sims.length;
  const counts = new Map<string, number>();
  for (const s of sims) for (const r of s.reasons) counts.set(r, (counts.get(r) ?? 0) + 1);
  const reasons = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([r]) => r);
  return { score, answered: sims.length, reasons };
}

export function vibeFitLabel(score: number, t: T): string {
  if (score >= 0.8) return t('Ταιριάζετε πολύ', 'Great fit');
  if (score >= 0.6) return t('Ταιριάζετε', 'Good fit');
  if (score >= 0.4) return t('Μέτριο ταίριασμα', 'Some fit');
  return t('Διαφορετικά στυλ', 'Different styles');
}
