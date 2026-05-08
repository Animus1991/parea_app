import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { Card } from '../components/common/Card';
import { EventCard } from '../components/events/EventCard';
import { Badge } from '../components/common/Badge';
import { Skeleton, EventCardSkeleton } from '../components/common/Skeleton';
import { Search, ShieldCheck, Map as MapIcon, Grid, CheckCircle2, Users } from 'lucide-react';
import { parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { useLanguage } from '../lib/i18n';

export default function Home() {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchSuggestions = [t(`Πεζοπορία`, `Hiking`), t(`Επιτραπέζια`, `Board Games`), t(`Μουσικά Φεστιβάλ`, `Music Festivals`), t(`Δικτύωση`, `Networking`), t(`Συναυλίες`, `Concerts`), t(`Σινεμά`, `Cinema`)];

  // Sync state back to URL when it changes, and keep feedType 'Discover' if there's a search
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
  const [priceFilter, setPriceFilter] = useState<'All' | 'Free' | 'Paid'>('All');
  const [dateFilter, setDateFilter] = useState<'Any' | 'Today' | 'This Week' | 'This Month'>('Any');
  const [safetyFilter, setSafetyFilter] = useState<'All' | 'low' | 'medium' | 'high_trust'>('All');
  const [radiusFilter, setRadiusFilter] = useState<'Any' | '5km' | '10km' | '25km'>('Any');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [feedType, setFeedType] = useState<'For You' | 'Discover'>('For You');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [visibleEventsCount, setVisibleEventsCount] = useState<number>(6);

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

  const categoryTranslations: Record<string, string> = {
    'All': t(`Όλα`, `All`), 'Theatre': t(`Θέατρο`, `Theatre`), 'Concerts': t(`Συναυλίες`, `Concerts`), 'Cinema': t(`Σινεμά`, `Cinema`), 'Stand-up': 'Stand-up', 'Museums': t(`Μουσεία`, `Museums`),
    'Exhibitions': t(`Εκθέσεις`, `Exhibitions`), 'Festivals': t(`Φεστιβάλ`, `Festivals`), 'Board games': t(`Επιτραπέζια`, `Board Games`), 'Book clubs': t(`Λέσχη ανάγνωσης`, `Book Club`), 'Language exchange': t(`Ανταλλαγή γλωσσών`, `Language Exchange`),
    'Philosophy/Science': t(`Φιλοσοφία/Επιστήμη`, `Philosophy/Science`), 'City walks': t(`Περίπατοι`, `Walks`), 'Hiking': t(`Πεζοπορία`, `Hiking`), 'Nearby escapes': t(`Κοντινές αποδράσεις`, `Nearby getaways`),
    'Short day trips': t(`Μονοήμερες`, `Day trips`), 'Nature walks': t(`Βόλτες στη φύση`, `Nature walks`), 'Light sports': t(`Ελαφριά άθληση`, `Light sports`), 'Workshops': t(`Εργαστήρια`, `Workshops`),
    'Online events': t(`Διαδικτυακά`, `Online`), 'Community events': t(`Κοινότητα`, `Community`), 'Private events': t(`Ιδιωτικά`, `Private`)
  };

  const tagTranslations: Record<string, string> = {
    'All': t(`Όλες οι ετικέτες`, `All tags`),
    'music': t(`Μουσική`, `Music`),
    'networking': t(`Δικτύωση`, `Networking`),
    'outdoor': 'Υπαίθρια',
    'indoor': t(`Εσωτερικός χώρος`, `Indoor`),
    'social': 'Κοινωνικά',
    'learning': t(`Εκμάθηση`, `Learning`),
    'sports': 'Αθλητισμός'
  };

  const popularTags = ['All', 'music', 'networking', 'outdoor', 'indoor', 'social', 'learning', 'sports'];

  const filteredEvents = mockEvents.filter(e => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = e.title.toLowerCase().includes(q);
      const inDesc = e.description?.toLowerCase().includes(q) || false;
      const inTags = e.tags?.some(t => t.toLowerCase().includes(q)) || false;
      if (!inTitle && !inDesc && !inTags) return false;
    }

    // If 'For You', just show a subset (mocking personalization based on interests/past attendance)
    if (feedType === 'For You' && !['e4', 'e1', 'e2', 'e5'].includes(e.id)) return false;

    if (activeCategory !== 'All' && e.category !== activeCategory) return false;
    if (tagFilter !== 'All' && (!e.tags || !e.tags.includes(tagFilter))) return false;
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
      const mockDistances: Record<string, number> = {
        'e1': 1.2,
        'e2': 18.0,
        'e3': 2.8,
        'e4': 3.6,
        'e5': 150.0,
        'e6': 0.5,
      };
      
      const distance = mockDistances[e.id] || 5;
      
      if (radiusFilter === '5km' && distance > 5) return false;
      if (radiusFilter === '10km' && distance > 10) return false;
      if (radiusFilter === '25km' && distance > 25) return false;
    }
    
    return true;
  });

  const sortParam = searchParams.get('sort') || 'Relevance';
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortParam === 'Relevance') {
       return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortParam === 'Distance') {
       const mockDistances: Record<string, number> = {
          'e1': 1.2, 'e2': 18.0, 'e3': 2.8, 'e4': 3.6, 'e5': 150.0, 'e6': 0.5,
       };
       return (mockDistances[a.id] || 5) - (mockDistances[b.id] || 5);
    } else if (sortParam === 'Group Progress') {
       const spacesA = (a.maxParticipants || 40) - 12;
       const spacesB = (b.maxParticipants || 40) - 12;
       return spacesA - spacesB;
    }
    return 0;
  });

  return (
    <div className="space-y-6 md:space-y-8 pb-10 md:pb-0">
      {/* Greeting / Hero */}
      <div className="bg-[#111827] text-white p-6 md:p-10 rounded-[24px] shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative z-10 flex-1">
          <Badge variant="outline" className="text-[#18D8DB] border-[#18D8DB]/30 bg-[#18D8DB]/10 mb-4 inline-flex">
            {t('home.hero.badge', 'Νέος Τρόπος Εξόδου')}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.1] max-w-2xl">
            {t('home.hero.title1', 'Βρείτε παρέα για τις')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#18D8DB] to-cyan-400">{t('home.hero.title2', 'εμπειρίες')}</span> {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
          </h1>
          <p className="text-gray-400 font-medium text-sm md:text-base leading-relaxed max-w-xl mb-8">
            {t('home.hero.subtitle', 'Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.')}
          </p>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[11px] uppercase font-bold tracking-wider text-gray-300 mb-8">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#18D8DB]" /> {t('home.hero.stat1', 'Μικρες ομαδες')}</span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#18D8DB]" /> {t('home.hero.stat2', 'Επαληθευμενη συμμετοχη')}</span>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5 text-[#18D8DB]" /> {t('home.hero.stat3', 'Δημοσια σημεια')}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            </div></div></div></div>  );
}
