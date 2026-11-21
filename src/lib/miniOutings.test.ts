import { describe, expect, it } from 'vitest';
import {
  MINI_OUTING_CITY_RADIUS_KM,
  MINI_OUTING_DEFAULT_RADIUS_KM,
  dayFromNow,
  distanceKmToOuting,
  isShortMiniOuting,
  matchesNearby,
  matchesWhen,
  outingHasStarted,
  parseDurationHours,
  placeForArea,
  rankMiniOutings,
  withFreshMiniOutingDates,
} from './miniOutings';

const origin = { lat: 37.9755, lng: 23.7348, label: 'Syntagma', source: 'gps' as const };
const now = new Date('2026-11-21T11:30:00');

const coffee = {
  id: 'mo1',
  kind: 'mini_outing' as const,
  duration: '1h',
  date: '2026-11-28',
  time: '11:00',
  lat: 37.9655,
  lng: 23.7243,
  locationArea: 'Koukaki, Athens',
  status: undefined,
};
const run = {
  id: 'mo2',
  kind: 'mini_outing' as const,
  duration: '1h',
  date: '2026-11-22',
  time: '09:00',
  lat: 37.9716,
  lng: 23.7363,
  locationArea: 'Zappeio, Athens',
  status: undefined,
};
const farDrink = {
  id: 'mo3',
  kind: 'mini_outing' as const,
  duration: '1h 30m',
  date: '2026-11-21',
  time: '20:00',
  lat: 40.6401,
  lng: 22.9444,
  locationArea: 'Thessaloniki',
  status: undefined,
};

describe('mini outing last-minute filters', () => {
  it('treats coffee / walk / run / a drink as short', () => {
    expect(parseDurationHours('1h 30m')).toBe(1.5);
    expect(isShortMiniOuting(coffee)).toBe(true);
    expect(isShortMiniOuting({ kind: 'event', duration: '1h' })).toBe(false);
    expect(isShortMiniOuting({ kind: 'mini_outing', duration: '4h' })).toBe(false);
  });

  it('soon is the next 48 hours, not next week', () => {
    expect(matchesWhen(run, 'soon', now)).toBe(true);
    expect(matchesWhen(coffee, 'soon', now)).toBe(false);
    expect(matchesWhen(coffee, 'week', now)).toBe(true);
    expect(matchesWhen(farDrink, 'today', now)).toBe(true);
  });

  it('nearby is walking distance from the map pin', () => {
    expect(distanceKmToOuting(run, origin)!).toBeLessThan(MINI_OUTING_DEFAULT_RADIUS_KM);
    expect(matchesNearby(run, origin, 5)).toBe(true);
    expect(matchesNearby(farDrink, origin, 5)).toBe(false);
    expect(matchesNearby(farDrink, origin, 50)).toBe(false);
  });

  it('asks for a map pin before listing anything', () => {
    expect(
      rankMiniOutings([coffee, run, farDrink], {
        origin: null,
        when: 'soon',
        radiusKm: 5,
        now,
      }),
    ).toEqual([]);
  });

  it('default ranking is soon and nearby, soonest first', () => {
    const ranked = rankMiniOutings([coffee, run, farDrink], {
      origin,
      when: 'soon',
      radiusKm: 5,
      now,
    });
    expect(ranked.map((row) => row.event.id)).toEqual(['mo2']);
    const week = rankMiniOutings([coffee, run, farDrink], {
      origin,
      when: 'week',
      radiusKm: 5,
      now,
    });
    expect(week.map((row) => row.event.id)).toEqual(['mo2', 'mo1']);
  });

  it('resolves Pangrati without matching the whole city', () => {
    expect(placeForArea('Pangrati, Athens')?.en).toBe('Pangrati');
    expect(placeForArea('Παγκράτι')?.lat).toBeCloseTo(37.9675);
    expect(placeForArea('Athens')?.en).toBe('Athens');
  });

  it('keeps pin-less outings only at the city radius', () => {
    const lost = { ...coffee, id: 'mo-lost', lat: undefined, lng: undefined, locationArea: 'Unknown alley' };
    expect(
      rankMiniOutings([lost], { origin, when: 'week', radiusKm: 5, now }).map((row) => row.event.id),
    ).toEqual([]);
    expect(
      rankMiniOutings([lost], { origin, when: 'week', radiusKm: MINI_OUTING_CITY_RADIUS_KM, now }).map((row) => row.event.id),
    ).toEqual(['mo-lost']);
  });

  it('closes join at the start while the card can still be visible', () => {
    expect(outingHasStarted(farDrink, now)).toBe(false);
    expect(outingHasStarted(farDrink, new Date('2026-11-21T20:01:00'))).toBe(true);
    expect(matchesWhen(farDrink, 'soon', new Date('2026-11-21T20:10:00'))).toBe(true);
  });

  it('rolls demo mini-outing dates forward on reload', () => {
    const later = new Date('2026-12-10T12:00:00');
    const refreshed = withFreshMiniOutingDates([{ id: 'mo1', date: '2026-11-28', time: '11:00' }], later);
    expect(refreshed[0].date).toBe(dayFromNow(6, later));
    expect(refreshed[0].time).toBe('11:00');
  });
});
