/**
 * Temporary Discover preview: the first five feed cards try five image
 * depths so we can compare against the current photo-only card.
 * Remove this file and the `imageDepth` wiring to revert.
 */
export type EventCardImageDepth =
  | 'photo'
  | 'title'
  | 'facts'
  | 'organizer'
  | 'divider'
  | 'full';

export const DISCOVER_IMAGE_DEPTH_PREVIEW: EventCardImageDepth[] = [
  'title',
  'facts',
  'organizer',
  'divider',
  'full',
];

export function discoverFeedImageDepth(index: number): EventCardImageDepth {
  return DISCOVER_IMAGE_DEPTH_PREVIEW[index] ?? 'photo';
}
