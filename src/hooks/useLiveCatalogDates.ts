import { useEffect } from 'react';
import { useStore } from '../store';
import { coerceAuthoredSeasonToLive } from '../lib/demoCatalogDates';

/**
 * Persisted mock events often still carry May–June authored dates, which
 * hides them from stories. Rewrite those onto today's demo season once.
 */
export function useLiveCatalogDates() {
  const events = useStore((s) => s.events);

  useEffect(() => {
    const next = coerceAuthoredSeasonToLive(events);
    if (next.some((event, i) => event.date !== events[i]?.date)) {
      useStore.setState({ events: next });
    }
  }, [events]);
}
