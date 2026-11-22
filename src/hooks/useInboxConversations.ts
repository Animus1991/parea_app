import { useMemo } from 'react';
import { useStore } from '../store';
import { useChatStore } from '../store/chatStore';
import { useLanguage } from '../lib/i18n';
import { selectInboxConversations } from '../lib/inboxConversations';

export function useInboxConversations() {
  const userId = useStore((s) => s.currentUser?.id);
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const conversations = useChatStore((s) => s.conversations);
  const { t } = useLanguage();
  const fallbackTitle = t('Nakamas Εκδήλωσης', 'Event Nakamas');
  return useMemo(() => selectInboxConversations({ userId, groups, events, conversations, fallbackTitle }),
    [userId, groups, events, conversations, fallbackTitle]);
}
