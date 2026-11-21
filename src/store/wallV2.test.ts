import { beforeEach, describe, expect, it } from 'vitest';
import { useStore, DEFAULT_USER_SETTINGS } from './index';
import { useWallStore, wallAccessContext, wallSeedState } from './wallStore';
import { mockUsers } from '../data/mockUsers';
import { canViewPost, pendingTagReviews, profileWallPosts, visiblePosts } from '../lib/audience';

const seedRequests = useStore.getState().connectionRequests;

function reset(userId = 'u1') {
  useStore.setState({
    users: mockUsers.map((u) => ({ ...u, connections: [...(u.connections ?? [])] })),
    blockedUserIds: [],
    suspendedUserIds: [],
    issueReports: [],
    adminActions: [],
    connectionRequests: seedRequests.map((r) => ({ ...r })),
    userSettings: { ...DEFAULT_USER_SETTINGS, privacy: { ...DEFAULT_USER_SETTINGS.privacy } },
  });
  useStore.getState().login(userId);
  useWallStore.setState(wallSeedState());
}

const post = (id: string) => useWallStore.getState().posts.find((p) => p.id === id)!;
const myActivity = (uid: string) => useWallStore.getState().activity.filter((a) => a.recipientId === uid);

describe('tags & tag review', () => {
  beforeEach(() => reset());

  it('a tagged post waits for review before it shows on the profile', () => {
    const ctx = wallAccessContext();
    expect(pendingTagReviews('u1', useWallStore.getState().posts, ctx).map((p) => p.id)).toEqual(['wp10']);
    expect(profileWallPosts('u2', 'u1', useWallStore.getState().posts, ctx).map((p) => p.id)).not.toContain('wp10');
    expect(useWallStore.getState().approveTag('wp10').ok).toBe(true);
    const after = wallAccessContext();
    expect(pendingTagReviews('u1', useWallStore.getState().posts, after)).toEqual([]);
    expect(profileWallPosts('u2', 'u1', useWallStore.getState().posts, after).map((p) => p.id)).toContain('wp10');
  });

  it('without tag review, tags show right away', () => {
    useWallStore.getState().updateWallPrivacy({ reviewTags: false });
    const ctx = wallAccessContext();
    expect(profileWallPosts('u3', 'u1', useWallStore.getState().posts, ctx).map((p) => p.id)).toContain('wp10');
  });

  it('removing my tag takes the post off my profile and clears the notification', () => {
    useWallStore.getState().approveTag('wp10');
    useWallStore.getState().removeMyTag('wp10');
    expect(post('wp10').taggedIds).toEqual([]);
    expect(myActivity('u1').some((a) => a.kind === 'tag' && a.postId === 'wp10')).toBe(false);
  });

  it('only connections can be tagged, and tagged people always see the post', () => {
    const res = useWallStore.getState().createPost({ text: 'Με παρέα!', audience: { base: 'only_me' }, taggedIds: ['u2', 'org3', 'u2'] });
    const created = post(res.id!);
    expect(created.taggedIds).toEqual(['u2']);
    const ctx = wallAccessContext();
    expect(canViewPost('u2', created, ctx)).toBe(true);
    expect(canViewPost('u3', created, ctx)).toBe(false);
    expect(myActivity('u2').some((a) => a.kind === 'tag' && a.postId === created.id)).toBe(true);
  });
});

describe('activity', () => {
  beforeEach(() => reset());

  it('notifies the author of comments and reactions, and the wall owner of posts on their wall', () => {
    useWallStore.getState().addComment('wp1', 'Έρχομαι!');
    useWallStore.getState().react('wp1', 'love');
    useWallStore.getState().createPost({ wallOwnerId: 'u2', text: 'Καλή βδομάδα!' });
    const kinds = myActivity('u2').map((a) => a.kind);
    expect(kinds).toEqual(expect.arrayContaining(['comment', 'reaction', 'wall_post']));
  });

  it('accepts the wider emoji set and rejects unknown kinds', () => {
    expect(useWallStore.getState().react('wp1', 'going').ok).toBe(true);
    expect(post('wp1').reactions.u1).toBe('going');
    expect(useWallStore.getState().react('wp1', 'fire').ok).toBe(true);
    expect(post('wp1').reactions.u1).toBe('fire');
    expect(useWallStore.getState().react('wp1', 'angry' as 'like').ok).toBe(false);
  });

  it('changing a reaction keeps one notification; taking it back removes it', () => {
    useWallStore.getState().react('wp1', 'like');
    useWallStore.getState().react('wp1', 'love');
    const reactions = () => myActivity('u2').filter((a) => a.kind === 'reaction' && a.postId === 'wp1' && a.actorId === 'u1');
    expect(reactions()).toHaveLength(1);
    expect(reactions()[0].reaction).toBe('love');
    useWallStore.getState().react('wp1', null);
    expect(reactions()).toHaveLength(0);
  });

  it('accepts a GIF-only comment, a reply, an edit and a comment reaction', () => {
    expect(useWallStore.getState().addComment('wp1', '').ok).toBe(false);
    expect(useWallStore.getState().addComment('wp1', '', { gifUrl: 'https://example.com/g.gif' }).ok).toBe(true);
    const gif = post('wp1').comments.at(-1)!;
    expect(gif.text).toBe('');
    expect(gif.gifUrl).toBe('https://example.com/g.gif');
    const reply = useWallStore.getState().addComment('wp1', 'Κι εγώ! 🙌', { parentId: 'wc1' });
    expect(reply.ok).toBe(true);
    expect(post('wp1').comments.find((c) => c.id === reply.id)?.parentId).toBe('wc1');
    expect(useWallStore.getState().updateComment('wp1', 'wc1', { text: 'Μέσα! Φέρνω και θερμός 😄' }).ok).toBe(false); // not the author
    useStore.getState().login('u3');
    expect(useWallStore.getState().updateComment('wp1', 'wc1', { text: 'Τελικά φέρνω νερό.' }).ok).toBe(true);
    expect(post('wp1').comments.find((c) => c.id === 'wc1')?.editedAt).toBeTruthy();
    useStore.getState().login('u1');
    expect(useWallStore.getState().reactToComment('wp1', 'wc1', '❤️').ok).toBe(true);
    expect(post('wp1').comments.find((c) => c.id === 'wc1')?.reactions?.u1).toBe('❤️');
    expect(useWallStore.getState().reactToComment('wp1', 'wc1', '❤️').ok).toBe(true);
    expect(post('wp1').comments.find((c) => c.id === 'wc1')?.reactions?.u1).toBeUndefined();
  });

  it('nobody is notified about their own actions, and read state is per person', () => {
    useWallStore.getState().addComment('wp8', 'Σημείωση για μένα');
    expect(myActivity('u1').some((a) => a.excerpt === 'Σημείωση για μένα')).toBe(false);
    const unread = () => myActivity('u1').filter((a) => !a.read).length;
    expect(unread()).toBeGreaterThan(0);
    useWallStore.getState().markActivityRead();
    expect(unread()).toBe(0);
    expect(myActivity('u2').every((a) => a.read === false || a.read === true)).toBe(true);
  });
});

describe('reports & moderation', () => {
  beforeEach(() => reset());

  it('a report reaches the admin queue with its target and hides the post for the reporter', () => {
    const res = useWallStore.getState().reportPost('wp2', 'Spam');
    expect(res.ok).toBe(true);
    const report = useStore.getState().issueReports[0];
    expect(report).toMatchObject({ targetType: 'wall_post', targetId: 'wp2', targetUserId: 'u3', status: 'open' });
    expect(useWallStore.getState().hiddenPostIds.u1).toContain('wp2');
    expect(useWallStore.getState().reportPost('wp8', 'x').ok).toBe(false); // own post
  });

  it('only moderators remove posts; removed posts stay visible to the author with a notice', () => {
    expect(useWallStore.getState().moderatePost('wp2', 'remove').ok).toBe(false); // Alex is not a moderator
    useWallStore.getState().reportPost('wp2', 'Spam');
    useStore.getState().login('org1'); // seeded moderator
    expect(useWallStore.getState().moderatePost('wp2', 'remove').ok).toBe(true);
    const ctx = wallAccessContext();
    expect(canViewPost('u1', post('wp2'), ctx)).toBe(false);
    expect(canViewPost('u3', post('wp2'), ctx)).toBe(true); // author
    expect(canViewPost('org1', post('wp2'), ctx)).toBe(true); // admin
    expect(useStore.getState().issueReports[0].status).toBe('resolved');
    expect(useStore.getState().adminActions[0].action).toBe('wall_post_removed');
    expect(myActivity('u3').some((a) => a.kind === 'moderation' && a.postId === 'wp2')).toBe(true);
    useWallStore.getState().moderatePost('wp2', 'restore');
    expect(visiblePosts('u1', useWallStore.getState().posts, wallAccessContext()).map((p) => p.id)).toContain('wp2');
  });
});
