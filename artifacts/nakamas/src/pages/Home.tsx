import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { EventCard } from '../components/events/EventCard';
import { EventCardSkeleton } from '../components/common/Skeleton';
import { Search, ShieldCheck, Map as MapIcon, Grid, CheckCircle2, Users } from 'lucide-react';
import { parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // feedType declared first — used in the useEffect below
  const [feedType, setFeedType] = useState<'For You' | 'Discover'>('For You');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState('All');

  // Sync to 'Discover' feed when the page is loaded with a search query
  useEffect(() => {
    if (initialSearch && searchQuery === initialSearch) {
      setFeedType('Discover');
    }
  }, [initialSearch, searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val) {
      setSearchParams({ search: val });
    } else {
      setSearchParams({});
    }
  };

  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid' | 'Group Discount'>('All');
  const [dateFilter, setDateFilter] = useState<'Any' | 'Today' | 'This Week' | 'This Month'>('Any');
  const [safetyFilter, setSafetyFilter] = useState<'All' | 'low' | 'medium' | 'high_trust'>('All');
  const [radiusFilter, setRadiusFilter] = useState<'Any' | '5km' | '10km' | '25km'>('Any');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    'All', 'Theatre', 'Concerts', 'Cinema', 'Stand-up', 'Museums',
    'Exhibitions', 'Festivals', 'Board games', 'Book clubs', 'Language exchange',
    'Philosophy/Science', 'City walks', 'Hiking', 'Nearby escapes',
    'Short day trips', 'Nature walks', 'Light sports', 'Workshops',
    'Online events', 'Community events', 'Private events'
  ];

  // Memoized so filtering only runs when a dependency actually changes
  const filteredEvents = useMemo(() => {
    const mockDistances: Record<string, number> = {
      'e1': 1.2, 'e2': 18.0, 'e3': 2.8, 'e4': 3.6, 'e5': 150.0, 'e6': 0.5,
    };

    return mockEvents.filter(e => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inTitle = e.title.toLowerCase().includes(q);
        const inDesc = e.description?.toLowerCase().includes(q) ?? false;
        if (!inTitle && !inDesc) return false;
      }

      if (feedType === 'For You' && !['e4', 'e1', 'e2', 'e5'].includes(e.id)) return false;

      if (activeCategory !== 'All' && e.category !== activeCategory) return false;
      if (priceFilter === 'Free' && e.isPaid) return false;
      if (priceFilter === 'Paid' && !e.isPaid) return false;
      if (priceFilter === 'Group Discount' && !e.groupDiscount) return false;
      if (safetyFilter !== 'All' && e.safetyLevel !== safetyFilter) return false;

      if (dateFilter !== 'Any') {
        const eDate = parseISO(e.date);
        if (dateFilter === 'Today' && !isToday(eDate)) return false;
        if (dateFilter === 'This Week' && !isThisWeek(eDate)) return false;
        if (dateFilter === 'This Month' && !isThisMonth(eDate)) return false;
      }

      if (radiusFilter !== 'Any') {
        const distance = mockDistances[e.id] ?? 5;
        if (radiusFilter === '5km' && distance > 5) return false;
        if (radiusFilter === '10km' && distance > 10) return false;
        if (radiusFilter === '25km' && distance > 25) return false;
      }

      return true;
    });
  }, [searchQuery, feedType, activeCategory, priceFilter, safetyFilter, dateFilter, radiusFilter]);

  return (
    <div className="space-y-6 md:space-y-8 pb-10 md:pb-0">
      {/* Greeting / Hero */}
      <div className="bg-[#111827] text-white p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight mb-2 md:mb-3 leading-tight max-w-xl">
            Find company for the experiences you already want to live.
          </h1>
          <p className="text-gray-300 font-medium text-xs md:text-[13px] leading-relaxed max-w-lg mb-5">
            Join small organized groups for events, activities, and nearby escapes — built around shared interests, dates, and availability.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-6">
            <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Small groups</span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Verified participation where needed</span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5"><MapIcon className="w-3 h-3" /> Public meeting points</span>
            <span className="opacity-30">•</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Private reports</span>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search experiences, activities..." 
                className="w-full h-11 pl-10 pr-4 rounded-full border-none bg-white/10 text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium backdrop-blur-sm"
              />
            </div>
            <button 
              onClick={() => navigate('/trust')}
              className="hidden sm:flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-5 rounded-full text-xs font-bold transition-colors"
            >
              How groups work
            </button>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4"></div>
      </div>

      {/* User Dashboard / Alerts */}
      <section className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-3 items-center">
          <div className="bg-white p-2 text-amber-600 rounded-full shadow-sm shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-[#111827]">Pending Feedback</h3>
            <p className="text-[11px] text-gray-600 font-medium mt-0.5 leading-relaxed">Please rate the 3 members from "Comedy Night" to unlock your next booking.</p>
          </div>
        </div>
        <button onClick={() => navigate('/plans')} className="text-[11px] uppercase tracking-wider font-bold bg-[#111827] text-white px-4 py-2 rounded-full whitespace-nowrap hover:bg-black w-full sm:w-auto shadow-sm transition-colors">
          Review Event
        </button>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs mb-2.5">1</div>
          <h3 className="font-bold text-[#111827] text-[13px] mb-1">Pick an experience</h3>
          <p className="text-[11px] leading-relaxed text-gray-500 font-medium">Choose an event, hike, or activity you want to attend.</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs mb-2.5">2</div>
          <h3 className="font-bold text-[#111827] text-[13px] mb-1">Join a small group</h3>
          <p className="text-[11px] leading-relaxed text-gray-500 font-medium">Connect with 3-6 others who share the same intent and schedule.</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xs mb-2.5">3</div>
          <h3 className="font-bold text-[#111827] text-[13px] mb-1">Confirm & meet</h3>
          <p className="text-[11px] leading-relaxed text-gray-500 font-medium">Unlock the group chat, set a meeting point, and enjoy the experience.</p>
        </div>
      </section>

      {/* Categories & Full Filters */}
      <section className="space-y-4">
        <div>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Explore Categories</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar">
            {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1 rounded-full text-[11px] font-bold shadow-sm transition-colors uppercase tracking-wider ${
                activeCategory === cat 
                  ? 'bg-[#111827] text-white' 
                  : 'bg-white border border-gray-200 text-gray-500 hover:text-[#111827] hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 noscrollbar items-center">
          <select 
            className="text-xs border-gray-200 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white hover:bg-gray-50 py-1.5 px-3 font-medium outline-none cursor-pointer"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as typeof priceFilter)}
          >
            <option value="All">All Types</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
            <option value="Group Discount">Group Discount</option>
          </select>
          
          <select 
            className="text-xs border-gray-200 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white hover:bg-gray-50 py-1.5 px-3 font-medium outline-none cursor-pointer"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          >
            <option value="Any">Any Date</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>

          <select 
            className="text-xs border-gray-200 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white hover:bg-gray-50 py-1.5 px-3 font-medium outline-none cursor-pointer"
            value={safetyFilter}
            onChange={(e) => setSafetyFilter(e.target.value as typeof safetyFilter)}
          >
            <option value="All">All Comfort Levels</option>
            <option value="low">Public Spaces</option>
            <option value="medium">Organized Hosts</option>
            <option value="high_trust">Verified Groups</option>
          </select>

          <select 
            className="text-xs border-gray-200 rounded-full shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white hover:bg-gray-50 py-1.5 px-3 font-medium outline-none cursor-pointer"
            value={radiusFilter}
            onChange={(e) => setRadiusFilter(e.target.value as typeof radiusFilter)}
          >
            <option value="Any">Any Distance</option>
            <option value="5km">Within 5km</option>
            <option value="10km">Within 10km</option>
            <option value="25km">Within 25km</option>
          </select>
        </div>
      </section>

      {/* Events Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button 
              onClick={() => setFeedType('For You')} 
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${feedType === 'For You' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              For You
            </button>
            <button 
              onClick={() => setFeedType('Discover')} 
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${feedType === 'Discover' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500 hover:text-[#111827]'}`}
            >
              Discover
            </button>
          </div>
          
          <div className="flex bg-gray-100 p-0.5 rounded-lg w-fit">
            {/* Grid is always active on this page; map navigates to /nearby */}
            <button className="p-1.5 rounded-md transition-colors bg-white shadow-sm text-[#111827]">
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/nearby')}
              className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-[#111827]"
              title="Open Interactive Map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
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
      </section>
    </div>
  );
}
