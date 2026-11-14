import { RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ShieldCheck, Map as MapIcon, CheckCircle2, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { HOME_TYPO } from '../../lib/typographyTokens';
import type { HomeThemedTokens } from '../../lib/homeThemedTokens';
import { HomeSearchDropdown } from './HomeSearchDropdown';
import { cn } from '../../lib/utils';

export interface HomeRichHeroProps {
  tokens: HomeThemedTokens;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchRef: RefObject<HTMLDivElement | null>;
  showSearchSuggestions: boolean;
  onSearchFocus: () => void;
  searchSuggestions: string[];
  onPickSuggestion: (value: string) => void;
}

/** Rich gradient hero for the themed Home lineage. Colors come from HomeThemedTokens. */
export function HomeRichHero({
  tokens: tok,
  searchQuery,
  onSearchChange,
  searchRef,
  showSearchSuggestions,
  onSearchFocus,
  searchSuggestions,
  onPickSuggestion,
}: HomeRichHeroProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(tok.heroRoot, 'p-5 rounded-3xl relative overflow-hidden flex flex-col gap-4')}
    >
      <div className="relative z-10 flex-1 w-full">
        <div className={cn(tok.heroBadge, 'mb-4', HOME_TYPO.heroBadge)}>
          {t('home.hero.badge', 'Νεος τροπος εξοδου')}
        </div>
        <h1 className={cn(HOME_TYPO.heroTitle, 'mb-4 max-w-2xl')}>
          {t('home.hero.title1', 'Βρείτε παρέα για τις')}{' '}
          <span className={cn('text-transparent bg-clip-text bg-gradient-to-r', tok.heroTitleAccent)}>
            {t('home.hero.title2', 'εμπειρίες')}
          </span>{' '}
          {t('home.hero.title3', 'που ήδη θέλετε να ζήσετε.')}
        </h1>
        <p className={cn(tok.heroSubtitle, 'max-w-xl mb-6', HOME_TYPO.heroSubtitle)}>
          {t(
            'home.hero.subtitle',
            'Προσχωρήστε σε μικρές ομάδες για εκδηλώσεις, δραστηριότητες και κοντινές αποδράσεις — βασισμένες σε κοινά ενδιαφέροντα και διαθεσιμότητα.',
          )}
        </p>

        <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 mb-6', tok.heroStats, HOME_TYPO.heroStats)}>
          <span className="flex items-center gap-1.5">
            <Users className={cn('w-3.5 h-3.5', tok.heroStatIcon)} />{' '}
            {t('home.hero.stat1', 'Μικρες ομαδες')}
          </span>
          <span className={tok.heroStatDot}>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className={cn('w-3.5 h-3.5', tok.heroStatIcon)} />{' '}
            {t('home.hero.stat2', 'Επαληθευμενη συμμετοχη')}
          </span>
          <span className={tok.heroStatDot}>•</span>
          <span className="flex items-center gap-1.5">
            <MapIcon className={cn('w-3.5 h-3.5', tok.heroStatIcon)} />{' '}
            {t('home.hero.stat3', 'Δημοσια σημεια')}
          </span>
          <span className={tok.heroStatDot}>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className={cn('w-3.5 h-3.5', tok.heroStatIcon)} />{' '}
            {t('Ιδιωτικες αναφορες', 'Private reports')}
          </span>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate('/nearby')}
            className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors', tok.heroMapBtn, HOME_TYPO.heroMapBtn)}
            title={t('Εμφάνιση στον Χάρτη', 'View on Map')}
          >
            <MapIcon className="w-4 h-4" />
            {t('Αναζήτηση στον Χάρτη', 'Search on Map')}
          </button>
        </div>

        {/* Search with suggestions */}
        <div className="flex gap-3 items-center">
          <div ref={searchRef} className="relative flex-1 max-w-md">
            <Search className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 z-10', tok.heroSearchIcon)} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={onSearchFocus}
              placeholder={t('home.hero.search_placeholder', 'Αναζήτηση εμπειριών...')}
              className={cn('w-full h-9 pl-10 pr-4 rounded-full shadow-soft focus:outline-none focus:ring-2 text-sm font-medium', tok.heroSearchInput)}
            />
            <HomeSearchDropdown
              popularSuggestions={searchSuggestions}
              onPick={onPickSuggestion}
              show={showSearchSuggestions}
              searchQuery={searchQuery}
            />
          </div>
          <button
            onClick={() => navigate('/trust')}
            className={cn('hidden sm:flex items-center justify-center px-5 h-10 rounded-full text-xs font-bold transition-colors whitespace-nowrap', tok.heroTrustBtn)}
          >
            {t('home.hero.how_groups', 'Πώς λειτουργούν οι ομάδες')}
          </button>
        </div>
      </div>
      {/* Decorative orbs */}
      <div className={cn('absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-br rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none', tok.heroOrb1)} />
      {tok.heroOrb2 && (
        <div className={cn('absolute left-0 bottom-0 w-[300px] h-[300px] bg-gradient-to-tr rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none', tok.heroOrb2)} />
      )}
    </motion.div>
  );
}
