import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import { cn } from '../../lib/utils';
import type { User } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

interface OrganizerTokens {
  sectionBorder: string;
  heading: string;
  card: string;
  avatarWrap: string;
  avatarFallback: string;
  name: string;
  bio: string;
  trustBadgeHigh: string;
  trustBadgeDefault: string;
  reliabilityBadge: string;
}

const TOKENS: Record<EventDetailMapAccent, { light: OrganizerTokens; dark: OrganizerTokens }> = {
  classic: {
    light: {
      sectionBorder: 'border-gray-200',
      heading: 'text-[#111827]',
      card: 'rounded-2xl border border-gray-100 bg-white shadow-soft hover:border-[#a5f3fc] transition-all duration-200',
      avatarWrap: 'bg-cyan-50 border-white ring-cyan-50',
      avatarFallback: 'text-cyan-500',
      name: 'text-[#111827] hover:text-cyan-600',
      bio: 'text-gray-500',
      trustBadgeHigh: 'bg-blue-50 text-blue-700 border-blue-200',
      trustBadgeDefault: 'bg-gray-50 text-gray-700 border-gray-200',
      reliabilityBadge: 'bg-green-50 text-green-700 border-green-200',
    },
    dark: {
      sectionBorder: 'border-gray-700',
      heading: 'text-white',
      card: 'rounded-2xl border border-gray-700 bg-gray-800 shadow-sm hover:border-cyan-800 transition-colors',
      avatarWrap: 'bg-cyan-900/30 border-white ring-cyan-950',
      avatarFallback: 'text-cyan-400',
      name: 'text-white hover:text-cyan-400',
      bio: 'text-gray-300',
      trustBadgeHigh: 'bg-blue-950 text-blue-300 border-blue-800',
      trustBadgeDefault: 'bg-gray-900 text-gray-200 border-gray-700',
      reliabilityBadge: 'bg-green-950 text-green-300 border-green-800',
    },
  },
  vibrant: {
    light: {
      sectionBorder: 'border-gray-200',
      heading: 'text-[#111827]',
      card: 'rounded-xl border border-gray-200 bg-white shadow-sm hover:border-fuchsia-200 transition-colors',
      avatarWrap: 'bg-fuchsia-50 border-white ring-fuchsia-50',
      avatarFallback: 'text-fuchsia-500',
      name: 'text-[#111827] hover:text-fuchsia-600',
      bio: 'text-black',
      trustBadgeHigh: 'bg-blue-50 text-blue-700 border-blue-200',
      trustBadgeDefault: 'bg-gray-50 text-black border-gray-200',
      reliabilityBadge: 'bg-green-50 text-green-700 border-green-200',
    },
    dark: {
      sectionBorder: 'border-gray-700',
      heading: 'text-white',
      card: 'rounded-xl border border-gray-700 bg-gray-800 shadow-sm hover:border-fuchsia-800 transition-colors',
      avatarWrap: 'bg-fuchsia-950/50 border-white ring-fuchsia-950',
      avatarFallback: 'text-fuchsia-400',
      name: 'text-white hover:text-fuchsia-400',
      bio: 'text-white',
      trustBadgeHigh: 'bg-blue-950 text-blue-300 border-blue-800',
      trustBadgeDefault: 'bg-gray-900 text-white border-gray-700',
      reliabilityBadge: 'bg-green-950 text-green-300 border-green-800',
    },
  },
  neon: {
    light: {
      sectionBorder: 'border-gray-200',
      heading: 'text-[#111827]',
      card: 'rounded-xl border border-gray-200 bg-white shadow-sm hover:border-emerald-200 transition-colors',
      avatarWrap: 'bg-emerald-50 border-white ring-emerald-50',
      avatarFallback: 'text-emerald-500',
      name: 'text-[#111827] hover:text-emerald-600',
      bio: 'text-black',
      trustBadgeHigh: 'bg-blue-50 text-blue-700 border-blue-200',
      trustBadgeDefault: 'bg-gray-50 text-black border-gray-200',
      reliabilityBadge: 'bg-green-50 text-green-700 border-green-200',
    },
    dark: {
      sectionBorder: 'border-gray-700',
      heading: 'text-white',
      card: 'rounded-xl border border-gray-700 bg-gray-800 shadow-sm hover:border-emerald-800 transition-colors',
      avatarWrap: 'bg-emerald-900/30 border-white ring-emerald-950',
      avatarFallback: 'text-emerald-400',
      name: 'text-white hover:text-emerald-400',
      bio: 'text-white',
      trustBadgeHigh: 'bg-blue-950 text-blue-300 border-blue-800',
      trustBadgeDefault: 'bg-gray-900 text-white border-gray-700',
      reliabilityBadge: 'bg-green-950 text-green-300 border-green-800',
    },
  },
  bento: {
    light: {
      sectionBorder: 'border-gray-200',
      heading: 'text-[#111827]',
      card: 'rounded-xl border border-gray-200 bg-white shadow-sm hover:border-indigo-200 transition-colors',
      avatarWrap: 'bg-indigo-50 border-white ring-indigo-50',
      avatarFallback: 'text-indigo-500',
      name: 'text-[#111827] hover:text-indigo-600',
      bio: 'text-black',
      trustBadgeHigh: 'bg-blue-50 text-blue-700 border-blue-200',
      trustBadgeDefault: 'bg-gray-50 text-black border-gray-200',
      reliabilityBadge: 'bg-green-50 text-green-700 border-green-200',
    },
    dark: {
      sectionBorder: 'border-gray-700',
      heading: 'text-white',
      card: 'rounded-xl border border-gray-700 bg-gray-800 shadow-sm hover:border-indigo-800 transition-colors',
      avatarWrap: 'bg-indigo-900/30 border-white ring-indigo-950',
      avatarFallback: 'text-indigo-400',
      name: 'text-white hover:text-indigo-400',
      bio: 'text-white',
      trustBadgeHigh: 'bg-blue-950 text-blue-300 border-blue-800',
      trustBadgeDefault: 'bg-gray-900 text-white border-gray-700',
      reliabilityBadge: 'bg-green-950 text-green-300 border-green-800',
    },
  },
};

export interface EventDetailOrganizerSectionProps {
  organizer: User | null | undefined;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailOrganizerSection({
  organizer,
  accent,
  darkSurface = false,
  className,
}: EventDetailOrganizerSectionProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const hostedCount = useStore((s) =>
    organizer ? s.events.filter((e) => e.organizerId === organizer.id).length : 0,
  );

  if (!organizer) return null;

  const tok = darkSurface ? TOKENS[accent].dark : TOKENS[accent].light;

  const defaultBio =
    hostedCount > 0
      ? t(
          `Επαληθευμένος Διοργανωτής • ${hostedCount} εκδηλώσεις`,
          `Verified Organizer • ${hostedCount} events hosted`,
        )
      : t('Επαληθευμένος Διοργανωτής', 'Verified Organizer');

  const trustTierLabel =
    organizer.trustTier === '3_high_trust'
      ? t('ΥΨΗΛΗ ΕΜΠΙΣΤΟΣΥΝΗ', 'HIGH TRUST')
      : t(tierLabelEl(organizer.trustTier).toUpperCase(), tierLabelEn(organizer.trustTier).toUpperCase());

  return (
    <div className={cn('pt-5 border-t mt-5', tok.sectionBorder, className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('text-[11px] font-bold tracking-wide mt-1', tok.heading)}>
          {t('Διοργανωτής Εκδήλωσης', 'Event Organizer')}
        </h3>
      </div>
      <div className={cn('flex items-center justify-between p-4', tok.card)}>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-14 h-14 rounded-full overflow-hidden border-2 ring-2 shrink-0',
              tok.avatarWrap,
            )}
          >
            {organizer.photoUrl ? (
              <img
                referrerPolicy="no-referrer"
                src={organizer.photoUrl}
                alt={organizer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center font-bold text-lg',
                  tok.avatarFallback,
                )}
              >
                {organizer.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                to="/profile"
                className={cn('text-base font-bold transition-colors', tok.name)}
              >
                {organizer.name}
              </Link>
              {organizer.trustTier && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[9px] py-0 px-1.5 shadow-none',
                    organizer.trustTier === '3_high_trust'
                      ? tok.trustBadgeHigh
                      : tok.trustBadgeDefault,
                  )}
                >
                  {trustTierLabel}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn('text-[9px] py-0 px-1.5 shadow-none', tok.reliabilityBadge)}
              >
                {organizer.reliabilityScore}% {t('ΑΞΙΟΠΙΣΤΙΑ', 'RELIABILITY')}
              </Badge>
            </div>
            <p className={cn('text-xs mt-0.5 font-medium', tok.bio)}>
              {organizer.bio || defaultBio}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex"
          onClick={() => navigate('/profile')}
        >
          {t('Προβολή Προφίλ', 'View Profile')}
        </Button>
      </div>
    </div>
  );
}
