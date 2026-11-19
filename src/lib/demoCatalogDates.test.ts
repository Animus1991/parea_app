import { describe, expect, it } from 'vitest';
import { applyLiveCatalogDates, coerceAuthoredSeasonToLive, liveCatalogDate, refreshLiveCatalogDates, withLiveSeedSchedule } from './demoCatalogDates';

describe('demoCatalogDates', () => {
  const now = new Date('2026-11-18T12:00:00');

  it('keeps the attended cinema in the past so pending review stays honest', () => {
    expect(liveCatalogDate('2026-05-14', 'e4', now)).toBe('2026-11-14');
  });

  it('shifts upcoming catalog nights forward from the authored season', () => {
    expect(liveCatalogDate('2026-06-12', 'e30', now)).toBe('2026-12-18');
    const [cinema, hike] = applyLiveCatalogDates(
      [
        { id: 'e4', date: '2026-05-14' },
        { id: 'e29', date: '2026-06-14' },
      ],
      now,
    );
    expect(cinema.date < hike.date).toBe(true);
    expect(hike.date > '2026-11-18').toBe(true);
  });

  it('overlays live seed dates onto persisted catalog events', () => {
    const seeds = [
      { id: 'e1', date: '2026-12-01', time: '20:00' },
      { id: 'e4', date: '2026-11-14', time: '20:45' },
    ];
    const persisted = [
      { id: 'e1', date: '2026-05-16', time: '20:00' },
      { id: 'e4', date: '2026-05-14', time: '20:45' },
      { id: 'user-1', date: '2026-05-20', time: '19:00' },
    ];
    const merged = withLiveSeedSchedule(seeds, persisted);
    expect(merged).toEqual([
      { id: 'e1', date: '2026-12-01', time: '20:00' },
      { id: 'e4', date: '2026-11-14', time: '20:45' },
      { id: 'user-1', date: '2026-05-20', time: '19:00' },
    ]);
  });

  it('recomputes from authored dates even when persist already holds a stale shift', () => {
    const authored = new Map([
      ['e1', { date: '2026-05-16', time: '20:00' }],
      ['e4', { date: '2026-05-14', time: '20:45' }],
    ]);
    const persisted = [
      { id: 'e1', date: '2026-05-16', time: '20:00' },
      { id: 'e4', date: '2026-05-14', time: '20:45' },
      { id: 'nn1', date: '2026-11-27', time: '20:30' },
    ];
    const refreshed = refreshLiveCatalogDates(persisted, authored, now);
    expect(refreshed[0]?.date).toBe('2026-11-21');
    expect(refreshed[1]?.date).toBe('2026-11-14');
    expect(refreshed[2]?.date).toBe('2026-11-27');
  });

  it('shifts leftover May persist dates without double-shifting live nights', () => {
    const coerced = coerceAuthoredSeasonToLive(
      [
        { id: 'e1', date: '2026-05-16' },
        { id: 'nn1', date: '2026-11-27' },
        { id: 'e4', date: '2026-05-14' },
      ],
      now,
    );
    expect(coerced[0]?.date).toBe('2026-11-21');
    expect(coerced[1]?.date).toBe('2026-11-27');
    expect(coerced[2]?.date).toBe('2026-11-14');
  });
});
