import type { HomeHeroMode } from '../store';

export const HOME_HERO_MODES: {
  id: HomeHeroMode;
  labelKey: [string, string];
  descKey: [string, string];
}[] = [
  {
    id: 'light',
    labelKey: ['Σύντομο', 'Compact'],
    descKey: [
      'Μόνο αναζήτηση και σύντομες ενέργειες.',
      'Search bar and quick actions only.',
    ],
  },
  {
    id: 'balanced',
    labelKey: ['Ισορροπημένο', 'Balanced'],
    descKey: [
      'Αναζήτηση, στατιστικά και καθημερινή συμβουλή.',
      'Search, stats, and daily tip.',
    ],
  },
  {
    id: 'rich',
    labelKey: ['Πλήρες', 'Full'],
    descKey: [
      'Πλήρες hero με shortcuts και feature cards.',
      'Full hero with shortcuts and feature cards.',
    ],
  },
];
