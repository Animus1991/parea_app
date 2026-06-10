import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Users,
  Calendar,
  Map as MapIcon,
  Trophy,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { cn } from '../../lib/utils';

interface HomeQuickActionsProps {
  useClassicTokens?: boolean;
  /** When set, «Κατηγορίες» scrolls to Home filters instead of /categories. */
  onScrollToCategories?: () => void;
}

export function HomeQuickActions({
  useClassicTokens = false,
  onScrollToCategories,
}: HomeQuickActionsProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const p = usePageContrast();
  const h = useHomeTheme();

  const scrollCategories = () => {
    if (onScrollToCategories) onScrollToCategories();
    else navigate('/categories');
  };

  const shortcuts: {
    icon: typeof Grid;
    label: string;
    onClick: () => void;
    key: string;
  }[] = [
    { icon: Grid, label: t('Κατηγορίες', 'Categories'), onClick: scrollCategories, key: 'categories' },
    { icon: Users, label: t('Φίλοι', 'Friends'), onClick: () => navigate('/connections'), key: 'friends' },
    { icon: Calendar, label: t('Πρόγραμμα', 'Schedule'), onClick: () => navigate('/agenda'), key: 'agenda' },
    { icon: MapIcon, label: t('Κοντά μου', 'Nearby'), onClick: () => navigate('/nearby'), key: 'nearby' },
  ];

  const features = [
    {
      icon: Users,
      title: t('Βρες Παρέα', 'Find Nakamas'),
      body: t(
        'Γνώρισε άτομα με κοινά ενδιαφέροντα.',
        'Meet people with shared interests.',
      ),
      to: '/nearby',
    },
    {
      icon: Calendar,
      title: t('Διοργάνωσε Εκδήλωση', 'Host Event'),
      body: t(
        'Δημιούργησε την δική σου εμπειρία.',
        'Create your own experience.',
      ),
      to: '/create',
    },
    {
      icon: Trophy,
      title: t('Φτιάξε μια Ομάδα', 'Create a Group'),
      body: t(
        'Μάζεψε άτομα για μια ιδέα σου.',
        'Gather people for your idea.',
      ),
      to: '/categories',
    },
  ] as const;

  if (useClassicTokens) {
    return (
      <section className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {shortcuts.map(({ icon: Icon, label, onClick, key }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={cn(
                'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all hover:-translate-y-0.5 shadow-soft',
                h.card,
              )}
            >
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-cyan-600" />
              </div>
              <span className={cn('text-xs font-bold text-center', h.heading)}>
                {label}
              </span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {features.map(({ icon: Icon, title, body, to }) => (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className={cn(
                'p-5 rounded-2xl border text-left transition-all hover:-translate-y-0.5 shadow-soft',
                h.card,
              )}
            >
              <div className="w-9 h-9 rounded-2xl bg-cyan-50 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-cyan-600" />
              </div>
              <h3 className={cn('font-bold text-[14px] mb-1', h.heading)}>{title}</h3>
              <p className={cn('text-[12px] font-medium', h.labelMuted)}>{body}</p>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {shortcuts.map(({ icon: Icon, label, onClick, key }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={cn(
              'flex flex-col items-center justify-center p-3 rounded-2xl border transition-all hover:-translate-y-0.5 shadow-soft',
              p.cardSurface,
              p.borderB,
              p.cardHover,
            )}
          >
            <div
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center mb-2',
                p.isDark ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-50 text-cyan-600',
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className={cn('text-xs font-bold text-center', p.head)}>{label}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, body, to }) => (
          <button
            key={to}
            type="button"
            onClick={() => navigate(to)}
            className={cn(
              'p-5 rounded-2xl border text-left transition-all hover:-translate-y-0.5 shadow-soft',
              p.cardSurface,
              p.borderB,
              p.cardHover,
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-2xl flex items-center justify-center mb-3',
                p.isDark ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-600',
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h3 className={cn('font-bold text-[14px] mb-1', p.head)}>{title}</h3>
            <p className={cn('text-[12px] font-medium', p.sub)}>{body}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
