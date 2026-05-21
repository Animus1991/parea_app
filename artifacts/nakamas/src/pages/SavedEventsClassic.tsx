import React, { useState } from 'react';
import { Bookmark, MapPin, Calendar, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Badge } from '../components/common/Badge';
import { useLanguage } from '../lib/i18n';

export default function SavedEventsClassic() {
  const { t } = useLanguage();
  const events = useStore((state) => state.events);
  const savedEventIds = useStore((state) => state.savedEvents);
  const toggleSavedEvent = useStore((state) => state.toggleSavedEvent);
  const savedEvents = events.filter((e) => savedEventIds.includes(e.id));

  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState<'date_asc' | 'date_desc'>('date_asc');

  const categories = [...new Set(savedEvents.map(e => e.category))].filter(Boolean);

  const filtered = savedEvents
    .filter(e => !selectedCategory || e.category === selectedCategory)
    .sort((a, b) => {
      const da = parseISO(a.date).getTime();
      const db = parseISO(b.date).getTime();
      return sortOrder === 'date_asc' ? da - db : db - da;
    });

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">{t('Αποθηκευμένα', 'Saved Events')}</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">{t('Εμπειρίες που έχετε προσθέσει στους σελιδοδείκτες σας.', "Experiences you've bookmarked for later.")}</p>
        </div>
        {savedEvents.length > 0 && (
          <button
            onClick={() => setSortOrder(s => s === 'date_asc' ? 'date_desc' : 'date_asc')}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {sortOrder === 'date_asc' ? t('Ημερ. ↑', 'Date ↑') : t('Ημερ. ↓', 'Date ↓')}
          </button>
        )}
      </div>

      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto noscrollbar pb-1">
          <button
            onClick={() => setSelectedCategory('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${!selectedCategory ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            {t('Όλα', 'All')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedCategory === cat ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(event => (
            <Link key={event.id} to={`/events/${event.id}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="h-32 bg-gray-200 relative overflow-hidden shrink-0">
                <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSavedEvent(event.id); }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#111827] shadow-sm z-10"
                  aria-label={t('Κατάργηση αποθήκευσης', 'Unsave event')}
                >
                  <Bookmark className="w-4 h-4 fill-current text-cyan-600" />
                </button>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-2">
                  <Badge variant={event.safetyLevel === 'high_trust' ? 'warning' : 'outline'}>
                    {event.safetyLevel === 'high_trust' ? t('Υψηλή Εμπιστοσύνη', 'High Trust Req.') : event.safetyLevel === 'medium' ? t('Μεσαία Εμπιστοσύνη', 'Medium Trust') : t('Χαμηλό Ρίσκο • Δημόσια', 'Low Risk • Public')}
                  </Badge>
                </div>
                <h3 className="font-bold text-sm text-[#111827] group-hover:text-cyan-600 transition-colors line-clamp-2 mb-2">{event.title}</h3>

                <div className="mt-auto space-y-1.5">
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">{format(parseISO(event.date), 'MMM d, yyyy')} • {event.time}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">{event.locationArea}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-[10px] font-bold text-cyan-600 tracking-wider">
                  {t('Προβολή Λεπτομερειών', 'View Details')} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : savedEvents.length > 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 font-medium text-sm">{t('Δεν βρέθηκαν αποθηκευμένα σε αυτή την κατηγορία.', 'No saved events in this category.')}</p>
          <button onClick={() => setSelectedCategory('')} className="mt-3 text-xs font-bold text-cyan-600 hover:underline">
            {t('Εκκαθάριση φίλτρου', 'Clear filter')}
          </button>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Bookmark className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-[#111827]">{t('Δεν υπάρχουν αποθηκευμένες εκδηλώσεις', 'No saved events yet')}</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{t('Όταν δείτε μια εκδήλωση που σας αρέσει, προσθέστε τη στους σελιδοδείκτες σας.', "When you see an event you like, bookmark it to find it easily later.")}</p>
          <Link to="/" className="inline-flex items-center justify-center px-4 py-2 mt-4 bg-cyan-600 text-white text-xs font-bold rounded-full shadow-sm hover:bg-cyan-700 transition-colors">
            {t('Ανακαλύψτε Εκδηλώσεις', 'Discover Events')}
          </Link>
        </div>
      )}
    </div>
  );
}
