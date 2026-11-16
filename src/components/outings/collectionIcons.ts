import { Leaf, Moon, Sparkles, Sun, Ticket, UserRound } from 'lucide-react';

/** One icon per themed collection (see lib/outings COLLECTIONS). */
export const COLLECTION_ICONS = {
  'nakamas-nights': Sparkles,
  'first-time-solo': UserRound,
  free: Ticket,
  weekend: Sun,
  'quiet-nights': Moon,
  outdoors: Leaf,
} as const;
