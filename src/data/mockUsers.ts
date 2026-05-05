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
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: true,
    idVerified: false,
    isOrganizer: false
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
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: true,
    idVerified: false,
    isOrganizer: false
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
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    emailVerified: true,
    phoneVerified: false,
    paymentVerified: false,
    idVerified: false,
    isOrganizer: false
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
    photoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90841261?auto=format&fit=crop&q=80&w=200',
    emailVerified: true,
    phoneVerified: true,
    paymentVerified: true,
    idVerified: true,
    isOrganizer: true
  }
];

export const currentUser = mockUsers[0]; // Fake login state
