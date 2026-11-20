import { describe, expect, it } from 'vitest';
import {
  catalogEventTags,
  eventHasTag,
  eventTagMatchCount,
  eventTagPath,
  eventTagSlug,
  eventsForTag,
  eventsForTags,
  findCataloguedTag,
  groupTagsByLetter,
  parseTagSlugs,
  tagLetter,
  tagMatchesQuery,
  tagsIndexPath,
  tagsMatch,
  toggleTagSlug,
} from './eventTags';

describe('eventTags', () => {
  it('slugs mixed case, spaces and punctuation into a stable path', () => {
    expect(eventTagSlug('Nakamas Nights')).toBe('nakamas-nights');
    expect(eventTagSlug('  board games ')).toBe('board-games');
    expect(eventTagSlug('καφές')).toBe('coffee');
    expect(eventTagSlug('boardgames')).toBe('board-games');
    expect(eventTagSlug('run')).toBe('running');
    expect(eventTagPath('Nakamas Nights')).toBe('/tags/nakamas-nights');
    expect(tagsMatch('nakamas nights', 'Nakamas-Nights')).toBe(true);
  });

  it('catalogues unique tags by event count, not tag repeats on one event', () => {
    const catalog = catalogEventTags([
      { tags: ['nakamas nights', 'social', 'nakamas nights'] },
      { tags: ['Nakamas Nights', 'workshop'] },
      { tags: ['social'] },
    ]);
    expect(catalog.map((item) => [item.slug, item.count])).toEqual([
      ['nakamas-nights', 2],
      ['social', 2],
      ['workshop', 1],
    ]);
    expect(eventsForTag([{ tags: ['nakamas nights'] }, { tags: ['wine'] }], 'Nakamas-Nights')).toHaveLength(1);
    expect(eventHasTag({ tags: ['board games'] }, 'board-games')).toBe(true);
    const merged = catalogEventTags([
      { tags: ['boardgames'] },
      { tags: ['board games'] },
      { tags: ['boardgames', 'social'] },
    ]);
    expect(merged.find((item) => item.slug === 'board-games')?.count).toBe(3);
    expect(merged.filter((item) => item.slug === 'board-games')).toHaveLength(1);
  });

  it('filters the directory by label, raw tag or slug', () => {
    const item = { tag: 'nakamas nights', slug: 'nakamas-nights', count: 3 };
    expect(tagMatchesQuery(item, 'nights', 'Nakamas Nights')).toBe(true);
    expect(tagMatchesQuery(item, 'nakamas nights', 'Nakamas Nights')).toBe(true);
    expect(tagMatchesQuery(item, 'workshop', 'Nakamas Nights')).toBe(false);
  });

  it('groups tags by the displayed first letter', () => {
    const groups = groupTagsByLetter(
      [
        { tag: 'workshop', slug: 'workshop', count: 1 },
        { tag: 'wine', slug: 'wine', count: 1 },
        { tag: 'nakamas nights', slug: 'nakamas-nights', count: 2 },
      ],
      (tag) => (tag === 'workshop' ? 'Εργαστήριο' : tag),
      'el',
    );
    const byLetter = Object.fromEntries(
      groups.map((group) => [group.letter, group.tags.map((item) => item.slug)]),
    );
    expect(byLetter['Ε']).toEqual(['workshop']);
    expect(byLetter.N).toEqual(['nakamas-nights']);
    expect(byLetter.W).toEqual(['wine']);
    expect(tagLetter('Εργαστήριο', 'el')).toBe('Ε');
    expect(groups.map((group) => group.letter)).toEqual(['Ε', 'N', 'W']);
    expect(findCataloguedTag(
      [{ tag: 'nakamas nights', slug: 'nakamas-nights', count: 2 }],
      'Nakamas-Nights',
    )?.tag).toBe('nakamas nights');
  });

  it('toggles several slugs into a shareable tags-index path', () => {
    expect(parseTagSlugs(['yoga', 'hiking,yoga'])).toEqual(['yoga', 'hiking']);
    expect(toggleTagSlug(['yoga'], 'hiking')).toEqual(['yoga', 'hiking']);
    expect(toggleTagSlug(['yoga', 'hiking'], 'yoga')).toEqual(['hiking']);
    expect(tagsIndexPath(['yoga'])).toBe('/tags/yoga');
    expect(tagsIndexPath(['yoga', 'hiking'])).toBe('/tags?t=yoga&t=hiking');
    expect(tagsIndexPath([])).toBe('/tags');
  });

  it('unions events across selected tags and counts overlaps', () => {
    const yoga = { tags: ['yoga'] };
    const both = { tags: ['yoga', 'hiking'] };
    const hike = { tags: ['hiking'] };
    const wine = { tags: ['wine'] };
    expect(eventsForTags([yoga, both, hike, wine], ['yoga', 'hiking'])).toEqual([yoga, both, hike]);
    expect(eventTagMatchCount(both, ['yoga', 'hiking'])).toBe(2);
    expect(eventTagMatchCount(wine, ['yoga', 'hiking'])).toBe(0);
    expect(
      eventTagMatchCount(
        { tags: ['boardgames', 'board games', 'boardgames'] },
        ['board-games', 'social'],
      ),
    ).toBe(1);
    expect(
      eventTagMatchCount({ tags: ['board games', 'social'] }, ['board-games', 'social']),
    ).toBe(2);
  });
});
