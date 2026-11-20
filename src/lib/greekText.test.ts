import { describe, expect, it } from 'vitest';
import { toTitleCase } from './greekText';

describe('toTitleCase', () => {
  it('keeps only the first letter of each word capital', () => {
    expect(toTitleCase('ΔΗΜΟΦΙΛΗ ΤΩΡΑ')).toBe('Δημοφιλη Τωρα');
    expect(toTitleCase('αποτελέσματα')).toBe('Αποτελέσματα');
    expect(toTitleCase('results found')).toBe('Results Found');
    expect(toTitleCase('Δημοφιλή Τώρα')).toBe('Δημοφιλή Τώρα');
  });

  it('keeps short acronyms and brand tokens', () => {
    expect(toTitleCase('FAQ')).toBe('FAQ');
    expect(toTitleCase('Ρώτα το AI')).toBe('Ρώτα Το AI');
    expect(toTitleCase('GIPHY')).toBe('GIPHY');
    expect(toTitleCase('Find Nakamas')).toBe('Find Nakamas');
  });
});
