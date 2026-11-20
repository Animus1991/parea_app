import type { Event } from '../types';

type MiniOutingKind = 'coffee' | 'walk' | 'run' | 'drink';

/** Same-origin covers so plan cards still show a photo when Unsplash is blocked. */
export const MINI_OUTING_COVERS: Record<MiniOutingKind, string> = {
  coffee: '/covers/coffee.jpg',
  walk: '/covers/walk.jpg',
  run: '/covers/run.jpg',
  drink: '/covers/drink.jpg',
};

export const DEFAULT_EVENT_COVER = '/covers/default.jpg';

function miniOutingKind(event: Pick<Event, 'kind' | 'tags'>): MiniOutingKind | null {
  if (event.kind !== 'mini_outing') return null;
  const tags = event.tags ?? [];
  if (tags.includes('coffee')) return 'coffee';
  if (tags.includes('walk')) return 'walk';
  if (tags.includes('run')) return 'run';
  if (tags.includes('drink')) return 'drink';
  return 'coffee';
}

function isAppCover(url: string | undefined): boolean {
  return Boolean(url?.startsWith('/covers/'));
}

/** Always a usable cover — app file, kind cover, or a local placeholder. */
export function eventCoverUrl(event: Pick<Event, 'id' | 'imageUrl' | 'kind' | 'tags'>): string {
  if (isAppCover(event.imageUrl)) return event.imageUrl as string;
  const kind = miniOutingKind(event);
  if (kind) return MINI_OUTING_COVERS[kind];
  if (event.imageUrl) return event.imageUrl;
  return DEFAULT_EVENT_COVER;
}
