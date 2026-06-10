/**
 * Home hero density type scale — use instead of arbitrary text-[N.Npx].
 */
export const HOME_TYPO = {
  heroBadge: 'text-sm font-bold tracking-wide',
  heroTitle: 'text-lg md:text-2xl font-bold tracking-tight leading-tight',
  heroSubtitle: 'text-sm md:text-base font-medium leading-relaxed',
  heroStats: 'text-xs font-bold tracking-wide',
  heroMapBtn: 'text-sm font-bold',
  stepTitle: 'text-sm font-bold',
  stepBody: 'text-xs leading-relaxed font-medium',
  feedTab: 'text-xs font-bold',
} as const;

export { APP_TYPO, EVENT_CARD_TYPO } from './typographyTokens';
