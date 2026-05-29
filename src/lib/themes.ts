/** All visual themes — preserved for user selection at end of design review. */
export const THEME_IDS = [
  'classic',
  'vibrant',
  'bento',
  'neon',
  'vibrant-dark',
  'bento-dark',
  'neon-dark',
  'activebuddies',
  'activebuddies-dark',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEME_LABELS: Record<ThemeId, { el: string; en: string }> = {
  classic: { el: 'Κλασικό', en: 'Classic' },
  vibrant: { el: 'Ζωντανό', en: 'Vibrant' },
  bento: { el: 'Bento', en: 'Bento' },
  neon: { el: 'Neon', en: 'Neon' },
  'vibrant-dark': { el: 'Ζωντανό Σκοτεινό', en: 'Vibrant Dark' },
  'bento-dark': { el: 'Bento Σκοτεινό', en: 'Bento Dark' },
  'neon-dark': { el: 'Neon Σκοτεινό', en: 'Neon Dark' },
  activebuddies: { el: 'Active Buddies', en: 'Active Buddies' },
  'activebuddies-dark': { el: 'Active Buddies Σκοτεινό', en: 'Active Buddies Dark' },
};

export const THEME_SWATCH: Record<ThemeId, string> = {
  classic: 'bg-[#18D8DB]',
  vibrant: 'bg-fuchsia-500',
  bento: 'bg-indigo-500',
  neon: 'bg-emerald-500',
  'vibrant-dark': 'bg-fuchsia-700',
  'bento-dark': 'bg-indigo-700',
  'neon-dark': 'bg-emerald-700',
  activebuddies: 'bg-[hsl(220_14%_12%)]',
  'activebuddies-dark': 'bg-[hsl(0_0%_95%)]',
};

export function isDarkTheme(theme: string): boolean {
  return (
    theme === 'bento-dark' ||
    theme === 'vibrant-dark' ||
    theme === 'neon-dark' ||
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

export interface ThemeTokens {
  isDark: boolean;
  isAB: boolean;
  accent: 'cyan' | 'fuchsia' | 'indigo' | 'emerald' | 'ab';
  shell: string;
  sideNav: string;
  sideNavBorder: string;
  topNav: string;
  logoText: string;
  navActive: string;
  navInactive: string;
  navDisabled: string;
  chipButton: string;
  searchInput: string;
  bottomNav: string;
  fab: string;
  primaryBtn: string;
  accentText: string;
  accentBg: string;
  head: string;
  sub: string;
  muted: string;
}

export function getThemeTokens(theme: string): ThemeTokens {
  const isDark = isDarkTheme(theme);
  const isAB = isActiveBuddiesTheme(theme);

  const accent: ThemeTokens['accent'] =
    theme === 'vibrant' || theme === 'vibrant-dark'
      ? 'fuchsia'
      : theme === 'bento' || theme === 'bento-dark'
        ? 'indigo'
        : theme === 'neon' || theme === 'neon-dark'
          ? 'emerald'
          : isAB
            ? 'ab'
            : 'cyan';

  const accentTextMap = {
    cyan: isDark ? 'text-cyan-400' : 'text-[#0E8B8D]',
    fuchsia: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    indigo: isDark ? 'text-indigo-400' : 'text-indigo-600',
    emerald: isDark ? 'text-emerald-400' : 'text-emerald-600',
    ab: isDark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
  };

  const accentBgMap = {
    cyan: isDark ? 'bg-cyan-900/20' : 'bg-cyan-50',
    fuchsia: isDark ? 'bg-fuchsia-900/20' : 'bg-fuchsia-50',
    indigo: isDark ? 'bg-indigo-900/20' : 'bg-indigo-50',
    emerald: isDark ? 'bg-emerald-900/20' : 'bg-emerald-50',
    ab: isDark ? 'bg-gray-700/40' : 'bg-[hsl(220_14%_96%)]',
  };

  const navActiveMap: Record<ThemeTokens['accent'], string> = {
    cyan: isDark ? 'bg-gray-700/40 text-cyan-400 font-bold' : 'bg-cyan-50 text-[#0E8B8D] font-bold',
    fuchsia: isDark ? 'bg-gray-700/40 text-fuchsia-400 font-bold' : 'bg-fuchsia-50 text-fuchsia-700 font-bold',
    indigo: isDark ? 'bg-gray-700/40 text-indigo-400 font-bold' : 'bg-indigo-50 text-indigo-700 font-bold',
    emerald: isDark ? 'bg-gray-700/40 text-emerald-400 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold',
    ab: isDark
      ? 'bg-gray-700/40 text-white font-bold'
      : 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] font-bold',
  };

  const shellMap: Partial<Record<ThemeId, string>> = {
    classic: 'bg-[#F3F4F6] text-[#111827]',
    vibrant: 'bg-[#FDF2F8] text-[#111827]',
    bento: 'bg-[#F5F3FF] text-[#111827]',
    neon: 'bg-[#ECFDF5] text-[#111827]',
    'vibrant-dark': 'bg-[#1a1020] text-white',
    'bento-dark': 'bg-[#131318] text-white',
    'neon-dark': 'bg-[#101e17] text-white',
    activebuddies: 'theme-ab bg-[hsl(0_0%_99%)] text-[hsl(220_14%_12%)]',
    'activebuddies-dark': 'theme-ab-dark bg-[hsl(220_16%_8%)] text-[hsl(210_20%_92%)]',
  };

  const topNavMap: Partial<Record<ThemeId, string>> = {
    classic: 'bg-white border-[#E5E7EB]',
    vibrant: 'bg-white border-fuchsia-100',
    bento: 'bg-white border-indigo-100',
    neon: 'bg-white border-emerald-100',
    'vibrant-dark': 'bg-gray-900/80 border-gray-700/50',
    'bento-dark': 'bg-gray-900/80 border-gray-700/50',
    'neon-dark': 'bg-gray-900/80 border-gray-700/50',
    activebuddies: 'bg-white/95 backdrop-blur-xl border-[hsl(220_13%_92%)] shadow-sm',
    'activebuddies-dark': 'border-gray-700/50 bg-[hsl(220_16%_11%)]/95 backdrop-blur-md',
  };

  const fabMap: Partial<Record<ThemeId, string>> = {
    classic: 'bg-[#111827] text-white hover:bg-black',
    vibrant: 'bg-gradient-to-br from-fuchsia-600 to-orange-500 text-white hover:opacity-90',
    'vibrant-dark': 'bg-gradient-to-br from-fuchsia-600 to-orange-500 text-white hover:opacity-90',
    bento: 'bg-gradient-to-br from-indigo-600 to-violet-500 text-white hover:opacity-90',
    neon: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90',
    'neon-dark': 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90',
    activebuddies: 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
    'activebuddies-dark': 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
  };

  const t = theme as ThemeId;

  return {
    isDark,
    isAB,
    accent,
    shell: shellMap[t] ?? shellMap.classic!,
    sideNav: isDark
      ? isAB
        ? 'bg-[hsl(220_16%_8%)] border-[hsl(220_13%_18%)]'
        : 'bg-gray-900/80 border-gray-700/50'
      : isAB
        ? 'bg-white/50 backdrop-blur-xl border-[hsl(220_13%_92%)]/60'
        : 'bg-white border-[#E5E7EB]',
    sideNavBorder: isDark
      ? isAB
        ? 'border-[hsl(220_13%_18%)]'
        : 'border-gray-700/50'
      : isAB
        ? 'border-[hsl(220_13%_92%)]/60'
        : 'border-[#E5E7EB]',
    topNav: topNavMap[t] ?? topNavMap.classic!,
    logoText:
      theme === 'activebuddies'
        ? 'text-[hsl(220_14%_12%)]'
        : theme === 'activebuddies-dark'
          ? 'text-[hsl(210_20%_92%)]'
          : 'text-[#18D8DB]',
    navActive: navActiveMap[accent],
    navInactive: isDark
      ? isAB
        ? 'text-gray-300 hover:bg-gray-700/40 hover:text-white'
        : 'text-gray-300 hover:bg-gray-700/40 hover:text-white'
      : isAB
        ? 'text-[hsl(220_11%_34%)] hover:bg-[hsl(220_14%_96%)] hover:text-[hsl(220_14%_12%)]'
        : accent === 'fuchsia'
          ? 'text-gray-500 hover:bg-fuchsia-50/50 hover:text-fuchsia-700'
          : accent === 'indigo'
            ? 'text-gray-500 hover:bg-indigo-50/50 hover:text-indigo-700'
            : accent === 'emerald'
              ? 'text-gray-500 hover:bg-emerald-50/50 hover:text-emerald-700'
              : 'text-gray-500 hover:bg-gray-100 hover:text-[#111827]',
    navDisabled: isDark ? 'text-gray-500' : 'text-gray-400',
    chipButton: isDark
      ? isAB
        ? 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/50'
        : 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/50'
      : isAB
        ? 'bg-[hsl(220_14%_96%)] text-[hsl(220_11%_34%)] hover:bg-[hsl(220_13%_92%)]'
        : 'bg-gray-100 text-gray-500 hover:bg-cyan-50 hover:text-[#0E8B8D]',
    searchInput: isAB
      ? theme === 'activebuddies-dark'
        ? 'rounded-md border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-gray-400'
        : 'h-9 rounded-full border-[hsl(220_13%_92%)] bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] placeholder:text-[hsl(220_9%_60%)] focus:bg-white focus:border-[hsl(220_13%_72%)]'
      : isDark
        ? accent === 'fuchsia'
          ? 'rounded-md border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-fuchsia-500'
          : 'rounded-md border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-emerald-500'
        : accent === 'fuchsia'
          ? 'rounded-md border-transparent bg-fuchsia-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-fuchsia-400'
          : accent === 'indigo'
            ? 'rounded-md border-transparent bg-indigo-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-indigo-400'
            : accent === 'emerald'
              ? 'rounded-md border-transparent bg-emerald-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-emerald-400'
              : 'rounded-md border-transparent bg-gray-100 focus:bg-white text-gray-900 focus:ring-1 focus:ring-cyan-500',
    bottomNav: isAB
      ? theme === 'activebuddies-dark'
        ? 'bg-[hsl(220_16%_11%)]/90 border-[hsl(220_13%_18%)]'
        : 'bg-white/95 border-[hsl(220_13%_92%)]'
      : isDark
        ? 'bg-gray-900/85 border-gray-700/50'
        : 'bg-white/95 border-gray-200',
    fab: fabMap[t] ?? fabMap.classic!,
    primaryBtn:
      accent === 'fuchsia'
        ? 'bg-fuchsia-600 hover:bg-fuchsia-700'
        : accent === 'indigo'
          ? 'bg-indigo-600 hover:bg-indigo-700'
          : accent === 'emerald'
            ? 'bg-emerald-600 hover:bg-emerald-700'
            : isAB
              ? 'bg-[hsl(220_14%_12%)] hover:bg-black'
              : 'bg-[#0E8B8D] hover:bg-[#0b6d6f]',
    accentText: accentTextMap[accent],
    accentBg: accentBgMap[accent],
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-200' : 'text-gray-600',
    muted: isDark ? 'text-gray-300' : 'text-gray-600',
  };
}
