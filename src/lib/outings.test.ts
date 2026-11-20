import { describe, expect, it } from 'vitest';
import type { Event, Group, User } from '../types';
import type { Strike } from '../types/outings';
import { checkInCode, checkInPayload, checkInWindow, currentCheckInCode, matchCheckInCode, parseCheckInPayload, CHECKIN_WINDOW_MS } from './checkIn';
import { activeStrikes, standingBlocksJoining, standingFor } from './consequences';
import { groupVibeFit, isCompleteVibe, vibeSimilarity } from './vibe';
import {
  COLLECTIONS,
  canJoinGroup,
  collectionById,
  collectionEvents,
  groupCodeFor,
  groupComposition,
  nearestPartnerVenues,
  outingMetrics,
  timeMinus,
} from './outings';
import { ALL_COVERS, coversFor } from './planCovers';
import { buildOrganizerIcs, organizerCalendarUrl } from './organizerCalendar';
import { handOverSeat } from '../store/outingsSlice';
import { mockUsers } from '../data/mockUsers';
import { mockEvents } from '../data/mockEvents';
import { mockOutingEvents, mockOutingGroups, withOutingPeople } from '../data/mockOutings';
import { settleReservation, demoTicketPartner } from '../services/ticketPartner';

const t = (el: string) => el;
const DAY = 86_400_000;
const users = withOutingPeople(mockUsers);
const u = (id: string) => users.find((x) => x.id === id)!;

function group(partial: Partial<Group>): Group {
  return { id: 'gx', eventId: 'e1', members: [], pendingMembers: [], targetSize: 4, status: 'pending', discountUnlocked: false, ...partial };
}

describe('check-in codes', () => {
  it('rotate every 30 s and accept the previous window only', () => {
    const now = 1_800_000_000_000;
    const a = currentCheckInCode('g1', 'u1', now);
    expect(a.code).toMatch(/^\d{6}$/);
    expect(matchCheckInCode('g1', ['u1', 'u2'], a.code, now)).toBe('u1');
    expect(matchCheckInCode('g1', ['u1', 'u2'], a.code, now + CHECKIN_WINDOW_MS)).toBe('u1');
    expect(matchCheckInCode('g1', ['u1', 'u2'], a.code, now + 2 * CHECKIN_WINDOW_MS)).toBeNull();
    expect(checkInCode('g1', 'u1', checkInWindow(now))).not.toBe(checkInCode('g2', 'u1', checkInWindow(now)));
  });

  it('round-trips the QR payload and rejects garbage', () => {
    const p = checkInPayload('g-nn1', 'u2', '012345');
    expect(parseCheckInPayload(p)).toEqual({ groupId: 'g-nn1', userId: 'u2', code: '012345' });
    expect(parseCheckInPayload('https://evil.example')).toBeNull();
    expect(matchCheckInCode('g1', ['u1'], '12 34', 0)).toBeNull();
  });
});

describe('graduated consequences', () => {
  const now = Date.parse('2026-11-16T12:00:00Z');
  const strike = (days: number, extra: Partial<Strike> = {}): Strike => ({
    id: `s${days}`,
    userId: 'u3',
    kind: 'no_show',
    at: new Date(now - days * DAY).toISOString(),
    reliabilityDelta: -15,
    ...extra,
  });

  it('goes warning → 7-day pause → review, inside 90 days', () => {
    expect(standingFor([], 'u3', now).level).toBe('good');
    expect(standingFor([strike(10)], 'u3', now).level).toBe('warning');
    const paused = standingFor([strike(10), strike(2)], 'u3', now);
    expect(paused.level).toBe('paused');
    expect(standingBlocksJoining(paused)).toBe(true);
    expect(standingFor([strike(10), strike(9)], 'u3', now).level).toBe('warning');
    expect(standingFor([strike(30), strike(20), strike(10)], 'u3', now).level).toBe('review');
    expect(activeStrikes([strike(120)], 'u3', now)).toHaveLength(0);
  });

  it('ignores strikes whose appeal was upheld', () => {
    const upheld = strike(3, { appeal: { text: 'x', at: '', status: 'accepted' } });
    expect(standingFor([upheld], 'u3', now).level).toBe('good');
  });
});

describe('vibe', () => {
  it('scores similarity with plain reasons and checks completeness', () => {
    const a = u('u2').vibe!;
    const b = u('u4').vibe!;
    expect(isCompleteVibe(a)).toBe(true);
    expect(isCompleteVibe({ pace: 1 })).toBe(false);
    const sim = vibeSimilarity(a, b, t)!;
    expect(sim.score).toBeGreaterThan(0.5);
    expect(sim.reasons.length).toBeGreaterThan(0);
    expect(vibeSimilarity(a, undefined, t)).toBeNull();
    const fit = groupVibeFit(a, [u('u3').vibe, u('u4').vibe, undefined], t)!;
    expect(fit.answered).toBe(2);
  });
});

describe('join gate', () => {
  const ctx = { users, strikes: [] as Strike[], blockedUserIds: [] as string[] };

  it('keeps women & non-binary groups for people who declared it', () => {
    const g = group({ members: ['u2'], genderMode: 'women_nb' });
    expect(canJoinGroup(u('u1'), g, ctx).reason).toBe('gender');
    expect(canJoinGroup({ ...u('u1'), gender: 'non_binary' } as User, g, ctx).ok).toBe(true);
    expect(canJoinGroup(u('u4'), g, ctx).ok).toBe(true);
  });

  it('sends a full group to the waitlist and blocks across blocks', () => {
    const full = group({ members: ['u2', 'u3'], targetSize: 2 });
    const gate = canJoinGroup(u('u1'), full, ctx);
    expect(gate.reason).toBe('full');
    expect(gate.canWaitlist).toBe(true);
    expect(canJoinGroup(u('u1'), group({ members: ['u3'] }), { ...ctx, blockedUserIds: ['u3'] }).reason).toBe('blocked');
  });

  it('pauses joining strangers, not friends', () => {
    const now = Date.now();
    const strikes: Strike[] = [1, 2].map((d) => ({ id: `x${d}`, userId: 'u1', kind: 'no_show', at: new Date(now - d * DAY).toISOString(), reliabilityDelta: -15 }));
    const stranger = { ...u('u1'), connections: [] } as User;
    expect(canJoinGroup(stranger, group({ members: ['u3'] }), { ...ctx, users: [stranger, ...users.filter((x) => x.id !== 'u1').map((x) => ({ ...x, connections: [] }))], strikes }).reason).toBe('standing');
    const friend = { ...u('u1'), connections: ['u3'] } as User;
    expect(canJoinGroup(friend, group({ members: ['u3'] }), { ...ctx, strikes }).ok).toBe(true);
  });
});

describe('seat hand-over', () => {
  it('passes the seat to the first eligible person, at face value', () => {
    const g = group({ members: ['u1', 'u2', 'u4'], targetSize: 3, waitlist: ['u3'], genderMode: 'mixed', hostId: 'u1' });
    const out = handOverSeat(g, 'u1', { users, strikes: [], blockedUserIds: [], price: 12 });
    expect(out.toUserId).toBe('u3');
    expect(out.group.members).toEqual(['u2', 'u4', 'u3']);
    expect(out.group.waitlist).toEqual([]);
    expect(out.group.lastTransfer).toMatchObject({ fromUserId: 'u1', toUserId: 'u3', price: 12 });
    expect(out.group.hostId).toBe('u3');
    expect(out.newHostId).toBe('u3');
  });

  it('skips people who may not join and does nothing for a group that was not full', () => {
    const womenOnly = group({ members: ['u2', 'u4', 'u1'], targetSize: 3, waitlist: ['u3'], genderMode: 'women_nb', hostId: 'u1' });
    const skipped = handOverSeat(womenOnly, 'u1', { users, strikes: [], blockedUserIds: [], price: 0 });
    expect(skipped.toUserId).toBeNull();
    expect(skipped.group.hostId).toBe('u2');
    expect(skipped.newHostId).toBe('u2');
    const open = group({ members: ['u1', 'u2'], targetSize: 4, waitlist: ['u3'], hostId: 'u1' });
    const openOut = handOverSeat(open, 'u1', { users, strikes: [], blockedUserIds: [], price: 0 });
    expect(openOut.toUserId).toBeNull();
    expect(openOut.group.hostId).toBe('u2');
  });

  it('moves a pending ticket share to the new member', () => {
    const tickets = demoTicketPartner.reserve({ groupId: 'gx', eventId: 'e1', memberIds: ['u1', 'u2'], unitPrice: 10 });
    const g = group({ members: ['u1', 'u2'], targetSize: 2, waitlist: ['u3'], tickets });
    const out = handOverSeat(g, 'u1', { users, strikes: [], blockedUserIds: [], price: 10 });
    expect(Object.keys(out.group.tickets!.payments).sort()).toEqual(['u2', 'u3']);
  });
});

describe('codes, places, composition, collections, metrics', () => {
  it('makes a stable readable group code', () => {
    expect(groupCodeFor('g2')).toMatch(/^PAREA-[A-HJ-NP-Z2-9]{4}$/);
    expect(groupCodeFor('g2')).toBe(groupCodeFor('g2'));
    expect(groupCodeFor('g2')).not.toBe(groupCodeFor('g3'));
  });

  it('finds the nearest partner places and the pre-meet time', () => {
    const thisio = mockEvents.find((e) => e.id === 'e4')!;
    expect(nearestPartnerVenues(thisio)[0].venue.id).toBe('pv_thisio');
    expect(timeMinus('20:30', 30)).toBe('20:00');
    expect(timeMinus('00:15', 30)).toBe('23:45');
  });

  it('shows composition only for 3+ people, as totals', () => {
    expect(groupComposition([u('u1'), u('u2')], 'el')).toBeNull();
    const c = groupComposition([u('u1'), u('u2'), u('u4')], 'el')!;
    expect(c.size).toBe(3);
    expect(c.ageSpan).toBe('24–34');
    expect(c.shared.length).toBeGreaterThan(0);
  });

  it('fills collections and counts forming groups', () => {
    const events = [...mockEvents, ...mockOutingEvents] as Event[];
    const nights = collectionEvents(collectionById('nakamas-nights')!, events, mockOutingGroups);
    expect(nights.map((e) => e.id).sort()).toEqual(['nn1', 'nn2', 'nn3']);
    expect(collectionEvents(collectionById('free')!, events, []).every((e) => !e.isPaid || e.price === 0)).toBe(true);
    expect(collectionEvents(collectionById('outdoors')!, events, []).some((e) => e.id === 'e10')).toBe(true);
    // Small outings stay in «Βρες Nakamas», not in collections.
    expect(COLLECTIONS.flatMap((c) => collectionEvents(c, events, mockOutingGroups)).some((e) => e.kind === 'mini_outing')).toBe(false);
  });

  it('counts outings that happened from check-ins, and verified active members only', () => {
    const groups = [
      group({ id: 'a', members: ['u1', 'u2', 'u3'], status: 'confirmed', checkIns: { u1: { at: '', by: 'u2', method: 'qr' }, u2: { at: '', by: 'u1', method: 'qr' } }, checkInClosedAt: 'x' }),
      group({ id: 'b', members: ['u4'], checkIns: { u4: { at: '', by: 'u4', method: 'manual' } } }),
    ];
    const m = outingMetrics(groups, users, []);
    expect(m.outingsHappened).toBe(1);
    expect(m.showRate).toBe(67);
    // u3 has no confirmed phone → not counted.
    expect(m.verifiedActive).toBe(3);
  });
});

function luminance(hex: string) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('plan covers', () => {
  it('offers 4 covers per kind and every one keeps 4.5:1 text contrast', () => {
    expect(coversFor('Hiking')).toHaveLength(4);
    expect(coversFor('unknown')).toHaveLength(4);
    for (const c of ALL_COVERS) {
      expect(contrast(c.ink, c.from), c.id).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.ink, c.to), c.id).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('organizer calendar', () => {
  it('builds a subscribable feed with «παρέα σχηματίζεται»', () => {
    const ics = buildOrganizerIcs({ id: 'platform', name: 'Nakamas' }, mockOutingEvents, mockOutingGroups, 'https://x.test');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT6H');
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(3);
    expect(ics).toContain('Παρέα σχηματίζεται');
    expect(organizerCalendarUrl('https://x.test', 'org 1').webcal).toBe('webcal://x.test/api/calendar/organizer/org%201.ics');
  });
});

describe('ticket partner', () => {
  it('issues tickets once everyone has paid their own share', () => {
    const r = demoTicketPartner.reserve({ groupId: 'g', eventId: 'e', memberIds: ['a', 'b'], unitPrice: 9 });
    expect(settleReservation({ ...r, payments: { a: 'paid', b: 'pending' } }).status).toBe('awaiting_payments');
    expect(settleReservation({ ...r, payments: { a: 'paid', b: 'paid' } }).status).toBe('issued');
  });
});
