import { RefObject, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  ShieldCheck,
  Map as MapIcon,
  Users,
  CheckCircle2,
  MapPin,
  LayoutGrid,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { HomeReturnLine } from './HomeReturnLine';
import { HomeWeatherBadge } from './HomeWeatherBadge';
export interface HomeLoggedInHeroProps {
  greeting: string;
  motivation: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchRef: RefObject<HTMLDivElement | null>;
  showSearchSuggestions: boolean;
  onSearchFocus: () => void;
  searchDropdown: ReactNode;
}

export function HomeLoggedInHero({
  greeting,
  motivation,
  searchQuery,
  onSearchChange,
  searchRef,
  showSearchSuggestions,
  onSearchFocus,
  searchDropdown,
}: HomeLoggedInHeroProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const h = useHomeTheme();
  const currentUser = useStore((s) => s.currentUser);
  const homeHeroMode = useStore((s) => s.homeHeroMode);

  const firstName = currentUser?.name?.split(' ')[0] || t('φίλε', 'there');

  const searchBlock = (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div ref={searchRef} className="relative flex-1 max-w-md overflow-visible">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-10 text-gray-500" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          placeholder={t('home.hero.search_placeholder', 'Αναζήτηση εμπειριών...')}
          className={cn(
            h.heroSearchInput,
            'hero-search-field search-control shadow-soft focus:outline-none w-full',
            homeHeroMode !== 'light' && 'pr-10',
          )}
        />
        {homeHeroMode !== 'light' && (
          <button
            type="button"
            onClick={() => navigate('/nearby')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-600 hover:text-gray-900"
            title={t('Εμφάνιση στον χάρτη', 'View on Map')}
            aria-label={t('Εμφάνιση στον χάρτη', 'View on Map')}
          >
            <MapPin className="w-4 h-4" aria-hidden />
          </button>
        )}
        {showSearchSuggestions && !searchQuery && searchDropdown}
      </div>
      {homeHeroMode === 'light' ? (
        <button
          type="button"
          onClick={() => navigate('/nearby')}
          className={cn(
            'flex items-center justify-center gap-2 px-3 h-9 rounded-xl border font-bold text-xs transition-all shadow-soft shrink-0',
            h.heroSearchInput,
          )}
          title={t('Άνοιγμα χάρτη', 'Open Map')}
        >
          <MapPin className="w-4 h-4" />
          <span className="hidden sm:inline">{t('Στον Χάρτη', 'On Map')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/help?topic=groups')}
          className={cn(
            'hidden sm:flex items-center justify-center text-xs font-semibold whitespace-nowrap px-2 min-h-9 rounded-lg underline-offset-4 hover:underline opacity-90 hover:opacity-100',
            h.heroStat,
          )}
        >
          {t('home.hero.how_groups', 'Πώς λειτουργούν οι ομάδες')}
        </button>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(h.hero, 'flex flex-col gap-4 relative')}
    >
      {homeHeroMode === 'light' && (
        <div className="relative z-10 space-y-3 md:space-y-5">
          <div className="flex justify-between items-center gap-3">
            <h1 className="text-white text-lg md:text-xl font-bold tracking-tight leading-tight truncate">
              {t('Γειά σου, ', 'Hello, ')}
              {firstName}!
            </h1>
            <HomeWeatherBadge size="sm" />
          </div>
          {searchBlock}
        </div>
      )}

      {homeHeroMode === 'balanced' && (
        <div className="relative z-10 space-y-3 md:space-y-5">
          <div className="flex justify-between items-center gap-3">
            <h1 className={cn(h.heroGreeting, 'mb-0 truncate')}>{greeting}</h1>
            <HomeWeatherBadge size="sm" />
          </div>
          <HomeReturnLine className={cn(h.heroMotivation, 'hidden md:block text-sm')} />
          {searchBlock}
        </div>
      )}

      {homeHeroMode === 'rich' && (
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h1 className={cn(h.heroGreeting, 'mb-0 truncate')}>{greeting}</h1>
              <HomeWeatherBadge size="sm" className="md:hidden" />
            </div>
            <div className="hidden md:block">
              <HomeReturnLine className={cn(h.heroMotivation, 'text-sm mb-3 mt-2')} fallback={motivation} />
              <p className={cn(h.heroTitle, 'max-w-2xl')}>
                {t('home.hero.title1', 'Βρες παρέα για τις')}{' '}
                <span className={h.heroTitleAccent}>
                  {t('home.hero.title2', 'εμπειρίες')}
                </span>{' '}
                {t('home.hero.title3', 'που ήδη θέλεις να ζήσεις.')}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
                {(
                  [
                    { icon: Users, label: t('home.hero.stat1', 'Μικρές ομάδες') },
                    { icon: ShieldCheck, label: t('home.hero.stat2', 'Επαληθευμένη συμμετοχή') },
                    { icon: MapIcon, label: t('home.hero.stat3', 'Δημόσια σημεία') },
                    { icon: CheckCircle2, label: t('Ιδιωτικές αναφορές', 'Private reports') },
                  ] as const
                ).map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className={cn('inline-flex items-center gap-1.5 text-sm font-semibold', h.heroStat)}
                  >
                    <Icon className={cn('w-3.5 h-3.5', h.heroStatIcon)} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 md:mt-0">{searchBlock}</div>
          </div>
          <div className="hidden md:flex flex-col items-center gap-1.5 shrink-0">
            <HomeWeatherBadge size="md" />
            <span className="text-2xs font-bold text-white/75 tracking-wide">
              {t('Αθήνα', 'Athens')}
            </span>
          </div>
        </div>
      )}

      <div
        className={cn(
          'absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-br rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none',
          h.heroDecor,
        )}
      />
      <LayoutGrid className="sr-only" aria-hidden />
    </motion.div>
  );
}
