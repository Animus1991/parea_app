/**
 * Home Discover filter query helpers.
 * Compare decoded values, not toString(), so `Theater+%26+Dance` and
 * `Theater%20%26%20Dance` stay the same filter.
 */

export const HOME_FILTER_QUERY_KEYS = [
  'search',
  'cat',
  'tag',
  'price',
  'date',
  'safety',
  'dist',
  'sort',
  'mood',
  'on',
  'wd',
  'tw',
  'hrs',
] as const;

export type HomeFilterQueryKey = (typeof HOME_FILTER_QUERY_KEYS)[number];

export function homeFilterQueryEquals(a: URLSearchParams, b: URLSearchParams): boolean {
  return HOME_FILTER_QUERY_KEYS.every((key) => (a.get(key) || '') === (b.get(key) || ''));
}

/** Overlay filter keys onto the current search without dropping unrelated params. */
export function mergeHomeFilterQuery(
  current: URLSearchParams,
  filters: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const key of HOME_FILTER_QUERY_KEYS) {
    next.delete(key);
  }
  for (const [key, value] of filters.entries()) {
    next.set(key, value);
  }
  return next;
}

export function buildHomeFilterQuery(input: {
  search?: string;
  category?: string;
  tag?: string;
  price?: string;
  date?: string;
  safety?: string;
  dist?: string;
  sort?: string;
  mood?: string | null;
  schedule?: { on?: string; wd?: string; tw?: string; hrs?: string };
}): URLSearchParams {
  const params = new URLSearchParams();
  if (input.search) params.set('search', input.search);
  if (input.category && input.category !== 'All') params.set('cat', input.category);
  if (input.tag && input.tag !== 'All') params.set('tag', input.tag);
  if (input.price && input.price !== 'All') params.set('price', input.price);
  if (input.date && input.date !== 'Any') params.set('date', input.date);
  if (input.safety && input.safety !== 'All') params.set('safety', input.safety);
  if (input.dist && input.dist !== 'Any') params.set('dist', input.dist);
  if (input.sort && input.sort !== 'Distance') params.set('sort', input.sort);
  if (input.mood) params.set('mood', input.mood);
  if (input.schedule?.on) params.set('on', input.schedule.on);
  if (input.schedule?.wd) params.set('wd', input.schedule.wd);
  if (input.schedule?.tw) params.set('tw', input.schedule.tw);
  if (input.schedule?.hrs) params.set('hrs', input.schedule.hrs);
  return params;
}
