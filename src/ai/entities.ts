/**
 * Entity extraction for the local (offline) copilot engine.
 * All matchers receive text that already went through `normalize()`.
 */
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSaturday,
  isSunday,
  nextSaturday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { fuzzyKey, hasAny, normalize } from './text';

export interface DateRange {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  labelEl: string;
  labelEn: string;
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

function range(from: Date, to: Date, labelEl: string, labelEn: string): DateRange {
  return { from: iso(startOfDay(from)), to: iso(endOfDay(to)), labelEl, labelEn };
}

const WEEKDAYS: { stems: string[]; index: number; el: string; en: string }[] = [
  { stems: ['δευτερα', 'monday'], index: 1, el: 'Δευτέρα', en: 'Monday' },
  { stems: ['τριτη', 'tuesday'], index: 2, el: 'Τρίτη', en: 'Tuesday' },
  { stems: ['τεταρτη', 'wednesday'], index: 3, el: 'Τετάρτη', en: 'Wednesday' },
  { stems: ['πεμπτη', 'thursday'], index: 4, el: 'Πέμπτη', en: 'Thursday' },
  { stems: ['παρασκευη', 'friday'], index: 5, el: 'Παρασκευή', en: 'Friday' },
  { stems: ['σαββατο ', 'σαββατο', 'saturday'], index: 6, el: 'Σάββατο', en: 'Saturday' },
  { stems: ['κυριακη', 'sunday'], index: 0, el: 'Κυριακή', en: 'Sunday' },
];

const MONTHS: { stems: string[]; index: number }[] = [
  { stems: ['ιανουαρ', 'january', 'jan '], index: 0 },
  { stems: ['φεβρουαρ', 'february', 'feb '], index: 1 },
  { stems: ['μαρτ', 'march', 'mar '], index: 2 },
  { stems: ['απριλ', 'april', 'apr '], index: 3 },
  { stems: ['μαιου', 'μαιοσ', 'μαι ', ' may'], index: 4 },
  { stems: ['ιουνι', 'june', 'jun '], index: 5 },
  { stems: ['ιουλι', 'july', 'jul '], index: 6 },
  { stems: ['αυγουστ', 'august', 'aug '], index: 7 },
  { stems: ['σεπτεμβρ', 'september', 'sep '], index: 8 },
  { stems: ['οκτωβρ', 'october', 'oct '], index: 9 },
  { stems: ['νοεμβρ', 'november', 'nov '], index: 10 },
  { stems: ['δεκεμβρ', 'december', 'dec '], index: 11 },
];

/** Extracts a date window from free text. Returns null when no temporal expression is present. */
export function extractDateRange(text: string, now: Date = new Date()): DateRange | null {
  const t = ` ${text} `;

  // Explicit ISO date
  const isoMatch = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return range(d, d, iso(d), iso(d));
  }

  // dd/mm(/yyyy)
  const dm = t.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/);
  if (dm && !/\d{1,2}[:.]\d{2}\s*(?:μμ|πμ|pm|am)?\s*$/.test(dm[0])) {
    const day = Number(dm[1]);
    const month = Number(dm[2]) - 1;
    const yearRaw = dm[3] ? Number(dm[3]) : now.getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && !t.includes(`${dm[1]}:${dm[2]}`)) {
      const d = new Date(year, month, day, 12);
      return range(d, d, format(d, 'd/M'), format(d, 'd MMM'));
    }
  }

  // "15 μαιου" / "may 15"
  for (const m of MONTHS) {
    for (const stem of m.stems) {
      const idx = t.indexOf(stem);
      if (idx === -1) continue;
      const around = t.slice(Math.max(0, idx - 4), idx + stem.length + 8);
      const num = around.match(/\b(\d{1,2})\b/);
      if (num) {
        const d = new Date(now.getFullYear(), m.index, Number(num[1]), 12);
        return range(d, d, format(d, 'd/M'), format(d, 'd MMM'));
      }
      const start = new Date(now.getFullYear(), m.index, 1, 12);
      return range(startOfMonth(start), endOfMonth(start), format(start, 'MM/yyyy'), format(start, 'MMMM yyyy'));
    }
  }

  if (hasAny(t, ['μεθαυριο', 'day after tomorrow'])) {
    const d = addDays(now, 2);
    return range(d, d, 'Μεθαύριο', 'Day after tomorrow');
  }
  if (hasAny(t, ['αυριο', 'tomorrow'])) {
    const d = addDays(now, 1);
    return range(d, d, 'Αύριο', 'Tomorrow');
  }
  if (hasAny(t, ['σημερα', 'αποψε', 'today', 'tonight'])) {
    return range(now, now, 'Σήμερα', 'Today');
  }
  if (hasAny(t, ['σαββατοκυριακο', ' σκ ', ' σ/κ', 'weekend'])) {
    const nextWeekend = hasAny(t, ['επομενο', 'αλλο', 'next']);
    let sat = isSaturday(now) ? now : isSunday(now) ? addDays(now, -1) : nextSaturday(now);
    if (nextWeekend) sat = addDays(sat, 7);
    const from = isSunday(now) && !nextWeekend ? now : sat;
    return range(from, addDays(sat, 1), 'Σαββατοκύριακο', 'Weekend');
  }
  if (hasAny(t, ['επομενη εβδομαδα', 'αλλη εβδομαδα', 'next week'])) {
    const monday = addDays(startOfWeek(now, { weekStartsOn: 1 }), 7);
    return range(monday, endOfWeek(monday, { weekStartsOn: 1 }), 'Επόμενη εβδομάδα', 'Next week');
  }
  if (hasAny(t, ['εβδομαδα', 'this week', ' week'])) {
    return range(now, endOfWeek(now, { weekStartsOn: 1 }), 'Αυτή την εβδομάδα', 'This week');
  }
  if (hasAny(t, ['επομενο μηνα', 'next month'])) {
    const next = addMonths(now, 1);
    return range(startOfMonth(next), endOfMonth(next), 'Επόμενος μήνας', 'Next month');
  }
  if (hasAny(t, ['μηνα', 'this month', ' month'])) {
    return range(now, endOfMonth(now), 'Αυτόν τον μήνα', 'This month');
  }

  for (const wd of WEEKDAYS) {
    if (hasAny(t, wd.stems.map((s) => (s.endsWith(' ') ? s : ` ${s}`)))) {
      // `σαββατο` must not fire for `σαββατοκυριακο` (handled above already).
      const diff = (wd.index - now.getDay() + 7) % 7;
      const d = addDays(now, diff);
      return range(d, d, wd.el, wd.en);
    }
  }
  return null;
}

/** Extracts a clock time («21:00», «9μμ», «στις 9 το βράδυ», «at 7pm») → "HH:mm". */
export function extractTime(text: string): string | null {
  const hm = text.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;

  const ampm = text.match(/\b(1[0-2]|0?[1-9])\s*(μμ|πμ|pm|am|μ\.μ\.|π\.μ\.)/);
  if (ampm) {
    let h = Number(ampm[1]);
    const pm = /μμ|pm|μ\.μ\./.test(ampm[2]);
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:00`;
  }

  const at = text.match(/(?:στισ|στη|at)\s+(\d{1,2})\b/);
  if (at) {
    let h = Number(at[1]);
    if (h > 23) return null;
    const evening = hasAny(text, ['βραδ', 'απογευμ', 'evening', 'night', 'αποψε', 'tonight']);
    const morning = hasAny(text, ['πρωι', 'morning']);
    if (h < 12 && (evening || (!morning && h <= 7))) h += 12;
    return `${String(h).padStart(2, '0')}:00`;
  }
  return null;
}

export interface PriceFilter {
  kind: 'free' | 'paid' | 'any';
  max?: number;
}

export function extractPrice(text: string): PriceFilter | null {
  const max = text.match(/(?:κατω απο|λιγοτερο απο|μεχρι|εωσ|under|below|up to|less than|max)\s*(\d+)/);
  if (max) return { kind: 'any', max: Number(max[1]) };
  if (hasAny(text, ['δωρεαν', 'τζαμπα', 'χωρισ κοστοσ', 'free', 'no cost'])) return { kind: 'free' };
  if (hasAny(text, ['επι πληρωμη', 'με εισιτηριο', 'paid', 'ticketed'])) return { kind: 'paid' };
  return null;
}

/** Canonical event categories → bilingual stems (normalized). */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  Hiking: ['πεζοπορ', 'βουνο', 'ορειβασ', 'hike', 'hiking', 'trek'],
  'Live Music': ['συναυλι', 'ζωντανη μουσικ', 'live music', 'concert', 'gig', 'μουσικ', 'music'],
  'Electronic Music': ['ηλεκτρονικ', 'techno', 'electronic', ' dj', 'rave'],
  'Food & Drink': ['φαγητ', 'φαγοποτ', 'ποτο', 'ποτα', 'κρασι', 'μπυρα', 'γευσ', 'food', 'drink', 'wine', 'beer', 'brunch', 'dinner'],
  'Theater & Dance': ['θεατρ', 'χορο', 'παρασταση', 'theater', 'theatre', 'dance', 'ballet'],
  Cinema: ['σινεμα', 'κινηματογραφ', 'ταινια', 'ταινιεσ', 'cinema', 'movie', 'film'],
  'Board games': ['επιτραπεζ', 'board game', 'boardgame'],
  'Book club': ['λεσχη αναγνωσ', 'βιβλι', 'book club', 'books', 'reading'],
  Sports: ['αθλητ', 'ποδοσφαιρ', 'μπασκετ', 'τρεξιμο', 'βολει', 'sport', 'running', 'football', 'basketball', 'volleyball'],
  'Stand-up': ['stand-up', 'standup', 'stand up', 'κωμωδ', 'comedy'],
  Museums: ['μουσει', 'museum'],
  Exhibitions: ['εκθεσ', 'γκαλερι', 'exhibition', 'gallery'],
  Workshops: ['εργαστηρι', 'σεμιναρ', 'workshop', 'class'],
  Wellness: ['yoga', 'γιογκα', 'ευεξια', 'διαλογισ', 'wellness', 'meditation', 'pilates'],
  'Language exchange': ['ανταλλαγη γλωσσ', 'γλωσσ', 'language exchange', 'language'],
  Networking: ['networking', 'δικτυωσ', 'επαγγελματ', 'startup'],
  Social: ['κοινωνικ', 'γνωριμι', 'social', 'meet people', 'meetup'],
  'Walking tours': ['ξεναγ', 'walking tour', 'tour', 'βολτα'],
  'Nearby escapes': ['αποδρασ', 'εκδρομ', 'escape', 'getaway', 'day trip', 'νησι', 'island'],
  'Community events': ['κοινοτητ', 'εθελοντ', 'community', 'volunteer'],
};

/** Returns canonical category names mentioned in the text (most specific first). */
export function extractCategories(text: string, known: readonly string[] = Object.keys(CATEGORY_SYNONYMS)): string[] {
  const hits: { cat: string; len: number }[] = [];
  const padded = ` ${text} `;
  for (const cat of known) {
    const stems = CATEGORY_SYNONYMS[cat] ?? [];
    const own = normalize(cat);
    const all = [own, ...stems];
    const best = all.filter((s) => padded.includes(s)).sort((a, b) => b.length - a.length)[0];
    if (best) hits.push({ cat, len: best.length });
  }
  // «ηλεκτρονική μουσική» should not also yield generic Live Music when a longer stem won.
  hits.sort((a, b) => b.len - a.len);
  const out: string[] = [];
  for (const h of hits) {
    if (h.cat === 'Live Music' && out.includes('Electronic Music')) continue;
    if (!out.includes(h.cat)) out.push(h.cat);
  }
  return out;
}

const AREA_ALIASES: Record<string, string> = {
  πειραια: 'piraeus',
  πειραιασ: 'piraeus',
  υμηττο: 'hymettus',
  υμηττοσ: 'hymettus',
  θησειο: 'thisio',
  συνταγμα: 'syntagma',
  καλλιθεα: 'kallithea',
  βουλιαγμενη: 'vouliagmeni',
  σχινια: 'schinias',
  μαραθωνα: 'marathon',
  αιγινα: 'aegina',
  παγκρατι: 'pangrati',
  νιαρχοσ: 'niarchos',
};

/** Matches an area mentioned in the text against the known `locationArea` values. */
export function extractArea(text: string, areas: readonly string[]): string | null {
  const words = text.split(' ').map((w) => AREA_ALIASES[w] ?? w).join(' ');
  const key = ` ${fuzzyKey(words)} `;
  let best: { area: string; len: number } | null = null;
  for (const area of areas) {
    for (const part of area.split(/[,→]/)) {
      const p = fuzzyKey(part);
      if (p.length < 4 || p === 'athens' || p === 'attica') continue;
      if (key.includes(` ${p} `) || key.includes(` ${p}`)) {
        if (!best || p.length > best.len) best = { area: part.trim(), len: p.length };
      }
    }
  }
  return best?.area ?? null;
}

/** «το δεύτερο», «second one», «#3», «τελευταίο» → zero-based index (or -1 for last). */
export function extractOrdinal(text: string): number | null {
  const hash = text.match(/(?:#|νουμερο|αριθμο|number|no\.?)\s*(\d{1,2})/);
  if (hash) return Number(hash[1]) - 1;
  const table: [string[], number][] = [
    [['πρωτο', 'πρωτη', 'first', '1o', '1st'], 0],
    [['δευτερο', 'δευτερη', 'second', '2o', '2nd'], 1],
    [['τριτο', 'τριτη εκδηλ', 'third', '3o', '3rd'], 2],
    [['τεταρτο', 'fourth', '4o', '4th'], 3],
    [['πεμπτο', 'fifth', '5o', '5th'], 4],
    [['τελευταιο', 'τελευταια', 'last one', 'the last'], -1],
  ];
  for (const [stems, idx] of table) if (hasAny(` ${text} `, stems.map((s) => ` ${s}`))) return idx;
  return null;
}

/** «αυτό», «αυτή την εκδήλωση», «this one», «it» → refers to the event in focus. */
export function isDemonstrative(text: string): boolean {
  return hasAny(` ${text} `, [' αυτο ', ' αυτη ', ' αυτην ', ' αυτο.', ' this ', ' this one', ' it ', ' that one', ' that event']);
}

export type ThemeIntent = { kind: 'dark' } | { kind: 'light' } | { kind: 'id'; id: string };

export function extractTheme(text: string): ThemeIntent | null {
  const named: [string[], string][] = [
    [['activebuddies', 'active buddies'], 'activebuddies'],
    [['vibrant', 'ζωντανο'], 'vibrant'],
    [['bento'], 'bento'],
    [['neon', 'νεον'], 'neon'],
    [['classic', 'κλασικ'], 'classic'],
  ];
  const wantsDark = hasAny(text, ['σκοτειν', 'σκουρ', 'dark', 'νυχτερ', 'night mode']);
  const wantsLight = hasAny(text, ['φωτειν', 'ανοιχτ', 'light mode', 'light theme', 'λευκ']);
  for (const [stems, id] of named) {
    if (hasAny(text, stems)) {
      if (wantsDark && id !== 'classic') return { kind: 'id', id: `${id}-dark` };
      return { kind: 'id', id };
    }
  }
  if (wantsDark) return { kind: 'dark' };
  if (wantsLight) return { kind: 'light' };
  return null;
}

export function extractLanguage(text: string): 'el' | 'en' | null {
  if (hasAny(text, ['αγγλικ', 'english', 'σε en', ' en '])) return 'en';
  if (hasAny(text, ['ελληνικ', 'greek', ' el '])) return 'el';
  return null;
}

/** Text between quotes or after «ότι / που λέει / saying / that». Uses the raw (non-normalized) input. */
export function extractQuotedOrTail(raw: string): string | null {
  const quoted = raw.match(/[«"“']([^»"”']{2,})[»"”']/);
  if (quoted) return quoted[1].trim();
  const tail = raw.match(/(?:ότι|οτι|πως|που λέει|saying|that|:)\s+(.{2,})$/i);
  if (tail) return tail[1].trim();
  return null;
}
