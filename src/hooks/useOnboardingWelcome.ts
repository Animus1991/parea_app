import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { consumeOnboardingWelcomeSession } from '../lib/onboardingHomeBridge';

/**
 * After OnboardingClassic completes, show a one-time welcome banner on Home
 * and switch feed toward discovery (URL cat/dist already set by onboarding redirect).
 */
export function useOnboardingWelcome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get('welcome') === '1';
    const fromSession = consumeOnboardingWelcomeSession();
    if (!fromUrl && !fromSession) return;

    setShowWelcome(true);

    if (fromUrl) {
      const next = new URLSearchParams(searchParams);
      next.delete('welcome');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const dismissWelcome = () => setShowWelcome(false);

  return { showWelcome, dismissWelcome };
}
