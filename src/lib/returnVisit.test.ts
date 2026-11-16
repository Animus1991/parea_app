import { afterEach, describe, expect, it } from 'vitest';
import { buildReturnSummary, describeReturnPart, returnPartPath, RETURN_GAP_MS } from './returnVisit';
import { previousVisitAt } from './visitClock';

const el = (g: string) => g;
const en = (_g: string, e: string) => e;
const now = new Date(2026, 10, 14, 18, 0);

describe('buildReturnSummary', () => {
  it('stays empty on a first visit with nothing planned', () => {
    expect(buildReturnSummary({ now, previousVisitAt: null, nextEvent: null, newPlans: 3, unreadChats: 2, unreadNotifications: 1 })).toEqual([]);
  });

  it('shows the next plan within two days, in either language', () => {
    const parts = buildReturnSummary({
      now,
      previousVisitAt: null,
      nextEvent: { id: 'e1', title: 'Summer Cinema', start: new Date(2026, 10, 15, 20, 30) },
      newPlans: 0,
      unreadChats: 0,
      unreadNotifications: 0,
    });
    expect(parts).toHaveLength(1);
    expect(describeReturnPart(parts[0], el)).toBe('Επόμενο: αύριο 20:30, Summer Cinema');
    expect(describeReturnPart(parts[0], en)).toBe('Next: tomorrow 20:30, Summer Cinema');
    expect(returnPartPath(parts[0])).toBe('/events/e1');
  });

  it('ignores plans further than two days away or already past', () => {
    const far = { id: 'e2', title: 'Later', start: new Date(2026, 10, 18, 20, 0) };
    const past = { id: 'e3', title: 'Past', start: new Date(2026, 10, 14, 10, 0) };
    for (const nextEvent of [far, past]) {
      expect(buildReturnSummary({ now, previousVisitAt: null, nextEvent, newPlans: 0, unreadChats: 0, unreadNotifications: 0 })).toEqual([]);
    }
  });

  it('lists news only for a real return, with correct plurals', () => {
    const base = { now, nextEvent: null, newPlans: 2, unreadChats: 1, unreadNotifications: 4 };
    expect(buildReturnSummary({ ...base, previousVisitAt: now.getTime() - RETURN_GAP_MS + 1000 })).toEqual([]);
    const parts = buildReturnSummary({ ...base, previousVisitAt: now.getTime() - 2 * RETURN_GAP_MS });
    expect(parts.map((p) => describeReturnPart(p, el))).toEqual(['2 νέα σχέδια για σένα', '1 νέο μήνυμα', '4 ειδοποιήσεις']);
    expect(parts.map(returnPartPath)).toEqual(['/buddy-seek', '/chats', '/notifications']);
  });

  it('keeps one quiet line: at most three parts', () => {
    const parts = buildReturnSummary({
      now,
      previousVisitAt: 0,
      nextEvent: { id: 'e1', title: 'X', start: new Date(2026, 10, 14, 21, 0) },
      newPlans: 1,
      unreadChats: 1,
      unreadNotifications: 1,
    });
    expect(parts.map((p) => p.kind)).toEqual(['next', 'plans', 'chats']);
    expect(describeReturnPart(parts[0], el)).toBe('Επόμενο: σήμερα 21:00, X');
  });

  it('mentions new wall posts and links to the wall', () => {
    const parts = buildReturnSummary({ now, previousVisitAt: 0, nextEvent: null, newPlans: 0, unreadChats: 0, unreadNotifications: 0, newPosts: 3 });
    expect(parts).toEqual([{ kind: 'posts', count: 3 }]);
    expect(describeReturnPart(parts[0], el)).toBe('3 νέες δημοσιεύσεις στον τοίχο');
    expect(returnPartPath(parts[0])).toBe('/wall');
  });
});

describe('previousVisitAt', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('is null the first time, then remembers the previous visit for the whole session', () => {
    expect(previousVisitAt('u1', 1000)).toBeNull();
    sessionStorage.clear(); // new browser session
    expect(previousVisitAt('u1', 5000)).toBe(1000);
    expect(previousVisitAt('u1', 9000)).toBe(1000); // same session: stable
    expect(previousVisitAt('u2', 9000)).toBeNull(); // per user
  });
});
