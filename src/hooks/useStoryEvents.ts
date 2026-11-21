import { useMemo, useCallback } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';
import { isEventSeekingHost, sortEventsForStories } from '../lib/storyEventOrdering';
import { isEventPast, isLiveCatalogEvent } from '../lib/eventDisplay';
import { coerceAuthoredSeasonToLive } from '../lib/demoCatalogDates';

/**
 * Shared story-rail data for all Home theme variants (Classic, Vibrant, Neon, Bento, …).
 * Ordering: platform events seeking a host → trending → chronological.
 */
export function useStoryEvents() {
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);

  const isSeekingHost = useCallback(
    (e: Event) => isEventSeekingHost(e, groups),
    [groups],
  );

  const liveEvents = useMemo(
    () => coerceAuthoredSeasonToLive(events).filter(isLiveCatalogEvent),
    [events],
  );

  const seekingHostEvents = useMemo(
    () => liveEvents.filter((e) => isSeekingHost(e) && !isEventPast(e)),
    [liveEvents, isSeekingHost],
  );

  const storyEvents = useMemo(
    () => sortEventsForStories(liveEvents.filter((e) => !isEventPast(e)), groups),
    [liveEvents, groups],
  );

  return { storyEvents, seekingHostEvents, isSeekingHost };
}
