/** Theme registry — ids, labels, helpers. Class tokens live in designTokens.ts. */
export const THEME_IDS = [
  'classic',
  'vibrant',
  'bento',
  'neon',
  'vibrant-dark',
  'bento-dark',
  'neon-dark',
  'classic-dark',
  'activebuddies',
  'activebuddies-dark',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_LABELS: Record<ThemeId, { el: string; en: string }> = {
  classic: { el: 'Κλασικό', en: 'Classic' },
  vibrant: { el: 'Ζωντανό', en: 'Vibrant' },
  bento: { el: 'Bento', en: 'Bento' },
  neon: { el: 'Neon', en: 'Neon' },
  'vibrant-dark': { el: 'Ζωντανό σκοτεινό', en: 'Vibrant Dark' },
  'bento-dark': { el: 'Bento Σκοτεινό', en: 'Bento Dark' },
  'neon-dark': { el: 'Neon Σκοτεινό', en: 'Neon Dark' },
  'classic-dark': { el: 'Κλασικό σκοτεινό', en: 'Classic Dark' },
  activebuddies: { el: 'Active Buddies', en: 'Active Buddies' },
  'activebuddies-dark': { el: 'Active Buddies Σκοτεινό', en: 'Active Buddies Dark' },
};

export const THEME_SWATCH: Record<ThemeId, string> = {
  classic: 'bg-[hsl(181_82%_30%)]',
  vibrant: 'bg-fuchsia-500',
  bento: 'bg-indigo-500',
  neon: 'bg-emerald-500',
  'vibrant-dark': 'bg-fuchsia-700',
  'bento-dark': 'bg-indigo-700',
  'neon-dark': 'bg-emerald-700',
  'classic-dark': 'bg-teal-800',
  activebuddies: 'bg-[hsl(220_14%_12%)]',
  'activebuddies-dark': 'bg-[hsl(0_0%_95%)]',
};

export function isDarkTheme(theme: string): boolean {
  return (
    theme === 'bento-dark' ||
    theme === 'vibrant-dark' ||
    theme === 'neon-dark' ||
    theme === 'classic-dark' ||
    theme === 'activebuddies-dark'
  );
}

export function isActiveBuddiesTheme(theme: string): boolean {
  return theme === 'activebuddies' || theme === 'activebuddies-dark';
}

export function cycleTheme(current: string): ThemeId {
  const idx = THEME_IDS.indexOf(current as ThemeId);
  return THEME_IDS[(idx + 1) % THEME_IDS.length];
}
