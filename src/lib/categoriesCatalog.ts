import type { LucideIcon } from 'lucide-react';
import {
  Music,
  Zap,
  Ticket,
  Camera,
  Mic,
  Coffee,
  Compass,
  Palette,
  BrainCircuit,
  Trophy,
  Users,
  HeartHandshake,
  Leaf,
  Gamepad2,
  BookOpen,
  Languages,
  Mountain,
  Car,
  MapPin,
} from 'lucide-react';

export type CategoryGroupTab =
  | 'All'
  | 'Arts & Entertainment'
  | 'Culture & Education'
  | 'Activities'
  | 'Lifestyle'
  | 'Hobbies'
  | 'Professional';

export interface CategoryCatalogItem {
  id: string;
  name: string;
  group: CategoryGroupTab;
  icon: LucideIcon;
  labelGr: string;
  labelEn: string;
  color: string;
  bg: string;
  border: string;
}

export const CATEGORY_CATALOG: CategoryCatalogItem[] = [
  { id: '1', name: 'Live Music', group: 'Arts & Entertainment', icon: Music, labelGr: 'Ζωντανή Μουσική', labelEn: 'Live Music', color: 'text-purple-600', bg: 'bg-purple-100/50', border: 'border-purple-200' },
  { id: '2', name: 'Electronic Music', group: 'Arts & Entertainment', icon: Zap, labelGr: 'Ηλεκτρονική Μουσική', labelEn: 'Electronic Music', color: 'text-pink-600', bg: 'bg-pink-100/50', border: 'border-pink-200' },
  { id: '3', name: 'Theater & Dance', group: 'Arts & Entertainment', icon: Ticket, labelGr: 'Θέατρο & Χορός', labelEn: 'Theater & Dance', color: 'text-rose-600', bg: 'bg-rose-100/50', border: 'border-rose-200' },
  { id: '4', name: 'Cinema', group: 'Arts & Entertainment', icon: Camera, labelGr: 'Σινεμά', labelEn: 'Cinema', color: 'text-cyan-600', bg: 'bg-cyan-100/50', border: 'border-cyan-200' },
  { id: '5', name: 'Stand-up', group: 'Arts & Entertainment', icon: Mic, labelGr: 'Stand-up', labelEn: 'Stand-up', color: 'text-yellow-600', bg: 'bg-yellow-100/50', border: 'border-yellow-200' },
  { id: '6', name: 'Food & Drink', group: 'Lifestyle', icon: Coffee, labelGr: 'Φαγητό & Ποτό', labelEn: 'Food & Drink', color: 'text-orange-600', bg: 'bg-orange-100/50', border: 'border-orange-200' },
  { id: '11', name: 'Social', group: 'Lifestyle', icon: Users, labelGr: 'Κοινωνικά', labelEn: 'Social', color: 'text-teal-600', bg: 'bg-teal-100/50', border: 'border-teal-200' },
  { id: '12', name: 'Networking', group: 'Professional', icon: HeartHandshake, labelGr: 'Δικτύωση', labelEn: 'Networking', color: 'text-sky-600', bg: 'bg-sky-100/50', border: 'border-sky-200' },
  { id: '7', name: 'Museums', group: 'Culture & Education', icon: Compass, labelGr: 'Μουσεία', labelEn: 'Museums', color: 'text-blue-600', bg: 'bg-blue-100/50', border: 'border-blue-200' },
  { id: '8', name: 'Exhibitions', group: 'Culture & Education', icon: Palette, labelGr: 'Εκθέσεις', labelEn: 'Exhibitions', color: 'text-fuchsia-600', bg: 'bg-fuchsia-100/50', border: 'border-fuchsia-200' },
  { id: '9', name: 'Workshops', group: 'Culture & Education', icon: BrainCircuit, labelGr: 'Εργαστήρια', labelEn: 'Workshops', color: 'text-amber-600', bg: 'bg-amber-100/50', border: 'border-amber-200' },
  { id: '16', name: 'Language exchange', group: 'Culture & Education', icon: Languages, labelGr: 'Ανταλλαγή Γλωσσών', labelEn: 'Language Exchange', color: 'text-indigo-600', bg: 'bg-indigo-100/50', border: 'border-indigo-200' },
  { id: '10', name: 'Sports', group: 'Activities', icon: Trophy, labelGr: 'Αθλητισμός', labelEn: 'Sports', color: 'text-red-600', bg: 'bg-red-100/50', border: 'border-red-200' },
  { id: '13', name: 'Wellness', group: 'Activities', icon: Leaf, labelGr: 'Ευεξία', labelEn: 'Wellness', color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'border-emerald-200' },
  { id: '17', name: 'Hiking', group: 'Activities', icon: Mountain, labelGr: 'Πεζοπορία', labelEn: 'Hiking', color: 'text-green-600', bg: 'bg-green-100/50', border: 'border-green-200' },
  { id: '18', name: 'Nearby escapes', group: 'Activities', icon: Car, labelGr: 'Κοντινές Αποδράσεις', labelEn: 'Nearby Getaways', color: 'text-sky-600', bg: 'bg-sky-100/50', border: 'border-sky-200' },
  { id: '19', name: 'Walking tours', group: 'Activities', icon: MapPin, labelGr: 'Ξεναγήσεις', labelEn: 'Walking Tours', color: 'text-teal-600', bg: 'bg-teal-100/50', border: 'border-teal-200' },
  { id: '14', name: 'Board games', group: 'Hobbies', icon: Gamepad2, labelGr: 'Επιτραπέζια', labelEn: 'Board Games', color: 'text-orange-600', bg: 'bg-orange-100/50', border: 'border-orange-200' },
  { id: '15', name: 'Book club', group: 'Hobbies', icon: BookOpen, labelGr: 'Λέσχη Ανάγνωσης', labelEn: 'Book Club', color: 'text-emerald-600', bg: 'bg-emerald-100/50', border: 'border-emerald-200' },
  { id: '20', name: 'Community events', group: 'Lifestyle', icon: HeartHandshake, labelGr: 'Κοινότητα', labelEn: 'Community', color: 'text-rose-500', bg: 'bg-rose-100/50', border: 'border-rose-200' },
];

export const CATEGORY_GROUP_TABS: CategoryGroupTab[] = [
  'All',
  'Arts & Entertainment',
  'Culture & Education',
  'Activities',
  'Lifestyle',
  'Hobbies',
  'Professional',
];

export function getCategoryGroupTabLabel(
  tab: CategoryGroupTab,
  t: (gr: string, en: string) => string,
): string {
  switch (tab) {
    case 'All':
      return t('Όλα', 'All');
    case 'Arts & Entertainment':
      return t('Τέχνες & Διασκέδαση', 'Arts & Entertainment');
    case 'Culture & Education':
      return t('Πολιτισμός', 'Culture & Education');
    case 'Activities':
      return t('Δραστηριότητες', 'Activities');
    case 'Lifestyle':
      return t('Τρόπος Ζωής', 'Lifestyle');
    case 'Hobbies':
      return t('Χόμπι', 'Hobbies');
    case 'Professional':
      return t('Επαγγελματικά', 'Professional');
    default:
      return tab;
  }
}
