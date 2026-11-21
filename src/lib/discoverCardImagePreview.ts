import { readStorage, writeStorage } from './safeUrl';

/**
 * Card-photo depth: a picker applies one overlay depth to every event card
 * (Discover, Plans, Find Nakamas, and the web right rail). Phone and web
 * both offer every depth.
 */
export type EventCardImageDepth =
  | 'photo'
  | 'title'
  | 'facts'
  | 'organizer'
  | 'roomy'
  | 'divider'
  | 'full';

export const CARD_IMAGE_DEPTH_STORAGE_KEY = 'nakamas-card-image-depth';

export const CARD_IMAGE_DEPTHS = [
  'photo',
  'title',
  'facts',
  'organizer',
  'roomy',
  'divider',
  'full',
] as const satisfies readonly EventCardImageDepth[];

/** First-time / newly registered users start with a full-bleed card photo. */
export const DEFAULT_CARD_IMAGE_DEPTH: EventCardImageDepth = 'full';

/** Which rows sit on the photo for a given depth. Shared by Discover, Plans, Find Nakamas, and the web rail. */
export function cardImageDepthFlags(depth: EventCardImageDepth) {
  const coverTitle = depth !== 'photo';
  const coverFacts =
    depth === 'facts' ||
    depth === 'organizer' ||
    depth === 'roomy' ||
    depth === 'divider' ||
    depth === 'full';
  const coverOrganizer =
    depth === 'organizer' ||
    depth === 'roomy' ||
    depth === 'divider' ||
    depth === 'full';
  const coverRoomy = depth === 'roomy';
  const coverProgress = depth === 'divider' || depth === 'full';
  const coverFull = depth === 'full';
  return {
    coverTitle,
    coverFacts,
    coverOrganizer,
    coverRoomy,
    coverProgress,
    coverFull,
    photoFillsCard: coverProgress || coverRoomy,
  };
}

export const CARD_IMAGE_DEPTH_LABELS: Record<EventCardImageDepth, [string, string]> = {
  photo: ['Συμπαγής', 'Standard'],
  title: ['Τίτλος', 'Title'],
  facts: ['Στοιχεία', 'Facts'],
  organizer: ['Διοργανωτής', 'Organizer'],
  roomy: ['Άνετη', 'Roomy'],
  divider: ['Πρόοδος', 'Progress'],
  full: ['Πλήρης', 'Full'],
};

export function parseCardImageDepth(raw: string | null | undefined): EventCardImageDepth {
  return CARD_IMAGE_DEPTHS.includes(raw as EventCardImageDepth)
    ? (raw as EventCardImageDepth)
    : DEFAULT_CARD_IMAGE_DEPTH;
}

export function readStoredCardImageDepth(): EventCardImageDepth {
  return parseCardImageDepth(readStorage(CARD_IMAGE_DEPTH_STORAGE_KEY));
}

const cardImageDepthListeners = new Set<(depth: EventCardImageDepth) => void>();

/** Same-tab subscribers (the suitcase sheet stays mounted while Discover/Plans change). */
export function subscribeCardImageDepth(listener: (depth: EventCardImageDepth) => void): () => void {
  cardImageDepthListeners.add(listener);
  return () => {
    cardImageDepthListeners.delete(listener);
  };
}

export function writeStoredCardImageDepth(depth: EventCardImageDepth): void {
  writeStorage(CARD_IMAGE_DEPTH_STORAGE_KEY, depth);
  cardImageDepthListeners.forEach((listener) => listener(depth));
}

/** Persist Full for a new account unless the person already picked a depth. */
export function applyDefaultCardImageDepthIfUnset(): EventCardImageDepth {
  const raw = readStorage(CARD_IMAGE_DEPTH_STORAGE_KEY);
  if (CARD_IMAGE_DEPTHS.includes(raw as EventCardImageDepth)) {
    return raw as EventCardImageDepth;
  }
  writeStoredCardImageDepth(DEFAULT_CARD_IMAGE_DEPTH);
  return DEFAULT_CARD_IMAGE_DEPTH;
}
