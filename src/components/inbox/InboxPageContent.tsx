import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Bell,
  Pin,
  CircleDashed,
} from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { INBOX_TYPO } from '../../lib/typographyTokens';
import { isBefore, parseISO } from 'date-fns';

type InboxTab = 'messages' | 'notifications';

export default function InboxPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const p = usePageContrast();
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const currentUser = useStore((s) => s.currentUser);
  const notifications = useStore((s) => s.notifications);

  const [activeTab, setActiveTab] = useState<InboxTab>('messages');
  const [search, setSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'active' | 'past'>('active');

  const now = new Date();

  const myGroups = useMemo(() => {
    if (!currentUser) return [];
    return groups
      .filter((g) => g.members.includes(currentUser.id))
      .map((g) => {
        const event = events.find((e) => e.id === g.eventId);
        const eventDate = event?.date ? parseISO(event.date) : null;
        const isPast = eventDate ? isBefore(eventDate, now) : false;
        return {
          group: g,
          event,
          title: event?.title ?? t('Παρέα Εκδήλωσης', 'Event Group'),
          imageUrl: event?.imageUrl,
          isPast,
          members: g.members.length,
          unread: g.id === 'g1' ? 3 : 0,
          isPinned: g.id === 'g1',
          isTyping: g.id === 'g1' && !isPast,
        };
      });
  }, [groups, events, currentUser, now, t]);

  const filteredChats = useMemo(() => {
    return myGroups.filter((c) => {
      if (c.isPast !== (chatFilter === 'past')) return false;
      if (!search.trim()) return true;
      return c.title.toLowerCase().includes(search.toLowerCase());
    });
  }, [myGroups, chatFilter, search]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col relative pb-20 md:pb-0 animate-in fade-in duration-500">
      <div className="shrink-0 mb-6">
        <h1 className={cn(INBOX_TYPO.pageTitle, p.head)}>
          {t('Μηνύματα', 'Messages')}
        </h1>
        <p className={cn(INBOX_TYPO.pageSub, 'mt-1', p.sub)}>
          {t('Συνομιλίες ομάδων & ειδοποιήσεις', 'Group conversations & notifications')}
        </p>

        <div
          className={cn(
            'mt-4 flex h-11 rounded-2xl border p-1 shadow-soft',
            p.isDark ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]' : 'bg-gray-50 border-gray-100',
          )}
        >
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={cn(
              'flex-1 rounded-xl transition-all flex items-center justify-center gap-2',
              INBOX_TYPO.tab,
              activeTab === 'messages'
                ? p.isDark
                  ? 'bg-[hsl(220_16%_22%)] text-white shadow-soft'
                  : 'bg-white text-gray-900 shadow-soft'
                : p.muted,
            )}
          >
            <MessageSquare className="w-4 h-4" /> {t('Μηνύματα', 'Messages')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex-1 rounded-xl transition-all flex items-center justify-center gap-2',
              INBOX_TYPO.tab,
              activeTab === 'notifications'
                ? p.isDark
                  ? 'bg-[hsl(220_16%_22%)] text-white shadow-soft'
                  : 'bg-white text-gray-900 shadow-soft'
                : p.muted,
            )}
          >
            <Bell className="w-4 h-4" /> {t('Ειδοποιήσεις', 'Notifications')}
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
                'w-full pl-10 pr-4 py-2.5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-soft transition-all',
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
              <div className="p-12 text-center flex flex-col items-center">
                <MessageSquare className={cn('w-10 h-10 mb-3 opacity-40', p.muted)} />
                <p className={cn('font-bold text-sm', p.head)}>
                  {t('Δεν υπάρχουν συνομιλίες', 'No conversations')}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className={cn('mt-4 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-soft', INBOX_TYPO.cta)}
                >
                  {t('Αναζήτηση Εκδηλώσεων', 'Browse Events')}
                </button>
              </div>
            ) : (
              <div className={cn('divide-y', p.isDark ? 'divide-white/5' : 'divide-gray-100')}>
                {filteredChats.map((chat) => (
                  <button
                    key={chat.group.id}
                    type="button"
                    onClick={() => navigate(`/chat/${chat.group.id}`)}
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
                      {chat.isPinned && (
                        <Pin className="absolute -top-1 -right-1 w-3.5 h-3.5 text-cyan-600 fill-cyan-600" />
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
                      {chat.isTyping ? (
                        <p className={cn('text-cyan-600 font-medium mt-0.5', INBOX_TYPO.rowPreview)}>
                          {t('κάποιος γράφει...', 'someone is typing...')}
                        </p>
                      ) : (
                        <p className={cn(INBOX_TYPO.rowPreview, 'mt-0.5', p.sub)}>
                          {t('Πατήστε για συνομιλία', 'Tap to open chat')}
                        </p>
                      )}
                    </div>
                    {chat.unread > 0 && (
                      <span className={cn('bg-[#0E8B8D] text-white min-w-[20px] h-5 flex items-center justify-center rounded-full shrink-0 shadow-soft', INBOX_TYPO.unread)}>
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
            'rounded-2xl border shadow-soft p-8 text-center flex flex-col items-center',
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
