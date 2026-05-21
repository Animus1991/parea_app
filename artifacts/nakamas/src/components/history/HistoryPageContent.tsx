import React, { useState, useMemo } from 'react';
import { History as HistoryIcon, MapPin, Calendar, Clock, Star, CheckCircle2, Search, Filter, TrendingUp, Users, Award } from 'lucide-react';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

function useAccent() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  if (theme === 'vibrant' || theme === 'vibrant-dark') return {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-500',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    link: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    cardHover: isDark ? 'hover:border-fuchsia-700' : 'hover:border-fuchsia-200',
    statBg: isDark ? 'bg-fuchsia-900/20 border-fuchsia-800/30' : 'bg-fuchsia-50 border-fuchsia-100',
    statVal: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    inputBg: isDark ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    tabActive: isDark ? 'bg-fuchsia-900/30 text-fuchsia-400' : 'bg-fuchsia-50 text-fuchsia-700',
    tabInactive: isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600',
  };

  if (theme === 'neon' || theme === 'neon-dark' || theme === 'bento-dark') return {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-500',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    link: isDark ? 'text-emerald-400' : 'text-emerald-600',
    cardHover: isDark ? 'hover:border-emerald-700' : 'hover:border-emerald-200',
    statBg: isDark ? 'bg-emerald-900/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-100',
    statVal: isDark ? 'text-emerald-400' : 'text-emerald-600',
    inputBg: isDark ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    tabActive: isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700',
    tabInactive: isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600',
  };

  if (theme === 'bento') return {
    isDark: false,
    head: 'text-[#111827]',
    sub: 'text-gray-500',
    muted: 'text-gray-400',
    link: 'text-indigo-600',
    cardHover: 'hover:border-indigo-200',
    statBg: 'bg-indigo-50 border-indigo-100',
    statVal: 'text-indigo-600',
    inputBg: 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    tabActive: 'bg-indigo-50 text-indigo-700',
    tabInactive: 'text-gray-400 hover:text-gray-600',
  };

  // Classic
  return {
    isDark: false,
    head: 'text-[#111827]',
    sub: 'text-gray-500',
    muted: 'text-gray-400',
    link: 'text-cyan-600',
    cardHover: 'hover:border-cyan-200',
    statBg: 'bg-cyan-50 border-cyan-100',
    statVal: 'text-cyan-600',
    inputBg: 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    tabActive: 'bg-cyan-50 text-cyan-700',
    tabInactive: 'text-gray-400 hover:text-gray-600',
  };
}

export default function HistoryPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = useAccent();

  const events = useStore((s) => s.events);
  const currentUser = useStore((s) => s.currentUser);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'reviewed' | 'pending'>('all');

  // Simulated past events (first 5 events as "attended")
  const feedbackStatus: Record<string, { given: boolean; rating?: number }> = {
    'e1': { given: true, rating: 5 },
    'e2': { given: true, rating: 4 },
    'e3': { given: false },
    'e4': { given: true, rating: 3 },
    'e5': { given: false },
  };

  const pastEvents = useMemo(() => {
    let list = events.slice(0, 5);
    if (search) list = list.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'reviewed') list = list.filter(e => feedbackStatus[e.id]?.given);
    if (tab === 'pending') list = list.filter(e => !feedbackStatus[e.id]?.given);
    return list;
  }, [events, search, tab]);

  const totalAttended = 5;
  const avgRating = 4.0;
  const peopleMet = 22;
  const reviewedCount = Object.values(feedbackStatus).filter(f => f.given).length;

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
            className={cn("w-full pl-9 pr-4 py-2 rounded-xl border text-sm font-medium outline-none focus:ring-1 focus:ring-gray-300", a.inputBg)}
          />
        </div>
        <div className="flex gap-1.5">
          {([
            { key: 'all' as const, label: t('Όλα', 'All') },
            { key: 'reviewed' as const, label: t('Αξιολογημένα', 'Reviewed') },
            { key: 'pending' as const, label: t('Εκκρεμή', 'Pending') },
          ]).map(tb => (
            <button
              key={tb.key}
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
              className={cn("p-4 transition-colors cursor-pointer", a.cardHover)}
              onClick={() => navigate(`/history/feedback/${event.id}`)}
            >
              <div className="flex gap-4">
                <img
                  referrerPolicy="no-referrer"
                  src={event.imageUrl}
                  alt={event.title}
                  className={cn("w-16 h-16 rounded-xl object-cover shrink-0", a.isDark && "opacity-90")}
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
                    {feedbackStatus[event.id]?.given && feedbackStatus[event.id]?.rating && (
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: feedbackStatus[event.id]!.rating! }).map((_, s) => <Star key={s} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="self-center shrink-0">
                  {feedbackStatus[event.id]?.given ? (
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
