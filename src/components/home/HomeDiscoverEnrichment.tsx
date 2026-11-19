import { EventStories } from './EventStories';
import type { Event } from '../../types';

/**
 * Discover's own job: upcoming nights you can join.
 * Stories sit under the hero (full rail). Buddy-seek, collections, and
 * samples of other pages live on those pages — not here.
 */
export function HomeDiscoverEnrichment({
  storyEvents,
}: {
  storyEvents: Event[];
}) {
  return (
    <div className="space-y-4 md:space-y-5">
      <EventStories events={storyEvents} />
    </div>
  );
}
