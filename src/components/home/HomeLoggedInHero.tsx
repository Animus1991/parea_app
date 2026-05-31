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
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { HomeHeroModeBar } from './HomeHeroModeBar';

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
  const score = Math.round(currentUser?.reliabilityScore ?? 0);

  const searchBlock = (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 z-10 opacity-70" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          placeholder={t('home.hero.search_placeholder', 'Αναζήτηση εμπειριών...')}
          className={cn(
            h.heroSearchInput,
            'text-sm font-medium shadow-soft focus:outline-none backdrop-blur-sm w-full',
          )}
        />
        {showSearchSuggestions && !searchQuery && searchDropdown}
      </div>
      {homeHeroMode === 'light' ? (
        <button
          type="button"
          onClick={() => navigate('/nearby')}
          className={cn(
            'flex items-center justify-center gap-2 px-4 h-11 rounded-2xl border font-bold text-sm transition-all shadow-soft shrink-0',
            h.heroSearchInput,
          )}
          title={t('Άνοιγμα Χάρτη', 'Open Map')}
        >
          <MapPin className="w-5 h-5" />
          <span className="hidden sm:inline">{t('Στον Χάρτη', 'On Map')}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate('/trust')}
          className={cn(
            'hidden sm:flex items-center justify-center text-xs font-bold transition-all duration-200 whitespace-nowrap',
            h.heroOutlineBtn,
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
      className={cn(h.hero, 'flex flex-col gap-6 relative')}
    >
      <HomeHeroModeBar className="relative z-10" />

      {homeHeroMode === 'light' && (
        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className={cn(h.heroGreeting, 'text-xl md:text-2xl font-black mb-1')}>
                {t('Γειά σου, ', 'Hello, ')}
                {firstName}!
              </h1>
              <p className={cn(h.heroSubtitle, 'text-sm font-medium max-w-md')}>
                {t(
                  'Ανακαλύψτε τις καλύτερες εκδηλώσεις γύρω σας.',
                  'Discover the best events around you.',
                )}
              </p>
            </div>
            {currentUser && (
              <div
                title={t('Η βαθμολογία αξιοπιστίας σας', 'Your reliability score')}
                className="w-12 h-12 rounded-full border-2 border-white bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-soft shrink-0"
              >
                {score}
              </div>
            )}
          </div>
          {searchBlock}
        </div>
      )}

      {homeHeroMode === 'balanced' && (
        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <p className={h.heroGreeting}>{greeting}</p>
              <p className={cn(h.heroMotivation, 'text-sm')}>{motivation}</p>
              <h1 className={cn(h.heroTitle, 'text-lg md:text-xl max-w-2xl')}>
                {t('home.hero.title1', 'Βρείτε παρέα για τις')}{' '}
                <span className={h.heroTitleAccent}>
                  {t('home.hero.title2', 'εμπειρίες')}
                </span>{' '}
                {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
              </h1>
            </div>
            {currentUser && (
              <div className="w-11 h-11 rounded-full border-2 border-white/80 bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-soft shrink-0">
                {score}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Users, label: t('home.hero.stat1', 'Μικρές ομάδες') },
              { icon: ShieldCheck, label: t('home.hero.stat2', 'Επαληθευμένη συμμετοχή') },
              { icon: MapIcon, label: t('home.hero.stat3', 'Δημόσια σημεία') },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold bg-white/10 border border-white/10',
                  h.heroStat,
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', h.heroStatIcon)} />
                {label}
              </span>
            ))}
          </div>
          {searchBlock}
        </div>
      )}

      {homeHeroMode === 'rich' && (
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <p className={cn(h.heroGreeting, 'mb-1')}>{greeting}</p>
            <p className={cn(h.heroMotivation, 'mb-4')}>{motivation}</p>
            <h1 className={cn(h.heroTitle, 'max-w-2xl')}>
              {t('home.hero.title1', 'Βρείτε παρέα για τις')}{' '}
              <span className={h.heroTitleAccent}>
                {t('home.hero.title2', 'εμπειρίες')}
              </span>{' '}
              {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
            </h1>
            <p className={cn(h.heroSubtitle, 'max-w-xl mb-6')}>
              {t(
                'home.hero.subtitle',
                'Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.',
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-6">
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
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12.5px] font-bold tracking-wide bg-white/10 border border-white/10 backdrop-blur-sm',
                    h.heroStat,
                  )}
                >
                  <Icon className={cn('w-3.5 h-3.5', h.heroStatIcon)} />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => navigate('/nearby')}
                className="btn-gradient flex items-center gap-1.5 !rounded-xl !text-[12px] !px-3 !py-1.5"
              >
                <MapIcon className="w-3.5 h-3.5" />
                {t('Αναζήτηση στον Χάρτη', 'Search on Map')}
              </button>
            </div>
            {searchBlock}
          </div>
          {currentUser && (
            <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-white/30 bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-soft">
                {score}
              </div>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('Αξιοπιστία', 'Reliability')}
              </span>
            </div>
          )}
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
