import { readStorage, writeStorage } from './safeUrl';

/**
 * Temporary Discover preview: a feed picker applies one photo depth to every
 * card. Phone and web both offer all 6 depths while we compare. Remove this
 * file and the `imageDepth` wiring to revert.
 */
export type EventCardImageDepth =
  | 'photo'
  | 'title'
  | 'facts'
  | 'organizer'
  | 'divider'
  | 'full';

export const CARD_IMAGE_DEPTH_STORAGE_KEY = 'nakamas-card-image-depth';

export const CARD_IMAGE_DEPTHS = [
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

export function parseCardImageDepth(raw: string | null | undefined): EventCardImageDepth {
  return CARD_IMAGE_DEPTHS.includes(raw as EventCardImageDepth) ? (raw as EventCardImageDepth) : 'photo';
}

export function readStoredCardImageDepth(): EventCardImageDepth {
  return parseCardImageDepth(readStorage(CARD_IMAGE_DEPTH_STORAGE_KEY));
}

export function writeStoredCardImageDepth(depth: EventCardImageDepth): void {
  writeStorage(CARD_IMAGE_DEPTH_STORAGE_KEY, depth);
}
