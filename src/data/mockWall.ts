import type { AudienceList, WallActivity, WallPost, WallPrivacySettings } from '../types/wall';
import { DEFAULT_WALL_PRIVACY } from '../types/wall';

/**
 * Demo wall content (Φ26). Times are relative to the first load so the feed
 * reads as recent; ids are stable so saved state merges over these seeds.
 *
 * The seeds deliberately cover every audience, including posts the demo
 * user (Alex, u1) must NOT see — the unit tests assert exactly that.
 */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const mockWallPosts: WallPost[] = [
  {
    id: 'wp1',
    authorId: 'u2',
    wallOwnerId: 'u2',
    text: 'Κυριακή πρωί πεζοπορία στον Υμηττό 🥾 Χαλαρός ρυθμός, καφές στο τέλος. Ποιος έρχεται;',
    eventId: 'e29',
    audience: { base: 'connections' },
    createdAt: ago(95),
    reactions: { u3: 'like', u4: 'love' },
    comments: [
      { id: 'wc1', authorId: 'u3', text: 'Μέσα! Φέρνω και θερμός 😄', createdAt: ago(80) },
    ],
  },
  {
    id: 'wp2',
    authorId: 'u3',
    wallOwnerId: 'u3',
    text: 'Πήρα εισιτήρια για το Release Athens — Massive Attack live! Ψάχνω 2-3 άτομα για παρέα στη συναυλία.',
    eventId: 'e1',
    audience: { base: 'public' },
    createdAt: ago(240),
    reactions: { u2: 'wow' },
    comments: [],
  },
  {
    id: 'wp3',
    authorId: 'org1',
    wallOwnerId: 'org1',
    text: 'Νέα βραδιά stand-up στο Bios την Τρίτη 🎤 Οι ομάδες Nakamas έχουν 15% έκπτωση από 4 άτομα και πάνω.',
    eventId: 'e7',
    audience: { base: 'public' },
    createdAt: ago(60 * 26),
    pinned: true,
    reactions: { u1: 'cheers', u3: 'like' },
    comments: [],
  },
  {
    id: 'wp4',
    authorId: 'u4',
    wallOwnerId: 'u4',
    text: 'Η αγαπημένη μου ταράτσα για θερινό σινεμά αυτό το καλοκαίρι — καλύτερη θέα στην Ακρόπολη 🎬',
    audience: { base: 'public' },
    createdAt: ago(60 * 5),
    reactions: {},
    comments: [],
  },
  {
    // Connections-only: Alex sees it only after accepting Elena's request.
    id: 'wp5',
    authorId: 'u4',
    wallOwnerId: 'u4',
    text: 'Ψάχνω 1-2 άτομα για φωτογραφικό περίπατο στην Πλάκα το Σάββατο. Μόνο για τους Nakamas μου 📷',
    eventId: 'e13',
    audience: { base: 'connections' },
    createdAt: ago(60 * 3),
    reactions: { u2: 'like' },
    comments: [],
  },
  {
    // Specific people: only Nikos — never visible to Alex.
    id: 'wp6',
    authorId: 'u2',
    wallOwnerId: 'u2',
    text: 'Νίκο, κράτα μου θέση για το board games της Τετάρτης!',
    audience: { base: 'specific', includeIds: ['u3'] },
    createdAt: ago(50),
    reactions: {},
    comments: [],
  },
  {
    // Connections except Alex — never visible to Alex.
    id: 'wp7',
    authorId: 'u3',
    wallOwnerId: 'u3',
    text: 'Οργανώνω έκπληξη γενεθλίων — μην το πείτε πουθενά 🤫',
    audience: { base: 'connections', excludeIds: ['u1'] },
    createdAt: ago(30),
    reactions: { u2: 'haha' },
    comments: [],
  },
  {
    id: 'wp8',
    authorId: 'u1',
    wallOwnerId: 'u1',
    text: 'Ψάχνω παρέα για stand-up comedy αυτή την εβδομάδα. Κάποιος με χιούμορ και διάθεση; 😄',
    eventId: 'e7',
    audience: { base: 'connections' },
    createdAt: ago(60 * 20),
    reactions: { u2: 'like', u3: 'haha' },
    comments: [
      { id: 'wc2', authorId: 'u2', text: 'Εγώ! Στείλε μου στο chat 🙌', createdAt: ago(60 * 19) },
    ],
  },
  {
    // Written by Nikos on Alex's wall — follows Alex's "others' posts" setting.
    id: 'wp9',
    authorId: 'u3',
    wallOwnerId: 'u1',
    text: 'Χάρηκα πολύ στο θερινό σινεμά, Alex! Την επόμενη φορά διαλέγω εγώ ταινία 🍿',
    audience: { base: 'connections' },
    createdAt: ago(60 * 30),
    reactions: { u1: 'love' },
    comments: [],
  },
  {
    // Maria tags Alex: it waits for Alex's tag review before it shows on his profile.
    id: 'wp10',
    authorId: 'u2',
    wallOwnerId: 'u2',
    text: 'Τέλεια βραδιά στο θερινό σινεμά Θησείου 🎬 Επόμενη στάση: Λίμνη των Κύκνων!',
    eventId: 'e4',
    audience: { base: 'connections' },
    taggedIds: ['u1'],
    createdAt: ago(70),
    reactions: { u3: 'love' },
    comments: [],
  },
];

/** What the demo user (Alex) finds in their wall activity. */
export const mockWallActivity: WallActivity[] = [
  { id: 'wa1', recipientId: 'u1', actorId: 'u2', kind: 'tag', postId: 'wp10', excerpt: 'Τέλεια βραδιά στο θερινό σινεμά Θησείου 🎬', createdAt: ago(70), read: false },
  { id: 'wa2', recipientId: 'u1', actorId: 'u2', kind: 'comment', postId: 'wp8', excerpt: 'Εγώ! Στείλε μου στο chat 🙌', createdAt: ago(60 * 19), read: false },
  { id: 'wa3', recipientId: 'u1', actorId: 'u3', kind: 'wall_post', postId: 'wp9', excerpt: 'Χάρηκα πολύ στο θερινό σινεμά, Alex!', createdAt: ago(60 * 30), read: true },
  { id: 'wa4', recipientId: 'u1', actorId: 'u3', kind: 'reaction', postId: 'wp8', reaction: 'haha', createdAt: ago(60 * 19 + 30), read: true },
];

export const mockAudienceLists: AudienceList[] = [
  { id: 'al1', ownerId: 'u1', name: 'Κοντινοί φίλοι', memberIds: ['u2', 'u3'], createdAt: ago(60 * 24 * 30) },
];

export const mockWallPrivacy: Record<string, WallPrivacySettings> = {
  u2: {
    ...DEFAULT_WALL_PRIVACY,
    defaultAudience: { base: 'connections' },
    sections: { ...DEFAULT_WALL_PRIVACY.sections, connections: { base: 'public' } },
  },
  u3: {
    ...DEFAULT_WALL_PRIVACY,
    defaultAudience: { base: 'public' },
    // Nikos keeps his wall to himself: nobody else can post there.
    whoCanPost: { base: 'only_me' },
    whoCanComment: { base: 'public' },
  },
  u4: {
    ...DEFAULT_WALL_PRIVACY,
    sections: { ...DEFAULT_WALL_PRIVACY.sections, events: { base: 'only_me' } },
  },
  org1: {
    ...DEFAULT_WALL_PRIVACY,
    defaultAudience: { base: 'public' },
    whoCanPost: { base: 'only_me' },
    whoCanComment: { base: 'public' },
    sections: {
      about: { base: 'public' },
      interests: { base: 'public' },
      connections: { base: 'only_me' },
      events: { base: 'public' },
    },
  },
};
