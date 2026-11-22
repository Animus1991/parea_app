import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('bounded idle prefetch', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('waits for each two-route batch before scheduling the next', async () => {
    const { routeLoaders, prefetchWhenIdle } = await import('./routeLoaders');
    const resolve: Array<() => void> = [];
    const home = vi.spyOn(routeLoaders, 'home').mockImplementation(() => new Promise((done) => resolve.push(() => done({} as never))));
    const plans = vi.spyOn(routeLoaders, 'plans').mockImplementation(() => new Promise((done) => resolve.push(() => done({} as never))));
    const categories = vi.spyOn(routeLoaders, 'categories').mockResolvedValue({} as never);
    prefetchWhenIdle(['/', '/plans', '/categories']);
    expect(home).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    expect(home).toHaveBeenCalledOnce();
    expect(plans).toHaveBeenCalledOnce();
    expect(categories).not.toHaveBeenCalled();
    resolve[0]();
    await vi.advanceTimersByTimeAsync(500);
    expect(categories).not.toHaveBeenCalled();
    resolve[1]();
    await vi.advanceTimersByTimeAsync(250);
    expect(categories).toHaveBeenCalledOnce();
  });

  it('uses separate idle opportunities and cancels scheduled work', async () => {
    const callbacks: Array<() => void> = [];
    const idle = vi.fn((callback: () => void) => { callbacks.push(callback); return callbacks.length; });
    vi.stubGlobal('requestIdleCallback', idle);
    const { routeLoaders, prefetchWhenIdle } = await import('./routeLoaders');
    const home = vi.spyOn(routeLoaders, 'home').mockResolvedValue({} as never);
    const cancel = prefetchWhenIdle(['/']);
    expect(idle).toHaveBeenCalledOnce();
    expect(home).not.toHaveBeenCalled();
    cancel();
    expect(window.cancelIdleCallback).toHaveBeenCalledWith(1);
    callbacks[0]();
    expect(home).not.toHaveBeenCalled();
  });

  it('does not start another batch after cancellation in flight', async () => {
    const { routeLoaders, prefetchWhenIdle } = await import('./routeLoaders');
    let resolve!: () => void;
    vi.spyOn(routeLoaders, 'home').mockImplementation(() => new Promise((done) => { resolve = () => done({} as never); }));
    const plans = vi.spyOn(routeLoaders, 'plans').mockResolvedValue({} as never);
    const cancel = prefetchWhenIdle(['/', '/', '/plans']);
    await vi.advanceTimersByTimeAsync(1500);
    cancel();
    resolve();
    await vi.advanceTimersByTimeAsync(2000);
    expect(plans).not.toHaveBeenCalled();
  });

  it('deduplicates successful loads and retries failed loads', async () => {
    const { routeLoaders, prefetchPath } = await import('./routeLoaders');
    const home = vi.spyOn(routeLoaders, 'home').mockRejectedValueOnce(new Error('offline')).mockResolvedValue({} as never);
    await prefetchPath('/');
    await prefetchPath('/');
    await prefetchPath('/');
    expect(home).toHaveBeenCalledTimes(2);
    await expect(prefetchPath('/unknown')).resolves.toBeUndefined();
  });

  it.each([{ saveData: true }, { effectiveType: '2g' }, { effectiveType: 'slow-2g' }])('retains slow-link exemption: %j', async (connection) => {
    vi.stubGlobal('navigator', { connection });
    const { routeLoaders, prefetchWhenIdle } = await import('./routeLoaders');
    const home = vi.spyOn(routeLoaders, 'home').mockResolvedValue({} as never);
    prefetchWhenIdle(['/']);
    await vi.runAllTimersAsync();
    expect(home).not.toHaveBeenCalled();
  });

  it('does not schedule an empty queue', async () => {
    const { prefetchWhenIdle } = await import('./routeLoaders');
    prefetchWhenIdle([]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
