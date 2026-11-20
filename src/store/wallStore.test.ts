import { beforeEach, describe, expect, it } from 'vitest';
import { useStore, symmetrizeConnections } from './index';
import { useWallStore, wallAccessContext, POST_RATE_LIMIT } from './wallStore';
import { mockAudienceLists, mockWallPosts, mockWallPrivacy } from '../data/mockWall';
import { mockUsers } from '../data/mockUsers';
import { visiblePosts, graphConnected, canViewAudience } from '../lib/audience';
import { canViewerSeeProfile } from '../lib/profilePrivacy';
import { DEFAULT_USER_SETTINGS } from './index';

const seedConnectionRequests = useStore.getState().connectionRequests;

function resetAll(userId = 'u1') {
  useStore.setState({
    users: mockUsers.map((u) => ({ ...u, connections: [...(u.connections ?? [])] })),
    blockedUserIds: [],
    suspendedUserIds: [],
    connectionRequests: seedConnectionRequests.map((r) => ({ ...r })),
    userSettings: { ...DEFAULT_USER_SETTINGS, privacy: { ...DEFAULT_USER_SETTINGS.privacy } },
  });
  useStore.getState().login(userId);
  useWallStore.setState({
    posts: mockWallPosts.map((p) => ({ ...p, reactions: { ...p.reactions }, comments: [...p.comments] })),
    lists: mockAudienceLists.map((l) => ({ ...l, memberIds: [...l.memberIds] })),
    privacyByUser: { ...mockWallPrivacy },
    hiddenPostIds: {},
    feedSeenAt: {},
  });
}

const visibleIds = (viewer = 'u1') =>
  visiblePosts(viewer, useWallStore.getState().posts, wallAccessContext()).map((p) => p.id);

describe('social graph fixes', () => {
  beforeEach(() => resetAll());

  it('seed connections are mutual', () => {
    const users = useStore.getState().users;
    expect(symmetrizeConnections(users)).toEqual(users);
  });

  it('removeConnection clears both sides, so privacy no longer treats them as connected', () => {
    useStore.getState().removeConnection('u2');
    const s = useStore.getState();
    const u2 = s.users.find((u) => u.id === 'u2')!;
    expect(u2.connections).not.toContain('u1');
    expect(graphConnected({ users: s.users, lists: [] }, 'u1', 'u2')).toBe(false);
  });

  it('restoreConnection (Undo) brings the mutual edge back once', () => {
    useStore.getState().removeConnection('u2');
    useStore.getState().restoreConnection('u2');
    useStore.getState().restoreConnection('u2');
    const s = useStore.getState();
    expect(s.currentUser?.connections?.filter((id) => id === 'u2')).toHaveLength(1);
    expect(s.users.find((u) => u.id === 'u2')?.connections?.filter((id) => id === 'u1')).toHaveLength(1);
  });

  it('blocking removes the edge on both sides', () => {
    useStore.getState().blockUser('u3');
    const u3 = useStore.getState().users.find((u) => u.id === 'u3')!;
    expect(u3.connections).not.toContain('u1');
  });

  it('symmetrizeConnections drops half-edges left by older saved state', () => {
    const fixed = symmetrizeConnections([
      { id: 'x', connections: ['y', 'z', 'x'] },
      { id: 'y', connections: [] },
    ]);
    // y does not list x → dropped; z is unknown → kept; self-edge dropped.
    expect(fixed[0].connections).toEqual(['z']);
  });

  it('sendConnectionRequest reports what happened', () => {
    const s = useStore.getState();
    expect(s.sendConnectionRequest('u1')).toBe('invalid');
    expect(s.sendConnectionRequest('u2')).toBe('connected');
    // Elena asked first (cr3): saying yes accepts her request.
    expect(s.sendConnectionRequest('u4')).toBe('accepted');
    expect(useStore.getState().currentUser?.connections).toContain('u4');
    expect(useStore.getState().sendConnectionRequest('org3')).toBe('sent');
    expect(useStore.getState().sendConnectionRequest('org3')).toBe('exists');
    useStore.getState().cancelConnectionRequest('org3');
    expect(useStore.getState().sendConnectionRequest('org3')).toBe('sent');
    useStore.getState().blockUser('org2');
    expect(useStore.getState().sendConnectionRequest('org2')).toBe('blocked');
  });

  it('only the recipient can accept, and accepting twice never duplicates', () => {
    useStore.getState().login('u4');
    useStore.getState().acceptConnectionRequest('cr3'); // u4 sent it — not theirs to accept
    expect(useStore.getState().users.find((u) => u.id === 'u1')?.connections).not.toContain('u4');
    useStore.getState().login('u1');
    useStore.getState().acceptConnectionRequest('cr3');
    useStore.getState().acceptConnectionRequest('cr3');
    const me = useStore.getState().currentUser!;
    expect(me.connections?.filter((id) => id === 'u4')).toHaveLength(1);
  });
});

describe('wall visibility for the demo user', () => {
  beforeEach(() => resetAll());

  it('never shows posts meant for someone else', () => {
    const ids = visibleIds();
    expect(ids).toContain('wp1'); // Maria · connections
    expect(ids).toContain('wp2'); // Nikos · public
    expect(ids).toContain('wp4'); // Elena · public
    expect(ids).toContain('wp9'); // Nikos on Alex's wall
    expect(ids).not.toContain('wp6'); // Maria · specific [Nikos]
    expect(ids).not.toContain('wp7'); // Nikos · connections except Alex
    expect(ids).not.toContain('wp5'); // Elena · connections (not yet connected)
  });

  it('accepting Elena’s request reveals her connections-only post', () => {
    useStore.getState().acceptConnectionRequest('cr3');
    expect(visibleIds()).toContain('wp5');
  });

  it('blocking an author hides all of their posts and comments', () => {
    useStore.getState().blockUser('u3');
    const ids = visibleIds();
    expect(ids).not.toContain('wp2');
    expect(ids).not.toContain('wp9');
  });
});

describe('wall writes re-check permissions', () => {
  beforeEach(() => resetAll());

  it('creates a post with a sanitized audience', () => {
    const res = useWallStore.getState().createPost({ text: '  Hello  ', audience: { base: 'specific', includeIds: ['u2', 'org3', 'u2'] } });
    expect(res.ok).toBe(true);
    const created = useWallStore.getState().posts[0];
    expect(created.text).toBe('Hello');
    // org3 is not a connection → dropped; duplicates removed.
    expect(created.audience).toEqual({ base: 'specific', includeIds: ['u2'] });
    expect(visiblePosts('u2', useWallStore.getState().posts, wallAccessContext()).map((p) => p.id)).toContain(created.id);
    expect(visiblePosts('u3', useWallStore.getState().posts, wallAccessContext()).map((p) => p.id)).not.toContain(created.id);
  });

  it('refuses empty posts and walls that are closed to the viewer', () => {
    expect(useWallStore.getState().createPost({ text: '   ' }).ok).toBe(false);
    // Nikos (u3) does not accept posts on his wall.
    expect(useWallStore.getState().createPost({ wallOwnerId: 'u3', text: 'hey' }).ok).toBe(false);
    // Maria (u2) accepts posts from her Nakamas.
    const ok = useWallStore.getState().createPost({ wallOwnerId: 'u2', text: 'Καλή εβδομάδα!' });
    expect(ok.ok).toBe(true);
    const onMaria = useWallStore.getState().posts[0];
    // A post on someone else's wall takes the wall owner's audience.
    expect(onMaria.audience).toEqual(mockWallPrivacy.u2.othersPostsAudience);
  });

  it('rate-limits bursts of posts', () => {
    for (let i = 0; i < POST_RATE_LIMIT.count; i++) {
      expect(useWallStore.getState().createPost({ text: `post ${i}` }).ok).toBe(true);
    }
    expect(useWallStore.getState().createPost({ text: 'one too many' }).ok).toBe(false);
  });

  it('only the author edits; author or wall owner deletes; Undo restores', () => {
    // wp9 is by Nikos on Alex's wall.
    expect(useWallStore.getState().updatePost('wp9', { text: 'changed' }).ok).toBe(false);
    const removed = useWallStore.getState().deletePost('wp9');
    expect(removed?.id).toBe('wp9');
    useWallStore.getState().restorePost(removed!);
    expect(useWallStore.getState().posts.some((p) => p.id === 'wp9')).toBe(true);
    // Alex cannot delete Maria's post on Maria's wall.
    expect(useWallStore.getState().deletePost('wp1')).toBeNull();
    expect(useWallStore.getState().updatePost('wp8', { text: 'Νέο κείμενο' }).ok).toBe(true);
    expect(useWallStore.getState().posts.find((p) => p.id === 'wp8')?.editedAt).toBeTruthy();
  });

  it('comments follow the author’s comment setting', () => {
    // Elena's public post: Elena allows comments from connections only (default).
    expect(useWallStore.getState().addComment('wp4', 'Τέλειο!').ok).toBe(false);
    // Nikos allows public comments.
    expect(useWallStore.getState().addComment('wp2', 'Έρχομαι!').ok).toBe(true);
    // Hidden posts cannot be reacted to or commented on.
    expect(useWallStore.getState().react('wp6', 'like').ok).toBe(false);
  });

  it('reactions toggle and change', () => {
    const w = useWallStore.getState();
    w.react('wp2', 'love');
    expect(useWallStore.getState().posts.find((p) => p.id === 'wp2')?.reactions.u1).toBe('love');
    useWallStore.getState().react('wp2', 'love');
    expect(useWallStore.getState().posts.find((p) => p.id === 'wp2')?.reactions.u1).toBeUndefined();
  });

  it('limitPastPosts narrows wide posts to connections and can be undone', () => {
    useWallStore.getState().createPost({ text: 'public one', audience: { base: 'public', excludeIds: ['u3'] } });
    const id = useWallStore.getState().posts[0].id;
    const prev = useWallStore.getState().limitPastPosts();
    expect(Object.keys(prev)).toEqual([id]);
    expect(useWallStore.getState().posts[0].audience).toEqual({ base: 'connections', excludeIds: ['u3'] });
    useWallStore.getState().restoreAudiences(prev);
    expect(useWallStore.getState().posts[0].audience.base).toBe('public');
  });

  it('lists keep only connections, and deleting one keeps who could see', () => {
    const res = useWallStore.getState().createList('Σινεφίλ', ['u2', 'org3']);
    expect(res.ok).toBe(true);
    const listId = (res as { id: string }).id;
    expect(useWallStore.getState().lists.find((l) => l.id === listId)?.memberIds).toEqual(['u2']);
    useWallStore.getState().createPost({ text: 'for the list', audience: { base: 'list', listId } });
    useWallStore.getState().deleteList(listId);
    expect(useWallStore.getState().posts[0].audience).toEqual({ base: 'specific', includeIds: ['u2'] });
  });
});

describe('fine-grained profile audience', () => {
  beforeEach(() => resetAll());

  it('applies "…except" and lists to the profile gate, keeping the coarse value in sync', () => {
    useStore.getState().updatePrivacySettings({ profileAudience: { base: 'connections', excludeIds: ['u3'] } });
    const s = useStore.getState();
    expect(s.userSettings.privacy.profileVisibility).toBe('connections');
    const me = s.users.find((u) => u.id === 'u1')!;
    const ctxFor = { users: s.users, lists: useWallStore.getState().lists, groups: s.groups };
    const asMaria = canViewerSeeProfile(s.users.find((u) => u.id === 'u2'), me, ctxFor);
    const asNikos = canViewerSeeProfile(s.users.find((u) => u.id === 'u3'), me, ctxFor);
    expect(asMaria.allowed).toBe(true);
    expect(asNikos.allowed).toBe(false);
  });

  it('a later coarse change (e.g. from the AI) replaces the fine audience', () => {
    useStore.getState().updatePrivacySettings({ profileAudience: { base: 'list', listId: 'al1' } });
    useStore.getState().updatePrivacySettings({ profileVisibility: 'public' });
    const p = useStore.getState().userSettings.privacy;
    expect(p.profileAudience).toBeUndefined();
    expect(p.profileVisibility).toBe('public');
  });

  it('lists in the profile audience grant only their members', () => {
    const g = { users: useStore.getState().users, lists: useWallStore.getState().lists };
    expect(canViewAudience('u1', 'u2', { base: 'list', listId: 'al1' }, g)).toBe(true);
    expect(canViewAudience('u1', 'org1', { base: 'list', listId: 'al1' }, g)).toBe(false);
  });
});
