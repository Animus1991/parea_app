import { useNavigate } from 'react-router-dom';
import { ChevronRight, Inbox, Sparkles, PanelRightClose } from 'lucide-react';
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

export function PlansFormingSidebarReopenTab() {
  const { t } = useLanguage();
  const setOpen = useStore((s) => s.setPlansFormingSidebarOpen);
  const tok = useThemeStyles();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'hidden xl:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-1',
        'rounded-l-xl border border-r-0 py-3 px-1.5 shadow-md min-w-[36px]',
        'transition-colors hover:bg-cyan-50',
        tok.isDark ? 'bg-[#0c1016]/95 border-white/10 text-cyan-300' : 'bg-white border-gray-200 text-cyan-700',
      )}
      aria-label={t('Άνοιγμα sidebar σχεδίων', 'Open plans sidebar')}
      title={t('Σχέδια που σχηματίζονται', 'Plans forming')}
    >
      <Sparkles className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold [writing-mode:vertical-rl] rotate-180 tracking-wide">
        {t('Σχέδια', 'Plans')}
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

  return (
    <aside
      className={cn(
        'hidden xl:flex flex-col w-[300px] 2xl:w-[340px] shrink-0 border-l overflow-y-auto',
        shell,
        className,
      )}
      aria-label={t('Σχέδια που σχηματίζονται', 'Plans forming')}
    >
      <header
        className={cn(
          'p-4 border-b sticky top-0 z-10 backdrop-blur-md space-y-3',
          isDark ? 'border-white/10 bg-[#0c1016]/95' : 'border-gray-200 bg-gray-50/95',
        )}
      >
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600/30 to-indigo-600/20 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={cn('text-xs font-bold uppercase tracking-wide', isDark ? 'text-cyan-300' : 'text-cyan-800')}>
              {t('Σχέδια που σχηματίζονται', 'Plans forming')}
            </h2>
            <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
              {t('Παρέα για εκδηλώσεις', 'Company for events')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'shrink-0 p-2 rounded-lg min-h-9 min-w-9 flex items-center justify-center',
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500',
            )}
            aria-label={t('Κλείσιμο sidebar', 'Close sidebar')}
            title={t('Κλείσιμο', 'Close')}
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>

        <PlansFormingValueHero isDark={isDark} insights={feed.insights} />
        <PlansFormingStatsBar insights={feed.insights} compact isDark={isDark} />

        {feed.insights.pendingJoinsToReview > 0 && (
          <button
            type="button"
            onClick={() => navigate('/buddy-seek')}
            className={cn(
              'w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 border text-left',
              isDark ? 'bg-amber-950/40 border-amber-700/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900',
            )}
          >
            <span className="flex items-center gap-2 text-xs font-bold">
              <Inbox className="w-4 h-4" />
              {t(
                `${feed.insights.pendingJoinsToReview} αιτήματα προς έλεγχο`,
                `${feed.insights.pendingJoinsToReview} requests to review`,
              )}
            </span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/buddy-seek')}
          className="w-full min-h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white"
        >
          {t('Όλα τα σχέδια', 'All plans')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="p-3 space-y-5 flex-1">
        {feed.myActivePlan && (
          <PlansFormingYourPlanBanner
            plan={feed.myActivePlan}
            isDark={isDark}
            onManage={() => navigate(`/events/${feed.myActivePlan!.event.id}`)}
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
              <section>
                <PlansFormingSectionTitle
                  isDark={isDark}
                  title={t('Σχεδόν πλήρεις', 'Nearly full')}
                />
                <div className="space-y-3">
                  {feed.scarcityPromos.map((promo) => (
                    <PlansFormingScarcityPromoCard key={promo.id} promo={promo} isDark={isDark} />
                  ))}
                </div>
              </section>
            )}

            {feed.items.length > 0 && (
              <section>
                <PlansFormingSectionTitle isDark={isDark} title={t('Για εσάς', 'For you')} />
                <div className="space-y-3">
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

            {feed.recruitingGroupItems.length > 0 && (
              <section>
                <PlansFormingSectionTitle
                  isDark={isDark}
                  title={t('Ομάδες με θέσεις', 'Groups with spots')}
                  subtitle={
                    feed.insights.openSpots > 0
                      ? t(`${feed.insights.openSpots} ανοιχτές θέσεις`, `${feed.insights.openSpots} open spots`)
                      : undefined
                  }
                />
                <div className="space-y-3">
                  {feed.recruitingGroupItems.slice(0, 3).map((entry) => (
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
              <section
                className={cn(
                  'rounded-xl border p-3',
                  isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white',
                )}
              >
                <p className={cn('text-xs font-semibold mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {t('Αποθηκευμένες εκδηλώσεις', 'Saved events')}
                </p>
                <ul className="space-y-1.5">
                  {feed.plansForSavedEvents.map(({ event, planCount }) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}`)}
                        className={cn(
                          'w-full text-left text-xs font-medium flex justify-between gap-2 hover:text-cyan-600',
                          isDark ? 'text-gray-300' : 'text-gray-800',
                        )}
                      >
                        <span className="truncate">{event.title}</span>
                        <span className="shrink-0 text-cyan-600 font-bold">
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

      <footer className={cn('p-3 border-t', isDark ? 'border-white/10' : 'border-gray-200')}>
        <p className={cn('text-xs leading-relaxed text-center', isDark ? 'text-gray-500' : 'text-gray-500')}>
          {t('Privacy-first · όχι διαφήμιση', 'Privacy-first · not an ad')}
        </p>
      </footer>
    </aside>
  );
}
