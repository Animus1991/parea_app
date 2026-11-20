import { useEffect } from 'react';
import { useOnboardingWelcome } from '../../hooks/useOnboardingWelcome';
import { useHomeHeroGate } from '../../hooks/useHomeHeroGate';
import { HomeOnboardingWelcomeBanner } from './HomeOnboardingWelcomeBanner';
import { HomeVerifyBanner } from './HomeVerifyBanner';

export interface HomeThemedEnrichmentProps {
  /** Switch to Discover when landing from onboarding (optional). */
  onPreferDiscoverFeed?: () => void;
}

/**
 * One above-fold gate: verify, then welcome.
 * Rating lives in Notifications. Catalog stories live in HomeDiscoverEnrichment.
 */
export function HomeThemedEnrichment({ onPreferDiscoverFeed }: HomeThemedEnrichmentProps) {
  const { showWelcome, dismissWelcome } = useOnboardingWelcome();
  const gate = useHomeHeroGate(showWelcome);

  useEffect(() => {
    if (showWelcome) onPreferDiscoverFeed?.();
  }, [showWelcome, onPreferDiscoverFeed]);

  if (gate === 'verify') return <HomeVerifyBanner />;
  if (gate === 'welcome') return <HomeOnboardingWelcomeBanner onDismiss={dismissWelcome} />;
  return null;
}
