/**
 * Backend contract for the wall (Φ26) — pure functions a Cloud Function (or
 * any trusted server) runs, with no Firebase dependency so they are unit
 * tested here and reused verbatim when a Firebase project is attached.
 *
 * Why a backend at all: `firestore.rules` trusts `socialGraph/{uid}` for
 * connections and blocks, so only trusted code may write it; and rules are
 * not filters, so feeds are served by fan-out (`feeds/{uid}/items/{postId}`)
 * computed with the SAME audience ACL the app uses (src/lib/audience.ts).
 *
 * Suggested triggers (Admin SDK pseudocode):
 *
 *   onUpdate(connectionRequests/{id}) status → 'accepted':
 *     write(applyConnection(graphs, from, to))
 *   onCreate(blocks/{blocker}_{blocked}):
 *     write(applyBlock(graphs, blocker, blocked))
 *   onWrite(wallPosts/{postId}):
 *     const { add, remove } = diffFanOut(before, after, ctx)
 *     batch.set(feeds/{uid}/items/{postId}) for add; batch.delete(...) for remove
 *     post.audience.reachIds = friendsOfFriendsReach(...) when base is friends_of_friends
 */
import {
  canViewPost,
  connectionIdsOf,
  type SocialGraph,
  type WallAccessContext,
} from '../../src/lib/audience';
import type { WallPost } from '../../src/types/wall';

/** `socialGraph/{uid}` document. */
export interface GraphDoc {
  connections: string[];
  blocked: string[];
}

export type GraphDocs = Record<string, GraphDoc>;

const empty = (): GraphDoc => ({ connections: [], blocked: [] });
const withId = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);
const withoutId = (list: string[], id: string) => list.filter((x) => x !== id);

function doc(docs: GraphDocs, uid: string): GraphDoc {
  const d = docs[uid] ?? empty();
  return { connections: [...d.connections], blocked: [...d.blocked] };
}

/** Accepted request → mutual edge. Refused while either side blocks the other. Returns the two docs to write. */
export function applyConnection(docs: GraphDocs, a: string, b: string): GraphDocs {
  if (!a || !b || a === b) return {};
  const da = doc(docs, a);
  const db = doc(docs, b);
  if (da.blocked.includes(b) || db.blocked.includes(a)) return {};
  return {
    [a]: { ...da, connections: withId(da.connections, b) },
    [b]: { ...db, connections: withId(db.connections, a) },
  };
}

/** Removed connection → the edge disappears on BOTH sides (the bug fixed in the client in Φ26). */
export function applyDisconnect(docs: GraphDocs, a: string, b: string): GraphDocs {
  if (!a || !b || a === b) return {};
  const da = doc(docs, a);
  const db = doc(docs, b);
  return {
    [a]: { ...da, connections: withoutId(da.connections, b) },
    [b]: { ...db, connections: withoutId(db.connections, a) },
  };
}

/** Block → record it and drop the edge both ways. */
export function applyBlock(docs: GraphDocs, blocker: string, blocked: string): GraphDocs {
  if (!blocker || !blocked || blocker === blocked) return {};
  const out = applyDisconnect(docs, blocker, blocked);
  const d = out[blocker] ?? doc(docs, blocker);
  out[blocker] = { ...d, blocked: withId(d.blocked, blocked) };
  return out;
}

export function applyUnblock(docs: GraphDocs, blocker: string, blocked: string): GraphDocs {
  const d = doc(docs, blocker);
  return { [blocker]: { ...d, blocked: withoutId(d.blocked, blocked) } };
}

/** Graph docs → the shape the shared ACL reads. */
export function toSocialGraph(docs: GraphDocs, extra: Partial<SocialGraph> = {}): SocialGraph {
  return {
    users: Object.entries(docs).map(([id, d]) => ({ id, connections: d.connections, blockedUserIds: d.blocked })),
    lists: [],
    ...extra,
  };
}

/**
 * Who gets the post in their feed. Candidates are the author's and wall
 * owner's connections and their connections, plus tagged people; each one
 * must pass `canViewPost` — the exact rule the app applies. Public posts also
 * go to a public index (`publicIndex`) instead of every member's feed.
 */
export function fanOutTargets(post: WallPost, ctx: WallAccessContext): { userIds: string[]; publicIndex: boolean } {
  if (post.moderation?.status === 'removed') return { userIds: [], publicIndex: false };
  const g = ctx.graph;
  const seeds = new Set<string>([post.authorId, post.wallOwnerId, ...(post.taggedIds ?? [])]);
  const candidates = new Set<string>();
  for (const s of seeds) {
    candidates.add(s);
    for (const c of connectionIdsOf(g, s)) {
      candidates.add(c);
      for (const cc of connectionIdsOf(g, c)) candidates.add(cc);
    }
  }
  const userIds = [...candidates].filter((uid) => canViewPost(uid, post, ctx)).sort();
  const publicIndex =
    post.authorId === post.wallOwnerId && post.audience.base === 'public' && !(post.audience.excludeIds ?? []).length;
  return { userIds, publicIndex };
}

/** Feed items to add and remove after a post changes (audience edit, tag removal, moderation, delete). */
export function diffFanOut(
  before: WallPost | null,
  after: WallPost | null,
  ctx: WallAccessContext,
): { add: string[]; remove: string[] } {
  const prev = new Set(before ? fanOutTargets(before, ctx).userIds : []);
  const next = new Set(after ? fanOutTargets(after, ctx).userIds : []);
  return {
    add: [...next].filter((u) => !prev.has(u)).sort(),
    remove: [...prev].filter((u) => !next.has(u)).sort(),
  };
}

/**
 * Snapshot for `friends_of_friends` posts: rules cannot walk the graph, so the
 * server stores who counted as a friend of a friend when the post was written
 * (`audience.reachIds`). Excluded people never make it into the list.
 */
export function friendsOfFriendsReach(authorId: string, ctx: WallAccessContext, excludeIds: string[] = []): string[] {
  const g = ctx.graph;
  const direct = new Set(connectionIdsOf(g, authorId));
  const reach = new Set<string>();
  for (const c of direct) for (const cc of connectionIdsOf(g, c)) if (cc !== authorId && !direct.has(cc)) reach.add(cc);
  return [...reach].filter((id) => !excludeIds.includes(id)).sort();
}
