import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import type { PlansFormingScarcityPromo as Promo } from '../../lib/plansFormingUtils';

export function PlansFormingScarcityPromoCard({
  promo,
  isDark,
}: {
  promo: Promo;
  isDark: boolean;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const remaining = promo.target - promo.filled;

  return (
    <article
      className={cn(
        'rounded-2xl border p-3 space-y-2.5',
        isDark
          ? 'border-amber-700/35 bg-gradient-to-br from-amber-950/50 to-orange-950/30'
          : 'border-amber-200 bg-amber-50/90',
      )}
    >
      <p className={cn('text-xs font-bold uppercase tracking-wider', isDark ? 'text-amber-400' : 'text-amber-800')}>
        {t('Σχεδόν πλήρης ομάδα', 'Group nearly full')}
      </p>
      <h3 className={cn('text-base font-bold leading-snug line-clamp-2', isDark ? 'text-white' : 'text-gray-900')}>
        {promo.eventTitle}
      </h3>
      <p className={cn('text-xs font-semibold leading-snug', isDark ? 'text-amber-100/90' : 'text-amber-950')}>
        {t(promo.scheduleFull.el, promo.scheduleFull.en)}
      </p>
      <div className={cn('flex items-center gap-2 text-xs font-bold', isDark ? 'text-amber-200' : 'text-amber-900')}>
        <Users className="w-3.5 h-3.5 shrink-0" />
        <span>
          {promo.filled}/{promo.target}{' '}
          {t('θέσεις καλυμμένες', 'spots filled')}
          {remaining > 0 && (
            <span className={cn('font-medium', isDark ? 'text-amber-300/80' : 'text-amber-800')}>
              {' '}
              · {remaining} {t('ακόμη', 'left')}
            </span>
          )}
        </span>
      </div>
      {promo.location && (
        <p className={cn('text-xs flex items-center gap-1 truncate', isDark ? 'text-gray-400' : 'text-gray-600')}>
          <MapPin className="w-3 h-3 shrink-0" />
          {promo.location}
        </p>
      )}
      <button
        type="button"
        onClick={() =>
          navigate(promo.groupId ? `/events/${promo.eventId}/join?group=${promo.groupId}` : `/events/${promo.eventId}`)
        }
        className={cn(
          'w-full min-h-10 rounded-xl text-xs font-bold transition-colors',
          isDark ? 'bg-amber-600/90 hover:bg-amber-500 text-white' : 'bg-amber-700 hover:bg-amber-800 text-white',
        )}
      >
        {t('Κλείστε τη θέση σας', 'Secure your spot')}
      </button>
      <p className={cn('text-xs flex items-center gap-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
        <Calendar className="w-3 h-3" />
        {t('Μικρή ομάδα · event-first', 'Small group · event-first')}
      </p>
    </article>
  );
}
