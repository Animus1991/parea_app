import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseDb } from '../lib/firebase';
import { mockUsers } from '../data/mockUsers';
import { resolveMockUserIdByEmail } from '../data/mockUserEmails';
import type { TrustTier, User } from '../types';
import { createLogger } from '../lib/logger';

const log = createLogger('firebaseUserProfile');

/**
 * Fields only a trusted backend (Admin SDK / Cloud Function) may set. The
 * client never writes them and firestore.rules rejects them (no self-escalation).
 */
export const PRIVILEGED_PROFILE_FIELDS = ['isOrganizer', 'trustTier', 'linkedUserId', 'isAdmin', 'reliabilityScore', 'badges', 'idVerified'] as const;

/** The subset of a profile the signed-in user may write about themselves. */
export function ownerWritableProfile(p: Partial<NakamasFirestoreProfile>): Partial<NakamasFirestoreProfile> {
  const out: Partial<NakamasFirestoreProfile> = {};
  if (p.uid !== undefined) out.uid = p.uid;
  if (p.name !== undefined) out.name = p.name;
  if (p.email !== undefined) out.email = p.email;
  if (p.photoUrl !== undefined) out.photoUrl = p.photoUrl;
  if (p.city !== undefined) out.city = p.city;
  if (p.bio !== undefined) out.bio = p.bio;
  if (p.interests !== undefined) out.interests = p.interests;
  return out;
}

export interface NakamasFirestoreProfile {
  uid: string;
  name: string;
  email?: string | null;
  photoUrl?: string | null;
  city?: string;
  bio?: string;
  interests?: string[];
  trustTier?: TrustTier;
  isOrganizer?: boolean;
  /** Set only by a trusted backend; see firestore.rules. */
  isAdmin?: boolean;
  /** When email matches a demo seed account, retain mock user id for groups. */
  linkedUserId?: string | null;
  updatedAt?: unknown;
  createdAt?: unknown;
}

function mapToUser(uid: string, data: NakamasFirestoreProfile): User {
  const linkedId = data.linkedUserId ?? uid;
  const mockSeed = data.linkedUserId
    ? mockUsers.find((u) => u.id === data.linkedUserId)
    : undefined;

  if (mockSeed) {
    return {
      ...mockSeed,
      id: linkedId,
      name: data.name || mockSeed.name,
      photoUrl: data.photoUrl || mockSeed.photoUrl,
      bio: data.bio || mockSeed.bio,
      emailVerified: Boolean(data.email ?? mockSeed.emailVerified),
    };
  }

  return {
    id: linkedId,
    name: data.name || 'Member',
    ageRange: '25-34',
    city: data.city || 'Athens',
    bio: data.bio || '',
    interests: data.interests?.length ? data.interests : ['Social'],
    trustTier: data.trustTier || '1_explorer',
    reliabilityScore: 70,
    badges: ['Firebase member'],
    photoUrl: data.photoUrl || `https://i.pravatar.cc/200?u=${uid}`,
    emailVerified: Boolean(data.email),
    phoneVerified: false,
    paymentVerified: false,
    idVerified: false,
    isOrganizer: Boolean(data.isOrganizer),
    isAdmin: Boolean(data.isAdmin),
    connections: [],
  };
}

function buildSeedProfile(fb: FirebaseUser): NakamasFirestoreProfile {
  const linkedUserId = resolveMockUserIdByEmail(fb.email);
  const mockSeed = linkedUserId ? mockUsers.find((u) => u.id === linkedUserId) : undefined;

  return {
    uid: fb.uid,
    name: fb.displayName?.split(' ')[0] || mockSeed?.name || fb.email?.split('@')[0] || 'Member',
    email: fb.email,
    photoUrl: fb.photoURL || mockSeed?.photoUrl,
    city: mockSeed?.city || 'Athens',
    bio: mockSeed?.bio || '',
    interests: mockSeed?.interests?.length ? mockSeed.interests : ['Social'],
    trustTier: mockSeed?.trustTier || '1_explorer',
    isOrganizer: Boolean(mockSeed?.isOrganizer),
    linkedUserId: linkedUserId ?? null,
  };
}

/** Fetch or create Firestore profile — maps to Nakamas User (CoFounderBay pattern). */
export async function resolveFirebaseUser(fb: FirebaseUser): Promise<User> {
  const db = getFirebaseDb();
  const fallback = buildSeedProfile(fb);

  if (!db) {
    return mapToUser(fb.uid, fallback);
  }

  const ref = doc(db, 'profiles', fb.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as NakamasFirestoreProfile;
      // Demo link is derived locally from the email (never written by the client).
      if (!data.linkedUserId && fb.email) data.linkedUserId = resolveMockUserIdByEmail(fb.email) ?? null;
      return mapToUser(fb.uid, data);
    }

    await setDoc(ref, {
      ...ownerWritableProfile(fallback),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (fallback.linkedUserId) {
      log.info('created firestore profile linked to mock user', {
        uid: fb.uid,
        linkedUserId: fallback.linkedUserId,
      });
    } else {
      log.info('created firestore profile', { uid: fb.uid });
    }
    return mapToUser(fb.uid, fallback);
  } catch (err) {
    log.error('profile resolve failed', err);
    return mapToUser(fb.uid, fallback);
  }
}

export async function upsertFirebaseProfile(
  uid: string,
  patch: Partial<NakamasFirestoreProfile>,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;
  const ref = doc(db, 'profiles', uid);
  await setDoc(ref, { ...ownerWritableProfile(patch), uid, updatedAt: serverTimestamp() }, { merge: true });
}
