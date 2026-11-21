import { haversineKm } from './haversine';
import { eventOccursAt } from './eventDisplay';
import type { Event } from '../types';

/** Last-minute window: tonight and tomorrow, not next month’s calendar. */
export const MINI_OUTING_SOON_HOURS = 48;
export const MINI_OUTING_DEFAULT_RADIUS_KM = 5;
/** Treat as “whole city / anywhere” once the radius is this wide. */
export const MINI_OUTING_CITY_RADIUS_KM = 50;
const STARTED_GRACE_MS = 30 * 60_000;

export type MiniOutingWhen = 'soon' | 'today' | 'week';
export type MiniOutingRadiusKm = 5 | 10 | 50;

export interface MapLocation {
  lat: number;
  lng: number;
  label: string;
  source: 'gps' | 'maps' | 'place';
}

export const MINI_OUTING_PLACES: { el: string; en: string; area: string; lat: number; lng: number }[] = [
  { el: 'Σύνταγμα', en: 'Syntagma', area: 'Syntagma, Athens', lat: 37.9755, lng: 23.7348 },
  { el: 'Κουκάκι', en: 'Koukaki', area: 'Koukaki, Athens', lat: 37.9655, lng: 23.7243 },
  { el: 'Ζάππειο', en: 'Zappeio', area: 'Zappeio, Athens', lat: 37.9716, lng: 23.7363 },
  { el: 'Θησείο', en: 'Thisio', area: 'Thisio, Athens', lat: 37.9765, lng: 23.7208 },
  { el: 'Εξάρχεια', en: 'Exarchia', area: 'Exarchia, Athens', lat: 37.9862, lng: 23.7348 },
  { el: 'Γκάζι', en: 'Gazi', area: 'Gazi, Athens', lat: 37.9784, lng: 23.7142 },
  { el: 'Ψυρρή', en: 'Psyrri', area: 'Psyrri, Athens', lat: 37.9783, lng: 23.7239 },
  { el: 'Κολωνάκι', en: 'Kolonaki', area: 'Kolonaki, Athens', lat: 37.979, lng: 23.743 },
];

export function parseDurationHours(duration: string | undefined): number {
  if (!duration) return 1;
  const hours = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
  const minutes = duration.match(/(\d+)\s*m/i);
  return (hours ? Number(hours[1]) : 0) + (minutes ? Number(minutes[1]) / 60 : 0) || 1;
}

/** Mini outings are short by design; keep anything over 2 hours out of this rail. */
export function isShortMiniOuting(event: Pick<Event, 'kind' | 'duration'>): boolean {
  if (event.kind !== 'mini_outing') return false;
  return parseDurationHours(event.duration) <= 2;
}

export function placeForArea(area: string | undefined): (typeof MINI_OUTING_PLACES)[number] | undefined {
  if (!area) return undefined;
  const needle = area.toLowerCase();
  return MINI_OUTING_PLACES.find(
    (place) => needle.includes(place.en.toLowerCase()) || needle.includes(place.el.toLowerCase()) || needle.includes(place.area.toLowerCase()),
  );
}

export function outingCoords(event: Pick<Event, 'lat' | 'lng' | 'locationArea'>): { lat: number; lng: number } | null {
  if (typeof event.lat === 'number' && typeof event.lng === 'number') return { lat: event.lat, lng: event.lng };
  const place = placeForArea(event.locationArea);
  return place ? { lat: place.lat, lng: place.lng } : null;
}

export function matchesWhen(
  event: Pick<Event, 'date' | 'time'>,
  when: MiniOutingWhen,
  now: Date = new Date(),
): boolean {
  const start = eventOccursAt(event);
  if (Number.isNaN(start.getTime())) return false;
  const startMs = start.getTime();
  const nowMs = now.getTime();
  if (startMs < nowMs - STARTED_GRACE_MS) return false;
  if (when === 'soon') return startMs <= nowMs + MINI_OUTING_SOON_HOURS * 36e5;
  const startDay = event.date;
  const today = localDay(now);
  if (when === 'today') return startDay === today;
  const weekEnd = new Date(nowMs + 7 * 24 * 36e5);
  return startMs <= weekEnd.getTime();
}

export function distanceKmToOuting(
  event: Pick<Event, 'lat' | 'lng' | 'locationArea'>,
  origin: Pick<MapLocation, 'lat' | 'lng'>,
): number | null {
  const point = outingCoords(event);
  if (!point) return null;
  return haversineKm(origin.lat, origin.lng, point.lat, point.lng);
}

export function matchesNearby(
  event: Pick<Event, 'lat' | 'lng' | 'locationArea'>,
  origin: Pick<MapLocation, 'lat' | 'lng'>,
  radiusKm: number,
): boolean {
  const km = distanceKmToOuting(event, origin);
  if (km == null) return false;
  return km <= radiusKm;
}

export function rankMiniOutings<T extends Pick<Event, 'id' | 'kind' | 'duration' | 'date' | 'time' | 'lat' | 'lng' | 'locationArea' | 'status'>>(
  events: T[],
  opts: {
    origin: MapLocation | null;
    when: MiniOutingWhen;
    radiusKm: MiniOutingRadiusKm;
    now?: Date;
  },
): { event: T; km: number | null }[] {
  const now = opts.now ?? new Date();
  return events
    .filter((event) => event.status !== 'cancelled' && isShortMiniOuting(event) && matchesWhen(event, opts.when, now))
    .map((event) => ({
      event,
      km: opts.origin ? distanceKmToOuting(event, opts.origin) : null,
    }))
    .filter((row) => {
      if (!opts.origin) return false;
      return matchesNearby(row.event, opts.origin, opts.radiusKm);
    })
    .sort((a, b) => {
      const aStart = eventOccursAt(a.event).getTime();
      const bStart = eventOccursAt(b.event).getTime();
      if (aStart !== bStart) return aStart - bStart;
      return (a.km ?? 99) - (b.km ?? 99);
    });
}

function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
