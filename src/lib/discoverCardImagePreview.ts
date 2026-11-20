/**
 * Temporary Discover preview: the first three feed cards try three image
 * depths so we can compare against the current photo-only card.
 * Remove this file and the `imageDepth` wiring to revert.
 */
export type EventCardImageDepth = 'photo' | 'title' | 'facts' | 'organizer';

export const DISCOVER_IMAGE_DEPTH_PREVIEW: EventCardImageDepth[] = [
  'title',
  'facts',
  'organizer',
];

export function discoverFeedImageDepth(index: number): EventCardImageDepth {
  return DISCOVER_IMAGE_DEPTH_PREVIEW[index] ?? 'photo';
}
