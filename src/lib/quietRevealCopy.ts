/** Idle chips reveal nights the quiet catalog hid. Active chips hide them again. */

export type QuietRevealCopy = { label: [string, string]; title: [string, string] };

export function conflictRevealCopy(show: boolean, count: number): QuietRevealCopy {
  if (show) {
    return {
      label: ['Κρύψε όσες πέφτουν την ίδια μέρα', 'Hide ones on a day you already planned'],
      title: [
        'Άλλες εκδηλώσεις την ίδια ημερομηνία με κάτι που έχεις ήδη κλείσει.',
        'Other events on the same date as something you already booked.',
      ],
    };
  }
  return {
    label: [
      count === 1
        ? 'Δείξε 1 που πέφτει την ίδια μέρα με σχέδιό σου'
        : `Δείξε ${count} που πέφτουν την ίδια μέρα με σχέδιό σου`,
      count === 1
        ? 'Show 1 on a day you already planned'
        : `Show ${count} on a day you already planned`,
    ],
    title: [
      'Κρυμμένες γιατί είναι την ίδια ημερομηνία με σχέδιο που έχεις ήδη. Πατώντας εμφανίζονται.',
      'Hidden because they fall on a date you already planned. Tap to show them.',
    ],
  };
}

export function fullRevealCopy(show: boolean, count: number): QuietRevealCopy {
  if (show) {
    return {
      label: ['Κρύψε τις πλήρεις', 'Hide full ones'],
      title: ['Εκδηλώσεις χωρίς κενή θέση.', 'Events with no spots left.'],
    };
  }
  return {
    label: [
      count === 1 ? 'Δείξε 1 πλήρη' : `Δείξε ${count} πλήρεις`,
      count === 1 ? 'Show 1 that is full' : `Show ${count} that are full`,
    ],
    title: [
      'Κρυμμένες γιατί δεν έχει μείνει θέση. Πατώντας εμφανίζονται.',
      'Hidden because no spots are left. Tap to show them.',
    ],
  };
}

export function joinedRevealCopy(show: boolean, count: number): QuietRevealCopy {
  if (show) {
    return {
      label: ['Κρύψε όσες έχεις ήδη θέση', 'Hide ones you already joined'],
      title: ['Εκδηλώσεις στις οποίες είσαι ήδη μέλος.', 'Events you already have a spot in.'],
    };
  }
  return {
    label: [
      count === 1 ? 'Δείξε 1 που έχεις ήδη θέση' : `Δείξε ${count} που έχεις ήδη θέση`,
      count === 1 ? 'Show 1 you already joined' : `Show ${count} you already joined`,
    ],
    title: [
      'Κρυμμένες γιατί είσαι ήδη μέσα στην ομάδα. Πατώντας εμφανίζονται.',
      'Hidden because you already have a spot. Tap to show them.',
    ],
  };
}

export function pastRevealCopy(show: boolean, count: number): QuietRevealCopy {
  if (show) {
    return {
      label: ['Κρύψε παλιές', 'Hide past'],
      title: ['Εκδηλώσεις που έχουν ήδη γίνει.', 'Events that already happened.'],
    };
  }
  return {
    label: [
      count === 1 ? 'Δείξε 1 παλιά' : `Δείξε ${count} παλιές`,
      count === 1 ? 'Show 1 past' : `Show ${count} past`,
    ],
    title: [
      'Κρυμμένες γιατί έχουν περάσει. Πατώντας εμφανίζονται.',
      'Hidden because they already happened. Tap to show them.',
    ],
  };
}
