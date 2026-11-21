import { describe, expect, it } from 'vitest';
import { buildHomeFilterQuery, homeFilterQueryEquals, mergeHomeFilterQuery } from './homeUrlFilters';

describe('homeUrlFilters', () => {
  it('treats + and %20 encodings of Theater & Dance as the same filter', () => {
    const plus = new URLSearchParams('cat=Theater+%26+Dance');
    const percent = new URLSearchParams('cat=Theater%20%26%20Dance');
    expect(plus.get('cat')).toBe('Theater & Dance');
    expect(percent.get('cat')).toBe('Theater & Dance');
    expect(homeFilterQueryEquals(plus, percent)).toBe(true);
  });

  it('does not rewrite the URL when only encoding differs', () => {
    const fromState = buildHomeFilterQuery({ category: 'Theater & Dance' });
    const fromAddressBar = new URLSearchParams('cat=Theater%20%26%20Dance');
    expect(homeFilterQueryEquals(fromState, fromAddressBar)).toBe(true);
  });

  it('keeps unrelated params when clearing the category chip', () => {
    const current = new URLSearchParams('welcome=1&cat=Theater+%26+Dance');
    const next = mergeHomeFilterQuery(current, buildHomeFilterQuery({ category: 'All' }));
    expect(next.get('welcome')).toBe('1');
    expect(next.get('cat')).toBeNull();
  });

  it('clears cat without resurrecting it when the address still had it', () => {
    const urlStillHasCat = new URLSearchParams('cat=Theater+%26+Dance');
    const afterClick = buildHomeFilterQuery({ category: 'All' });
    expect(homeFilterQueryEquals(urlStillHasCat, afterClick)).toBe(false);
    const merged = mergeHomeFilterQuery(urlStillHasCat, afterClick);
    expect(merged.get('cat')).toBeNull();
    expect(homeFilterQueryEquals(merged, afterClick)).toBe(true);
  });
});
