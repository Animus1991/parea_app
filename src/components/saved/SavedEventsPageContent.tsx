import React, { useState, useMemo } from 'react';
import { Bookmark, MapPin, Calendar, ArrowRight, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card } from '../common/Card';
import { EventCoverImg } from '../common/EventCoverImg';
import { EmptyState } from '../common/EmptyState';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { dateFnsLocale } from '../../lib/dateLocale';
import { APP_TYPO } from '../../lib/typographyTokens';
import { AppSelect } from '../common/AppSelect';
import { useCategoryLabel } from '../../hooks/useCategoryLabel';
import { formatLocationArea } from '../../lib/eventDisplay';

const NO_IDS: string[] = [];

export default function SavedEventsPageContent() {
  const { t, language } = useLanguage();
  const categoryLabel = useCategoryLabel();
  const navigate = useNavigate();
  const a = usePageContrast();

  const { events, isLoading, isError, refetch } = useEventsResource();
  const savedEventIds = useStore((s) => s.savedEvents ?? NO_IDS);
  const toggleSavedEvent = useStore((s) => s.toggleSavedEvent);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [catFilter, setCatFilter] = useState('All');

  const savedEvents = useMemo(() => {
    let list = events.filter((e) => savedEventIds.includes(e.id));
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'All') list = list.filter(e => e.category === catFilter);
    if (sortBy === 'date') list = [...list].sort((x, y) => x.date.localeCompare(y.date));
    else list = [...list].sort((x, y) => x.title.localeCompare(y.title));
    return list;
  }, [events, savedEventIds, search, sortBy, catFilter]);

  const categories = useMemo(() => {
    const cats = new Set(events.filter(e => savedEventIds.includes(e.id)).map(e => e.category));
    return ['All', ...Array.from(cats)];
  }, [events, savedEventIds]);

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn(APP_TYPO.pageTitle, a.head)}>{t('Αποθηκευμένες', 'Saved Events')}</h1>
          <p className={cn(APP_TYPO.pageSub, "mt-1", a.sub)}>
            {savedEventIds.length > 0
              ? t(`${savedEventIds.length} αποθηκευμένες εκδηλώσεις`, `${savedEventIds.length} saved events`)
              : t('Δεν υπάρχουν αποθηκευμένες εκδηλώσεις ακόμα.', 'No saved events yet.')}
          </p>
        </div>
      </div>

      {savedEventIds.length > 0 && (
        <>
          {/* Search + Sort */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", a.muted)} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('Αναζήτηση αποθηκευμένων...', 'Search saved...')}
                className={cn("search-control w-full h-9 pl-9 pr-3 rounded-xl border outline-none focus:ring-1 focus:ring-gray-300", a.inputBg)}
              />
            </div>
            <AppSelect
              ariaLabel={t("Ταξινόμηση", "Sort by")}
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'date' | 'name')}
              className={cn("filter-select border outline-none cursor-pointer", a.inputBg)}
              options={[
                { value: 'date', label: t('Ημερομηνία', 'By Date') },
                { value: 'name', label: t('Όνομα', 'By Name') },
              ]}
            />
          </div>

          {/* Category tabs */}
          {categories.length > 2 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 noscrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                    catFilter === cat ? a.tabActive : a.tabInactive
                  )}
                >
                  {cat === 'All' ? t('Όλα', 'All') : categoryLabel(cat)}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Events Grid */}
      <ResourceStateGate
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loading={
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <EventCardSkeleton key={`saved-sk-${i}`} />
            ))}
          </div>
        }
        errorTitle={t('Αδυναμία φόρτωσης αποθηκευμένων', 'Could not load saved events')}
      >
      {savedEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedEvents.map(event => (
            <Card
              key={event.id}
              className={cn("relative overflow-hidden flex flex-col group cursor-pointer transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-soft-md focus-within:ring-2 focus-within:ring-cyan-500", a.cardHover)}
            >
              <div className={cn("h-32 relative overflow-hidden shrink-0", a.isDark ? "bg-gray-700/30" : "bg-gray-200")}>
                <EventCoverImg
                  event={event}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSavedEvent(event.id);
                    toast.info(t('Αφαιρέθηκε από τα αποθηκευμένα', 'Removed from saved'), {
                      action: {
                        label: t('Αναίρεση', 'Undo'),
                        onClick: () => toggleSavedEvent(event.id),
                      },
                    });
                  }}
                  className={cn("absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-soft z-10 transition-colors", a.isDark ? "bg-gray-800/80 hover:bg-gray-700" : "bg-white hover:bg-gray-50")}
                  title={t('Αφαίρεση', 'Remove')}
                  aria-label={t('Αφαίρεση από τα αποθηκευμένα', 'Remove from saved')}
                >
                  <Bookmark className={cn("w-4 h-4 fill-current", a.statVal)} />
                </button>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className={cn("font-bold text-sm transition-colors line-clamp-2", a.head, a.isDark ? 'group-hover:text-gray-300' : 'group-hover:text-gray-600')}>
                  {/* Stretched link: the whole card opens the event, while the remove button stays a separate control. */}
                  <Link
                    to={`/events/${event.id}`}
                    className="outline-none after:absolute after:inset-0 after:content-['']"
                  >
                    {event.title}
                  </Link>
                </h3>
                <p className={cn('card-meta mt-1.5', a.muted)}>
                  {event.safetyLevel === 'high_trust'
                    ? t('Επιβεβαιωμένη ομάδα', 'Confirmed group')
                    : event.safetyLevel === 'medium'
                      ? t('Οργανωμένος host', 'Organized host')
                      : t('Δημόσιος χώρος', 'Public venue')}
                </p>
                <p className={cn('card-meta mt-auto pt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5', a.sub)}>
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{format(parseISO(event.date), 'PP', { locale: dateFnsLocale(language) })} · {event.time}</span>
                  </span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{formatLocationArea(event.locationArea, language)}</span>
                  </span>
                </p>
                <div className={cn("mt-3 pt-3 border-t flex items-center gap-1.5 card-meta font-semibold", a.isDark ? "border-gray-700/40" : "border-gray-100", a.link)}>
                  {t('Προβολή λεπτομερειών', 'View Details')} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" aria-hidden />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : savedEventIds.length > 0 && (search || catFilter !== 'All') ? (
        <EmptyState
          icon={Search}
          title={t('Κανένα αποτέλεσμα', 'No results')}
          description={t(
            'Δεν υπάρχουν αποθηκευμένες με αυτά τα φίλτρα.',
            'No saved events match these filters.',
          )}
          actionLabel={t('Καθαρισμός φίλτρων', 'Clear filters')}
          onAction={() => {
            setSearch('');
            setCatFilter('All');
          }}
        />
      ) : (
        <EmptyState
          icon={Bookmark}
          character="explorer"
          title={t('Δεν υπάρχουν αποθηκευμένες', 'No saved events yet')}
          description={t('Αποθήκευσε μια εκδήλωση για να τη βρεις εδώ.', 'Save an event to find it here.')}
          actionLabel={t('Ανακάλυψη', 'Discover')}
          onAction={() => navigate('/')}
        />
      )}
      </ResourceStateGate>
    </div>
  );
}
