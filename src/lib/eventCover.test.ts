import { describe, expect, it } from 'vitest';
import { eventCoverUrl, MINI_OUTING_COVERS } from './eventCover';

describe('eventCoverUrl', () => {
  it('keeps an event that already has a photo', () => {
    expect(
      eventCoverUrl({ id: 'e1', imageUrl: 'https://example.com/cover.jpg', tags: ['coffee'] }),
    ).toBe('https://example.com/cover.jpg');
  });

  it('gives mini outings a photo that matches the kind', () => {
    expect(
      eventCoverUrl({ id: 'mo1', kind: 'mini_outing', tags: ['coffee', 'mini outing'] }),
    ).toBe(MINI_OUTING_COVERS.coffee);
    expect(
      eventCoverUrl({ id: 'mo2', kind: 'mini_outing', tags: ['run', 'mini outing'] }),
    ).toBe(MINI_OUTING_COVERS.run);
  });

  it('falls back to a stable placeholder for other events', () => {
    expect(eventCoverUrl({ id: 'e99' })).toBe('https://picsum.photos/seed/e99/800/600');
  });
});
