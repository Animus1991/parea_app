import { io, Socket } from 'socket.io-client';
import { appEnv } from '../config/env';

let socket: Socket | null = null;

function resolveSocketUrl(): string {
  if (appEnv.wsUrl) return appEnv.wsUrl;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function connectChatSocket(userId: string): Socket | null {
  if (typeof window === 'undefined') return null;
  const url = resolveSocketUrl();
  if (!url) return null;

  if (socket?.connected) return socket;

  socket = io(url, {
    transports: ['websocket', 'polling'],
    auth: { userId },
    autoConnect: true,
  });

  return socket;
}

export function disconnectChatSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function joinChatRoom(conversationId: string): void {
  socket?.emit('join_room', conversationId);
}

export function emitChatMessage(conversationId: string, senderId: string, body: string): void {
  socket?.emit('send_message', { conversationId, senderId, body });
}
