import { Leaf, Moon, Sun, Ticket, UserRound, Wine } from 'lucide-react';

/** One icon per themed collection (see lib/outings COLLECTIONS). */
export const COLLECTION_ICONS = {
  'nakamas-nights': Wine,
  'first-time-solo': UserRound,
  free: Ticket,
  weekend: Sun,
  'quiet-nights': Moon,
  outdoors: Leaf,
} as const;
