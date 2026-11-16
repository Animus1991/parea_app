import { describe, expect, it } from 'vitest';
import {
  applyBlock,
  applyConnection,
  applyDisconnect,
  applyUnblock,
  diffFanOut,
  fanOutTargets,
  friendsOfFriendsReach,
  toSocialGraph,
  type GraphDocs,
} from './socialGraph';
import type { WallPost } from '../../src/types/wall';
import type { WallAccessContext } from '../../src/lib/audience';

// alice ⇄ bob ⇄ carol, alice ⇄ dave; eve is a stranger.
const docs: GraphDocs = {
  alice: { connections: ['bob', 'dave'], blocked: [] },
  bob: { connections: ['alice', 'carol'], blocked: [] },
  carol: { connections: ['bob'], blocked: [] },
  dave: { connections: ['alice'], blocked: [] },
  eve: { connections: [], blocked: [] },
};

const ctx = (d: GraphDocs = docs): WallAccessContext => ({ graph: toSocialGraph(d), privacyByUser: {} });

const post = (over: Partial<WallPost> = {}): WallPost => ({
  id: 'p1',
  authorId: 'alice',
  wallOwnerId: 'alice',
  text: 'hi',
  audience: { base: 'connections' },
  createdAt: '2026-11-16T10:00:00.000Z',
  reactions: {},
  comments: [],
  ...over,
});

describe('social graph maintenance', () => {
  it('accepting creates a mutual edge, once', () => {
    const out = applyConnection(docs, 'carol', 'eve');
    expect(out.carol.connections).toEqual(['bob', 'eve']);
    expect(out.eve.connections).toEqual(['carol']);
    expect(applyConnection({ ...docs, ...out }, 'carol', 'eve').carol.connections).toEqual(['bob', 'eve']);
  });

  it('disconnecting removes the edge on both sides', () => {
    const out = applyDisconnect(docs, 'alice', 'bob');
    expect(out.alice.connections).toEqual(['dave']);
    expect(out.bob.connections).toEqual(['carol']);
  });

  it('blocking records the block, removes the edge, and refuses new connections until unblocked', () => {
    const blocked = { ...docs, ...applyBlock(docs, 'alice', 'bob') };
    expect(blocked.alice).toEqual({ connections: ['dave'], blocked: ['bob'] });
    expect(blocked.bob.connections).toEqual(['carol']);
    expect(applyConnection(blocked, 'bob', 'alice')).toEqual({});
    const unblocked = { ...blocked, ...applyUnblock(blocked, 'alice', 'bob') };
    expect(applyConnection(unblocked, 'bob', 'alice').alice.connections).toContain('bob');
  });
});

describe('feed fan-out uses the app’s own audience rules', () => {
  it('connections-only reaches exactly the author’s connections', () => {
    expect(fanOutTargets(post(), ctx()).userIds).toEqual(['alice', 'bob', 'dave']);
  });

  it('friends of friends adds carol but never strangers or excluded people', () => {
    const p = post({ audience: { base: 'friends_of_friends', excludeIds: ['dave'] } });
    expect(fanOutTargets(p, ctx()).userIds).toEqual(['alice', 'bob', 'carol']);
    expect(friendsOfFriendsReach('alice', ctx(), ['dave'])).toEqual(['carol']);
  });

  it('public posts go to the public index; tags reach the tagged person', () => {
    expect(fanOutTargets(post({ audience: { base: 'public' } }), ctx()).publicIndex).toBe(true);
    const tagged = post({ audience: { base: 'only_me' }, taggedIds: ['bob'] });
    expect(fanOutTargets(tagged, ctx()).userIds).toEqual(['alice', 'bob']);
  });

  it('removed posts leave every feed; audience edits produce an add/remove diff', () => {
    expect(fanOutTargets(post({ moderation: { status: 'removed', at: '', reasonEl: '', reasonEn: '' } }), ctx()).userIds).toEqual([]);
    const diff = diffFanOut(post(), post({ audience: { base: 'specific', includeIds: ['bob'] } }), ctx());
    expect(diff).toEqual({ add: [], remove: ['dave'] });
    expect(diffFanOut(post(), null, ctx())).toEqual({ add: [], remove: ['alice', 'bob', 'dave'] });
  });

  it('a block keeps the blocked person out of the feed', () => {
    const blocked = { ...docs, ...applyBlock(docs, 'alice', 'dave') };
    expect(fanOutTargets(post(), ctx(blocked)).userIds).toEqual(['alice', 'bob']);
  });
});
