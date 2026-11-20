import React, { useState, useMemo } from 'react';
import { Bell, Calendar, MessageCircle, Users, CheckCircle2, Trash2, BellOff, PartyPopper, Shield, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import type { AppNotification } from '../../data/mockNotifications';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { EmptyState } from '../common/EmptyState';
import { ListViewSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useNotificationsResource } from '../../hooks/useEventsQuery';
import { usePageContrast } from '../../hooks/usePageContrast';
import { toast } from 'sonner';
import { APP_TYPO } from '../../lib/typographyTokens';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { useWallStore } from '../../store/wallStore';
import { notificationsForUser } from '../../lib/notificationsUtil';
import { type NotificationDigestWindow } from '../../lib/notificationDigest';
import { useHomePendingFeedback } from '../../hooks/useHomePendingFeedback';
import { WallActivityPanel } from '../wall/WallActivityPanel';

type TabFilter = 'all' | 'unread' | 'matches' | 'messages' | 'system';

const iconMap: Record<string, React.ElementType> = {
  match: Users,
  message: MessageCircle,
  reminder: Calendar,
  system: CheckCircle2,
  achievement: CheckCircle2,
  buddy_seek: Users,
  group: PartyPopper,
  safety: Shield,
  feedback: Star,
};

function notifMessage(notif: AppNotification, t: (el: string, en: string) => string) {
  return t(notif.messageGr ?? '', notif.messageEn ?? '');
}

function notifTime(notif: AppNotification, t: (el: string, en: string) => string) {
  return t(notif.timeGr ?? '', notif.timeEn ?? '');
}

export default function NotificationsPageContent() {
  const { t, tu } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const { notifications: rawNotifications, isLoading, isError, refetch } = useNotificationsResource();
  const pendingFeedbackEvent = useHomePendingFeedback();
  const currentUserId = useStore((s) => s.currentUser?.id ?? null);
  const notifications = useMemo(
    () => notificationsForUser(rawNotifications, currentUserId),
    [rawNotifications, currentUserId],
  );
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const socialOn = useStore((s) => s.userSettings.notificationPrefs.social !== false);
  const digest = useStore((s) => s.userSettings.notificationPrefs.digest ?? 'morning');
  const updateUserSettings = useStore((s) => s.updateUserSettings);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const dismissNotification = useStore((s) => s.dismissNotification);
  const addNotification = useStore((s) => s.addNotification);
  const markWallActivityRead = useWallStore((s) => s.markActivityRead);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: t('Όλα', 'All') },
    { key: 'unread', label: t('Μη αναγνωσμένα', 'Unread') },
    { key: 'matches', label: t('Ταιριάσματα', 'Matches') },
    { key: 'messages', label: t('Μηνύματα', 'Messages') },
    { key: 'system', label: t('Σύστημα', 'System') },
  ];

  const visibleNotifs = useMemo(() => {
    let filtered = [...notifications];
    if (activeTab === 'unread') filtered = filtered.filter((n) => !n.read);
    else if (activeTab === 'matches')
      filtered = filtered.filter(
        (n) =>
          n.type === 'match' ||
          n.type === 'achievement' ||
          n.type === 'buddy_seek' ||
          n.type === 'group' ||
          n.type === 'feedback',
      );
    else if (activeTab === 'messages') filtered = filtered.filter((n) => n.type === 'message');
    else if (activeTab === 'system')
      filtered = filtered.filter((n) => n.type === 'system' || n.type === 'reminder' || n.type === 'safety');
    const pendingId = pendingFeedbackEvent?.id;
    if (!pendingId) return filtered;
    return filtered.slice().sort((a, b) => {
      const ap = a.type === 'feedback' && a.eventId === pendingId ? 0 : 1;
      const bp = b.type === 'feedback' && b.eventId === pendingId ? 0 : 1;
      return ap - bp;
    });
  }, [notifications, activeTab, pendingFeedbackEvent?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const todayNotifs = visibleNotifs.filter((n) => !n.read);
  const earlierNotifs = visibleNotifs.filter((n) => n.read);

  const setDigest = (next: NotificationDigestWindow) => {
    updateUserSettings({
      notificationPrefs: {
        ...useStore.getState().userSettings.notificationPrefs,
        digest: next,
      },
    });
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    markWallActivityRead();
  };

  const handleDismiss = (id: string) => {
    const snapshot = notifications.find((n) => n.id === id);
    dismissNotification(id);
    toast.info(t('Η ειδοποίηση αποκρύφθηκε', 'Notification dismissed'), {
      action: {
        label: t('Αναίρεση', 'Undo'),
        onClick: () => {
          if (snapshot) addNotification({ ...(snapshot as AppNotification & Record<string, unknown>) });
        },
      },
    });
  };

  const pathForNotif = (notif: AppNotification) => {
    // Match with a real group deep-links Our night; otherwise My plans.
    if (notif.type === 'match') return notif.groupId ? `/night/${notif.groupId}` : '/plans';
    // Event invites (and similar reminders) prefer night → event → plans.
    if (notif.type === 'reminder') {
      if (notif.groupId) return `/night/${notif.groupId}`;
      if (notif.eventId) return `/events/${notif.eventId}`;
      return '/plans';
    }
    // Group-scoped messages (announcements) belong on Our night, not the DMs inbox.
    if (notif.type === 'message') return notif.groupId ? `/night/${notif.groupId}` : '/chats';
    if (notif.type === 'achievement') return '/achievements';
    if (notif.type === 'buddy_seek') return notif.groupId ? `/night/${notif.groupId}` : '/buddy-seek';
    // Cancelled-event rows clear groupId so leavers land on plans, not a locked night.
    if (notif.type === 'group') return notif.groupId ? `/night/${notif.groupId}` : '/plans';
    // SOS / safety shield with a group → group chat map; else Trust Center.
    if (notif.type === 'safety') return notif.groupId ? `/chat/${notif.groupId}` : '/trust';
    // Incoming connection *requests* → Connections; accept/wall loops → Wall; else trust.
    if (notif.type === 'system') {
      const requestish =
        /αίτημα σύνδεσης|connection request/i.test(notif.messageGr ?? '') ||
        /connection request/i.test(notif.messageEn ?? '');
      if (requestish) return '/connections';
      const wallish =
        /τοίχο|wall|σύνδεση|connection/i.test(notif.messageGr ?? '') ||
        /wall|connection/i.test(notif.messageEn ?? '');
      return wallish ? '/wall' : '/trust';
    }
    if (notif.type === 'feedback') return notif.eventId ? `/history/feedback/${notif.eventId}` : '/history';
    return '/notifications';
  };

  const handleNotifClick = (notif: AppNotification) => {
    if (!notif.read) markNotificationRead(notif.id);
    navigate(pathForNotif(notif));
  };

  const getIconColor = (type: string, read: boolean, color?: string) => {
    if (color && !read) return color;
    if (read && a.isDark) return 'bg-gray-700/30 text-gray-500';
    if (read) return 'bg-gray-100 text-gray-500';
    switch (type) {
      case 'match':
        return 'bg-emerald-100 text-emerald-600';
      case 'buddy_seek':
        return 'bg-cyan-100 text-cyan-700';
      case 'message':
        return a.isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-600';
      case 'achievement':
        return 'bg-purple-100 text-purple-600';
      case 'reminder':
        return a.isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600';
      case 'group':
        return a.isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-700';
      case 'safety':
        return a.isDark ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-100 text-rose-600';
      case 'feedback':
        return a.isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600';
      default:
        return a.isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100 text-gray-600';
    }
  };

  const renderNotifRow = (notif: AppNotification, isUnread: boolean) => {
    const Icon = iconMap[notif.type] || Bell;
    const isPendingFeedback =
      notif.type === 'feedback' && Boolean(pendingFeedbackEvent) && notif.eventId === pendingFeedbackEvent?.id;
    const iconColor = notif.color && isUnread ? notif.color : getIconColor(notif.type, !isUnread, notif.color);

    return (
      <article
        key={notif.id}
        className={cn(
          'flex gap-3.5 p-3.5 rounded-xl border transition-all group',
          isUnread ? a.unreadBg : a.readBg,
          isPendingFeedback &&
            (a.isDark
              ? 'border-amber-400/80 bg-amber-950/45 ring-1 ring-amber-400/30'
              : 'border-amber-400 bg-amber-50 ring-1 ring-amber-300/70'),
          'hover:shadow-soft',
        )}
      >
        <button
          type="button"
          onClick={() => handleNotifClick(notif)}
          className="flex flex-1 min-w-0 gap-3.5 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
              isPendingFeedback
                ? a.isDark
                  ? 'bg-amber-900/50 text-amber-300'
                  : 'bg-amber-200 text-amber-800'
                : iconColor,
            )}
          >
            <Icon className="w-4 h-4" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            {isPendingFeedback && (
              <span
                className={cn(
                  'text-2xs font-bold tracking-wide mb-1 block',
                  a.isDark ? 'text-amber-300' : 'text-amber-800',
                )}
              >
                {t('Εκκρεμής αξιολόγηση', 'Pending review')}
              </span>
            )}
            <p
              className={cn(
                'text-sm leading-relaxed',
                isUnread || isPendingFeedback ? cn('font-medium', a.head) : a.sub,
              )}
            >
              {notifMessage(notif, t)}
            </p>
            <span className={cn('text-2xs font-bold tracking-wide mt-1 block', a.muted)}>
              {notifTime(notif, t)}
            </span>
            {isPendingFeedback && (
              <span
                className={cn(
                  'mt-2 inline-flex items-center rounded-full px-3 min-h-8 text-xs font-bold',
                  a.isDark ? 'bg-amber-300 text-amber-950' : 'bg-amber-800 text-white',
                )}
              >
                {t('Αξιολόγηση', 'Rate')}
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0 self-start">
          {isUnread && <span className={cn('w-2 h-2 rounded-full', a.dot)} aria-hidden />}
          {!isPendingFeedback && (
            <button
              type="button"
              onClick={() => handleDismiss(notif.id)}
              className={cn(
                'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 p-1.5 min-h-9 min-w-9 flex items-center justify-center rounded-lg transition-all',
                a.isDark ? 'hover:bg-gray-700/40 text-gray-500' : 'hover:bg-gray-100 text-gray-400',
              )}
              title={t('Απόρριψη', 'Dismiss')}
              aria-label={t('Απόρριψη ειδοποίησης', 'Dismiss notification')}
            >
              <Trash2 className="w-3 h-3" aria-hidden />
            </button>
          )}
        </div>
      </article>
    );
  };

  usePublishPageSnapshot({
    titleEl: 'Ειδοποιήσεις',
    titleEn: 'Notifications',
    state: activeTab,
    summaryEl: `${unreadCount} μη αναγνωσμένες`,
    summaryEn: `${unreadCount} unread`,
    visibleIds: visibleNotifs.slice(0, 8).map((n) => n.id),
  });

  return (
    <div className="mx-auto max-w-full space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className={cn(APP_TYPO.pageTitle, a.head)}>
            {t('Ειδοποιήσεις', 'Notifications')}
          </h1>
          <p className={cn(APP_TYPO.pageSub, 'mt-1', a.sub)}>
            {unreadCount > 0
              ? t(`${unreadCount} μη αναγνωσμένες`, `${unreadCount} unread`)
              : t('Είστε ενημερωμένοι!', "You're all caught up!")}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className={cn('text-xs font-bold transition-colors', a.link)}
          >
            {t('Σήμανση όλων', 'Mark all read')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Σύνοψη ειδοποιήσεων', 'Notification digest')}>
        {(
          [
            ['morning', 'Πρωινή σύνοψη', 'Morning digest'],
            ['afternoon', 'Απογευματινή σύνοψη', 'Afternoon digest'],
            ['off', 'Όλες μία-μία', 'Every item'],
          ] as const
        ).map(([key, el, en]) => (
          <button
            key={key}
            type="button"
            aria-pressed={digest === key}
            onClick={() => setDigest(key)}
            className={cn(
              'filter-chip inline-flex h-[1.75rem] items-center rounded-full border px-3 text-xs font-bold leading-none',
              digest === key ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface-raised text-ink',
            )}
          >
            {t(el, en)}
          </button>
        ))}
      </div>

      {socialOn && <WallActivityPanel title={t('Δραστηριότητα τοίχου', 'Wall activity')} />}

      <div
        className="flex gap-1.5 overflow-x-auto pb-1 noscrollbar"
        role="tablist"
        aria-label={t('Φίλτρο ειδοποιήσεων', 'Notification filter')}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold border-b-2 transition-colors',
              activeTab === tab.key ? a.tabActive : a.tabInactive,
            )}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span
                className={cn(
                  'ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs text-white font-bold',
                  a.dot,
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <ResourceStateGate
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loading={<ListViewSkeleton count={4} variant="notification-row" />}
        errorTitle={t('Αδυναμία φόρτωσης ειδοποιήσεων', 'Could not load notifications')}
      >
      {visibleNotifs.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            activeTab === 'unread'
              ? t('Καμία μη αναγνωσμένη ειδοποίηση', 'No unread notifications')
              : activeTab === 'matches'
                ? t('Καμία ειδοποίηση ταιριάσματος', 'No match notifications')
                : activeTab === 'messages'
                  ? t('Καμία ειδοποίηση μηνύματος', 'No message notifications')
                  : activeTab === 'system'
                    ? t('Καμία ειδοποίηση συστήματος', 'No system notifications')
                    : t('Καμία ειδοποίηση', 'No notifications')
          }
          description={t('Θα εμφανιστούν εδώ όταν υπάρξει κάτι νέο.', "They'll show up here when there's news.")}
          actionLabel={
            activeTab !== 'all' && notifications.length > 0
              ? t('Προβολή όλων', 'Show all')
              : t('Ανακάλυψη', 'Discover')
          }
          onAction={
            activeTab !== 'all' && notifications.length > 0
              ? () => setActiveTab('all')
              : () => navigate('/')
          }
          askAi
          askPrompt={t('Τι νέο υπάρχει στις ειδοποιήσεις;', 'Summarise my notifications')}
        />
      ) : (
        <div className="space-y-4">
          {todayNotifs.length > 0 && (
            <div className="space-y-2">
              <h3 className={cn('text-xs font-bold tracking-wider ', a.muted)}>
                {tu('Νέες', 'New')} ({todayNotifs.length})
              </h3>
              {todayNotifs.map((notif) => renderNotifRow(notif, true))}
            </div>
          )}
          {earlierNotifs.length > 0 && (
            <div className="space-y-2">
              <h3 className={cn('text-xs font-bold tracking-wider ', a.muted)}>
                {tu('Προηγούμενες', 'Earlier')}
              </h3>
              {earlierNotifs.map((notif) => renderNotifRow(notif, false))}
            </div>
          )}
        </div>
      )}
      </ResourceStateGate>
    </div>
  );
}
