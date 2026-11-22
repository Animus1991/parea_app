import { describe, expect, it } from 'vitest';
import {
  EMOJI_CATEGORIES,
  EMOJI_KEYWORDS,
  FEELINGS,
  GIPHY_CATALOG,
  NAKAMAS_STICKERS,
  STORY_BG_GRADIENTS,
  WALL_TEXT_BACKGROUNDS,
  searchEmojis,
} from './chatMediaCatalog';

describe('shared chat and Wall media catalog', () => {
  it('keeps eight emoji groups with searchable Greek and English terms for every emoji', () => {
    const emojis = new Set(EMOJI_CATEGORIES.flatMap((category) => category.emojis));
    expect(EMOJI_CATEGORIES).toHaveLength(8);
    expect(EMOJI_CATEGORIES.every((category) => category.emojis.length === 16)).toBe(true);
    expect([...emojis].every((emoji) => EMOJI_KEYWORDS[emoji]?.length)).toBe(true);
    expect(searchEmojis('καφες')).toContain('☕');
  });

  it('retains the ten verified remote GIFs and uses local fallbacks for curated additions', () => {
    const remote = GIPHY_CATALOG.filter((gif) => gif.url.startsWith('https://'));
    expect(remote).toHaveLength(10);
    expect(GIPHY_CATALOG.length).toBeGreaterThanOrEqual(40);
    expect(GIPHY_CATALOG.every((gif) => gif.category && gif.fallbackSvgDataUrl.startsWith('data:image/svg+xml'))).toBe(true);
    expect(GIPHY_CATALOG.filter((gif) => gif.url.startsWith('data:image/svg+xml')).length).toBeGreaterThanOrEqual(30);
  });

  it('provides bilingual stickers, feelings, and a background for each story gradient', () => {
    expect(NAKAMAS_STICKERS).toHaveLength(10);
    expect(FEELINGS).toHaveLength(12);
    expect(WALL_TEXT_BACKGROUNDS.map((background) => background.id)).toEqual(['bg1', 'bg2', 'bg3', 'bg4', 'bg5']);
    expect(WALL_TEXT_BACKGROUNDS.map((background) => background.gradient)).toEqual([...STORY_BG_GRADIENTS]);
  });
});
