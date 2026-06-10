import { Flame, Calendar, Trophy } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useHomeCommunityStats } from '../../hooks/useHomeCommunityStats';

export function HomeQuickStatsBar() {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const { currentStreak, eventsThisMonth, communityLevel, xpTotal } = useHomeCommunityStats();

  const items = [
    {
      icon: Flame,
      label: t('Σερί', 'Streak'),
      value: `${currentStreak}`,
      unit: t('εβδ.', 'wks'),
      sub: t('Συνεχόμενες εβδομάδες', 'Consecutive weeks'),
      iconBg: h.statIconBg.streak,
      iconColor: h.statIconColor.streak,
    },
    {
      icon: Calendar,
      label: t('Αυτόν τον μήνα', 'This month'),
      value: `${eventsThisMonth}`,
      unit: t('εκδ.', 'events'),
      sub: t('Εκδηλώσεις που παρακολούθησες', 'Events attended'),
      iconBg: h.statIconBg.month,
      iconColor: h.statIconColor.month,
    },
    {
      icon: Trophy,
      label: t('Επίπεδο', 'Level'),
      value: `${communityLevel}`,
      unit: `${xpTotal} XP`,
      sub: t('Κατάταξη κοινότητας', 'Community rank'),
      iconBg: h.statIconBg.level,
      iconColor: h.statIconColor.level,
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ icon: Icon, label, value, unit, sub, iconBg, iconColor }) => (
        <div key={label} className={`rounded-2xl p-3.5 flex flex-col gap-1 ${h.card}`}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider truncate ${h.labelMuted}`}>
              {label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black leading-none tabular-nums ${h.statValue}`}>
              {value}
            </span>
            <span className={`text-xs font-semibold ${h.statUnit}`}>{unit}</span>
          </div>
          <span className={`text-xs font-medium leading-tight ${h.labelMuted}`}>{sub}</span>
        </div>
      ))}
    </div>
  );
}
