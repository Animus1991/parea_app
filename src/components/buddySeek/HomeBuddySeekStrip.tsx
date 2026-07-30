import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, Users } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { usePlansFormingFeed } from '../../hooks/usePlansFormingFeed';
import { useStore } from '../../store';
import { PlansFormingCard } from './PlansFormingCard';
import { PlansFormingStatsBar, PlansFormingValueHero } from './plansForming/PlansFormingShared';
import { HorizontalScrollArrows } from '../ui/HorizontalScrollArrows';
import { cn } from '../../lib/utils';

export function HomeBuddySeekStrip({ className }: { className?: string }) {
  const { t, tu } = useLanguage();
  const navigate = useNavigate();
  const setSheetOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const feed = usePlansFormingFeed(6);

  return (
    <section
      className={cn(
        'rounded-2xl border p-4 space-y-4',
        'bg-gradient-to-br from-accent-soft via-surface-raised to-accent-soft/70',
        'border-accent/20',
        className,
      )}
      aria-labelledby="home-plans-forming"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <h2
            id="home-plans-forming"
            className="text-sm font-bold uppercase tracking-wide text-accent-strong flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {tu('Βρες Nakamas', 'Find Nakamas')}
          </h2>
          <PlansFormingValueHero insights={feed.insights} />
          <PlansFormingStatsBar insights={feed.insights} compact />
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/buddy-seek')}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-0.5"
          >
            {t('Όλα', 'See all')}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="xl:hidden text-xs font-bold px-2.5 py-1.5 rounded-lg bg-accent text-accent-fg"
          >
            {t('Άνοιγμα', 'Open')}
          </button>
        </div>
      </div>

      {feed.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-accent/30 p-4 text-center">
          <Users className="w-8 h-8 mx-auto text-accent/60 mb-2" />
          <p className="text-sm font-medium text-ink-muted leading-relaxed">
            {t(
              'Δεν βλέπετε σχέδια ακόμα; Αποθηκεύστε εκδηλώσεις ή δηλώστε ότι ψάχνετε Nakamas.',
              'No plans visible yet? Save events or declare that you are looking for Nakamas.',
            )}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-2 text-xs font-bold text-accent"
          >
            {t('Εξερεύνηση εκδηλώσεων', 'Explore events')} →
          </button>
        </div>
      ) : (
        <HorizontalScrollArrows
          itemCount={feed.items.length}
          scrollClassName="flex gap-3 overflow-x-auto pb-1 noscrollbar -mx-1 px-1"
          scrollStep={320}
        >
          {feed.items.map((item) => (
            <div key={item.intent.id} className="shrink-0 w-[min(100%,320px)] sm:w-[320px]">
              <PlansFormingCard item={item} variant="inline" />
            </div>
          ))}
        </HorizontalScrollArrows>
      )}

      {feed.recruitingGroupItems.length > 0 && (
        <p className="text-xs text-ink-muted">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {feed.insights.openSpots}
          </span>{' '}
          {t('ανοιχτές θέσεις σε ομάδες αυτή τη στιγμή', 'open group spots right now')}
        </p>
      )}
    </section>
  );
}
