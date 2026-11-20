import type { AchievementId } from '../../lib/achievements';

export const NAKAMAS_MINI_IDS = ['explorer', 'crew', 'host', 'trust', 'spark', 'helper'] as const;
export type NakamasMiniId = (typeof NAKAMAS_MINI_IDS)[number];

export const ACHIEVEMENT_MINI: Record<AchievementId, NakamasMiniId> = {
  first_experience: 'explorer',
  social_butterfly: 'crew',
  reliability_star: 'spark',
  weekly_streak: 'spark',
  trusted_member: 'trust',
  explorer: 'explorer',
  trailblazer: 'host',
  connector: 'crew',
};

export const CHALLENGE_MINI: Record<'events' | 'streak' | 'social' | 'explorer', NakamasMiniId> = {
  events: 'explorer',
  streak: 'spark',
  social: 'crew',
  explorer: 'explorer',
};
