import { describe, expect, it } from 'vitest';
import {
  CARD_IMAGE_DEPTH_STORAGE_KEY,
  CARD_IMAGE_DEPTHS,
  parseCardImageDepth,
  readStoredCardImageDepth,
  writeStoredCardImageDepth,
} from './discoverCardImagePreview';

describe('parseCardImageDepth', () => {
  it('keeps known depths and falls back to photo', () => {
    expect(parseCardImageDepth('facts')).toBe('facts');
    expect(parseCardImageDepth('divider')).toBe('divider');
    expect(parseCardImageDepth('nope')).toBe('photo');
    expect(parseCardImageDepth(null)).toBe('photo');
  });
});

describe('CARD_IMAGE_DEPTHS', () => {
  it('offers all preview depths for phone and web', () => {
    expect(CARD_IMAGE_DEPTHS).toEqual([
      'photo',
      'title',
      'facts',
      'organizer',
      'roomy',
      'divider',
      'full',
    ]);
  });
});

describe('card image depth storage', () => {
  it('round-trips a chosen depth', () => {
    localStorage.removeItem(CARD_IMAGE_DEPTH_STORAGE_KEY);
    expect(readStoredCardImageDepth()).toBe('photo');
    writeStoredCardImageDepth('full');
    expect(readStoredCardImageDepth()).toBe('full');
  });
});
