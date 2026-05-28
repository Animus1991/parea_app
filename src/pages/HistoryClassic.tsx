import React, { useState, useMemo } from 'react';
import { MapPin, Calendar, Star, CheckCircle2, ArrowUpDown, ChevronDown } from 'lucide-react';
import { format, parseISO, isBefore, subMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../lib/i18n";
import { useStore } from '../store';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { motion } from 'motion/react';

type Period = 'all' | '3m' | '6m' | '1y';
type SortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low';

const PERIODS: { id: Period; gr: string; en: string }[] = [
  { id: 'all', gr: 'Όλα', en: 'All' },
  { id: '3m', gr: '3 Μήνες', en: '3 Months' },
  { id: '6m', gr: '6 Μήνες', en: '6 Months' },
  { id: '1y', gr: '1 Χρόνος', en: '1 Year' },
];

const SORT_OPTIONS: { id: SortOption; gr: string; en: string }[] = [
  { id: 'newest', gr: 'Νεότερα πρώτα', en: 'Newest first' },
  { id: 'oldest', gr: 'Παλαιότερα πρώτα', en: 'Oldest first' },
  { id: 'rating_high', gr: 'Υψηλότερη βαθμολογία', en: 'Highest rating' },
  { id: 'rating_low', gr: 'Χαμηλότερη βαθμολογία', en: 'Lowest rating' },
];

export default function HistoryClassic() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);

  const now = new Date();

  const periodCutoff = useMemo<Date | null>(() => {
    if (period === '3m') return subMonths(now, 3);
    if (period === '6m') return subMonths(now, 6);
    if (period === '1y') return subMonths(now, 12);
    return null;
  }, [period]);

  const userGroupIds = currentUser
    ? groups.filter((g) => g.members.includes(currentUser.id)).map((g) => g.eventId)
    : [];

  const pastEvents = useMemo(() => {
    const base = events.filter((e) => {
      const d = new Date(e.date);
      if (isNaN(d.getTime())) return false;
      if (!isBefore(d, now)) return false;
      if (!userGroupIds.includes(e.id)) return false;
      if (periodCutoff && isBefore(d, periodCutoff)) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      const aRating = feedbackSubmitted[a.id]?.overallRating ?? 0;
      const bRating = feedbackSubmitted[b.id]?.overallRating ?? 0;
      if (sortOption === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortOption === 'rating_high') return bRating - aRating;
      if (sortOption === 'rating_low') return aRating - bRating;
      return 0;
    });
  }, [events, userGroupIds, periodCutoff, sortOption, feedbackSubmitted]);

  const allPastEvents = events.filter((e) => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && isBefore(d, now) && userGroupIds.includes(e.id);
  });

  const ratings = Object.values(feedbackSubmitted).map((f) => f.overallRating).filter(Boolean);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

  const peopleMet = new Set(
    groups
      .filter((g) => currentUser && g.members.includes(currentUser.id))
      .flatMap((g) => g.members.filter((m) => m !== currentUser?.id)),
  ).size;

  const currentSortLabel = SORT_OPTIONS.find((s) => s.id === sortOption);

  return (
    <div className="max-w-full mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[16px] md:text-[18px] font-bold text-[#111827]">{t('Ιστορικό', 'History')}</h1>
          <p className="text-gray-500 font-medium text-[13px] md:text-sm mt-1">
            {t('Εκδηλώσεις που έχετε παρακολουθήσει', "Events you've attended")}
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-[23px] font-black text-[#111827]">{allPastEvents.length}</p>
          <p className="text-[11.2px] text-gray-500 font-medium tracking-wide">{t('Εκδηλώσεις', 'Events')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[23px] font-black text-[#111827]">{avgRating}</p>
          <p className="text-[11.2px] text-gray-500 font-medium tracking-wide">{t('Μ.Ο. Βαθμολογία', 'Avg Rating')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[23px] font-black text-[#111827]">{peopleMet}</p>
          <p className="text-[11.2px] text-gray-500 font-medium tracking-wide">{t('Άτομα', 'People Met')}</p>
        </Card>
      </div>

      {/* Period selector + Sort controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Period tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 whitespace-nowrap ${
                period === p.id
                  ? 'bg-white text-[#111827] shadow-soft'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(p.gr, p.en)}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-600 bg-white hover:border-gray-300 transition-all"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            {t(currentSortLabel?.gr ?? '', currentSortLabel?.en ?? '')}
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg z-20 py-1 overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => { setSortOption(opt.id); setShowSortDropdown(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[12.5px] font-semibold transition-colors ${
                    sortOption === opt.id
                      ? 'bg-cyan-50 text-[#0E8B8D]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(opt.gr, opt.en)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result count */}
      <p className="text-[12px] text-gray-400 font-medium">
        {pastEvents.length} {t('εκδηλώσεις', 'events')}
        {period !== 'all' && ` · ${t(PERIODS.find((p_) => p_.id === period)?.gr ?? '', PERIODS.find((p_) => p_.id === period)?.en ?? '')}`}
      </p>

      {/* Event list */}
      <div className="space-y-3">
        {pastEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-400 text-sm font-medium">
              {t('Δεν βρέθηκαν εκδηλώσεις για αυτή την περίοδο.', 'No events found for this period.')}
            </p>
          </Card>
        ) : (
          pastEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <Card
                className="p-4 hover:border-cyan-200 transition-colors cursor-pointer"
                onClick={() => navigate(`/history/feedback/${event.id}`)}
              >
                <div className="flex gap-4">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="neutral" className="text-[12px]">{event.category}</Badge>
                      <Badge variant="success" className="text-[12px]">{t('Ολοκληρώθηκε', 'Completed')}</Badge>
                    </div>
                    <h3 className="font-bold text-[15px] text-[#111827] truncate">{event.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(parseISO(event.date), 'dd MMM yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{event.locationArea}
                      </span>
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
                      <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />{t('Αξιολογήθηκε', 'Reviewed')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3" />{t('Εκκρεμεί', 'Pending')}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
