/**
 * Demo data for group outings (Φ27): our own «Nakamas Nights», two small
 * outings without an event, their groups, a past check-in, one strike with a
 * pending appeal (so the admin queue is not empty) and one plan invite.
 */
import type { Event, Group, User } from '../types';
import type { PlanInvite, SeeAgainPick, Strike, VibeProfile } from '../types/outings';
import { groupCodeFor } from '../lib/outings';
import { MINI_OUTING_COVERS } from '../lib/eventCover';

/** Keep last-minute demos on the real clock, not a frozen November week. */
function dayFromNow(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const NIGHT_IMG = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop';

export const mockOutingEvents: Event[] = [
  {
    id: 'nn1',
    title: 'Nakamas Nights: Ιστορίες στο τραπέζι',
    category: 'Social',
    description:
      'Μικρά τραπέζια των 4–6 σε μπαρ-συνεργάτη στου Ψυρρή. Τρεις γύροι ερωτήσεων που σπάνε τον πάγο, χωρίς μικρόφωνο και χωρίς σκηνή. Ήρθες μόνος/η; Ακριβώς γι’ αυτό υπάρχει.',
    date: '2026-11-27',
    time: '20:30',
    duration: '2h 30m',
    locationArea: 'Psyrri, Athens',
    exactLocation: 'Μπαρ Ψυρρή, Aisopou 8 (πάνω όροφος)',
    lat: 37.9783,
    lng: 23.7239,
    isPaid: true,
    price: 12,
    groupDiscount: { minSize: 4, percentage: 15 },
    organizerId: 'platform',
    isPlatformEvent: true,
    series: 'nakamas_nights',
    safetyLevel: 'medium',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 36,
    tags: ['nakamas nights', 'social', 'small groups'],
    imageUrl: NIGHT_IMG,
  },
  {
    id: 'nn2',
    title: 'Nakamas Nights: Κρασί & ζωγραφική',
    category: 'Workshops',
    description:
      'Ήρεμη βραδιά με καβαλέτα και ελληνικές ποικιλίες κρασιού στο Κουκάκι. Υλικά και ένα ποτήρι κρασί περιλαμβάνονται. Υπάρχουν τραπέζια μεικτά και τραπέζια για γυναίκες & μη δυαδικά άτομα.',
    date: '2026-12-04',
    time: '19:30',
    duration: '2h',
    locationArea: 'Koukaki, Athens',
    exactLocation: 'Αυλή Κουκάκι, Drakou 6',
    lat: 37.9655,
    lng: 23.7243,
    isPaid: true,
    price: 18,
    groupDiscount: { minSize: 4, percentage: 10 },
    organizerId: 'platform',
    isPlatformEvent: true,
    series: 'nakamas_nights',
    safetyLevel: 'medium',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 24,
    tags: ['nakamas nights', 'workshop', 'wine'],
    imageUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop',
  },
  {
    id: 'nn3',
    title: 'Nakamas Nights: Επιτραπέζια στα Εξάρχεια',
    category: 'Board games',
    description:
      'Ομάδες των 3–5 γύρω από ένα επιτραπέζιο που εξηγεί ένας «δάσκαλος παιχνιδιού». Δεν χρειάζεται να ξέρεις κανέναν κανόνα.',
    date: '2026-12-12',
    time: '18:00',
    duration: '3h',
    locationArea: 'Exarchia, Athens',
    exactLocation: 'Κουρνιαχτός, Themistokleous 40',
    lat: 37.9866,
    lng: 23.7334,
    isPaid: false,
    price: 0,
    organizerId: 'platform',
    isPlatformEvent: true,
    series: 'nakamas_nights',
    safetyLevel: 'low',
    minTrustTierAccess: '1_explorer',
    maxParticipants: 30,
    tags: ['nakamas nights', 'board games'],
    imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&h=600&fit=crop',
  },
  {
    id: 'mo1',
    title: 'Καφές στο Κουκάκι',
    category: 'Social',
    description: 'Ένας χαλαρός καφές Σάββατο πρωί, μία ώρα, για όποιον θέλει να γνωρίσει νέο κόσμο στη γειτονιά.',
    date: dayFromNow(6),
    time: '11:00',
    duration: '1h',
    locationArea: 'Koukaki, Athens',
    exactLocation: 'Αυλή Κουκάκι, Drakou 6',
    lat: 37.9655,
    lng: 23.7243,
    isPaid: false,
    price: 0,
    organizerId: 'u2',
    kind: 'mini_outing',
    safetyLevel: 'low',
    minTrustTierAccess: '2_confirmed',
    maxParticipants: 4,
    tags: ['coffee', 'mini outing'],
    imageUrl: MINI_OUTING_COVERS.coffee,
  },
  {
    id: 'mo2',
    title: 'Τρέξιμο στο Ζάππειο (5 χλμ.)',
    category: 'Sports',
    description: 'Ήπιος ρυθμός, κανείς δεν μένει πίσω. Μόνο για γυναίκες & μη δυαδικά άτομα.',
    date: dayFromNow(1),
    time: '09:00',
    duration: '1h',
    locationArea: 'Zappeio, Athens',
    exactLocation: 'Είσοδος Ζαππείου από Βασ. Όλγας',
    lat: 37.9716,
    lng: 23.7363,
    isPaid: false,
    price: 0,
    organizerId: 'u4',
    kind: 'mini_outing',
    safetyLevel: 'low',
    minTrustTierAccess: '2_confirmed',
    maxParticipants: 5,
    tags: ['run', 'mini outing'],
    imageUrl: MINI_OUTING_COVERS.run,
  },
  {
    id: 'mo3',
    title: 'Ποτό στη Θεσσαλονίκη',
    category: 'Food & Drink',
    description: 'Ένα ποτήρι μακριά από την Αθήνα — φαίνεται μόνο αν ανοίξεις την ακτίνα.',
    date: dayFromNow(0),
    time: '20:00',
    duration: '1h 30m',
    locationArea: 'Thessaloniki',
    exactLocation: 'Ναυαρίνου 12',
    lat: 40.6329,
    lng: 22.9446,
    isPaid: false,
    price: 0,
    organizerId: 'u3',
    kind: 'mini_outing',
    safetyLevel: 'low',
    minTrustTierAccess: '2_confirmed',
    maxParticipants: 4,
    tags: ['drink', 'mini outing'],
    imageUrl: MINI_OUTING_COVERS.drink,
  },
  {
    id: 'mo4',
    title: 'Βόλτα στο Θησείο',
    category: 'Walking tours',
    description: 'Μία ώρα περπάτημα όταν σου μείνει ένα κενό σήμερα.',
    date: dayFromNow(1),
    time: '17:00',
    duration: '1h 30m',
    locationArea: 'Thisio, Athens',
    exactLocation: 'Σταθμός Θησείου, έξοδος πεζόδρομου',
    lat: 37.9765,
    lng: 23.7208,
    isPaid: false,
    price: 0,
    organizerId: 'u2',
    kind: 'mini_outing',
    safetyLevel: 'low',
    minTrustTierAccess: '2_confirmed',
    maxParticipants: 4,
    tags: ['walk', 'mini outing'],
    imageUrl: MINI_OUTING_COVERS.walk,
  },
];

export const mockOutingGroups: Group[] = [
  {
    id: 'g-nn1',
    eventId: 'nn1',
    hostId: 'u1',
    members: ['u1', 'u2', 'u3', 'u4'],
    pendingMembers: [],
    targetSize: 6,
    status: 'confirmed',
    discountUnlocked: true,
    code: groupCodeFor('g-nn1'),
    meetingPoint: 'Μπαρ Ψυρρή, Aisopou 8 — πάνω όροφος, τραπέζι «Nakamas»',
    preMeet: { venueId: 'pv_psyrri', minutesBefore: 30 },
    isRecruiting: true,
    recruitingNote: 'Δύο θέσεις ακόμη — φέρε κι έναν φίλο',
    genderMode: 'mixed',
  },
  {
    id: 'g-nn2',
    eventId: 'nn2',
    hostId: 'u2',
    members: ['u2', 'u4'],
    pendingMembers: [],
    targetSize: 4,
    status: 'pending',
    discountUnlocked: false,
    isRecruiting: true,
    recruitingNote: 'Τραπέζι για γυναίκες & μη δυαδικά άτομα',
    genderMode: 'women_nb',
  },
  {
    id: 'g-nn3',
    eventId: 'nn3',
    hostId: 'u4',
    members: ['u4', 'u1', 'u2'],
    pendingMembers: [],
    targetSize: 3,
    status: 'confirmed',
    discountUnlocked: false,
    meetingPoint: 'Κουρνιαχτός, Themistokleous 40 — τραπέζι στο βάθος',
    waitlist: ['u3'],
    genderMode: 'mixed',
  },
  {
    id: 'g-mo1',
    eventId: 'mo1',
    hostId: 'u2',
    members: ['u2', 'u3'],
    pendingMembers: [],
    targetSize: 4,
    status: 'pending',
    discountUnlocked: false,
    isRecruiting: true,
    recruitingNote: 'Ένας καφές, μία ώρα',
    genderMode: 'mixed',
  },
  {
    id: 'g-mo2',
    eventId: 'mo2',
    hostId: 'u4',
    members: ['u4'],
    pendingMembers: [],
    targetSize: 4,
    status: 'pending',
    discountUnlocked: false,
    isRecruiting: true,
    genderMode: 'women_nb',
  },
  {
    id: 'g-mo3',
    eventId: 'mo3',
    hostId: 'u3',
    members: ['u3'],
    pendingMembers: [],
    targetSize: 4,
    status: 'pending',
    discountUnlocked: false,
    isRecruiting: true,
    genderMode: 'mixed',
  },
  {
    id: 'g-mo4',
    eventId: 'mo4',
    hostId: 'u2',
    members: ['u2'],
    pendingMembers: [],
    targetSize: 4,
    status: 'pending',
    discountUnlocked: false,
    isRecruiting: true,
    genderMode: 'mixed',
  },
];

/** Past outings the demo remembers: arrivals at the door. */
export const outingGroupPatches: Record<string, Partial<Group>> = {
  'g-cal-5': {
    code: groupCodeFor('g-cal-5'),
    checkIns: {
      u1: { at: '2026-06-05T19:52:00.000Z', by: 'u2', method: 'qr' },
      u2: { at: '2026-06-05T19:55:00.000Z', by: 'u1', method: 'code' },
    },
    checkInClosedAt: '2026-06-05T20:20:00.000Z',
  },
  'g-cal-20': {
    checkIns: {
      u1: { at: '2026-05-30T18:01:00.000Z', by: 'u3', method: 'qr' },
      u2: { at: '2026-05-30T18:04:00.000Z', by: 'u3', method: 'qr' },
    },
    checkInClosedAt: '2026-05-30T18:30:00.000Z',
  },
  g2: { preMeet: { venueId: 'pv_thisio', minutesBefore: 30 }, genderMode: 'mixed' },
};

export function withOutingPatches(groups: Group[]): Group[] {
  return groups.map((g) => (outingGroupPatches[g.id] ? { ...g, ...outingGroupPatches[g.id] } : g));
}

export const mockStrikes: Strike[] = [
  {
    id: 'st_seed_u3',
    userId: 'u3',
    kind: 'no_show',
    at: '2026-06-05T20:20:00.000Z',
    groupId: 'g-cal-5',
    eventId: 'e5',
    reliabilityDelta: -15,
    appeal: {
      text: 'Είχα πυρετό εκείνο το βράδυ και έγραψα στο chat της ομάδας στις 18:40. Μπορείτε να το δείτε στο ιστορικό.',
      at: '2026-06-06T09:12:00.000Z',
      status: 'pending',
    },
  },
];

/** Others' private «Ξανά μαζί» marks (the demo's other devices). Elena would see Alex again after the cinema. */
export const mockSeeAgainPicks: SeeAgainPick[] = [
  { fromUserId: 'u4', toUserId: 'u1', eventId: 'e4', at: '2026-06-01T09:00:00.000Z' },
  { fromUserId: 'u2', toUserId: 'u1', eventId: 'e5', at: '2026-06-06T10:00:00.000Z' },
];

export const mockPlanInvites: PlanInvite[] = [
  {
    id: 'inv-nn1',
    groupId: 'g-nn1',
    eventId: 'nn1',
    hostId: 'u1',
    coverId: 'soc-teal',
    createdAt: '2026-11-14T10:00:00.000Z',
    responses: [
      { id: 'r1', name: 'Σοφία', status: 'going', at: '2026-11-14T12:30:00.000Z' },
      { id: 'r2', name: 'Γιάννης', status: 'maybe', at: '2026-11-15T08:05:00.000Z' },
    ],
  },
];

/** Self-declared identity, vibe answers and selfie checks for the demo people. */
const VIBES: Record<string, VibeProfile> = {
  u2: { pace: 2, noise: 1, talk: 3, budget: 2, lang: 'both', answeredAt: '2026-10-02T10:00:00.000Z' },
  u3: { pace: 3, noise: 3, talk: 2, budget: 2, lang: 'el', answeredAt: '2026-10-05T10:00:00.000Z' },
  u4: { pace: 2, noise: 2, talk: 2, budget: 1, lang: 'both', answeredAt: '2026-10-09T10:00:00.000Z' },
};

const PEOPLE: Record<string, Partial<User>> = {
  u2: { gender: 'woman', selfieVerified: true, verifiedVia: { email: '2026-03-02', phone: '2026-03-02', selfie: '2026-09-18' } },
  u3: { gender: 'man' },
  u4: { gender: 'woman', verifiedVia: { email: '2026-04-11', phone: '2026-04-11' } },
};

export function withOutingPeople<T extends User>(users: T[]): T[] {
  return users.map((u) => {
    const extra = PEOPLE[u.id];
    const vibe = VIBES[u.id];
    if (!extra && !vibe) return u;
    // Fill-only: what the person (or a saved copy) already has always wins.
    return { ...extra, ...(vibe ? { vibe } : {}), ...u } as T;
  });
}
