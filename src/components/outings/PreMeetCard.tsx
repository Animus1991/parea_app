import { useState } from 'react';
import { Coffee, Lock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { nearestPartnerVenues, timeMinus, venueById } from '../../lib/outings';
import { cn } from '../../lib/utils';
import type { Event, Group } from '../../types';

const KIND = { cafe: { el: 'καφέ', en: 'café' }, bar: { el: 'μπαρ', en: 'bar' }, wine_bar: { el: 'κάβα-μπαρ', en: 'wine bar' } } as const;

/**
 * «Συνάντηση πριν» (Loft, adapted): meet 30′ before at a partner place near
 * the event, with the group discount. The place shows once the group is
 * confirmed; the host picks it.
 */
export function PreMeetCard({
  group,
  event,
  isHost,
  revealed,
  showTitle = true,
}: {
  group: Group;
  event: Event;
  isHost: boolean;
  revealed: boolean;
  /** The night timeline already names the step, so the card can skip its own title. */
  showTitle?: boolean;
}) {
  const { t } = useLanguage();
  const setPreMeet = useStore((s) => s.setPreMeet);
  const [pickOpen, setPickOpen] = useState(false);
  const venue = venueById(group.preMeet?.venueId);
  const options = nearestPartnerVenues(event);
  if (!venue && !isHost) return null;

  const changePlace = (
    <button
      type="button"
      onClick={() => setPickOpen(true)}
      className="inline-flex min-h-9 items-center text-xs font-bold text-ink underline underline-offset-2"
    >
      {t('Αλλαγή μέρους', 'Change place')}
    </button>
  );

  return (
    <section
      className="rounded-2xl border border-border bg-surface-raised p-4"
      {...(showTitle ? { 'aria-labelledby': 'premeet-title' } : { 'aria-label': t('Συνάντηση πριν', 'Meet before') })}
    >
      {showTitle && (
        <h3 id="premeet-title" className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <Coffee className="h-4 w-4" aria-hidden /> {t('Συνάντηση πριν', 'Meet before')}
        </h3>
      )}
      {venue ? (
        revealed ? (
          <div className="text-sm text-ink">
            <p className="font-bold">
              {venue.name} · {timeMinus(event.time, group.preMeet!.minutesBefore)}
            </p>
            <p className="flex items-center gap-1 text-xs font-medium text-ink-muted">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {venue.address}, {venue.area.split(',')[0]}
            </p>
            <p className="mt-1 text-xs font-semibold text-ink">
              {t(`−${venue.discountPct}% με τον κωδικό της ομάδας`, `−${venue.discountPct}% with the group code`)}
              {group.code ? ` (${group.code})` : ''}
            </p>
            {/* Both quiet links on one line instead of two stacked 36 px rows. */}
            <div className="mt-1 flex flex-wrap items-center gap-x-4">
              <a
                className="inline-flex min-h-9 items-center text-xs font-bold text-ink underline underline-offset-2"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.lat},${venue.lng}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('Άνοιγμα στον χάρτη', 'Open in maps')}
              </a>
              {isHost && !pickOpen && changePlace}
            </div>
          </div>
        ) : (
          <p className="flex items-start gap-1.5 text-xs font-medium text-ink-muted">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {t(
              `Η ομάδα θα βρεθεί ${group.preMeet!.minutesBefore}′ νωρίτερα σε ${KIND[venue.kind].el} κοντά στο σημείο. Το μέρος φαίνεται με την επιβεβαίωση.`,
              `The group meets ${group.preMeet!.minutesBefore}′ earlier at a ${KIND[venue.kind].en} nearby. The place shows on confirmation.`,
            )}
          </p>
        )
      ) : (
        <p className="text-xs font-medium text-ink-muted">
          {t('Ένα ποτό ή καφές πριν σπάει τον πάγο. Διάλεξε ένα μέρος-συνεργάτη κοντά στην εκδήλωση.', 'A drink or coffee before breaks the ice. Pick a partner place near the event.')}
        </p>
      )}
      {/* With a place chosen, the list folds into «Αλλαγή μέρους» (declutter, Φ28). */}
      {isHost && venue && !pickOpen && !revealed && <div className="mt-1">{changePlace}</div>}
      {isHost && (!venue || pickOpen) && (
        <div className="mt-3">
          <p className="text-xs font-bold text-ink">{t('Μέρη-συνεργάτες κοντά', 'Partner places nearby')}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {options.map(({ venue: v, km }) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={venue?.id === v.id}
                onClick={() => {
                  const clear = venue?.id === v.id;
                  setPreMeet(group.id, clear ? null : v.id, group.preMeet?.minutesBefore ?? 30);
                  setPickOpen(false);
                  toast.success(
                    clear
                      ? t('Η συνάντηση πριν καθαρίστηκε.', 'Pre-meet cleared.')
                      : t('Συνάντηση πριν ορισμένη.', 'Pre-meet set.'),
                  );
                }}
                className={cn(
                  'inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-bold text-ink',
                  venue?.id === v.id ? 'border-ink' : 'border-border hover:border-border-strong',
                )}
              >
                {v.name}
                {km > 0 ? ` · ${km < 1 ? `${Math.round(km * 1000)} ${t('μ', 'm')}` : `${km.toFixed(1)} ${t('χλμ', 'km')}`}` : ''} · −{v.discountPct}%
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
