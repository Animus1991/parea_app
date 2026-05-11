import React, { useState, useEffect } from 'react';
import { Search, Star, Music, Camera, Coffee, Ticket, Gamepad2, Compass, Mountain, Zap, HeartHandshake, BookOpen, Languages, MapPin, Bus, Trophy, Palette, Monitor, Users, Lock, Car, TreePine, BrainCircuit, Flame, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EventCard } from '../components/events/EventCard';
import { Skeleton, EventCardSkeleton } from '../components/common/Skeleton';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useLanguage } from "../lib/i18n";

const getCategories = (t: any) => [
  { id: '1', name: t(`Θέατρο`, `Theatre`), icon: Ticket, count: 12, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', trending: false, isNew: false },
  { id: '2', name: t(`Συναυλίες`, `Concerts`), icon: Music, count: 8, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', trending: false, isNew: false },
  { id: '3', name: t(`Σινεμά`, `Cinema`), icon: Camera, count: 15, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', trending: true, isNew: false },
  { id: '4', name: 'Stand-up', icon: Zap, count: 4, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', trending: false, isNew: false },
  { id: '5', name: t(`Μουσεία`, `Museums`), icon: Compass, count: 9, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', trending: false, isNew: false },
  { id: '6', name: t(`Εκθέσεις`, `Exhibitions`), icon: Palette, count: 11, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', trending: false, isNew: false },
  { id: '7', name: t(`Φεστιβάλ`, `Festivals`), icon: Star, count: 2, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100', trending: false, isNew: false },
  { id: '8', name: t(`Επιτραπέζια`, `Board Games`), icon: Gamepad2, count: 18, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', trending: true, isNew: false },
  { id: '9', name: t(`Λέσχη ανάγνωσης`, `Book Club`), icon: BookOpen, count: 6, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', trending: false, isNew: false },
  { id: '10', name: t(`Ανταλλαγή γλωσσών`, `Language Exchange`), icon: Languages, count: 14, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100', trending: false, isNew: false },
  { id: '11', name: t(`Φιλοσοφία/Επιστήμη`, `Philosophy/Science`), icon: BrainCircuit, count: 5, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', trending: false, isNew: true },
  { id: '12', name: t(`Περίπατοι`, `Walks`), icon: MapPin, count: 20, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', trending: true, isNew: false },
  { id: '13', name: t(`Πεζοπορία`, `Hiking`), icon: Mountain, count: 32, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', trending: true, isNew: false },
  { id: '14', name: t(`Κοντινές αποδράσεις`, `Nearby getaways`), icon: Car, count: 7, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', trending: false, isNew: false },
  { id: '15', name: t(`Μονοήμερες`, `Day trips`), icon: Bus, count: 10, color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-100', trending: false, isNew: false },
  { id: '16', name: t(`Βόλτες στη φύση`, `Nature walks`), icon: TreePine, count: 25, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', trending: false, isNew: false },
  { id: '17', name: t(`Ελαφριά άθληση`, `Light sports`), icon: Trophy, count: 19, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', trending: false, isNew: false },
  { id: '18', name: t(`Εργαστήρια`, `Workshops`), icon: Coffee, count: 16, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', trending: false, isNew: true },
  { id: '19', name: t(`Διαδικτυακά`, `Online`), icon: Monitor, count: 42, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', trending: true, isNew: false },
  { id: '20', name: t(`Κοινότητα`, `Community`), icon: HeartHandshake, count: 28, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', trending: false, isNew: false },
  { id: '21', name: t(`Ιδιωτικά`, `Private`), icon: Lock, count: 8, color: 'text-cyan-900', bg: 'bg-cyan-50', border: 'border-cyan-200', trending: false, isNew: false }
];

export default function Categories() {
    const { t } = useLanguage();
    
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid'>('All');
  const [dateFilter, setDateFilter] = useState<'Any' | 'Today' | 'This Week' | 'This Month'>('Any');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [activeCategory, priceFilter, dateFilter, searchQuery]);

  const visibleCategories = getCategories(t).filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = mockEvents.filter(e => {
    if (activeCategory && e.category !== activeCategory && !activeCategory.includes(e.category)) return false;
    if (priceFilter === 'Free' && e.isPaid) return false;
    if (priceFilter === 'Paid' && !e.isPaid) return false;
    
    if (dateFilter !== 'Any') {
      const eDate = parseISO(e.date);
      if (dateFilter === 'Today' && !isToday(eDate)) return false;
      if (dateFilter === 'This Week' && !isThisWeek(eDate)) return false;
      if (dateFilter === 'This Month' && !isThisMonth(eDate)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[22.33807213275px] md:text-[26.7902365993px] font-bold tracking-tight text-[#111827]">{t(`Κατηγορίες`, `Categories`)}</h1>
          <p className="text-gray-500 font-medium text-[13.551608211075px] md:text-[14.626916949961px] mt-1">{t(`Εξερευνήστε εκδηλώσεις ανά κατηγορία`, `Explore events by category`)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(`Αναζήτηση κατηγορίας...`, `Search category...`)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-[18px] focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {visibleCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
              className={`p-4 rounded-xl border transition-all text-left relative ${activeCategory === cat.name ? `${cat.bg} ${cat.border} ring-2 ring-offset-1 ring-cyan-200` : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
            >
              {cat.trending && (
                <span className="absolute top-2 right-2">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </span>
              )}
              {cat.isNew && (
                <span className="absolute top-2 right-2 text-[10px] font-black text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />{t(`Νέο`, `New`)}
                </span>
              )}
              <Icon className={`w-5 h-5 mb-2 ${cat.color}`} />
              <p className="text-[14.25px] font-bold text-[#111827] truncate">{cat.name}</p>
              <p className="text-[11.875px] text-gray-400 font-medium mt-0.5">{cat.count} {t(`εκδηλώσεις`, `events`)}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {activeCategory && (
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="neutral" className="text-[14.25px]">{activeCategory}</Badge>
          <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value as any)} className="text-[14.25px] border border-gray-200 rounded-lg px-2 py-1 outline-none">
            <option value="All">{t(`Όλες`, `All`)}</option>
            <option value="Free">{t(`Δωρεάν`, `Free`)}</option>
            <option value="Paid">{t(`Επί πληρωμή`, `Paid`)}</option>
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="text-[14.25px] border border-gray-200 rounded-lg px-2 py-1 outline-none">
            <option value="Any">{t(`Οποτεδήποτε`, `Any time`)}</option>
            <option value="Today">{t(`Σήμερα`, `Today`)}</option>
            <option value="This Week">{t(`Αυτή την εβδομάδα`, `This Week`)}</option>
            <option value="This Month">{t(`Αυτό τον μήνα`, `This Month`)}</option>
          </select>
        </div>
      )}

      {/* Event Results */}
      {activeCategory && (
        <div className="space-y-4">
          <h2 className="text-[18px] font-bold text-[#111827] uppercase tracking-wide">
            {filteredEvents.length} {t(`αποτελέσματα`, `results`)}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <EventCardSkeleton key={i} />)}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Compass className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[18px] text-gray-500 font-medium">{t(`Δεν βρέθηκαν εκδηλώσεις σε αυτή την κατηγορία.`, `No events found in this category.`)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
