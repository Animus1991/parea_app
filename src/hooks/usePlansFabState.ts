import { useLanguage } from '../lib/i18n';
import { usePlansFormingFeed } from './usePlansFormingFeed';

/** Nearby-now overlay shortcut: shared by the tablet FAB and the phone dock. */
export function usePlansFabState() {
  const { t } = useLanguage();
  const feed = usePlansFormingFeed(8);
  const total = feed.insights.compatiblePlans + feed.insights.recruitingGroups;
  const hasPending = feed.insights.pendingJoinsToReview > 0;
  const showTeaser = !feed.hasContent && !feed.myActivePlan;
  const visible = Boolean(total || hasPending || showTeaser || feed.myActivePlan);

  // Same breath as the overlay title — no comma. “τώρα” makes it a nearby-now
  // action, not a vague appeal. Event-card “Βρες παρέα” stays generic on purpose.
  const label = t('Βρες παρέα τώρα', 'Find company now');

  return { visible, label, badge: null as number | null, hasPending: false };
}
