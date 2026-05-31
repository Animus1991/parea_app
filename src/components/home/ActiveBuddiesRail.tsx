import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { cn } from '../../lib/utils';

interface ActiveBuddiesRailProps {
  /** Use home theme tokens (Classic) instead of page contrast */
  useClassicTokens?: boolean;
}

export function ActiveBuddiesRail({ useClassicTokens = false }: ActiveBuddiesRailProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const p = usePageContrast();
  const h = useHomeTheme();
  const tok = useThemeStyles();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);

  const connectionIds = new Set(currentUser?.connections ?? []);

  const activeBuddies = users
    .filter((u) => u.id !== currentUser?.id)
    .slice(0, 6);

  if (activeBuddies.length === 0) return null;

  const card = useClassicTokens
    ? cn('rounded-2xl p-4 space-y-3.5 border shadow-soft', h.card)
    : cn(
        'p-[19.6px] md:p-[23.5px] rounded-3xl border shadow-sm',
        p.cardSurface,
        p.borderB,
      );

  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Activity
            className={cn(
              'w-5 h-5',
              useClassicTokens ? tok.accentText : p.iconAccent,
            )}
          />
          <h2
            className={cn(
              'text-[14.63px] font-bold leading-tight',
              useClassicTokens ? h.heading : p.head,
            )}
          >
            {t('Ενεργοί Φίλοι', 'Active Buddies')}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/connections')}
          className={cn(
            'text-[12px] font-bold flex items-center gap-1 transition-colors shrink-0',
            useClassicTokens ? tok.accentText : p.iconAccent,
            !useClassicTokens && p.hoverText,
          )}
        >
          {t('Όλοι', 'All')} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-start gap-4 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar snap-x">
        {activeBuddies.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => navigate('/connections')}
            className="flex flex-col items-center gap-2 snap-start min-w-[70px] group focus:outline-none"
          >
            <div className="relative">
              <img
                src={user.photoUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                alt={user.name}
                className={cn(
                  'w-14 h-14 rounded-full object-cover border-2 transition-transform group-hover:scale-105 shadow-soft',
                  useClassicTokens
                    ? 'border-cyan-100'
                    : p.isDark
                      ? 'border-cyan-900'
                      : 'border-cyan-100',
                )}
              />
              <div
                className={cn(
                  'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white',
                  connectionIds.has(user.id) || user.id.charCodeAt(0) % 3 !== 0
                    ? 'bg-emerald-500'
                    : 'bg-gray-300',
                )}
                title={
                  connectionIds.has(user.id)
                    ? t('Συνδεδεμένος', 'Connected')
                    : t('Πρόσφατα ενεργός', 'Recently active')
                }
              />
            </div>
            <span
              className={cn(
                'text-xs font-bold truncate max-w-[72px] text-center',
                useClassicTokens ? h.heading : p.head,
              )}
            >
              {user.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
