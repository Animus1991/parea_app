/** Advanced-filter copy for nights the quiet catalog hides by default. */

export type QuietRevealCopy = { label: [string, string]; title: [string, string] };

export type QuietRevealFilterState = {
  conflictCount: number;
  showConflicts: boolean;
  onToggleConflicts: () => void;
  fullCount: number;
  showFull: boolean;
  onToggleFull: () => void;
  joinedCount: number;
  showJoined: boolean;
  onToggleJoined: () => void;
  pastCount: number;
  showPast: boolean;
  onTogglePast: () => void;
};

export const QUIET_REVEAL_SECTION = {
  heading: ['Κι άλλα που συνήθως κρύβουμε', 'Usually hidden'] as [string, string],
  hint: [
    'Δεν τα βάζουμε στο feed, εκτός αν τα θες.',
    'They stay off the feed unless you tick them.',
  ] as [string, string],
};

export function quietRevealActiveCount(
  state: Pick<QuietRevealFilterState, 'showConflicts' | 'showFull' | 'showJoined' | 'showPast'>,
): number {
  return [state.showConflicts, state.showFull, state.showJoined, state.showPast].filter(Boolean)
    .length;
}

export function hasQuietRevealOptions(
  state: Pick<QuietRevealFilterState, 'conflictCount' | 'fullCount' | 'joinedCount' | 'pastCount'>,
): boolean {
  return state.conflictCount + state.fullCount + state.joinedCount + state.pastCount > 0;
}

export function conflictFilterCopy(): QuietRevealCopy {
  return {
    label: ['Την ίδια μέρα που έχεις ήδη κάτι', 'Same day as something you already booked'],
    title: [
      'Άλλες βραδιές την ίδια ημερομηνία — όχι την ίδια ώρα — με κάτι που έχεις ήδη κλείσει.',
      'Other nights on the same date — not the same hour — as something you already booked.',
    ],
  };
}

export function fullFilterCopy(): QuietRevealCopy {
  return {
    label: ['Αυτές που γέμισαν', 'Ones that filled up'],
    title: ['Δεν έχει μείνει θέση.', 'No spots left.'],
  };
}

export function joinedFilterCopy(): QuietRevealCopy {
  return {
    label: ['Αυτές που έχεις ήδη κλείσει', "Ones you've already booked"],
    title: ['Είσαι ήδη μέσα στην ομάδα.', 'You already have a spot.'],
  };
}

export function pastFilterCopy(): QuietRevealCopy {
  return {
    label: ['Αυτές που έχουν περάσει', 'Past ones'],
    title: ['Έχουν ήδη γίνει.', 'Already happened.'],
  };
}

export function conflictChipCopy(): [string, string] {
  return ['Ίδια μέρα με τα δικά σου', 'Same day as yours'];
}

export function fullChipCopy(): [string, string] {
  return ['Γεμάτες', 'Full'];
}

export function joinedChipCopy(): [string, string] {
  return ['Ήδη κλεισμένες', 'Already booked'];
}

export function pastChipCopy(): [string, string] {
  return ['Παλιές', 'Past'];
}
