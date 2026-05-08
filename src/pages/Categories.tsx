import React, { useState, useEffect } from 'react';
import { Search, Grid, TrendingUp, Star, Map, Music, Camera, Coffee, Ticket, Gamepad2, Bookmark, ArrowRight, Calendar, Compass, Mountain, Zap, HeartHandshake, BookOpen, Languages, MapPin, Bus, Leaf, Trophy, Palette, Monitor, Users, Lock, Car, TreePine, Plane, BrainCircuit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { EventCard } from '../components/events/EventCard';
import { Skeleton, EventCardSkeleton } from '../components/common/Skeleton';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useLanguage } from "../lib/i18n";

const getCategories = (t: any) => [
  { id: '1', name: t(`Θέατρο`, `Theatre`), icon: Ticket, count: 12, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  { id: '2', name: t(`Συναυλίες`, `Concerts`), icon: Music, count: 8, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  { id: '3', name: t(`Σινεμά`, `Cinema`), icon: Camera, count: 15, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  { id: '4', name: 'Stand-up', icon: Zap, count: 4, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100' },
  { id: '5', name: t(`Μουσεία`, `Museums`), icon: Compass, count: 9, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { id: '6', name: t(`Εκθέσεις`, `Exhibitions`), icon: Palette, count: 11, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
  { id: '7', name: t(`Φεστιβάλ`, `Festivals`), icon: Star, count: 2, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
  { id: '8', name: t(`Επιτραπέζια`, `Board Games`), icon: Gamepad2, count: 18, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  { id: '9', name: t(`Λέσχη ανάγνωσης`, `Book Club`), icon: BookOpen, count: 6, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { id: '10', name: t(`Ανταλλαγή γλωσσών`, `Language Exchange`), icon: Languages, count: 14, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  { id: '11', name: t(`Φιλοσοφία/Επιστήμη`, `Philosophy/Science`), icon: BrainCircuit, count: 5, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
  { id: '12', name: t(`Περίπατοι`, `Walks`), icon: MapPin, count: 20, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
  { id: '13', name: t(`Πεζοπορία`, `Hiking`), icon: Mountain || Map, count: 32, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
  { id: '14', name: t(`Κοντινές αποδράσεις`, `Nearby getaways`), icon: Car, count: 7, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
  { id: '15', name: t(`Μονοήμερες`, `Day trips`), icon: Bus, count: 10, color: 'text-lime-600', bg: 'bg-lime-50', border: 'border-lime-100' },
  { id: '16', name: t(`Βόλτες στη φύση`, `Nature walks`), icon: TreePine || Leaf, count: 25, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: '17', name: t(`Ελαφριά άθληση`, `Light sports`), icon: Trophy, count: 19, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
  { id: '18', name: t(`Εργαστήρια`, `Workshops`), icon: Coffee, count: 16, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { id: '19', name: t(`Διαδικτυακά`, `Online`), icon: Monitor, count: 42, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  { id: '20', name: t(`Κοινότητα`, `Community`), icon: HeartHandshake, count: 28, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
  { id: '21', name: t(`Ιδιωτικά`, `Private`), icon: Lock, count: 8, color: 'text-cyan-900', bg: 'bg-cyan-50', border: 'border-cyan-200' }
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
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#111827]">
</h1>
</div>
</div>
</div>
  );
}
