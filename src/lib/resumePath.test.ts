import { describe, it, expect } from 'vitest';
import { isResumeWorthyPath, resumeLabel } from './resumePath';

describe('resumePath', () => {
  it('rejects home, login and onboarding', () => {
    expect(isResumeWorthyPath('/')).toBe(false);
    expect(isResumeWorthyPath('/login')).toBe(false);
    expect(isResumeWorthyPath('/onboarding')).toBe(false);
  });

  it('accepts discovery and social routes', () => {
    expect(isResumeWorthyPath('/nearby')).toBe(true);
    expect(isResumeWorthyPath('/buddy-seek')).toBe(true);
    expect(isResumeWorthyPath('/events/e1')).toBe(true);
  });

  it('labels known routes in both languages', () => {
    expect(resumeLabel('/nearby', 'el')).toMatch(/Τοπικ|Ομάδ/i);
    expect(resumeLabel('/nearby', 'en')).toMatch(/Local|Group/i);
  });
});
