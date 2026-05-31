import type { Event } from '../types';
import type { Group } from '../types';

export function isEventSeekingHost(event: Event, groups: Group[]): boolean {
  return (
    !!event.isPlatformEvent && !groups.find((g) => g.eventId === event.id && g.hostId)
  );
}

/** Story rail / calendar day stories: seeking-host → trending → date. */
export function storyEventRank(event: Event, groups: Group[]): number {
  if (isEventSeekingHost(event, groups)) return 0;
  if (event.isTrending) return 1;
  return 2;
}

export function sortEventsForStories(events: Event[], groups: Group[]): Event[] {
  return [...events].sort(
    (a, b) =>
      storyEventRank(a, groups) - storyEventRank(b, groups) ||
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}
