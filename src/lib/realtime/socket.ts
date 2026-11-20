import { io, Socket } from 'socket.io-client';
import { appEnv } from '../config/env';
import { getAuthToken } from '../authToken';

let socket: Socket | null = null;

function resolveSocketUrl(): string {
  // Static hosting (Cloudflare Pages) has no socket server: the build sets "off".
  if (appEnv.wsUrl === 'off') return '';
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
    // Resolved on every (re)connect so a refreshed ID token is used. The server
    // trusts the verified token; the plain userId only counts in demo mode.
    auth: (cb) => {
      void getAuthToken().then((token) => cb(token ? { userId, token } : { userId }));
    },
    autoConnect: true,
  });

  return socket;
}

export function disconnectChatSocket(): void {
  if (!socket) return;
  try {
    // Avoid noisy "WebSocket is closed before the connection is established"
    // during React Strict Mode effect teardown.
    socket.removeAllListeners();
    if (socket.connected) {
      socket.disconnect();
    } else {
      socket.close();
    }
  } catch {
    /* ignore teardown races */
  }
  socket = null;
}

export function joinChatRoom(conversationId: string): void {
  socket?.emit('join_room', conversationId);
}

export function emitChatMessage(conversationId: string, senderId: string, body: string): void {
  socket?.emit('send_message', { conversationId, senderId, body });
}
