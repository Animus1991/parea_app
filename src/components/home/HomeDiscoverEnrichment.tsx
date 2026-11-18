import { ReactNode } from 'react';
import { EventStories } from './EventStories';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { HomeBuddySeekStrip } from '../buddySeek/HomeBuddySeekStrip';
import { CollectionsRail } from '../outings/CollectionsRail';
import type { Event } from '../../types';

/** Stories, AI, buddy-seek and collections — after the first joinable cards. */
export function HomeDiscoverEnrichment({
  storyEvents,
  extra,
}: {
  storyEvents: Event[];
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-4 md:space-y-5">
      <EventStories events={storyEvents} />
      <CopilotInlinePrompt />
      <HomeBuddySeekStrip />
      {extra}
      <CollectionsRail />
    </div>
  );
}
