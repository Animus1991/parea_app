import { describe, expect, it } from 'vitest';
import { isNotificationsPath, locationKey, notificationsCloseAction } from './notificationsToggle';

describe('notificationsCloseAction', () => {
  it('goes back when the bell opened the screen', () => {
    expect(notificationsCloseAction({ notificationsToggle: true, from: '/wall' })).toEqual({ type: 'back' });
  });

  it('restores a saved path when opened without the toggle flag', () => {
    expect(notificationsCloseAction({ from: '/plans?tab=upcoming' })).toEqual({
      type: 'to',
      path: '/plans?tab=upcoming',
    });
  });

  it('falls back to home when there is nowhere to return', () => {
    expect(notificationsCloseAction(null)).toEqual({ type: 'to', path: '/' });
    expect(notificationsCloseAction({ from: '/notifications' })).toEqual({ type: 'to', path: '/' });
  });
});

describe('isNotificationsPath', () => {
  it('matches the notifications screen only', () => {
    expect(isNotificationsPath('/notifications')).toBe(true);
    expect(isNotificationsPath('/wall')).toBe(false);
  });
});

describe('locationKey', () => {
  it('keeps search and hash so the same page comes back intact', () => {
    expect(locationKey({ pathname: '/wall', search: '?post=wp1', hash: '#top' })).toBe('/wall?post=wp1#top');
  });
});
