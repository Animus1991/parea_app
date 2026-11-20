import type { Event } from '../types';

type MiniOutingKind = 'coffee' | 'walk' | 'run' | 'drink';

/** Kind-specific covers for member-created mini outings that have no photo of their own. */
export const MINI_OUTING_COVERS: Record<MiniOutingKind, string> = {
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop',
  walk: 'https://images.unsplash.com/photo-1472745942893-4b9f730c7668?w=800&h=600&fit=crop',
  run: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
  drink: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&h=600&fit=crop',
};

function miniOutingKind(event: Pick<Event, 'kind' | 'tags'>): MiniOutingKind | null {
  if (event.kind !== 'mini_outing') return null;
  const tags = event.tags ?? [];
  if (tags.includes('coffee')) return 'coffee';
  if (tags.includes('walk')) return 'walk';
  if (tags.includes('run')) return 'run';
  if (tags.includes('drink')) return 'drink';
  return 'coffee';
}

/** Always a usable cover — seed photo, kind cover, or a stable placeholder. */
export function eventCoverUrl(event: Pick<Event, 'id' | 'imageUrl' | 'kind' | 'tags'>): string {
  if (event.imageUrl) return event.imageUrl;
  const kind = miniOutingKind(event);
  if (kind) return MINI_OUTING_COVERS[kind];
  return `https://picsum.photos/seed/${encodeURIComponent(event.id)}/800/600`;
}
