/**
 * Firebase chat adapter stub — swap in when VITE_FIREBASE_* env is configured.
 * Today Socket.IO relay (server.ts) is the active transport.
 */
export interface FirebaseChatMessage {
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export type FirebaseMessageHandler = (msg: FirebaseChatMessage) => void;

export function isFirebaseChatEnabled(): boolean {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  return Boolean(projectId && apiKey);
}

/** No-op until Firebase SDK is wired; callers fall back to Socket.IO. */
export async function subscribeFirebaseRoom(
  _conversationId: string,
  _onMessage: FirebaseMessageHandler,
): Promise<() => void> {
  if (!isFirebaseChatEnabled()) {
    return () => undefined;
  }
  // Future: onSnapshot(collection(db, 'rooms', conversationId, 'messages'), ...)
  return () => undefined;
}

export async function sendFirebaseMessage(
  _conversationId: string,
  _senderId: string,
  _body: string,
): Promise<boolean> {
  if (!isFirebaseChatEnabled()) return false;
  return false;
}
