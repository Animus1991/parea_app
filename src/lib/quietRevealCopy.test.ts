import { describe, expect, it } from 'vitest';
import {
  QUIET_REVEAL_SECTION,
  conflictChipCopy,
  conflictFilterCopy,
  fullFilterCopy,
  joinedChipCopy,
  joinedFilterCopy,
  pastFilterCopy,
  quietRevealActiveCount,
} from './quietRevealCopy';

describe('quietRevealCopy', () => {
  it('uses spoken Greek in advanced filters, not show/hide chips', () => {
    expect(QUIET_REVEAL_SECTION.heading[0]).toBe('Κι άλλα που συνήθως κρύβουμε');
    expect(QUIET_REVEAL_SECTION.hint[0]).toMatch(/εκτός αν τα θες/);
    expect(conflictFilterCopy().label[0]).toBe('Την ίδια μέρα που έχεις ήδη κάτι');
    expect(joinedFilterCopy().label[0]).toBe('Αυτές που έχεις ήδη κλείσει');
    expect(fullFilterCopy().label[0]).toBe('Αυτές που γέμισαν');
    expect(pastFilterCopy().label[0]).toBe('Αυτές που έχουν περάσει');
    expect(conflictFilterCopy().label[0]).not.toMatch(/Δείξε|Κρύψε|ώρα/);
    expect(joinedFilterCopy().label[0]).not.toMatch(/Δείξε|θέση|μέσα/);
  });

  it('says same calendar day, not the same hour', () => {
    expect(conflictFilterCopy().title[0]).toMatch(/ημερομηνία/);
    expect(conflictFilterCopy().title[0]).toMatch(/όχι την ίδια ώρα/);
    expect(conflictChipCopy()[0]).toBe('Ίδια μέρα με τα δικά σου');
    expect(joinedChipCopy()[0]).toBe('Ήδη κλεισμένες');
  });

  it('counts only ticked advanced options as active filters', () => {
    expect(
      quietRevealActiveCount({
        showConflicts: true,
        showFull: false,
        showJoined: true,
        showPast: false,
      }),
    ).toBe(2);
  });
});
