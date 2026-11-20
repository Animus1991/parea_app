import { describe, expect, it } from 'vitest';
import {
  conflictRevealCopy,
  fullRevealCopy,
  joinedRevealCopy,
  pastRevealCopy,
} from './quietRevealCopy';

describe('quietRevealCopy', () => {
  it('says same day, not same hour, and that tapping shows hidden nights', () => {
    const idle = conflictRevealCopy(false, 1);
    expect(idle.label[0]).toBe('Δείξε 1 που πέφτει την ίδια μέρα με σχέδιό σου');
    expect(conflictRevealCopy(false, 2).label[0]).toBe(
      'Δείξε 2 που πέφτουν την ίδια μέρα με σχέδιό σου',
    );
    expect(idle.label[1]).toContain('day you already planned');
    expect(idle.label[0]).not.toMatch(/ώρα/i);
    expect(idle.title[0]).toMatch(/ημερομηνία/);
    const on = conflictRevealCopy(true, 1);
    expect(on.label[0]).toBe('Κρύψε όσες πέφτουν την ίδια μέρα');
  });

  it('keeps full and already-joined as two separate reasons', () => {
    expect(fullRevealCopy(false, 18).label[0]).toBe('Δείξε 18 πλήρεις');
    expect(joinedRevealCopy(false, 3).label[0]).toBe('Δείξε 3 που έχεις ήδη θέση');
    expect(fullRevealCopy(false, 18).label[0]).not.toMatch(/ήδη μέσα/);
    expect(joinedRevealCopy(true, 3).label[0]).toBe('Κρύψε όσες έχεις ήδη θέση');
  });

  it('keeps past nights as a show/hide pair', () => {
    expect(pastRevealCopy(false, 2).label).toEqual(['Δείξε 2 παλιές', 'Show 2 past']);
    expect(pastRevealCopy(true, 2).label[0]).toBe('Κρύψε παλιές');
  });
});
