/**
 * Literal class-token maps for the themed Home lineage (vibrant/neon/bento × light/dark).
 * Values are literal strings so Tailwind's JIT sees every class. `bento-dark` entries
 * intentionally use indigo — the previous emerald was copy-paste drift from neon (P0.2).
 */

export type HomeThemedVariant = 'vibrant' | 'vibrant-dark' | 'neon' | 'neon-dark' | 'bento' | 'bento-dark';

export interface HomeThemedTokens {
  heroRoot: string;
  heroBadge: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroStats: string;
  heroStatIcon: string;
  heroStatDot: string;
  heroMapBtn: string;
  heroSearchIcon: string;
  heroSearchInput: string;
  heroTrustBtn: string;
  heroOrb1: string;
  heroOrb2?: string;
  stepCard: string;
  stepCircle: string;
  stepTitle: string;
  stepBody: string;
  feedTabWrap: string;
  feedTabActive: string;
  feedTabInactive: string;
  mapBtnWrap: string;
  mapBtn: string;
  spinner: string;
}

export const HOME_THEMED_TOKENS: Record<HomeThemedVariant, HomeThemedTokens> = {
  vibrant: {
    heroRoot: 'bg-gradient-to-br from-[#7c3aed] via-[#db2777] to-[#f97316] text-white shadow-soft-lg',
    heroBadge: 'bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full w-fit',
    heroTitleAccent: 'from-amber-200 to-yellow-100',
    heroSubtitle: 'text-white/90',
    heroStats: 'text-white/90',
    heroStatIcon: 'text-amber-200',
    heroStatDot: 'opacity-30',
    heroMapBtn: 'bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm',
    heroSearchIcon: 'text-white/70',
    heroSearchInput: 'border border-white/20 bg-white/15 text-white placeholder-white/60 focus:ring-amber-300/60 backdrop-blur-sm',
    heroTrustBtn: 'bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20',
    heroOrb1: 'from-yellow-400/20 to-pink-500/20',
    heroOrb2: 'from-violet-600/20 to-transparent',
    stepCard: 'bg-white border-gray-200 hover:shadow-soft-md hover:border-gray-300 transition-all',
    stepCircle: 'bg-gray-100 text-gray-700',
    stepTitle: 'text-ink',
    stepBody: 'text-gray-600',
    feedTabWrap: 'bg-gray-100 border border-gray-200',
    feedTabActive: 'bg-white shadow-soft text-fuchsia-700',
    feedTabInactive: 'text-gray-500 hover:text-gray-900',
    mapBtnWrap: 'bg-gray-100 border border-gray-200',
    mapBtn: 'text-gray-500 hover:text-gray-900',
    spinner: 'border-gray-400',
  },
  'vibrant-dark': {
    heroRoot: 'bg-gradient-to-br from-slate-950 via-[#0f172a] to-slate-950 text-white shadow-soft',
    heroBadge: 'text-fuchsia-300',
    heroTitleAccent: 'from-fuchsia-300 to-orange-300',
    heroSubtitle: 'text-white',
    heroStats: 'text-white',
    heroStatIcon: 'text-fuchsia-300',
    heroStatDot: 'opacity-20',
    heroMapBtn: 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 hover:bg-fuchsia-500/20',
    heroSearchIcon: 'text-white/80',
    heroSearchInput: 'border-none bg-white/10 text-white placeholder-white/80 focus:ring-fuchsia-500/60 backdrop-blur-sm',
    heroTrustBtn: 'bg-gray-800/10 hover:bg-gray-800/20 backdrop-blur-sm text-white',
    heroOrb1: 'from-fuchsia-500/15 to-orange-500/10',
    stepCard: 'bg-gray-800 border-gray-800',
    stepCircle: 'bg-gray-700/50 text-gray-300',
    stepTitle: 'text-white',
    stepBody: 'text-white',
    feedTabWrap: 'bg-gray-700',
    feedTabActive: 'bg-gray-800 shadow-soft text-white',
    feedTabInactive: 'text-white hover:text-white',
    mapBtnWrap: 'bg-gray-700',
    mapBtn: 'text-white hover:text-white',
    spinner: 'border-gray-500',
  },
  neon: {
    heroRoot: 'bg-gradient-to-br from-violet-800 via-fuchsia-800 to-orange-700 text-white shadow-soft',
    heroBadge: 'text-orange-200',
    heroTitleAccent: 'from-orange-300 to-yellow-300',
    heroSubtitle: 'text-white',
    heroStats: 'text-white',
    heroStatIcon: 'text-orange-200',
    heroStatDot: 'opacity-20',
    heroMapBtn: 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/20 hover:bg-emerald-500/20',
    heroSearchIcon: 'text-white/80',
    heroSearchInput: 'border-none bg-white/10 text-white placeholder-white/80 focus:ring-emerald-400/60 backdrop-blur-sm',
    heroTrustBtn: 'bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white',
    heroOrb1: 'from-emerald-500/20 to-teal-500/20',
    stepCard: 'bg-white border-gray-100',
    stepCircle: 'bg-emerald-50 text-emerald-600',
    stepTitle: 'text-ink',
    stepBody: 'text-black',
    feedTabWrap: 'bg-gray-100',
    feedTabActive: 'bg-white shadow-soft text-ink',
    feedTabInactive: 'text-black hover:text-ink',
    mapBtnWrap: 'bg-gray-100',
    mapBtn: 'text-black hover:text-ink',
    spinner: 'border-emerald-500',
  },
  'neon-dark': {
    heroRoot: 'bg-gradient-to-br from-gray-950 via-emerald-950 to-gray-950 text-white shadow-soft',
    heroBadge: 'text-emerald-300',
    heroTitleAccent: 'from-emerald-300 to-teal-300',
    heroSubtitle: 'text-white',
    heroStats: 'text-white',
    heroStatIcon: 'text-emerald-300',
    heroStatDot: 'opacity-20',
    heroMapBtn: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20',
    heroSearchIcon: 'text-white/80',
    heroSearchInput: 'border-none bg-white/10 text-white placeholder-white/80 focus:ring-emerald-400/60 backdrop-blur-sm',
    heroTrustBtn: 'bg-gray-800/10 hover:bg-gray-800/20 backdrop-blur-sm text-white',
    heroOrb1: 'from-emerald-500/15 to-teal-500/10',
    stepCard: 'bg-gray-800 border-gray-800',
    stepCircle: 'bg-emerald-900/30 text-emerald-400',
    stepTitle: 'text-white',
    stepBody: 'text-white',
    feedTabWrap: 'bg-gray-700',
    feedTabActive: 'bg-gray-800 shadow-soft text-white',
    feedTabInactive: 'text-white hover:text-white',
    mapBtnWrap: 'bg-gray-700',
    mapBtn: 'text-white hover:text-white',
    spinner: 'border-emerald-500',
  },
  bento: {
    heroRoot: 'bg-white shadow-soft-lg border border-indigo-100/50 text-black',
    heroBadge: 'text-indigo-500',
    heroTitleAccent: 'from-indigo-600 to-violet-600',
    heroSubtitle: 'text-gray-500',
    heroStats: 'text-gray-400',
    heroStatIcon: 'text-indigo-600',
    heroStatDot: 'opacity-20',
    heroMapBtn: 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100',
    heroSearchIcon: 'text-black',
    heroSearchInput: 'border border-indigo-200 bg-gray-50 text-black placeholder-gray-400 focus:ring-indigo-400',
    heroTrustBtn: 'bg-gray-100 hover:bg-gray-200 border border-gray-200 text-black',
    heroOrb1: 'from-indigo-500/10 to-violet-500/15',
    stepCard: 'bg-white border-gray-100',
    stepCircle: 'bg-indigo-50 text-indigo-600',
    stepTitle: 'text-ink',
    stepBody: 'text-black',
    feedTabWrap: 'bg-gray-100',
    feedTabActive: 'bg-white shadow-soft text-ink',
    feedTabInactive: 'text-black hover:text-ink',
    mapBtnWrap: 'bg-gray-100',
    mapBtn: 'text-black hover:text-ink',
    spinner: 'border-indigo-500',
  },
  'bento-dark': {
    heroRoot: 'bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-gray-700 text-white shadow-soft',
    heroBadge: 'text-indigo-400',
    heroTitleAccent: 'from-indigo-400 to-violet-400',
    heroSubtitle: 'text-white',
    heroStats: 'text-white',
    heroStatIcon: 'text-indigo-400',
    heroStatDot: 'opacity-20',
    heroMapBtn: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20',
    heroSearchIcon: 'text-white',
    heroSearchInput: 'border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-500/60',
    heroTrustBtn: 'bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white',
    heroOrb1: 'from-indigo-500/15 to-violet-500/10',
    stepCard: 'bg-gray-800 border-gray-800',
    stepCircle: 'bg-indigo-900/30 text-indigo-400',
    stepTitle: 'text-white',
    stepBody: 'text-white',
    feedTabWrap: 'bg-gray-800 border border-gray-700',
    feedTabActive: 'bg-gray-800 border-gray-700 text-white shadow-soft',
    feedTabInactive: 'text-white hover:text-white',
    mapBtnWrap: 'bg-gray-800 border border-gray-700',
    mapBtn: 'text-white hover:text-white',
    spinner: 'border-indigo-500',
  },
};
