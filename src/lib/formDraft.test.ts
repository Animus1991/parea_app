import { beforeEach, describe, expect, it } from 'vitest';
import { stashFormDraft, takeFormDraft } from './formDraft';

describe('formDraft', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stashes and takes an event draft once', () => {
    stashFormDraft('event', { title: 'Yoga', category: 'Wellness', max: 4 });
    const first = takeFormDraft('event');
    expect(first).toMatchObject({ title: 'Yoga', category: 'Wellness', max: 4 });
    expect(takeFormDraft('event')).toBeNull();
  });

  it('ignores empty string fields', () => {
    stashFormDraft('profile', { bio: 'Hello', name: '' });
    expect(takeFormDraft('profile')).toEqual({ bio: 'Hello' });
  });
});
