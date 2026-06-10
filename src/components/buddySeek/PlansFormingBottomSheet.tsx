import { useNavigate } from 'react-router-dom';
import { X, Inbox } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useContrastTheme } from '../../hooks/useContrastTheme';
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

export function PlansFormingBottomSheet() {
  const open = useStore((s) => s.plansFormingSheetOpen);
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const { t } = useLanguage();
  const c = useContrastTheme();
  const tok = useThemeStyles();
  const navigate = useNavigate();
  const feed = usePlansFormingFeed(10);
  const dismiss = useStore((s) => s.dismissCompanyRequest);
  const undismiss = useStore((s) => s.undismissCompanyRequest);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-labelledby="plans-forming-sheet-title">
      <button
        type="button"
        className={cn('absolute inset-0 backdrop-blur-sm', c.modalOverlay)}
        onClick={() => setOpen(false)}
        aria-label={t('Κλείσιμο', 'Close')}
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 max-h-[92vh] flex flex-col rounded-t-3xl border-t shadow-2xl animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none',
          c.modalPanel,
        )}
      >
        <div className={cn('mx-auto mt-3 mb-1 h-1 w-10 rounded-full shrink-0', tok.isDark ? 'bg-gray-500' : 'bg-gray-300')} />

        <div className="px-5 pt-2 pb-3 border-b border-inherit shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="plans-forming-sheet-title" className={cn('text-base font-bold', tok.head)}>
                {t('Σχέδια που σχηματίζονται', 'Plans forming')}
              </h2>
              <PlansFormingValueHero insights={feed.insights} />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={cn('rounded-full p-2 min-h-11 min-w-11 flex items-center justify-center shrink-0', tok.chipButton)}
              aria-label={t('Κλείσιμο', 'Close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <PlansFormingStatsBar insights={feed.insights} />
          {feed.insights.pendingJoinsToReview > 0 && (
            <button
              type="button"
              className="w-full flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900"
              onClick={() => {
                setOpen(false);
                navigate('/buddy-seek');
              }}
            >
              <Inbox className="w-4 h-4" />
              {t(
                `${feed.insights.pendingJoinsToReview} αιτήματα προς έλεγχο`,
                `${feed.insights.pendingJoinsToReview} requests to review`,
              )}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-32">
          {feed.myActivePlan && (
            <PlansFormingYourPlanBanner
              plan={feed.myActivePlan}
              onManage={() => {
                setOpen(false);
                navigate(`/events/${feed.myActivePlan!.event.id}`);
              }}
            />
          )}

          {!feed.hasContent && !feed.myActivePlan ? (
            <PlansFormingEmptyState suggestedEvent={feed.suggestedEvent} onBrowse={() => { setOpen(false); navigate('/'); }} />
          ) : (
            <>
              {feed.scarcityPromos.length > 0 && (
                <section className="space-y-3">
                  <PlansFormingSectionTitle title={t('Σχεδόν πλήρεις ομάδες', 'Groups filling up')} />
                  {feed.scarcityPromos.map((promo) => (
                    <PlansFormingScarcityPromoCard key={promo.id} promo={promo} isDark={tok.isDark} />
                  ))}
                </section>
              )}
              {feed.items.map((item) => (
                <PlansFormingCard
                  key={item.intent.id}
                  item={item}
                  variant="sheet"
                  onDismiss={() => {
                    const id = item.intent.id;
                    dismiss(id);
                    toast(t('Απόκρυψη', 'Hidden'), {
                      action: { label: t('Αναίρεση', 'Undo'), onClick: () => undismiss(id) },
                    });
                  }}
                />
              ))}
              {feed.recruitingGroupItems.length > 0 && (
                <section>
                  <PlansFormingSectionTitle title={t('Ομάδες με θέσεις', 'Groups with spots')} />
                  {feed.recruitingGroupItems.map((entry) => (
                    <PlansFormingGroupCard key={entry.group.id} entry={entry} variant="sheet" />
                  ))}
                </section>
              )}
            </>
          )}
        </div>

        <div
          className={cn(
            'sticky bottom-0 left-0 right-0 p-4 border-t flex gap-2 shrink-0 backdrop-blur-md',
            tok.isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200',
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/buddy-seek');
            }}
            className={cn('flex-1 min-h-12 rounded-2xl text-sm font-bold text-white', tok.primaryBtn)}
          >
            {t('Όλα τα σχέδια', 'All plans')}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={cn('min-h-12 px-5 rounded-2xl text-sm font-bold border', c.border, c.fgMuted)}
          >
            {t('Κλείσιμο', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
