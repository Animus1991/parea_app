import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
} from '../lib/realtime/socket';
import { isFirebaseConfigured as isFirebaseChatEnabled } from '../lib/firebaseConfig';
import { getAuthUid } from '../lib/authToken';

/**
 * Mount once when authenticated — Firebase Firestore or Socket.IO (CoFounderBay dual-transport).
 */
export function useRealtimeChat(userId: string | undefined) {
  const receiveMessage = useChatStore((s) => s.receiveMessage);
  const conversations = useChatStore((s) => s.conversations);
  // Stable key: the effect re-runs when the set of rooms changes, not on every message.
  const conversationKey = conversations.map((c) => c.id).join('|');
  const firebaseUnsubs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!userId) {
      disconnectChatSocket();
      firebaseUnsubs.current.forEach((fn) => fn());
      firebaseUnsubs.current = [];
      return;
    }

    let cancelled = false;
    const conversationIds = conversationKey ? conversationKey.split('|') : [];

    const setupFirebase = async () => {
      firebaseUnsubs.current.forEach((fn) => fn());
      firebaseUnsubs.current = [];
      const { subscribeFirebaseRoom } = await import('../lib/realtime/firebaseChat');
      if (cancelled) return;
      for (const id of conversationIds) {
        const unsub = await subscribeFirebaseRoom(id, (msg) => {
          if (msg.senderId === userId) return;
          receiveMessage(msg.conversationId, msg.body, msg.senderId);
        });
        if (cancelled) {
          unsub();
          return;
        }
        firebaseUnsubs.current.push(unsub);
      }
    };

    if (isFirebaseChatEnabled()) {
      void setupFirebase();
      return () => {
        cancelled = true;
        firebaseUnsubs.current.forEach((fn) => fn());
        firebaseUnsubs.current = [];
      };
    }

    const socket = connectChatSocket(userId);
    if (!socket) {
      return () => {
        cancelled = true;
      };
    }

    const onReceive = (data: { conversationId: string; senderId: string; body: string }) => {
      // Own echo: the server attributes verified messages to the Firebase uid.
      if (!data?.conversationId || data.senderId === userId || data.senderId === getAuthUid()) return;
      receiveMessage(data.conversationId, data.body, data.senderId);
    };

    socket.on('receive_message', onReceive);

    for (const id of conversationIds) {
      joinChatRoom(id);
    }

    return () => {
      cancelled = true;
      socket.off('receive_message', onReceive);
      disconnectChatSocket();
    };
  }, [userId, receiveMessage, conversationKey]);
}
