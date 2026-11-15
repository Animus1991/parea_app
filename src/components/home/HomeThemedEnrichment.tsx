import { useEffect } from 'react';
import { useOnboardingWelcome } from '../../hooks/useOnboardingWelcome';
import { HomeOnboardingWelcomeBanner } from './HomeOnboardingWelcomeBanner';
import { HomePendingFeedbackBanner } from './HomePendingFeedbackBanner';
import { HomeVerifyBanner } from './HomeVerifyBanner';

export interface HomeThemedEnrichmentProps {
  /** Switch to Discover when landing from onboarding (optional). */
  onPreferDiscoverFeed?: () => void;
}

/**
 * Above-fold enrichment only (P4): welcome + verify nudge + pending feedback.
 * Stats / tip / seeking-host moved to HomeBelowFold.
 */
export function HomeThemedEnrichment({ onPreferDiscoverFeed }: HomeThemedEnrichmentProps) {
  const { showWelcome, dismissWelcome } = useOnboardingWelcome();

  useEffect(() => {
    if (showWelcome) onPreferDiscoverFeed?.();
  }, [showWelcome, onPreferDiscoverFeed]);

  return (
    <>
      {showWelcome && <HomeOnboardingWelcomeBanner onDismiss={dismissWelcome} />}
      <HomeVerifyBanner />
      <HomePendingFeedbackBanner />
    </>
  );
}
