import React, { useState, useMemo } from 'react';
import { Bell, Calendar, MessageCircle, Users, CheckCircle2, ArrowRight, Trash2, Filter, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { Card } from '../common/Card';
import { usePageContrast } from '../../hooks/usePageContrast';

type TabFilter = 'all' | 'unread' | 'matches' | 'messages' | 'system';

const iconMap: Record<string, React.ElementType> = {
  match: Users,
  message: MessageCircle,
  reminder: Calendar,
  system: CheckCircle2,
  achievement: CheckCircle2,
};

export default function NotificationsPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: t('Όλα', 'All') },
    { key: 'unread', label: t('Μη αναγνωσμένα', 'Unread') },
    { key: 'matches', label: t('Ταιριάσματα', 'Matches') },
    { key: 'messages', label: t('Μηνύματα', 'Messages') },
    { key: 'system', label: t('Σύστημα', 'System') },
  ];

  const visibleNotifs = useMemo(() => {
    let filtered = notifications.filter((n: any) => !dismissed.has(n.id));
    if (activeTab === 'unread') filtered = filtered.filter((n: any) => !n.read);
    else if (activeTab === 'matches') filtered = filtered.filter((n: any) => n.type === 'match' || n.type === 'achievement');
    else if (activeTab === 'messages') filtered = filtered.filter((n: any) => n.type === 'message');
    else if (activeTab === 'system') filtered = filtered.filter((n: any) => n.type === 'system' || n.type === 'reminder');
    return filtered;
  }, [notifications, activeTab, dismissed]);

  const unreadCount = notifications.filter((n: any) => !n.read && !dismissed.has(n.id)).length;
  const todayNotifs = visibleNotifs.filter((n: any) => !n.read);
  const earlierNotifs = visibleNotifs.filter((n: any) => n.read);

  const handleMarkAllRead = () => {
    notifications.forEach((n: any) => { if (!n.read) markNotificationRead(n.id); });
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const handleNotifClick = (notif: any) => {
    if (!notif.read) markNotificationRead(notif.id);
    if (notif.type === 'match') navigate('/plans');
    else if (notif.type === 'message') navigate('/chats');
    else if (notif.type === 'achievement') navigate('/achievements');
    else if (notif.type === 'reminder') navigate('/plans');
  };

  const getIconColor = (type: string, read: boolean) => {
    if (read && a.isDark) return 'bg-gray-700/30 text-gray-500';
    if (read) return 'bg-gray-100 text-gray-500';
    switch (type) {
      case 'match': return 'bg-emerald-100 text-emerald-600';
      case 'message': return a.isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-100 text-cyan-600';
      case 'achievement': return 'bg-purple-100 text-purple-600';
      case 'reminder': return a.isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600';
      default: return a.isDark ? 'bg-gray-700/30 text-gray-400' : 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="mx-auto max-w-full space-y-5 pb-20 md:pb-0 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Ειδοποιήσεις', 'Notifications')}</h1>
          <p className={cn("font-medium text-sm mt-1", a.sub)}>
            {unreadCount > 0
              ? t(`${unreadCount} μη αναγνωσμένες`, `${unreadCount} unread`)
              : t('Είστε ενημερωμένοι!', 'You\'re all caught up!')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className={cn("text-sm font-bold transition-colors", a.link)}
          >
            {t('Σήμανση όλων', 'Mark all read')}
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 noscrollbar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold border-b-2 transition-colors",
              activeTab === tab.key ? a.tabActive : a.tabInactive
            )}
          >
            {tab.label}
            {tab.key === 'unread' && unreadCount > 0 && (
              <span className={cn("ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] text-white font-bold", a.dot)}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {visibleNotifs.length === 0 ? (
        <Card className="p-8 text-center">
          <BellOff className={cn("w-10 h-10 mx-auto mb-3", a.muted)} />
          <p className={cn("font-bold text-sm", a.head)}>
            {activeTab === 'unread'
              ? t('Καμία μη αναγνωσμένη ειδοποίηση', 'No unread notifications')
              : t('Καμία ειδοποίηση', 'No notifications')}
          </p>
          <p className={cn("text-xs mt-1", a.muted)}>
            {t('Θα σας ειδοποιήσουμε όταν υπάρξει κάτι νέο.', 'We\'ll notify you when something new happens.')}
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Unread / Today */}
          {todayNotifs.length > 0 && (
            <div className="space-y-2">
              <h3 className={cn("text-[11px] font-bold tracking-wider uppercase", a.muted)}>
                {t('Νέες', 'New')} ({todayNotifs.length})
              </h3>
              {todayNotifs.map((notif: any) => {
                const Icon = iconMap[notif.type] || Bell;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={cn("flex gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all group", a.unreadBg, "hover:shadow-soft")}
                  >
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", getIconColor(notif.type, false))}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[13px] leading-relaxed font-medium", a.head)}>{notif.message}</p>
                      <span className={cn("text-[10.5px] font-bold tracking-wide mt-1 block", a.muted)}>{notif.time}</span>
                      {notif.type === 'match' && (
                        <button className={cn("mt-2 text-[10.5px] font-bold px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1", a.actionBtn)}>
                          {t('Δείτε ομάδα', 'View group')} <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                      {notif.type === 'message' && (
                        <button className={cn("mt-2 text-[10.5px] font-bold px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1", a.actionBtn)}>
                          {t('Απάντηση', 'Reply')} <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <span className={cn("w-2 h-2 rounded-full", a.dot)}></span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id); }}
                        className={cn("opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all", a.isDark ? "hover:bg-gray-700/40 text-gray-500" : "hover:bg-gray-100 text-gray-400")}
                        title={t('Απόρριψη', 'Dismiss')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Read / Earlier */}
          {earlierNotifs.length > 0 && (
            <div className="space-y-2">
              <h3 className={cn("text-[11px] font-bold tracking-wider uppercase", a.muted)}>
                {t('Προηγούμενες', 'Earlier')}
              </h3>
              {earlierNotifs.map((notif: any) => {
                const Icon = iconMap[notif.type] || Bell;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={cn("flex gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all group", a.readBg, "hover:shadow-soft")}
                  >
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", getIconColor(notif.type, true))}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[13px] leading-relaxed", a.sub)}>{notif.message}</p>
                      <span className={cn("text-[10.5px] font-bold tracking-wide mt-1 block", a.muted)}>{notif.time}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDismiss(notif.id); }}
                      className={cn("opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all shrink-0 self-center", a.isDark ? "hover:bg-gray-700/40 text-gray-500" : "hover:bg-gray-100 text-gray-400")}
                      title={t('Απόρριψη', 'Dismiss')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
