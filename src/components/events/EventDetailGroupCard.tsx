import type { NavigateFunction } from 'react-router-dom';
import { Users, ShieldCheck, CheckCircle } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { shouldRevealMemberPhoto, getPhotoPlaceholder } from '../../lib/photoReveal';
import { cn } from '../../lib/utils';
import { redundantClick } from '../../lib/a11y';
import type { Event, Group } from '../../types';
import { GroupInsights } from '../outings/GroupInsights';
import { useCategoryLabel } from '../../hooks/useCategoryLabel';

export type EventDetailGroupAccent = 'classic' | 'vibrant' | 'neon' | 'bento';

type AccentTokens = {
  card: string;
  hoverBorder: string;
  bar: string;
  label: string;
  title: string;
  meta: string;
  category: string;
  hostLabel: string;
  avatarBorder: string;
  avatarFallback: string;
  privateBox: string;
  cta: string;
  discountCorner: string;
};

const LIGHT: Record<EventDetailGroupAccent, AccentTokens> = {
  classic: {
    card: 'rounded-2xl border border-gray-100 bg-white p-4 shadow-soft',
    hoverBorder: 'hover:border-[#a5f3fc] hover:shadow-soft-md',
    bar: 'from-cyan-400 to-purple-400',
    label: 'text-gray-500',
    title: 'text-gray-900',
    meta: 'text-gray-500',
    category: 'text-brand bg-accent/[0.06]',
    hostLabel: 'text-gray-500',
    avatarBorder: 'border-gray-200',
    avatarFallback: 'bg-cyan-100 text-cyan-700',
    privateBox: 'text-gray-500 bg-gray-50 border-gray-100',
    cta: 'bg-accent/[0.06] text-brand border border-[#a5f3fc]/40 hover:bg-brand hover:text-white group-hover:bg-brand group-hover:text-white rounded-2xl shadow-soft',
    discountCorner: 'rounded-bl-2xl shadow-soft',
  },
  vibrant: {
    card: 'rounded-2xl border border-gray-200 bg-white p-4 shadow-soft',
    hoverBorder: 'hover:border-fuchsia-300 hover:shadow-soft-md',
    bar: 'from-fuchsia-400 to-purple-400',
    label: 'text-black',
    title: 'text-black',
    meta: 'text-black',
    category: 'text-fuchsia-600 bg-fuchsia-50',
    hostLabel: 'text-black',
    avatarBorder: 'border-gray-200',
    avatarFallback: 'bg-fuchsia-100 text-fuchsia-700',
    privateBox: 'text-black bg-gray-50 border-gray-100',
    cta: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 hover:bg-fuchsia-600 hover:text-white group-hover:bg-fuchsia-600 group-hover:text-white shadow-soft',
    discountCorner: 'rounded-bl-lg shadow-soft',
  },
  neon: {
    card: 'rounded-2xl border border-gray-200 bg-white p-4 shadow-soft',
    hoverBorder: 'hover:border-emerald-300 hover:shadow-soft-md',
    bar: 'from-emerald-400 to-purple-400',
    label: 'text-black',
    title: 'text-black',
    meta: 'text-black',
    category: 'text-emerald-600 bg-emerald-50',
    hostLabel: 'text-black',
    avatarBorder: 'border-gray-200',
    avatarFallback: 'bg-emerald-100 text-emerald-700',
    privateBox: 'text-black bg-gray-50 border-gray-100',
    cta: 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-600 hover:text-white group-hover:bg-emerald-600 group-hover:text-white shadow-soft',
    discountCorner: 'rounded-bl-lg shadow-soft',
  },
  bento: {
    card: 'rounded-2xl border border-gray-200 bg-white p-4 shadow-soft',
    hoverBorder: 'hover:border-indigo-300 hover:shadow-soft-md',
    bar: 'from-indigo-400 to-purple-400',
    label: 'text-black',
    title: 'text-black',
    meta: 'text-black',
    category: 'text-indigo-600 bg-indigo-50',
    hostLabel: 'text-black',
    avatarBorder: 'border-gray-200',
    avatarFallback: 'bg-indigo-100 text-indigo-700',
    privateBox: 'text-black bg-gray-50 border-gray-100',
    cta: 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-600 hover:text-white group-hover:bg-indigo-600 group-hover:text-white shadow-soft',
    discountCorner: 'rounded-bl-lg shadow-soft',
  },
};

const DARK: Record<EventDetailGroupAccent, AccentTokens> = {
  classic: LIGHT.classic,
  vibrant: {
    ...LIGHT.vibrant,
    card: 'rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-soft',
    hoverBorder: 'hover:border-fuchsia-300 hover:shadow-soft-md',
    label: 'text-white',
    title: 'text-white',
    meta: 'text-white',
    category: 'text-fuchsia-400 bg-fuchsia-900/30',
    hostLabel: 'text-white',
    avatarBorder: 'border-gray-700',
    privateBox: 'text-white bg-gray-800/70 border-gray-700',
  },
  neon: {
    ...LIGHT.neon,
    card: 'rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-soft',
    hoverBorder: 'hover:border-emerald-300 hover:shadow-soft-md',
    label: 'text-white',
    title: 'text-white',
    meta: 'text-white',
    category: 'text-emerald-400 bg-emerald-900/30',
    hostLabel: 'text-white',
    avatarBorder: 'border-gray-700',
    privateBox: 'text-white bg-gray-800/70 border-gray-700',
  },
  bento: {
    ...LIGHT.bento,
    card: 'rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-soft',
    hoverBorder: 'hover:border-emerald-300 hover:shadow-soft-md',
    label: 'text-white',
    title: 'text-white',
    meta: 'text-white',
    category: 'text-emerald-400 bg-emerald-900/30',
    hostLabel: 'text-white',
    avatarBorder: 'border-gray-700',
    privateBox: 'text-white bg-gray-800/70 border-gray-700',
  },
};

export interface EventDetailGroupCardProps {
  group: Group;
  event: Event;
  navigate: NavigateFunction;
  accent: EventDetailGroupAccent;
  darkSurface?: boolean;
}

export function EventDetailGroupCard({
  group,
  event,
  navigate,
  accent,
  darkSurface = false,
}: EventDetailGroupCardProps) {
  const { t } = useLanguage();
  const categoryLabel = useCategoryLabel();
  const users = useStore((s) => s.users);
  const meId = useStore((s) => s.currentUser?.id);
  const tok = (darkSurface ? DARK : LIGHT)[accent];
  // Φ27 — members go straight to «Η βραδιά μας»; everyone else to the join flow.
  const isMember = Boolean(meId && group.members.includes(meId));
  const onWaitlist = Boolean(meId && group.waitlist?.includes(meId));
  const openTarget = isMember ? `/night/${group.id}` : `/events/${event.id}/join?groupId=${group.id}`;

  const spotsLeft = group.targetSize - group.members.length;
  const isDiscountEligible =
    event.groupDiscount && group.targetSize >= event.groupDiscount.minSize;
  const discountUnlockedTemp =
    event.groupDiscount && group.members.length >= event.groupDiscount.minSize;
  const membersNeededForDiscount = event.groupDiscount
    ? Math.max(0, event.groupDiscount.minSize - group.members.length)
    : 0;

  const hostId = group.hostId || group.members[0];
  const groupHost = users.find((u) => u.id === hostId);

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden mt-2 transition-all duration-200',
        tok.card,
        tok.hoverBorder,
      )}
      {...redundantClick<HTMLDivElement>(() => navigate(openTarget))}
    >
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity',
          tok.bar,
        )}
      />

      {(group.discountUnlocked || discountUnlockedTemp) && event.groupDiscount ? (
        <div
          className={cn(
            'absolute top-2 right-2 bg-emerald-500 text-white text-2xs font-bold px-2 py-0.5 flex items-center gap-1 z-10 w-fit',
            tok.discountCorner,
          )}
        >
          <CheckCircle className="h-3 w-3" aria-hidden /> {event.groupDiscount.percentage}%{' '}
          {t('έκπτωση', 'off')}
        </div>
      ) : group.isRecruiting ? (
        <div className="absolute top-2 right-2 z-10">
          <span className={cn('card-meta font-semibold', darkSurface ? 'text-cyan-300' : 'text-cyan-700')}>
            {t('Δέχεται μέλη', 'Recruiting')}
          </span>
        </div>
      ) : null}

      <div className="flex justify-between items-start mb-3 mt-1">
        <div>
          <div className={cn('flex items-center gap-1.5 card-meta font-semibold mb-1', tok.label)}>
            <Users className="h-3.5 w-3.5" aria-hidden />
            {t('Ομαδα', 'Group')} {group.id.replace('g', '#')}
          </div>
          <h4 className={cn('card-heading-lg font-bold mb-0.5 line-clamp-1', tok.title)}>{event.title}</h4>
          <p className={cn('card-meta capitalize mb-1', tok.meta)}>{categoryLabel(event.category)}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={cn('card-heading font-bold', tok.title)}>{group.members.length}</span>
            <span className={cn('card-copy font-medium', tok.meta)}>
              / {group.targetSize} {t('μέλη', 'members')}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={spotsLeft <= 2 ? 'warning' : 'outline'}
            className={spotsLeft <= 2 ? 'font-bold animate-pulse' : ''}
          >
            {spotsLeft === 1 ? t('1 Θέση!', '1 Spot!') : spotsLeft + t(' Θέσεις', ' Spots')}
          </Badge>

          {groupHost && (
            <div
              className="flex flex-col items-end mr-1 mt-1"
              title={t(
                `Οργανώθηκε από ${groupHost.name} (${groupHost.trustTier})`,
                `Organized by ${groupHost.name} (${groupHost.trustTier})`,
              )}
            >
              <div className="relative">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full bg-gray-200 overflow-hidden shrink-0 border',
                    tok.avatarBorder,
                  )}
                >
                  {groupHost.photoUrl &&
                  shouldRevealMemberPhoto(event.date, event.time, group, groupHost.id, false) ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={groupHost.photoUrl}
                      alt={groupHost.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        'h-full w-full flex items-center justify-center font-bold text-xs',
                        tok.avatarFallback,
                      )}
                      title={t('Φωτογραφία μετά την επιβεβαίωση', 'Photo revealed after confirmation')}
                    >
                      {getPhotoPlaceholder(groupHost.name)}
                    </div>
                  )}
                </div>
                {groupHost.trustTier === '3_high_trust' ? (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-100 rounded-full p-0.5 border border-white">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : groupHost.trustTier === '2_confirmed' ? (
                  <div className="absolute -bottom-1 -right-1 bg-blue-100 rounded-full p-0.5 border border-white">
                    <CheckCircle className="w-3 h-3 text-blue-600" />
                  </div>
                ) : null}
              </div>
              <span className={cn('text-xs font-bold mt-1', tok.hostLabel)}>
                {t('Οικοδεσποτης', 'Host')}
              </span>
            </div>
          )}
        </div>
      </div>

      <GroupInsights group={group} className="mb-3" textClass={tok.meta} strongClass={tok.title} compact />

      {isDiscountEligible && !discountUnlockedTemp && (
        <div className="bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-amber-800 font-bold tracking-wide">
              {t('Πρόοδος έκπτωσης', 'Discount Progress')}
            </p>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-lg">
              -{event.groupDiscount!.percentage}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 bg-amber-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{
                  width: `${(group.members.length / event.groupDiscount!.minSize) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs font-bold text-amber-700">
              {membersNeededForDiscount} {t('ακόμα', 'more')}
            </span>
          </div>
        </div>
      )}

      {!isDiscountEligible && (
        <div className={cn('flex items-center gap-1.5 text-xs mb-4 p-2 rounded-lg border', tok.privateBox)}>
          <ShieldCheck className="h-4 w-4 opacity-60" />
          <span className="font-medium">{t('Μικρή & ιδιωτική ομάδα', 'Small & private group')}</span>
        </div>
      )}

      <Button
        variant="primary"
        size="sm"
        className={cn('w-full font-semibold transition-all duration-200', tok.cta)}
        onClick={(e) => {
          e.stopPropagation();
          navigate(openTarget);
        }}
      >
        {isMember
          ? t('Η βραδιά μας', 'Our night')
          : onWaitlist
            ? t('Στη λίστα αναμονής · Προβολή', 'On the waitlist · View')
            : spotsLeft <= 0
              ? t('Πλήρης · Λίστα αναμονής', 'Full · Waitlist')
              : t('Προβολή & συμμετοχή στην ομάδα', 'View & Join Group')}
      </Button>
    </div>
  );
}
