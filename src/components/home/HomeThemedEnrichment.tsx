import { useEffect } from 'react';
import { useStoryEvents } from '../../hooks/useStoryEvents';
import { useOnboardingWelcome } from '../../hooks/useOnboardingWelcome';
import { HomeOnboardingWelcomeBanner } from './HomeOnboardingWelcomeBanner';
import { HomeQuickStatsBar } from './HomeQuickStatsBar';
import { HomeDailyTip } from './HomeDailyTip';
import { HomePendingFeedbackBanner } from './HomePendingFeedbackBanner';
import { HomeSeekingHostSection } from './HomeSeekingHostSection';

export interface HomeThemedEnrichmentProps {
  seekingHostOnly: boolean;
  onToggleSeekingHostOnly: () => void;
  /** Switch to Discover when landing from onboarding (optional). */
  onPreferDiscoverFeed?: () => void;
}

/** Classic-parity blocks for themed Home pages (additive, no layout removal). */
export function HomeThemedEnrichment({
  seekingHostOnly,
  onToggleSeekingHostOnly,
  onPreferDiscoverFeed,
}: HomeThemedEnrichmentProps) {
  const { seekingHostEvents } = useStoryEvents();
  const { showWelcome, dismissWelcome } = useOnboardingWelcome();

  useEffect(() => {
    if (showWelcome) onPreferDiscoverFeed?.();
  }, [showWelcome, onPreferDiscoverFeed]);

  return (
    <>
      {showWelcome && (
        <HomeOnboardingWelcomeBanner onDismiss={dismissWelcome} />
      )}
      <HomeQuickStatsBar />
      <HomeDailyTip />
      <HomePendingFeedbackBanner />
      <HomeSeekingHostSection
        events={seekingHostEvents}
        seekingHostOnly={seekingHostOnly}
        onToggleSeekingHostOnly={onToggleSeekingHostOnly}
      />
    </>
  );
}
