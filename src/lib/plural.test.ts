import { describe, expect, it } from 'vitest';
import { countNoun } from './plural';

describe('countNoun', () => {
  it('uses the singular only for exactly one', () => {
    expect(countNoun(1, 'εκδήλωση', 'εκδηλώσεις')).toBe('1 εκδήλωση');
    expect(countNoun(0, 'εκδήλωση', 'εκδηλώσεις')).toBe('0 εκδηλώσεις');
    expect(countNoun(3, 'event', 'events')).toBe('3 events');
  });
});
