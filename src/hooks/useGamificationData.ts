import { useMemo } from 'react';
import { useStore } from '../store';
import { useChatStore } from '../store/chatStore';
import { computeUserXp, levelForXp } from '../lib/gamification';
import { computeAchievements, dailyChallengeMet, groupMessageDates, localDay, weeklyActivity } from '../lib/achievements';

/** Single source of truth for every gamification number shown in the hub. */
export function useGamificationData() {
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const bonusXp = useStore((s) => s.bonusXp);
  const claimedOn = useStore((s) => s.dailyChallengeClaimedOn);
  const messages = useChatStore((s) => s.messages);
  const conversations = useChatStore((s) => s.conversations);

  return useMemo(() => {
    const feedbackCount = Object.keys(feedbackSubmitted).length;
    const xp = currentUser ? computeUserXp(currentUser, true, feedbackCount, bonusXp) : 0;
    const level = levelForXp(xp);
    const achievements = currentUser
      ? computeAchievements({ user: currentUser, events, groups, feedbackEventIds: Object.keys(feedbackSubmitted) })
      : [];
    const myMessageDates = currentUser ? messages.filter((m) => m.senderId === currentUser.id).map((m) => m.createdAt) : [];
    const activity = [
      ...myMessageDates,
      ...Object.values(feedbackSubmitted).map((f) => f.submittedAt),
      ...(claimedOn ? [claimedOn] : []),
    ];
    const weekly = weeklyActivity(activity);
    // Same all-time formula as the Leaderboard page, so ranks agree everywhere.
    const ranking = users
      .map((u) => ({
        id: u.id,
        xp: u.id === currentUser?.id ? xp : computeUserXp(u, false, Math.floor((u.reliabilityScore ?? 50) / 10)),
      }))
      .sort((a, b) => b.xp - a.xp);
    const rank = Math.max(1, ranking.findIndex((r) => r.id === currentUser?.id) + 1);
    const today = localDay();
    return {
      xp,
      level,
      levelProgress: ((xp % 200) / 200) * 100,
      achievements,
      unlocked: achievements.filter((a) => a.unlocked).length,
      weekly,
      rank,
      totalUsers: ranking.length,
      dailyMet: dailyChallengeMet(groupMessageDates(messages, conversations, currentUser?.id)),
      dailyClaimed: claimedOn === today,
    };
  }, [currentUser, users, events, groups, feedbackSubmitted, bonusXp, claimedOn, messages, conversations]);
}
