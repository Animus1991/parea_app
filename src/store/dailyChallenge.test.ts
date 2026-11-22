import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStore } from './index';
import { localDay } from '../lib/achievements';

describe('daily reward claims', () => {
  afterEach(() => vi.useRealTimers());

  it('records the shared local day and permits only one claim per day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 30, 0, 30));
    useStore.getState().enterDemoMode();
    useStore.setState({ dailyChallengeClaimedOn: null });
    expect(useStore.getState().claimDailyChallenge(30)).toBe(true);
    expect(useStore.getState().dailyChallengeClaimedOn).toBe(localDay());
    expect(useStore.getState().claimDailyChallenge(30)).toBe(false);
    vi.setSystemTime(new Date(2026, 2, 31, 0, 1));
    expect(useStore.getState().claimDailyChallenge(30)).toBe(true);
  });
});
