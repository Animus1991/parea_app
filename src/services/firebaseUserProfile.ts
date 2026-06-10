import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseDb } from '../lib/firebase';
import { mockUsers } from '../data/mockUsers';
import { resolveMockUserIdByEmail } from '../data/mockUserEmails';
import type { TrustTier, User } from '../types';
import { createLogger } from '../lib/logger';

const log = createLogger('firebaseUserProfile');

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
      if (!data.linkedUserId && fb.email) {
        const linked = resolveMockUserIdByEmail(fb.email);
        if (linked) {
          data.linkedUserId = linked;
          await setDoc(ref, { linkedUserId: linked, updatedAt: serverTimestamp() }, { merge: true });
          log.info('linked firebase profile to mock user', { uid: fb.uid, linkedUserId: linked });
        }
      }
      return mapToUser(fb.uid, data);
    }

    await setDoc(ref, {
      ...fallback,
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
  await setDoc(ref, { ...patch, uid, updatedAt: serverTimestamp() }, { merge: true });
}
