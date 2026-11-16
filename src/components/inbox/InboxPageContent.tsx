import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Bell,
  CircleDashed,
} from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useChatStore } from '../../store/chatStore';
import { EmptyState } from '../common/EmptyState';
import { cn } from '../../lib/utils';
import { INBOX_TYPO } from '../../lib/typographyTokens';
import { isBefore, parseISO } from 'date-fns';
import type { Conversation } from '../../types/chat';

type InboxTab = 'messages' | 'notifications';

type InboxRow = {
  key: string;
  title: string;
  imageUrl?: string;
  previewEl: string;
  previewEn: string;
  unread: number;
  members: number;
  isPast: boolean;
  groupId?: string;
  conversationId: string;
};

export default function InboxPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const p = usePageContrast();
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const currentUser = useStore((s) => s.currentUser);
  const rawNotifications = useStore((s) => s.notifications);
  const notifications = rawNotifications.filter((n) => !n.forUserId || n.forUserId === currentUser?.id);
  const conversations = useChatStore((s) => s.conversations);
  const openConversation = useChatStore((s) => s.openConversation);
  const setInboxOpen = useChatStore((s) => s.setInboxOpen);

  const [activeTab, setActiveTab] = useState<InboxTab>('messages');
  const [search, setSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'active' | 'past'>('active');

  /** Page density of the same chatStore truth the popup inbox uses. */
  const inboxRows = useMemo((): InboxRow[] => {
    if (!currentUser) return [];
    const now = new Date();

    const fromConversations: InboxRow[] = conversations
      .filter(
        (c) =>
          c.status !== 'archived' &&
          (c.participantUserIds.includes(currentUser.id) || c.type === 'support'),
      )
      .map((c: Conversation) => {
        const group = c.groupId ? groups.find((g) => g.id === c.groupId) : undefined;
        const event = c.eventId
          ? events.find((e) => e.id === c.eventId)
          : group
            ? events.find((e) => e.id === group.eventId)
            : undefined;
        const eventDate = event?.date ? parseISO(event.date) : null;
        const isPast =
          c.status === 'expired' || (eventDate ? isBefore(eventDate, now) : false);

        return {
          key: c.id,
          title: c.title || event?.title || t('Συνομιλία', 'Conversation'),
          imageUrl: event?.imageUrl,
          previewEl: c.lastMessagePreview.el,
          previewEn: c.lastMessagePreview.en,
          unread: c.unreadCount,
          members: group?.members.length ?? c.participantUserIds.length,
          isPast,
          groupId: c.groupId,
          conversationId: c.id,
        };
      });

    // Legacy groups without a chatStore conversation yet (pre-bridge memberships).
    const coveredGroupIds = new Set(
      fromConversations.map((r) => r.groupId).filter(Boolean) as string[],
    );
    const legacyGroups: InboxRow[] = groups
      .filter((g) => g.members.includes(currentUser.id) && !coveredGroupIds.has(g.id))
      .map((g) => {
        const event = events.find((e) => e.id === g.eventId);
        const eventDate = event?.date ? parseISO(event.date) : null;
        const isPast = eventDate ? isBefore(eventDate, now) : false;
        return {
          key: `group_${g.id}`,
          title: event?.title ?? t('Nakamas Εκδήλωσης', 'Event Nakamas'),
          imageUrl: event?.imageUrl,
          previewEl: 'Πατήστε για συνομιλία',
          previewEn: 'Tap to open chat',
          unread: 0,
          members: g.members.length,
          isPast,
          groupId: g.id,
          conversationId: `conv_${g.id}`,
        };
      });

    return [...fromConversations, ...legacyGroups].sort(
      (a, b) => Number(b.unread > 0) - Number(a.unread > 0),
    );
  }, [conversations, groups, events, currentUser, t]);

  const filteredChats = useMemo(() => {
    return inboxRows.filter((c) => {
      if (c.isPast !== (chatFilter === 'past')) return false;
      if (!search.trim()) return true;
      return c.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [inboxRows, chatFilter, search]);

  const openRow = (row: InboxRow) => {
    if (row.groupId) {
      navigate(`/chat/${row.groupId}`);
      return;
    }
    setInboxOpen(false);
    openConversation(row.conversationId);
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col relative animate-in fade-in duration-500">
      <div className="shrink-0 mb-4">
        <h1 className={cn(INBOX_TYPO.pageTitle, p.head)}>
          {t('Μηνύματα', 'Messages')}
        </h1>
        <p className={cn(INBOX_TYPO.pageSub, 'mt-1', p.sub)}>
          {t('Συνομιλίες ομάδων & ειδοποιήσεις', 'Group conversations & notifications')}
        </p>

        <div
          role="tablist"
          aria-label={t('Μηνύματα και ειδοποιήσεις', 'Messages and notifications')}
          className={cn(
            'mt-4 flex h-11 rounded-2xl border p-1 shadow-soft',
            p.isDark ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]' : 'bg-gray-50 border-gray-100',
          )}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            className={cn(
              'flex-1 rounded-xl transition-all flex items-center justify-center gap-2 min-h-10',
              INBOX_TYPO.tab,
              activeTab === 'messages'
                ? p.isDark
                  ? 'bg-[hsl(220_16%_22%)] text-white shadow-soft'
                  : 'bg-white text-gray-900 shadow-soft'
                : p.muted,
            )}
          >
            <MessageSquare className="w-4 h-4" aria-hidden /> {t('Μηνύματα', 'Messages')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex-1 rounded-xl transition-all flex items-center justify-center gap-2 min-h-10',
              INBOX_TYPO.tab,
              activeTab === 'notifications'
                ? p.isDark
                  ? 'bg-[hsl(220_16%_22%)] text-white shadow-soft'
                  : 'bg-white text-gray-900 shadow-soft'
                : p.muted,
            )}
          >
            <Bell className="w-4 h-4" aria-hidden /> {t('Ειδοποιήσεις', 'Notifications')}
            {unreadNotifications > 0 && (
              <span className={cn('bg-cyan-600 text-white px-1.5 py-0.5 rounded-full min-w-[18px]', INBOX_TYPO.badge)}>
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'messages' && (
        <>
          <div className="relative mb-4">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', p.muted)} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Αναζήτηση συνομιλιών...', 'Search conversations...')}
              className={cn(
                'search-control w-full h-9 pl-9 pr-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-soft transition-all',
                INBOX_TYPO.search,
                p.inputBg,
                p.borderB,
              )}
            />
          </div>

          <div className="flex gap-2 mb-4">
            {(['active', 'past'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setChatFilter(key)}
                className={cn(
                  'px-4 py-1.5 rounded-full transition-all shadow-soft',
                  INBOX_TYPO.filter,
                  chatFilter === key
                    ? 'bg-cyan-600 text-white'
                    : p.isDark
                      ? 'bg-gray-800 text-gray-300 border border-gray-700'
                      : 'bg-white text-gray-600 border border-gray-100',
                )}
              >
                {key === 'active' ? t('Ενεργές', 'Active') : t('Παλαιότερες', 'Past')}
              </button>
            ))}
          </div>

          <div className={cn('rounded-2xl border shadow-soft overflow-hidden', p.cardSurface, p.borderB)}>
            {filteredChats.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={
                  search
                    ? t('Καμία συνομιλία για την αναζήτηση', 'No conversations match your search')
                    : chatFilter === 'past'
                      ? t('Δεν υπάρχουν παλαιότερες συνομιλίες', 'No past conversations')
                      : t('Δεν υπάρχουν συνομιλίες', 'No conversations')
                }
                description={
                  search
                    ? t('Δοκιμάστε άλλο όρο ή καθαρίστε την αναζήτηση.', 'Try another term or clear the search.')
                    : chatFilter === 'past'
                      ? t('Οι ολοκληρωμένες συνομιλίες εμφανίζονται εδώ.', 'Completed conversations appear here.')
                      : t(
                          'Οι συνομιλίες ομάδας εμφανίζονται εδώ μετά από αποδοχή.',
                          'Group chats appear here after you accept a join.',
                        )
                }
                actionLabel={
                  search
                    ? t('Καθαρισμός αναζήτησης', 'Clear search')
                    : chatFilter === 'past'
                      ? t('Εμφάνιση ενεργών', 'Show active')
                      : t('Αναζήτηση Εκδηλώσεων', 'Browse Events')
                }
                onAction={
                  search
                    ? () => setSearch('')
                    : chatFilter === 'past'
                      ? () => setChatFilter('active')
                      : () => navigate('/')
                }
              />
            ) : (
              <div className={cn('divide-y', p.isDark ? 'divide-white/5' : 'divide-gray-100')}>
                {filteredChats.map((chat) => (
                  <button
                    key={chat.key}
                    type="button"
                    onClick={() => openRow(chat)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 text-left transition-colors',
                      p.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50',
                    )}
                  >
                    <div className="relative shrink-0">
                      {chat.imageUrl ? (
                        <img
                          src={chat.imageUrl}
                          alt=""
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                        />
                      ) : (
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white',
                            p.isDark
                              ? 'bg-gradient-to-br from-cyan-600 to-blue-700'
                              : 'bg-gradient-to-br from-cyan-400 to-blue-500',
                          )}
                        >
                          {chat.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={cn(
                            INBOX_TYPO.rowTitle,
                            chat.unread > 0 ? 'font-bold' : 'font-medium',
                            p.head,
                          )}
                        >
                          {chat.title}
                        </h3>
                        <span className={cn(INBOX_TYPO.rowMeta, 'shrink-0', p.muted)}>
                          {chat.members} {t('μέλη', 'members')}
                        </span>
                      </div>
                      <p className={cn(INBOX_TYPO.rowPreview, 'mt-0.5', p.sub)}>
                        {t(chat.previewEl, chat.previewEn)}
                      </p>
                    </div>
                    {chat.unread > 0 && (
                      <span className={cn('bg-brand text-white min-w-[20px] h-5 flex items-center justify-center rounded-full shrink-0 shadow-soft', INBOX_TYPO.unread)}>
                        {chat.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'notifications' && (
        <div
          className={cn(
            'rounded-2xl border shadow-soft p-5 text-center flex flex-col items-center',
            p.cardSurface,
            p.borderB,
          )}
        >
          <CircleDashed className={cn('w-10 h-10 mb-3 opacity-40', p.muted)} />
          <h3 className={cn('font-bold text-sm mb-2', p.head)}>
            {unreadNotifications > 0
              ? t(`${unreadNotifications} νέες ειδοποιήσεις`, `${unreadNotifications} new notifications`)
              : t('Είστε ενημερωμένοι', "You're all caught up")}
          </h3>
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className={cn('mt-2 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-soft', INBOX_TYPO.cta)}
          >
            {t('Όλες οι Ειδοποιήσεις', 'All Notifications')}
          </button>
        </div>
      )}
    </div>
  );
}
