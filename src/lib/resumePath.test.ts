import { describe, it, expect } from 'vitest';
import { isResumeWorthyPath, resumeLabel } from './resumePath';

describe('resumePath', () => {
  it('rejects home, login and onboarding', () => {
    expect(isResumeWorthyPath('/')).toBe(false);
    expect(isResumeWorthyPath('/login')).toBe(false);
    expect(isResumeWorthyPath('/onboarding')).toBe(false);
  });

  it('rejects catalog pages that are already one tap from Discover', () => {
    expect(isResumeWorthyPath('/tags')).toBe(false);
    expect(isResumeWorthyPath('/tags/nakamas-nights')).toBe(false);
    expect(isResumeWorthyPath('/categories')).toBe(false);
    expect(isResumeWorthyPath('/collections')).toBe(false);
    expect(isResumeWorthyPath('/nearby')).toBe(false);
    expect(isResumeWorthyPath('/saved')).toBe(false);
    expect(isResumeWorthyPath('/buddy-seek')).toBe(false);
    expect(isResumeWorthyPath('/chats')).toBe(false);
  });

  it('accepts unfinished work: an event, join/create, a chat, tonight, a review', () => {
    expect(isResumeWorthyPath('/events/e1')).toBe(true);
    expect(isResumeWorthyPath('/events/e1/join')).toBe(true);
    expect(isResumeWorthyPath('/create')).toBe(true);
    expect(isResumeWorthyPath('/chat/g-nn1')).toBe(true);
    expect(isResumeWorthyPath('/night/g-nn1')).toBe(true);
    expect(isResumeWorthyPath('/history/feedback/e1')).toBe(true);
  });

  it('labels known routes in both languages', () => {
    expect(resumeLabel('/events/e1', 'el')).toMatch(/Εκδήλωση/i);
    expect(resumeLabel('/events/e1', 'en')).toMatch(/Event/i);
  });
});
