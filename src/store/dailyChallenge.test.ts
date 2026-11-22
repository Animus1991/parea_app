import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from './index';
import { localDay } from '../lib/achievements';
import { useChatStore } from './chatStore';

describe('daily reward claims', () => {
  afterEach(() => vi.useRealTimers());

  it('records the shared local day and permits only one claim per day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 30, 0, 30));
    useStore.getState().enterDemoMode();
    useStore.setState({ dailyChallengeClaimedOn: null });
    const group = useChatStore.getState().conversations.find((c) => c.type === 'event_group')!;
    const send = () => useChatStore.setState({ messages: [{
      id: 'reward-test', conversationId: group.id, senderId: useStore.getState().currentUser!.id,
      senderType: 'user', type: 'text', body: 'Hello', createdAt: new Date().toISOString(),
    }] });
    send();
    expect(useStore.getState().claimDailyChallenge(30)).toBe(true);
    expect(useStore.getState().dailyChallengeClaimedOn).toBe(localDay());
    expect(useStore.getState().claimDailyChallenge(30)).toBe(false);
    vi.setSystemTime(new Date(2026, 2, 31, 0, 1));
    expect(useStore.getState().claimDailyChallenge(30)).toBe(false);
    send();
    expect(useStore.getState().claimDailyChallenge(30)).toBe(true);
  });

  it('refuses ineligible claims without awarding XP', () => {
    useStore.getState().enterDemoMode();
    useStore.setState({ dailyChallengeClaimedOn: null });
    useChatStore.setState({ messages: [] });
    const before = useStore.getState().bonusXp;
    expect(useStore.getState().claimDailyChallenge(30)).toBe(false);
    expect(useStore.getState().dailyChallengeClaimedOn).toBeNull();
    expect(useStore.getState().bonusXp).toBe(before);
  });
});
