import React, { useState, useEffect } from 'react';
import { Search, Grid, TrendingUp, Star, Map, Music, Camera, Coffee, Ticket, Gamepad2, Bookmark, ArrowRight, Calendar, Compass, Mountain, Zap, HeartHandshake, BookOpen, Languages, MapPin, Bus, Leaf, Trophy, Palette, Monitor, Users, Lock, Car, TreePine, Plane, BrainCircuit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EventCard } from '../components/events/EventCard';
import { Skeleton, EventCardSkeleton } from '../components/common/Skeleton';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';

const ALL_CATEGORIES = [
  { id: '1', name: 'Theatre', icon: Ticket, count: 12, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  { id: '2', name: 'Concerts', icon: Music, count: 8, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  { id: '3', name: 'Cinema', icon: Camera, count: 15, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { id: '4', name: 'Stand-up', icon: Zap, count: 4, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  { id: '5', name: 'Museums', icon: Compass, count: 9, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { id: '6', name: 'Exhibitions', icon: Palette, count: 11, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  { id: '7', name: 'Festivals', icon: Star, count: 2, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  { id: '8', name: 'Board games', icon: Gamepad2, count: 18, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  { id: '9', name: 'Book clubs', icon: BookOpen, count: 6, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { id: '10', name: 'Language exchange', icon: Languages, count: 14, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  { id: '11', name: 'Philosophy/Science', icon: BrainCircuit, count: 5, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
  { id: '12', name: 'City walks', icon: MapPin, count: 20, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  { id: '13', name: 'Hiking', icon: Mountain || Map, count: 32, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  { id: '14', name: 'Nearby escapes', icon: Car, count: 7, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  { id: '15', name: 'Short day trips', icon: Bus, count: 10, color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-100' },
  { id: '16', name: 'Nature walks', icon: TreePine || Leaf, count: 25, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: '17', name: 'Light sports', icon: Trophy, count: 19, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  { id: '18', name: 'Workshops', icon: Coffee, count: 16, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { id: '19', name: 'Online events', icon: Monitor, count: 42, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { id: '20', name: 'Community events', icon: HeartHandshake, count: 28, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  { id: '21', name: 'Private events', icon: Lock, count: 8, color: 'text-indigo-900', bg: 'bg-indigo-50', border: 'border-indigo-200' }
];

export default function Categories() {
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

  const visibleCategories = ALL_CATEGORIES.filter(cat => 
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Categories</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Explore our full range of curated experiences.</p>
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..." 
          className="w-full h-11 pl-10 pr-4 rounded-full border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium transition-shadow hover:shadow-md"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {visibleCategories.map(cat => (
          <div 
            key={cat.id} 
            className={`bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col items-center text-center ${activeCategory === cat.name ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-gray-100 hover:border-gray-200'}`}
            onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
          >
            <div className={`w-10 h-10 rounded-full ${cat.bg} ${cat.border} border flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
              <cat.icon className={`w-5 h-5 ${cat.color}`} />
            </div>
            <h3 className="font-bold text-[#111827] text-xs group-hover:text-indigo-600 transition-colors line-clamp-1 w-full">{cat.name}</h3>
            <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mt-1">{cat.count} Events</p>
          </div>
        ))}
      </div>
      
      {visibleCategories.length === 0 && (
         <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
           <p className="text-gray-500 font-medium text-sm">No categories found matching "{searchQuery}".</p>
         </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-8" id="events-list">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-[11px] font-bold text-[#111827] uppercase tracking-wide">
            {activeCategory ? `${activeCategory} Events` : 'All Events'}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar items-center">
            <select 
              className="text-xs border-gray-200 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white hover:bg-gray-50 py-1.5 px-3 font-medium outline-none cursor-pointer h-8"
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
            >
              <option value="All">Any Price</option>
              <option value="Free">Free</option>
              <option value="Paid">Paid</option>
            </select>
            
            <select 
              className="text-xs border-gray-200 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white hover:bg-gray-50 py-1.5 px-3 font-medium outline-none cursor-pointer h-8"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
            >
              <option value="Any">Any Date</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium text-sm">No events found matching your criteria.</p>
            </div>
          ) : (
            filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#111827]">Can't find what you're looking for?</h3>
          <p className="text-xs text-gray-600 mt-1">Create your own event and gather people with similar interests.</p>
        </div>
        <button className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0">
          Create Event
        </button>
      </div>
    </div>
  );
}
