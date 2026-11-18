import { describe, expect, it } from 'vitest';
import { applyLiveCatalogDates, liveCatalogDate, withLiveSeedSchedule } from './demoCatalogDates';

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
});
