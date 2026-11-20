import { useMemo, useState } from 'react';
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
  groupTagsByLetter,
  tagMatchesQuery,
} from '../../lib/eventTags';

const POPULAR_LIMIT = 6;

function scrollToLetter(letter: string) {
  document.getElementById(`tag-letter-${letter}`)?.scrollIntoView({
    block: 'start',
    behavior: 'smooth',
  });
}

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
    () => (query.trim() ? [] : catalog.slice(0, POPULAR_LIMIT)),
    [catalog, query],
  );
  const letterGroups = useMemo(
    () => groupTagsByLetter(visibleCatalog, labelOf, locale),
    [visibleCatalog, language],
  );
  const showLetterJump = !query.trim() && letterGroups.length > 3;

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
        title={`${label} · ${item.count}`}
        className={chipClass(active)}
      >
        <span aria-hidden className={active ? 'opacity-70' : 'text-ink-muted'}>
          #
        </span>
        {label}
      </Link>
    );
  };

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-20 md:pb-6')}>
      {slug ? (
        <Link
          to="/tags"
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t('Όλες οι ετικέτες', 'All tags')}
        </Link>
      ) : null}

      <header className="space-y-2">
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Hash className="h-5 w-5 shrink-0" aria-hidden />
          {slug ? (
            <>
              <span aria-hidden className="text-ink-muted">
                #
              </span>
              {selectedLabel || t('Ετικέτα', 'Tag')}
            </>
          ) : (
            t('Ετικέτες', 'Tags')
          )}
        </h1>
        <p className={cn(APP_TYPO.pageSub, 'text-ink-muted')}>
          {slug
            ? t(
                'Όλες οι εκδηλώσεις με αυτή την ετικέτα. Διάλεξε άλλη από το ευρετήριο από κάτω.',
                'Every event with this tag. Pick another from the index below.',
              )
            : t(
                'Ευρετήριο των ετικετών που χρησιμοποιεί η πλατφόρμα. Πάτα μία για τις εκδηλώσεις της.',
                'An index of tags used on the platform. Tap one to see its events.',
              )}
        </p>
        {slug ? (
          <p className="text-xs font-bold text-ink" aria-live="polite">
            {t(
              `${taggedEvents.length} ${taggedEvents.length === 1 ? 'εκδήλωση' : 'εκδηλώσεις'}`,
              `${taggedEvents.length} ${taggedEvents.length === 1 ? 'event' : 'events'}`,
            )}
          </p>
        ) : (
          <p className="text-xs font-bold text-ink-muted">
            {t(`${catalog.length} ετικέτες`, `${catalog.length} tags`)}
          </p>
        )}
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

      {showLetterJump && (
        <nav
          aria-label={t('Ευρετήριο γραμμάτων', 'Letter index')}
          className="flex flex-wrap gap-1"
        >
          {letterGroups.map((group) => (
            <button
              key={group.letter}
              type="button"
              onClick={() => scrollToLetter(group.letter)}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-xs font-bold text-ink-muted hover:bg-surface-raised hover:text-ink"
            >
              {group.letter}
            </button>
          ))}
        </nav>
      )}

      {visibleCatalog.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t('Καμία ετικέτα δεν ταιριάζει', 'No tags match')}
          description={t('Δοκίμασε άλλη λέξη ή καθάρισε την αναζήτηση.', 'Try another word or clear the search.')}
          actionLabel={t('Καθαρισμός', 'Clear search')}
          onAction={() => setQuery('')}
        />
      ) : query.trim() ? (
        <section aria-label={t('Αποτελέσματα ετικετών', 'Tag results')}>
          <div className="flex flex-wrap gap-1.5">{visibleCatalog.map(renderChip)}</div>
        </section>
      ) : (
        <div className="space-y-4">
          {letterGroups.map((group) => (
            <section
              key={group.letter}
              id={`tag-letter-${group.letter}`}
              className="scroll-mt-20"
              aria-label={group.letter}
            >
              <h2 className={cn(APP_TYPO.sectionLabel, 'mb-2 text-ink-muted')}>{group.letter}</h2>
              <div className="flex flex-wrap gap-1.5">{group.tags.map(renderChip)}</div>
            </section>
          ))}
        </div>
      )}

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
                  'Διάλεξε άλλη ετικέτα από το ευρετήριο.',
                  'Pick another tag from the index.',
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
      ) : (
        <p className={cn(APP_TYPO.body, 'text-ink-muted')}>
          {t('Διάλεξε μια ετικέτα για να δεις τις εκδηλώσεις της.', 'Pick a tag to see its events.')}
        </p>
      )}
    </div>
  );
}
