import { EventStories } from './EventStories';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { useLanguage } from '../../lib/i18n';
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
  const { t } = useLanguage();

  return (
    <div className="space-y-4 md:space-y-5">
      <p className="text-sm leading-relaxed text-ink-muted">
        {t(
          'Βρες μια βραδιά να μπεις. Τα Σχέδια είναι οι βραδιές που έχεις ήδη κλείσει.',
          'Find a night to join. Plans are the nights you already booked.',
        )}
      </p>
      <EventStories events={storyEvents} />
      <CopilotInlinePrompt
        title={{ el: 'Πες τι βραδιά ψάχνεις', en: 'Tell us what kind of night you want' }}
        subtitle={{
          el: 'Βρίσκει εκδηλώσεις να μπεις — όχι τα σχέδια που έχεις ήδη κλείσει.',
          en: 'Finds nights you can join — not the ones you already booked.',
        }}
      />
    </div>
  );
}
