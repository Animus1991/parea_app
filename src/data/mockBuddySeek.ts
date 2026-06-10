import type { BuddySeekIntent } from '../types/buddySeek';

export const mockBuddySeekIntents: BuddySeekIntent[] = [
  {
    id: 'bs1',
    userId: 'u3',
    eventId: 'e4',
    message: 'Πρώτη φορά σε stand-up — θα ήθελα μικρή παρέα!',
    matchPreference: 'any',
    openToJoinGroup: true,
    visibility: 'similar_interests',
    status: 'active',
    createdAt: '2026-05-28T10:00:00.000Z',
    updatedAt: '2026-05-28T10:00:00.000Z',
  },
  {
    id: 'bs2',
    userId: 'u2',
    eventId: 'e1',
    message: 'Ψάχνω 1-2 άτομα για έκθεση το Σάββατο.',
    matchPreference: 'individuals',
    openToJoinGroup: true,
    visibility: 'similar_interests',
    status: 'active',
    createdAt: '2026-05-29T14:30:00.000Z',
    updatedAt: '2026-05-29T14:30:00.000Z',
  },
];
