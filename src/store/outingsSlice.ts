/**
 * Group outings slice (Φ27) — spread into the main store. Everything here is
 * the competitive-analysis plan as behaviour: door check-in, graduated
 * consequences with appeals, waitlists and seat transfer, the vibe quiz,
 * friend invites answered without an account, «Συνάντηση πριν», group
 * tickets, organizer calendars, small outings and selfie checks.
 *
 * Rules that protect people live here, not in the UI:
 *  - only the host (or, with no host, a member) checks others in, and only
 *    members; a ticket code expires every 30 s;
 *  - absences count only if at least two people were checked in, so one
 *    person cannot mark a whole group absent;
 *  - leaving late counts only if the seat stays empty — a waitlist hand-over
 *    is free;
 *  - an upheld appeal gives the reliability points back.
 */
import type { Event, Group, User } from '../types';
import type {
  GenderIdentity,
  GroupGenderMode,
  InviteResponse,
  PlanInvite,
  Strike,
  StrikeKind,
  VibeProfile,
} from '../types/outings';
import { matchCheckInCode, parseCheckInPayload, checkInCode, checkInWindow } from '../lib/checkIn';
import { ATTENDED_RELIABILITY, STRIKE_RELIABILITY, standingFor } from '../lib/consequences';
import { canJoinGroup as gateJoinGroup, fitsGenderMode, groupCodeFor, type JoinGate } from '../lib/outings';
import { getEventDateRange } from '../lib/eventCalendarExport';
import { activeTicketPartner, settleReservation } from '../services/ticketPartner';
import { coversFor } from '../lib/planCovers';
import { mockPlanInvites, mockStrikes } from '../data/mockOutings';

/** Check-in opens 2 h before the start and closes 6 h after it (demo mode: always open). */
export const CHECKIN_OPENS_BEFORE_MS = 2 * 3_600_000;
export const CHECKIN_CLOSES_AFTER_MS = 6 * 3_600_000;
/** Leaving a confirmed group this close to the start counts as a late cancel. */
export const LATE_CANCEL_MS = 24 * 3_600_000;

export interface CheckInResult {
  ok: boolean;
  userId?: string;
  already?: boolean;
  reason?: 'not_found' | 'not_door' | 'closed' | 'window' | 'bad_code' | 'expired' | 'wrong_group' | 'not_member';
  el: string;
  en: string;
}

export interface CloseCheckInResult {
  ok: boolean;
  arrived: number;
  noShows: number;
  el: string;
  en: string;
}

export type MiniOutingKind = 'coffee' | 'walk' | 'run' | 'drink';

export interface MiniOutingInput {
  kind: MiniOutingKind;
  title?: string;
  date: string;
  time: string;
  area: string;
  exactLocation?: string;
  size: number;
  genderMode?: GroupGenderMode;
  note?: string;
  lat?: number;
  lng?: number;
}

export interface OutingsSlice {
  strikes: Strike[];
  planInvites: PlanInvite[];
  followedOrganizerIds: string[];
  /** «Ενημέρωσέ με» for Gov.gr Wallet — interest only, nothing else is stored. */
  govWalletInterest: boolean;

  canJoinGroup: (groupId: string) => JoinGate;
  joinGroupWaitlist: (groupId: string) => boolean;
  leaveGroupWaitlist: (groupId: string) => void;
  isCheckInOpen: (groupId: string) => { open: boolean; demo: boolean; el: string; en: string };
  checkInMember: (groupId: string, input: { code?: string; payload?: string; userId?: string }) => CheckInResult;
  undoCheckIn: (groupId: string, userId: string) => void;
  closeCheckIn: (groupId: string) => CloseCheckInResult;
  recordStrike: (userId: string, kind: StrikeKind, ctx?: { groupId?: string; eventId?: string }) => string;
  appealStrike: (strikeId: string, text: string) => boolean;
  decideAppeal: (strikeId: string, accept: boolean) => void;
  setVibe: (vibe: VibeProfile | null) => void;
  setGenderIdentity: (gender: GenderIdentity | undefined) => void;
  setGroupGenderMode: (groupId: string, mode: GroupGenderMode) => boolean;
  createPlanInvite: (groupId: string, coverId?: string) => string | null;
  setPlanInviteCover: (inviteId: string, coverId: string) => void;
  respondToPlanInvite: (inviteId: string, name: string, status: InviteResponse['status']) => InviteResponse | null;
  setPreMeet: (groupId: string, venueId: string | null, minutesBefore?: number) => void;
  reserveGroupTickets: (groupId: string) => boolean;
  payTicketShare: (groupId: string) => void;
  cancelGroupTickets: (groupId: string) => void;
  toggleFollowOrganizer: (organizerId: string) => void;
  createMiniOuting: (input: MiniOutingInput) => string | null;
  completeSelfieCheck: () => void;
  setGovWalletInterest: (on: boolean) => void;
}

/** The parts of the main store this slice reads and writes. */
interface Host extends OutingsSlice {
  currentUser: User | null;
  users: User[];
  groups: Group[];
  events: Event[];
  demoMode: boolean;
  blockedUserIds: string[];
  commitmentHolds: Record<string, { eventId: string; heldAt: string; amount: number }>;
  addNotification: (n: Record<string, unknown>) => void;
  logAdminAction: (action: string, targetId?: string, note?: string) => void;
}

type SetFn = (partial: Partial<Host> | ((s: Host) => Partial<Host>)) => void;
type GetFn = () => Host;

export function outingsSeedData() {
  return {
    strikes: mockStrikes.map((s) => ({ ...s, appeal: s.appeal ? { ...s.appeal } : undefined })),
    planInvites: mockPlanInvites.map((i) => ({ ...i, responses: i.responses.map((r) => ({ ...r })) })),
    followedOrganizerIds: [] as string[],
    govWalletInterest: false,
  };
}

const now = () => Date.now();
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Change one person everywhere they live (users list + signed-in copy). */
export function patchPerson(state: Pick<Host, 'users' | 'currentUser'>, userId: string, patch: (u: User) => Partial<User>) {
  const users = state.users.map((u) => (u.id === userId ? { ...u, ...patch(u) } : u));
  const currentUser =
    state.currentUser && state.currentUser.id === userId ? { ...state.currentUser, ...patch(state.currentUser) } : state.currentUser;
  return { users, currentUser };
}

function clampScore(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Who confirms arrivals: the host, or any member when the group has no host. */
export function isDoorPerson(group: Group, userId: string | undefined): boolean {
  if (!userId) return false;
  return group.hostId ? group.hostId === userId : group.members.includes(userId);
}

export function eventStartMs(event: Event | undefined): number | null {
  if (!event) return null;
  const range = getEventDateRange(event);
  return range ? range.start.getTime() : null;
}

const MINI_DEFAULTS: Record<MiniOutingKind, { category: string; el: string; duration: string }> = {
  coffee: { category: 'Social', el: 'Καφές', duration: '1h' },
  walk: { category: 'Walking tours', el: 'Βόλτα', duration: '1h 30m' },
  run: { category: 'Sports', el: 'Τρέξιμο', duration: '1h' },
  drink: { category: 'Food & Drink', el: 'Ένα ποτό', duration: '1h 30m' },
};

export function createOutingsSlice(set: SetFn, get: GetFn): OutingsSlice {
  const notifyMe = (
    type: string,
    el: string,
    en: string,
    extra: { groupId?: string; eventId?: string; forUserId?: string } = {},
  ) =>
    get().addNotification({
      type,
      messageGr: el,
      messageEn: en,
      timeGr: 'μόλις τώρα',
      timeEn: 'just now',
      read: false,
      groupId: extra.groupId,
      eventId: extra.eventId,
      forUserId: extra.forUserId,
    });

  return {
    ...outingsSeedData(),

    canJoinGroup: (groupId) => {
      const s = get();
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return { ok: false, reason: 'cancelled', el: 'Η ομάδα δεν βρέθηκε.', en: 'Group not found.' };
      return gateJoinGroup(s.currentUser, group, { users: s.users, strikes: s.strikes, blockedUserIds: s.blockedUserIds });
    },

    joinGroupWaitlist: (groupId) => {
      const s = get();
      const me = s.currentUser;
      const group = s.groups.find((g) => g.id === groupId);
      if (!me || !group) return false;
      const gate = gateJoinGroup(me, group, { users: s.users, strikes: s.strikes, blockedUserIds: s.blockedUserIds });
      if (gate.reason !== 'full') return false;
      if ((group.waitlist ?? []).includes(me.id)) return true;
      set((st) => ({
        groups: st.groups.map((g) => (g.id === groupId ? { ...g, waitlist: [...(g.waitlist ?? []), me.id] } : g)),
      }));
      notifyMe(
        'group',
        'Μπήκες στη λίστα αναμονής. Αν κάποιος αποχωρήσει, η θέση περνά σε σένα στην ίδια τιμή.',
        'You joined the waitlist. If someone leaves, their seat passes to you at the same price.',
        { groupId, eventId: group.eventId },
      );
      return true;
    },

    leaveGroupWaitlist: (groupId) => {
      const me = get().currentUser;
      if (!me) return;
      set((st) => ({
        groups: st.groups.map((g) => (g.id === groupId ? { ...g, waitlist: (g.waitlist ?? []).filter((id) => id !== me.id) } : g)),
      }));
    },

    isCheckInOpen: (groupId) => {
      const s = get();
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return { open: false, demo: false, el: 'Η ομάδα δεν βρέθηκε.', en: 'Group not found.' };
      if (group.checkInClosedAt) return { open: false, demo: false, el: 'Το check-in έκλεισε.', en: 'Check-in is closed.' };
      if (s.demoMode) {
        return { open: true, demo: true, el: 'Demo: το check-in είναι ανοιχτό για δοκιμή.', en: 'Demo: check-in is open so you can try it.' };
      }
      const start = eventStartMs(s.events.find((e) => e.id === group.eventId));
      if (start === null) return { open: true, demo: false, el: '', en: '' };
      const t = now();
      if (t < start - CHECKIN_OPENS_BEFORE_MS) {
        return { open: false, demo: false, el: 'Το check-in ανοίγει 2 ώρες πριν την έναρξη.', en: 'Check-in opens 2 hours before the start.' };
      }
      if (t > start + CHECKIN_CLOSES_AFTER_MS) {
        return { open: false, demo: false, el: 'Το check-in έκλεισε 6 ώρες μετά την έναρξη.', en: 'Check-in closed 6 hours after the start.' };
      }
      return { open: true, demo: false, el: '', en: '' };
    },

    checkInMember: (groupId, input) => {
      const s = get();
      const me = s.currentUser;
      const group = s.groups.find((g) => g.id === groupId);
      const fail = (reason: CheckInResult['reason'], el: string, en: string): CheckInResult => ({ ok: false, reason, el, en });
      if (!me || !group) return fail('not_found', 'Η ομάδα δεν βρέθηκε.', 'Group not found.');
      if (!isDoorPerson(group, me.id)) {
        return fail('not_door', 'Το check-in το κάνει ο/η οικοδεσπότης της ομάδας.', 'The group host does the check-in.');
      }
      const open = get().isCheckInOpen(groupId);
      if (!open.open) return fail(group.checkInClosedAt ? 'closed' : 'window', open.el, open.en);

      let userId: string | null = null;
      let method: 'qr' | 'code' | 'manual' = 'manual';
      const t = now();
      if (input.payload) {
        const parsed = parseCheckInPayload(input.payload);
        if (!parsed) return fail('bad_code', 'Αυτό δεν είναι εισιτήριο Nakamas.', 'This is not a Nakamas ticket.');
        if (parsed.groupId !== groupId) return fail('wrong_group', 'Το εισιτήριο είναι για άλλη ομάδα.', 'This ticket is for another group.');
        const w = checkInWindow(t);
        const valid = [w, w - 1].some((win) => checkInCode(groupId, parsed.userId, win) === parsed.code);
        if (!valid) {
          return fail('expired', 'Ο κωδικός έληξε. Ζήτα να ανοίξει ξανά την οθόνη του εισιτηρίου.', 'The code expired. Ask them to reopen their ticket screen.');
        }
        userId = parsed.userId;
        method = 'qr';
      } else if (input.code) {
        userId = matchCheckInCode(groupId, group.members, input.code, t);
        method = 'code';
        if (!userId) return fail('bad_code', 'Ο κωδικός δεν ταιριάζει με κανένα μέλος ή έληξε.', 'The code matches no member, or it expired.');
      } else if (input.userId) {
        userId = input.userId;
        method = 'manual';
      }
      if (!userId || !group.members.includes(userId)) {
        return fail('not_member', 'Το άτομο δεν είναι μέλος της ομάδας.', 'This person is not a member of the group.');
      }
      const person = s.users.find((u) => u.id === userId);
      const firstName = (person?.name ?? '').split(' ')[0] || '';
      if (group.checkIns?.[userId]) {
        return { ok: true, already: true, userId, el: `${firstName}: ήδη μέσα.`, en: `${firstName}: already in.` };
      }
      const at = new Date(t).toISOString();
      set((st) => ({
        groups: st.groups.map((g) => {
          if (g.id !== groupId) return g;
          const checkIns = { ...(g.checkIns ?? {}), [userId!]: { at, by: me.id, method } };
          // The door person is there too.
          if (!checkIns[me.id] && g.members.includes(me.id)) checkIns[me.id] = { at, by: me.id, method: 'manual' };
          return { ...g, checkIns };
        }),
      }));
      return { ok: true, userId, el: `Καλώς ήρθες, ${firstName}!`, en: `Welcome, ${firstName}!` };
    },

    undoCheckIn: (groupId, userId) => {
      const s = get();
      const group = s.groups.find((g) => g.id === groupId);
      if (!group || !isDoorPerson(group, s.currentUser?.id) || group.checkInClosedAt) return;
      set((st) => ({
        groups: st.groups.map((g) => {
          if (g.id !== groupId || !g.checkIns?.[userId]) return g;
          const { [userId]: _removed, ...rest } = g.checkIns;
          return { ...g, checkIns: rest };
        }),
      }));
    },

    closeCheckIn: (groupId) => {
      const s = get();
      const me = s.currentUser;
      const group = s.groups.find((g) => g.id === groupId);
      if (!me || !group || !isDoorPerson(group, me.id)) {
        return { ok: false, arrived: 0, noShows: 0, el: 'Μόνο ο/η οικοδεσπότης κλείνει το check-in.', en: 'Only the host closes check-in.' };
      }
      if (group.checkInClosedAt) return { ok: false, arrived: 0, noShows: 0, el: 'Το check-in έχει ήδη κλείσει.', en: 'Check-in is already closed.' };
      const arrivedIds = group.members.filter((m) => group.checkIns?.[m]);
      const absentIds = group.members.filter((m) => !group.checkIns?.[m]);
      const counts = arrivedIds.length >= 2;
      const at = new Date().toISOString();
      let users = s.users;
      let currentUser = s.currentUser;
      for (const id of arrivedIds) {
        ({ users, currentUser } = patchPerson({ users, currentUser }, id, (u) => ({ reliabilityScore: clampScore(u.reliabilityScore + ATTENDED_RELIABILITY) })));
      }
      const newStrikes: Strike[] = [];
      if (counts) {
        for (const id of absentIds) {
          const delta = STRIKE_RELIABILITY.no_show;
          newStrikes.push({ id: newId('st'), userId: id, kind: 'no_show', at, groupId, eventId: group.eventId, reliabilityDelta: delta });
          ({ users, currentUser } = patchPerson({ users, currentUser }, id, (u) => ({ reliabilityScore: clampScore(u.reliabilityScore + delta) })));
        }
      }
      set((st) => ({
        users,
        currentUser,
        strikes: [...st.strikes, ...newStrikes],
        groups: st.groups.map((g) => (g.id === groupId ? { ...g, checkInClosedAt: at } : g)),
      }));
      if (newStrikes.some((x) => x.userId === me.id)) {
        notifyMe(
          'safety',
          'Καταγράφηκε απουσία σου. Δες τι σημαίνει και πώς κάνεις ένσταση στο Κέντρο Εμπιστοσύνης.',
          'An absence was recorded for you. See what it means and how to appeal in the Trust Center.',
          { groupId, eventId: group.eventId },
        );
      }
      // Fan-out so every arrived member (not only the host) gets the feedback loop.
      const feedbackTargets = Array.from(new Set([me.id, ...arrivedIds]));
      for (const uid of feedbackTargets) {
        notifyMe(
          'feedback',
          'Η έξοδος ολοκληρώθηκε. Πες μας πώς πήγε — βοηθά την επόμενη παρέα.',
          'The outing is done. Tell us how it went — it helps the next group.',
          { groupId, eventId: group.eventId, forUserId: uid },
        );
      }
      return counts
        ? {
            ok: true,
            arrived: arrivedIds.length,
            noShows: absentIds.length,
            el: `Ήρθαν ${arrivedIds.length}. ${absentIds.length ? `Απουσίες: ${absentIds.length} (με δυνατότητα ένστασης).` : 'Χωρίς απουσίες!'}`,
            en: `${arrivedIds.length} arrived. ${absentIds.length ? `Absences: ${absentIds.length} (they can appeal).` : 'Nobody missing!'}`,
          }
        : {
            ok: true,
            arrived: arrivedIds.length,
            noShows: 0,
            el: 'Επιβεβαιώθηκαν λιγότερα από 2 άτομα, γι’ αυτό δεν καταγράφονται απουσίες.',
            en: 'Fewer than 2 people were confirmed, so no absences are recorded.',
          };
    },

    recordStrike: (userId, kind, ctx) => {
      const delta = STRIKE_RELIABILITY[kind];
      const strike: Strike = { id: newId('st'), userId, kind, at: new Date().toISOString(), reliabilityDelta: delta, ...ctx };
      set((st) => ({
        strikes: [...st.strikes, strike],
        ...patchPerson(st, userId, (u) => ({ reliabilityScore: clampScore(u.reliabilityScore + delta) })),
      }));
      return strike.id;
    },

    appealStrike: (strikeId, text) => {
      const s = get();
      const me = s.currentUser;
      const strike = s.strikes.find((x) => x.id === strikeId);
      const clean = text.trim().slice(0, 600);
      if (!me || !strike || strike.userId !== me.id || strike.appeal || clean.length < 10) return false;
      set((st) => ({
        strikes: st.strikes.map((x) => (x.id === strikeId ? { ...x, appeal: { text: clean, at: new Date().toISOString(), status: 'pending' } } : x)),
      }));
      notifyMe('safety', 'Η ένστασή σου στάλθηκε. Θα απαντήσουμε μέσα σε 48 ώρες.', 'Your appeal was sent. We reply within 48 hours.');
      return true;
    },

    decideAppeal: (strikeId, accept) => {
      const s = get();
      const admin = s.currentUser;
      const strike = s.strikes.find((x) => x.id === strikeId);
      if (!admin?.isAdmin || !strike?.appeal || strike.appeal.status !== 'pending') return;
      const decidedAt = new Date().toISOString();
      set((st) => ({
        strikes: st.strikes.map((x) =>
          x.id === strikeId && x.appeal ? { ...x, appeal: { ...x.appeal, status: accept ? 'accepted' : 'rejected', decidedAt, decidedBy: admin.id } } : x,
        ),
        // An upheld appeal gives back exactly what was taken.
        ...(accept ? patchPerson(st, strike.userId, (u) => ({ reliabilityScore: clampScore(u.reliabilityScore - strike.reliabilityDelta) })) : {}),
      }));
      get().logAdminAction(accept ? 'appeal_accepted' : 'appeal_rejected', strike.userId, strike.kind);
      if (strike.userId === admin.id) {
        notifyMe('safety', accept ? 'Η ένστασή σου έγινε δεκτή.' : 'Η ένστασή σου δεν έγινε δεκτή.', accept ? 'Your appeal was upheld.' : 'Your appeal was not upheld.');
      }
    },

    setVibe: (vibe) => {
      const me = get().currentUser;
      if (!me) return;
      set((st) => patchPerson(st, me.id, () => ({ vibe: vibe ?? undefined })));
    },

    setGenderIdentity: (gender) => {
      const me = get().currentUser;
      if (!me) return;
      set((st) => patchPerson(st, me.id, () => ({ gender })));
    },

    setGroupGenderMode: (groupId, mode) => {
      const s = get();
      const group = s.groups.find((g) => g.id === groupId);
      if (!group || group.hostId !== s.currentUser?.id) return false;
      if (mode === 'women_nb') {
        const everyoneFits = group.members.every((id) => fitsGenderMode(s.users.find((u) => u.id === id), 'women_nb'));
        if (!everyoneFits) return false;
      }
      set((st) => ({ groups: st.groups.map((g) => (g.id === groupId ? { ...g, genderMode: mode } : g)) }));
      return true;
    },

    createPlanInvite: (groupId, coverId) => {
      const s = get();
      const me = s.currentUser;
      const group = s.groups.find((g) => g.id === groupId);
      if (!me || !group || !group.members.includes(me.id)) return null;
      const existing = s.planInvites.find((i) => i.groupId === groupId && i.hostId === me.id);
      if (existing) {
        if (coverId && coverId !== existing.coverId) get().setPlanInviteCover(existing.id, coverId);
        return existing.id;
      }
      const event = s.events.find((e) => e.id === group.eventId);
      const invite: PlanInvite = {
        id: newId('inv'),
        groupId,
        eventId: group.eventId,
        hostId: me.id,
        coverId: coverId ?? coversFor(event?.category)[0].id,
        createdAt: new Date().toISOString(),
        responses: [],
      };
      set((st) => ({ planInvites: [...st.planInvites, invite] }));
      return invite.id;
    },

    setPlanInviteCover: (inviteId, coverId) => {
      const me = get().currentUser;
      set((st) => ({
        planInvites: st.planInvites.map((i) => (i.id === inviteId && i.hostId === me?.id ? { ...i, coverId } : i)),
      }));
    },

    respondToPlanInvite: (inviteId, name, status) => {
      const clean = name.replace(/\s+/g, ' ').trim().slice(0, 40);
      const invite = get().planInvites.find((i) => i.id === inviteId);
      if (!invite || clean.length < 2) return null;
      // One answer per name: answering again updates it.
      const existing = invite.responses.find((r) => r.name.toLocaleLowerCase('el') === clean.toLocaleLowerCase('el'));
      const response: InviteResponse = { id: existing?.id ?? newId('r'), name: clean, status, at: new Date().toISOString() };
      set((st) => ({
        planInvites: st.planInvites.map((i) =>
          i.id === inviteId
            ? { ...i, responses: existing ? i.responses.map((r) => (r.id === existing.id ? response : r)) : [...i.responses, response].slice(-50) }
            : i,
        ),
      }));
      const statusEl = status === 'going' ? 'έρχεται' : status === 'maybe' ? 'ίσως' : 'όχι';
      const statusEn = status === 'going' ? 'is going' : status === 'maybe' ? 'maybe' : 'can’t make it';
      get().addNotification({
        type: 'group',
        messageGr: `Ο/Η ${clean} απάντησε στην πρόσκληση (${statusEl}).`,
        messageEn: `${clean} answered your invite (${statusEn}).`,
        timeGr: 'μόλις τώρα',
        timeEn: 'just now',
        read: false,
        groupId: invite.groupId,
        eventId: invite.eventId,
        forUserId: invite.hostId,
      });
      return response;
    },

    setPreMeet: (groupId, venueId, minutesBefore = 30) => {
      const s = get();
      const group = s.groups.find((g) => g.id === groupId);
      if (!group || !isDoorPerson(group, s.currentUser?.id)) return;
      set((st) => ({
        groups: st.groups.map((g) =>
          g.id === groupId ? { ...g, preMeet: venueId ? { venueId, minutesBefore: Math.min(90, Math.max(15, minutesBefore)) } : undefined } : g,
        ),
      }));
    },

    reserveGroupTickets: (groupId) => {
      const s = get();
      const me = s.currentUser;
      const group = s.groups.find((g) => g.id === groupId);
      const event = group ? s.events.find((e) => e.id === group.eventId) : undefined;
      if (!me || !group || !event || !isDoorPerson(group, me.id) || !event.isPaid) return false;
      if (group.tickets && group.tickets.status !== 'cancelled') return false;
      const pct = group.discountUnlocked && event.groupDiscount ? event.groupDiscount.percentage : 0;
      const unitPrice = Math.round(event.price * (1 - pct / 100) * 100) / 100;
      const tickets = activeTicketPartner().reserve({ groupId, eventId: event.id, memberIds: group.members, unitPrice });
      set((st) => ({ groups: st.groups.map((g) => (g.id === groupId ? { ...g, tickets } : g)) }));
      notifyMe(
        'group',
        'Κρατήθηκαν θέσεις για όλη την ομάδα. Ο καθένας πληρώνει το δικό του μερίδιο.',
        'Seats are held for the whole group. Everyone pays their own share.',
        { groupId, eventId: group.eventId },
      );
      return true;
    },

    payTicketShare: (groupId) => {
      const me = get().currentUser;
      if (!me) return;
      set((st) => ({
        groups: st.groups.map((g) => {
          if (g.id !== groupId || !g.tickets || g.tickets.status !== 'awaiting_payments' || !(me.id in g.tickets.payments)) return g;
          return { ...g, tickets: settleReservation({ ...g.tickets, payments: { ...g.tickets.payments, [me.id]: 'paid' } }) };
        }),
      }));
    },

    cancelGroupTickets: (groupId) => {
      const s = get();
      const group = s.groups.find((g) => g.id === groupId);
      if (!group?.tickets || !isDoorPerson(group, s.currentUser?.id) || group.tickets.status === 'issued') return;
      set((st) => ({
        groups: st.groups.map((g) => (g.id === groupId && g.tickets ? { ...g, tickets: { ...g.tickets, status: 'cancelled' } } : g)),
      }));
    },

    toggleFollowOrganizer: (organizerId) =>
      set((st) => ({
        followedOrganizerIds: st.followedOrganizerIds.includes(organizerId)
          ? st.followedOrganizerIds.filter((id) => id !== organizerId)
          : [...st.followedOrganizerIds, organizerId],
      })),

    createMiniOuting: (input) => {
      const s = get();
      const me = s.currentUser;
      if (!me) return null;
      const standing = standingFor(s.strikes, me.id);
      if (standing.level === 'paused' || standing.level === 'review') return null;
      const d = MINI_DEFAULTS[input.kind];
      const area = input.area.trim() || 'Athens';
      const eventId = `mo${Date.now()}`;
      const groupId = `g-${eventId}`;
      const genderMode: GroupGenderMode = input.genderMode === 'women_nb' && fitsGenderMode(me, 'women_nb') ? 'women_nb' : 'mixed';
      const event: Event = {
        id: eventId,
        title: (input.title?.trim() || `${d.el} · ${area.split(',')[0]}`).slice(0, 80),
        category: d.category,
        description: (input.note?.trim() || 'Μικρή έξοδος χωρίς εκδήλωση, για να γνωριστούμε.').slice(0, 300),
        date: input.date,
        time: input.time,
        duration: d.duration,
        locationArea: area,
        exactLocation: input.exactLocation?.trim() || undefined,
        lat: input.lat,
        lng: input.lng,
        isPaid: false,
        price: 0,
        organizerId: me.id,
        kind: 'mini_outing',
        safetyLevel: 'low',
        // Same trust rules as events: members need a confirmed phone.
        minTrustTierAccess: '2_confirmed',
        maxParticipants: Math.min(6, Math.max(2, input.size)),
        tags: ['mini outing', input.kind],
      };
      const group: Group = {
        id: groupId,
        eventId,
        hostId: me.id,
        members: [me.id],
        pendingMembers: [],
        targetSize: event.maxParticipants,
        status: 'pending',
        discountUnlocked: false,
        isRecruiting: true,
        recruitingNote: input.note?.trim().slice(0, 120) || undefined,
        meetingPoint: input.exactLocation?.trim() || undefined,
        genderMode,
        chatId: `chat_${groupId}`,
      } as Group;
      set((st) => ({ events: [...st.events, event], groups: [...st.groups, group] }));
      return groupId;
    },

    completeSelfieCheck: () => {
      const me = get().currentUser;
      if (!me) return;
      const today = new Date().toISOString().slice(0, 10);
      // Only the result, the method and the date are kept — never the image.
      set((st) => patchPerson(st, me.id, (u) => ({ selfieVerified: true, verifiedVia: { ...(u.verifiedVia ?? {}), selfie: today } })));
    },

    setGovWalletInterest: (on) => set({ govWalletInterest: on }),
  };
}

/**
 * Seat hand-over when someone leaves (DICE, adapted): the first person on the
 * waitlist who may join takes the seat at face value, and the group keeps its
 * discount because it stays full. Pure, so leaveGroup and tests share it.
 */
export function handOverSeat(
  group: Group,
  leaverId: string,
  ctx: { users: User[]; strikes: Strike[]; blockedUserIds: string[]; price: number },
): { group: Group; toUserId: string | null } {
  const wasFull = group.members.length >= group.targetSize;
  const members = group.members.filter((m) => m !== leaverId);
  const base: Group = { ...group, members, waitlist: (group.waitlist ?? []).filter((id) => id !== leaverId) };
  if (!wasFull || !base.waitlist?.length) return { group: base, toUserId: null };
  for (const candidateId of base.waitlist) {
    const candidate = ctx.users.find((u) => u.id === candidateId);
    const gate = gateJoinGroup(candidate, base, { users: ctx.users, strikes: ctx.strikes, blockedUserIds: [] });
    if (!gate.ok) continue;
    const payments = base.tickets?.payments;
    const tickets =
      base.tickets && payments && base.tickets.status === 'awaiting_payments'
        ? {
            ...base.tickets,
            payments: Object.fromEntries([...Object.entries(payments).filter(([id]) => id !== leaverId), [candidateId, 'pending' as const]]),
          }
        : base.tickets;
    return {
      group: {
        ...base,
        members: [...members, candidateId],
        waitlist: base.waitlist.filter((id) => id !== candidateId),
        lastTransfer: { fromUserId: leaverId, toUserId: candidateId, at: new Date().toISOString(), price: ctx.price },
        tickets,
      },
      toUserId: candidateId,
    };
  }
  return { group: base, toUserId: null };
}

/** The group's code once its discount unlocks (Partiful / Luma, adapted). */
export function withGroupCode(group: Group): Group {
  return group.discountUnlocked && !group.code ? { ...group, code: groupCodeFor(group.id) } : group;
}
