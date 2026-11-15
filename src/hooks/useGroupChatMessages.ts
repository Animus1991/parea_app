import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import { toChatMessage, toGroupChatMessage } from '../lib/chatMessageAdapters';

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
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GroupChatMessage[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(groupId: string, messages: GroupChatMessage[]) {
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(messages.slice(-500)));
  } catch {
    /* quota */
  }
}

/**
 * Group chat messages — prefers chatStore Conversation (P3 unified truth)
 * when one exists for the groupId; otherwise falls back to per-group localStorage
 * + seedFactory (legacy /chat pages without a popup conversation yet).
 */
export function useGroupChatMessages(
  groupId: string | undefined,
  seedFactory: () => GroupChatMessage[],
) {
  const { t } = useLanguage();
  const systemLabel = t('Σύστημα', 'System');
  const users = useStore((s) => s.users);
  const conversation = useChatStore((s) =>
    groupId ? s.conversations.find((c) => c.groupId === groupId) : undefined,
  );
  const storeMessages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const receiveMessage = useChatStore((s) => s.receiveMessage);

  const resolveName = useCallback(
    (senderId: string) => {
      if (senderId === 'system') return 'System';
      return users.find((u) => u.id === senderId)?.name ?? senderId;
    },
    [users],
  );

  const [localMessages, setLocalMessages] = useState<GroupChatMessage[]>([]);

  useEffect(() => {
    if (!groupId || conversation) return;
    const stored = readStored(groupId);
    setLocalMessages(stored ?? seedFactory());
  }, [groupId, conversation]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once per group

  useEffect(() => {
    if (!groupId || conversation || localMessages.length === 0) return;
    writeStored(groupId, localMessages);
  }, [groupId, conversation, localMessages]);

  const unifiedFromStore = useMemo(() => {
    if (!conversation) return null;
    return storeMessages
      .filter((m) => m.conversationId === conversation.id)
      .map((m) => toGroupChatMessage(m, resolveName, systemLabel));
  }, [conversation, storeMessages, resolveName, systemLabel]);

  const messages = unifiedFromStore ?? localMessages;

  const setMessages = useCallback(
    (next: GroupChatMessage[] | ((prev: GroupChatMessage[]) => GroupChatMessage[])) => {
      if (conversation) {
        // Dual-write path: callers that replace the full list (rare system bursts)
        // get appended into chatStore via receiveMessage for new ids only.
        const resolved = typeof next === 'function' ? next(unifiedFromStore ?? []) : next;
        const existingIds = new Set(
          storeMessages.filter((m) => m.conversationId === conversation.id).map((m) => m.id),
        );
        for (const msg of resolved) {
          if (existingIds.has(msg.id)) continue;
          const adapted = toChatMessage(msg, conversation.id);
          if (adapted.senderType === 'system' || adapted.type !== 'text') {
            receiveMessage(conversation.id, adapted.body, adapted.senderId, adapted.type);
          } else {
            sendMessage(conversation.id, adapted.body, adapted.senderId);
          }
        }
        return;
      }
      setLocalMessages(next);
    },
    [conversation, unifiedFromStore, storeMessages, sendMessage, receiveMessage],
  );

  const appendMessage = useCallback(
    (msg: GroupChatMessage) => {
      if (conversation) {
        const adapted = toChatMessage(msg, conversation.id);
        if (adapted.senderType === 'system' || adapted.type !== 'text') {
          receiveMessage(conversation.id, adapted.body, adapted.senderId, adapted.type);
        } else {
          sendMessage(conversation.id, adapted.body, adapted.senderId);
        }
        return;
      }
      setLocalMessages((prev) => [...prev, msg]);
    },
    [conversation, sendMessage, receiveMessage],
  );

  return { messages, setMessages, appendMessage, conversationId: conversation?.id ?? null };
}
