import { describe, it, expect } from 'vitest';
import { getNextBestActions, computeProfileCompletion } from './behavioralOptimizer';

describe('behavioralOptimizer', () => {
  it('suggests onboarding when incomplete', () => {
    const actions = getNextBestActions({
      user: { id: 'u1' } as never,
      onboardingCompleted: false,
      unreadNotifications: 0,
      unreadChats: 0,
      upcomingPlansCount: 0,
      savedEventsCount: 0,
      profileInterestsCount: 0,
      hasBio: false,
    });
    expect(actions[0]?.id).toBe('finish-onboarding');
  });

  it('computes profile completion percent', () => {
    const result = computeProfileCompletion(
      {
        id: 'u1',
        interests: ['a'],
        trustTier: '1_explorer',
        photoUrl: 'x',
        bio: 'hello',
      } as never,
      true,
    );
    expect(result.percent).toBeGreaterThan(40);
  });
});
