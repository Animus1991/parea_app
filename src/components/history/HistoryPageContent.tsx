import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, MapPin, Calendar, Star, CheckCircle2, Search, TrendingUp, Users, Award } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import { Card } from '../common/Card';
import { EmptyState } from '../common/EmptyState';
import { EventCardSkeleton } from '../common/Skeleton';
import { ResourceStateGate } from '../common/ResourceStateGate';
import { useEventsResource } from '../../hooks/useEventsQuery';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { formatPlanWhen } from '../../lib/dateLocale';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';

function HistoryThumb({ src, title, category, isDark }: { src?: string; title: string; category: string; isDark: boolean }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div
        className={cn(
          'w-12 h-12 rounded-2xl shrink-0 shadow-soft flex items-center justify-center bg-accent-soft text-accent font-bold text-xs uppercase',
          isDark && 'opacity-90',
        )}
        aria-hidden
      >
        {category.slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      referrerPolicy="no-referrer"
      src={src}
      alt={title}
      onError={() => setBroken(true)}
      className={cn('w-12 h-12 rounded-2xl object-cover shrink-0 shadow-soft', isDark && 'opacity-90')}
    />
  );
}

export default function HistoryPageContent() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const { events, isLoading, isError, refetch } = useEventsResource();
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'reviewed' | 'pending'>('all');

  const allPastEvents = useMemo(() => {
    if (!currentUser) return [];
    const userEventIds = new Set(
      groups.filter((g) => g.members.includes(currentUser.id)).map((g) => g.eventId),
    );
    const now = new Date();
    const list = events.filter((e) => {
      const d = parseISO(e.date);
      return userEventIds.has(e.id) && !isNaN(d.getTime()) && d < now;
    });
    list.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return list;
  }, [events, groups, currentUser]);

  const pastEvents = useMemo(() => {
    let list = allPastEvents;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.locationArea.toLowerCase().includes(q),
      );
    }
    if (tab === 'reviewed') list = list.filter((e) => Boolean(feedbackSubmitted[e.id]));
    if (tab === 'pending') list = list.filter((e) => !feedbackSubmitted[e.id]);
    return list;
  }, [allPastEvents, feedbackSubmitted, search, tab]);

  const totalAttended = allPastEvents.length;
  const reviewedCount = allPastEvents.filter((e) => feedbackSubmitted[e.id]).length;
  const ratings = allPastEvents
    .map((e) => feedbackSubmitted[e.id]?.overallRating)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  const avgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const peopleMet = groups
    .filter((g) => currentUser && g.members.includes(currentUser.id))
    .reduce((acc, g) => acc + Math.max(0, g.members.length - 1), 0);

  usePublishPageSnapshot({
    titleEl: 'Ιστορικό',
    titleEn: 'History',
    state: tab,
    summaryEl: `${totalAttended} εκδηλώσεις · ${totalAttended - reviewedCount} χωρίς αξιολόγηση`,
    summaryEn: `${totalAttended} events · ${totalAttended - reviewedCount} without review`,
    visibleIds: pastEvents.slice(0, 8).map((e) => e.id),
  });

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn(APP_TYPO.pageTitle, a.head)}>{t('Ιστορικό', 'History')}</h1>
          <p className={cn(APP_TYPO.pageSub, 'mt-1', a.sub)}>{t('Εκδηλώσεις που έχετε παρακολουθήσει', 'Events you\'ve attended')}</p>
        </div>
      </div>

      {/* Summary: one quiet line; zeros become an invitation instead of empty tiles */}
      {totalAttended === 0 ? (
        <p className={cn('text-sm font-medium', a.sub)}>
          {t('Η πρώτη σου βραδιά θα εμφανιστεί εδώ.', 'Your first night will show up here.')}
        </p>
      ) : (
        <Card className={cn('px-4 py-3 border flex flex-wrap items-center gap-x-5 gap-y-2 text-sm', a.statBg)}>
          <span className={cn('inline-flex items-center gap-1.5 font-semibold', a.head)}>
            <TrendingUp className={cn('w-4 h-4', a.statVal)} aria-hidden />
            {totalAttended} {t(totalAttended === 1 ? 'εκδήλωση' : 'εκδηλώσεις', totalAttended === 1 ? 'event' : 'events')}
          </span>
          {peopleMet > 0 && (
            <span className={cn('inline-flex items-center gap-1.5 font-semibold', a.head)}>
              <Users className={cn('w-4 h-4', a.statVal)} aria-hidden />
              {peopleMet} {t('άτομα', 'people')}
            </span>
          )}
          {avgRating > 0 && (
            <span className={cn('inline-flex items-center gap-1.5 font-semibold', a.head)}>
              <Star className={cn('w-4 h-4', a.statVal)} aria-hidden />
              {avgRating.toFixed(1)}
            </span>
          )}
          <span className={cn('inline-flex items-center gap-1.5 font-semibold', a.head)}>
            <Award className={cn('w-4 h-4', a.statVal)} aria-hidden />
            {reviewedCount}/{totalAttended} {t('αξιολογήσεις', 'reviews')}
          </span>
        </Card>
      )}

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", a.muted)} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Αναζήτηση ιστορικού...', 'Search history...')}
            className={cn("search-control w-full h-9 pl-9 pr-3 rounded-xl border outline-none focus:ring-2 focus:ring-cyan-500 shadow-soft", a.inputBg, a.borderB)}
          />
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label={t('Φίλτρο ιστορικού', 'History filter')}>
          {([
            { key: 'all' as const, label: t('Όλα', 'All') },
            { key: 'reviewed' as const, label: t('Αξιολογημένα', 'Reviewed') },
            { key: 'pending' as const, label: t('Εκκρεμή', 'Pending') },
          ]).map(tb => (
            <button
              key={tb.key}
              role="tab"
              aria-selected={tab === tb.key}
              onClick={() => setTab(tb.key)}
              className={cn("whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-colors", tab === tb.key ? a.tabActive : a.tabInactive)}
            >
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <ResourceStateGate
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        loading={
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <EventCardSkeleton key={`hist-sk-${i}`} />
            ))}
          </div>
        }
        errorTitle={t('Αδυναμία φόρτωσης ιστορικού', 'Could not load history')}
      >
      {pastEvents.length > 0 ? (
        <div className="space-y-3">
          {pastEvents.map((event) => (
            <Card
              key={event.id}
              className={cn("p-4 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500", a.cardHover)}
              onClick={() => navigate(`/history/feedback/${event.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/history/feedback/${event.id}`);
                }
              }}
              aria-label={
                feedbackSubmitted[event.id]
                  ? t(`Προβολή αξιολόγησης για ${event.title}`, `View review for ${event.title}`)
                  : t(`Αξιολόγηση της εκδήλωσης ${event.title}`, `Rate the event ${event.title}`)
              }
            >
              <div className="flex gap-4">
                <HistoryThumb src={event.imageUrl} title={event.title} category={event.category} isDark={a.isDark} />
                <div className="flex-1 min-w-0">
                  <h3 className={cn(APP_TYPO.rowTitle, 'truncate', a.head)}>{event.title}</h3>
                  <p className={cn("card-meta mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5", a.sub)}>
                    <span className="capitalize">{event.category}</span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                      {formatPlanWhen(event.date, event.time, language)}
                    </span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span className="inline-flex items-center gap-1 min-w-0">
                      <MapPin className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                      <span className="truncate">{event.locationArea}</span>
                    </span>
                    {feedbackSubmitted[event.id] && (
                      <>
                        <span aria-hidden className="opacity-40">·</span>
                        <span className="inline-flex items-center gap-0.5" aria-label={t('Αξιολόγηση', 'Rating')}>
                          {Array.from({ length: feedbackSubmitted[event.id].overallRating }).map((_, s) => (
                            <Star key={s} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" aria-hidden />
                          ))}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="self-center shrink-0">
                  {feedbackSubmitted[event.id] ? (
                    <span className={cn("flex items-center gap-1 card-meta font-semibold", a.isDark ? "text-green-400" : "text-green-700")}>
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />{t('Αξιολογήθηκε', 'Reviewed')}
                    </span>
                  ) : (
                    <span className={cn("flex items-center gap-1 card-meta font-semibold", a.isDark ? "text-amber-400" : "text-amber-700")}>
                      <Star className="w-3.5 h-3.5" aria-hidden />{t('Εκκρεμεί', 'Pending')}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={HistoryIcon}
          title={
            search
              ? t('Κανένα αποτέλεσμα', 'No results')
              : tab === 'pending'
                ? t('Καμία εκκρεμής αξιολόγηση', 'No pending reviews')
                : tab === 'reviewed'
                  ? t('Καμία αξιολογημένη εκδήλωση ακόμα', 'No reviewed events yet')
                  : t('Δεν υπάρχει ιστορικό ακόμα', 'No history yet')
          }
          description={
            search
              ? t('Δοκιμάστε διαφορετική αναζήτηση.', 'Try a different search.')
              : tab === 'pending'
                ? t('Όταν τελειώσει μια βραδιά, η αξιολόγηση έρχεται εδώ.', 'When a night ends, the review lands here.')
                : tab === 'reviewed'
                  ? t('Οι αξιολογήσεις σου μένουν εδώ.', 'Your reviews stay here.')
                  : t('Όσα παρακολουθήσεις θα μείνουν εδώ.', 'Nights you attend will stay here.')
          }
          actionLabel={
            search
              ? t('Καθαρισμός', 'Clear')
              : tab === 'pending'
                ? t('Προβολή όλων', 'View all')
                : tab === 'reviewed'
                  ? t('Εξερεύνηση', 'Explore')
                  : t('Εξερεύνηση', 'Explore')
          }
          onAction={
            search
              ? () => setSearch('')
              : tab === 'pending'
                ? () => setTab('all')
                : () => navigate('/')
          }
          askAi
          askPrompt={t('Άνοιξε την εκκρεμή αξιολόγηση', 'Open my pending review')}
        />
      )}
      </ResourceStateGate>
    </div>
  );
}
