import { describe, expect, it } from 'vitest';
import { mergeNotificationLists, notificationsForUser } from './notificationsUtil';
import type { AppNotification } from '../data/mockNotifications';

const base = (partial: Partial<AppNotification> & Pick<AppNotification, 'id'>): AppNotification => ({
  type: 'system',
  messageEn: '',
  messageGr: '',
  timeEn: '',
  timeGr: '',
  read: false,
  ...partial,
});

describe('mergeNotificationLists', () => {
  it('keeps store-only Φ27 rows and lets store win on shared ids', () => {
    const api = [base({ id: 'a1', type: 'match', read: false }), base({ id: 'a2', type: 'system', read: true })];
    const store = [
      base({ id: 'a1', type: 'match', read: true, groupId: 'g1' }),
      base({ id: 'z9', type: 'group', groupId: 'g9', messageEn: 'ready' }),
    ];
    const merged = mergeNotificationLists(api, store);
    expect(merged.map((n) => n.id)).toEqual(['a1', 'z9', 'a2']);
    expect(merged[0].read).toBe(true);
    expect(merged[0].groupId).toBe('g1');
    expect(merged[1].type).toBe('group');
  });
});

describe('notificationsForUser', () => {
  it('hides targeted rows from other users', () => {
    const list = [
      base({ id: '1' }),
      base({ id: '2', forUserId: 'u2' }),
      base({ id: '3', forUserId: 'u1' }),
    ];
    expect(notificationsForUser(list, 'u1').map((n) => n.id)).toEqual(['1', '3']);
  });
});
