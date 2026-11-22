import { Grid, Search, TrendingUp, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { APP_TYPO } from '../../lib/typographyTokens';
import type { CategoryCatalogItem } from '../../lib/categoriesCatalog';
import { countNoun } from '../../lib/plural';

type TrendingCategory = CategoryCatalogItem & {
  count: number;
  displayName: string;
};

interface CategoriesHeroProps {
  query: string;
  onQuery: (value: string) => void;
  onSubmit: () => void;
  trending: TrendingCategory[];
  totals: {
    categories: number;
    events: number;
    forming: number;
  };
  onPick: (name: string) => void;
}

export function CategoriesHero({
  query,
  onQuery,
  onSubmit,
  trending,
  totals,
  onPick,
}: CategoriesHeroProps) {
  const { t } = useLanguage();
  const stats = [
    countNoun(totals.categories, 'κατηγορία', 'κατηγορίες'),
    countNoun(totals.events, 'εκδήλωση', 'εκδηλώσεις'),
    ...(totals.forming > 0
      ? [countNoun(totals.forming, 'παρέα σχηματίζεται', 'παρέες σχηματίζονται')]
      : []),
  ];
  const englishStats = [
    countNoun(totals.categories, 'category', 'categories'),
    countNoun(totals.events, 'event', 'events'),
    ...(totals.forming > 0
      ? [countNoun(totals.forming, 'group forming', 'groups forming')]
      : []),
  ];

  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-hero-from to-hero-to px-5 py-6 text-hero-fg shadow-soft md:px-8 md:py-8">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2')}>
            <Grid className="h-5 w-5 shrink-0" aria-hidden="true" />
            {t('Κατηγορίες', 'Categories')}
          </h1>
          <p className="text-sm font-medium text-hero-fg/75">
            {t('Βρες την επόμενη', 'Find your next')}{' '}
            <span className="bg-gradient-to-r from-hero-accent-from to-hero-accent-to bg-clip-text font-semibold text-transparent">
              {t('εμπειρία σου', 'experience')}
            </span>
            {' · '}
            {t(stats.join(' · '), englishStats.join(' · '))}
          </p>
          <div className="relative w-full max-w-xl pt-3">
            <Search
              className="pointer-events-none absolute left-3.5 top-[calc(50%+0.375rem)] h-4 w-4 -translate-y-1/2 text-hero-fg/60"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && query.trim()) onSubmit();
              }}
              placeholder={t('Αναζήτηση κατηγορίας ή εκδήλωσης…', 'Search a category or event…')}
              aria-label={t('Αναζήτηση κατηγορίας ή εκδήλωσης', 'Search a category or event')}
              className="search-control h-11 w-full rounded-xl border border-hero-fg/10 bg-hero-fg/10 pl-10 pr-10 text-sm text-hero-fg placeholder:text-hero-fg/60 focus:outline-none focus:ring-2 focus:ring-hero-fg/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQuery('')}
                aria-label={t('Καθαρισμός αναζήτησης', 'Clear search')}
                className="absolute right-1 top-[calc(50%+0.375rem)] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-hero-fg/70 transition-colors hover:bg-hero-fg/10 hover:text-hero-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-fg/50"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 lg:max-w-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-hero-fg/70">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            {t('Δημοφιλή τώρα', 'Trending now')}
          </p>
          <div
            role="group"
            aria-label={t('Δημοφιλείς κατηγορίες', 'Trending categories')}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 noscrollbar lg:flex-wrap lg:overflow-visible"
          >
            {trending.slice(0, 3).map((category) => (
              <button
                key={category.id}
                type="button"
                data-testid="category-trending-chip"
                data-category-name={category.name}
                onClick={() => onPick(category.name)}
                className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-hero-fg/15 bg-hero-fg/10 pl-1.5 pr-3 text-xs font-semibold text-hero-fg transition-colors hover:bg-hero-fg/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hero-fg/50"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-hero-fg/20 bg-hero-fg/15">
                  <category.icon className="h-3.5 w-3.5 text-hero-fg" aria-hidden="true" />
                </span>
                {category.displayName}
                <span className="text-hero-fg/60">{category.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-hero-fg/15 blur-[80px]" />
    </header>
  );
}
