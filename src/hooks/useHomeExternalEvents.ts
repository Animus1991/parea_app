import { useEffect } from 'react';
import { useStore } from '../store';

/**
 * Fetches Ticketmaster Discovery events on Home mount when VITE_TICKETMASTER_API_KEY is set.
 * No-op when unconfigured — mock events remain the sole feed (see src/lib/runtimeMode.ts).
 */
export function useHomeExternalEvents() {
  const fetchExternalEvents = useStore((s) => s.fetchExternalEvents);

  useEffect(() => {
    fetchExternalEvents();
  }, [fetchExternalEvents]);
}
