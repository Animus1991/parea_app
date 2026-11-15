import { describe, expect, it } from 'vitest';
import { INTERESTS, canonicalInterest, interestLabel, sameInterest } from './interests';

describe('interestLabel', () => {
  it('translates stored ids for the current language', () => {
    expect(interestLabel('Theatre', 'el')).toBe('Θέατρο');
    expect(interestLabel('Theatre', 'en')).toBe('Theatre');
    expect(interestLabel('Nearby escapes', 'en')).toBe('Day Trips');
  });

  it('matches ids and English labels regardless of case and spacing', () => {
    expect(interestLabel(' language Exchange ', 'el')).toBe('Ανταλλαγή Γλωσσών');
    expect(interestLabel('Board Games', 'el')).toBe('Επιτραπέζια');
    expect(interestLabel('Live Music', 'el')).toBe('Ζωντανή μουσική');
  });

  it('keeps interests the user typed unchanged', () => {
    expect(interestLabel('Κεραμική', 'en')).toBe('Κεραμική');
    expect(interestLabel('Salsa', 'el')).toBe('Salsa');
  });

  it('has a Greek and English label for every onboarding choice', () => {
    for (const item of INTERESTS) {
      expect(item.gr.trim()).not.toBe('');
      expect(item.en.trim()).not.toBe('');
    }
  });
});

describe('canonicalInterest and sameInterest', () => {
  it('stores a known interest by its shared id, whatever the language it was typed in', () => {
    expect(canonicalInterest('θέατρο')).toBe('Theatre');
    expect(canonicalInterest('Day Trips')).toBe('Nearby escapes');
    expect(canonicalInterest('Ζωντανή μουσική')).toBe('Live Music');
    expect(canonicalInterest('  Κεραμική ')).toBe('Κεραμική');
  });

  it('treats the Greek and English names of one interest as the same', () => {
    expect(sameInterest('Θέατρο', 'Theatre')).toBe(true);
    expect(sameInterest('Cinema', 'Theatre')).toBe(false);
    expect(sameInterest('salsa', 'Salsa ')).toBe(true);
  });
});
