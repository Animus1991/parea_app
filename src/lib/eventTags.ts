export interface CataloguedTag {
  /** First-seen original spelling from the catalog. */
  tag: string;
  slug: string;
  count: number;
}

/** Stable URL slug for an event tag (`Nakamas Nights` → `nakamas-nights`). */
export function eventTagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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

/** Unique tags currently used on events, popular first. */
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
  return (
    item.tag.toLowerCase().includes(q) ||
    item.slug.includes(slugQ) ||
    label.toLowerCase().includes(q)
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
    .sort(([a], [b]) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b, locale);
    })
    .map(([letter, items]) => ({ letter, tags: items }));
}

export function findCataloguedTag(
  catalog: CataloguedTag[],
  slug: string | undefined,
): CataloguedTag | undefined {
  if (!slug) return undefined;
  const needle = eventTagSlug(slug);
  return catalog.find((item) => item.slug === needle);
}
