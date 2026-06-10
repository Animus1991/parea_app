import { useCallback, useEffect, useState } from 'react';

export interface GroupChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type?: 'text' | 'system' | 'location';
}

const STORAGE_PREFIX = 'nakamas-group-chat-v1';

function storageKey(groupId: string) {
  return `${STORAGE_PREFIX}:${groupId}`;
}

function readStored(groupId: string): GroupChatMessage[] | null {
  try {
    const raw = sessionStorage.getItem(storageKey(groupId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GroupChatMessage[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(groupId: string, messages: GroupChatMessage[]) {
  try {
    sessionStorage.setItem(storageKey(groupId), JSON.stringify(messages.slice(-500)));
  } catch {
    /* quota */
  }
}

/** Session-persisted group chat messages (survives refresh within tab). */
export function useGroupChatMessages(
  groupId: string | undefined,
  seedFactory: () => GroupChatMessage[],
) {
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);

  useEffect(() => {
    if (!groupId) return;
    const stored = readStored(groupId);
    setMessages(stored ?? seedFactory());
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once per group

  useEffect(() => {
    if (!groupId || messages.length === 0) return;
    writeStored(groupId, messages);
  }, [groupId, messages]);

  const appendMessage = useCallback((msg: GroupChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  return { messages, setMessages, appendMessage };
}
