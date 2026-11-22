import { describe, expect, it } from 'vitest';
import { extractHashtags } from './hashtags';

describe('extractHashtags', () => {
  it('finds Greek and English tags and excludes surrounding punctuation', () => {
    expect(extractHashtags('A night in #Κοινωνικά, then #AfterWork_2026! #music.')).toEqual([
      'Κοινωνικά',
      'AfterWork_2026',
      'music',
    ]);
  });
});
