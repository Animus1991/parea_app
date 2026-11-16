import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../store';
import { useWallStore } from '../store/wallStore';
import { mockWallPosts } from '../data/mockWall';
import { getAction } from './actions';
import { planLocal, type LocalEngineContext } from './localEngine';
import type { ActionRuntime } from './types';

const ctx: LocalEngineContext = { isAdmin: false, areas: [], userNames: [], lastEventIds: [], now: new Date('2026-11-13T10:00:00') };
const rt: ActionRuntime = { navigate: () => {}, pathname: '/wall', lang: 'el', lastEventIds: [] };

describe('wall in the copilot', () => {
  beforeEach(() => {
    useStore.getState().login('u1');
    useWallStore.setState({ posts: mockWallPosts.map((p) => ({ ...p })) });
  });

  it('understands «δημοσίευσε στον τοίχο μου» with an audience', () => {
    const call = planLocal('Δημοσίευσε στον τοίχο μου μόνο για τους φίλους μου «Πάμε σινεμά απόψε;»', ctx).calls[0];
    expect(call.name).toBe('post_to_wall');
    expect(call.args).toMatchObject({ text: 'Πάμε σινεμά απόψε;', audience: 'connections' });
    const pub = planLocal('post on my wall publicly "Who is up for a hike?"', ctx).calls[0];
    expect(pub).toMatchObject({ name: 'post_to_wall', args: { audience: 'public' } });
  });

  it('keeps «δημοσίευσε εκδήλωση …» with event creation', () => {
    const call = planLocal('δημοσίευσε εκδήλωση «Βραδιά σινεμά» αύριο 20:00', ctx).calls[0];
    expect(['create_event', 'draft_event']).toContain(call.name);
  });

  it('opens the wall when there is nothing to post', () => {
    expect(planLocal('άνοιξε τον τοίχο', ctx).calls[0]).toMatchObject({ name: 'navigate', args: { page: 'wall' } });
  });

  it('posts with confirmation-tier risk and undoes cleanly', async () => {
    const action = getAction('post_to_wall')!;
    expect(action.risk).toBe('confirm');
    const before = useWallStore.getState().posts.length;
    const res = await action.run({ text: 'Καλημέρα Nakamas', audience: 'only_me' }, rt);
    expect(res.ok).toBe(true);
    const created = useWallStore.getState().posts[0];
    expect(created.audience).toEqual({ base: 'only_me' });
    res.undo?.();
    expect(useWallStore.getState().posts.length).toBe(before);
  });

  it('limits past posts and restores them on undo', async () => {
    await getAction('post_to_wall')!.run({ text: 'Public plan', audience: 'public' }, rt);
    const res = await getAction('limit_past_posts')!.run({}, rt);
    expect(res.ok).toBe(true);
    expect(useWallStore.getState().posts[0].audience.base).toBe('connections');
    res.undo?.();
    expect(useWallStore.getState().posts[0].audience.base).toBe('public');
  });
});
