import { describe, expect, it } from 'vitest';
import {
  CARD_IMAGE_DEPTH_STORAGE_KEY,
  CARD_IMAGE_DEPTHS,
  DEFAULT_CARD_IMAGE_DEPTH,
  applyDefaultCardImageDepthIfUnset,
  cardImageDepthFlags,
  parseCardImageDepth,
  readStoredCardImageDepth,
  writeStoredCardImageDepth,
} from './discoverCardImagePreview';

describe('parseCardImageDepth', () => {
  it('keeps known depths and falls back to full', () => {
    expect(parseCardImageDepth('facts')).toBe('facts');
    expect(parseCardImageDepth('divider')).toBe('divider');
    expect(parseCardImageDepth('nope')).toBe('full');
    expect(parseCardImageDepth(null)).toBe('full');
    expect(DEFAULT_CARD_IMAGE_DEPTH).toBe('full');
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

describe('cardImageDepthFlags', () => {
  it('keeps the compact photo empty of text', () => {
    expect(cardImageDepthFlags('photo')).toMatchObject({
      coverTitle: false,
      coverFacts: false,
      coverOrganizer: false,
      coverProgress: false,
      coverFull: false,
    });
  });

  it('stacks title, facts, organizer, progress then full', () => {
    expect(cardImageDepthFlags('title').coverTitle).toBe(true);
    expect(cardImageDepthFlags('title').coverFacts).toBe(false);
    expect(cardImageDepthFlags('facts').coverFacts).toBe(true);
    expect(cardImageDepthFlags('organizer').coverOrganizer).toBe(true);
    expect(cardImageDepthFlags('roomy').photoFillsCard).toBe(true);
    expect(cardImageDepthFlags('divider').coverProgress).toBe(true);
    expect(cardImageDepthFlags('full')).toMatchObject({ coverFull: true, coverProgress: true });
  });
});

describe('card image depth storage', () => {
  it('round-trips a chosen depth', () => {
    localStorage.removeItem(CARD_IMAGE_DEPTH_STORAGE_KEY);
    expect(readStoredCardImageDepth()).toBe('full');
    writeStoredCardImageDepth('photo');
    expect(readStoredCardImageDepth()).toBe('photo');
  });

  it('writes Full for a new user and keeps a later choice', () => {
    localStorage.removeItem(CARD_IMAGE_DEPTH_STORAGE_KEY);
    expect(applyDefaultCardImageDepthIfUnset()).toBe('full');
    expect(localStorage.getItem(CARD_IMAGE_DEPTH_STORAGE_KEY)).toBe('full');
    writeStoredCardImageDepth('title');
    expect(applyDefaultCardImageDepthIfUnset()).toBe('title');
  });
});
