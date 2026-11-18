import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { NakamasMini, type NakamasMiniId } from './NakamasMini';

const CAST: { id: NakamasMiniId; titleEl: string; titleEn: string; bodyEl: string; bodyEn: string }[] = [
  {
    id: 'explorer',
    titleEl: 'Ανακάλυψε',
    titleEn: 'Discover',
    bodyEl: 'Εμπειρίες που σου ταιριάζουν.',
    bodyEn: 'Experiences that fit you.',
  },
  {
    id: 'crew',
    titleEl: 'Σμίξε',
    titleEn: 'Meet',
    bodyEl: 'Μικρές παρέες, όχι πλήθη.',
    bodyEn: 'Small crews, not crowds.',
  },
  {
    id: 'host',
    titleEl: 'Διοργάνωσε',
    titleEn: 'Host',
    bodyEl: 'Άνοιξε μια βραδιά.',
    bodyEn: 'Open a night.',
  },
  {
    id: 'trust',
    titleEl: 'Εμπιστεύσου',
    titleEn: 'Trust',
    bodyEl: 'Επαλήθευση και αξιοπιστία.',
    bodyEn: 'Verification and reliability.',
  },
];

interface NakamasCastProps {
  className?: string;
  heading?: string;
}

/** Quiet 4-role legend — no card chrome, one verb each. */
export function NakamasCast({ className, heading }: NakamasCastProps) {
  const { t } = useLanguage();
  return (
    <section
      className={cn('space-y-2', className)}
      aria-label={heading ?? t('Πώς δουλεύει το Nakamas', 'How Nakamas works')}
    >
      {heading ? (
        <h2 className="text-xs font-bold tracking-wider text-ink-muted">{heading}</h2>
      ) : null}
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-3">
        {CAST.map((item) => (
          <li key={item.id} className="flex flex-col items-center text-center px-1">
            <NakamasMini id={item.id} size={48} />
            <p className="mt-1 text-2xs font-bold text-ink leading-tight">{t(item.titleEl, item.titleEn)}</p>
            <p className="mt-0.5 text-2xs font-medium leading-snug text-ink-muted">
              {t(item.bodyEl, item.bodyEn)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
