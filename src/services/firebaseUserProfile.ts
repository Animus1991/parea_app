import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFirebaseDb } from '../lib/firebase';
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
  updatedAt?: unknown;
  createdAt?: unknown;
}

function mapToUser(uid: string, data: NakamasFirestoreProfile): User {
  return {
    id: uid,
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
  return {
    uid: fb.uid,
    name: fb.displayName?.split(' ')[0] || fb.email?.split('@')[0] || 'Member',
    email: fb.email,
    photoUrl: fb.photoURL,
    city: 'Athens',
    bio: '',
    interests: ['Social'],
    trustTier: '1_explorer',
    isOrganizer: false,
  };
}

/** Fetch or create Firestore profile — maps to Nakamas User (CoFounderBay pattern). */
export async function resolveFirebaseUser(fb: FirebaseUser): Promise<User> {
  const db = getFirebaseDb();
  if (!db) {
    return mapToUser(fb.uid, buildSeedProfile(fb));
  }

  const ref = doc(db, 'profiles', fb.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return mapToUser(fb.uid, snap.data() as NakamasFirestoreProfile);
    }

    const seed = buildSeedProfile(fb);
    await setDoc(ref, {
      ...seed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    log.info('created firestore profile', { uid: fb.uid });
    return mapToUser(fb.uid, seed);
  } catch (err) {
    log.error('profile resolve failed', err);
    return mapToUser(fb.uid, buildSeedProfile(fb));
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
