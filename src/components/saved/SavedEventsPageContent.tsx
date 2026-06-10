import React, { useState, useMemo } from 'react';
import { Bookmark, MapPin, Calendar, Users, ArrowRight, Search, SlidersHorizontal, BookmarkX, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useNavigate, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export default function SavedEventsPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const events = useStore((s) => s.events);
  const savedEventIds = useStore((s) => s.savedEvents) || [];
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
    <div className="max-w-full mx-auto space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Αποθηκευμένα', 'Saved Events')}</h1>
          <p className={cn("font-medium text-sm mt-1", a.sub)}>
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
                className={cn("w-full pl-9 pr-4 py-2 rounded-2xl border text-sm font-medium outline-none focus:ring-1 focus:ring-gray-300", a.inputBg)}
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'date' | 'name')}
              className={cn("px-3 py-2 rounded-2xl border text-sm font-medium outline-none cursor-pointer", a.inputBg)}
            >
              <option value="date">{t('Ημερομηνία', 'By Date')}</option>
              <option value="name">{t('Όνομα', 'By Name')}</option>
            </select>
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
                  {cat === 'All' ? t('Όλα', 'All') : cat}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Events Grid */}
      {savedEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedEvents.map(event => (
            <Card
              key={event.id}
              className={cn("overflow-hidden flex flex-col group cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-cyan-500", a.cardHover)}
              onClick={() => navigate(`/events/${event.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/events/${event.id}`);
                }
              }}
              aria-label={t(`Άνοιγμα εκδήλωσης ${event.title}`, `Open event ${event.title}`)}
            >
              <div className={cn("h-32 relative overflow-hidden shrink-0", a.isDark ? "bg-gray-700/30" : "bg-gray-200")}>
                <img
                  referrerPolicy="no-referrer"
                  src={event.imageUrl}
                  alt={event.title}
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
                <div className="mb-2">
                  <Badge variant={event.safetyLevel === 'high_trust' ? 'warning' : 'outline'}>
                    {event.safetyLevel === 'high_trust' ? t('Υψηλή Εμπιστοσύνη', 'High Trust') : event.safetyLevel === 'medium' ? t('Μεσαία', 'Medium Trust') : t('Δημόσια', 'Public')}
                  </Badge>
                </div>
                <h3 className={cn("font-bold text-sm transition-colors line-clamp-2 mb-2", a.head, a.isDark ? 'group-hover:text-gray-300' : 'group-hover:text-gray-600')}>
                  {event.title}
                </h3>
                <div className="mt-auto space-y-1.5">
                  <div className={cn("flex items-center text-xs font-medium", a.sub)}>
                    <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">{format(parseISO(event.date), 'MMM d, yyyy')} • {event.time}</span>
                  </div>
                  <div className={cn("flex items-center text-xs font-medium", a.sub)}>
                    <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">{event.locationArea}</span>
                  </div>
                </div>
                <div className={cn("mt-3 pt-3 border-t flex items-center gap-1.5 text-[10px] font-bold tracking-wider", a.isDark ? "border-gray-700/40" : "border-gray-100", a.link)}>
                  {t('Προβολή Λεπτομερειών', 'View Details')} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : savedEventIds.length > 0 && search ? (
        <Card className="p-8 text-center">
          <Search className={cn("w-10 h-10 mx-auto mb-3", a.muted)} />
          <p className={cn("font-bold text-sm", a.head)}>{t('Κανένα αποτέλεσμα', 'No results')}</p>
          <p className={cn("text-xs mt-1", a.muted)}>{t('Δοκιμάστε διαφορετική αναζήτηση.', 'Try a different search term.')}</p>
        </Card>
      ) : (
        <div className={cn("text-center py-16 rounded-2xl border border-dashed", a.bankBg)}>
          <Bookmark className={cn("mx-auto h-10 w-10 mb-3", a.muted)} />
          <h3 className={cn("text-base font-bold", a.head)}>{t('Δεν υπάρχουν αποθηκευμένες', 'No saved events yet')}</h3>
          <p className={cn("text-sm mt-1 max-w-sm mx-auto", a.muted)}>
            {t('Προσθέστε εκδηλώσεις στους σελιδοδείκτες σας για εύκολη πρόσβαση.', 'Bookmark events to find them easily later.')}
          </p>
          <Link
            to="/"
            className={cn("inline-flex items-center justify-center px-4 py-2 mt-4 text-white text-xs font-bold rounded-full shadow-soft transition-colors", a.contactBtn)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {t('Ανακαλύψτε Εκδηλώσεις', 'Discover Events')}
          </Link>
        </div>
      )}
    </div>
  );
}
