import React, { useState, useEffect } from 'react';
import { Search, Grid, TrendingUp, Star, Map, Music, Camera, Coffee, Ticket, Gamepad2, Bookmark, ArrowRight, Calendar, Compass, Mountain, Zap, HeartHandshake, BookOpen, Languages, MapPin, Bus, Leaf, Trophy, Palette, Monitor, Users, Lock, Car, TreePine, Plane, BrainCircuit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EventCard } from '../components/events/EventCard';
import { Skeleton, EventCardSkeleton } from '../components/common/Skeleton';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';

import { useLanguage } from '../lib/i18n';
import { usePageContrast } from '../hooks/usePageContrast';
import { cn } from '../lib/utils';

export default function CategoriesClassic() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const p = usePageContrast();
  const events = useStore((state) => state.events);

  const ALL_CATEGORIES = [
    { id: '1', name: 'Live Music', label: t('Ζωντανή Μουσική', 'Live Music'), icon: Music, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { id: '2', name: 'Electronic Music', label: t('Ηλεκτρονική Μουσική', 'Electronic Music'), icon: Zap, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
    { id: '3', name: 'Theater & Dance', label: t('Θέατρο & Χορός', 'Theater & Dance'), icon: Ticket, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { id: '4', name: 'Cinema', label: t('Σινεμά', 'Cinema'), icon: Camera, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { id: '5', name: 'Stand-up', label: 'Stand-up', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
    { id: '6', name: 'Food & Drink', label: t('Φαγητό & Ποτό', 'Food & Drink'), icon: Coffee, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { id: '7', name: 'Museums', label: t('Μουσεία', 'Museums'), icon: Compass, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: '8', name: 'Exhibitions', label: t('Εκθέσεις', 'Exhibitions'), icon: Palette, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
    { id: '9', name: 'Workshops', label: t('Εργαστήρια', 'Workshops'), icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: '10', name: 'Sports', label: t('Αθλητισμός', 'Sports'), icon: Trophy, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    { id: '11', name: 'Social', label: t('Κοινωνικά', 'Social'), icon: Users, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { id: '12', name: 'Networking', label: t('Δικτύωση', 'Networking'), icon: HeartHandshake, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    { id: '13', name: 'Wellness', label: t('Ευεξία', 'Wellness'), icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: '14', name: 'Board games', label: t('Επιτραπέζια', 'Board Games'), icon: Gamepad2, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { id: '15', name: 'Book club', label: t('Λέσχη Ανάγνωσης', 'Book Club'), icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: '16', name: 'Language exchange', label: t('Ανταλλαγή Γλωσσών', 'Language Exchange'), icon: Languages, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { id: '17', name: 'Hiking', label: t('Πεζοπορία', 'Hiking'), icon: Mountain, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    { id: '18', name: 'Nearby escapes', label: t('Κοντινές Αποδράσεις', 'Nearby Getaways'), icon: Car, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    { id: '19', name: 'Walking tours', label: t('Ξεναγήσεις', 'Walking Tours'), icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
    { id: '20', name: 'Community events', label: t('Κοινότητα', 'Community'), icon: HeartHandshake, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid' | 'Group Discount'>('All');
  const [dateFilter, setDateFilter] = useState<'Any' | 'Today' | 'This Week' | 'This Month'>('Any');
  const [sortBy, setSortBy] = useState<'Relevance' | 'Distance' | 'Group Progress'>('Relevance');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeCategory, priceFilter, dateFilter, sortBy, searchQuery]);

  // Recalculate dynamic counts for categories
  const categoryCounts = events.reduce((acc, event) => {
    const cat = event.category || '';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const visibleCategories = ALL_CATEGORIES.map(cat => ({
    ...cat,
    count: categoryCounts[cat.name] || 0
  })).filter(cat => 
    (cat.label || cat.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = [...events].filter(e => {
    // Basic category check
    if (activeCategory && e.category !== activeCategory && !activeCategory.includes(e.category)) return false;
    if (priceFilter === 'Free' && e.isPaid) return false;
    if (priceFilter === 'Paid' && !e.isPaid) return false;
    if (priceFilter === 'Group Discount' && !e.groupDiscount) return false;
    
    if (dateFilter !== 'Any') {
      const eDate = parseISO(e.date);
      if (dateFilter === 'Today' && !isToday(eDate)) return false;
      if (dateFilter === 'This Week' && !isThisWeek(eDate)) return false;
      if (dateFilter === 'This Month' && !isThisMonth(eDate)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Group Progress') {
      const progA = (a.currentParticipants || 0) / (a.maxParticipants || 1);
      const progB = (b.currentParticipants || 0) / (b.maxParticipants || 1);
      return progB - progA;
    }
    if (sortBy === 'Distance') {
      return (a.lat ? 1 : 0) - (b.lat ? 1 : 0);
    }
    return 0; // Default Relevance
  });

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn('text-[16px] md:text-[18px] font-extrabold tracking-tight', p.head)}>{t('Κατηγορίες', 'Categories')}</h1>
          <p className={cn('font-medium text-[13px] mt-1.5', p.sub)}>{t('Εξερευνήστε όλο το φάσμα των εμπειριών μας.', 'Explore our full range of curated experiences.')}</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4', p.muted)} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('Αναζήτηση κατηγοριών...', 'Search categories...')} 
          className={cn('w-full h-11 pl-10 pr-4 rounded-full border shadow-soft focus:outline-none focus:ring-2 focus:border-transparent text-sm font-medium transition-all duration-200 hover:shadow-soft-md', p.inputBg, p.ring)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {visibleCategories.map(cat => (
          <div 
            key={cat.id} 
            className={cn('rounded-xl p-3 border shadow-soft hover:shadow-soft-md transition-all duration-200 cursor-pointer group flex flex-col items-center text-center', p.cardSurface, activeCategory === cat.name ? `ring-1 ${p.statBg}` : cn(p.borderB, p.cardHover))}
            onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
          >
            <div className={`w-10 h-10 rounded-full ${cat.bg} ${cat.border} border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
              <cat.icon className={`w-5 h-5 ${cat.color}`} />
            </div>
            <h3 className={cn('font-bold text-xs transition-colors line-clamp-1 w-full', p.head, p.hoverText)}>{cat.name}</h3>
            <p className={cn('text-[10px] font-semibold mt-1 capitalize tracking-wide', p.muted)}>{cat.count} {t('Εκδηλώσεις', 'Events')}</p>
          </div>
        ))}
      </div>
      
      {visibleCategories.length === 0 && (
         <div className={cn('text-center py-12 rounded-xl border border-dashed', p.cardSurface, p.borderB)}>
           <p className={cn('font-medium text-sm', p.muted)}>{t('Δεν βρέθηκαν κατηγορίες.', 'No categories found matching ')} "{searchQuery}".</p>
         </div>
      )}

      <div className={cn('mt-8 border-t pt-8', p.borderT)} id="events-list">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className={cn('text-sm font-bold capitalize tracking-tight shrink-0', p.head)}>
            {activeCategory ? `${activeCategory} ${t('Εκδηλώσεις', 'Events')}` : t('Όλες οι Εκδηλώσεις', 'All Events')}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 noscrollbar items-center w-full md:w-auto">
            {/* Sort Dropdown */}
            <select 
              className={cn("text-xs border rounded-xl shadow-soft focus:outline-none py-1.5 px-3 font-medium cursor-pointer h-8 shrink-0 appearance-none transition-all duration-200 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center] pr-7", p.isDark ? 'bg-[hsl(220_16%_16%)] border-white/10 text-gray-100' : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-800')}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="Relevance">{t('Συνάφεια', 'Relevance')}</option>
              <option value="Distance">{t('Απόσταση', 'Distance')}</option>
              <option value="Group Progress">{t('Πρόοδος Ομάδας', 'Group Progress')}</option>
            </select>

            <div className={cn('w-px h-6 shrink-0 mx-1', p.isDark ? 'bg-white/10' : 'bg-gray-200')}></div>

            {/* Price Pills */}
            <div className={cn('flex gap-1 shrink-0 p-0.5 rounded-full border', p.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100')}>
              {['All', 'Free', 'Paid', 'Group Discount'].map((price) => (
                <button
                  key={price}
                  onClick={() => setPriceFilter(price as any)}
                  className={cn('text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap', priceFilter === price ? cn('shadow-soft', p.isDark ? 'bg-white/15 text-white' : `bg-white ${p.statVal} border border-[#a5f3fc]/40`) : cn(p.muted, p.isDark ? 'hover:bg-white/10' : 'hover:text-gray-900 hover:bg-gray-100'))}
                >
                  {price === 'All' ? t('Όλες', 'All') : price === 'Free' ? t('Δωρεάν', 'Free') : price === 'Paid' ? t('Επί πληρωμή', 'Paid') : t('Ομαδική Έκπτωση', 'Group Discount')}
                </button>
              ))}
            </div>

            <div className={cn('w-px h-6 shrink-0 mx-1', p.isDark ? 'bg-white/10' : 'bg-gray-200')}></div>

            {/* Date Pills */}
            <div className={cn('flex gap-1 shrink-0 p-0.5 rounded-full border', p.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100')}>
              {['Any', 'Today', 'This Week', 'This Month'].map((date) => (
                <button
                  key={date}
                  onClick={() => setDateFilter(date as any)}
                  className={cn('text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap', dateFilter === date ? cn('shadow-soft', p.isDark ? 'bg-white/15 text-white' : `bg-white ${p.statVal} border border-[#a5f3fc]/40`) : cn(p.muted, p.isDark ? 'hover:bg-white/10' : 'hover:text-gray-900 hover:bg-gray-100'))}
                >
                  {date === 'Any' ? t('Οποιαδήποτε', 'Any Date') : date === 'Today' ? t('Σήμερα', 'Today') : date === 'This Week' ? t('Αυτή την εβδ.', 'This Week') : t('Αυτόν τον μήνα', 'This Month')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : filteredEvents.length === 0 ? (
            <div className={cn('col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 rounded-xl border border-dashed', p.cardSurface, p.borderB)}>
              <p className={cn('font-medium text-sm', p.muted)}>{t('Δεν βρέθηκαν εκδηλώσεις για τα κριτήριά σας.', 'No events found matching your criteria.')}</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      </div>

      <div className={cn('mt-8 rounded-xl p-6 border flex flex-col md:flex-row items-center justify-between gap-4', p.highlightRow)}>
        <div>
          <h3 className={cn('text-base font-bold', p.head)}>{t('Δεν βρίσκετε αυτό που ψάχνετε;', 'Can\'t find what you\'re looking for?')}</h3>
          <p className={cn('text-xs mt-1', p.body)}>{t('Δημιουργήστε τη δική σας εκδήλωση και συγκεντρώστε άτομα με παρόμοια ενδιαφέροντα.', 'Create your own event and gather people with similar interests.')}</p>
        </div>
        <button onClick={() => navigate('/create-event')} className="btn-gradient whitespace-nowrap shrink-0">
          {t('Δημιουργία Εκδήλωσης', 'Create Event')}
        </button>
      </div>
    </div>
  );
}
