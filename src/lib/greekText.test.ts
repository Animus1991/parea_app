import { describe, expect, it } from 'vitest';
import { foldSearchText, toTitleCase } from './greekText';

describe('foldSearchText', () => {
  it('folds accented and uppercase Greek to the same key', () => {
    expect(foldSearchText('ΑΘΗΝΑ')).toBe(foldSearchText('Αθήνα'));
    expect(foldSearchText('ΘΗΣΕΙΟ')).toBe(foldSearchText('Θησείο'));
    expect(foldSearchText('αθήνα')).toBe(foldSearchText('Αθήνα'));
  });
});

describe('toTitleCase', () => {
  it('keeps only the first letter of each word capital', () => {
    expect(toTitleCase('ΔΗΜΟΦΙΛΗ ΤΩΡΑ')).toBe('Δημοφιλη Τωρα');
    expect(toTitleCase('αποτελέσματα')).toBe('Αποτελέσματα');
    expect(toTitleCase('results found')).toBe('Results Found');
    expect(toTitleCase('Δημοφιλή Τώρα')).toBe('Δημοφιλή Τώρα');
  });

  it('keeps short acronyms and brand tokens', () => {
    expect(toTitleCase('FAQ')).toBe('FAQ');
    expect(toTitleCase('Ρώτα το AI')).toBe('Ρώτα το AI');
    expect(toTitleCase('GIPHY')).toBe('GIPHY');
    expect(toTitleCase('Find Nakamas')).toBe('Find Nakamas');
  });

  it('keeps articles, prepositions and possessives small inside a title', () => {
    expect(toTitleCase('Εκδηλώσεις σε στιγμιότυπα')).toBe('Εκδηλώσεις σε Στιγμιότυπα');
    expect(toTitleCase('Ανοιχτό σε ιδέες')).toBe('Ανοιχτό σε Ιδέες');
    expect(toTitleCase('τα σχέδιά μου')).toBe('Τα Σχέδιά μου');
    expect(toTitleCase('events in stories')).toBe('Events in Stories');
  });

  it('capitalises a small word that opens the title or follows a colon', () => {
    expect(toTitleCase('σε εξέλιξη')).toBe('Σε Εξέλιξη');
    expect(toTitleCase('Επόμενο: πότε και πού')).toBe('Επόμενο: Πότε και Πού');
  });
});
