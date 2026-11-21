import { describe, expect, it } from 'vitest';
import { formatEur } from './money';

const NBSP = ' ';

describe('formatEur', () => {
  it('writes Greek amounts with a decimal comma and the sign after', () => {
    expect(formatEur(55, 'el')).toBe(`55${NBSP}€`);
    expect(formatEur(345.5, 'el')).toBe(`345,50${NBSP}€`);
    expect(formatEur(1345.5, 'el')).toBe(`1.345,50${NBSP}€`);
  });

  it('writes English amounts with the sign first', () => {
    expect(formatEur(55, 'en')).toBe('€55');
    expect(formatEur(345.5, 'en')).toBe('€345.50');
  });

  it('shows cents on request, for balances and ledgers', () => {
    expect(formatEur(85, 'el', true)).toBe(`85,00${NBSP}€`);
    expect(formatEur(85, 'en', true)).toBe('€85.00');
  });
});
