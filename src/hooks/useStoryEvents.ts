import { useMemo, useCallback } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';
import { isEventSeekingHost, sortEventsForStories } from '../lib/storyEventOrdering';

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

  const seekingHostEvents = useMemo(
    () => events.filter(isSeekingHost),
    [events, isSeekingHost],
  );

  const storyEvents = useMemo(
    () => sortEventsForStories(events, groups),
    [events, groups],
  );

  return { storyEvents, seekingHostEvents, isSeekingHost };
}
