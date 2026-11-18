import { describe, expect, it } from 'vitest';
import {
  audienceReach,
  audienceToProfileVisibility,
  canCommentOnPost,
  canPostOnWall,
  canViewAudience,
  canViewPost,
  canViewProfileSection,
  mutualConnectionIds,
  normalizeAudience,
  profileVisibilityToAudience,
  visiblePosts,
  type SocialGraph,
  type WallAccessContext,
} from './audience';
import type { WallPost } from '../types/wall';
import { DEFAULT_WALL_PRIVACY } from '../types/wall';

// a—b—c chain, a—d, e is a stranger. List L1 (owner a) = [b, e].
const graph = (extra: Partial<SocialGraph> = {}): SocialGraph => ({
  users: [
    { id: 'a', connections: ['b', 'd'] },
    { id: 'b', connections: ['a', 'c'] },
    { id: 'c', connections: ['b'] },
    { id: 'd', connections: ['a'] },
    { id: 'e', connections: [] },
  ],
  lists: [{ id: 'L1', ownerId: 'a', name: 'Close', memberIds: ['b', 'e'], createdAt: '' }],
  ...extra,
});

const ctx = (g = graph(), privacyByUser: WallAccessContext['privacyByUser'] = {}): WallAccessContext => ({ graph: g, privacyByUser });

const post = (over: Partial<WallPost> = {}): WallPost => ({
  id: 'p',
  authorId: 'a',
  wallOwnerId: 'a',
  text: 'hi',
  audience: { base: 'public' },
  createdAt: '2026-11-16T10:00:00.000Z',
  reactions: {},
  comments: [],
  ...over,
});

describe('canViewAudience', () => {
  const g = graph();
  it('owner always sees; nobody signed out does', () => {
    expect(canViewAudience('a', 'a', { base: 'only_me' }, g)).toBe(true);
    expect(canViewAudience('a', null, { base: 'public' }, g)).toBe(false);
  });

  it('public reaches every member, minus exclusions', () => {
    expect(canViewAudience('a', 'e', { base: 'public' }, g)).toBe(true);
    expect(canViewAudience('a', 'e', { base: 'public', excludeIds: ['e'] }, g)).toBe(false);
  });

  it('connections are mutual edges only', () => {
    expect(canViewAudience('a', 'b', { base: 'connections' }, g)).toBe(true);
    expect(canViewAudience('a', 'c', { base: 'connections' }, g)).toBe(false);
    expect(canViewAudience('a', 'b', { base: 'connections', excludeIds: ['b'] }, g)).toBe(false);
  });

  it('friends of friends adds people who share a connection', () => {
    expect(mutualConnectionIds(g, 'a', 'c')).toEqual(['b']);
    expect(canViewAudience('a', 'c', { base: 'friends_of_friends' }, g)).toBe(true);
    expect(canViewAudience('a', 'e', { base: 'friends_of_friends' }, g)).toBe(false);
  });

  it('specific people must be named and still connected', () => {
    expect(canViewAudience('a', 'b', { base: 'specific', includeIds: ['b'] }, g)).toBe(true);
    expect(canViewAudience('a', 'd', { base: 'specific', includeIds: ['b'] }, g)).toBe(false);
    // e is named but is not a connection → no access.
    expect(canViewAudience('a', 'e', { base: 'specific', includeIds: ['e'] }, g)).toBe(false);
  });

  it('lists need membership + connection, and only the owner’s own list counts', () => {
    expect(canViewAudience('a', 'b', { base: 'list', listId: 'L1' }, g)).toBe(true);
    expect(canViewAudience('a', 'e', { base: 'list', listId: 'L1' }, g)).toBe(false);
    expect(canViewAudience('b', 'a', { base: 'list', listId: 'L1' }, g)).toBe(false);
    expect(canViewAudience('a', 'b', { base: 'list', listId: 'L1', excludeIds: ['b'] }, g)).toBe(false);
  });

  it('only me hides from everyone else', () => {
    expect(canViewAudience('a', 'b', { base: 'only_me' }, g)).toBe(false);
  });

  it('a block in either direction wins over every audience', () => {
    const blockedByOwner = graph({ users: graph().users.map((u) => (u.id === 'a' ? { ...u, blockedUserIds: ['b'] } : u)) });
    expect(canViewAudience('a', 'b', { base: 'public' }, blockedByOwner)).toBe(false);
    const viewerBlocked = graph({ viewerBlockedIds: ['a'] });
    expect(canViewAudience('a', 'b', { base: 'public' }, viewerBlocked)).toBe(false);
  });

  it('reach counts exactly who would see it', () => {
    expect(audienceReach('a', { base: 'connections' }, g).sort()).toEqual(['b', 'd']);
    expect(audienceReach('a', { base: 'public', excludeIds: ['e'] }, g).sort()).toEqual(['b', 'c', 'd']);
  });
});

describe('normalizeAudience & legacy mapping', () => {
  it('drops fields that do not belong to the base and falls back on unknown bases', () => {
    expect(normalizeAudience({ base: 'specific', includeIds: ['x', 'x'], excludeIds: ['y'] })).toEqual({ base: 'specific', includeIds: ['x'] });
    expect(normalizeAudience({ base: 'only_me', excludeIds: ['y'] })).toEqual({ base: 'only_me' });
    expect(normalizeAudience({ base: 'public' }, ['connections', 'only_me'])).toEqual({ base: 'connections' });
    expect(normalizeAudience(undefined)).toEqual({ base: 'connections' });
  });

  it('maps to and from the coarse profile visibility', () => {
    expect(audienceToProfileVisibility({ base: 'public', excludeIds: ['x'] })).toBe('public');
    expect(audienceToProfileVisibility({ base: 'list', listId: 'L1' })).toBe('connections');
    expect(audienceToProfileVisibility({ base: 'only_me' })).toBe('private');
    expect(profileVisibilityToAudience('private')).toEqual({ base: 'only_me' });
  });
});

describe('posts, walls, comments, sections', () => {
  it('own posts follow their audience', () => {
    const p = post({ audience: { base: 'connections' } });
    expect(canViewPost('b', p, ctx())).toBe(true);
    expect(canViewPost('e', p, ctx())).toBe(false);
  });

  it('posts on someone else’s wall follow the wall owner’s setting (retroactively)', () => {
    const onAWall = post({ authorId: 'b', wallOwnerId: 'a', audience: { base: 'public' } });
    const strict = { a: { ...DEFAULT_WALL_PRIVACY, othersPostsAudience: { base: 'only_me' as const } } };
    expect(canViewPost('d', onAWall, ctx(graph(), {}))).toBe(true); // default: owner's connections
    expect(canViewPost('e', onAWall, ctx(graph(), {}))).toBe(false);
    expect(canViewPost('d', onAWall, ctx(graph(), strict))).toBe(false);
    expect(canViewPost('a', onAWall, ctx(graph(), strict))).toBe(true); // wall owner
    expect(canViewPost('b', onAWall, ctx(graph(), strict))).toBe(true); // author
  });

  it('hides posts of suspended authors from everyone but admins', () => {
    const g = graph({ suspendedUserIds: ['a'], users: [...graph().users, { id: 'mod', connections: [], isAdmin: true }] });
    expect(canViewPost('b', post(), ctx(g))).toBe(false);
    expect(canViewPost('mod', post(), ctx(g))).toBe(true);
  });

  it('who can post on a wall', () => {
    expect(canPostOnWall('b', 'a', ctx()).allowed).toBe(true);
    expect(canPostOnWall('e', 'a', ctx()).allowed).toBe(false);
    const closed = { a: { ...DEFAULT_WALL_PRIVACY, whoCanPost: { base: 'only_me' as const } } };
    expect(canPostOnWall('b', 'a', ctx(graph(), closed)).allowed).toBe(false);
    expect(canPostOnWall('a', 'a', ctx(graph(), closed)).allowed).toBe(true);
  });

  it('comments respect visibility, the author’s comment setting and the per-post switch', () => {
    const pub = post({ audience: { base: 'public' } });
    expect(canCommentOnPost('e', pub, ctx()).allowed).toBe(false); // default: connections comment
    const open = { a: { ...DEFAULT_WALL_PRIVACY, whoCanComment: { base: 'public' as const } } };
    expect(canCommentOnPost('e', pub, ctx(graph(), open)).allowed).toBe(true);
    expect(canCommentOnPost('b', { ...pub, commentsDisabled: true }, ctx()).allowed).toBe(false);
    expect(canCommentOnPost('e', post({ audience: { base: 'connections' } }), ctx(graph(), open)).allowed).toBe(false);
  });

  it('profile sections each have their own audience', () => {
    const p = { a: { ...DEFAULT_WALL_PRIVACY, sections: { ...DEFAULT_WALL_PRIVACY.sections, interests: { base: 'only_me' as const } } } };
    expect(canViewProfileSection('e', 'a', 'about', ctx(graph(), p))).toBe(true);
    expect(canViewProfileSection('b', 'a', 'interests', ctx(graph(), p))).toBe(false);
    expect(canViewProfileSection('e', 'a', 'connections', ctx(graph(), p))).toBe(false);
  });

  it('visiblePosts filters, hides and orders pinned first', () => {
    const list = [
      post({ id: 'old', createdAt: '2026-11-01T00:00:00.000Z', pinned: true }),
      post({ id: 'new', createdAt: '2026-11-15T00:00:00.000Z' }),
      post({ id: 'secret', audience: { base: 'only_me' } }),
    ];
    expect(visiblePosts('b', list, ctx(), { pinnedFirst: true }).map((p) => p.id)).toEqual(['old', 'new']);
    expect(visiblePosts('b', list, ctx()).map((p) => p.id)).toEqual(['new', 'old']);
    expect(visiblePosts('b', list, ctx(), { hiddenIds: ['new'] }).map((p) => p.id)).toEqual(['old']);
  });
});
