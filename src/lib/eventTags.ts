export interface CataloguedTag {
  /** First-seen original spelling from the catalog. */
  tag: string;
  slug: string;
  count: number;
}

export interface EventTagLabels {
  el: string;
  en: string;
}

/**
 * Spellings that mean the same tag. Catalog, URLs and matching collapse to the
 * canonical slug on the right so «boardgames» and «board games» are one chip.
 */
const TAG_ALIASES: Record<string, string> = {
  boardgames: 'board-games',
  καφές: 'coffee',
  run: 'running',
};

/** Labels in the UI language — one voice, no mixed EL/EN directory. */
export const EVENT_TAG_LABELS: Record<string, EventTagLabels> = {
  art: { el: 'Τέχνη', en: 'Art' },
  ballet: { el: 'Μπαλέτο', en: 'Ballet' },
  'board-games': { el: 'Επιτραπέζια', en: 'Board games' },
  books: { el: 'Βιβλία', en: 'Books' },
  cinema: { el: 'Σινεμά', en: 'Cinema' },
  classical: { el: 'Κλασική μουσική', en: 'Classical' },
  coffee: { el: 'Καφές', en: 'Coffee' },
  comedy: { el: 'Κωμωδία', en: 'Comedy' },
  community: { el: 'Κοινότητα', en: 'Community' },
  concert: { el: 'Συναυλία', en: 'Concert' },
  cooking: { el: 'Μαγειρική', en: 'Cooking' },
  creative: { el: 'Δημιουργικά', en: 'Creative' },
  culture: { el: 'Πολιτισμός', en: 'Culture' },
  dance: { el: 'Χορός', en: 'Dance' },
  daytrip: { el: 'Ημερήσια εκδρομή', en: 'Day trip' },
  electronic: { el: 'Ηλεκτρονική', en: 'Electronic' },
  environment: { el: 'Περιβάλλον', en: 'Environment' },
  escaperoom: { el: 'Escape room', en: 'Escape room' },
  exhibition: { el: 'Έκθεση', en: 'Exhibition' },
  festival: { el: 'Φεστιβάλ', en: 'Festival' },
  food: { el: 'Φαγητό', en: 'Food' },
  free: { el: 'Δωρεάν', en: 'Free' },
  hiking: { el: 'Πεζοπορία', en: 'Hiking' },
  indoor: { el: 'Εσωτερικός χώρος', en: 'Indoor' },
  island: { el: 'Νησί', en: 'Island' },
  jazz: { el: 'Τζαζ', en: 'Jazz' },
  kayaking: { el: 'Καγιάκ', en: 'Kayaking' },
  languages: { el: 'Γλώσσες', en: 'Languages' },
  'mini-outing': { el: 'Μικρή έξοδος', en: 'Mini outing' },
  museum: { el: 'Μουσείο', en: 'Museum' },
  music: { el: 'Μουσική', en: 'Music' },
  'nakamas-nights': { el: 'Nakamas Nights', en: 'Nakamas Nights' },
  nature: { el: 'Φύση', en: 'Nature' },
  networking: { el: 'Δικτύωση', en: 'Networking' },
  nightlife: { el: 'Νυχτερινή ζωή', en: 'Nightlife' },
  'open-air': { el: 'Υπαίθριο', en: 'Open-air' },
  opera: { el: 'Όπερα', en: 'Opera' },
  outdoor: { el: 'Υπαίθρια', en: 'Outdoors' },
  philosophy: { el: 'Φιλοσοφία', en: 'Philosophy' },
  photography: { el: 'Φωτογραφία', en: 'Photography' },
  pottery: { el: 'Κεραμική', en: 'Pottery' },
  retro: { el: 'Ρετρό', en: 'Retro' },
  running: { el: 'Τρέξιμο', en: 'Running' },
  sailing: { el: 'Ιστιοπλοΐα', en: 'Sailing' },
  'small-groups': { el: 'Μικρές ομάδες', en: 'Small groups' },
  social: { el: 'Κοινωνικά', en: 'Social' },
  sports: { el: 'Αθλητισμός', en: 'Sports' },
  streetfood: { el: 'Φαγητό δρόμου', en: 'Street food' },
  sunset: { el: 'Ηλιοβασίλεμα', en: 'Sunset' },
  tech: { el: 'Τεχνολογία', en: 'Tech' },
  techno: { el: 'Techno', en: 'Techno' },
  theater: { el: 'Θέατρο', en: 'Theater' },
  walking: { el: 'Περπάτημα', en: 'Walking' },
  wellness: { el: 'Ευεξία', en: 'Wellness' },
  wine: { el: 'Κρασί', en: 'Wine' },
  workshop: { el: 'Εργαστήριο', en: 'Workshop' },
  yoga: { el: 'Γιόγκα', en: 'Yoga' },
  συνάντηση: { el: 'Συνάντηση', en: 'Meetup' },
  εισιτήρια: { el: 'Εισιτήρια', en: 'Tickets' },
};

function prettyEventTag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) return trimmed;
  if (/[Α-ωΆ-ώ]/.test(trimmed)) {
    return trimmed.charAt(0).toLocaleUpperCase('el') + trimmed.slice(1);
  }
  return trimmed.replace(/[-_]+/g, ' ').replace(/\b([a-z])/g, (ch) => ch.toUpperCase());
}

/** Stable URL slug for an event tag (`Nakamas Nights` → `nakamas-nights`). */
export function eventTagSlug(tag: string): string {
  const basic = tag
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return TAG_ALIASES[basic] ?? basic;
}

export function eventTagLabels(tag: string): EventTagLabels {
  const slug = eventTagSlug(tag);
  return EVENT_TAG_LABELS[slug] ?? { el: prettyEventTag(tag), en: prettyEventTag(tag) };
}

export function tagsMatch(a: string, b: string): boolean {
  const left = eventTagSlug(a);
  const right = eventTagSlug(b);
  return Boolean(left) && left === right;
}

export function eventHasTag(event: { tags?: string[] }, tagOrSlug: string): boolean {
  const slug = eventTagSlug(tagOrSlug);
  if (!slug) return false;
  return (event.tags ?? []).some((tag) => eventTagSlug(tag) === slug);
}

export function eventTagPath(tag: string): string {
  const slug = eventTagSlug(tag);
  return slug ? `/tags/${encodeURIComponent(slug)}` : '/tags';
}

/** Unique tags currently used on events, popular first. Aliases share one row. */
export function catalogEventTags(events: Array<{ tags?: string[] }>): CataloguedTag[] {
  const map = new Map<string, CataloguedTag>();
  for (const event of events) {
    const seen = new Set<string>();
    for (const raw of event.tags ?? []) {
      const slug = eventTagSlug(raw);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      const cur = map.get(slug);
      if (cur) cur.count += 1;
      else map.set(slug, { tag: raw.trim(), slug, count: 1 });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'el'),
  );
}

export function eventsForTag<T extends { tags?: string[] }>(events: T[], tagOrSlug: string): T[] {
  return events.filter((event) => eventHasTag(event, tagOrSlug));
}

export function tagMatchesQuery(
  item: CataloguedTag,
  query: string,
  label: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const slugQ = q.replace(/\s+/g, '-');
  const labels = eventTagLabels(item.tag);
  return (
    item.tag.toLowerCase().includes(q) ||
    item.slug.includes(slugQ) ||
    label.toLowerCase().includes(q) ||
    labels.el.toLowerCase().includes(q) ||
    labels.en.toLowerCase().includes(q)
  );
}

export function tagLetter(label: string, locale: string): string {
  const ch = label.trim().charAt(0);
  if (!ch) return '#';
  const up = ch.toLocaleUpperCase(locale);
  return /\p{L}/u.test(up) ? up : '#';
}

export function groupTagsByLetter(
  tags: CataloguedTag[],
  labelOf: (tag: string) => string,
  locale: string,
): Array<{ letter: string; tags: CataloguedTag[] }> {
  const groups = new Map<string, CataloguedTag[]>();
  const sorted = [...tags].sort((a, b) =>
    labelOf(a.tag).localeCompare(labelOf(b.tag), locale),
  );
  for (const item of sorted) {
    const letter = tagLetter(labelOf(item.tag), locale);
    const list = groups.get(letter) ?? [];
    list.push(item);
    groups.set(letter, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => letterSortKey(a).localeCompare(letterSortKey(b), locale))
    .map(([letter, items]) => ({ letter, tags: items }));
}

const GREEK_LETTERS = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';

function letterSortKey(letter: string): string {
  if (letter === '#') return '2#';
  const greek = GREEK_LETTERS.indexOf(letter);
  if (greek >= 0) return `0${String(greek).padStart(2, '0')}`;
  return `1${letter}`;
}

export function findCataloguedTag(
  catalog: CataloguedTag[],
  slug: string | undefined,
): CataloguedTag | undefined {
  if (!slug) return undefined;
  const needle = eventTagSlug(slug);
  return catalog.find((item) => item.slug === needle);
}
