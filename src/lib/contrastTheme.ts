import type { ThemeId } from './themes';
import { isDarkTheme, isActiveBuddiesTheme } from './themes';

/** Semantic contrast classes for page-level UI (WCAG AA–oriented). */
export interface HomeContrastTheme {
  /** Hero block */
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
  /** Surfaces */
  card: string;
  cardBorder: string;
  sectionLabel: string;
  heading: string;
  body: string;
  bodyMuted: string;
  labelMuted: string;
  /** Chips & filters */
  chipActive: string;
  chipInactive: string;
  tagActive: string;
  tagInactive: string;
  select: string;
  filterBtn: string;
  filterBadge: string;
  /** How-it-works */
  stepBadge: string;
  stepTitle: string;
  stepBody: string;
  /** Banners */
  tipBanner: string;
  tipLabel: string;
  tipBody: string;
  feedbackBanner: string;
  feedbackTitle: string;
  feedbackBody: string;
  feedbackBtn: string;
  /** Stats */
  statIconBg: { streak: string; month: string; level: string };
  statIconColor: { streak: string; month: string; level: string };
  statValue: string;
  statUnit: string;
  /** Feed */
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
  chipInactive: 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:text-gray-900',
  select:
    'text-gray-800 border border-gray-200 rounded-2xl shadow-soft bg-white hover:bg-gray-50 py-1.5 px-4 font-medium',
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
    'text-gray-100 border border-gray-600/50 rounded-2xl bg-gray-800/50 hover:bg-gray-700/50 py-1.5 px-4 font-medium',
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
    hero: 'bg-gray-900 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-cyan-400 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300',
    heroSubtitle: 'text-gray-300 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-cyan-400',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-white/10 bg-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400/60',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-gray-200 z-50',
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
    hero: 'bg-gradient-to-br from-fuchsia-900 via-fuchsia-800 to-orange-900 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-fuchsia-200 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-fuchsia-100/90 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-orange-200',
    heroSubtitle: 'text-fuchsia-100 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-fuchsia-100',
    heroStatIcon: 'text-fuchsia-200',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-white/15 bg-white/10 text-white placeholder-fuchsia-200/70 focus:ring-2 focus:ring-fuchsia-300/50',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-fuchsia-100 z-50',
    heroSearchDropdownLabel: 'text-gray-600',
    heroSearchItem: 'text-gray-800',
    heroSearchItemHover: 'hover:bg-fuchsia-50 hover:text-fuchsia-900',
    heroOutlineBtn: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 h-11 rounded-2xl',
    heroDecor: 'from-fuchsia-400/30 to-orange-400/20',
    chipActive: 'bg-fuchsia-700 text-white',
    tagActive: 'bg-fuchsia-100 border-fuchsia-600 text-fuchsia-900',
    tagInactive: 'bg-white border-gray-200 text-gray-700 hover:border-fuchsia-300 hover:text-fuchsia-800',
    filterBadge: 'bg-fuchsia-600 text-white',
    stepBadge: 'bg-fuchsia-100 text-fuchsia-900',
    tipBanner: 'bg-white border border-fuchsia-100 shadow-soft',
    tipLabel: 'text-fuchsia-800',
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
    hero: 'bg-gradient-to-br from-indigo-900 to-violet-900 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-indigo-200 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-indigo-100/90 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-violet-200',
    heroSubtitle: 'text-indigo-100 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-indigo-100',
    heroStatIcon: 'text-indigo-200',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-white/15 bg-white/10 text-white placeholder-indigo-200/70 focus:ring-2 focus:ring-indigo-300/50',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-indigo-100 z-50',
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
    hero: 'bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden',
    heroGreeting: 'text-emerald-200 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-emerald-100/90 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200',
    heroSubtitle: 'text-emerald-100 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-emerald-100',
    heroStatIcon: 'text-emerald-200',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-white/15 bg-white/10 text-white placeholder-emerald-200/70 focus:ring-2 focus:ring-emerald-300/50',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-emerald-100 z-50',
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
    hero: 'bg-gradient-to-br from-[#1a1020] to-fuchsia-950 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden border border-fuchsia-800/40',
    heroGreeting: 'text-fuchsia-300 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-orange-300',
    heroSubtitle: 'text-gray-300 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-fuchsia-400',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-fuchsia-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-50',
    heroSearchDropdownLabel: 'text-gray-400',
    heroSearchItem: 'text-gray-100',
    heroSearchItemHover: 'hover:bg-fuchsia-900/40 hover:text-fuchsia-200',
    heroOutlineBtn: 'bg-gray-800/50 hover:bg-gray-700/50 text-white border border-gray-600 px-5 h-11 rounded-2xl',
    heroDecor: 'from-fuchsia-500/20 to-orange-500/15',
    chipActive: 'bg-fuchsia-600 text-white',
    tagActive: 'bg-fuchsia-900/50 border-fuchsia-500 text-fuchsia-200',
    tagInactive: 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-fuchsia-600 hover:text-fuchsia-200',
    filterBadge: 'bg-fuchsia-500 text-white',
    stepBadge: 'bg-fuchsia-900/50 text-fuchsia-300',
    tipBanner: 'bg-gray-800/70 border border-gray-600/50 shadow-soft',
    tipLabel: 'text-fuchsia-300',
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
    hero: 'bg-gradient-to-br from-[#131318] to-indigo-950 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden border border-indigo-800/40',
    heroGreeting: 'text-indigo-300 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-violet-300',
    heroSubtitle: 'text-gray-300 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-indigo-400',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-50',
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
    hero: 'bg-gradient-to-br from-[#101e17] to-emerald-950 text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden border border-emerald-800/40',
    heroGreeting: 'text-emerald-300 text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-gray-300 text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300',
    heroSubtitle: 'text-gray-300 font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-gray-200',
    heroStatIcon: 'text-emerald-400',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-2xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50',
    heroSearchDropdown: 'bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-600 z-50',
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

  activebuddies: {
    ...lightBase,
    hero: 'bg-[hsl(220_14%_12%)] text-white p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden border border-[hsl(220_13%_18%)]',
    heroGreeting: 'text-[hsl(0_0%_88%)] text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-[hsl(220_10%_75%)] text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-white to-[hsl(220_10%_75%)]',
    heroSubtitle:
      'text-[hsl(220_10%_80%)] font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-[hsl(220_10%_78%)]',
    heroStatIcon: 'text-white',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-full border border-[hsl(220_13%_30%)] bg-white/10 text-white placeholder-[hsl(220_10%_65%)] focus:ring-2 focus:ring-white/40 focus:bg-white/15',
    heroSearchDropdown: 'bg-white rounded-2xl shadow-soft-lg border border-[hsl(220_13%_88%)] z-50',
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
    hero: 'bg-[hsl(220_16%_11%)] text-[hsl(210_20%_92%)] p-6 md:p-10 rounded-3xl shadow-soft-lg relative overflow-hidden border border-[hsl(220_13%_22%)]',
    heroGreeting: 'text-[hsl(0_0%_90%)] text-[22px] md:text-[26px] font-extrabold tracking-tight mb-1.5',
    heroMotivation: 'text-[hsl(220_12%_70%)] text-[15px] md:text-[16px] font-medium mb-4',
    heroTitle: 'text-white text-[16px] md:text-[18px] font-bold tracking-tight mb-3 leading-snug',
    heroTitleAccent: 'text-transparent bg-clip-text bg-gradient-to-r from-white to-[hsl(220_12%_75%)]',
    heroSubtitle:
      'text-[hsl(220_12%_78%)] font-medium text-[13.5px] md:text-[14.5px] leading-relaxed max-w-xl mb-6',
    heroStat: 'text-[hsl(220_12%_80%)]',
    heroStatIcon: 'text-[hsl(0_0%_95%)]',
    heroSearchInput:
      'w-full h-11 pl-10 pr-4 rounded-full border border-[hsl(220_13%_28%)] bg-[hsl(220_16%_16%)] text-white placeholder-[hsl(220_12%_55%)] focus:ring-2 focus:ring-white/30',
    heroSearchDropdown: 'bg-[hsl(220_16%_14%)] rounded-2xl shadow-soft-lg border border-[hsl(220_13%_22%)] z-50',
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
  /** Text on inverted/light panels inside dark UI */
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
