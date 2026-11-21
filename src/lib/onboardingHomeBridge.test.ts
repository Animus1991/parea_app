import { describe, expect, it } from 'vitest';
import { buildPostOnboardingHomePath } from './onboardingHomeBridge';

describe('buildPostOnboardingHomePath', () => {
  it('does not lock Discover to the first interest as a category chip', () => {
    const path = buildPostOnboardingHomePath({
      interests: ['Theatre', 'Cinema'],
      locationPref: 'city',
    });
    const params = new URLSearchParams(path.slice(path.indexOf('?') + 1));
    expect(params.get('welcome')).toBe('1');
    expect(params.get('cat')).toBeNull();
  });

  it('keeps a near-me radius when onboarding asked for local', () => {
    const path = buildPostOnboardingHomePath({
      interests: ['Theatre'],
      locationPref: 'local',
    });
    const params = new URLSearchParams(path.slice(path.indexOf('?') + 1));
    expect(params.get('dist')).toBe('10km');
    expect(params.get('cat')).toBeNull();
  });
});
