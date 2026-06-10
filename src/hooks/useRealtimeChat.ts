import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
} from '../lib/realtime/socket';
import { isFirebaseChatEnabled, subscribeFirebaseRoom } from '../lib/realtime/firebaseChat';
/**
 * Mount once when authenticated — bridges Socket.IO to chatStore (CofounderBay pattern).
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
      if (!isFirebaseChatEnabled()) return;
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

    void setupFirebase();

    const socket = connectChatSocket(userId);
    if (!socket) {
      return () => {
        cancelled = true;
        firebaseUnsubs.current.forEach((fn) => fn());
        firebaseUnsubs.current = [];
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
      firebaseUnsubs.current.forEach((fn) => fn());
      firebaseUnsubs.current = [];
    };
  }, [userId, receiveMessage, conversations.length]);
}