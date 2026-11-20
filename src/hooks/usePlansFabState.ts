import { useLanguage } from '../lib/i18n';
import { usePlansFormingFeed } from './usePlansFormingFeed';

/** What the plans shortcut shows: shared by this tablet FAB and the phone dock. */
export function usePlansFabState() {
  const { t } = useLanguage();
  const feed = usePlansFormingFeed(8);
  const total = feed.insights.compatiblePlans + feed.insights.recruitingGroups;
  const hasPending = feed.insights.pendingJoinsToReview > 0;
  const showTeaser = !feed.hasContent && !feed.myActivePlan;
  const visible = Boolean(total || hasPending || showTeaser || feed.myActivePlan);

  const label = feed.myActivePlan
    ? t('Το σχέδιό σου', 'Your plan')
    : t('Παρέες', 'Groups');

  return { visible, label, badge: null as number | null, hasPending: false };
}
