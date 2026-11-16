/**
 * Audience ACL (Φ26) — the single, pure decision point for "can this viewer
 * see / do this?" on walls, posts, comments and profile sections.
 *
 * Rules, in order (secure by default):
 *  1. The owner always passes.
 *  2. No viewer, or a block in either direction → denied.
 *  3. People in `excludeIds` are denied (for every base except `specific`).
 *  4. The base decides: public → any member; connections → mutual
 *     connection; friends_of_friends → connection or shares one; specific /
 *     list → named AND still a connection (unfriending revokes access);
 *     only_me → nobody else.
 */
import type { Audience, AudienceBase, AudienceList, WallPost, WallPrivacySettings, ProfileSectionKey } from '../types/wall';
import { DEFAULT_WALL_PRIVACY } from '../types/wall';

export interface GraphUser {
  id: string;
  connections?: string[];
  blockedUserIds?: string[];
  isAdmin?: boolean;
}

/** Everything the ACL needs to know about the network, passed in explicitly. */
export interface SocialGraph {
  users: GraphUser[];
  lists: AudienceList[];
  /** The signed-in account's own block list (kept outside `users` in the store). */
  viewerBlockedIds?: string[];
  /** Admin-suspended accounts: their posts are hidden from everyone else. */
  suspendedUserIds?: string[];
}

function userById(g: SocialGraph, id: string): GraphUser | undefined {
  return g.users.find((u) => u.id === id);
}

/** Mutual-or-listed edge (same semantics as profilePrivacy.areConnected). */
export function graphConnected(g: SocialGraph, a: string, b: string): boolean {
  if (!a || !b || a === b) return false;
  const ua = userById(g, a);
  const ub = userById(g, b);
  return Boolean((ua?.connections ?? []).includes(b) || (ub?.connections ?? []).includes(a));
}

export function connectionIdsOf(g: SocialGraph, id: string): string[] {
  const own = new Set(userById(g, id)?.connections ?? []);
  for (const u of g.users) if (u.id !== id && (u.connections ?? []).includes(id)) own.add(u.id);
  own.delete(id);
  return [...own];
}

export function graphBlocked(g: SocialGraph, a: string, b: string, viewerId?: string): boolean {
  if (!a || !b || a === b) return false;
  const ua = userById(g, a);
  const ub = userById(g, b);
  if ((ua?.blockedUserIds ?? []).includes(b) || (ub?.blockedUserIds ?? []).includes(a)) return true;
  const own = g.viewerBlockedIds ?? [];
  if (viewerId && (a === viewerId || b === viewerId)) {
    const other = a === viewerId ? b : a;
    if (own.includes(other)) return true;
  }
  return false;
}

export function mutualConnectionIds(g: SocialGraph, a: string, b: string): string[] {
  const aConns = new Set(connectionIdsOf(g, a));
  return connectionIdsOf(g, b).filter((id) => id !== a && aConns.has(id));
}

function listOf(g: SocialGraph, ownerId: string, listId?: string): AudienceList | undefined {
  if (!listId) return undefined;
  return g.lists.find((l) => l.id === listId && l.ownerId === ownerId);
}

/** Pure audience check: may `viewerId` see something owned by `ownerId`? */
export function canViewAudience(
  ownerId: string,
  viewerId: string | null | undefined,
  audience: Audience | undefined,
  g: SocialGraph,
): boolean {
  if (!viewerId) return false;
  if (viewerId === ownerId) return true;
  if (graphBlocked(g, ownerId, viewerId, viewerId)) return false;
  const a = audience ?? { base: 'only_me' };
  const excluded = (a.excludeIds ?? []).includes(viewerId);
  switch (a.base) {
    case 'public':
      return !excluded;
    case 'connections':
      return !excluded && graphConnected(g, ownerId, viewerId);
    case 'friends_of_friends':
      return (
        !excluded &&
        (graphConnected(g, ownerId, viewerId) || mutualConnectionIds(g, ownerId, viewerId).length > 0)
      );
    case 'specific':
      return (a.includeIds ?? []).includes(viewerId) && graphConnected(g, ownerId, viewerId);
    case 'list': {
      const list = listOf(g, ownerId, a.listId);
      return Boolean(!excluded && list?.memberIds.includes(viewerId) && graphConnected(g, ownerId, viewerId));
    }
    case 'only_me':
    default:
      return false;
  }
}

/** Everyone (other than the owner) who would see it — for the live "N people" preview. */
export function audienceReach(ownerId: string, audience: Audience, g: SocialGraph): string[] {
  return g.users
    .filter((u) => u.id !== ownerId && canViewAudience(ownerId, u.id, audience, g))
    .map((u) => u.id);
}

/** Keep only fields that matter for the base (clean persistence & comparisons). */
export function normalizeAudience(a: Audience | undefined, allowed?: readonly AudienceBase[]): Audience {
  const fallback: Audience = { base: allowed?.includes('connections') ? 'connections' : allowed?.[0] ?? 'connections' };
  if (!a || typeof a !== 'object' || typeof a.base !== 'string') return fallback;
  if (allowed && !allowed.includes(a.base)) return fallback;
  const uniq = (ids?: string[]) => (Array.isArray(ids) ? [...new Set(ids.filter((x) => typeof x === 'string' && x))] : []);
  switch (a.base) {
    case 'specific':
      return { base: 'specific', includeIds: uniq(a.includeIds) };
    case 'list':
      return { base: 'list', listId: a.listId, ...(uniq(a.excludeIds).length ? { excludeIds: uniq(a.excludeIds) } : {}) };
    case 'only_me':
      return { base: 'only_me' };
    default: {
      const ex = uniq(a.excludeIds);
      return ex.length ? { base: a.base, excludeIds: ex } : { base: a.base };
    }
  }
}

/** Legacy coarse value kept in sync for older consumers (AI, Firestore profile). */
export function audienceToProfileVisibility(a: Audience): 'public' | 'connections' | 'private' {
  if (a.base === 'public') return 'public';
  if (a.base === 'only_me') return 'private';
  return 'connections';
}

export function profileVisibilityToAudience(v: 'public' | 'connections' | 'private' | undefined): Audience {
  if (v === 'public') return { base: 'public' };
  if (v === 'private') return { base: 'only_me' };
  return { base: 'connections' };
}

/** Wider audiences first — used to describe "who can see" and to "limit" posts. */
export const AUDIENCE_RANK: Record<AudienceBase, number> = {
  public: 5,
  friends_of_friends: 4,
  connections: 3,
  list: 2,
  specific: 2,
  only_me: 0,
};

/* ───────────────────────── wall-level decisions ───────────────────────── */

export function wallPrivacyOf(
  byUser: Record<string, WallPrivacySettings | undefined>,
  userId: string,
): WallPrivacySettings {
  const saved = byUser[userId];
  if (!saved) return DEFAULT_WALL_PRIVACY;
  return {
    ...DEFAULT_WALL_PRIVACY,
    ...saved,
    sections: { ...DEFAULT_WALL_PRIVACY.sections, ...(saved.sections ?? {}) },
    reviewTags: typeof saved.reviewTags === 'boolean' ? saved.reviewTags : DEFAULT_WALL_PRIVACY.reviewTags,
  };
}

export interface WallAccessContext {
  graph: SocialGraph;
  privacyByUser: Record<string, WallPrivacySettings | undefined>;
}

/**
 * May the viewer see this post?
 * - Own posts follow the author's chosen audience.
 * - Posts written on someone else's wall follow the wall owner's
 *   "who sees what others post on my wall" setting (applies retroactively).
 * Author and wall owner always see it unless one has blocked the other.
 */
export function canViewPost(viewerId: string | null | undefined, post: WallPost, ctx: WallAccessContext): boolean {
  if (!viewerId) return false;
  const g = ctx.graph;
  if (viewerId === post.authorId) return true;
  const viewerIsAdmin = Boolean(userById(g, viewerId)?.isAdmin);
  // Removed by a moderator: only the author (above) and admins.
  if (post.moderation?.status === 'removed') return viewerIsAdmin;
  if (graphBlocked(g, viewerId, post.authorId, viewerId)) return false;
  if ((g.suspendedUserIds ?? []).includes(post.authorId) && !viewerIsAdmin) return false;
  // Tagged people always see what they are tagged in (and can remove the tag).
  if ((post.taggedIds ?? []).includes(viewerId)) return true;
  if (post.wallOwnerId !== post.authorId) {
    if (viewerId === post.wallOwnerId) return true;
    if (graphBlocked(g, viewerId, post.wallOwnerId, viewerId)) return false;
    const owner = wallPrivacyOf(ctx.privacyByUser, post.wallOwnerId);
    return canViewAudience(post.wallOwnerId, viewerId, owner.othersPostsAudience, g);
  }
  return canViewAudience(post.authorId, viewerId, post.audience, g);
}

export type GateResult = { allowed: boolean; reasonEl: string; reasonEn: string };

const OK: GateResult = { allowed: true, reasonEl: '', reasonEn: '' };

/** May the viewer write on `ownerId`'s wall? */
export function canPostOnWall(viewerId: string | null | undefined, ownerId: string, ctx: WallAccessContext): GateResult {
  if (!viewerId) return { allowed: false, reasonEl: 'Σύνδεση απαιτείται', reasonEn: 'Sign in required' };
  if (viewerId === ownerId) return OK;
  if (graphBlocked(ctx.graph, viewerId, ownerId, viewerId)) {
    return { allowed: false, reasonEl: 'Δεν είναι διαθέσιμο', reasonEn: 'Not available' };
  }
  const p = wallPrivacyOf(ctx.privacyByUser, ownerId);
  if (p.whoCanPost.base === 'only_me') {
    return {
      allowed: false,
      reasonEl: 'Δέχεται δημοσιεύσεις μόνο από τον εαυτό του/της στον τοίχο',
      reasonEn: 'Only they can post on this wall',
    };
  }
  if (canViewAudience(ownerId, viewerId, p.whoCanPost, ctx.graph)) return OK;
  return {
    allowed: false,
    reasonEl:
      p.whoCanPost.base === 'connections'
        ? 'Στον τοίχο γράφουν μόνο οι Nakamas του/της'
        : 'Στον τοίχο γράφουν μόνο όσοι έχει επιλέξει',
    reasonEn:
      p.whoCanPost.base === 'connections'
        ? 'Only their Nakamas can post on this wall'
        : 'Only people they picked can post on this wall',
  };
}

/** May the viewer comment on this post? */
export function canCommentOnPost(viewerId: string | null | undefined, post: WallPost, ctx: WallAccessContext): GateResult {
  if (!viewerId) return { allowed: false, reasonEl: 'Σύνδεση απαιτείται', reasonEn: 'Sign in required' };
  if (!canViewPost(viewerId, post, ctx)) return { allowed: false, reasonEl: 'Δεν είναι διαθέσιμο', reasonEn: 'Not available' };
  if (post.commentsDisabled) {
    return { allowed: false, reasonEl: 'Τα σχόλια είναι κλειστά', reasonEn: 'Comments are turned off' };
  }
  if (viewerId === post.authorId || viewerId === post.wallOwnerId) return OK;
  const p = wallPrivacyOf(ctx.privacyByUser, post.authorId);
  if (canViewAudience(post.authorId, viewerId, p.whoCanComment, ctx.graph)) return OK;
  return {
    allowed: false,
    reasonEl:
      p.whoCanComment.base === 'connections'
        ? 'Σχολιάζουν μόνο οι Nakamas του/της'
        : 'Σχολιάζουν μόνο οι Nakamas και οι Nakamas τους',
    reasonEn:
      p.whoCanComment.base === 'connections'
        ? 'Only their Nakamas can comment'
        : 'Only their Nakamas and friends of friends can comment',
  };
}

/** May the viewer see one section of `ownerId`'s profile? */
export function canViewProfileSection(
  viewerId: string | null | undefined,
  ownerId: string,
  section: ProfileSectionKey,
  ctx: WallAccessContext,
): boolean {
  const p = wallPrivacyOf(ctx.privacyByUser, ownerId);
  return canViewAudience(ownerId, viewerId, p.sections[section], ctx.graph);
}

/** Posts the viewer may see, newest first (pinned first when `pinnedFirst`). */
export function visiblePosts(
  viewerId: string | null | undefined,
  posts: WallPost[],
  ctx: WallAccessContext,
  opts: { wallOwnerId?: string; pinnedFirst?: boolean; hiddenIds?: string[] } = {},
): WallPost[] {
  const hidden = new Set(opts.hiddenIds ?? []);
  const list = posts.filter(
    (p) =>
      !hidden.has(p.id) &&
      (opts.wallOwnerId === undefined || p.wallOwnerId === opts.wallOwnerId) &&
      canViewPost(viewerId, p, ctx),
  );
  return list.sort((a, b) => {
    if (opts.pinnedFirst && Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Is `userId` tagged in the post, and has the tag cleared their review setting? */
export function tagShownOnProfile(post: WallPost, userId: string, byUser: Record<string, WallPrivacySettings | undefined>): boolean {
  if (!(post.taggedIds ?? []).includes(userId)) return false;
  return !wallPrivacyOf(byUser, userId).reviewTags || (post.tagApprovedIds ?? []).includes(userId);
}

/**
 * What a profile's «Τοίχος» shows to `viewerId`: posts on that wall plus posts
 * the owner is tagged in (after their tag review), each still filtered by
 * the post's own audience. Pinned first, newest first.
 */
export function profileWallPosts(viewerId: string | null | undefined, ownerId: string, posts: WallPost[], ctx: WallAccessContext): WallPost[] {
  const mine = posts.filter((p) => p.wallOwnerId === ownerId || tagShownOnProfile(p, ownerId, ctx.privacyByUser));
  return visiblePosts(viewerId, mine, ctx).sort((a, b) => {
    const ap = a.pinned && a.wallOwnerId === ownerId;
    const bp = b.pinned && b.wallOwnerId === ownerId;
    if (ap !== bp) return ap ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Tags waiting for `userId`'s approval (only when they review tags). */
export function pendingTagReviews(userId: string, posts: WallPost[], ctx: WallAccessContext): WallPost[] {
  if (!wallPrivacyOf(ctx.privacyByUser, userId).reviewTags) return [];
  return posts.filter(
    (p) =>
      (p.taggedIds ?? []).includes(userId) &&
      !(p.tagApprovedIds ?? []).includes(userId) &&
      p.wallOwnerId !== userId &&
      canViewPost(userId, p, ctx),
  );
}

/** Comments the viewer may see (blocked people's comments disappear both ways). */
export function visibleComments(viewerId: string | null | undefined, post: WallPost, g: SocialGraph) {
  if (!viewerId) return [];
  return post.comments.filter((c) => c.authorId === viewerId || !graphBlocked(g, viewerId, c.authorId, viewerId));
}
