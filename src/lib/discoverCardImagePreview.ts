import { readStorage, writeStorage } from './safeUrl';

/**
 * Temporary Discover preview: a feed picker applies one photo depth to every
 * card. Phone offers 3 depths; web offers all 6. Remove this file and the
 * `imageDepth` wiring to revert.
 */
export type EventCardImageDepth =
  | 'photo'
  | 'title'
  | 'facts'
  | 'organizer'
  | 'divider'
  | 'full';

export const CARD_IMAGE_DEPTH_STORAGE_KEY = 'nakamas-card-image-depth';

export const MOBILE_CARD_IMAGE_DEPTHS = ['photo', 'facts', 'full'] as const satisfies readonly EventCardImageDepth[];

export const WEB_CARD_IMAGE_DEPTHS = [
  'photo',
  'title',
  'facts',
  'organizer',
  'divider',
  'full',
] as const satisfies readonly EventCardImageDepth[];

export const CARD_IMAGE_DEPTH_LABELS: Record<EventCardImageDepth, [string, string]> = {
  photo: ['Συμπαγής', 'Standard'],
  title: ['Τίτλος', 'Title'],
  facts: ['Στοιχεία', 'Facts'],
  organizer: ['Διοργανωτής', 'Organizer'],
  divider: ['Πρόοδος', 'Progress'],
  full: ['Πλήρης', 'Full'],
};

const ALL_DEPTHS: readonly EventCardImageDepth[] = WEB_CARD_IMAGE_DEPTHS;

export function parseCardImageDepth(raw: string | null | undefined): EventCardImageDepth {
  return ALL_DEPTHS.includes(raw as EventCardImageDepth) ? (raw as EventCardImageDepth) : 'photo';
}

/** Phone only keeps Standard / Facts / Full. Do not write the clamp back. */
export function clampCardImageDepth(
  depth: EventCardImageDepth,
  isWebView: boolean,
): EventCardImageDepth {
  if (isWebView) return depth;
  if (depth === 'title') return 'photo';
  if (depth === 'organizer') return 'facts';
  if (depth === 'divider') return 'full';
  return depth;
}

export function cardImageDepthOptions(isWebView: boolean): readonly EventCardImageDepth[] {
  return isWebView ? WEB_CARD_IMAGE_DEPTHS : MOBILE_CARD_IMAGE_DEPTHS;
}

export function readStoredCardImageDepth(): EventCardImageDepth {
  return parseCardImageDepth(readStorage(CARD_IMAGE_DEPTH_STORAGE_KEY));
}

export function writeStoredCardImageDepth(depth: EventCardImageDepth): void {
  writeStorage(CARD_IMAGE_DEPTH_STORAGE_KEY, depth);
}
