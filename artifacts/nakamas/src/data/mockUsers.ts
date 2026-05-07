import { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: 'Alex',
    ageRange: '28-34',
    city: 'Athens',
    bio: 'Passionate about culture, art and discovering new hidden gems in the city.',
    interests: ['Theatre', 'Stand-up', 'Cinema', 'Wine Tasting', 'Tech Meetups'],
    trustTier: '3_high_trust',
    reliabilityScore: 95,
    badges: ['Reliable participant', 'Phone verified', 'Payment verified'],
    photoUrl: 'https://i.pravatar.cc/200?u=u1',
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: true,
    idVerified: false,
    isOrganizer: false,
    connections: ['u2', 'u3', 'org1']
  },
  {
    id: 'u2',
    name: 'Maria',
    ageRange: '24-29',
    city: 'Athens',
    bio: 'Always up for an adventure or a quiet evening with board games.',
    interests: ['Hiking', 'Board games', 'Exhibitions', 'Photography', 'Language Exchange'],
    trustTier: '2_confirmed',
    reliabilityScore: 85,
    badges: ['Payment verified'],
    photoUrl: 'https://i.pravatar.cc/200?u=u2',
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: true,
    idVerified: false,
    isOrganizer: false,
    connections: ['u1', 'u3']
  },
  {
    id: 'u3',
    name: 'Nikos',
    ageRange: '30-36',
    city: 'Athens',
    bio: 'Music lover and festival goer. Looking for company to enjoy live shows.',
    interests: ['Concerts', 'Festivals', 'Live Music', 'Escape Rooms'],
    trustTier: '1_explorer',
    reliabilityScore: 50,
    badges: ['New member'],
    photoUrl: 'https://i.pravatar.cc/200?u=u3',
    emailVerified: true,
    phoneVerified: false,
    paymentVerified: false,
    idVerified: false,
    isOrganizer: false,
    connections: ['u1', 'u2', 'org1']
  },
  {
    id: 'org1',
    name: 'Bios Cultural Center',
    ageRange: 'N/A',
    city: 'Athens',
    bio: 'Bios is a center for today\'s art and cross-media. We host regular events spanning across theatre, music, and contemporary exhibitions.',
    interests: [],
    trustTier: '3_high_trust',
    reliabilityScore: 100,
    badges: ['Organizer verified'],
    photoUrl: 'https://i.pravatar.cc/200?u=org1',
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: true,
    idVerified: true,
    isOrganizer: true,
    connections: ['u1', 'u3']
  }
];

export const currentUser = mockUsers[0]; // Fake login state
