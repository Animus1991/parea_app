/**
 * Event search & ranking shared by the copilot engines.
 * Pure function over the store snapshot → unit-testable.
 */
import type { Event, User } from '../types';
import { getEventPersonalizationScore } from '../lib/homePersonalization';
import { CATEGORY_SYNONYMS } from './entities';
import { fuzzyKey, normalize } from './text';

export interface EventSearchCriteria {
  query?: string;
  categories?: string[];
  dateFrom?: string; // yyyy-MM-dd
  dateTo?: string; // yyyy-MM-dd
  price?: 'free' | 'paid' | 'any';
  maxPrice?: number;
  area?: string;
  limit?: number;
}

export interface EventSearchResult {
  events: Event[];
  /** True when the date window had no matches and was dropped to still offer results. */
  relaxedDate: boolean;
  /** True when the free-text keywords matched nothing and were dropped (other filters kept). */
  relaxedQuery: boolean;
  totalMatches: number;
}

const STOP = new Set([
  'βρεσ', 'ψαξε', 'δειξε', 'μου', 'για', 'και', 'το', 'τα', 'τη', 'την', 'τον', 'στο', 'στη', 'στην', 'με', 'σε', 'μια', 'ενα', 'κατι', 'θελω', 'να',
  'τι', 'κανω', 'κανουμε', 'παω', 'παμε', 'βγω', 'βγουμε', 'εχει', 'υπαρχει', 'υπαρχουν', 'μπορω', 'θα', 'ηθελα', 'ενδιαφερον', 'ωραιο', 'καλο', 'αυτο', 'αυτη',
  'find', 'search', 'show', 'me', 'for', 'and', 'the', 'a', 'an', 'some', 'i', 'want', 'to', 'in', 'at', 'on', 'events', 'event', 'εκδηλωσεισ', 'εκδηλωση',
  'what', 'should', 'could', 'can', 'do', 'go', 'out', 'there', 'is', 'are', 'anything', 'something', 'things', 'fun', 'good', 'nice', 'this', 'any',
]);

function isActive(e: Event): boolean {
  return e.status !== 'cancelled' && e.status !== 'archived';
}

function textScore(e: Event, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const hay = fuzzyKey(`${e.title} ${e.description ?? ''} ${(e.tags ?? []).join(' ')} ${e.category} ${e.locationArea}`);
  let score = 0;
  for (const tok of tokens) {
    const k = fuzzyKey(tok);
    if (k.length < 3) continue;
    if (hay.includes(k)) score += fuzzyKey(e.title).includes(k) ? 30 : 12;
  }
  return score;
}

export function searchEvents(
  events: Event[],
  user: User | null,
  criteria: EventSearchCriteria,
  now: Date = new Date(),
): EventSearchResult {
  const limit = Math.max(1, Math.min(criteria.limit ?? 5, 12));
  const categories = criteria.categories ?? [];
  const tokens = criteria.query
    ? normalize(criteria.query)
        .split(' ')
        .filter((w) => w.length >= 3 && !STOP.has(w))
        // Category words are already handled by the category filter.
        .filter((w) => !categories.some((c) => (CATEGORY_SYNONYMS[c] ?? []).some((s) => s.trim() && w.startsWith(s.trim()))))
    : [];
  const areaKey = criteria.area ? fuzzyKey(criteria.area) : '';

  const structural = events.filter((e) => {
    if (!isActive(e)) return false;
    if (categories.length > 0 && !categories.includes(e.category)) return false;
    if (criteria.price === 'free' && (e.isPaid || e.price > 0)) return false;
    if (criteria.price === 'paid' && !e.isPaid) return false;
    if (typeof criteria.maxPrice === 'number' && e.price > criteria.maxPrice) return false;
    if (areaKey && !fuzzyKey(e.locationArea).includes(areaKey)) return false;
    return true;
  });
  const hasOtherFilters = categories.length > 0 || Boolean(criteria.price && criteria.price !== 'any') || typeof criteria.maxPrice === 'number' || Boolean(areaKey) || Boolean(criteria.dateFrom || criteria.dateTo);
  const textMatched = tokens.length > 0 ? structural.filter((e) => textScore(e, tokens) > 0) : structural;
  // Keywords that match nothing should not hide results the other filters found.
  const relaxedQuery = tokens.length > 0 && textMatched.length === 0 && hasOtherFilters && structural.length > 0;
  const base = relaxedQuery ? structural : textMatched;

  const inWindow = (e: Event) =>
    (!criteria.dateFrom || e.date >= criteria.dateFrom) && (!criteria.dateTo || e.date <= criteria.dateTo);
  const dated = base.filter(inWindow);
  const relaxedDate = Boolean(criteria.dateFrom || criteria.dateTo) && dated.length === 0 && base.length > 0;
  const pool = relaxedDate ? base : dated;

  const today = now.toISOString().slice(0, 10);
  const ranked = [...pool].sort((a, b) => {
    const sa = getEventPersonalizationScore(a, user) + textScore(a, tokens) + (a.isTrending ? 8 : 0) + (a.date >= today ? 20 : 0);
    const sb = getEventPersonalizationScore(b, user) + textScore(b, tokens) + (b.isTrending ? 8 : 0) + (b.date >= today ? 20 : 0);
    if (sb !== sa) return sb - sa;
    // Upcoming first (soonest), then most recent past.
    const ua = a.date >= today;
    const ub = b.date >= today;
    if (ua && ub) return a.date.localeCompare(b.date);
    if (ua !== ub) return ua ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  return { events: ranked.slice(0, limit), relaxedDate, relaxedQuery, totalMatches: pool.length };
}

/** Resolves «e3», a fuzzy title, or an ordinal into an event id. */
export function resolveEventRef(
  ref: unknown,
  events: Event[],
  lastEventIds: string[],
): Event | null {
  if (typeof ref === 'number' && Number.isFinite(ref)) {
    const idx = ref < 0 ? lastEventIds.length + ref : ref;
    const id = lastEventIds[idx];
    return events.find((e) => e.id === id) ?? null;
  }
  if (typeof ref !== 'string' || !ref.trim()) {
    const id = lastEventIds[0];
    return id ? events.find((e) => e.id === id) ?? null : null;
  }
  const direct = events.find((e) => e.id === ref.trim());
  if (direct) return direct;
  const key = fuzzyKey(ref);
  if (!key) return null;
  let best: { e: Event; score: number } | null = null;
  for (const e of events) {
    const title = fuzzyKey(e.title);
    let score = 0;
    if (title === key) score = 100;
    else if (title.includes(key)) score = 60 + key.length;
    else {
      const words = key.split(' ').filter((w) => w.length >= 3);
      const hits = words.filter((w) => title.includes(w)).length;
      if (words.length > 0 && hits > 0) score = (hits / words.length) * 50;
    }
    if (lastEventIds.includes(e.id)) score += 5;
    if (score > 0 && (!best || score > best.score)) best = { e, score };
  }
  return best && best.score >= 25 ? best.e : null;
}
