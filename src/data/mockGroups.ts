import { Group } from '../types';

export const mockGroups: Group[] = [
  {
    id: 'g1',
    eventId: 'e1',
    hostId: 'u2',
    members: ['u2'],
    pendingMembers: ['u3'],
    targetSize: 4,
    status: 'pending',
    discountUnlocked: false,
    isRecruiting: true,
    recruitingNote: 'Καλωσορίζουμε 1-2 ακόμη για την έκθεση',
  },
  {
    id: 'g2',
    eventId: 'e4',
    hostId: 'u1',
    members: ['u1', 'u2', 'u3', 'u4'],
    pendingMembers: [],
    targetSize: 7,
    status: 'confirmed',
    discountUnlocked: false,
    isRecruiting: true,
    recruitingNote: 'Cine Thisio open-air — ήσυχη μικρή παρέα, 3 θέσεις ακόμη',
    meetingPoint: 'Cine Thisio, Apostolou Pavlou 7',
  },
];
