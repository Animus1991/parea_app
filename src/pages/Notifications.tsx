import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';

export default function Notifications() {
  const { t } = useLanguage();
  const notifications = useStore((state) => state.notifications);
  const markNotificationRead = useStore((state) => state.markNotificationRead);

  return (
    <div className="mx-auto max-w-full space-y-6 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{t('Ειδοποιήσεις', 'Notifications')}</h1>
          <p className="mt-1 text-xs text-gray-500 font-medium">{t('Ενημερώσεις, υπενθυμίσεις και μηνύματα.', 'Updates, reminders, and messages.')}</p>
        </div>
        <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
          {t('Ενεργοποίηση Push', 'Enable Push')}
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => {
          const Icon = notif.icon;
          return (
            <div 
              key={notif.id} 
              onClick={() => {
                if (!notif.read) {
                  markNotificationRead(notif.id);
                }
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border ${notif.read ? 'bg-white border-gray-100' : 'bg-indigo-50/50 border-indigo-100'} shadow-sm transition-colors cursor-pointer hover:border-indigo-200`}
            >
              <div className={`mt-0.5 p-2 rounded-full shrink-0 ${notif.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-[#111827] font-medium'}`}>
                  {t(notif.messageGr, notif.messageEn)}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t(notif.timeGr, notif.timeEn)}
                </p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-2"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
