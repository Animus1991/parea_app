import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from './index';
import { currentCheckInCode, checkInPayload } from '../lib/checkIn';
import { isLiveCatalogEvent } from '../lib/eventDisplay';

function reset() {
  useStore.getState().enterDemoMode();
  useStore.getState().exitDemoMode();
  useStore.getState().enterDemoMode();
}

describe('outings in the store (Φ27)', () => {
  beforeEach(reset);

  it('lets the host check members in by QR, code or by hand — and nobody else', () => {
    const s = useStore.getState();
    const { code } = currentCheckInCode('g-nn1', 'u2');
    const qr = s.checkInMember('g-nn1', { payload: checkInPayload('g-nn1', 'u2', code) });
    expect(qr.ok).toBe(true);
    const g = useStore.getState().groups.find((x) => x.id === 'g-nn1')!;
    expect(g.checkIns?.u2?.method).toBe('qr');
    expect(g.checkIns?.u1).toBeTruthy(); // the host is there too

    const byCode = useStore.getState().checkInMember('g-nn1', { code: currentCheckInCode('g-nn1', 'u3').code });
    expect(byCode.userId).toBe('u3');
    expect(useStore.getState().checkInMember('g-nn1', { code: '000000' }).ok).toBe(false);
    expect(useStore.getState().checkInMember('g-nn1', { payload: checkInPayload('g-nn3', 'u2', code) }).reason).toBe('wrong_group');

    // u1 is not the host of g-nn3.
    expect(useStore.getState().checkInMember('g-nn3', { userId: 'u2' }).reason).toBe('not_door');
  });

  it('closing check-in rewards arrivals and records absences without opening feedback', () => {
    const s = useStore.getState();
    s.checkInMember('g-nn1', { userId: 'u2' });
    s.checkInMember('g-nn1', { userId: 'u3' });
    const beforeU4 = useStore.getState().users.find((u) => u.id === 'u4')!.reliabilityScore;
    const res = useStore.getState().closeCheckIn('g-nn1');
    expect(res).toMatchObject({ ok: true, arrived: 3, noShows: 1 });
    const after = useStore.getState();
    expect(after.strikes.some((x) => x.userId === 'u4' && x.kind === 'no_show' && x.groupId === 'g-nn1')).toBe(true);
    expect(after.users.find((u) => u.id === 'u4')!.reliabilityScore).toBe(beforeU4 - 15);
    expect(after.getPendingFeedbackEventIds()).not.toContain('nn1');
    expect(after.notifications.filter((n) => n.type === 'feedback' && n.eventId === 'nn1')).toHaveLength(0);
    expect(after.checkInMember('g-nn1', { userId: 'u4' }).ok).toBe(false);
  });

  it('records no absences when fewer than two people were confirmed', () => {
    const res = useStore.getState().closeCheckIn('g-nn1');
    expect(res.noShows).toBe(0);
    expect(useStore.getState().strikes.filter((x) => x.groupId === 'g-nn1')).toHaveLength(0);
  });

  it('hands my seat to the waitlist when I leave a full group, without a late cancel', () => {
    useStore.getState().leaveGroup('g-nn3');
    const g = useStore.getState().groups.find((x) => x.id === 'g-nn3')!;
    expect(g.members).toContain('u3');
    expect(g.members).not.toContain('u1');
    expect(g.lastTransfer?.toUserId).toBe('u3');
    expect(useStore.getState().strikes.some((x) => x.userId === 'u1')).toBe(false);
  });

  it('reassigns hostId when the host leaves so door/check-in stay usable', () => {
    const before = useStore.getState().groups.find((x) => x.id === 'g-nn1')!;
    expect(before.hostId).toBe('u1');
    useStore.getState().leaveGroup('g-nn1');
    const after = useStore.getState().groups.find((x) => x.id === 'g-nn1')!;
    expect(after.members).not.toContain('u1');
    expect(after.hostId).toBeTruthy();
    expect(after.hostId).not.toBe('u1');
    expect(after.members).toContain(after.hostId!);
    expect(
      useStore.getState().notifications.some(
        (n) => n.forUserId === after.hostId && /νέος οικοδεσπότης|new group host/i.test(`${n.messageGr} ${n.messageEn}`),
      ),
    ).toBe(true);
  });

  it('blocks a women & non-binary group until the profile says so', () => {
    const s = useStore.getState();
    expect(s.canJoinGroup('g-nn2').reason).toBe('gender');
    s.joinGroup('g-nn2');
    expect(useStore.getState().groups.find((g) => g.id === 'g-nn2')!.members).not.toContain('u1');
    useStore.getState().setGenderIdentity('non_binary');
    useStore.getState().joinGroup('g-nn2');
    expect(useStore.getState().groups.find((g) => g.id === 'g-nn2')!.members).toContain('u1');
  });

  it('answers an invite without an account, one answer per name', () => {
    const s = useStore.getState();
    const id = s.createPlanInvite('g-nn1')!;
    expect(id).toBe('inv-nn1');
    s.respondToPlanInvite(id, 'Άννα', 'maybe');
    s.respondToPlanInvite(id, '  άννα ', 'going');
    const inv = useStore.getState().planInvites.find((i) => i.id === id)!;
    expect(inv.responses.filter((r) => r.name.toLowerCase() === 'άννα')).toHaveLength(1);
    expect(inv.responses.find((r) => r.name.toLowerCase() === 'άννα')!.status).toBe('going');
    expect(s.respondToPlanInvite(id, 'A', 'going')).toBeNull();
  });

  it('appeals are one per strike, and an upheld appeal restores the points', () => {
    const s = useStore.getState();
    const sid = s.recordStrike('u1', 'late_cancel');
    const score = useStore.getState().currentUser!.reliabilityScore;
    expect(useStore.getState().appealStrike(sid, 'short')).toBe(false);
    expect(useStore.getState().appealStrike(sid, 'Είχα επείγον οικογενειακό θέμα.')).toBe(true);
    expect(useStore.getState().appealStrike(sid, 'Δεύτερη ένσταση για το ίδιο')).toBe(false);
    // Non-admins cannot decide.
    useStore.getState().decideAppeal(sid, true);
    expect(useStore.getState().strikes.find((x) => x.id === sid)!.appeal!.status).toBe('pending');
    useStore.setState((st) => ({ currentUser: { ...st.currentUser!, isAdmin: true } }));
    useStore.getState().decideAppeal(sid, true);
    expect(useStore.getState().strikes.find((x) => x.id === sid)!.appeal!.status).toBe('accepted');
    expect(useStore.getState().currentUser!.reliabilityScore).toBe(Math.min(100, score + 8));
  });

  it('group tickets: each member pays their share, then tickets are issued', () => {
    const s = useStore.getState();
    expect(s.reserveGroupTickets('g-nn1')).toBe(true);
    const r = useStore.getState().groups.find((g) => g.id === 'g-nn1')!.tickets!;
    expect(r.unitPrice).toBeCloseTo(10.2);
    expect(Object.keys(r.payments)).toHaveLength(4);
    useStore.getState().payTicketShare('g-nn1');
    expect(useStore.getState().groups.find((g) => g.id === 'g-nn1')!.tickets!.payments.u1).toBe('paid');
  });

  it('creates a small outing with the same trust rules', () => {
    const gid = useStore.getState().createMiniOuting({ kind: 'coffee', date: '2026-12-01', time: '10:00', area: 'Pangrati, Athens', size: 3 })!;
    const st = useStore.getState();
    const g = st.groups.find((x) => x.id === gid)!;
    const e = st.events.find((x) => x.id === g.eventId)!;
    expect(e.kind).toBe('mini_outing');
    expect(e.imageUrl).toMatch(/^\/covers\//);
    expect(e.minTrustTierAccess).toBe('2_confirmed');
    expect(g.hostId).toBe('u1');
    expect(g.targetSize).toBe(3);
  });

  it('keeps only result, method and date for a selfie check; demo reset restores seeds', () => {
    useStore.getState().completeSelfieCheck();
    const me = useStore.getState().currentUser!;
    expect(me.selfieVerified).toBe(true);
    expect(me.verifiedVia?.selfie).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    useStore.getState().toggleFollowOrganizer('org1');
    useStore.getState().exitDemoMode();
    const after = useStore.getState();
    expect(after.followedOrganizerIds).toEqual([]);
    expect(after.strikes.map((x) => x.id)).toEqual(['st_seed_u3']);
    expect(after.users.find((u) => u.id === 'u1')!.selfieVerified).toBeFalsy();
  });
});

describe('«Ξανά μαζί» — mutual only (Φ28)', () => {
  beforeEach(reset);

  it('offers the people of the outing, never me or someone I blocked', () => {
    const ids = useStore.getState().seeAgainCandidates('e4').map((u) => u.id).sort();
    expect(ids).toEqual(['u2', 'u3', 'u4']);
    useStore.getState().blockUser('u3');
    expect(useStore.getState().seeAgainCandidates('e4').map((u) => u.id)).not.toContain('u3');
  });

  it('reveals only mutual marks; a mutual stranger becomes a Nakama and the pending request settles', () => {
    const before = useStore.getState().notifications.length;
    const res = useStore.getState().pickSeeAgain('e4', ['u4', 'u3', 'not-there']);
    // Elena marked Alex too (seed); Nikos did not — and is never told.
    expect(res).toEqual({ mutual: ['u4'], connected: ['u4'] });
    const st = useStore.getState();
    expect(st.users.find((u) => u.id === 'u1')!.connections).toContain('u4');
    expect(st.users.find((u) => u.id === 'u4')!.connections).toContain('u1');
    expect(st.currentUser!.connections).toContain('u4');
    expect(st.connectionRequests.find((r) => r.id === 'cr3')!.status).toBe('accepted');
    expect(st.mySeeAgainPicks('e4').sort()).toEqual(['u3', 'u4']);
    expect(st.notifications.length).toBe(before + 1);
    // Saving again does not announce the same match twice.
    useStore.getState().pickSeeAgain('e4', ['u4']);
    expect(useStore.getState().notifications.length).toBe(before + 1);
    expect(useStore.getState().mySeeAgainPicks('e4')).toEqual(['u4']);
  });

  it('a mutual mark between people already connected is a nudge, not a new connection', () => {
    const res = useStore.getState().pickSeeAgain('e5', ['u2']);
    expect(res).toEqual({ mutual: ['u2'], connected: [] });
  });

  it('rejects new groups on a cancelled outing and keeps it off the join quota', () => {
    useStore.getState().cancelEvent('mo1');
    const gate = useStore.getState().canJoinEvent('mo1');
    expect(gate.ok).toBe(false);
    expect(gate.messageEn).toMatch(/cancelled/i);
    const before = useStore.getState().groups.length;
    expect(useStore.getState().createGroup('mo1', 4)).toBeNull();
    expect(useStore.getState().groups.length).toBe(before);
    expect(useStore.getState().getPendingFeedbackEventIds()).not.toContain('mo1');
  });

  it('returns a group id and refuses a second group for the same member', () => {
    const st = useStore.getState();
    const mine = new Set(
      st.groups.filter((g) => g.status !== 'cancelled' && g.members.includes('u1')).map((g) => g.eventId),
    );
    const eventId = st.events.find((e) => isLiveCatalogEvent(e) && !mine.has(e.id))!.id;
    const id = useStore.getState().createGroup(eventId, 4);
    expect(id).toMatch(/^g/);
    expect(useStore.getState().groups.some((g) => g.id === id && g.eventId === eventId)).toBe(true);
    const before = useStore.getState().groups.length;
    expect(useStore.getState().createGroup(eventId, 5)).toBeNull();
    expect(useStore.getState().groups.length).toBe(before);
  });

  it('catalog hydrate keeps mini outings, including cancelled ones', () => {
    useStore.getState().cancelEvent('mo1');
    const catalog = useStore.getState().events.filter((e) => e.id !== 'mo1' && e.id !== 'mo2');
    useStore.getState().hydrateEventsFromApi(catalog);
    const mo1 = useStore.getState().events.find((e) => e.id === 'mo1');
    const mo2 = useStore.getState().events.find((e) => e.id === 'mo2');
    expect(mo2).toBeTruthy();
    expect(isLiveCatalogEvent(mo2!)).toBe(true);
    expect(mo1?.status).toBe('cancelled');
    expect(isLiveCatalogEvent(mo1!)).toBe(false);
  });
});
