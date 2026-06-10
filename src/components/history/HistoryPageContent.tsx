import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, MapPin, Calendar, Clock, Star, CheckCircle2, Search, Filter, TrendingUp, Users, Award } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export default function HistoryPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'reviewed' | 'pending'>('all');

  const pastEvents = useMemo(() => {
    if (!currentUser) return [];
    const userEventIds = new Set(
      groups.filter((g) => g.members.includes(currentUser.id)).map((g) => g.eventId),
    );
    const now = new Date();
    let list = events.filter((e) => {
      const d = parseISO(e.date);
      return userEventIds.has(e.id) && !isNaN(d.getTime()) && d < now;
    });
    list.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
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
  }, [events, groups, currentUser, feedbackSubmitted, search, tab]);

  const totalAttended = pastEvents.length;
  const reviewedCount = pastEvents.filter((e) => feedbackSubmitted[e.id]).length;
  const ratings = pastEvents
    .map((e) => feedbackSubmitted[e.id]?.overallRating)
    .filter((r): r is number => typeof r === 'number' && r > 0);
  const avgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const peopleMet = groups
    .filter((g) => currentUser && g.members.includes(currentUser.id))
    .reduce((acc, g) => acc + Math.max(0, g.members.length - 1), 0);

  return (
    <div className="max-w-full mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Ιστορικό', 'History')}</h1>
          <p className={cn("font-medium text-sm mt-1", a.sub)}>{t('Εκδηλώσεις που έχετε παρακολουθήσει', 'Events you\'ve attended')}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn("p-3.5 text-center border", a.statBg)}>
          <TrendingUp className={cn("w-4 h-4 mx-auto mb-1", a.statVal)} />
          <p className={cn("text-xl font-black", a.head)}>{totalAttended}</p>
          <p className={cn("text-[10.5px] font-bold tracking-wide", a.muted)}>{t('Εκδηλώσεις', 'Events')}</p>
        </Card>
        <Card className={cn("p-3.5 text-center border", a.statBg)}>
          <Star className={cn("w-4 h-4 mx-auto mb-1", a.statVal)} />
          <p className={cn("text-xl font-black", a.head)}>{avgRating.toFixed(1)}</p>
          <p className={cn("text-[10.5px] font-bold tracking-wide", a.muted)}>{t('Μ.Ο. Βαθμολογία', 'Avg Rating')}</p>
        </Card>
        <Card className={cn("p-3.5 text-center border", a.statBg)}>
          <Users className={cn("w-4 h-4 mx-auto mb-1", a.statVal)} />
          <p className={cn("text-xl font-black", a.head)}>{peopleMet}</p>
          <p className={cn("text-[10.5px] font-bold tracking-wide", a.muted)}>{t('Άτομα', 'People Met')}</p>
        </Card>
        <Card className={cn("p-3.5 text-center border", a.statBg)}>
          <Award className={cn("w-4 h-4 mx-auto mb-1", a.statVal)} />
          <p className={cn("text-xl font-black", a.head)}>{reviewedCount}/{totalAttended}</p>
          <p className={cn("text-[10.5px] font-bold tracking-wide", a.muted)}>{t('Αξιολογήσεις', 'Reviews')}</p>
        </Card>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", a.muted)} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Αναζήτηση ιστορικού...', 'Search history...')}
            className={cn("w-full pl-9 pr-4 py-2 rounded-2xl border text-sm font-medium outline-none focus:ring-2 focus:ring-cyan-500 shadow-soft", a.inputBg, a.borderB)}
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
                <img
                  referrerPolicy="no-referrer"
                  src={event.imageUrl}
                  alt={event.title}
                  className={cn("w-16 h-16 rounded-2xl object-cover shrink-0 shadow-soft", a.isDark && "opacity-90")}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="neutral" className="text-[11px]">{event.category}</Badge>
                    <Badge variant="success" className="text-[11px]">{t('Ολοκληρώθηκε', 'Completed')}</Badge>
                  </div>
                  <h3 className={cn("font-bold text-[15px] truncate", a.head)}>{event.title}</h3>
                  <div className={cn("flex flex-wrap items-center gap-3 mt-1.5 text-xs font-medium", a.sub)}>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseISO(event.date), 'dd MMM yyyy')}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.locationArea}</span>
                    {feedbackSubmitted[event.id] && (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: feedbackSubmitted[event.id].overallRating }).map((_, s) => (
                          <Star key={s} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="self-center shrink-0">
                  {feedbackSubmitted[event.id] ? (
                    <span className={cn("flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full", a.isDark ? "text-green-400 bg-green-900/20" : "text-green-600 bg-green-50")}>
                      <CheckCircle2 className="w-3 h-3" />{t('Αξιολογήθηκε', 'Reviewed')}
                    </span>
                  ) : (
                    <span className={cn("flex items-center gap-1 text-[10.5px] font-bold px-2 py-1 rounded-full", a.isDark ? "text-amber-400 bg-amber-900/20" : "text-amber-600 bg-amber-50")}>
                      <Star className="w-3 h-3" />{t('Εκκρεμεί', 'Pending')}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <HistoryIcon className={cn("w-10 h-10 mx-auto mb-3", a.muted)} />
          <p className={cn("font-bold text-sm", a.head)}>
            {search ? t('Κανένα αποτέλεσμα', 'No results') : t('Δεν υπάρχει ιστορικό ακόμα', 'No history yet')}
          </p>
          <p className={cn("text-xs mt-1", a.muted)}>
            {search ? t('Δοκιμάστε διαφορετική αναζήτηση.', 'Try a different search.') : t('Οι εκδηλώσεις που θα παρακολουθήσετε θα εμφανίζονται εδώ.', 'Events you attend will appear here.')}
          </p>
        </Card>
      )}
    </div>
  );
}
