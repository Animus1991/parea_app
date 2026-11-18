import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Library } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { COLLECTIONS, collectionEvents, formingGroups } from '../../lib/outings';
import { cn } from '../../lib/utils';
import { COLLECTION_ICONS } from './collectionIcons';

/**
 * Themed collections (Fever, adapted): «Δωρεάν», «Σαββατοκύριακο», «Πρώτη φορά
 * μόνος/η», «Ήσυχες βραδιές», «Έξω στη φύση», «Nakamas Nights» — each with how
 * many groups are forming right now, which is what makes Nakamas different.
 */
export function CollectionsRail({
  className,
  title = true,
  fill = false,
}: {
  className?: string;
  title?: boolean;
  /** Stretch tiles across the main column (collections index) instead of a compact scroll strip. */
  fill?: boolean;
}) {
  const { t } = useLanguage();
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(
    () =>
      COLLECTIONS.map((c) => {
        const list = collectionEvents(c, events, groups);
        const upcoming = list.filter((e) => e.date >= today);
        const shown = upcoming.length ? upcoming : list;
        return { c, count: shown.length, forming: shown.reduce((n, e) => n + formingGroups(e, groups).length, 0) };
      }),
    [events, groups, today],
  );

  return (
    <section className={cn('space-y-2', className)} aria-labelledby={title ? 'collections-rail-title' : undefined} aria-label={title ? undefined : t('Συλλογές', 'Collections')}>
      {title && (
        <div className="flex items-center justify-between gap-2">
          <h2 id="collections-rail-title" className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink">
            <Library className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{t('Συλλογές', 'Collections')}</span>
          </h2>
          <Link to="/collections" className="inline-flex min-h-8 shrink-0 items-center gap-0.5 text-xs font-bold text-ink hover:underline">
            {t('Όλες', 'All')} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}
      <ul
        className={
          fill
            ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
            : '-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 noscrollbar'
        }
      >
        {stats.map(({ c, count, forming }) => {
          const Icon = COLLECTION_ICONS[c.id as keyof typeof COLLECTION_ICONS] ?? Library;
          return (
            <li key={c.id} className={fill ? 'min-w-0' : 'w-44 shrink-0'}>
              <Link
                to={`/collections/${c.id}`}
                className="flex h-full flex-col rounded-2xl border border-border bg-surface-raised p-3 transition-colors hover:border-border-strong"
              >
                <Icon className="h-5 w-5 text-ink" aria-hidden />
                <span className="mt-2 text-sm font-bold leading-tight text-ink">{t(c.el, c.en)}</span>
                <span className="mt-1 text-xs font-medium text-ink-muted">
                  {t(`${count} εκδηλώσεις`, `${count} events`)}
                  {forming > 0
                    ? t(` · ${forming} ${forming === 1 ? 'παρέα' : 'παρέες'}`, ` · ${forming} ${forming === 1 ? 'group' : 'groups'}`)
                    : ''}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
