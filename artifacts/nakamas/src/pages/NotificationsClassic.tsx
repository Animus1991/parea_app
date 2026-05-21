import { useState } from 'react';
import { Bell, ArrowRight, X } from 'lucide-react';
import { useLanguage } from "../lib/i18n";
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';

export default function NotificationsClassic() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const notifications = useStore(state => state.notifications);
  const markNotificationRead = useStore(state => state.markNotificationRead);

  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => [...prev, id]);
  };

  const visibleNotifs = notifications.filter(n => !dismissedIds.includes(n.id));
  const unreadNotifs = visibleNotifs.filter(n => !n.read);
  const readNotifs = visibleNotifs.filter(n => n.read);

  const handleMarkAllRead = () => {
    unreadNotifs.forEach(n => markNotificationRead(n.id));
  };

  const handleDismissAllRead = () => {
    setDismissedIds(prev => [...prev, ...readNotifs.map(n => n.id)]);
  };

  return (
    <div className="mx-auto max-w-full space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[22.33807213275px] md:text-[26.7902365993px] font-bold text-[#111827]">{t(`Ειδοποιήσεις`, `Notifications`)}</h1>
          <p className="text-gray-500 font-medium text-[13.551608211075px] md:text-[16.25212883329px] mt-1">{t(`Μείνετε ενημερωμένοι`, `Stay up to date`)}</p>
        </div>
        {unreadNotifs.length > 0 && (
          <button onClick={handleMarkAllRead} className="text-[14.2457535px] font-bold text-cyan-600 hover:text-cyan-700">
            {t(`Σήμανση όλων ως αναγνωσμένα`, `Mark all as read`)}
          </button>
        )}
      </div>

      {unreadNotifs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[12.1125px] font-bold text-gray-400 tracking-wide">{t(`Νέες`, `New`)}</h3>
          {unreadNotifs.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className="flex gap-4 p-4 rounded-xl border border-cyan-100 bg-cyan-50/30 cursor-pointer hover:bg-cyan-50 transition-colors relative"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] leading-relaxed text-[#111827] font-medium pr-6">{t(notif.messageGr, notif.messageEn)}</p>
                  <span className="text-[11.25px] font-bold text-gray-400 tracking-wide mt-1 block">{t(notif.timeGr, notif.timeEn)}</span>
                  {notif.type === 'match' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/plans'); }}
                      className="mt-2 text-[11.2px] font-bold text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-full hover:bg-cyan-200 transition-colors inline-flex items-center gap-1"
                    >
                      {t(`Δείτε ομάδα`, `View group`)} <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {notif.type === 'message' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/inbox'); }}
                      className="mt-2 text-[11.2px] font-bold text-cyan-700 bg-cyan-100 px-2.5 py-1 rounded-full hover:bg-cyan-200 transition-colors inline-flex items-center gap-1"
                    >
                      {t(`Απάντηση`, `Reply`)} <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={(e) => dismiss(notif.id, e)}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  aria-label={t('Απόρριψη', 'Dismiss')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="w-2.5 h-2.5 bg-cyan-500 rounded-full shrink-0 mt-2 self-start absolute top-4 right-8"></span>
              </div>
            );
          })}
        </div>
      )}

      {readNotifs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11.2px] font-bold text-gray-400 tracking-wide">{t(`Προηγούμενες`, `Earlier`)}</h3>
            <button
              onClick={handleDismissAllRead}
              className="text-[11.2px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t(`Εκκαθάριση όλων`, `Clear all`)}
            </button>
          </div>
          {readNotifs.map((notif) => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white relative group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] leading-relaxed text-gray-600 pr-6">{t(notif.messageGr, notif.messageEn)}</p>
                  <span className="text-[11.25px] font-bold text-gray-400 tracking-wide mt-1 block">{t(notif.timeGr, notif.timeEn)}</span>
                </div>
                <button
                  onClick={(e) => dismiss(notif.id, e)}
                  className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={t('Απόρριψη', 'Dismiss')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {visibleNotifs.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Bell className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#111827]">{t('Δεν υπάρχουν ειδοποιήσεις', 'No notifications yet')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('Θα εμφανιστούν εδώ όταν συμβεί κάτι νέο.', "They'll appear here when something new happens.")}</p>
        </div>
      )}
    </div>
  );
}
