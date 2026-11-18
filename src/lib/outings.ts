/**
 * Pure helpers for group outings (Φ27): who may join, group codes, partner
 * places, composition, «ποιοι Nakamas σου πάνε», collections and metrics.
 * No store access — everything is passed in, so it is easy to test and to
 * reuse on a server.
 */
import type { Event, Group, User } from '../types';
import type { PartnerVenue, Strike } from '../types/outings';
import { partnerVenues } from '../data/partnerVenues';
import { fnv1a } from './checkIn';
import { standingBlocksJoining, standingFor } from './consequences';
import { interestLabel, sameInterest } from './interests';

type T = (el: string, en: string) => string;

/* ───────────────────────── who may join ───────────────────────── */

export interface JoinGate {
  ok: boolean;
  reason?: 'member' | 'cancelled' | 'full' | 'gender' | 'blocked' | 'standing' | 'signin';
  el: string;
  en: string;
  /** A full group still lets you queue for the next free seat. */
  canWaitlist?: boolean;
}

const yes: JoinGate = { ok: true, el: '', en: '' };

/** Women & non-binary groups: self-declared identity, set in the profile. */
export function fitsGenderMode(user: Pick<User, 'gender'> | null | undefined, mode: Group['genderMode']): boolean {
  if (!mode || mode === 'mixed') return true;
  return user?.gender === 'woman' || user?.gender === 'non_binary';
}

function connected(a: Pick<User, 'id' | 'connections'>, b: Pick<User, 'id' | 'connections'>) {
  return (a.connections ?? []).includes(b.id) || (b.connections ?? []).includes(a.id);
}

export function canJoinGroup(
  user: User | null | undefined,
  group: Group,
  ctx: { users: User[]; strikes: Strike[]; blockedUserIds: string[]; now?: number },
): JoinGate {
  if (!user) return { ok: false, reason: 'signin', el: 'Συνδέσου για να μπεις σε ομάδα.', en: 'Sign in to join a group.' };
  if (group.members.includes(user.id)) return { ok: false, reason: 'member', el: 'Είσαι ήδη μέλος.', en: 'You are already a member.' };
  if (group.status === 'cancelled') return { ok: false, reason: 'cancelled', el: 'Η ομάδα ακυρώθηκε.', en: 'This group was cancelled.' };
  if (!fitsGenderMode(user, group.genderMode)) {
    return {
      ok: false,
      reason: 'gender',
      el: 'Η ομάδα είναι μόνο για γυναίκες και μη δυαδικά άτομα. Μπορείς να το δηλώσεις στο προφίλ σου.',
      en: 'This group is for women and non-binary people only. You can set this in your profile.',
    };
  }
  const members = group.members.map((id) => ctx.users.find((u) => u.id === id)).filter((u): u is User => Boolean(u));
  const blocked = members.some(
    (m) => ctx.blockedUserIds.includes(m.id) || (m.blockedUserIds ?? []).includes(user.id) || (user.blockedUserIds ?? []).includes(m.id),
  );
  if (blocked) return { ok: false, reason: 'blocked', el: 'Δεν είναι δυνατή η συμμετοχή σε αυτή την ομάδα.', en: 'You cannot join this group.' };
  const strangers = members.some((m) => !connected(user, m));
  const standing = standingFor(ctx.strikes, user.id, ctx.now);
  if (strangers && standingBlocksJoining(standing)) {
    return { ok: false, reason: 'standing', el: standing.explainEl, en: standing.explainEn };
  }
  if (group.members.length >= group.targetSize) {
    return { ok: false, reason: 'full', el: 'Η ομάδα γέμισε. Μπες στη λίστα αναμονής για την επόμενη θέση.', en: 'The group is full. Join the waitlist for the next seat.', canWaitlist: true };
  }
  return yes;
}

/* ───────────────────────── group code ───────────────────────── */

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Stable, easy-to-read code such as «PAREA-4K7Q» (no 0/O, 1/I/L). */
export function groupCodeFor(groupId: string): string {
  let h = fnv1a(`code|${groupId}`);
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += CODE_ALPHABET[h % CODE_ALPHABET.length];
    h = Math.floor(h / CODE_ALPHABET.length) ^ fnv1a(`${groupId}|${i}`);
    h >>>= 0;
  }
  return `PAREA-${out}`;
}

/* ───────────────────────── partner places ───────────────────────── */

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Closest partner places to the event (by coordinates, else by area name). */
export function nearestPartnerVenues(event: Pick<Event, 'lat' | 'lng' | 'locationArea'>, venues: PartnerVenue[] = partnerVenues, limit = 3) {
  if (typeof event.lat === 'number' && typeof event.lng === 'number') {
    return venues
      .map((v) => ({ venue: v, km: distanceKm(event.lat!, event.lng!, v.lat, v.lng) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, limit);
  }
  const area = (event.locationArea ?? '').split(',')[0].trim().toLowerCase();
  return venues.filter((v) => v.area.toLowerCase().startsWith(area)).slice(0, limit).map((v) => ({ venue: v, km: 0 }));
}

export function venueById(id: string | undefined, venues: PartnerVenue[] = partnerVenues): PartnerVenue | undefined {
  return id ? venues.find((v) => v.id === id) : undefined;
}

/** «HH:MM» minus N minutes, for the pre-meet time. */
export function timeMinus(time: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  if (!m) return time;
  let total = Number(m[1]) * 60 + Number(m[2]) - minutes;
  total = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/* ───────────────────────── composition ───────────────────────── */

/**
 * Group at a glance (Meetup, adapted): age span, shared interests and how
 * many are verified. Only for 3+ members whose «Σχετικά» the viewer may see,
 * and only as totals — never who is what.
 */
export function groupComposition(members: User[], language: string) {
  if (members.length < 3) return null;
  const bounds = members
    .map((m) => /^(\d{2})\D+(\d{2})$/.exec(m.ageRange ?? ''))
    .filter((x): x is RegExpExecArray => Boolean(x))
    .map((x) => [Number(x[1]), Number(x[2])] as const);
  const ageSpan = bounds.length >= 3 ? `${Math.min(...bounds.map((b) => b[0]))}–${Math.max(...bounds.map((b) => b[1]))}` : null;
  const counts: { label: string; n: number }[] = [];
  for (const m of members) {
    for (const i of m.interests ?? []) {
      const hit = counts.find((c) => sameInterest(c.label, i));
      if (hit) hit.n += 1;
      else counts.push({ label: i, n: 1 });
    }
  }
  const shared = counts.filter((c) => c.n >= 2).sort((a, b) => b.n - a.n).slice(0, 3).map((c) => interestLabel(c.label, language));
  const verified = members.filter((m) => m.selfieVerified || m.idVerified).length;
  return { size: members.length, ageSpan, shared, verified };
}

/* ───────────────────────── collections ───────────────────────── */

export interface Collection {
  id: string;
  el: string;
  en: string;
  descEl: string;
  descEn: string;
  match: (e: Event, groups: Group[]) => boolean;
}

const QUIET = ['cinema', 'theater & dance', 'museums', 'exhibitions', 'book club', 'workshops', 'wellness', 'walking tours'];
const OUTDOORS = ['hiking', 'nearby escapes', 'sports', 'walking tours'];

function isWeekend(date: string): boolean {
  const d = new Date(`${date}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Groups for the event that still have room. */
export function formingGroups(e: Pick<Event, 'id'>, groups: Group[]): Group[] {
  return groups.filter((g) => g.eventId === e.id && g.status !== 'cancelled' && g.status !== 'completed' && g.members.length < g.targetSize);
}

/** Themed collections for Discover (Fever, adapted): each shows how many groups are forming. */
export const COLLECTIONS: Collection[] = [
  {
    id: 'nakamas-nights',
    el: 'Nakamas Nights',
    en: 'Nakamas Nights',
    descEl: 'Οι δικές μας βραδιές για μικρές παρέες, σε μαγαζιά-συνεργάτες.',
    descEn: 'Our own nights for small groups, at partner places.',
    match: (e) => e.series === 'nakamas_nights',
  },
  {
    id: 'first-time-solo',
    el: 'Πρώτη φορά μόνος/η',
    en: 'First time solo',
    descEl: 'Ομάδες που καλωσορίζουν νέα μέλη, με οικοδεσπότη υψηλής εμπιστοσύνης ή ανοιχτή πρόσκληση.',
    descEn: 'Groups that welcome newcomers, with a trusted host or an open invitation.',
    match: (e, groups) => formingGroups(e, groups).some((g) => g.isRecruiting || g.status === 'confirmed'),
  },
  {
    id: 'free',
    el: 'Δωρεάν',
    en: 'Free',
    descEl: 'Εκδηλώσεις χωρίς εισιτήριο.',
    descEn: 'Events with no ticket.',
    match: (e) => !e.isPaid || e.price === 0,
  },
  {
    id: 'weekend',
    el: 'Σαββατοκύριακο',
    en: 'Weekend',
    descEl: 'Ό,τι γίνεται Σάββατο και Κυριακή.',
    descEn: 'Everything on Saturdays and Sundays.',
    match: (e) => isWeekend(e.date),
  },
  {
    id: 'quiet-nights',
    el: 'Ήσυχες βραδιές',
    en: 'Quiet nights',
    descEl: 'Σινεμά, θέατρο, μουσεία, εργαστήρια — για όσους προτιμούν χαμηλούς τόνους.',
    descEn: 'Cinema, theatre, museums, workshops — for those who like it low-key.',
    match: (e) => QUIET.includes(e.category.toLowerCase()),
  },
  {
    id: 'outdoors',
    el: 'Έξω στη φύση',
    en: 'Outdoors',
    descEl: 'Πεζοπορίες, αποδράσεις και αθλήματα σε ανοιχτό χώρο.',
    descEn: 'Hikes, escapes and outdoor sports.',
    match: (e) => OUTDOORS.includes(e.category.toLowerCase()) || Boolean(e.route),
  },
];

export function collectionById(id: string | undefined): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

export function collectionEvents(c: Collection, events: Event[], groups: Group[]): Event[] {
  return events
    .filter((e) => e.status !== 'cancelled' && e.status !== 'archived' && e.kind !== 'mini_outing' && c.match(e, groups))
    .sort((a, b) => formingGroups(b, groups).length - formingGroups(a, groups).length || a.date.localeCompare(b.date));
}

/* ───────────────────────── metrics ───────────────────────── */

/**
 * Metrics from real people only (after IRL's collapse): outings that
 * happened are groups where at least two members were checked in at the
 * door; active members are verified (email + phone) and in a live group.
 */
export function outingMetrics(groups: Group[], users: User[], strikes: Strike[]) {
  const happened = groups.filter((g) => Object.keys(g.checkIns ?? {}).length >= 2);
  const closed = groups.filter((g) => g.checkInClosedAt);
  const expected = closed.reduce((n, g) => n + g.members.length, 0);
  const arrived = closed.reduce((n, g) => n + g.members.filter((m) => g.checkIns?.[m]).length, 0);
  const inLiveGroup = new Set(groups.filter((g) => g.status !== 'cancelled').flatMap((g) => g.members));
  const verifiedActive = users.filter((u) => !u.isOrganizer && u.emailVerified && u.phoneVerified && inLiveGroup.has(u.id)).length;
  const pendingAppeals = strikes.filter((s) => s.appeal?.status === 'pending').length;
  return {
    outingsHappened: happened.length,
    showRate: expected > 0 ? Math.round((arrived / expected) * 100) : null,
    verifiedActive,
    pendingAppeals,
  };
}

/** One word for a group's status, used on cards and «Η βραδιά μας». */
export function groupStatusLabel(group: Group, t: T): string {
  if (group.status === 'cancelled') return t('Ακυρώθηκε', 'Cancelled');
  if (group.status === 'completed') return t('Ολοκληρώθηκε', 'Completed');
  if (group.status === 'confirmed') return t('Η παρέα είναι έτοιμη', 'Your group is ready');
  return t('Σχηματίζεται', 'Forming');
}

/** «Παρ 27 Νοε» — short, local, for cards and invites. */
export function formatOutingDate(date: string, language: string): string {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
