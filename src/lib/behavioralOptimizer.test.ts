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

  it('reaches 100% for a member without ID — ID is asked of hosts only', () => {
    const member = { id: 'u1', interests: ['a', 'b', 'c'], trustTier: '2_confirmed', photoUrl: 'x', bio: 'hi', idVerified: false } as never;
    expect(computeProfileCompletion(member, true).percent).toBe(100);
    const host = { ...(member as object), isOrganizer: true } as never;
    const h = computeProfileCompletion(host, true);
    expect(h.percent).toBe(90);
    expect(h.nextPath).toBe('/verification?method=id');
    expect(computeProfileCompletion({ ...(host as object), idVerified: true } as never, true).percent).toBe(100);
  });
});
