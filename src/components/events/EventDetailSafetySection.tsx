import { useState } from 'react';
import { MapPin, Navigation2 } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { getEventDetailSurfaceTokens } from '../../lib/designTokens';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import type { Event } from '../../types';
import type { EventDetailMapAccent } from './EventDetailMapSection';
import { showNightCoordinationTools } from '../../lib/eventDisplay';

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
  const showPinShare = showNightCoordinationTools({
    inGroup: Boolean(myGroup),
    event,
    alreadyActive: isSharingLocation,
  });

  const handleToggleLocation = () => {
    if (!currentUser) {
      toast.error(t('Πρέπει να συνδεθείς', 'You must sign in'));
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
          'Πρέπει να είσαι μέλος ομάδας για να μοιραστείς τοποθεσία.',
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
        toast.success(t('Καρφιτσώθηκε η τρέχουσα θέση σου στην ομάδα.', 'Your current pin was shared with the group.'));
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
          'flex flex-col md:flex-row md:items-stretch gap-4 md:gap-4',
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
          <MapPin className={cn('w-8 h-8 shrink-0', tok.verifiedIcon)} />
          <div>
            <h3 className={cn('card-heading font-bold', darkSurface ? 'text-white' : 'text-ink')}>
              {t('Δημόσιο σημείο συνάντησης', 'Public meeting point')}
            </h3>
            <p className={cn('card-copy mt-1 text-balance leading-relaxed', tok.muted)}>
              {t(
                'Συναντιέστε σε δημόσιο χώρο. Το ακριβές σημείο φαίνεται μόνο στα επιβεβαιωμένα μέλη της ομάδας.',
                'You meet in a public place. The exact pin is visible only to confirmed group members.',
              )}
            </p>
          </div>
        </div>

        {showPinShare && (
          <>
        <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 shrink-0" />

        <div className="flex-1 min-w-0">
          <h3 className={cn('card-heading font-bold flex items-center gap-2', darkSurface ? 'text-white' : 'text-ink')}>
            <Navigation2 className="w-4 h-4 shrink-0" />
            {t('Κοινοποίηση θέσης', 'Share pin')}
          </h3>
          <p className={cn('card-copy mt-1 mb-3 text-balance leading-relaxed', tok.muted)}>
            {t(
              'Προαιρετικό: μία καρφίτσα στην ομάδα, μόνο όσο διαρκεί η έξοδος.',
              'Optional: one pin with the group, only while the outing lasts.',
            )}
          </p>
          <button type="button" onClick={handleToggleLocation} className={isSharingLocation ? tok.primaryBtnStop : tok.primaryBtn}>
            {isSharingLocation
              ? t('Αφαίρεση καρφίτσας', 'Clear pin')
              : t('Κοινοποίηση θέσης', 'Share pin')}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
