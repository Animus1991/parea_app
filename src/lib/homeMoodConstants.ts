import type { LucideIcon } from 'lucide-react';
import { Brain, Coffee, Compass, Flame, PartyPopper } from 'lucide-react';

/** Mood → event categories (matches `HOME_CATEGORIES` values). */
export interface HomeMoodDefinition {
  id: string;
  labelGr: string;
  labelEn: string;
  icon: LucideIcon;
  categories: string[];
  light: string;
  dark: string;
}

export const HOME_MOODS: HomeMoodDefinition[] = [
  {
    id: 'chill',
    labelGr: 'Χαλαρά',
    labelEn: 'Chill',
    icon: Coffee,
    categories: ['Food & Drink', 'Cinema', 'Board games'],
    light: 'text-blue-600 bg-blue-50 border-blue-200',
    dark: 'text-blue-400 bg-blue-900/25 border-blue-800/60',
  },
  {
    id: 'active',
    labelGr: 'Δράση',
    labelEn: 'Active',
    icon: Flame,
    categories: ['Sports', 'Hiking', 'Wellness'],
    light: 'text-orange-600 bg-orange-50 border-orange-200',
    dark: 'text-orange-400 bg-orange-900/25 border-orange-800/60',
  },
  {
    id: 'social',
    labelGr: 'Κοινωνικά',
    labelEn: 'Social',
    icon: PartyPopper,
    categories: ['Social', 'Networking', 'Live Music'],
    light: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200',
    dark: 'text-fuchsia-400 bg-fuchsia-900/25 border-fuchsia-800/60',
  },
  {
    id: 'learn',
    labelGr: 'Μάθηση',
    labelEn: 'Learn',
    icon: Brain,
    categories: ['Workshops', 'Exhibitions', 'Museums'],
    light: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    dark: 'text-indigo-400 bg-indigo-900/25 border-indigo-800/60',
  },
  {
    id: 'explore',
    labelGr: 'Εξερεύνηση',
    labelEn: 'Explore',
    icon: Compass,
    categories: ['Nearby escapes', 'Walking tours'],
    light: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    dark: 'text-emerald-400 bg-emerald-900/25 border-emerald-800/60',
  },
];

export function getHomeMoodById(id: string | null) {
  if (!id) return undefined;
  return HOME_MOODS.find((m) => m.id === id);
}

export function parseHomeMoodParam(value: string | null): string | null {
  if (!value) return null;
  return HOME_MOODS.some((m) => m.id === value) ? value : null;
}

export function getMoodCategories(moodId: string | null): string[] {
  return getHomeMoodById(moodId)?.categories ?? [];
}
