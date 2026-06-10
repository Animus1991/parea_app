import { Tag, ShieldCheck, Ticket, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import { getEventDetailContentTokens } from '../../lib/eventDetailDesignTokens';
import { cn } from '../../lib/utils';
import type { Event, TrustTier } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

export interface EventDetailQuickInfoSectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailQuickInfoSection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailQuickInfoSectionProps) {
  const { t } = useLanguage();
  const { content } = getEventDetailContentTokens(accent, darkSurface);
  const tier = event.minTrustTierAccess as TrustTier;
  const tierLabel = t(tierLabelEl(tier), tierLabelEn(tier));

  const shell = darkSurface
    ? 'rounded-2xl border border-cyan-800/40 bg-cyan-950/30 shadow-soft p-4 md:p-5'
    : 'rounded-2xl border border-cyan-100 bg-cyan-50/80 shadow-soft p-4 md:p-5';

  return (
    <div className={cn(shell, className)} role="region" aria-label={t('Γρήγορες πληροφορίες', 'Quick info')}>
      <p className={cn('text-xs font-bold tracking-wide uppercase mb-3', content.metaLabel)}>
        {t('Γρήγορες πληροφορίες', 'Quick info')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Tag className={cn('w-4 h-4 shrink-0 mt-0.5', content.metaLabel)} />
          <div className="min-w-0">
            <p className={cn('text-xs font-bold tracking-wide', content.metaLabel)}>
              {t('Κατηγορία', 'Category')}
            </p>
            <p className={cn('text-sm font-bold truncate', content.metaValue)}>{event.category}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 min-w-0">
          <ShieldCheck className={cn('w-4 h-4 shrink-0 mt-0.5', content.metaLabel)} />
          <div className="min-w-0">
            <p className={cn('text-xs font-bold tracking-wide', content.metaLabel)}>
              {t('Επίπεδο εμπιστοσύνης', 'Trust level required')}
            </p>
            <p className={cn('text-sm font-bold', content.metaValue)}>{tierLabel}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 min-w-0">
          <Ticket className={cn('w-4 h-4 shrink-0 mt-0.5', content.metaLabel)} />
          <div>
            <p className={cn('text-xs font-bold tracking-wide', content.metaLabel)}>
              {t('Κόστος', 'Cost')}
            </p>
            <p className={cn('text-sm font-bold', content.metaValue)}>
              {event.isPaid ? `€${event.price}` : t('Δωρεάν', 'Free')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 min-w-0">
          <AlertCircle className={cn('w-4 h-4 shrink-0 mt-0.5', content.metaLabel)} />
          <div>
            <p className={cn('text-xs font-bold tracking-wide', content.metaLabel)}>
              {t('Ασφάλεια', 'Safety')}
            </p>
            <p className={cn('text-sm font-bold', content.metaValue)}>
              {event.safetyLevel === 'high_trust'
                ? t('Υψηλής εμπιστοσύνης', 'High trust')
                : event.safetyLevel === 'medium'
                  ? t('Μέτρια', 'Medium')
                  : t('Χαμηλή', 'Low')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
