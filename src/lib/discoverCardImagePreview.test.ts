import { describe, expect, it } from 'vitest';
import {
  CARD_IMAGE_DEPTH_STORAGE_KEY,
  cardImageDepthOptions,
  clampCardImageDepth,
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

describe('clampCardImageDepth', () => {
  it('leaves every web depth unchanged', () => {
    expect(clampCardImageDepth('title', true)).toBe('title');
    expect(clampCardImageDepth('organizer', true)).toBe('organizer');
    expect(clampCardImageDepth('divider', true)).toBe('divider');
  });

  it('maps web-only depths to the nearest phone option', () => {
    expect(clampCardImageDepth('title', false)).toBe('photo');
    expect(clampCardImageDepth('organizer', false)).toBe('facts');
    expect(clampCardImageDepth('divider', false)).toBe('full');
    expect(clampCardImageDepth('photo', false)).toBe('photo');
    expect(clampCardImageDepth('facts', false)).toBe('facts');
    expect(clampCardImageDepth('full', false)).toBe('full');
  });
});

describe('cardImageDepthOptions', () => {
  it('offers 3 on phone and 6 on web', () => {
    expect(cardImageDepthOptions(false)).toEqual(['photo', 'facts', 'full']);
    expect(cardImageDepthOptions(true)).toHaveLength(6);
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
