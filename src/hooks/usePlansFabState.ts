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

  const label = hasPending
    ? t('Αιτήματα', 'Requests')
    : feed.myActivePlan
      ? t('Το σχέδιό σας', 'Your plan')
      : // Named after the sheet it opens; «Σχέδια» alone collided with the /plans tab.
        t('Βρες Nakamas', 'Find Nakamas');

  const badge = hasPending ? feed.insights.pendingJoinsToReview : total > 0 ? total : null;

  return { visible, label, badge, hasPending };
}
