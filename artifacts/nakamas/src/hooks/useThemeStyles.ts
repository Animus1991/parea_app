import { useStore } from '../store';

export interface ThemeStyles {
  theme: string;
  isDark: boolean;
  accent: 'cyan' | 'fuchsia' | 'emerald' | 'indigo';
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentHover: string;
  head: string;
  sub: string;
  muted: string;
  chipBg: string;
  borderSub: string;
  cardBg: string;
  inputBg: string;
  tabActive: string;
  tabInactive: string;
  emptyBg: string;
  link: string;
  toggleOn: string;
  timelineDot: string;
}

export function useThemeStyles(): ThemeStyles {
  const theme = useStore((s) => s.theme);
  const isDark =
    theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  const isVibrant = theme === 'vibrant' || theme === 'vibrant-dark';
  const isNeonOrBentoDark =
    theme === 'neon' ||
    theme === 'neon-dark' ||
    theme === 'bento-dark';
  const isBento = theme === 'bento';

  let accent: ThemeStyles['accent'];
  if (isVibrant) accent = 'fuchsia';
  else if (isBento) accent = 'indigo';
  else if (isNeonOrBentoDark) accent = 'emerald';
  else accent = 'cyan';

  const accentText = isDark
    ? accent === 'fuchsia'
      ? 'text-fuchsia-400'
      : accent === 'emerald'
      ? 'text-emerald-400'
      : accent === 'indigo'
      ? 'text-indigo-400'
      : 'text-cyan-400'
    : accent === 'fuchsia'
    ? 'text-fuchsia-600'
    : accent === 'indigo'
    ? 'text-indigo-600'
    : accent === 'emerald'
    ? 'text-emerald-600'
    : 'text-[#0E8B8D]';

  const accentBg = isDark
    ? accent === 'fuchsia'
      ? 'bg-fuchsia-900/20'
      : accent === 'emerald'
      ? 'bg-emerald-900/20'
      : accent === 'indigo'
      ? 'bg-indigo-900/20'
      : 'bg-cyan-900/20'
    : accent === 'fuchsia'
    ? 'bg-fuchsia-50'
    : accent === 'indigo'
    ? 'bg-indigo-50'
    : accent === 'emerald'
    ? 'bg-emerald-50'
    : 'bg-cyan-50';

  const accentBorder = isDark
    ? accent === 'fuchsia'
      ? 'border-fuchsia-800/40'
      : accent === 'emerald'
      ? 'border-emerald-800/40'
      : accent === 'indigo'
      ? 'border-indigo-800/40'
      : 'border-cyan-800/40'
    : accent === 'fuchsia'
    ? 'border-fuchsia-200'
    : accent === 'indigo'
    ? 'border-indigo-200'
    : accent === 'emerald'
    ? 'border-emerald-200'
    : 'border-cyan-200';

  const accentHover = isDark
    ? accent === 'fuchsia'
      ? 'hover:border-fuchsia-700'
      : accent === 'emerald'
      ? 'hover:border-emerald-700'
      : accent === 'indigo'
      ? 'hover:border-indigo-700'
      : 'hover:border-cyan-700'
    : accent === 'fuchsia'
    ? 'hover:border-fuchsia-200'
    : accent === 'indigo'
    ? 'hover:border-indigo-200'
    : accent === 'emerald'
    ? 'hover:border-emerald-200'
    : 'hover:border-cyan-200';

  const head = isDark ? 'text-white' : 'text-[#111827]';
  const sub = isDark ? 'text-gray-400' : 'text-gray-600';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const chipBg = isDark ? 'bg-gray-800/50' : 'bg-gray-50';
  const borderSub = isDark ? 'border-gray-700/40' : 'border-gray-100';
  const cardBg = isDark ? 'bg-gray-800/60' : 'bg-white';
  const inputBg = isDark
    ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400';

  const tabActive = isDark
    ? `${accentBg} ${accentText} border-${accent}-500`
    : `${accentBg} ${accentText.replace('text-', 'text-').replace('400', '700')} border-${accent}-500`;

  const tabInactive = isDark
    ? 'text-gray-400 border-transparent hover:text-gray-200'
    : 'text-gray-400 border-transparent hover:text-gray-600';

  const emptyBg = isDark
    ? 'bg-gray-800/30 border-gray-700/40'
    : 'bg-gray-50 border-gray-200';

  const link = isDark
    ? accent === 'fuchsia'
      ? 'text-fuchsia-400 hover:text-fuchsia-300'
      : accent === 'emerald'
      ? 'text-emerald-400 hover:text-emerald-300'
      : accent === 'indigo'
      ? 'text-indigo-400 hover:text-indigo-300'
      : 'text-cyan-400 hover:text-cyan-300'
    : accent === 'fuchsia'
    ? 'text-fuchsia-600 hover:text-fuchsia-700'
    : accent === 'indigo'
    ? 'text-indigo-600 hover:text-indigo-700'
    : accent === 'emerald'
    ? 'text-emerald-600 hover:text-emerald-700'
    : 'text-cyan-600 hover:text-cyan-700';

  const toggleOn =
    accent === 'fuchsia'
      ? 'bg-fuchsia-600'
      : accent === 'indigo'
      ? 'bg-indigo-600'
      : accent === 'emerald'
      ? 'bg-emerald-600'
      : 'bg-cyan-600';

  const timelineDot =
    accent === 'fuchsia'
      ? 'bg-fuchsia-500'
      : accent === 'indigo'
      ? 'bg-indigo-500'
      : accent === 'emerald'
      ? 'bg-emerald-500'
      : 'bg-green-500';

  return {
    theme,
    isDark,
    accent,
    accentText,
    accentBg,
    accentBorder,
    accentHover,
    head,
    sub,
    muted,
    chipBg,
    borderSub,
    cardBg,
    inputBg,
    tabActive,
    tabInactive,
    emptyBg,
    link,
    toggleOn,
    timelineDot,
  };
}
