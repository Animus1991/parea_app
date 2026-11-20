import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { formatLocationArea } from '../../lib/eventDisplay';
import { cn } from '../../lib/utils';
import type { PlansFormingScarcityPromo as Promo } from '../../lib/plansFormingUtils';

export function PlansFormingScarcityPromoCard({
  promo,
  isDark,
}: {
  promo: Promo;
  isDark: boolean;
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const remaining = promo.target - promo.filled;
  const location = promo.location ? formatLocationArea(promo.location, language) : '';
  const ink = isDark ? 'text-white' : 'text-ink';
  const muted = isDark ? 'text-gray-400' : 'text-ink-muted';

  return (
    <article
      className={cn(
        'nakamas-card overflow-hidden rounded-2xl shadow-soft',
        isDark ? 'bg-white/[0.04]' : 'bg-white dark:bg-gray-900',
      )}
    >
      <div className="space-y-3.5 px-4 py-4">
        <p className={cn('card-badge font-semibold tracking-wide', isDark ? 'text-amber-300' : 'text-amber-800')}>
          {t('Σχεδόν πλήρης ομάδα', 'Group nearly full')}
        </p>
        <h3 className={cn('card-heading-lg font-bold leading-snug', ink)}>{promo.eventTitle}</h3>
        <div className="space-y-2">
          <p className={cn('card-meta font-medium leading-relaxed', muted)}>
            {t(promo.scheduleFull.el, promo.scheduleFull.en)}
          </p>
          <div className="flex items-baseline justify-between gap-x-5">
            {location ? (
              <p className={cn('min-w-0 card-meta font-medium leading-relaxed', muted)}>{location}</p>
            ) : (
              <span />
            )}
            <p className={cn('shrink-0 card-meta font-medium leading-relaxed', muted)}>
              {promo.filled}/{promo.target}
              {remaining > 0 ? ` · ${remaining} ${t('ακόμη', 'left')}` : ''}
            </p>
          </div>
        </div>
        <div className="pt-1">
          <button
            type="button"
            onClick={() =>
              navigate(promo.groupId ? `/events/${promo.eventId}/join?group=${promo.groupId}` : `/events/${promo.eventId}`)
            }
            className="px-4 min-h-9 rounded-full card-cta bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
          >
            {t('Κλείστε τη θέση σας', 'Secure your spot')}
          </button>
        </div>
      </div>
    </article>
  );
}
