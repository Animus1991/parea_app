import { useState } from 'react';
import { Navigation2, ShieldCheck } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { getEventDetailSurfaceTokens } from '../../lib/eventDetailDesignTokens';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';

export interface EventDetailSafetySectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailSafetySection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailSafetySectionProps) {
  const { t } = useLanguage();
  const tok = getEventDetailSurfaceTokens(accent, darkSurface);
  const currentUser = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const updateMemberLocation = useStore((s) => s.updateMemberLocation);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  const eventGroups = groups.filter((g) => g.eventId === event.id);
  const myGroup = currentUser
    ? eventGroups.find((g) => g.members.includes(currentUser.id))
    : undefined;

  const handleToggleLocation = () => {
    if (!currentUser) {
      toast.error(t('Πρέπει να συνδεθείτε', 'You must sign in'));
      return;
    }
    if (isSharingLocation) {
      setIsSharingLocation(false);
      toast.message(t('Η κοινοποίηση διακόπηκε', 'Location sharing stopped'));
      return;
    }
    if (!myGroup) {
      toast.error(
        t(
          'Πρέπει να είστε μέλος ομάδας για να μοιραστείτε τοποθεσία.',
          'You must be in a group to share location.',
        ),
      );
      return;
    }
    if (!navigator.geolocation) {
      toast.error(t('Η γεωτοποθεσία δεν υποστηρίζεται', 'Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateMemberLocation(myGroup.id, currentUser.id, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsSharingLocation(true);
        toast.success(t('Η τοποθεσία κοινοποιείται', 'Location sharing enabled'));
      },
      () => {
        toast.error(t('Αδυναμία ανάγνωσης τοποθεσίας', 'Could not read location'));
      },
    );
  };

  return (
    <div className={cn('pt-5 border-t mt-5', tok.sectionBorder, className)}>
      <div
        className={cn(
          'flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6',
          tok.card,
          tok.shadow,
        )}
      >
        <div
          className={cn(
            'flex items-start gap-3 flex-1 p-3 md:p-0 rounded-2xl border',
            tok.verifiedBg,
          )}
        >
          <ShieldCheck className={cn('w-8 h-8 shrink-0', tok.verifiedIcon)} />
          <div>
            <h3 className={cn('font-bold text-[13px]', darkSurface ? 'text-white' : 'text-[#111827]')}>
              {t('Επαληθευμένη Εκδήλωση', 'Verified Event')}
            </h3>
            <p className={cn('mt-1 text-balance leading-relaxed', tok.muted)}>
              {t(
                'Αυτή η εκδήλωση πληροί τα πρότυπα ασφάλειας και αξιοπιστίας της κοινότητάς μας.',
                'This event meets our community safety and reliability standards.',
              )}
            </p>
          </div>
        </div>

        <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 shrink-0" />

        <div className="flex-1 min-w-0">
          <h3 className={cn('font-bold flex items-center gap-2 text-[13px]', darkSurface ? 'text-white' : 'text-[#111827]')}>
            <Navigation2 className="w-4 h-4 shrink-0" />
            {t('Ασφάλεια Τοποθεσίας', 'Location Safety')}
          </h3>
          <p className={cn('mt-1 mb-3 text-balance leading-relaxed', tok.muted)}>
            {t(
              'Κοινοποιήστε τη ζωντανή τοποθεσία σας στα μέλη της ομάδας σας (μετά την ένταξη σε ομάδα).',
              'Share your live location with group members (after joining a group).',
            )}
          </p>
          <button type="button" onClick={handleToggleLocation} className={isSharingLocation ? tok.primaryBtnStop : tok.primaryBtn}>
            {isSharingLocation
              ? t('Διακοπή Κοινοποίησης', 'Stop Sharing')
              : t('Κοινοποίηση Τοποθεσίας', 'Share Live Location')}
          </button>
        </div>
      </div>
    </div>
  );
}
