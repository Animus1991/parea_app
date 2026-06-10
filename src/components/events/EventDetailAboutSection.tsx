import { useNavigate } from 'react-router-dom';
import { ExternalLink, Hash } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../lib/i18n';
import { homePathWithSearch } from '../../lib/homeDeepLinks';
import { getEventDetailContentTokens } from '../../lib/eventDetailDesignTokens';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

export interface EventDetailAboutSectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailAboutSection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailAboutSectionProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { surface, content } = getEventDetailContentTokens(accent, darkSurface);

  return (
    <div className={cn('pt-5 border-t mt-5', surface.sectionBorder, className)}>
      <h3 className={cn(surface.sectionHeading, 'mb-2')}>
        {t('Πληροφορίες για την εμπειρία', 'About the experience')}
      </h3>
      <p className={cn('text-[13px] leading-relaxed font-medium', content.aboutBody)}>
        {event.description}
      </p>

      {event.externalLink && (
        <div className="mt-4 pt-1">
          <a
            href={event.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 border transition-all duration-200 shadow-soft text-xs font-bold tracking-wide w-full sm:w-auto justify-center',
              content.externalLink,
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('Επίσημη Σελίδα Εκδήλωσης', 'Official Event Page')}
          </a>
        </div>
      )}

      {event.tags && event.tags.length > 0 && (
        <div className={cn('flex flex-wrap gap-2 mt-4 pt-4 border-t', surface.sectionBorder)}>
          {event.tags.map((tag) => (
            <Badge
              key={tag}
              variant="neutral"
              className={cn(
                'shadow-none px-3 py-1 text-xs cursor-pointer transition-colors',
                content.tagBadge,
              )}
              onClick={() => navigate(homePathWithSearch(tag))}
            >
              <Hash className={cn('h-3.5 w-3.5 mr-0.5', content.tagIcon)} />
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
