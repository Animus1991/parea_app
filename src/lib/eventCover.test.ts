import { describe, expect, it } from 'vitest';
import { DEFAULT_EVENT_COVER, eventCoverUrl, MINI_OUTING_COVERS } from './eventCover';

describe('eventCoverUrl', () => {
  it('keeps a catalog event that already has a photo', () => {
    expect(
      eventCoverUrl({ id: 'e1', imageUrl: 'https://example.com/cover.jpg' }),
    ).toBe('https://example.com/cover.jpg');
  });

  it('gives mini outings a same-origin photo even if a remote URL was stored', () => {
    expect(
      eventCoverUrl({
        id: 'mo1',
        kind: 'mini_outing',
        tags: ['coffee', 'mini outing'],
        imageUrl: 'https://images.unsplash.com/photo-old',
      }),
    ).toBe(MINI_OUTING_COVERS.coffee);
    expect(
      eventCoverUrl({ id: 'mo2', kind: 'mini_outing', tags: ['run', 'mini outing'] }),
    ).toBe(MINI_OUTING_COVERS.run);
  });

  it('falls back to a local placeholder for other events', () => {
    expect(eventCoverUrl({ id: 'e99' })).toBe(DEFAULT_EVENT_COVER);
  });
});
