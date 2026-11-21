import { useNavigate } from 'react-router-dom';
import { Users, PanelRightClose } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { usePlansFormingFeed } from '../../hooks/usePlansFormingFeed';
import { useStore } from '../../store';
import { PlansFormingCard, PlansFormingGroupCard } from './PlansFormingCard';
import { PlansFormingScarcityPromoCard } from './PlansFormingScarcityPromo';
import {
  PlansFormingEmptyState,
  PlansFormingSectionTitle,
  PlansFormingStatsBar,
  PlansFormingValueHero,
  PlansFormingYourPlanBanner,
} from './plansForming/PlansFormingShared';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { countNoun } from '../../lib/plural';

export function PlansFormingSidebarReopenTab() {
  const { t } = useLanguage();
  const setOpen = useStore((s) => s.setPlansFormingSidebarOpen);
  const sidebarOpen = useStore((s) => s.plansFormingSidebarOpen);
  const tok = useThemeStyles();

  if (sidebarOpen) return null;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1',
        'rounded-l-xl border border-r-0 py-3 px-1.5 shadow-soft-md min-w-[36px]',
        'transition-colors hover:bg-cyan-50',
        tok.isDark ? 'bg-[#0c1016]/95 border-white/10 text-cyan-300' : 'bg-white border-gray-200 text-cyan-700',
      )}
      aria-label={t('Βρες Nakamas — παρέα για εκδήλωση', 'Find Nakamas — company for an event')}
      title={t('Βρες Nakamas', 'Find Nakamas')}
    >
      <Users className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold [writing-mode:vertical-rl] rotate-180 tracking-wide">
        {t('Βρες Nakamas', 'Find Nakamas')}
      </span>
    </button>
  );
}

export function PlansFormingSidebar({ className }: { className?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tok = useThemeStyles();
  const feed = usePlansFormingFeed(6);
  const dismiss = useStore((s) => s.dismissCompanyRequest);
  const undismiss = useStore((s) => s.undismissCompanyRequest);
  const sidebarOpen = useStore((s) => s.plansFormingSidebarOpen);
  const setSidebarOpen = useStore((s) => s.setPlansFormingSidebarOpen);
  const isDark = tok.isDark;

  if (!sidebarOpen) return null;

  const shell = isDark ? 'border-white/10 bg-[#0c1016]/95' : 'border-gray-200 bg-gray-50/95';
  const recruitingGroups = feed.recruitingGroupItems.filter((entry) => entry.event.kind !== 'mini_outing');
  const recruitingSpots = recruitingGroups.reduce((sum, entry) => sum + entry.meta.spots, 0);

  return (
    <aside
      className={cn(
        'hidden xl:flex flex-col w-[300px] 2xl:w-[340px] shrink-0 border-l overflow-y-auto',
        shell,
        className,
      )}
      aria-label={t('Βρες Nakamas', 'Find Nakamas')}
    >
      <header
        className={cn(
          'px-4 pt-4 pb-3 sticky top-0 z-10 backdrop-blur-md space-y-3',
          isDark ? 'bg-[#0c1016]/95' : 'bg-gray-50/95',
        )}
      >
        <div className="flex items-center gap-3">
          <h2 className={cn('min-w-0 flex-1 text-xs font-bold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
            {t('Βρες Nakamas', 'Find Nakamas')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/buddy-seek')}
            aria-label={t('Άνοιγμα Βρες Nakamas', 'Open Find Nakamas')}
            className={cn(
              'shrink-0 inline-flex items-center min-h-9 text-xs font-semibold',
              isDark ? 'text-cyan-300 hover:text-white' : 'text-cyan-700 hover:text-cyan-900',
            )}
          >
            {t('Όλα', 'All')}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'shrink-0 min-h-9 min-w-9 rounded-full flex items-center justify-center',
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200/70 text-gray-500',
            )}
            aria-label={t('Κλείσιμο sidebar', 'Close sidebar')}
            title={t('Κλείσιμο', 'Close')}
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <PlansFormingValueHero compact isDark={isDark} insights={feed.insights} />
        {feed.insights.compatiblePlans === 0 && (
          <PlansFormingStatsBar insights={feed.insights} compact plain isDark={isDark} />
        )}

        {feed.insights.pendingJoinsToReview > 0 && (
          <button
            type="button"
            onClick={() => navigate('/buddy-seek')}
            className={cn(
              'text-left text-xs font-semibold leading-relaxed',
              isDark ? 'text-gray-400 hover:text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            {t(
              `${countNoun(feed.insights.pendingJoinsToReview, 'αίτημα', 'αιτήματα')} προς έλεγχο →`,
              `${countNoun(feed.insights.pendingJoinsToReview, 'request', 'requests')} to review →`,
            )}
          </button>
        )}
      </header>

      <div className="px-4 pb-6 space-y-6 flex-1">
        {feed.myActivePlan && (
          <PlansFormingYourPlanBanner
            plan={feed.myActivePlan}
            isDark={isDark}
            onManage={() => navigate(`/events/${feed.myActivePlan!.event.id}`)}
            onEdit={() =>
              navigate(`/buddy-seek?editRequest=${feed.myActivePlan!.intent.id}`)
            }
          />
        )}

        {!feed.hasContent && !feed.myActivePlan ? (
          <PlansFormingEmptyState
            isDark={isDark}
            suggestedEvent={feed.suggestedEvent}
            onBrowse={() => navigate('/')}
            onCreate={() => navigate('/buddy-seek')}
          />
        ) : (
          <>
            {feed.scarcityPromos.length > 0 && (
              <section className="space-y-3">
                <PlansFormingSectionTitle
                  isDark={isDark}
                  title={t('Σχεδόν πλήρεις', 'Nearly full')}
                />
                <div className="space-y-5">
                  {feed.scarcityPromos.map((promo) => (
                    <PlansFormingScarcityPromoCard key={promo.id} promo={promo} isDark={isDark} />
                  ))}
                </div>
              </section>
            )}

            {feed.items.length > 0 && (
              <section className="space-y-3">
                <PlansFormingSectionTitle isDark={isDark} title={t('Για εσάς', 'For you')} />
                <div className="space-y-5">
                  {feed.items.map((item) => (
                    <PlansFormingCard
                      key={item.intent.id}
                      item={item}
                      variant="sidebar"
                      isDarkSurface={isDark}
                      onDismiss={() => {
                        const id = item.intent.id;
                        dismiss(id);
                        toast(t('Απόκρυψη', 'Hidden'), {
                          action: { label: t('Αναίρεση', 'Undo'), onClick: () => undismiss(id) },
                        });
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {recruitingGroups.length > 0 && (
              <section className="space-y-3">
                <PlansFormingSectionTitle
                  isDark={isDark}
                  title={t('Ομάδες με θέσεις', 'Groups with spots')}
                  subtitle={
                    recruitingSpots > 0
                      ? t(`${recruitingSpots} ανοιχτές θέσεις`, `${recruitingSpots} open spots`)
                      : undefined
                  }
                />
                <div className="space-y-5">
                  {recruitingGroups.slice(0, 3).map((entry) => (
                    <PlansFormingGroupCard
                      key={entry.group.id}
                      entry={entry}
                      variant="sidebar"
                      isDarkSurface={isDark}
                      onSuggestMerge={() => navigate(`/events/${entry.event.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {feed.plansForSavedEvents.length > 0 && (
              <section className="space-y-2">
                <PlansFormingSectionTitle
                  isDark={isDark}
                  title={t('Αποθηκευμένες εκδηλώσεις', 'Saved events')}
                />
                <ul className="space-y-2">
                  {feed.plansForSavedEvents.map(({ event, planCount }) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}`)}
                        className={cn(
                          'w-full text-left text-xs font-medium flex justify-between gap-4 leading-relaxed',
                          isDark ? 'text-gray-300 hover:text-white' : 'text-ink hover:text-cyan-700',
                        )}
                      >
                        <span className="min-w-0">{event.title}</span>
                        <span className="shrink-0 tabular-nums text-ink-muted">
                          {planCount}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

    </aside>
  );
}
