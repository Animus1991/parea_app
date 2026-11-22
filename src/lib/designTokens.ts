/**
 * Unified design-token module — single import surface for all theme → class
 * mappings (P1-T2). Replaces: pageContrast.ts, contrastTheme.ts,
 * eventDetailDesignTokens.ts, useGroupChatContrast ternaries, themes.ts maps.
 *
 * Structure:
 *   1. Accent family + ACCENT_TONES (accentFamily → classes map)
 *   2. Shell chrome tokens (getThemeTokens)
 *   3. Page contrast (getPageContrast / getProfileContrast)
 *   4. Home & global contrast (getHomeContrastTheme / getGlobalContrast)
 *   5. Event detail tokens
 *   6. Group-chat accent tones
 *
 * NOTE: known quirk preserved intentionally — the `indigo` family has no dark
 * variants (bento-dark currently renders light-indigo classes). Flagged for P2.
 */
import type { ThemeId } from './themes';
import { isActiveBuddiesTheme, isDarkTheme, THEME_IDS } from './themes';
import { APP_TYPO } from './typographyTokens';
import type { EventDetailMapAccent } from '../components/events/EventDetailMapSection';

/* ════════════════════════════════════════════════════════════════
   1. Accent family
   ════════════════════════════════════════════════════════════════ */
export type AccentFamily = 'cyan' | 'fuchsia' | 'indigo' | 'emerald' | 'mono';
export type ChromaticAccent = Exclude<AccentFamily, 'mono'>;

export function getAccentFamily(theme: string): AccentFamily {
  if (isActiveBuddiesTheme(theme)) return 'mono';
  if (theme === 'vibrant' || theme === 'vibrant-dark') return 'fuchsia';
  if (theme === 'bento' || theme === 'bento-dark') return 'indigo';
  if (theme === 'neon' || theme === 'neon-dark') return 'emerald';
  return 'cyan';
}

/** The 34 accent-driven page fields + 19 profile fields per tone. */
interface AccentTone {
  tabActive: string;
  tabInactive: string;
  tabActiveBorder: string;
  tabInactiveBorder: string;
  statBg: string;
  statVal: string;
  cardHover: string;
  chipActive: string;
  chipInactive: string;
  toggleOn: string;
  iconColor: string;
  dot: string;
  actionBtn: string;
  msgIcon: string;
  acceptBtn: string;
  requestBadge: string;
  trustHigh: string;
  tagBg: string;
  hoverText: string;
  ring: string;
  progressFill: string;
  barFill: string;
  articleCat: string;
  contactIcon: string;
  contactBtn: string;
  heroBg: string;
  heroSub: string;
  balanceBg: string;
  balanceLabel: string;
  withdrawBtn: string;
  iconAccent: string;
  timelineDot: string;
  scoreStroke: string;
  scoreFill: string;
  /* profile extras */
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentLight: string;
  profileRing: string;
  checkbox: string;
  radioActive: string;
  radioText: string;
  radioSub: string;
  tierHighlight: string;
  tierHighlightText: string;
  tierHighlightSub: string;
  btnAccent: string;
  historyIcon: string;
  profileSelectBg: string;
  selectRing: string;
  settingCard: string;
  avatarBg: string;
  avatarText: string;
}

type AccentPageTone = Pick<
  AccentTone,
  | 'tabActive' | 'tabInactive' | 'tabActiveBorder' | 'tabInactiveBorder'
  | 'statBg' | 'statVal' | 'cardHover' | 'chipActive' | 'chipInactive'
  | 'toggleOn' | 'iconColor' | 'dot' | 'actionBtn' | 'msgIcon' | 'acceptBtn'
  | 'requestBadge' | 'trustHigh' | 'tagBg' | 'hoverText' | 'ring'
  | 'progressFill' | 'barFill' | 'articleCat' | 'contactIcon' | 'contactBtn'
  | 'heroBg' | 'heroSub' | 'balanceBg' | 'balanceLabel' | 'withdrawBtn'
  | 'iconAccent' | 'timelineDot' | 'scoreStroke' | 'scoreFill'
>;

const FUCHSIA_LIGHT: AccentTone = {
  tabActive: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-500',
  tabInactive: 'text-gray-500 border-transparent hover:text-gray-800',
  tabActiveBorder: 'border-fuchsia-600 text-fuchsia-600',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-600',
  statBg: 'bg-fuchsia-50 border-fuchsia-100',
  statVal: 'text-fuchsia-600',
  cardHover: 'hover:border-fuchsia-200',
  chipActive: 'bg-fuchsia-600 text-white',
  chipInactive: 'bg-white border-gray-200 text-gray-600',
  toggleOn: 'bg-fuchsia-600',
  iconColor: 'text-fuchsia-600',
  dot: 'bg-fuchsia-500',
  actionBtn: 'text-fuchsia-700 bg-fuchsia-100 hover:bg-fuchsia-200',
  msgIcon: 'text-fuchsia-600 hover:bg-fuchsia-50',
  acceptBtn: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
  requestBadge: 'bg-fuchsia-500',
  trustHigh: 'text-fuchsia-600',
  tagBg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  hoverText: 'group-hover:text-fuchsia-700',
  ring: 'focus:ring-fuchsia-500',
  progressFill: 'bg-fuchsia-500',
  barFill: 'bg-fuchsia-500',
  articleCat: 'text-fuchsia-600',
  contactIcon: 'text-fuchsia-600',
  contactBtn: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
  heroBg: 'bg-fuchsia-600',
  heroSub: 'text-fuchsia-100',
  balanceBg: 'bg-fuchsia-600 border-0',
  balanceLabel: 'text-fuchsia-100',
  withdrawBtn: 'bg-white text-fuchsia-900 hover:bg-gray-100 border-0',
  iconAccent: 'text-fuchsia-600',
  timelineDot: 'bg-fuchsia-500',
  scoreStroke: '#d946ef',
  scoreFill: 'fill-gray-900',
  accent: 'text-fuchsia-600',
  accentBg: 'bg-fuchsia-50',
  accentBorder: 'border-fuchsia-200',
  accentLight: 'text-fuchsia-700',
  profileRing: 'focus:ring-fuchsia-500 focus:border-fuchsia-500',
  checkbox: 'text-fuchsia-600',
  radioActive: 'border-fuchsia-200 bg-fuchsia-50/30',
  radioText: 'text-fuchsia-900',
  radioSub: 'text-fuchsia-700/80',
  tierHighlight: 'border-emerald-200 bg-emerald-50/50',
  tierHighlightText: 'text-emerald-800',
  tierHighlightSub: 'text-emerald-600/80',
  btnAccent: 'text-fuchsia-600 hover:bg-fuchsia-50',
  historyIcon: 'bg-fuchsia-100 text-fuchsia-600',
  profileSelectBg: 'bg-gray-50 border-gray-200',
  selectRing: 'focus:border-fuchsia-500 focus:ring-fuchsia-500',
  settingCard: 'bg-white border-gray-100',
  avatarBg: 'bg-fuchsia-100 border-fuchsia-200',
  avatarText: 'text-fuchsia-700',
};

const FUCHSIA_DARK: AccentTone = {
  ...FUCHSIA_LIGHT,
  tabActive: 'bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-500',
  tabInactive: 'text-gray-400 border-transparent hover:text-gray-200',
  tabActiveBorder: 'border-fuchsia-500 text-fuchsia-400',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-200',
  statBg: 'bg-fuchsia-900/20 border-fuchsia-800/30',
  statVal: 'text-fuchsia-400',
  cardHover: 'hover:border-fuchsia-700',
  chipInactive: 'bg-gray-800/50 border-gray-600 text-gray-300',
  iconColor: 'text-fuchsia-400',
  actionBtn: 'text-fuchsia-400 bg-fuchsia-900/20 hover:bg-fuchsia-900/30',
  msgIcon: 'text-fuchsia-400 hover:bg-fuchsia-900/30',
  trustHigh: 'text-fuchsia-400',
  tagBg: 'bg-fuchsia-900/20 text-fuchsia-300 border-fuchsia-800',
  hoverText: 'group-hover:text-fuchsia-400',
  articleCat: 'text-fuchsia-400',
  contactIcon: 'text-fuchsia-400',
  heroBg: 'bg-fuchsia-800/60',
  heroSub: 'text-fuchsia-300',
  balanceBg: 'bg-fuchsia-800/60 border-fuchsia-700/40',
  balanceLabel: 'text-fuchsia-300',
  withdrawBtn: 'bg-white/10 text-white hover:bg-white/20 border-0',
  iconAccent: 'text-fuchsia-400',
  scoreFill: 'fill-white',
  accent: 'text-fuchsia-400',
  accentBg: 'bg-fuchsia-900/20',
  accentBorder: 'border-fuchsia-800',
  accentLight: 'text-fuchsia-300',
  checkbox: 'text-fuchsia-400',
  radioActive: 'border-fuchsia-600 bg-fuchsia-900/20',
  radioText: 'text-fuchsia-300',
  radioSub: 'text-fuchsia-400/80',
  tierHighlight: 'border-fuchsia-700 bg-fuchsia-900/20',
  tierHighlightText: 'text-fuchsia-300',
  tierHighlightSub: 'text-fuchsia-400/80',
  btnAccent: 'text-fuchsia-400 hover:bg-fuchsia-900/30',
  historyIcon: 'bg-fuchsia-900/30 text-fuchsia-400',
  profileSelectBg: 'bg-gray-800 border-gray-700',
  settingCard: 'bg-gray-800/50 border-gray-700/50',
  avatarBg: 'bg-fuchsia-900/30 border-fuchsia-700',
  avatarText: 'text-fuchsia-400',
};

const INDIGO_LIGHT: AccentTone = {
  tabActive: 'bg-indigo-50 text-indigo-700 border-indigo-500',
  tabInactive: 'text-gray-500 border-transparent hover:text-gray-800',
  tabActiveBorder: 'border-indigo-600 text-indigo-600',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-600',
  statBg: 'bg-indigo-50 border-indigo-100',
  statVal: 'text-indigo-600',
  cardHover: 'hover:border-indigo-200',
  chipActive: 'bg-indigo-600 text-white',
  chipInactive: 'bg-white border-gray-200 text-gray-600',
  toggleOn: 'bg-indigo-600',
  iconColor: 'text-indigo-600',
  dot: 'bg-indigo-500',
  actionBtn: 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200',
  msgIcon: 'text-indigo-600 hover:bg-indigo-50',
  acceptBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  requestBadge: 'bg-indigo-500',
  trustHigh: 'text-indigo-600',
  tagBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  hoverText: 'group-hover:text-indigo-600',
  ring: 'focus:ring-indigo-500',
  progressFill: 'bg-indigo-500',
  barFill: 'bg-indigo-500',
  articleCat: 'text-indigo-600',
  contactIcon: 'text-indigo-600',
  contactBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  heroBg: 'bg-indigo-600',
  heroSub: 'text-indigo-100',
  balanceBg: 'bg-indigo-600 border-0',
  balanceLabel: 'text-indigo-100',
  withdrawBtn: 'bg-white text-indigo-900 hover:bg-gray-100 border-0',
  iconAccent: 'text-indigo-600',
  timelineDot: 'bg-indigo-500',
  scoreStroke: '#6366f1',
  scoreFill: 'fill-gray-900',
  accent: 'text-indigo-600',
  accentBg: 'bg-indigo-50',
  accentBorder: 'border-indigo-200',
  accentLight: 'text-indigo-700',
  profileRing: 'focus:ring-indigo-500 focus:border-indigo-500',
  checkbox: 'text-indigo-600',
  radioActive: 'border-indigo-200 bg-indigo-50/30',
  radioText: 'text-indigo-900',
  radioSub: 'text-indigo-700/80',
  tierHighlight: 'border-emerald-200 bg-emerald-50/50',
  tierHighlightText: 'text-emerald-800',
  tierHighlightSub: 'text-emerald-600/80',
  btnAccent: 'text-indigo-600 hover:bg-indigo-50',
  historyIcon: 'bg-indigo-100 text-indigo-600',
  profileSelectBg: 'bg-gray-50 border-gray-200',
  selectRing: 'focus:border-indigo-500 focus:ring-indigo-500',
  settingCard: 'bg-white border-gray-100',
  avatarBg: 'bg-indigo-100 border-indigo-200',
  avatarText: 'text-indigo-700',
};

/* Quirk (preserved): indigo has no dark tone — bento-dark uses the light tone. */
// Bento dark: same structure as the other dark tones (it reused the light set, which painted light tiles on dark pages).
const INDIGO_DARK: AccentTone = {
  ...INDIGO_LIGHT,
  tabActive: 'bg-indigo-900/30 text-indigo-300 border-indigo-500',
  tabInactive: 'text-gray-400 border-transparent hover:text-gray-200',
  tabActiveBorder: 'border-indigo-500 text-indigo-400',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-200',
  statBg: 'bg-indigo-900/20 border-indigo-800/30',
  statVal: 'text-indigo-400',
  cardHover: 'hover:border-indigo-700',
  chipInactive: 'bg-gray-800/50 border-gray-600 text-gray-300',
  iconColor: 'text-indigo-400',
  actionBtn: 'text-indigo-400 bg-indigo-900/20 hover:bg-indigo-900/30',
  msgIcon: 'text-indigo-400 hover:bg-indigo-900/30',
  trustHigh: 'text-indigo-400',
  tagBg: 'bg-indigo-900/20 text-indigo-300 border-indigo-800',
  hoverText: 'group-hover:text-indigo-400',
  articleCat: 'text-indigo-400',
  contactIcon: 'text-indigo-400',
  heroBg: 'bg-indigo-800/50',
  heroSub: 'text-indigo-300',
  balanceBg: 'bg-indigo-800/50 border-indigo-700/40',
  balanceLabel: 'text-indigo-300',
  withdrawBtn: 'bg-white/10 text-white hover:bg-white/20 border-0',
  iconAccent: 'text-indigo-400',
  scoreFill: 'fill-white',
  accent: 'text-indigo-400',
  accentBg: 'bg-indigo-900/20',
  accentBorder: 'border-indigo-800',
  accentLight: 'text-indigo-300',
  checkbox: 'text-indigo-400',
  radioActive: 'border-indigo-600 bg-indigo-900/20',
  radioText: 'text-indigo-300',
  radioSub: 'text-indigo-400/80',
  tierHighlight: 'border-indigo-700 bg-indigo-900/20',
  tierHighlightText: 'text-indigo-300',
  tierHighlightSub: 'text-indigo-400/80',
  btnAccent: 'text-indigo-400 hover:bg-indigo-900/30',
  historyIcon: 'bg-indigo-900/30 text-indigo-400',
  profileSelectBg: 'bg-gray-800 border-gray-700',
  settingCard: 'bg-gray-800/50 border-gray-700/50',
  avatarBg: 'bg-indigo-900/30 border-indigo-700',
  avatarText: 'text-indigo-300',
};

const EMERALD_LIGHT: AccentTone = {
  tabActive: 'bg-emerald-50 text-emerald-700 border-emerald-500',
  tabInactive: 'text-gray-500 border-transparent hover:text-gray-700',
  tabActiveBorder: 'border-emerald-600 text-emerald-600',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-600',
  statBg: 'bg-emerald-50 border-emerald-100',
  statVal: 'text-emerald-600',
  cardHover: 'hover:border-emerald-200',
  chipActive: 'bg-emerald-600 text-white',
  chipInactive: 'bg-gray-100 text-gray-700 border-gray-200',
  toggleOn: 'bg-emerald-600',
  iconColor: 'text-emerald-600',
  dot: 'bg-emerald-500',
  actionBtn: 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200',
  msgIcon: 'text-emerald-600 hover:bg-emerald-50',
  acceptBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  requestBadge: 'bg-emerald-500',
  trustHigh: 'text-emerald-600',
  tagBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  hoverText: 'group-hover:text-emerald-700',
  ring: 'focus:ring-emerald-500',
  progressFill: 'bg-emerald-500',
  barFill: 'bg-emerald-500',
  articleCat: 'text-emerald-600',
  contactIcon: 'text-emerald-600',
  contactBtn: 'bg-emerald-600 hover:bg-emerald-700',
  heroBg: 'bg-emerald-600',
  heroSub: 'text-emerald-100',
  balanceBg: 'bg-emerald-600 border-0',
  balanceLabel: 'text-emerald-100',
  withdrawBtn: 'bg-white text-emerald-900 hover:bg-gray-100 border-0',
  iconAccent: 'text-emerald-600',
  timelineDot: 'bg-emerald-500',
  scoreStroke: '#10b981',
  scoreFill: 'fill-gray-900',
  accent: 'text-emerald-600',
  accentBg: 'bg-emerald-50',
  accentBorder: 'border-emerald-200',
  accentLight: 'text-emerald-700',
  profileRing: 'focus:ring-emerald-500 focus:border-emerald-500',
  checkbox: 'text-emerald-600',
  radioActive: 'border-emerald-200 bg-emerald-50/30',
  radioText: 'text-emerald-900',
  radioSub: 'text-emerald-700/80',
  tierHighlight: 'border-emerald-200 bg-emerald-50/50',
  tierHighlightText: 'text-emerald-800',
  tierHighlightSub: 'text-emerald-600/80',
  btnAccent: 'text-emerald-600 hover:bg-emerald-50',
  historyIcon: 'bg-emerald-100 text-emerald-600',
  profileSelectBg: 'bg-gray-50 border-gray-200',
  selectRing: 'focus:border-emerald-500 focus:ring-emerald-500',
  settingCard: 'bg-white border-gray-100',
  avatarBg: 'bg-emerald-100 border-emerald-200',
  avatarText: 'text-emerald-700',
};

const EMERALD_DARK: AccentTone = {
  ...EMERALD_LIGHT,
  tabActive: 'bg-emerald-900/30 text-emerald-300 border-emerald-500',
  tabInactive: 'text-gray-400 border-transparent hover:text-gray-200',
  tabActiveBorder: 'border-emerald-500 text-emerald-400',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-200',
  statBg: 'bg-emerald-900/20 border-emerald-800/30',
  statVal: 'text-emerald-400',
  cardHover: 'hover:border-emerald-700',
  chipInactive: 'bg-gray-800/50 border-gray-600 text-gray-300',
  iconColor: 'text-emerald-400',
  actionBtn: 'text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/30',
  msgIcon: 'text-emerald-400 hover:bg-emerald-900/30',
  trustHigh: 'text-emerald-400',
  tagBg: 'bg-emerald-900/20 text-emerald-300 border-emerald-800',
  hoverText: 'group-hover:text-emerald-400',
  articleCat: 'text-emerald-400',
  contactIcon: 'text-emerald-400',
  heroBg: 'bg-emerald-800/50',
  heroSub: 'text-emerald-300',
  balanceBg: 'bg-emerald-800/50 border-emerald-700/40',
  balanceLabel: 'text-emerald-300',
  withdrawBtn: 'bg-white/10 text-white hover:bg-white/20 border-0',
  iconAccent: 'text-emerald-400',
  scoreFill: 'fill-white',
  accent: 'text-emerald-400',
  accentBg: 'bg-emerald-900/20',
  accentBorder: 'border-emerald-800',
  accentLight: 'text-emerald-300',
  checkbox: 'text-emerald-400',
  radioActive: 'border-emerald-600 bg-emerald-900/20',
  radioText: 'text-emerald-300',
  radioSub: 'text-emerald-400/80',
  tierHighlight: 'border-emerald-700 bg-emerald-900/20',
  tierHighlightText: 'text-emerald-300',
  tierHighlightSub: 'text-emerald-400/80',
  btnAccent: 'text-emerald-400 hover:bg-emerald-900/30',
  historyIcon: 'bg-emerald-900/30 text-emerald-400',
  profileSelectBg: 'bg-gray-800 border-gray-700',
  settingCard: 'bg-gray-800/50 border-gray-700/50',
  avatarBg: 'bg-emerald-900/30 border-emerald-700',
  avatarText: 'text-emerald-400',
};

const CYAN_LIGHT: AccentTone = {
  tabActive: 'bg-cyan-50 text-cyan-700 border-cyan-500',
  tabInactive: 'text-gray-500 border-transparent hover:text-gray-700',
  tabActiveBorder: 'border-cyan-600 text-cyan-600',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-600',
  statBg: 'bg-cyan-50 border-cyan-100',
  statVal: 'text-cyan-600',
  cardHover: 'hover:border-cyan-200',
  /* Quirk (preserved): classic light chip uses neutral gray-900. */
  chipActive: 'bg-gray-900 text-white',
  chipInactive: 'bg-gray-100 text-gray-700 border-gray-200',
  toggleOn: 'bg-cyan-600',
  iconColor: 'text-cyan-600',
  dot: 'bg-cyan-500',
  actionBtn: 'text-cyan-700 bg-cyan-100 hover:bg-cyan-200',
  msgIcon: 'text-cyan-600 hover:bg-cyan-50',
  acceptBtn: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  requestBadge: 'bg-cyan-600',
  trustHigh: 'text-cyan-600',
  tagBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  hoverText: 'group-hover:text-cyan-700',
  ring: 'focus:ring-cyan-500',
  progressFill: 'bg-cyan-500',
  barFill: 'bg-cyan-500',
  articleCat: 'text-cyan-600',
  contactIcon: 'text-cyan-600',
  contactBtn: 'bg-cyan-600 hover:bg-cyan-700',
  heroBg: 'bg-cyan-600',
  heroSub: 'text-cyan-100',
  balanceBg: 'bg-cyan-600 border-0',
  balanceLabel: 'text-cyan-100',
  /* Quirk (preserved): cyan light withdraw button uses emerald-900 text. */
  withdrawBtn: 'bg-white text-emerald-900 hover:bg-gray-100 border-0',
  iconAccent: 'text-cyan-600',
  /* Quirk (preserved): cyan timeline dot / score stroke are green. */
  timelineDot: 'bg-green-500',
  scoreStroke: '#10b981',
  scoreFill: 'fill-gray-900',
  accent: 'text-cyan-600',
  accentBg: 'bg-cyan-50',
  accentBorder: 'border-cyan-200',
  accentLight: 'text-cyan-700',
  profileRing: 'focus:ring-cyan-500 focus:border-cyan-500',
  checkbox: 'text-cyan-600',
  radioActive: 'border-cyan-200 bg-cyan-50/30',
  radioText: 'text-cyan-900',
  radioSub: 'text-cyan-700/80',
  tierHighlight: 'border-emerald-200 bg-emerald-50/50',
  tierHighlightText: 'text-emerald-800',
  tierHighlightSub: 'text-emerald-600/80',
  btnAccent: 'text-cyan-600 hover:bg-cyan-50',
  historyIcon: 'bg-cyan-100 text-cyan-600',
  profileSelectBg: 'bg-gray-50 border-gray-200',
  selectRing: 'focus:border-cyan-500 focus:ring-cyan-500',
  settingCard: 'bg-white border-gray-100',
  avatarBg: 'bg-cyan-100 border-cyan-200',
  avatarText: 'text-cyan-700',
};

const CYAN_DARK: AccentTone = {
  ...CYAN_LIGHT,
  /* Quirk (preserved): cyan dark tab / hero fall back to neutral grays. */
  tabActive: 'bg-gray-700 text-white border-gray-500',
  tabInactive: 'text-gray-400 border-transparent hover:text-gray-200',
  tabActiveBorder: 'border-cyan-500 text-cyan-400',
  tabInactiveBorder: 'border-transparent text-gray-400 hover:text-gray-200',
  statBg: 'bg-cyan-900/20 border-cyan-800/30',
  statVal: 'text-cyan-400',
  cardHover: 'hover:border-cyan-700',
  chipActive: 'bg-cyan-600 text-white',
  chipInactive: 'bg-gray-800/50 border-gray-600 text-gray-300',
  iconColor: 'text-cyan-400',
  actionBtn: 'text-cyan-400 bg-cyan-900/20 hover:bg-cyan-900/30',
  msgIcon: 'text-cyan-400 hover:bg-cyan-900/30',
  trustHigh: 'text-cyan-400',
  tagBg: 'bg-cyan-900/20 text-cyan-300 border-cyan-800',
  hoverText: 'group-hover:text-cyan-400',
  articleCat: 'text-cyan-400',
  contactIcon: 'text-cyan-400',
  heroBg: 'bg-gray-800',
  heroSub: 'text-gray-300',
  balanceBg: 'bg-cyan-800/50 border-cyan-700/40',
  balanceLabel: 'text-cyan-300',
  withdrawBtn: 'bg-white/10 text-white hover:bg-white/20 border-0',
  iconAccent: 'text-cyan-400',
  scoreFill: 'fill-white',
  accent: 'text-cyan-400',
  accentBg: 'bg-cyan-900/20',
  accentBorder: 'border-cyan-800',
  accentLight: 'text-cyan-300',
  checkbox: 'text-cyan-400',
  radioActive: 'border-cyan-600 bg-cyan-900/20',
  radioText: 'text-cyan-300',
  radioSub: 'text-cyan-400/80',
  tierHighlight: 'border-cyan-700 bg-cyan-900/20',
  tierHighlightText: 'text-cyan-300',
  tierHighlightSub: 'text-cyan-400/80',
  btnAccent: 'text-cyan-400 hover:bg-cyan-900/30',
  historyIcon: 'bg-cyan-900/30 text-cyan-400',
  profileSelectBg: 'bg-gray-800 border-gray-700',
  settingCard: 'bg-gray-800/50 border-gray-700/50',
  avatarBg: 'bg-cyan-900/30 border-cyan-700',
  avatarText: 'text-cyan-400',
};

/** accentFamily → classes map (chromatic families). */
export const ACCENT_TONES: Record<ChromaticAccent, { light: AccentTone; dark: AccentTone }> = {
  cyan: { light: CYAN_LIGHT, dark: CYAN_DARK },
  fuchsia: { light: FUCHSIA_LIGHT, dark: FUCHSIA_DARK },
  indigo: { light: INDIGO_LIGHT, dark: INDIGO_DARK },
  emerald: { light: EMERALD_LIGHT, dark: EMERALD_DARK },
};

export function accentTone(family: ChromaticAccent, dark: boolean): AccentTone {
  return ACCENT_TONES[family][dark ? 'dark' : 'light'];
}

const MONO_PAGE_DARK: AccentPageTone = {
  tabActive: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] border-[hsl(220_13%_28%)]',
  tabInactive: 'text-[hsl(220_12%_70%)] border-transparent hover:text-[hsl(210_20%_92%)]',
  tabActiveBorder: 'border-white text-white',
  tabInactiveBorder: 'border-transparent text-[hsl(220_12%_70%)] hover:text-white',
  statBg: 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_22%)]',
  statVal: 'text-[hsl(210_20%_92%)]',
  cardHover: 'hover:border-[hsl(220_13%_35%)]',
  chipActive: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)]',
  chipInactive:
    'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)] text-[hsl(220_12%_75%)] hover:text-white',
  toggleOn: 'bg-[hsl(0_0%_95%)]',
  iconColor: 'text-[hsl(210_20%_92%)]',
  dot: 'bg-white',
  actionBtn: 'text-[hsl(220_14%_12%)] bg-[hsl(0_0%_95%)] hover:bg-white',
  msgIcon: 'text-white hover:bg-[hsl(220_16%_18%)]',
  acceptBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white',
  requestBadge: 'bg-white',
  trustHigh: 'text-white',
  tagBg: 'bg-[hsl(220_16%_18%)] text-[hsl(220_12%_80%)] border-[hsl(220_13%_28%)]',
  hoverText: 'group-hover:text-white',
  ring: 'focus:ring-white/40',
  progressFill: 'bg-white',
  barFill: 'bg-white',
  articleCat: 'text-[hsl(220_12%_75%)]',
  contactIcon: 'text-white',
  contactBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white',
  heroBg: 'bg-[hsl(220_16%_16%)]',
  heroSub: 'text-[hsl(220_12%_75%)]',
  balanceBg: 'bg-[hsl(220_16%_16%)] border border-[hsl(220_13%_22%)]',
  balanceLabel: 'text-[hsl(220_12%_75%)]',
  withdrawBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white border-0',
  iconAccent: 'text-[hsl(210_20%_92%)]',
  timelineDot: 'bg-white',
  scoreStroke: '#e5e7eb',
  scoreFill: 'fill-white',
};

const MONO_PAGE_LIGHT: AccentPageTone = {
  tabActive: 'bg-[hsl(220_14%_12%)] text-white border-[hsl(220_14%_12%)]',
  tabInactive: 'text-[hsl(220_11%_34%)] border-transparent hover:text-[hsl(220_14%_12%)]',
  tabActiveBorder: 'border-[hsl(220_14%_12%)] text-[hsl(220_14%_12%)]',
  tabInactiveBorder: 'border-transparent text-gray-500 hover:text-gray-800',
  statBg: 'bg-[hsl(220_14%_96%)] border-[hsl(220_13%_88%)]',
  statVal: 'text-[hsl(220_14%_12%)]',
  cardHover: 'hover:border-[hsl(220_13%_72%)]',
  chipActive: 'bg-[hsl(220_14%_12%)] text-white',
  chipInactive: 'bg-white border border-[hsl(220_13%_88%)] text-gray-700 hover:text-gray-900',
  toggleOn: 'bg-[hsl(220_14%_12%)]',
  iconColor: 'text-[hsl(220_14%_12%)]',
  dot: 'bg-[hsl(220_14%_12%)]',
  actionBtn: 'text-[hsl(220_14%_12%)] bg-[hsl(220_14%_96%)] hover:bg-[hsl(220_13%_92%)]',
  msgIcon: 'text-[hsl(220_14%_12%)] hover:bg-[hsl(220_14%_96%)]',
  acceptBtn: 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
  requestBadge: 'bg-[hsl(220_14%_12%)]',
  trustHigh: 'text-[hsl(220_14%_12%)]',
  tagBg: 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] border-[hsl(220_13%_88%)]',
  hoverText: 'group-hover:text-[hsl(220_14%_12%)]',
  ring: 'focus:ring-[hsl(220_14%_20%)]',
  progressFill: 'bg-[hsl(220_14%_12%)]',
  barFill: 'bg-[hsl(220_14%_12%)]',
  articleCat: 'text-[hsl(220_9%_40%)]',
  contactIcon: 'text-[hsl(220_14%_12%)]',
  contactBtn: 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
  heroBg: 'bg-[hsl(220_14%_12%)]',
  heroSub: 'text-[hsl(220_10%_75%)]',
  balanceBg: 'bg-[hsl(220_14%_12%)] border-0',
  balanceLabel: 'text-[hsl(220_10%_80%)]',
  withdrawBtn: 'bg-white text-[hsl(220_14%_12%)] hover:bg-gray-100 border-0',
  iconAccent: 'text-[hsl(220_14%_12%)]',
  timelineDot: 'bg-[hsl(220_14%_12%)]',
  scoreStroke: '#374151',
  scoreFill: 'fill-[hsl(220_14%_12%)]',
};

/* ════════════════════════════════════════════════════════════════
   2. Shell chrome tokens
   ════════════════════════════════════════════════════════════════ */
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
    cyan: isDark ? 'text-cyan-400' : 'text-brand',
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
    cyan: isDark ? 'bg-white/[0.08] text-white font-semibold' : 'bg-ink/[0.05] text-ink font-semibold',
    fuchsia: isDark ? 'bg-white/[0.08] text-white font-semibold' : 'bg-ink/[0.05] text-ink font-semibold',
    indigo: isDark ? 'bg-white/[0.08] text-white font-semibold' : 'bg-ink/[0.05] text-ink font-semibold',
    emerald: isDark ? 'bg-white/[0.08] text-white font-semibold' : 'bg-ink/[0.05] text-ink font-semibold',
    ab: isDark
      ? 'bg-white/[0.08] text-white font-semibold'
      : 'bg-[hsl(220_14%_12%)]/[0.05] text-[hsl(220_14%_12%)] font-semibold',
  };

  const shellMap: Partial<Record<ThemeId, string>> = {
    classic: 'bg-surface text-ink',
    vibrant: 'bg-surface text-ink',
    bento: 'bg-[#F5F3FF] text-ink',
    neon: 'bg-[#ECFDF5] text-ink',
    'vibrant-dark': 'bg-surface text-ink',
    'bento-dark': 'bg-[#131318] text-white',
    'neon-dark': 'bg-[#101e17] text-white',
    'classic-dark': 'bg-[#101a1a] text-white',
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
    'classic-dark': 'bg-gray-900/80 border-gray-700/50',
    activebuddies: 'bg-white/95 backdrop-blur-xl border-[hsl(220_13%_92%)] shadow-soft',
    'activebuddies-dark': 'border-gray-700/50 bg-[hsl(220_16%_11%)]/95 backdrop-blur-md',
  };

  const fabMap: Partial<Record<ThemeId, string>> = {
    classic: 'bg-ink text-white hover:bg-black',
    vibrant: 'bg-fuchsia-600 text-white hover:bg-fuchsia-700',
    'vibrant-dark': 'bg-fuchsia-600 text-white hover:bg-fuchsia-500',
    bento: 'bg-gradient-to-br from-indigo-600 to-violet-500 text-white hover:opacity-90',
    neon: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90',
    'neon-dark': 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90',
    'classic-dark': 'bg-teal-700 text-white hover:bg-teal-600',
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
          : 'text-accent',
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
              : 'text-gray-500 hover:bg-gray-100 hover:text-ink',
    navDisabled: isDark ? 'text-gray-500' : 'text-gray-400',
    chipButton: isDark
      ? isAB
        ? 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/50'
        : 'bg-gray-800/40 text-gray-300 hover:bg-gray-700/50'
      : isAB
        ? 'bg-[hsl(220_14%_96%)] text-[hsl(220_11%_34%)] hover:bg-[hsl(220_13%_92%)]'
        : 'bg-gray-100 text-gray-500 hover:bg-cyan-50 hover:text-brand',
    searchInput: isAB
      ? theme === 'activebuddies-dark'
        ? 'rounded-lg border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-gray-400'
        : 'h-9 rounded-full border-[hsl(220_13%_92%)] bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] placeholder:text-[hsl(220_9%_60%)] focus:bg-white focus:border-[hsl(220_13%_72%)]'
      : isDark
        ? accent === 'fuchsia'
          ? 'rounded-lg border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-fuchsia-500'
          : 'rounded-lg border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-emerald-500'
        : accent === 'fuchsia'
          ? 'rounded-lg border-transparent bg-fuchsia-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-fuchsia-400'
          : accent === 'indigo'
            ? 'rounded-lg border-transparent bg-indigo-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-indigo-400'
            : accent === 'emerald'
              ? 'rounded-lg border-transparent bg-emerald-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-emerald-400'
              : 'rounded-lg border-transparent bg-gray-100 focus:bg-white text-gray-900 focus:ring-1 focus:ring-cyan-500',
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
              : 'bg-brand hover:bg-[#0b6d6f]',
    accentText: accentTextMap[accent],
    accentBg: accentBgMap[accent],
    head: isDark ? 'text-white' : 'text-ink',
    sub: isDark ? 'text-gray-200' : 'text-gray-600',
    muted: isDark ? 'text-gray-300' : 'text-gray-600',
  };
}

/* ════════════════════════════════════════════════════════════════
   3. Page contrast
   ════════════════════════════════════════════════════════════════ */
function textBase(dark: boolean, ab: boolean) {
  if (dark && ab) {
    return {
      head: 'text-[hsl(210_20%_94%)]',
      sub: 'text-[hsl(220_14%_82%)]',
      muted: 'text-[hsl(220_13%_74%)]',
      body: 'text-[hsl(220_14%_85%)]',
      sectionHead: 'text-[hsl(220_13%_70%)]',
    };
  }
  if (dark) {
    return {
      head: 'text-white',
      sub: 'text-gray-200',
      muted: 'text-gray-300',
      body: 'text-gray-200',
      sectionHead: 'text-gray-300',
    };
  }
  if (ab) {
    return {
      head: 'text-[hsl(220_14%_12%)]',
      sub: 'text-[hsl(220_10%_34%)]',
      muted: 'text-[hsl(220_10%_38%)]',
      body: 'text-[hsl(220_10%_32%)]',
      sectionHead: 'text-[hsl(220_10%_40%)]',
    };
  }
  return {
    head: 'text-gray-900',
    sub: 'text-gray-600',
    muted: 'text-gray-600',
    body: 'text-gray-700',
    sectionHead: 'text-gray-600',
  };
}

function linkClass(dark: boolean, family: AccentFamily): string {
  if (family === 'mono') {
    return dark
      ? 'text-[hsl(220_12%_80%)] hover:text-white'
      : 'text-[hsl(220_14%_12%)] hover:text-black';
  }
  if (dark) {
    if (family === 'fuchsia') return 'text-fuchsia-400 hover:text-fuchsia-300';
    if (family === 'indigo') return 'text-indigo-400 hover:text-indigo-300';
    return 'text-emerald-400 hover:text-emerald-300';
  }
  if (family === 'fuchsia') return 'text-fuchsia-600 hover:text-fuchsia-700';
  if (family === 'indigo') return 'text-indigo-600 hover:text-indigo-700';
  if (family === 'emerald') return 'text-emerald-600 hover:text-emerald-700';
  return 'text-cyan-600 hover:text-cyan-800';
}

function surfaces(dark: boolean, ab: boolean) {
  if (dark && ab) {
    return {
      divider: 'divide-[hsl(220_13%_22%)]',
      borderB: 'border-[hsl(220_13%_22%)]',
      borderT: 'border-[hsl(220_13%_22%)]',
      itemHover: 'hover:bg-[hsl(220_16%_14%)]',
      txHover: 'hover:bg-[hsl(220_16%_14%)]',
      inputBg:
        'bg-[hsl(220_16%_16%)] border border-[hsl(220_13%_22%)] text-[hsl(210_20%_92%)] placeholder-[hsl(220_12%_55%)]',
      readBg: 'border-[hsl(220_13%_22%)] bg-[hsl(220_16%_14%)]',
      unreadBg: 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]',
      selectBg: 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)] text-white',
      bankBg: 'border-[hsl(220_13%_22%)] bg-[hsl(220_16%_14%)]',
      bankIcon: 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_22%)] text-[hsl(220_12%_75%)]',
      infoBg: 'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)] shadow-none',
      topicBg:
        'border-[hsl(220_13%_22%)] bg-[hsl(220_16%_14%)] hover:bg-[hsl(220_16%_16%)]',
      topicLabel: 'text-[hsl(210_20%_92%)]',
      progressBg: 'bg-[hsl(220_16%_14%)]',
      cardSurface: 'bg-[hsl(220_16%_14%)]',
    };
  }
  if (dark) {
    return {
      divider: 'divide-gray-700/40',
      borderB: 'border-gray-700/40',
      borderT: 'border-gray-700/40',
      itemHover: 'hover:bg-gray-700/20',
      txHover: 'hover:bg-gray-700/20',
      inputBg: 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-500',
      readBg: 'border-gray-700/40 bg-gray-800/30',
      unreadBg: 'border-gray-700/40 bg-gray-800/40',
      selectBg: 'bg-gray-800 border-gray-700 text-white',
      bankBg: 'border-gray-700/40 bg-gray-800/30',
      bankIcon: 'bg-gray-700/40 border-gray-600 text-gray-400',
      infoBg: 'bg-gray-800/30 border-none shadow-none',
      topicBg: 'border-gray-700/40 bg-gray-800/30 hover:bg-gray-700/30',
      topicLabel: 'text-white',
      progressBg: 'bg-gray-700/40',
      cardSurface: 'bg-gray-800/50',
    };
  }
  if (ab) {
    return {
      divider: 'divide-[hsl(220_13%_88%)]',
      borderB: 'border-[hsl(220_13%_88%)]',
      borderT: 'border-[hsl(220_13%_88%)]',
      itemHover: 'hover:bg-[hsl(220_14%_96%)]',
      txHover: 'hover:bg-[hsl(220_14%_96%)]',
      inputBg:
        'bg-white border border-[hsl(220_13%_88%)] text-[hsl(220_14%_12%)] placeholder-[hsl(220_9%_50%)]',
      readBg: 'border-[hsl(220_13%_88%)] bg-white',
      unreadBg: 'border-[hsl(220_13%_88%)] bg-[hsl(220_14%_96%)]',
      selectBg: 'bg-[hsl(220_14%_96%)] border-[hsl(220_13%_88%)] text-[hsl(220_14%_12%)]',
      bankBg: 'border-[hsl(220_13%_88%)] bg-[hsl(220_14%_96%)]',
      bankIcon: 'bg-white shadow-soft border-[hsl(220_13%_88%)] text-[hsl(220_9%_46%)]',
      infoBg: 'bg-[hsl(220_14%_96%)] border border-[hsl(220_13%_88%)] shadow-none',
      topicBg: 'border-[hsl(220_13%_88%)] bg-white hover:shadow-soft',
      topicLabel: 'text-[hsl(220_14%_12%)]',
      progressBg: 'bg-gray-100',
      cardSurface: 'bg-white',
    };
  }
  return {
    divider: 'divide-gray-100',
    borderB: 'border-gray-100',
    borderT: 'border-gray-100',
    itemHover: 'hover:bg-gray-50',
    txHover: 'hover:bg-gray-50',
    inputBg: 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
    readBg: 'border-gray-100 bg-white',
    unreadBg: 'border-gray-200 bg-gray-50',
    selectBg: 'bg-gray-50 border-gray-200 text-gray-900',
    bankBg: 'border-gray-200 bg-gray-50',
    bankIcon: 'bg-white shadow-soft border-gray-100 text-gray-500',
    infoBg: 'bg-gray-50 border-none shadow-none',
    topicBg: 'border-gray-100 bg-white hover:shadow-soft',
    topicLabel: 'text-gray-900',
    progressBg: 'bg-gray-100',
    cardSurface: 'bg-white',
  };
}

function accentExtras(dark: boolean, family: AccentFamily): AccentPageTone {
  if (family === 'mono') return dark ? MONO_PAGE_DARK : MONO_PAGE_LIGHT;
  const t = accentTone(family, dark);
  return {
    tabActive: t.tabActive,
    tabInactive: t.tabInactive,
    tabActiveBorder: t.tabActiveBorder,
    tabInactiveBorder: t.tabInactiveBorder,
    statBg: t.statBg,
    statVal: t.statVal,
    cardHover: t.cardHover,
    chipActive: t.chipActive,
    chipInactive: t.chipInactive,
    toggleOn: t.toggleOn,
    iconColor: t.iconColor,
    dot: t.dot,
    actionBtn: t.actionBtn,
    msgIcon: t.msgIcon,
    acceptBtn: t.acceptBtn,
    requestBadge: t.requestBadge,
    trustHigh: t.trustHigh,
    tagBg: t.tagBg,
    hoverText: t.hoverText,
    ring: t.ring,
    progressFill: t.progressFill,
    barFill: t.barFill,
    articleCat: t.articleCat,
    contactIcon: t.contactIcon,
    contactBtn: t.contactBtn,
    heroBg: t.heroBg,
    heroSub: t.heroSub,
    balanceBg: t.balanceBg,
    balanceLabel: t.balanceLabel,
    withdrawBtn: t.withdrawBtn,
    iconAccent: t.iconAccent,
    timelineDot: t.timelineDot,
    scoreStroke: t.scoreStroke,
    scoreFill: t.scoreFill,
  };
}

/** Page-level contrast tokens (all 9 themes). */
export type PageContrast = ReturnType<typeof getPageContrast>;

export function getPageContrast(theme: string) {
  const id = (THEME_IDS.includes(theme as ThemeId) ? theme : 'classic') as ThemeId;
  const dark = isDarkTheme(id);
  const ab = isActiveBuddiesTheme(id);
  const family = getAccentFamily(id);
  const text = textBase(dark, ab);
  const surf = surfaces(dark, ab);
  const accent = accentExtras(dark, family);

  return {
    theme: id,
    isDark: dark,
    isAB: ab,
    accentFamily: family,
    ...text,
    ...surf,
    ...accent,
    link: linkClass(dark, family),
    faqAnswer: text.sub,
    chevron: text.muted,
    heroCircle: 'bg-white opacity-10',
    articleHover: accent.cardHover,
    pendingIcon: dark
      ? ab
        ? 'bg-[hsl(220_16%_18%)] text-[hsl(220_12%_75%)] border-[hsl(220_13%_22%)]'
        : 'bg-gray-700/30 text-gray-400 border-gray-600'
      : 'bg-gray-50 text-gray-500 border-gray-200',
    pendingLabel: text.muted,
    uploadArea: dark
      ? ab
        ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]'
        : 'bg-gray-800/30 border-gray-600'
      : 'bg-gray-50 border-gray-200',
    uploadText: text.sub,
    advBadge: dark
      ? ab
        ? 'bg-[hsl(220_16%_18%)] text-[hsl(220_12%_70%)]'
        : 'bg-gray-700/40 text-gray-400'
      : 'bg-gray-100 text-gray-600',
    scoreBg: ab && !dark ? 'bg-[hsl(220_14%_12%)]' : 'bg-gradient-to-br from-cyan-500 to-emerald-500',
    tierListText: text.sub,
    progressIcon: accent.statBg,
    progressIconColor: accent.statVal,
    progressHead: dark ? accent.statVal : accent.statVal,
    progressSub: text.sub,
    progressBar: dark ? surf.progressBg : accent.statBg.replace('border-', 'bg-').split(' ')[0],
    completedIcon: dark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600',
    tierEmail: dark ? 'bg-cyan-900/20 border-cyan-800/30' : 'bg-cyan-50 border-cyan-100',
    tierPhone: dark ? 'bg-purple-900/20 border-purple-800/30' : 'bg-purple-50 border-purple-100',
    tierId: dark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100',
    tierTimeBg: surf.cardSurface,
    catOn: accent.tagBg,
    catOff: accent.chipInactive,
    twofaBg: dark
      ? ab
        ? 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]'
        : 'border-gray-700/40 bg-gray-800/30'
      : family === 'fuchsia'
        ? 'border-fuchsia-200 bg-fuchsia-50/30'
        : family === 'indigo'
          ? 'border-indigo-200 bg-indigo-50/30'
          : family === 'emerald'
            ? 'border-emerald-200 bg-emerald-50/30'
            : 'border-cyan-200 bg-cyan-50/30',
    sessionBadge: dark
      ? 'text-emerald-300 bg-emerald-900/30'
      : 'text-emerald-700 bg-emerald-50',
    timelineLine: dark ? 'bg-gray-700' : 'bg-gray-200',
    streakOff: dark ? 'bg-gray-700/30 text-gray-500' : 'bg-gray-100 text-gray-400',
    lbBorder: dark ? 'border-gray-700/30' : 'border-gray-50',
    xpBadge: accent.statBg + ' ' + accent.statVal,
    gradientFrom: family === 'fuchsia' ? 'from-fuchsia-500' : family === 'indigo' ? 'from-indigo-500' : family === 'mono' ? 'from-gray-600' : 'from-emerald-500',
    gradientTo: family === 'fuchsia' ? 'to-orange-500' : family === 'indigo' ? 'to-violet-500' : 'to-gray-400',
    highlightRow: dark ? surf.unreadBg : accent.statBg,
    highlightText: accent.statVal,
    challengeBg: dark
      ? ab
        ? 'bg-[hsl(220_16%_14%)] border-[hsl(220_13%_22%)]'
        : 'bg-gray-800/40 border-gray-700/40'
      : 'bg-gray-50 border-gray-100',
    shareHover: dark ? `${text.muted} hover:${accent.statVal.split(' ')[0]}` : `${text.muted} hover:text-cyan-600`,
    label: text.head,
    value: text.head,
    labelMuted: text.muted,
  };
}

/** Profile page extras */
export function getProfileContrast(theme: string) {
  const p = getPageContrast(theme);
  const dark = p.isDark;
  const family = p.accentFamily;

  if (family === 'mono') {
    return {
      ...p,
      accent: dark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
      accentBg: dark ? 'bg-[hsl(220_16%_18%)]' : 'bg-[hsl(220_14%_96%)]',
      accentBorder: dark ? 'border-[hsl(220_13%_22%)]' : 'border-[hsl(220_13%_88%)]',
      accentLight: dark ? 'text-[hsl(220_12%_80%)]' : 'text-[hsl(220_9%_40%)]',
      ring: 'focus:ring-white/30 focus:border-white/40',
      checkbox: dark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
      radioActive: dark
        ? 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]'
        : 'border-[hsl(220_13%_88%)] bg-[hsl(220_14%_96%)]',
      radioText: p.head,
      radioSub: p.sub,
      tierHighlight: dark
        ? 'border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)]'
        : 'border-emerald-200 bg-emerald-50/50',
      tierHighlightText: dark ? 'text-white' : 'text-emerald-800',
      tierHighlightSub: dark ? 'text-[hsl(220_12%_75%)]' : 'text-emerald-600/80',
      btnAccent: dark ? 'text-white hover:bg-[hsl(220_16%_18%)]' : 'text-[hsl(220_14%_12%)] hover:bg-[hsl(220_14%_96%)]',
      historyIcon: dark
        ? 'bg-[hsl(220_16%_18%)] text-white'
        : 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)]',
      selectBg: p.selectBg,
      selectRing: p.ring,
      settingCard: dark
        ? 'bg-[hsl(220_16%_14%)] border-[hsl(220_13%_22%)]'
        : 'bg-white border-gray-100',
      avatarBg: dark ? 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_22%)]' : 'bg-[hsl(220_14%_96%)] border-[hsl(220_13%_88%)]',
      avatarText: dark ? 'text-white' : 'text-[hsl(220_14%_12%)]',
    };
  }

  const t = accentTone(family, dark);
  return {
    ...p,
    accent: t.accent,
    accentBg: t.accentBg,
    accentBorder: t.accentBorder,
    accentLight: t.accentLight,
    ring: t.profileRing,
    checkbox: t.checkbox,
    radioActive: t.radioActive,
    radioText: t.radioText,
    radioSub: t.radioSub,
    tierHighlight: t.tierHighlight,
    tierHighlightText: t.tierHighlightText,
    tierHighlightSub: t.tierHighlightSub,
    btnAccent: t.btnAccent,
    historyIcon: t.historyIcon,
    selectBg: t.profileSelectBg,
    selectRing: t.selectRing,
    settingCard: t.settingCard,
    avatarBg: t.avatarBg,
    avatarText: t.avatarText,
  };
}

/* ════════════════════════════════════════════════════════════════
   4. Home & global contrast
   ════════════════════════════════════════════════════════════════ */
export interface HomeContrastTheme {
  hero: string;
  heroGreeting: string;
  heroMotivation: string;
  heroTitle: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroStat: string;
  heroStatIcon: string;
  heroSearchInput: string;
  heroSearchDropdown: string;
  heroSearchDropdownLabel: string;
  heroSearchItem: string;
  heroSearchItemHover: string;
  heroOutlineBtn: string;
  heroDecor: string;
  card: string;
  cardBorder: string;
  sectionLabel: string;
  heading: string;
  body: string;
  bodyMuted: string;
  labelMuted: string;
  chipActive: string;
  chipInactive: string;
  tagActive: string;
  tagInactive: string;
  select: string;
  filterBtn: string;
  filterBadge: string;
  stepBadge: string;
  stepTitle: string;
  stepBody: string;
  tipBanner: string;
  tipLabel: string;
  tipBody: string;
  feedbackBanner: string;
  feedbackTitle: string;
  feedbackBody: string;
  feedbackBtn: string;
  statIconBg: { streak: string; month: string; level: string };
  statIconColor: { streak: string; month: string; level: string };
  statValue: string;
  statUnit: string;
  feedTabActive: string;
  feedTabInactive: string;
  clearFilters: string;
}

const lightBase = {
  card: 'bg-white border-gray-200 shadow-soft',
  cardBorder: 'border-gray-200',
  sectionLabel: 'text-gray-600',
  heading: 'text-gray-900',
  body: 'text-gray-700',
  bodyMuted: 'text-gray-600',
  labelMuted: 'text-gray-600',
  chipInactive: 'bg-transparent border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900',
  select:
    'filter-select text-gray-800 border border-gray-200 shadow-soft bg-white hover:bg-gray-50',
  filterBtn: 'bg-white border border-gray-200 text-gray-800 shadow-soft',
  stepTitle: 'text-gray-900',
  stepBody: 'text-gray-600',
  statValue: 'text-gray-900',
  statUnit: 'text-gray-600',
  feedTabInactive: 'text-gray-600 hover:text-gray-900',
  clearFilters: 'text-gray-600 hover:text-gray-900',
};

const darkBase = {
  card: 'bg-gray-800/70 border-gray-600/50 shadow-soft',
  cardBorder: 'border-gray-600/50',
  sectionLabel: 'text-gray-200',
  heading: 'text-white',
  body: 'text-gray-100',
  bodyMuted: 'text-gray-200',
  labelMuted: 'text-gray-200',
  chipInactive:
    'bg-gray-800/50 border border-gray-600/50 text-gray-200 hover:border-gray-500 hover:text-white',
  select:
    'filter-select text-gray-100 border border-gray-600/50 bg-gray-800/50 hover:bg-gray-700/50',
  filterBtn: 'bg-gray-800/50 border border-gray-600/50 text-gray-100 shadow-soft',
  stepTitle: 'text-white',
  stepBody: 'text-gray-300',
  statValue: 'text-white',
  statUnit: 'text-gray-300',
  feedTabInactive: 'text-gray-400 hover:text-white',
  clearFilters: 'text-gray-400 hover:text-white',
};

const HOME_THEMES: Record<ThemeId, HomeContrastTheme> = {
  classic: {
    ...lightBase,
    hero: 'bg-gray-900 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-cyan-400 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-cyan-300',
    heroSubtitle: 'text-gray-300 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-cyan-400',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-white/10 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400/60',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-gray-200 z-fab',
    heroSearchDropdownLabel: 'text-gray-600',
    heroSearchItem: 'text-gray-800',
    heroSearchItemHover: 'hover:bg-cyan-50 hover:text-cyan-800',
    heroOutlineBtn:
      'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 h-11 rounded-2xl',
    heroDecor: 'from-cyan-500/20 to-purple-500/20',
    chipActive: 'bg-gray-900 text-white',
    tagActive: 'bg-cyan-100 border-cyan-600 text-cyan-900',
    tagInactive: 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-900',
    filterBadge: 'bg-cyan-600 text-white',
    stepBadge: 'bg-cyan-100 text-cyan-900',
    tipBanner: 'bg-white border border-gray-200 shadow-soft',
    tipLabel: 'text-amber-700',
    tipBody: 'text-gray-700',
    feedbackBanner: 'bg-cyan-50 border border-cyan-200',
    feedbackTitle: 'text-gray-900',
    feedbackBody: 'text-gray-700',
    feedbackBtn: 'bg-gray-900 text-white hover:bg-black',
    statIconBg: { streak: 'bg-orange-100', month: 'bg-cyan-100', level: 'bg-amber-100' },
    statIconColor: { streak: 'text-orange-700', month: 'text-cyan-800', level: 'text-amber-700' },
    feedTabActive: 'text-cyan-800 font-bold border-b-2 border-cyan-600',
  },

  vibrant: {
    ...lightBase,
    hero: 'bg-gradient-to-br from-fuchsia-900 via-fuchsia-800 to-orange-900 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-fuchsia-200 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-fuchsia-100/90 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-fuchsia-200',
    heroSubtitle: 'text-fuchsia-100 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-fuchsia-100',
    heroStatIcon: 'text-fuchsia-200',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-white/15 bg-white/10 text-white placeholder-fuchsia-200/70 focus:ring-2 focus:ring-fuchsia-300/50',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-fuchsia-100 z-fab',
    heroSearchDropdownLabel: 'text-gray-600',
    heroSearchItem: 'text-gray-800',
    heroSearchItemHover: 'hover:bg-fuchsia-50 hover:text-fuchsia-900',
    heroOutlineBtn: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 h-11 rounded-2xl',
    heroDecor: 'from-fuchsia-400/30 to-orange-400/20',
    chipActive: 'bg-fuchsia-700 text-white',
    tagActive: 'bg-fuchsia-100 border-fuchsia-600 text-fuchsia-900',
    tagInactive: 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-900',
    filterBadge: 'bg-fuchsia-600 text-white',
    stepBadge: 'bg-gray-100 text-gray-700',
    tipBanner: 'bg-white border border-fuchsia-100 shadow-soft',
    tipLabel: 'text-amber-700',
    tipBody: 'text-gray-700',
    feedbackBanner: 'bg-fuchsia-50 border border-fuchsia-200',
    feedbackTitle: 'text-gray-900',
    feedbackBody: 'text-gray-700',
    feedbackBtn: 'bg-fuchsia-700 text-white hover:bg-fuchsia-800',
    statIconBg: { streak: 'bg-orange-100', month: 'bg-fuchsia-100', level: 'bg-amber-100' },
    statIconColor: { streak: 'text-orange-700', month: 'text-fuchsia-800', level: 'text-amber-700' },
    feedTabActive: 'text-fuchsia-800 font-bold border-b-2 border-fuchsia-600',
  },

  bento: {
    ...lightBase,
    hero: 'bg-gradient-to-br from-indigo-900 to-violet-900 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-indigo-200 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-indigo-100/90 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-indigo-200',
    heroSubtitle: 'text-indigo-100 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-indigo-100',
    heroStatIcon: 'text-indigo-200',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-white/15 bg-white/10 text-white placeholder-indigo-200/70 focus:ring-2 focus:ring-indigo-300/50',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-indigo-100 z-fab',
    heroSearchDropdownLabel: 'text-gray-600',
    heroSearchItem: 'text-gray-800',
    heroSearchItemHover: 'hover:bg-indigo-50 hover:text-indigo-900',
    heroOutlineBtn: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 h-11 rounded-2xl',
    heroDecor: 'from-indigo-400/25 to-violet-400/20',
    chipActive: 'bg-indigo-700 text-white',
    tagActive: 'bg-indigo-100 border-indigo-600 text-indigo-900',
    tagInactive: 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-800',
    filterBadge: 'bg-indigo-600 text-white',
    stepBadge: 'bg-indigo-100 text-indigo-900',
    tipBanner: 'bg-white border border-indigo-100 shadow-soft',
    tipLabel: 'text-indigo-800',
    tipBody: 'text-gray-700',
    feedbackBanner: 'bg-indigo-50 border border-indigo-200',
    feedbackTitle: 'text-gray-900',
    feedbackBody: 'text-gray-700',
    feedbackBtn: 'bg-indigo-700 text-white hover:bg-indigo-800',
    statIconBg: { streak: 'bg-orange-100', month: 'bg-indigo-100', level: 'bg-amber-100' },
    statIconColor: { streak: 'text-orange-700', month: 'text-indigo-800', level: 'text-amber-700' },
    feedTabActive: 'text-indigo-800 font-bold border-b-2 border-indigo-600',
  },

  neon: {
    ...lightBase,
    hero: 'bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-emerald-200 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-emerald-100/90 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-emerald-200',
    heroSubtitle: 'text-emerald-100 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-emerald-100',
    heroStatIcon: 'text-emerald-200',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-white/15 bg-white/10 text-white placeholder-emerald-200/70 focus:ring-2 focus:ring-emerald-300/50',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-emerald-100 z-fab',
    heroSearchDropdownLabel: 'text-gray-600',
    heroSearchItem: 'text-gray-800',
    heroSearchItemHover: 'hover:bg-emerald-50 hover:text-emerald-900',
    heroOutlineBtn: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 h-11 rounded-2xl',
    heroDecor: 'from-emerald-400/25 to-teal-400/20',
    chipActive: 'bg-emerald-700 text-white',
    tagActive: 'bg-emerald-100 border-emerald-600 text-emerald-900',
    tagInactive: 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:text-emerald-800',
    filterBadge: 'bg-emerald-600 text-white',
    stepBadge: 'bg-emerald-100 text-emerald-900',
    tipBanner: 'bg-white border border-emerald-100 shadow-soft',
    tipLabel: 'text-emerald-800',
    tipBody: 'text-gray-700',
    feedbackBanner: 'bg-emerald-50 border border-emerald-200',
    feedbackTitle: 'text-gray-900',
    feedbackBody: 'text-gray-700',
    feedbackBtn: 'bg-emerald-700 text-white hover:bg-emerald-800',
    statIconBg: { streak: 'bg-orange-100', month: 'bg-emerald-100', level: 'bg-amber-100' },
    statIconColor: { streak: 'text-orange-700', month: 'text-emerald-800', level: 'text-amber-700' },
    feedTabActive: 'text-emerald-800 font-bold border-b-2 border-emerald-600',
  },

  'vibrant-dark': {
    ...darkBase,
    hero: 'bg-gradient-to-br from-[#1C141B] to-fuchsia-950 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden border border-fuchsia-800/40',
    heroGreeting: 'text-fuchsia-300 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-fuchsia-300',
    heroSubtitle: 'text-gray-300 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-fuchsia-400',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-fuchsia-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-fab',
    heroSearchDropdownLabel: 'text-gray-400',
    heroSearchItem: 'text-gray-100',
    heroSearchItemHover: 'hover:bg-fuchsia-900/40 hover:text-fuchsia-200',
    heroOutlineBtn: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600 px-5 h-11 rounded-2xl',
    heroDecor: 'from-fuchsia-500/20 to-orange-500/15',
    chipActive: 'bg-fuchsia-600 text-white',
    tagActive: 'bg-fuchsia-900/50 border-fuchsia-500 text-fuchsia-200',
    tagInactive: 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white',
    filterBadge: 'bg-fuchsia-500 text-white',
    stepBadge: 'bg-gray-700/50 text-gray-300',
    tipBanner: 'bg-gray-800/70 border border-gray-600/50 shadow-soft',
    tipLabel: 'text-amber-300',
    tipBody: 'text-gray-200',
    feedbackBanner: 'bg-fuchsia-950/50 border border-fuchsia-800/50',
    feedbackTitle: 'text-white',
    feedbackBody: 'text-gray-300',
    feedbackBtn: 'bg-fuchsia-600 text-white hover:bg-fuchsia-500',
    statIconBg: { streak: 'bg-orange-900/40', month: 'bg-fuchsia-900/40', level: 'bg-amber-900/40' },
    statIconColor: { streak: 'text-orange-300', month: 'text-fuchsia-300', level: 'text-amber-300' },
    feedTabActive: 'text-fuchsia-300 font-bold border-b-2 border-fuchsia-500',
  },

  'bento-dark': {
    ...darkBase,
    hero: 'bg-gradient-to-br from-[#131318] to-indigo-950 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden border border-indigo-800/40',
    heroGreeting: 'text-indigo-300 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-indigo-300',
    heroSubtitle: 'text-gray-300 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-indigo-400',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-fab',
    heroSearchDropdownLabel: 'text-gray-400',
    heroSearchItem: 'text-gray-100',
    heroSearchItemHover: 'hover:bg-indigo-900/40 hover:text-indigo-200',
    heroOutlineBtn: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600 px-5 h-11 rounded-2xl',
    heroDecor: 'from-indigo-500/20 to-violet-500/15',
    chipActive: 'bg-indigo-600 text-white',
    tagActive: 'bg-indigo-900/50 border-indigo-500 text-indigo-200',
    tagInactive: 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-indigo-600 hover:text-indigo-200',
    filterBadge: 'bg-indigo-500 text-white',
    stepBadge: 'bg-indigo-900/50 text-indigo-300',
    tipBanner: 'bg-gray-800/70 border border-gray-600/50 shadow-soft',
    tipLabel: 'text-indigo-300',
    tipBody: 'text-gray-200',
    feedbackBanner: 'bg-indigo-950/50 border border-indigo-800/50',
    feedbackTitle: 'text-white',
    feedbackBody: 'text-gray-300',
    feedbackBtn: 'bg-indigo-600 text-white hover:bg-indigo-500',
    statIconBg: { streak: 'bg-orange-900/40', month: 'bg-indigo-900/40', level: 'bg-amber-900/40' },
    statIconColor: { streak: 'text-orange-300', month: 'text-indigo-300', level: 'text-amber-300' },
    feedTabActive: 'text-indigo-300 font-bold border-b-2 border-indigo-500',
  },

  'neon-dark': {
    ...darkBase,
    hero: 'bg-gradient-to-br from-[#101e17] to-emerald-950 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden border border-emerald-800/40',
    heroGreeting: 'text-emerald-300 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-emerald-300',
    heroSubtitle: 'text-gray-300 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-emerald-400',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-fab',
    heroSearchDropdownLabel: 'text-gray-400',
    heroSearchItem: 'text-gray-100',
    heroSearchItemHover: 'hover:bg-emerald-900/40 hover:text-emerald-200',
    heroOutlineBtn: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600 px-5 h-11 rounded-2xl',
    heroDecor: 'from-emerald-500/20 to-teal-500/15',
    chipActive: 'bg-emerald-600 text-white',
    tagActive: 'bg-emerald-900/50 border-emerald-500 text-emerald-200',
    tagInactive: 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-emerald-600 hover:text-emerald-200',
    filterBadge: 'bg-emerald-500 text-white',
    stepBadge: 'bg-emerald-900/50 text-emerald-300',
    tipBanner: 'bg-gray-800/70 border border-gray-600/50 shadow-soft',
    tipLabel: 'text-emerald-300',
    tipBody: 'text-gray-200',
    feedbackBanner: 'bg-emerald-950/50 border border-emerald-800/50',
    feedbackTitle: 'text-white',
    feedbackBody: 'text-gray-300',
    feedbackBtn: 'bg-emerald-600 text-white hover:bg-emerald-500',
    statIconBg: { streak: 'bg-orange-900/40', month: 'bg-emerald-900/40', level: 'bg-amber-900/40' },
    statIconColor: { streak: 'text-orange-300', month: 'text-emerald-300', level: 'text-amber-300' },
    feedTabActive: 'text-emerald-300 font-bold border-b-2 border-emerald-500',
  },

  'classic-dark': {
    ...darkBase,
    hero: 'bg-gradient-to-br from-[#101a1a] to-teal-950 text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden border border-teal-800/40',
    heroGreeting: 'text-teal-300 hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-teal-300',
    heroSubtitle: 'text-gray-300 font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-teal-400',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-fab',
    heroSearchDropdownLabel: 'text-gray-400',
    heroSearchItem: 'text-gray-100',
    heroSearchItemHover: 'hover:bg-teal-900/40 hover:text-teal-200',
    heroOutlineBtn: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600 px-5 h-11 rounded-2xl',
    heroDecor: 'from-teal-500/20 to-cyan-500/15',
    chipActive: 'bg-teal-600 text-white',
    tagActive: 'bg-teal-900/50 border-teal-500 text-teal-200',
    tagInactive: 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-teal-600 hover:text-teal-200',
    filterBadge: 'bg-teal-500 text-white',
    stepBadge: 'bg-teal-900/50 text-teal-300',
    tipBanner: 'bg-gray-800/70 border border-gray-600/50 shadow-soft',
    tipLabel: 'text-teal-300',
    tipBody: 'text-gray-200',
    feedbackBanner: 'bg-teal-950/50 border border-teal-800/50',
    feedbackTitle: 'text-white',
    feedbackBody: 'text-gray-300',
    feedbackBtn: 'bg-teal-600 text-white hover:bg-teal-500',
    statIconBg: { streak: 'bg-orange-900/40', month: 'bg-teal-900/40', level: 'bg-amber-900/40' },
    statIconColor: { streak: 'text-orange-300', month: 'text-teal-300', level: 'text-amber-300' },
    feedTabActive: 'text-teal-300 font-bold border-b-2 border-teal-500',
  },

  activebuddies: {
    ...lightBase,
    hero: 'bg-[hsl(220_14%_12%)] text-white p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden border border-[hsl(220_13%_18%)]',
    heroGreeting: 'text-[hsl(0_0%_88%)] hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-[hsl(220_10%_75%)] text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-white',
    heroSubtitle:
      'text-[hsl(220_10%_80%)] font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-[hsl(220_10%_78%)]',
    heroStatIcon: 'text-white',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-full border border-[hsl(220_13%_30%)] bg-white/10 text-white placeholder-[hsl(220_10%_65%)] focus:ring-2 focus:ring-white/40 focus:bg-white/15',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-[hsl(220_13%_88%)] z-fab',
    heroSearchDropdownLabel: 'text-gray-600',
    heroSearchItem: 'text-gray-900',
    heroSearchItemHover: 'hover:bg-[hsl(220_14%_96%)] hover:text-gray-900',
    heroOutlineBtn:
      'bg-white/10 hover:bg-white/20 text-white border border-white/25 px-5 h-11 rounded-full',
    heroDecor: 'from-white/10 to-gray-500/10',
    chipActive: 'bg-[hsl(220_14%_12%)] text-white',
    tagActive: 'bg-[hsl(220_14%_92%)] border-[hsl(220_14%_12%)] text-[hsl(220_14%_12%)]',
    tagInactive:
      'bg-white border border-[hsl(220_13%_88%)] text-gray-700 hover:border-[hsl(220_13%_72%)] hover:text-gray-900',
    filterBadge: 'bg-[hsl(220_14%_12%)] text-white',
    stepBadge: 'bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)]',
    tipBanner: 'bg-white border border-[hsl(220_13%_88%)] shadow-soft',
    tipLabel: 'text-gray-800',
    tipBody: 'text-gray-700',
    feedbackBanner: 'bg-[hsl(220_14%_96%)] border border-[hsl(220_13%_88%)]',
    feedbackTitle: 'text-gray-900',
    feedbackBody: 'text-gray-700',
    feedbackBtn: 'bg-[hsl(220_14%_12%)] text-white hover:bg-black',
    statIconBg: { streak: 'bg-gray-100', month: 'bg-gray-100', level: 'bg-gray-100' },
    statIconColor: { streak: 'text-gray-800', month: 'text-gray-800', level: 'text-gray-800' },
    feedTabActive: 'text-gray-900 font-bold border-b-2 border-[hsl(220_14%_12%)]',
  },

  'activebuddies-dark': {
    ...darkBase,
    hero: 'bg-[hsl(220_16%_11%)] text-[hsl(210_20%_92%)] p-4 md:p-5 rounded-2xl shadow-soft-lg relative overflow-hidden border border-[hsl(220_13%_22%)]',
    heroGreeting: 'text-[hsl(0_0%_90%)] hero-greeting font-bold tracking-tight mb-1.5',
    heroMotivation: 'text-[hsl(220_12%_70%)] text-xs md:text-sm font-medium mb-3',
    heroTitle: 'text-white hero-sublead font-bold tracking-tight mb-2 leading-snug',
    heroTitleAccent: 'text-white',
    heroSubtitle:
      'text-[hsl(220_12%_78%)] font-medium text-xs md:text-sm leading-relaxed max-w-xl mb-4',
    heroStat: 'text-[hsl(220_12%_80%)]',
    heroStatIcon: 'text-[hsl(0_0%_95%)]',
    heroSearchInput:
      'w-full h-9 pl-9 pr-3 text-xs rounded-full border border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)] text-white placeholder-[hsl(220_12%_55%)] focus:ring-2 focus:ring-white/30',
    heroSearchDropdown: 'bg-[hsl(220_16%_14%)] rounded-2xl shadow-soft-lg border border-[hsl(220_13%_22%)] z-fab',
    heroSearchDropdownLabel: 'text-[hsl(220_13%_74%)]',
    heroSearchItem: 'text-[hsl(210_20%_92%)]',
    heroSearchItemHover: 'hover:bg-[hsl(220_16%_18%)] hover:text-white',
    heroOutlineBtn:
      'bg-[hsl(220_16%_16%)] hover:bg-[hsl(220_16%_20%)] text-white border border-[hsl(220_13%_28%)] px-5 h-11 rounded-full',
    heroDecor: 'from-white/5 to-transparent',
    chipActive: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)]',
    tagActive: 'bg-[hsl(220_16%_18%)] border-[hsl(220_13%_35%)] text-white',
    tagInactive:
      'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)] text-[hsl(220_12%_75%)] hover:border-[hsl(220_13%_35%)] hover:text-white',
    filterBadge: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)]',
    stepBadge: 'bg-[hsl(220_16%_18%)] text-white',
    tipBanner: 'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)] shadow-soft',
    tipLabel: 'text-[hsl(220_12%_75%)]',
    tipBody: 'text-[hsl(220_12%_80%)]',
    feedbackBanner: 'bg-[hsl(220_16%_16%)] border border-[hsl(220_13%_28%)]',
    feedbackTitle: 'text-white',
    feedbackBody: 'text-[hsl(220_12%_78%)]',
    feedbackBtn: 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white',
    statIconBg: { streak: 'bg-[hsl(220_16%_18%)]', month: 'bg-[hsl(220_16%_18%)]', level: 'bg-[hsl(220_16%_18%)]' },
    statIconColor: { streak: 'text-white', month: 'text-white', level: 'text-white' },
    feedTabActive: 'text-white font-bold border-b-2 border-white',
  },
};

export function getHomeContrastTheme(theme: string): HomeContrastTheme {
  return HOME_THEMES[theme as ThemeId] ?? HOME_THEMES.classic;
}

/** Global semantic contrast (cards, modals, typography). */
export interface GlobalContrastTheme {
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  modalOverlay: string;
  modalPanel: string;
  inputBg: string;
  inputFg: string;
  placeholder: string;
  onLightPanel: string;
  onLightPanelMuted: string;
}

export function getGlobalContrast(theme: string): GlobalContrastTheme {
  const dark = isDarkTheme(theme);
  const ab = isActiveBuddiesTheme(theme);

  if (ab && !dark) {
    return {
      fg: 'text-[hsl(220_14%_12%)]',
      fgMuted: 'text-[hsl(220_10%_34%)]',
      fgSubtle: 'text-[hsl(220_10%_38%)]',
      surface: 'bg-white',
      surfaceElevated: 'bg-white',
      border: 'border-[hsl(220_13%_88%)]',
      modalOverlay: 'bg-black/40',
      modalPanel: 'bg-white border border-[hsl(220_13%_88%)]',
      inputBg: 'bg-[hsl(220_14%_96%)]',
      inputFg: 'text-[hsl(220_14%_12%)]',
      placeholder: 'placeholder-[hsl(220_9%_50%)]',
      onLightPanel: 'text-[hsl(220_14%_12%)]',
      onLightPanelMuted: 'text-[hsl(220_9%_40%)]',
    };
  }
  if (ab && dark) {
    return {
      fg: 'text-[hsl(210_20%_92%)]',
      fgMuted: 'text-[hsl(220_12%_75%)]',
      fgSubtle: 'text-[hsl(220_13%_72%)]',
      surface: 'bg-[hsl(220_16%_11%)]',
      surfaceElevated: 'bg-[hsl(220_16%_14%)]',
      border: 'border-[hsl(220_13%_22%)]',
      modalOverlay: 'bg-black/60',
      modalPanel: 'bg-[hsl(220_16%_14%)] border border-[hsl(220_13%_22%)]',
      inputBg: 'bg-[hsl(220_16%_16%)]',
      inputFg: 'text-white',
      placeholder: 'placeholder-[hsl(220_12%_55%)]',
      onLightPanel: 'text-[hsl(220_14%_12%)]',
      onLightPanelMuted: 'text-[hsl(220_9%_40%)]',
    };
  }
  if (dark) {
    return {
      fg: 'text-white',
      fgMuted: 'text-gray-300',
      fgSubtle: 'text-gray-400',
      surface: 'bg-gray-800/70',
      surfaceElevated: 'bg-gray-900/90',
      border: 'border-gray-600/50',
      modalOverlay: 'bg-black/60',
      modalPanel: 'bg-gray-900 border border-gray-600',
      inputBg: 'bg-gray-800/50',
      inputFg: 'text-white',
      placeholder: 'placeholder-gray-500',
      onLightPanel: 'text-gray-900',
      onLightPanelMuted: 'text-gray-600',
    };
  }
  return {
    fg: 'text-gray-900',
    fgMuted: 'text-gray-600',
    fgSubtle: 'text-gray-500',
    surface: 'bg-white',
    surfaceElevated: 'bg-white',
    border: 'border-gray-200',
    modalOverlay: 'bg-slate-900/40',
    modalPanel: 'bg-white border border-gray-200',
    inputBg: 'bg-white',
    inputFg: 'text-gray-900',
    placeholder: 'placeholder-gray-500',
    onLightPanel: 'text-gray-900',
    onLightPanelMuted: 'text-gray-600',
  };
}

/* ════════════════════════════════════════════════════════════════
   5. Event detail tokens
   ════════════════════════════════════════════════════════════════ */
export interface EventDetailSurfaceTokens {
  sectionBorder: string;
  sectionHeading: string;
  body: string;
  muted: string;
  card: string;
  innerCard: string;
  labelMicro: string;
  listText: string;
  listStrong: string;
  iconMuted: string;
  shadow: string;
  primaryBtn: string;
  primaryBtnStop: string;
  verifiedIcon: string;
  verifiedBg: string;
}

const ED_BTN_OFF_LIGHT = 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-200';
const ED_BTN_OFF_DARK = 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-800';

const ED_BTN_ON: Record<EventDetailMapAccent, { light: string; dark: string }> = {
  classic: { light: 'bg-brand hover:bg-[#0b6d6f] text-white', dark: 'bg-cyan-600 hover:bg-cyan-700 text-white' },
  vibrant: { light: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white', dark: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white' },
  neon: { light: 'bg-emerald-600 hover:bg-emerald-700 text-white', dark: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  bento: { light: 'bg-indigo-600 hover:bg-indigo-700 text-white', dark: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
};

export function getEventDetailSurfaceTokens(
  accent: EventDetailMapAccent,
  darkSurface = false,
): EventDetailSurfaceTokens {
  const btnOn = darkSurface ? ED_BTN_ON[accent].dark : ED_BTN_ON[accent].light;
  const btnOff = darkSurface ? ED_BTN_OFF_DARK : ED_BTN_OFF_LIGHT;

  if (darkSurface) {
    return {
      sectionBorder: 'border-gray-700',
      sectionHeading: APP_TYPO.sectionLabel + ' text-white',
      body: APP_TYPO.bodyMedium + ' text-white',
      muted: APP_TYPO.bodyMedium + ' text-gray-300',
      card: 'rounded-2xl border border-gray-700 bg-gray-800/80 p-4 md:p-5',
      innerCard: 'rounded-2xl border p-4',
      labelMicro: APP_TYPO.micro + ' font-bold tracking-wider',
      listText: 'text-xs text-gray-200',
      listStrong: 'text-white',
      iconMuted: 'text-gray-400',
      shadow: 'shadow-soft',
      primaryBtn: `${APP_TYPO.micro} font-bold py-1.5 px-3 rounded-xl transition-all duration-200 ${btnOn}`,
      primaryBtnStop: `${APP_TYPO.micro} font-bold py-1.5 px-3 rounded-xl transition-all duration-200 ${btnOff}`,
      verifiedIcon: 'text-emerald-400',
      verifiedBg: 'bg-emerald-950/40 border-emerald-900',
    };
  }

  return {
    sectionBorder: 'border-gray-200',
    sectionHeading: APP_TYPO.sectionLabel + ' text-ink',
    body: APP_TYPO.bodyMedium + ' text-ink',
    muted: APP_TYPO.bodyMedium + ' text-gray-600',
    card: 'rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-soft',
    innerCard: 'rounded-2xl border p-4',
    labelMicro: 'text-2xs font-bold tracking-wider',
    listText: 'text-xs text-gray-600',
    listStrong: 'text-gray-700',
    iconMuted: 'text-gray-400',
    shadow: 'shadow-soft',
    primaryBtn: `${APP_TYPO.micro} font-bold py-1.5 px-3 rounded-xl transition-all duration-200 shadow-soft ${btnOn}`,
    primaryBtnStop: `${APP_TYPO.micro} font-bold py-1.5 px-3 rounded-xl transition-all duration-200 ${btnOff}`,
    verifiedIcon: 'text-emerald-600',
    verifiedBg: 'bg-emerald-50/80 border-emerald-100',
  };
}

/** Outer reliability note — Classic card (all themes). */
export function getEventDetailReliabilityShell(darkSurface: boolean): string {
  return darkSurface
    ? 'rounded-xl border border-gray-700 bg-gray-900/50 p-4 md:p-5 text-xs shadow-soft'
    : 'rounded-xl border border-gray-100 bg-gray-50/50 p-4 md:p-5 text-xs shadow-soft';
}

interface AccentContentTokens {
  metaLabel: string;
  metaValue: string;
  metaMuted: string;
  trustLink: string;
  aboutBody: string;
  tagBadge: string;
  tagIcon: string;
  externalLink: string;
}

const ED_CONTENT_BASE = {
  light: {
    metaLabel: 'text-gray-500',
    metaValue: 'text-ink',
    metaMuted: 'text-gray-400',
    aboutBody: 'text-gray-600',
    tagBadge: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200/60',
    tagIcon: 'text-gray-400',
  },
  dark: {
    metaLabel: 'text-white',
    metaValue: 'text-white',
    metaMuted: 'text-gray-300',
    aboutBody: 'text-white',
    tagBadge: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700/60',
    tagIcon: 'text-white',
  },
};

const ED_CONTENT_ACCENT: Record<
  EventDetailMapAccent,
  { light: Pick<AccentContentTokens, 'trustLink' | 'externalLink'> & Partial<AccentContentTokens>; dark: Pick<AccentContentTokens, 'trustLink' | 'externalLink'> & Partial<AccentContentTokens> }
> = {
  classic: {
    light: {
      trustLink: 'text-cyan-600',
      metaLabel: 'text-gray-500',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-brand hover:border-[#a5f3fc] rounded-2xl',
    },
    dark: {
      trustLink: 'text-cyan-400',
      metaLabel: 'text-gray-300',
      metaMuted: 'text-gray-400',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-cyan-400 hover:border-cyan-800 rounded-2xl',
    },
  },
  vibrant: {
    light: {
      trustLink: 'text-fuchsia-600',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-fuchsia-600 hover:border-fuchsia-200 rounded-2xl',
    },
    dark: {
      trustLink: 'text-fuchsia-400',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-fuchsia-400 hover:border-fuchsia-800 rounded-2xl',
    },
  },
  neon: {
    light: {
      trustLink: 'text-emerald-600',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl',
    },
    dark: {
      trustLink: 'text-emerald-400',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-emerald-400 hover:border-emerald-800 rounded-2xl',
    },
  },
  bento: {
    light: {
      trustLink: 'text-indigo-600',
      metaMuted: 'text-gray-500',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl',
    },
    dark: {
      trustLink: 'text-indigo-400',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-indigo-400 hover:border-indigo-800 rounded-2xl',
    },
  },
};

export function getEventDetailContentTokens(accent: EventDetailMapAccent, darkSurface = false) {
  const surface = getEventDetailSurfaceTokens(accent, darkSurface);
  const base = darkSurface ? ED_CONTENT_BASE.dark : ED_CONTENT_BASE.light;
  const over = darkSurface ? ED_CONTENT_ACCENT[accent].dark : ED_CONTENT_ACCENT[accent].light;
  const content: AccentContentTokens = { ...base, ...over } as AccentContentTokens;
  return { surface, content };
}

/** Right-column groups card — Classic shell on all themes. */
export function getEventDetailGroupsSidebarShell(darkSurface: boolean): string {
  return darkSurface
    ? 'rounded-2xl border border-gray-700 bg-gray-800 p-4 shadow-soft sticky top-24'
    : 'rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sticky top-24';
}

export function getEventDetailGroupsSidebarHeading(darkSurface: boolean): string {
  return darkSurface
    ? APP_TYPO.sectionLabel + ' text-white mb-4'
    : APP_TYPO.sectionLabel + ' text-[#6B7280] mb-4';
}

/* ════════════════════════════════════════════════════════════════
   6. Group-chat accent tones
   ════════════════════════════════════════════════════════════════ */
export interface GroupChatAccentTones {
  focusRing: string;
  focusIcon: string;
  infoActive: string;
  tagBadge: string;
  linkBtn: string;
  shareActive: string;
  shareActiveText: string;
  shareMutedText: string;
  avatarPlaceholder: string;
  panelAccent: string;
  panelSoft: string;
  radioOn: string;
  primaryBtn: string;
  accentText: string;
  selectedRow: string;
}

/** Light-theme group-chat tones per chromatic family (mono falls back to cyan). */
const GC_TONES: Record<ChromaticAccent, GroupChatAccentTones> = {
  cyan: {
    focusRing: 'focus:ring-cyan-500',
    focusIcon: 'group-focus-within:text-cyan-500',
    infoActive: 'text-cyan-600 bg-cyan-50',
    tagBadge: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    linkBtn: 'text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-100',
    shareActive: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    shareActiveText: 'text-cyan-700',
    shareMutedText: 'text-cyan-600/80',
    avatarPlaceholder: 'bg-cyan-50 text-cyan-700',
    panelAccent: 'bg-cyan-50 border-cyan-100 text-cyan-600',
    panelSoft: 'bg-cyan-50 border-[#a5f3fc]/40 text-cyan-700',
    radioOn: 'border-cyan-600 bg-cyan-600',
    primaryBtn: 'bg-cyan-600 text-white hover:bg-cyan-700',
    accentText: 'text-cyan-600',
    selectedRow: 'border-accent bg-cyan-50/30',
  },
  fuchsia: {
    focusRing: 'focus:ring-fuchsia-500',
    focusIcon: 'group-focus-within:text-fuchsia-500',
    infoActive: 'text-fuchsia-600 bg-fuchsia-50',
    tagBadge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    linkBtn: 'text-fuchsia-600 hover:text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-100',
    shareActive: 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100',
    shareActiveText: 'text-fuchsia-700',
    shareMutedText: 'text-fuchsia-600/80',
    avatarPlaceholder: 'bg-fuchsia-50 text-fuchsia-700',
    panelAccent: 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600',
    panelSoft: 'bg-fuchsia-50 border-fuchsia-100/40 text-fuchsia-700',
    radioOn: 'border-fuchsia-600 bg-fuchsia-600',
    primaryBtn: 'bg-fuchsia-600 text-white hover:bg-fuchsia-700',
    accentText: 'text-fuchsia-600',
    selectedRow: 'border-fuchsia-500 bg-fuchsia-50/30',
  },
  indigo: {
    focusRing: 'focus:ring-indigo-500',
    focusIcon: 'group-focus-within:text-indigo-500',
    infoActive: 'text-indigo-600 bg-indigo-50',
    tagBadge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    linkBtn: 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-100',
    shareActive: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
    shareActiveText: 'text-indigo-700',
    shareMutedText: 'text-indigo-600/80',
    avatarPlaceholder: 'bg-indigo-50 text-indigo-700',
    panelAccent: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    panelSoft: 'bg-indigo-50 border-indigo-100/40 text-indigo-700',
    radioOn: 'border-indigo-600 bg-indigo-600',
    primaryBtn: 'bg-indigo-600 text-white hover:bg-indigo-700',
    accentText: 'text-indigo-600',
    selectedRow: 'border-indigo-500 bg-indigo-50/30',
  },
  emerald: {
    focusRing: 'focus:ring-emerald-500',
    focusIcon: 'group-focus-within:text-emerald-500',
    infoActive: 'text-emerald-600 bg-emerald-50',
    tagBadge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    linkBtn: 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100',
    shareActive: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    shareActiveText: 'text-emerald-700',
    shareMutedText: 'text-emerald-600/80',
    avatarPlaceholder: 'bg-emerald-50 text-emerald-700',
    panelAccent: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    panelSoft: 'bg-emerald-50 border-emerald-100/40 text-emerald-700',
    radioOn: 'border-emerald-600 bg-emerald-600',
    primaryBtn: 'bg-emerald-600 text-white hover:bg-emerald-700',
    accentText: 'text-emerald-600',
    selectedRow: 'border-emerald-500 bg-emerald-50/30',
  },
};

export function getGroupChatAccentTones(family: AccentFamily): GroupChatAccentTones {
  return GC_TONES[family === 'mono' ? 'cyan' : family];
}
