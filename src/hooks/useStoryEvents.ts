import { useMemo, useCallback } from 'react';
import { useStore } from '../store';
import type { Event } from '../types';
import { isEventSeekingHost, sortEventsForStories } from '../lib/storyEventOrdering';
import { isEventPast } from '../lib/eventDisplay';

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
    () => events.filter((e) => isSeekingHost(e) && !isEventPast(e)),
    [events, isSeekingHost],
  );

  const storyEvents = useMemo(
    () => sortEventsForStories(events.filter((e) => !isEventPast(e)), groups),
    [events, groups],
  );

  return { storyEvents, seekingHostEvents, isSeekingHost };
}
