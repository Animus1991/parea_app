import { addDays, endOfDay, isSameDay, startOfDay, startOfWeek } from 'date-fns';
import type { Event } from '../types';
import { CATEGORY_CATALOG } from './categoriesCatalog';
import { ATHENS_CENTER, haversineKm } from './haversine';
import { foldSearchText } from './greekText';

export type PriceFilter = 'All' | 'Free' | 'Paid' | 'Group Discount';
export type DateFilter = 'Any' | 'Today' | 'This Week' | 'This Month' | 'Weekend';
export type SortBy = 'Relevance' | 'Trending' | 'Distance' | 'Group Progress';

export function matchesCategoryFilter(
  event: Pick<Event, 'category'>,
  activeCategory: string | null,
): boolean {
  return !activeCategory || event.category === activeCategory;
}

export function matchesDateFilter(date: Date, filter: DateFilter, now: Date): boolean {
  if (filter === 'Any') return true;
  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) return false;
  if (filter === 'Today') return isSameDay(date, now);

  if (filter === 'This Week') {
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfDay(addDays(weekStart, 6));
    return date >= weekStart && date <= weekEnd;
  }

  if (filter === 'This Month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }

  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const weekendStart = isWeekend ? now : startOfDay(addDays(now, daysUntilSaturday));
  const weekendEnd = endOfDay(addDays(weekendStart, weekendStart.getDay() === 6 ? 1 : 0));
  return date >= weekendStart && date <= weekendEnd;
}

export function matchesEventQuery(event: Event, query: string): boolean {
  const foldedQuery = foldSearchText(query);
  if (!foldedQuery) return true;

  const category = CATEGORY_CATALOG.find((item) => item.name === event.category);
  return [
    event.title,
    event.description,
    ...(event.tags ?? []),
    event.category,
    category?.labelGr ?? '',
    category?.labelEn ?? '',
  ].some((value) => foldSearchText(value).includes(foldedQuery));
}

export function sortEventsByDistance<T extends Pick<Event, 'lat' | 'lng'>>(
  events: readonly T[],
  origin: { lat: number; lng: number } = ATHENS_CENTER,
): T[] {
  const hasCoordinates = (event: T) =>
    typeof event.lat === 'number' &&
    Number.isFinite(event.lat) &&
    typeof event.lng === 'number' &&
    Number.isFinite(event.lng);

  return [...events].sort((a, b) => {
    const aHasCoordinates = hasCoordinates(a);
    const bHasCoordinates = hasCoordinates(b);
    if (aHasCoordinates !== bHasCoordinates) return aHasCoordinates ? -1 : 1;
    if (!aHasCoordinates || !bHasCoordinates) return 0;
    return (
      haversineKm(origin.lat, origin.lng, a.lat!, a.lng!) -
      haversineKm(origin.lat, origin.lng, b.lat!, b.lng!)
    );
  });
}
