import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import {
  MINI_OUTING_QUICK_PLACES,
  type MapLocation,
  type MiniOutingRadiusKm,
  type MiniOutingWhen,
} from '../../lib/miniOutings';

const WHEN: { id: MiniOutingWhen; el: string; en: string }[] = [
  { id: 'soon', el: 'Τώρα (48ω)', en: 'Now (48h)' },
  { id: 'today', el: 'Σήμερα', en: 'Today' },
  { id: 'week', el: 'Εβδομάδα', en: 'This week' },
];

const RADIUS: { id: MiniOutingRadiusKm; el: string; en: string }[] = [
  { id: 5, el: 'Κοντά (5χλμ)', en: 'Nearby (5km)' },
  { id: 10, el: 'Ως 10χλμ', en: 'Within 10km' },
  { id: 50, el: 'Πιο μακριά', en: 'Farther' },
];

const CHIP =
  'inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-bold transition-colors';

export function MiniOutingNearbyControls({
  when,
  radiusKm,
  onWhen,
  onRadius,
}: {
  when: MiniOutingWhen;
  radiusKm: MiniOutingRadiusKm;
  onWhen: (next: MiniOutingWhen) => void;
  onRadius: (next: MiniOutingRadiusKm) => void;
}) {
  const { t, language } = useLanguage();
  const location = useStore((s) => s.userSettings.mapLocation ?? null);
  const updateUserSettings = useStore((s) => s.updateUserSettings);

  const save = (next: MapLocation) => {
    updateUserSettings({ mapLocation: next });
    toast.success(t(`Θέση: ${next.label}`, `Location: ${next.label}`));
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      toast.error(t('Ο εντοπισμός δεν υποστηρίζεται σε αυτή τη συσκευή.', 'Location is not supported on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        save({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: t('Η θέση σου', 'Your location'),
          source: 'gps',
        });
      },
      () => {
        toast.message(
          t('Άνοιξε την τοποθεσία ή διάλεξε γειτονιά στον χάρτη.', 'Turn on location or pick a neighbourhood on the map.'),
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  };

  return (
    <div className="space-y-3" data-mini-outing-filters="">
      <p className="text-xs font-medium leading-relaxed text-ink-muted">
        {t(
          'Σύντομες έξοδοι δίπλα σου, για όταν έχεις ένα μικρό κενό — ακόμα και τελευταία στιγμή.',
          'Short outings next to you, for a small gap in the day — even at the last minute.',
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={useGps} className={cn(CHIP, 'border-accent bg-accent text-accent-fg')}>
          <Navigation className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {t('Η θέση μου', 'My location')}
        </button>
        {location && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink">
            <MapPin className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
            {location.label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5" role="list" aria-label={t('Γειτονιά', 'Neighbourhood')}>
        {MINI_OUTING_QUICK_PLACES.map((place) => {
          const selected = location?.label === (language === 'el' ? place.el : place.en) || location?.label === place.el;
          return (
            <button
              key={place.area}
              type="button"
              data-mini-place={place.en.toLowerCase()}
              onClick={() =>
                save({
                  lat: place.lat,
                  lng: place.lng,
                  label: t(place.el, place.en),
                  source: 'maps',
                })
              }
              className={cn(CHIP, selected ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface-raised text-ink')}
            >
              {t(place.el, place.en)}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Πότε', 'When')}>
        {WHEN.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={when === option.id}
            data-mini-when={option.id}
            onClick={() => onWhen(option.id)}
            className={cn(CHIP, when === option.id ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface-raised text-ink')}
          >
            {t(option.el, option.en)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Απόσταση', 'Distance')}>
        {RADIUS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={radiusKm === option.id}
            data-mini-radius={option.id}
            onClick={() => onRadius(option.id)}
            className={cn(CHIP, radiusKm === option.id ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface-raised text-ink')}
          >
            {t(option.el, option.en)}
          </button>
        ))}
      </div>
    </div>
  );
}
