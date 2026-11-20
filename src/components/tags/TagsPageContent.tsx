import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Hash, Search } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { PAGE_FILL } from '../layout/PageShell';
import { EventCard } from '../events/EventCard';
import { EmptyState } from '../common/EmptyState';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { isEventPast, translateEventTag } from '../../lib/eventDisplay';
import {
  catalogEventTags,
  eventTagPath,
  eventsForTag,
  findCataloguedTag,
  tagMatchesQuery,
} from '../../lib/eventTags';

const POPULAR_LIMIT = 6;

export default function TagsPageContent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { events, isLoading, isError, refetch } = useEventsResource();
  const [query, setQuery] = useState('');
  const locale = language === 'el' ? 'el' : 'en';
  const labelOf = (tag: string) => translateEventTag(tag, t);

  const catalog = useMemo(() => catalogEventTags(events), [events]);
  const selected = findCataloguedTag(catalog, slug);
  const visibleCatalog = useMemo(
    () => catalog.filter((item) => tagMatchesQuery(item, query, labelOf(item.tag))),
    [catalog, query, language],
  );
  const popular = useMemo(
    () => (!query.trim() && !slug ? catalog.slice(0, POPULAR_LIMIT) : []),
    [catalog, query, slug],
  );
  const directory = useMemo(() => {
    const popularSlugs = new Set(popular.map((item) => item.slug));
    const rest = visibleCatalog.filter((item) => !popularSlugs.has(item.slug));
    return [...rest].sort((a, b) => labelOf(a.tag).localeCompare(labelOf(b.tag), locale));
  }, [visibleCatalog, popular, language]);
  const searchHits = useMemo(
    () => [...visibleCatalog].sort((a, b) => labelOf(a.tag).localeCompare(labelOf(b.tag), locale)),
    [visibleCatalog, language],
  );

  const taggedEvents = useMemo(() => {
    if (!slug) return [];
    return [...eventsForTag(events, slug)].sort((a, b) => {
      const pastA = isEventPast(a) ? 1 : 0;
      const pastB = isEventPast(b) ? 1 : 0;
      if (pastA !== pastB) return pastA - pastB;
      return a.date.localeCompare(b.date);
    });
  }, [events, slug]);

  const selectedLabel = selected ? labelOf(selected.tag) : slug ? labelOf(slug) : '';

  usePublishPageSnapshot({
    titleEl: selectedLabel || 'Ετικέτες',
    titleEn: selectedLabel || 'Tags',
    summaryEl: slug
      ? `${taggedEvents.length} εκδηλώσεις με αυτή την ετικέτα`
      : `${catalog.length} ετικέτες στην πλατφόρμα`,
    summaryEn: slug
      ? `${taggedEvents.length} events with this tag`
      : `${catalog.length} tags on the platform`,
    visibleIds: taggedEvents.map((event) => event.id),
  });

  useEffect(() => {
    if (!slug) return;
    const id = window.setTimeout(() => {
      document.getElementById('tag-events')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [slug]);

  const chipClass = (active: boolean) =>
    cn(
      'filter-chip max-w-none shrink-0 whitespace-nowrap px-3 text-xs font-semibold border transition-colors rounded-full',
      active
        ? 'bg-ink text-surface-raised border-ink'
        : 'bg-transparent text-ink-muted border-border hover:border-border-strong hover:text-ink',
    );

  const renderChip = (item: { tag: string; slug: string; count: number }) => {
    const active = Boolean(selected && selected.slug === item.slug);
    const label = labelOf(item.tag);
    return (
      <Link
        key={item.slug}
        to={active ? '/tags' : eventTagPath(item.tag)}
        aria-current={active ? 'page' : undefined}
        aria-label={t(`${label}, ${item.count} εκδηλώσεις`, `${label}, ${item.count} events`)}
        title={`${label} · ${item.count}`}
        className={chipClass(active)}
      >
        <span aria-hidden className={active ? 'opacity-70' : 'text-ink-muted'}>
          #
        </span>
        {label}
        <span className={cn('ml-1 tabular-nums', active ? 'opacity-70' : 'text-ink-muted')}>
          {item.count}
        </span>
      </Link>
    );
  };

  const searching = Boolean(query.trim());

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-32 md:pb-8')}>
      {slug ? (
        <Link
          to="/tags"
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t('Όλες οι ετικέτες', 'All tags')}
        </Link>
      ) : null}

      <header className="space-y-1.5">
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Hash className="h-5 w-5 shrink-0" aria-hidden />
          {slug ? selectedLabel || t('Ετικέτα', 'Tag') : t('Ετικέτες', 'Tags')}
        </h1>
        <p className={cn(APP_TYPO.pageSub, 'text-ink-muted')}>
          {slug
            ? t(
                `${taggedEvents.length} ${taggedEvents.length === 1 ? 'εκδήλωση' : 'εκδηλώσεις'}`,
                `${taggedEvents.length} ${taggedEvents.length === 1 ? 'event' : 'events'}`,
              )
            : t('Πάτα μια ετικέτα για τις εκδηλώσεις της.', 'Tap a tag to see its events.')}
        </p>
        {!slug ? (
          <p className="text-xs font-medium text-ink-muted">
            {t(`${catalog.length} ετικέτες`, `${catalog.length} tags`)}
          </p>
        ) : null}
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Αναζήτηση ετικέτας…', 'Search a tag…')}
          aria-label={t('Αναζήτηση ετικέτας', 'Search a tag')}
          className="search-control h-9 w-full rounded-xl border border-border bg-surface-raised pl-9 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {popular.length > 0 && (
        <section aria-label={t('Δημοφιλείς ετικέτες', 'Popular tags')}>
          <h2 className={cn(APP_TYPO.sectionLabel, 'mb-2 text-ink-muted')}>
            {t('Δημοφιλείς', 'Popular')}
          </h2>
          <div className="flex flex-wrap gap-1.5">{popular.map(renderChip)}</div>
        </section>
      )}

      {!slug || searching ? (
        visibleCatalog.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t('Καμία ετικέτα δεν ταιριάζει', 'No tags match')}
            description={t('Δοκίμασε άλλη λέξη ή καθάρισε την αναζήτηση.', 'Try another word or clear the search.')}
            actionLabel={t('Καθαρισμός', 'Clear search')}
            onAction={() => setQuery('')}
          />
        ) : (
          <section aria-label={t('Όλες οι ετικέτες', 'All tags')}>
            {!searching ? (
              <h2 className={cn(APP_TYPO.sectionLabel, 'mb-2 text-ink-muted')}>
                {t('Όλες', 'All')}
              </h2>
            ) : null}
            <div className="flex flex-wrap gap-1.5">
              {(searching ? searchHits : directory).map(renderChip)}
            </div>
          </section>
        )
      ) : null}

      {slug ? (
        <div id="tag-events" className="scroll-mt-24 space-y-3 border-t border-border pt-4">
          <ResourceStateGate
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            loading={
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <EventCardSkeleton key={`tag-sk-${i}`} />
                ))}
              </div>
            }
            errorTitle={t('Αδυναμία φόρτωσης εκδηλώσεων', 'Could not load events')}
          >
            {taggedEvents.length === 0 ? (
              <EmptyState
                icon={Hash}
                title={t('Δεν υπάρχουν εκδηλώσεις με αυτή την ετικέτα', 'No events with this tag')}
                description={t(
                  'Διάλεξε άλλη ετικέτα από την αναζήτηση ή γύρνα στο ευρετήριο.',
                  'Pick another tag from search or go back to the index.',
                )}
                actionLabel={t('Όλες οι ετικέτες', 'All tags')}
                onAction={() => navigate('/tags')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {taggedEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </ResourceStateGate>
        </div>
      ) : null}
    </div>
  );
}
