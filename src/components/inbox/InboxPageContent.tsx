import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
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
import { useFittedOpenConversation } from '../../hooks/useFittedOpenConversation';
import { EmptyState } from '../common/EmptyState';
import { cn } from '../../lib/utils';
import { INBOX_TYPO } from '../../lib/typographyTokens';
import type { Conversation } from '../../types/chat';
import { isEventPast } from '../../lib/eventDisplay';
import { PhotoOrInitials } from '../common/PhotoOrInitials';

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
  const openConversation = useFittedOpenConversation();
  const setInboxOpen = useChatStore((s) => s.setInboxOpen);
  const ensureEventGroupConversation = useChatStore((s) => s.ensureEventGroupConversation);
  const isDesktop = useMediaQuery('(min-width: 768px)');

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
        // Date and time: tonight's chat is not «past» from midnight on.
        const isPast = c.status === 'expired' || (event?.date ? isEventPast(event, now) : false);

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
        const isPast = event?.date ? isEventPast(event, now) : false;
        return {
          key: `group_${g.id}`,
          title: event?.title ?? t('Nakamas Εκδήλωσης', 'Event Nakamas'),
          imageUrl: event?.imageUrl,
          previewEl: 'Πάτα για συνομιλία',
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
    const conversation = conversations.find((c) => c.id === row.conversationId);
    const isLegacyGroup = Boolean(row.groupId) && !conversation;
    const isEventGroupThread = conversation?.type === 'event_group' || isLegacyGroup;

    // Phone: the group workspace is the full /chat/:id page. Web: same popup
    // as DMs/support — the hat inbox already opened every thread that way.
    if (row.groupId && isEventGroupThread && !isDesktop) {
      navigate(`/chat/${row.groupId}`);
      return;
    }

    if (isLegacyGroup) {
      const group = groups.find((g) => g.id === row.groupId);
      const event = events.find((e) => e.id === group?.eventId);
      if (group && event) {
        ensureEventGroupConversation({
          groupId: group.id,
          eventId: event.id,
          title: event.title,
          participantUserIds: group.members,
          meetingPoint: group.meetingPoint,
          openWindow: true,
        });
        setInboxOpen(false);
        return;
      }
    }

    setInboxOpen(false);
    openConversation(row.conversationId);
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadPreview = useMemo(
    () => notifications.filter((n) => !n.read).slice(0, 5),
    [notifications],
  );

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col relative animate-in fade-in duration-500">
      <div className="shrink-0 mb-4">
        <h1 className={cn(INBOX_TYPO.pageTitle, p.head)}>
          {t('Συνομιλίες', 'Chats')}
        </h1>
        <p className={cn(INBOX_TYPO.pageSub, 'mt-1', p.sub)}>
          {t('Συνομιλίες ομάδων & ειδοποιήσεις', 'Group conversations & notifications')}
        </p>

        <div
          role="tablist"
          aria-label={t('Μηνύματα και ειδοποιήσεις', 'Messages and notifications')}
          className={cn(
            'mt-4 flex h-9 rounded-xl border p-0.5 shadow-soft',
            p.isDark ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]' : 'bg-gray-50 border-gray-100',
          )}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            className={cn(
              'flex-1 rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-8',
              INBOX_TYPO.tab,
              activeTab === 'messages'
                ? p.isDark
                  ? 'bg-[hsl(220_16%_22%)] text-white shadow-soft'
                  : 'bg-white text-gray-900 shadow-soft'
                : p.muted,
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden /> {t('Συνομιλίες', 'Chats')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex-1 rounded-lg transition-all flex items-center justify-center gap-1.5 min-h-8',
              INBOX_TYPO.tab,
              activeTab === 'notifications'
                ? p.isDark
                  ? 'bg-[hsl(220_16%_22%)] text-white shadow-soft'
                  : 'bg-white text-gray-900 shadow-soft'
                : p.muted,
            )}
          >
            <Bell className="w-3.5 h-3.5" aria-hidden /> {t('Ειδοποιήσεις', 'Notifications')}
            {unreadNotifications > 0 && (
              <span className={cn('bg-cyan-600 text-white px-1.5 py-0.5 rounded-full min-w-[16px]', INBOX_TYPO.badge)}>
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
                character="crew"
                icon={MessageSquare}
                title={
                  search
                    ? t('Καμία συνομιλία για την αναζήτηση', 'No conversations match your search')
                    : chatFilter === 'past'
                      ? t('Δεν υπάρχουν παλαιότερες συνομιλίες', 'No past conversations')
                      : t('Δεν υπάρχουν συνομιλίες', 'No conversations')
                }
                description={!search && chatFilter !== 'past' ? t('Οι συνομιλίες ομάδας εμφανίζονται εδώ μετά από αποδοχή.', 'Group chats appear here after you accept a join.') : undefined}
                actionLabel={
                  search
                    ? t('Καθαρισμός αναζήτησης', 'Clear search')
                    : chatFilter === 'past'
                      ? t('Εμφάνιση ενεργών', 'Show active')
                      : t('Βρες Nakamas', 'Find Nakamas')
                }
                onAction={
                  search
                    ? () => setSearch('')
                    : chatFilter === 'past'
                      ? () => setChatFilter('active')
                      : () => navigate('/buddy-seek')
                }
                secondaryLabel={
                  !search && chatFilter !== 'past' ? t('Εξερεύνηση', 'Explore') : undefined
                }
                onSecondary={
                  !search && chatFilter !== 'past' ? () => navigate('/') : undefined
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
                      {/* Photo, or the first letters when there is none or it fails to load. */}
                      <div
                        className={cn(
                          'w-12 h-12 overflow-hidden rounded-full flex items-center justify-center font-bold text-base text-white',
                          chat.imageUrl && 'border-2 border-white/20',
                          p.isDark
                            ? 'bg-gradient-to-br from-cyan-600 to-blue-700'
                            : 'bg-gradient-to-br from-cyan-400 to-blue-500',
                        )}
                      >
                        <PhotoOrInitials src={chat.imageUrl} name={chat.title} />
                      </div>
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
        <div className={cn('rounded-2xl border shadow-soft overflow-hidden', p.cardSurface, p.borderB)}>
          {unreadPreview.length === 0 ? (
            <div className="p-5 text-center flex flex-col items-center">
              <CircleDashed className={cn('w-10 h-10 mb-3 opacity-40', p.muted)} />
              <h3 className={cn('font-bold text-sm mb-2', p.head)}>
                {t('Τα είδες όλα', "You're all caught up")}
              </h3>
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className={cn('mt-2 px-4 py-1.5 min-h-8 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-soft', INBOX_TYPO.cta)}
              >
                {t('Όλες οι ειδοποιήσεις', 'All Notifications')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/buddy-seek')}
                className={cn('mt-2 text-xs font-bold underline underline-offset-2', p.muted)}
              >
                {t('Βρες Nakamas', 'Find Nakamas')}
              </button>
            </div>
          ) : (
            <>
              <div className={cn('px-4 py-3 border-b flex items-center justify-between', p.borderB)}>
                <h3 className={cn('font-bold text-sm', p.head)}>
                  {t(`${unreadNotifications} νέες`, `${unreadNotifications} new`)}
                </h3>
                <button
                  type="button"
                  onClick={() => navigate('/notifications')}
                  className={cn('text-xs font-bold underline underline-offset-2', p.muted)}
                >
                  {t('Όλες', 'All')}
                </button>
              </div>
              <ul className={cn('divide-y', p.isDark ? 'divide-white/5' : 'divide-gray-100')}>
                {unreadPreview.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => navigate('/notifications')}
                      className="w-full text-left px-4 py-3 min-h-12 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <span className={cn('block text-sm font-bold line-clamp-2', p.head)}>
                        {t(n.messageGr ?? '', n.messageEn ?? '')}
                      </span>
                      <span className={cn('block text-2xs font-medium mt-0.5', p.muted)}>
                        {t(n.timeGr ?? '', n.timeEn ?? '')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
