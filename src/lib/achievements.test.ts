import { describe, expect, it } from 'vitest';
import { computeAchievements, dailyChallengeMet, groupMessageDates, weeklyActivity } from './achievements';
import type { Event, Group, User } from '../types';
import { ACHIEVEMENT_MINI, NAKAMAS_MINI_IDS } from '../components/illustrations/miniMaps';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const user = {
  id: 'u1', name: 'A', ageRange: '25-34', city: 'Athens', interests: [], trustTier: '2_confirmed', reliabilityScore: 96,
  badges: [], emailVerified: true, phoneVerified: true, paymentVerified: false, idVerified: false, isOrganizer: false, connections: ['u2'],
} as User;
const ev = (id: string, date: string, category: string) => ({ id, date, category, title: id } as Event);
const grp = (id: string, eventId: string, members: string[], hostId?: string, targetSize = 4) =>
  ({ id, eventId, members, hostId, targetSize, status: 'pending', pendingMembers: [], discountUnlocked: false } as Group);

describe('live achievements', () => {
  it('uses the local day across midnight and a DST timezone boundary', () => {
    const moduleUrl = pathToFileURL(`${process.cwd()}/src/lib/achievements.ts`).href;
    const result = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
      import { localDay, dailyChallengeMet } from ${JSON.stringify(moduleUrl)};
      const now = new Date('2026-03-29T22:30:00Z');
      console.log(JSON.stringify({
        today: localDay(now),
        claimDay: localDay('2026-03-30'),
        met: dailyChallengeMet(['2026-03-29T22:15:00Z'], now),
        yesterday: dailyChallengeMet(['2026-03-29T20:30:00Z'], now),
      }));
    `], { env: { ...process.env, TZ: 'Europe/Athens' }, encoding: 'utf8' });
    expect(JSON.parse(result)).toEqual({ today: '2026-03-30', claimDay: '2026-03-30', met: true, yesterday: false });
  });
  it('derives progress from real memberships, categories, weeks and verifications', () => {
    const events = [ev('a', '2026-06-01', 'Hiking'), ev('b', '2026-06-08', 'Cinema'), ev('c', '2026-06-15', 'Cinema')];
    const groups = [grp('g1', 'a', ['u1']), grp('g2', 'b', ['u1']), grp('g3', 'c', ['u1', 'x', 'y', 'z'], 'u1')];
    const list = computeAchievements({ user, events, groups, feedbackEventIds: [] });
    const by = Object.fromEntries(list.map((a) => [a.id, a]));
    expect(by.first_experience.unlocked).toBe(true);
    expect(by.social_butterfly.progress).toBe(3);
    expect(by.reliability_star.unlocked).toBe(true);
    expect(by.weekly_streak.progress).toBe(3);
    expect(by.trusted_member.progress).toBe(2);
    expect(by.explorer.progress).toBe(2);
    expect(by.trailblazer.unlocked).toBe(true);
    expect(by.connector.progress).toBe(1);
    for (const a of list) {
      expect(NAKAMAS_MINI_IDS).toContain(ACHIEVEMENT_MINI[a.id]);
    }
  });

  it('computes the current week and day streak', () => {
    const now = new Date('2026-11-13T12:00:00'); // Friday
    const { days, streak } = weeklyActivity(['2026-11-11', '2026-11-12', '2026-11-13'], now);
    expect(days).toEqual([false, false, true, true, true, false, false]);
    expect(streak).toBe(3);
  });

  it('requires a real message today for the daily challenge', () => {
    const now = new Date('2026-11-13T12:00:00');
    expect(dailyChallengeMet(['2026-11-12T10:00:00'], now)).toBe(false);
    expect(dailyChallengeMet(['2026-11-13T09:30:00'], now)).toBe(true);
  });

  it('counts only the current user’s messages in shared group conversations', () => {
    const conversations = [
      { id: 'g', type: 'event_group' as const }, { id: 'gg', type: 'group_to_group' as const },
      { id: 'dm', type: 'direct' as const }, { id: 'support', type: 'support' as const },
      { id: 'announcement', type: 'organizer_announcement' as const },
    ];
    const message = (conversationId: string, senderId = 'u1', senderType: 'user' | 'system' = 'user') =>
      ({ conversationId, senderId, senderType, createdAt: '2026-11-13T09:30:00' });
    expect(groupMessageDates([message('g'), message('gg')], conversations, 'u1')).toHaveLength(2);
    expect(groupMessageDates([
      message('dm'), message('support'), message('announcement'), message('missing'),
      message('g', 'u2'), message('g', 'u1', 'system'),
    ], conversations, 'u1')).toEqual([]);
    expect(groupMessageDates([], conversations, 'u1')).toEqual([]);
    expect(groupMessageDates([message('g')], conversations, undefined)).toEqual([]);
  });
});
