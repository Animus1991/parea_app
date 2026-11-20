// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { settleCheckIn, ticketCode, verifyTicket, TICKET_WINDOW_MS } from './outings';

const SECRET = 'test-secret-not-for-production';
const group = { id: 'g1', eventId: 'e1', memberIds: ['alice', 'bob', 'carol'] };
const now = 1_800_000_000_000;

describe('outings backend contract (Φ27)', () => {
  it('signs 6-digit codes with a secret, per group, person and 30 s window', () => {
    const c = ticketCode(SECRET, 'g1', 'bob', now);
    expect(c).toMatch(/^\d{6}$/);
    expect(ticketCode(SECRET, 'g1', 'bob', now)).toBe(c);
    expect(ticketCode('other-secret', 'g1', 'bob', now)).not.toBe(c);
    expect(ticketCode(SECRET, 'g2', 'bob', now)).not.toBe(c);
  });

  it('verifies QR payloads and typed codes, current and previous window only', () => {
    const c = ticketCode(SECRET, 'g1', 'bob', now);
    expect(verifyTicket(SECRET, group, { payload: `NKM1:g1:bob:${c}` }, now)).toEqual({ ok: true, userId: 'bob', method: 'qr' });
    expect(verifyTicket(SECRET, group, { code: c }, now + TICKET_WINDOW_MS)).toEqual({ ok: true, userId: 'bob', method: 'code' });
    expect(verifyTicket(SECRET, group, { code: c }, now + 2 * TICKET_WINDOW_MS)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyTicket(SECRET, group, { payload: `NKM1:g2:bob:${c}` }, now)).toEqual({ ok: false, reason: 'wrong_group' });
    expect(verifyTicket(SECRET, group, { payload: `NKM1:g1:eve:${c}` }, now)).toEqual({ ok: false, reason: 'not_member' });
    expect(verifyTicket(SECRET, group, { payload: 'hello' }, now)).toEqual({ ok: false, reason: 'format' });
    // A code minted with another secret (e.g. the demo's device code) is rejected.
    expect(verifyTicket(SECRET, group, { payload: `NKM1:g1:bob:${ticketCode('demo', 'g1', 'bob', now)}` }, now).ok).toBe(false);
  });

  it('settles check-in: rewards arrivals, strikes absences only with 2+ arrivals', () => {
    const rec = { at: '', by: 'alice', method: 'qr' as const };
    const two = settleCheckIn(group, { alice: rec, bob: rec }, now);
    expect(two.counted).toBe(true);
    expect(two.strikes.map((s) => s.userId)).toEqual(['carol']);
    expect(two.rewards).toEqual({ alice: 3, bob: 3, carol: -15 });
    const one = settleCheckIn(group, { alice: rec }, now);
    expect(one.counted).toBe(false);
    expect(one.strikes).toEqual([]);
    expect(one.rewards).toEqual({ alice: 3 });
  });
});
