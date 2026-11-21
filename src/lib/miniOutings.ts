import { haversineKm } from './haversine';
import { eventOccursAt } from './eventDisplay';
import type { Event } from '../types';

/** Last-minute window: tonight and tomorrow, not next month’s calendar. */
export const MINI_OUTING_SOON_HOURS = 48;
export const MINI_OUTING_DEFAULT_RADIUS_KM = 5;
/** Treat as “whole city / anywhere” once the radius is this wide. */
export const MINI_OUTING_CITY_RADIUS_KM = 50;
const STARTED_GRACE_MS = 30 * 60_000;

/** Seed mini outings stay on the real clock after a saved demo session reloads. */
export const MINI_OUTING_FIXTURE_OFFSETS: Record<string, { days: number; time: string }> = {
  mo1: { days: 6, time: '11:00' },
  mo2: { days: 1, time: '09:00' },
  mo3: { days: 0, time: '20:00' },
  mo4: { days: 1, time: '17:00' },
};

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
  { el: 'Παγκράτι', en: 'Pangrati', area: 'Pangrati, Athens', lat: 37.9675, lng: 23.7503 },
  { el: 'Πλάκα', en: 'Plaka', area: 'Plaka, Athens', lat: 37.9726, lng: 23.7303 },
  { el: 'Μοναστηράκι', en: 'Monastiraki', area: 'Monastiraki, Athens', lat: 37.9737, lng: 23.7259 },
  { el: 'Κυψέλη', en: 'Kypseli', area: 'Kypseli, Athens', lat: 37.993, lng: 23.737 },
  { el: 'Πετράλωνα', en: 'Petralona', area: 'Petralona, Athens', lat: 37.9685, lng: 23.7095 },
  { el: 'Νέος Κόσμος', en: 'Neos Kosmos', area: 'Neos Kosmos, Athens', lat: 37.9585, lng: 23.7285 },
  { el: 'Μετς', en: 'Mets', area: 'Mets, Athens', lat: 37.9635, lng: 23.7375 },
  { el: 'Ιλίσια', en: 'Ilisia', area: 'Ilisia, Athens', lat: 37.977, lng: 23.756 },
  { el: 'Κεραμεικός', en: 'Kerameikos', area: 'Kerameikos, Athens', lat: 37.978, lng: 23.718 },
  { el: 'Μακρυγιάννη', en: 'Makrygianni', area: 'Makrygianni, Athens', lat: 37.968, lng: 23.728 },
  { el: 'Αθήνα', en: 'Athens', area: 'Athens', lat: 37.9838, lng: 23.7275 },
];

const QUICK_PLACE_EN = new Set(['Syntagma', 'Koukaki', 'Zappeio', 'Thisio', 'Exarchia', 'Gazi', 'Psyrri', 'Kolonaki', 'Pangrati']);
export const MINI_OUTING_QUICK_PLACES = MINI_OUTING_PLACES.filter((place) => QUICK_PLACE_EN.has(place.en));

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
  const needle = area.toLowerCase().trim();
  const scored = MINI_OUTING_PLACES.map((place) => {
    const names = [place.area, place.en, place.el].map((name) => name.toLowerCase());
    if (names.some((name) => name === needle)) return { place, score: 3 };
    const generic = place.en === 'Athens';
    if (!generic && names.some((name) => needle.includes(name))) return { place, score: 2 };
    if (generic && (needle === 'athens' || needle === 'αθήνα')) return { place, score: 1 };
    return { place, score: 0 };
  }).filter((row) => row.score > 0);
  scored.sort((a, b) => b.score - a.score || b.place.en.length - a.place.en.length);
  return scored[0]?.place;
}

export function dayFromNow(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function withFreshMiniOutingDates<T extends { id: string; date: string; time?: string }>(
  events: T[],
  now: Date = new Date(),
): T[] {
  return events.map((event) => {
    const spec = MINI_OUTING_FIXTURE_OFFSETS[event.id];
    if (!spec) return event;
    const date = dayFromNow(spec.days, now);
    if (event.date === date && event.time === spec.time) return event;
    return { ...event, date, time: spec.time };
  });
}

/** Join closes at the start; the 30′ grace only keeps a started outing visible. */
export function outingHasStarted(event: Pick<Event, 'date' | 'time'>, now: Date = new Date()): boolean {
  const start = eventOccursAt(event).getTime();
  return !Number.isNaN(start) && start <= now.getTime();
}

/** Neighbourhood centroid for a published hang — never a GPS search fix. */
export function publicMiniOutingPin(
  area: string,
  searchLocation?: MapLocation | null,
): { area: string; lat: number; lng: number } | null {
  const place = placeForArea(area);
  if (place) return { area: place.area, lat: place.lat, lng: place.lng };
  if (searchLocation && searchLocation.source !== 'gps' && searchLocation.label.trim() === area.trim()) {
    return { area, lat: searchLocation.lat, lng: searchLocation.lng };
  }
  return null;
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
      if (row.km == null) return opts.radiusKm >= MINI_OUTING_CITY_RADIUS_KM;
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
