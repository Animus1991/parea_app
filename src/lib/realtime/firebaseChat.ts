/**
 * Firebase chat adapter — onSnapshot when configured; Socket.IO fallback otherwise.
 */
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '../firebase';
import { createLogger } from '../logger';

const log = createLogger('firebaseChat');

export interface FirebaseChatMessage {
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export type FirebaseMessageHandler = (msg: FirebaseChatMessage) => void;

export function isFirebaseChatEnabled(): boolean {
  return isFirebaseConfigured();
}

export async function subscribeFirebaseRoom(
  conversationId: string,
  onMessage: FirebaseMessageHandler,
): Promise<() => void> {
  const db = getFirebaseDb();
  if (!db) return () => undefined;

  const q = query(
    collection(db, 'chatRooms', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200),
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const data = change.doc.data();
        const body = String(data.body ?? '');
        const senderId = String(data.senderId ?? '');
        if (!body || !senderId) return;
        onMessage({
          conversationId,
          senderId,
          body,
          createdAt:
            typeof data.createdAt?.toDate === 'function'
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        });
      });
    },
    (err) => log.error('chat subscription failed', { conversationId, err }),
  );

  return unsub;
}

export async function sendFirebaseMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<boolean> {
  const db = getFirebaseDb();
  if (!db) return false;
  try {
    await addDoc(collection(db, 'chatRooms', conversationId, 'messages'), {
      senderId,
      body,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    log.error('send failed', { conversationId, err });
    return false;
  }
}
