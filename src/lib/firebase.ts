/**
 * Firebase bootstrap — lazy init when VITE_FIREBASE_* env is set (CoFounderBay pattern).
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { appEnv } from './config/env';
import { createLogger } from './logger';

const log = createLogger('firebase');

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function resolveConfig() {
  const f = appEnv.firebase;
  if (!f.projectId || !f.apiKey) return null;
  return {
    projectId: f.projectId,
    appId: f.appId,
    apiKey: f.apiKey,
    authDomain: f.authDomain,
    storageBucket: f.storageBucket,
    messagingSenderId: f.messagingSenderId,
    measurementId: f.measurementId,
  };
}

export function isFirebaseConfigured(): boolean {
  return Boolean(appEnv.firebase.projectId && appEnv.firebase.apiKey);
}

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  if (!auth) {
    if (!app) app = initializeApp(resolveConfig()!);
    auth = getAuth(app);
  }
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (!db) {
    if (!app) app = initializeApp(resolveConfig()!);
    const dbId = appEnv.firebase.firestoreDatabaseId;
    db = dbId ? getFirestore(app, dbId) : getFirestore(app);
    log.info('Firestore initialized', { projectId: appEnv.firebase.projectId });
  }
  return db;
}
