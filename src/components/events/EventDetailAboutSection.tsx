import { useNavigate } from 'react-router-dom';
import { ExternalLink, Hash } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../lib/i18n';
import { homePathWithSearch } from '../../lib/homeDeepLinks';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

const TOKENS: Record<
  EventDetailMapAccent,
  { light: AboutTokens; dark: AboutTokens }
> = {
  classic: {
    light: {
      border: 'border-gray-200',
      heading: 'text-[#111827]',
      body: 'text-gray-600',
      tagBorder: 'border-gray-100',
      tagBadge: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-gray-400',
      link: 'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-[#0E8B8D] hover:border-[#a5f3fc] rounded-2xl',
    },
    dark: {
      border: 'border-gray-700',
      heading: 'text-white',
      body: 'text-white',
      tagBorder: 'border-gray-800',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700/60',
      tagIcon: 'text-white',
      link: 'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-cyan-400 hover:border-cyan-800 rounded-lg',
    },
  },
  vibrant: {
    light: {
      border: 'border-gray-200',
      heading: 'text-[#111827]',
      body: 'text-black',
      tagBorder: 'border-gray-100',
      tagBadge: 'bg-gray-100 text-black hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-black',
      link: 'border-gray-200 text-black bg-white hover:bg-gray-50 hover:text-fuchsia-600 hover:border-fuchsia-200 rounded-lg',
    },
    dark: {
      border: 'border-gray-700',
      heading: 'text-white',
      body: 'text-white',
      tagBorder: 'border-gray-800',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-200 border-gray-700/60',
      tagIcon: 'text-white',
      link: 'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-fuchsia-400 hover:border-fuchsia-800 rounded-lg',
    },
  },
  neon: {
    light: {
      border: 'border-gray-200',
      heading: 'text-[#111827]',
      body: 'text-black',
      tagBorder: 'border-gray-100',
      tagBadge: 'bg-gray-100 text-black hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-black',
      link: 'border-gray-200 text-black bg-white hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 rounded-lg',
    },
    dark: {
      border: 'border-gray-700',
      heading: 'text-white',
      body: 'text-white',
      tagBorder: 'border-gray-800',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-200 border-gray-700/60',
      tagIcon: 'text-white',
      link: 'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-emerald-400 hover:border-emerald-800 rounded-lg',
    },
  },
  bento: {
    light: {
      border: 'border-gray-200',
      heading: 'text-[#111827]',
      body: 'text-black',
      tagBorder: 'border-gray-100',
      tagBadge: 'bg-gray-100 text-black hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-black',
      link: 'border-gray-200 text-black bg-white hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 rounded-lg',
    },
    dark: {
      border: 'border-gray-700',
      heading: 'text-white',
      body: 'text-white',
      tagBorder: 'border-gray-800',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-200 border-gray-700/60',
      tagIcon: 'text-white',
      link: 'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-indigo-400 hover:border-indigo-800 rounded-lg',
    },
  },
};

interface AboutTokens {
  border: string;
  heading: string;
  body: string;
  tagBorder: string;
  tagBadge: string;
  tagIcon: string;
  link: string;
}

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
  const tok = darkSurface ? TOKENS[accent].dark : TOKENS[accent].light;

  return (
    <div className={cn('pt-5 border-t mt-5', tok.border, className)}>
      <h3 className={cn('text-[11px] font-bold mb-2 tracking-wide', tok.heading)}>
        {t('Πληροφορίες για την εμπειρία', 'About the experience')}
      </h3>
      <p className={cn('text-[13px] leading-relaxed font-medium', tok.body)}>
        {event.description}
      </p>

      {event.externalLink && (
        <div className="mt-4 pt-1">
          <a
            href={event.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 border transition-all duration-200 shadow-sm text-xs font-bold tracking-wide w-full sm:w-auto justify-center',
              tok.link,
            )}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('Επίσημη Σελίδα Εκδήλωσης', 'Official Event Page')}
          </a>
        </div>
      )}

      {event.tags && event.tags.length > 0 && (
        <div className={cn('flex flex-wrap gap-2 mt-4 pt-4 border-t', tok.tagBorder)}>
          {event.tags.map((tag) => (
            <Badge
              key={tag}
              variant="neutral"
              className={cn(
                'shadow-none px-3 py-1 text-xs cursor-pointer transition-colors',
                tok.tagBadge,
              )}
              onClick={() => navigate(homePathWithSearch(tag))}
            >
              <Hash className={cn('h-3.5 w-3.5 mr-0.5', tok.tagIcon)} />
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
