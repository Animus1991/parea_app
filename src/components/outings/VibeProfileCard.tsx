import { useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { VIBE_QUESTIONS } from '../../lib/vibe';
import { Button } from '../common/Button';
import { VibeQuizModal } from './VibeQuizModal';
import { cn } from '../../lib/utils';
import { PROFILE_TYPO } from '../../lib/typographyTokens';
import type { GenderIdentity } from '../../types/outings';

const GENDERS: { id: GenderIdentity | ''; el: string; en: string }[] = [
  { id: '', el: 'Δεν το δηλώνω', en: 'Not stated' },
  { id: 'woman', el: 'Γυναίκα', en: 'Woman' },
  { id: 'man', el: 'Άνδρας', en: 'Man' },
  { id: 'non_binary', el: 'Μη δυαδικό άτομο', en: 'Non-binary' },
];

/**
 * Profile card for two optional, private-by-default answers: «Το στυλ παρέας
 * μου» (vibe quiz) and gender identity — used only to open women &
 * non-binary groups to the people they are meant for.
 */
export function VibeProfileCard({ className }: { className?: string }) {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const setVibe = useStore((s) => s.setVibe);
  const setGender = useStore((s) => s.setGenderIdentity);
  const [open, setOpen] = useState(false);
  if (!me) return null;
  const vibe = me.vibe;

  return (
    <section className={cn('rounded-2xl border border-border bg-surface-raised p-4', className)} aria-labelledby="vibe-card-title">
      <h2 id="vibe-card-title" className={cn('flex items-center gap-2 text-ink', PROFILE_TYPO.nestedCardTitle)}>
        <HeartHandshake className="h-4 w-4" aria-hidden /> {t('Το στυλ παρέας μου', 'My group style')}
      </h2>
      {vibe ? (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {VIBE_QUESTIONS.map((q) => {
            const o = q.options.find((x) => x.value === vibe[q.key]);
            return o ? (
              <li key={q.key} className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-ink">
                {t(o.el, o.en)}
              </li>
            ) : null;
          })}
        </ul>
      ) : (
        <p className={cn('mt-1 text-ink-muted', PROFILE_TYPO.rowMeta)}>
          {t('5 γρήγορες ερωτήσεις για να βλέπεις «γιατί ταιριάζετε» σε κάθε ομάδα.', '5 quick questions so you see “why you match” on every group.')}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant={vibe ? 'outline' : 'primary'} onClick={() => setOpen(true)}>
          {vibe ? t('Αλλαγή απαντήσεων', 'Change answers') : t('Κάνε το κουίζ (1′)', 'Take the quiz (1 min)')}
        </Button>
        {vibe && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setVibe(null);
              toast.message(t('Το στυλ παρέας διαγράφηκε', 'Group style cleared'));
            }}
          >
            {t('Διαγραφή', 'Clear')}
          </Button>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <label htmlFor="gender-identity" className={cn('flex items-center gap-2 text-ink', PROFILE_TYPO.fieldLabel)}>
          <HeartHandshake className="h-4 w-4" aria-hidden /> {t('Ταυτότητα φύλου (προαιρετικό)', 'Gender identity (optional)')}
        </label>
        <select
          id="gender-identity"
          value={me.gender && me.gender !== 'undisclosed' ? me.gender : ''}
          onChange={(e) => {
            const next = (e.target.value || undefined) as GenderIdentity | undefined;
            setGender(next);
            toast.message(
              next
                ? t('Η ταυτότητα φύλου ενημερώθηκε (μόνο για ομάδες).', 'Gender identity updated (groups only).')
                : t('Η ταυτότητα φύλου αφαιρέθηκε.', 'Gender identity removed.'),
            );
          }}
          className={cn('mt-1.5 min-h-10 w-full rounded-xl border border-border bg-surface px-3 text-ink', PROFILE_TYPO.fieldControl)}
          aria-describedby="gender-identity-help"
        >
          {GENDERS.map((g) => (
            <option key={g.id} value={g.id}>
              {t(g.el, g.en)}
            </option>
          ))}
        </select>
        <p id="gender-identity-help" className={cn('mt-1 text-ink-muted', PROFILE_TYPO.fieldHelp)}>
          {t(
            'Δεν εμφανίζεται πουθενά στο προφίλ σου. Χρησιμεύει μόνο για να μπαίνεις σε ομάδες «Γυναίκες & μη δυαδικά άτομα».',
            'It is never shown on your profile. It is only used to let you into “Women & non-binary” groups.',
          )}
        </p>
      </div>
      {open && <VibeQuizModal open={open} onClose={() => setOpen(false)} />}
    </section>
  );
}
