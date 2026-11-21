import { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Hash, Search } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { PAGE_FILL } from '../layout/PageShell';
import { EventCard } from '../events/EventCard';
import { DiscoverCardImagePicker } from '../home/DiscoverCardImagePicker';
import { useDiscoverCardImageDepth } from '../../hooks/useDiscoverCardImageDepth';
import { EmptyState } from '../common/EmptyState';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { isEventPast, translateEventTag } from '../../lib/eventDisplay';
import {
  catalogEventTags,
  eventTagMatchCount,
  eventsForTags,
  findCataloguedTags,
  groupTagsByLetter,
  parseTagSlugs,
  tagMatchesQuery,
  tagsIndexPath,
  toggleTagSlug,
  type CataloguedTag,
} from '../../lib/eventTags';

const POPULAR_LIMIT = 6;
const TAGS_VIEW_KEY = 'nakamas-tags-view';
type TagsView = 'short' | 'detailed';

function readTagsView(): TagsView {
  try {
    return window.localStorage.getItem(TAGS_VIEW_KEY) === 'short' ? 'short' : 'detailed';
  } catch {
    return 'detailed';
  }
}

function writeTagsView(view: TagsView) {
  try {
    window.localStorage.setItem(TAGS_VIEW_KEY, view);
  } catch {
    /* ignore quota / private mode */
  }
}

function scrollToLetter(letter: string) {
  document.getElementById(`tag-letter-${letter}`)?.scrollIntoView({
    block: 'start',
    behavior: 'smooth',
  });
}

export default function TagsPageContent() {
  const { slug: pathSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { events, isLoading, isError, refetch } = useEventsResource();
  const cardImage = useDiscoverCardImageDepth();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<TagsView>(readTagsView);
  const locale = language === 'el' ? 'el' : 'en';
  const labelOf = useCallback((tag: string) => translateEventTag(tag, t), [t]);

  const catalog = useMemo(() => catalogEventTags(events), [events]);
  const selectedSlugs = useMemo(
    () => parseTagSlugs([pathSlug, ...searchParams.getAll('t')]),
    [pathSlug, searchParams],
  );
  const selectedItems = useMemo(
    () => findCataloguedTags(catalog, selectedSlugs),
    [catalog, selectedSlugs],
  );
  const visibleCatalog = useMemo(
    () => catalog.filter((item) => tagMatchesQuery(item, query, labelOf(item.tag))),
    [catalog, query, labelOf],
  );
  const searching = Boolean(query.trim());
  const popular = useMemo(
    () => (!searching ? catalog.slice(0, POPULAR_LIMIT) : []),
    [catalog, searching],
  );
  const directory = useMemo(() => {
    const popularSlugs = new Set(popular.map((item) => item.slug));
    return visibleCatalog.filter((item) => !popularSlugs.has(item.slug));
  }, [visibleCatalog, popular]);
  const letterGroups = useMemo(
    () => groupTagsByLetter(searching ? visibleCatalog : directory, labelOf, locale),
    [searching, visibleCatalog, directory, labelOf, locale],
  );
  const showLetterJump = view === 'detailed' && !searching && letterGroups.length > 3;

  const taggedEvents = useMemo(() => {
    if (selectedSlugs.length === 0) return [];
    return [...eventsForTags(events, selectedSlugs)].sort((a, b) => {
      const matchDelta = eventTagMatchCount(b, selectedSlugs) - eventTagMatchCount(a, selectedSlugs);
      if (matchDelta !== 0) return matchDelta;
      const pastA = isEventPast(a) ? 1 : 0;
      const pastB = isEventPast(b) ? 1 : 0;
      if (pastA !== pastB) return pastA - pastB;
      return a.date.localeCompare(b.date);
    });
  }, [events, selectedSlugs]);

  const selectedLabel =
    selectedItems.length === 0
      ? ''
      : selectedItems.length === 1
        ? labelOf(selectedItems[0].tag)
        : selectedItems.length === 2
          ? `${labelOf(selectedItems[0].tag)} και ${labelOf(selectedItems[1].tag)}`
          : `${selectedItems.length} ετικέτες`;
  const selectedLabelEn =
    selectedItems.length === 0
      ? ''
      : selectedItems.length === 1
        ? labelOf(selectedItems[0].tag)
        : selectedItems.length === 2
          ? `${labelOf(selectedItems[0].tag)} and ${labelOf(selectedItems[1].tag)}`
          : `${selectedItems.length} tags`;

  usePublishPageSnapshot({
    titleEl: selectedLabel || 'Ετικέτες',
    titleEn: selectedLabelEn || 'Tags',
    summaryEl:
      selectedSlugs.length > 0
        ? `${taggedEvents.length} εκδηλώσεις με αυτές τις ετικέτες`
        : `${catalog.length} ετικέτες στην πλατφόρμα`,
    summaryEn:
      selectedSlugs.length > 0
        ? `${taggedEvents.length} events with these tags`
        : `${catalog.length} tags on the platform`,
    visibleIds: taggedEvents.map((event) => event.id),
  });

  const chooseView = (next: TagsView) => {
    setView(next);
    writeTagsView(next);
  };

  const chipClass = (active: boolean) =>
    cn(
      'filter-chip max-w-none shrink-0 whitespace-nowrap px-3 text-xs font-semibold border transition-colors rounded-full',
      active
        ? 'bg-ink text-surface-raised border-ink'
        : 'bg-transparent text-ink-muted border-border hover:border-border-strong hover:text-ink',
    );

  const renderChip = (item: CataloguedTag) => {
    const active = selectedSlugs.includes(item.slug);
    const label = labelOf(item.tag);
    return (
      <Link
        key={item.slug}
        to={tagsIndexPath(toggleTagSlug(selectedSlugs, item.slug))}
        aria-pressed={active}
        aria-label={
          active
            ? t(`Αφαίρεση ${label}`, `Remove ${label}`)
            : t(`Προσθήκη ${label}, ${item.count} εκδηλώσεις`, `Add ${label}, ${item.count} events`)
        }
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

  const renderLetterRows = (tight: boolean) => (
    <div className={cn(tight ? 'space-y-1.5' : 'space-y-2.5')}>
      {letterGroups.map((group) => (
        <section
          key={group.letter}
          id={`tag-letter-${group.letter}`}
          className="flex scroll-mt-20 items-start gap-2"
          aria-label={group.letter}
        >
          <h2
            className={cn(
              'flex h-8 w-5 shrink-0 items-center justify-center text-xs font-bold text-ink-muted',
            )}
          >
            {group.letter}
          </h2>
          <div className={cn('flex min-w-0 flex-1 flex-wrap', tight ? 'gap-x-1 gap-y-3' : 'gap-x-1.5 gap-y-3')}>
            {group.tags.map(renderChip)}
          </div>
        </section>
      ))}
    </div>
  );

  const eventsBlock = selectedSlugs.length > 0 ? (
    <div id="tag-events" className="scroll-mt-24 space-y-3">
      <h2 className={cn(APP_TYPO.sectionLabel, 'text-ink-muted')}>
        {t('Εκδηλώσεις', 'Events')}
      </h2>
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
            character="explorer"
            icon={Hash}
            title={t('Δεν υπάρχουν εκδηλώσεις με αυτές τις ετικέτες', 'No events with these tags')}
            description={t(
              'Βγάλε μία ετικέτα ή διάλεξε άλλες από το ευρετήριο από κάτω.',
              'Remove a tag or pick others from the index below.',
            )}
            actionLabel={t('Όλες οι ετικέτες', 'All tags')}
            onAction={() => navigate('/tags')}
          />
        ) : (
          <>
            <DiscoverCardImagePicker depth={cardImage.depth} options={cardImage.options} onChange={cardImage.setDepth} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {taggedEvents.map((event) => (
                <EventCard key={event.id} event={event} imageDepth={cardImage.depth} />
              ))}
            </div>
          </>
        )}
      </ResourceStateGate>
    </div>
  ) : null;

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-32 md:pb-8')}>
      {selectedSlugs.length > 0 ? (
        <Link
          to="/tags"
          className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {t('Καθαρισμός ετικετών', 'Clear tags')}
        </Link>
      ) : null}

      <header className="space-y-1.5">
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Hash className="h-5 w-5 shrink-0" aria-hidden />
          {selectedSlugs.length > 0
            ? t(selectedLabel, selectedLabelEn)
            : t('Ετικέτες', 'Tags')}
        </h1>
        {selectedSlugs.length > 0 ? (
          <p className={cn(APP_TYPO.pageSub, 'text-ink-muted')}>
            {t(
              `${taggedEvents.length} ${taggedEvents.length === 1 ? 'εκδήλωση' : 'εκδηλώσεις'}`,
              `${taggedEvents.length} ${taggedEvents.length === 1 ? 'event' : 'events'}`,
            )}
          </p>
        ) : null}
        {selectedSlugs.length === 0 ? (
          <p className="text-xs font-medium text-ink-muted">
            {t(`${catalog.length} ετικέτες`, `${catalog.length} tags`)}
          </p>
        ) : selectedItems.length > 1 ? (
          <div className="flex flex-wrap gap-x-1.5 gap-y-3">{selectedItems.map(renderChip)}</div>
        ) : null}
      </header>

      {eventsBlock}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
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
        <div
          role="group"
          aria-label={t('Μορφή εμφάνισης ετικετών', 'Tag layout')}
          className="flex shrink-0 gap-1.5"
        >
          <button
            type="button"
            aria-pressed={view === 'short'}
            onClick={() => chooseView('short')}
            className={chipClass(view === 'short')}
          >
            {t('Σύντομη', 'Compact')}
          </button>
          <button
            type="button"
            aria-pressed={view === 'detailed'}
            onClick={() => chooseView('detailed')}
            className={chipClass(view === 'detailed')}
          >
            {t('Αναλυτική', 'A–Z')}
          </button>
        </div>
      </div>

      {popular.length > 0 && (
        <section aria-label={t('Δημοφιλείς ετικέτες', 'Popular tags')}>
          <h2 className={cn(APP_TYPO.sectionLabel, 'mb-2 text-ink-muted')}>
            {t('Δημοφιλείς', 'Popular')}
          </h2>
          <div className="flex flex-wrap gap-x-1.5 gap-y-3">{popular.map(renderChip)}</div>
        </section>
      )}

      {showLetterJump ? (
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
      ) : null}

      {visibleCatalog.length === 0 ? (
        <EmptyState
          character="explorer"
          icon={Search}
          title={t('Καμία ετικέτα δεν ταιριάζει', 'No tags match')}
          actionLabel={t('Καθαρισμός', 'Clear search')}
          onAction={() => setQuery('')}
        />
      ) : (
        <section aria-label={t('Όλες οι ετικέτες', 'All tags')}>
          {!searching && view === 'short' ? (
            <h2 className={cn(APP_TYPO.sectionLabel, 'mb-2 text-ink-muted')}>
              {t('Όλες', 'All')}
            </h2>
          ) : null}
          {renderLetterRows(view === 'short')}
        </section>
      )}
    </div>
  );
}
