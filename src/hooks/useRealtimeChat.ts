import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
} from '../lib/realtime/socket';
import {
  isFirebaseChatEnabled,
  subscribeFirebaseRoom,
} from '../lib/realtime/firebaseChat';

/**
 * Mount once when authenticated — Firebase Firestore or Socket.IO (CoFounderBay dual-transport).
 */
export function useRealtimeChat(userId: string | undefined) {
  const receiveMessage = useChatStore((s) => s.receiveMessage);
  const conversations = useChatStore((s) => s.conversations);
  const firebaseUnsubs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!userId) {
      disconnectChatSocket();
      firebaseUnsubs.current.forEach((fn) => fn());
      firebaseUnsubs.current = [];
      return;
    }

    let cancelled = false;

    const setupFirebase = async () => {
      firebaseUnsubs.current.forEach((fn) => fn());
      firebaseUnsubs.current = [];
      for (const c of conversations) {
        const unsub = await subscribeFirebaseRoom(c.id, (msg) => {
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
      if (!data?.conversationId || data.senderId === userId) return;
      receiveMessage(data.conversationId, data.body, data.senderId);
    };

    socket.on('receive_message', onReceive);

    for (const c of conversations) {
      joinChatRoom(c.id);
    }

    return () => {
      cancelled = true;
      socket.off('receive_message', onReceive);
      disconnectChatSocket();
    };
  }, [userId, receiveMessage, conversations.length]);
}
