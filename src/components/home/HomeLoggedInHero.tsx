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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 z-10 opacity-70" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onSearchFocus}
          placeholder={t('home.hero.search_placeholder', 'Αναζήτηση εμπειριών...')}
          className={cn(
            h.heroSearchInput,
            'search-control shadow-soft focus:outline-none backdrop-blur-sm w-full',
          )}
        />
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
          title={t('Άνοιγμα Χάρτη', 'Open Map')}
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
        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className={cn(h.heroGreeting, 'font-black mb-1')}>
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
              <button
                type="button"
                onClick={() => navigate('/trust')}
                aria-label={t(`Αξιοπιστία ${score}% — άνοιγμα Κέντρου Εμπιστοσύνης`, `Reliability ${score}% — open Trust Center`)}
                title={t('Η βαθμολογία αξιοπιστίας σας', 'Your reliability score')}
                className="flex shrink-0 flex-col items-center gap-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="w-12 h-12 rounded-full border-2 border-white bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow-soft">{score}%</span>
                <span className={cn(h.heroMotivation, 'text-2xs font-bold')}>{t('αξιοπιστία', 'reliability')}</span>
              </button>
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
              <HomeReturnLine className={cn(h.heroMotivation, 'text-sm')} fallback={motivation} />
              <h1 className={cn(h.heroTitle, 'max-w-2xl')}>
                {t('home.hero.title1', 'Βρείτε παρέα για τις')}{' '}
                <span className={h.heroTitleAccent}>
                  {t('home.hero.title2', 'εμπειρίες')}
                </span>{' '}
                {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
              </h1>
            </div>
            {currentUser && (
              <button
                type="button"
                onClick={() => navigate('/trust')}
                aria-label={t(`Αξιοπιστία ${score}% — άνοιγμα Κέντρου Εμπιστοσύνης`, `Reliability ${score}% — open Trust Center`)}
                title={t('Η βαθμολογία αξιοπιστίας σας', 'Your reliability score')}
                className="flex shrink-0 flex-col items-center gap-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="w-11 h-11 rounded-full border-2 border-white/80 bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-soft">{score}%</span>
                <span className={cn(h.heroMotivation, 'text-2xs font-bold')}>{t('αξιοπιστία', 'reliability')}</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { icon: Users, label: t('home.hero.stat1', 'Μικρές ομάδες') },
              { icon: ShieldCheck, label: t('home.hero.stat2', 'Επαληθευμένη συμμετοχή') },
              { icon: MapIcon, label: t('home.hero.stat3', 'Δημόσια σημεία') },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className={cn('inline-flex items-center gap-1.5 text-sm font-semibold', h.heroStat)}
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
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1">
            <p className={cn(h.heroGreeting, 'mb-1')}>{greeting}</p>
            <HomeReturnLine className={cn(h.heroMotivation, 'mb-4')} fallback={motivation} />
            <h1 className={cn(h.heroTitle, 'max-w-2xl')}>
              {t('home.hero.title1', 'Βρείτε παρέα για τις')}{' '}
              <span className={h.heroTitleAccent}>
                {t('home.hero.title2', 'εμπειρίες')}
              </span>{' '}
              {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
            </h1>
            <p className={cn(h.heroSubtitle, 'max-w-xl mb-4')}>
              {t(
                'home.hero.subtitle',
                'Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.',
              )}
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
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => navigate('/nearby')}
                className="btn-gradient flex items-center gap-1.5 !rounded-2xl !text-xs !px-3 !py-1.5"
              >
                <MapIcon className="w-3.5 h-3.5" />
                {t('Αναζήτηση στον Χάρτη', 'Search on Map')}
              </button>
            </div>
            {searchBlock}
          </div>
          {currentUser && (
            <div className="hidden md:flex flex-col items-center gap-2 shrink-0">
              <div className="w-12 h-12 rounded-full border-4 border-white/30 bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm md:text-base shadow-soft">
                {score}
              </div>
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
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
