import { useState } from 'react';
import { Calendar, MessageCircle, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage } from "../lib/i18n";
import { useNavigate } from 'react-router-dom';
import { TabBar } from '../components/common/TabBar';
import { useStore } from '../store';

export default function NotificationsClassic() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  const notifications = [
    {
      id: 'n1',
      type: 'match',
      message: t("Νέο Ταίριασμα! Τοποθετηθήκατε σε ομάδα υψηλής εμπιστοσύνης για το 'Σαββατοκύριακο στην Αράχωβα'.", "New Match! You've been placed in a high-trust group for 'Weekend in Arachova'."),
      time: t(`Πριν 10 λεπτά`, `10 minutes ago`),
      read: false,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'n2',
      type: 'message',
      message: t("Ο διοργανωτής Alex έστειλε ένα μήνυμα: 'Γεια σε όλους! Δείτε το νέο σημείο συνάντησης για την αυριανή πεζοπορία.'", "Organizer Alex sent a message: 'Hey everyone! Check the new meeting point for tomorrow's hike.'"),
      time: t(`Πριν 1 ώρα`, `1 hour ago`),
      read: false,
      icon: MessageCircle,
      color: 'bg-cyan-50 text-[#0E8B8D]'
    },
    {
      id: 'n3',
      type: 'reminder',
      message: t("Υπενθύμιση: Το 'Stand-up Comedy' ξεκινά σε 24 ώρες. Μην ξεχάσετε τα εισιτήριά σας!", "Reminder: 'Stand-up Comedy' starts in 24 hours. Don't forget your tickets!"),
      time: t(`Πριν 3 ώρες`, `3 hours ago`),
      read: true,
      icon: Calendar,
      color: 'bg-gray-50 text-gray-500'
    },
    {
      id: 'n4',
      type: 'system',
      message: t(`Η βαθμολογία αξιοπιστίας σας αυξήθηκε στο 95%. Ευχαριστούμε που είστε ένα εξαιρετικό μέλος της κοινότητας!`, `Your reliability score increased to 95%. Thank you for being a great community member!`),
      time: t(`Πριν 2 μέρες`, `2 days ago`),
      read: true,
      icon: CheckCircle2,
      color: 'bg-gray-50 text-gray-500'
    },
    {
      id: 'n5',
      type: 'achievement',
      message: t(`Κερδίσατε το badge "Κοινωνική Πεταλούδα"! Γίνατε μέλος σε 5 διαφορετικές ομάδες.`, `You earned the "Social Butterfly" badge! Joined 5 different groups.`),
      time: t(`Πριν 3 μέρες`, `3 days ago`),
      read: true,
      icon: CheckCircle2,
      color: 'bg-purple-50 text-purple-600'
    }
  ];

  const tabs = [
    { id: 'all', label: t('Όλα', 'All') },
    { id: 'unread', label: t('Μη αναγνωσμένα', 'Unread'), count: notifications.filter(n => !n.read).length },
    { id: 'match', label: t('Ταιριάσματα', 'Matches') },
    { id: 'message', label: t('Μηνύματα', 'Messages') },
    { id: 'system', label: t('Σύστημα', 'System') },
  ];

  const filtered = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.type === activeTab;
  });

  const todayNotifs = filtered.filter(n => !n.read);
  const earlierNotifs = filtered.filter(n => n.read);

  return (
    <div className="mx-auto max-w-full space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-end">
        <div>
          <h1 className={`text-[16px] md:text-[18px] font-bold ${isDark ? 'text-white' : 'text-[#111827]'}`}>{t(`Ειδοποιήσεις`, `Notifications`)}</h1>
          <p className={`font-medium text-[13px] md:text-[14px] mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t(`Μείνετε ενημερωμένοι`, `Stay up to date`)}</p>
        </div>
        <button className="text-[13.5px] font-bold text-[#0E8B8D] hover:text-[#0b6d6f] transition-colors">
          {t(`Σήμανση όλων ως αναγνωσμένα`, `Mark all as read`)}
        </button>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* New (unread) */}
      {todayNotifs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11.5px] font-bold text-gray-400 tracking-widest uppercase">{t(`Νέες`, `New`)} ({todayNotifs.length})</h3>
          {todayNotifs.map((notif) => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className={`flex gap-4 rounded-2xl p-4 border transition-all duration-200 ${isDark ? 'bg-gray-800/60 border-[#18D8DB]/20 hover:border-[#18D8DB]/40' : 'card-row !border-[#a5f3fc]/60 !bg-[#18D8DB]/[0.02]'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] leading-relaxed text-[#111827] font-medium">{notif.message}</p>
                  <span className="text-[11px] font-bold text-gray-400 tracking-wide mt-1 block">{notif.time}</span>
                  {notif.type === 'match' && (
                    <button onClick={() => navigate('/plans')} className="mt-2.5 btn-gradient !py-1.5 !px-4 !text-[11.5px] inline-flex items-center gap-1.5">
                      {t(`Δείτε ομάδα`, `View group`)} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {notif.type === 'message' && (
                    <button onClick={() => navigate('/chats')} className="mt-2.5 btn-gradient !py-1.5 !px-4 !text-[11.5px] inline-flex items-center gap-1.5">
                      {t(`Απάντηση`, `Reply`)} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="w-2 h-2 bg-[#18D8DB] rounded-full shrink-0 mt-2.5"></span>
              </div>
            );
          })}
        </div>
      )}

      {/* Earlier */}
      {earlierNotifs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11.5px] font-bold text-gray-400 tracking-widest uppercase">{t(`Προηγούμενες`, `Earlier`)}</h3>
          {earlierNotifs.map((notif) => {
            const Icon = notif.icon;
            return (
              <div key={notif.id} className={`flex gap-4 rounded-2xl p-4 border transition-all duration-200 ${isDark ? 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600' : 'card-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] leading-relaxed text-gray-500">{notif.message}</p>
                  <span className="text-[11px] font-bold text-gray-400 tracking-wide mt-1 block">{notif.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
