/**
 * Wall store (Φ26): posts, reactions, comments, custom audience lists and
 * per-user wall privacy. Every write re-checks permissions here (not only in
 * the UI), so the AI copilot or any other caller gets the same rules.
 *
 * Kept separate from the main store (like chatStore) so the social layer has
 * its own persistence key and the main store stays manageable.
 */
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../lib/safeStorage';
import { useStore } from './index';
import type {
  Audience,
  AudienceList,
  CommentDraft,
  ReactionKind,
  WallActivity,
  WallActivityKind,
  WallComment,
  WallPost,
  WallPrivacySettings,
} from '../types/wall';
import { AUDIENCE_BASES_FOR, DEFAULT_WALL_PRIVACY, MAX_TAGS, REACTION_KINDS } from '../types/wall';
import { mockAudienceLists, mockWallActivity, mockWallPosts, mockWallPrivacy } from '../data/mockWall';
import { isPlatformAdmin } from '../lib/roles';
import {
  AUDIENCE_RANK,
  canCommentOnPost,
  canPostOnWall,
  canViewPost,
  normalizeAudience,
  wallPrivacyOf,
  type SocialGraph,
  type WallAccessContext,
} from '../lib/audience';

export const POST_MAX_CHARS = 2000;
export const COMMENT_MAX_CHARS = 1000;
export const LIST_NAME_MAX_CHARS = 40;
/** Anti-spam: at most this many posts per window. */
export const POST_RATE_LIMIT = { count: 10, windowMs: 10 * 60_000 };

export type WallResult =
  | { ok: true; id?: string; reasonEl?: undefined; reasonEn?: undefined }
  | { ok: false; id?: undefined; reasonEl: string; reasonEn: string };

const fail = (reasonEl: string, reasonEn: string): WallResult => ({ ok: false, reasonEl, reasonEn });

interface WallState {
  posts: WallPost[];
  lists: AudienceList[];
  privacyByUser: Record<string, WallPrivacySettings>;
  /** viewerId → posts hidden from their own feed. */
  hiddenPostIds: Record<string, string[]>;
  /** viewerId → posts bookmarked for later (their own saved list). */
  savedPostIds: Record<string, string[]>;
  /** viewerId → ISO time the feed was last opened (for «νέες δημοσιεύσεις»). */
  feedSeenAt: Record<string, string>;
  /** Everyone's wall activity (each entry has a recipient); newest first, capped. */
  activity: WallActivity[];

  createPost: (input: {
    wallOwnerId?: string;
    text: string;
    imageUrl?: string;
    eventId?: string;
    audience?: Audience;
    taggedIds?: string[];
  }) => WallResult;
  updatePost: (
    postId: string,
    patch: { text?: string; audience?: Audience; commentsDisabled?: boolean; taggedIds?: string[] },
  ) => WallResult;
  /** The viewer removes their own tag from a post. */
  removeMyTag: (postId: string) => WallResult;
  /** The viewer lets a post they are tagged in appear on their profile. */
  approveTag: (postId: string) => WallResult;
  markActivityRead: (ids?: string[]) => void;
  /** Report a post to the safety team (also hides it for the reporter). */
  reportPost: (postId: string, reason: string) => WallResult;
  /** Admins only: remove a post (author keeps seeing it with a notice) or restore it. */
  moderatePost: (postId: string, action: 'remove' | 'restore', reasonEl?: string, reasonEn?: string) => WallResult;
  deletePost: (postId: string) => WallPost | null;
  restorePost: (post: WallPost) => void;
  togglePin: (postId: string) => WallResult;
  react: (postId: string, kind: ReactionKind | null) => WallResult;
  addComment: (postId: string, text: string, extra?: CommentDraft) => WallResult;
  updateComment: (postId: string, commentId: string, patch: { text: string }) => WallResult;
  reactToComment: (postId: string, commentId: string, emoji: string | null) => WallResult;
  deleteComment: (postId: string, commentId: string) => WallComment | null;
  restoreComment: (postId: string, comment: WallComment) => void;
  hidePost: (postId: string) => void;
  unhidePost: (postId: string) => void;
  /** Bookmark/unbookmark a post for the viewer's saved list. Returns the new state. */
  toggleSavedPost: (postId: string) => boolean;
  /** Narrows the viewer's public / friends-of-friends posts to connections. Returns previous audiences for Undo. */
  limitPastPosts: () => Record<string, Audience>;
  restoreAudiences: (previous: Record<string, Audience>) => void;

  createList: (name: string, memberIds: string[]) => WallResult;
  updateList: (listId: string, patch: { name?: string; memberIds?: string[] }) => WallResult;
  deleteList: (listId: string) => void;

  updateWallPrivacy: (patch: Partial<Omit<WallPrivacySettings, 'sections'>> & { sections?: Partial<WallPrivacySettings['sections']> }) => void;
  markFeedSeen: () => void;
}

/* ───────────────────────── graph helpers ───────────────────────── */

/** Live social graph from the main store + this store's lists. */
export function buildSocialGraph(lists: AudienceList[] = useWallStore.getState().lists): SocialGraph {
  const s = useStore.getState();
  return {
    users: s.users,
    lists,
    viewerBlockedIds: s.blockedUserIds,
    suspendedUserIds: s.suspendedUserIds,
  };
}

export function wallAccessContext(): WallAccessContext {
  const w = useWallStore.getState();
  return { graph: buildSocialGraph(w.lists), privacyByUser: w.privacyByUser };
}

/** Memoized access context for components (re-computes when any input changes). */
export function useWallAccess(): WallAccessContext {
  const users = useStore((s) => s.users);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const suspendedUserIds = useStore((s) => s.suspendedUserIds);
  const lists = useWallStore((s) => s.lists);
  const privacyByUser = useWallStore((s) => s.privacyByUser);
  return useMemo(
    () => ({
      graph: { users, lists, viewerBlockedIds: blockedUserIds, suspendedUserIds },
      privacyByUser,
    }),
    [users, lists, blockedUserIds, suspendedUserIds, privacyByUser],
  );
}

function viewerId(): string | null {
  return useStore.getState().currentUser?.id ?? null;
}

let idSeq = 0;
function newId(prefix: string): string {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}${idSeq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Lists must only hold connections of the owner and exist once. */
function cleanMembers(ownerId: string, ids: string[], g: SocialGraph): string[] {
  const owner = g.users.find((u) => u.id === ownerId);
  const conns = new Set(owner?.connections ?? []);
  for (const u of g.users) if ((u.connections ?? []).includes(ownerId)) conns.add(u.id);
  return [...new Set(ids)].filter((id) => id !== ownerId && conns.has(id));
}

/** Tags are a de-duplicated subset of the author's connections. */
function cleanTags(authorId: string, ids: string[] | undefined, g: SocialGraph): string[] {
  return cleanMembers(authorId, ids ?? [], g).slice(0, MAX_TAGS);
}

const ACTIVITY_CAP = 300;

function makeActivity(
  kind: WallActivityKind,
  recipientId: string,
  actorId: string,
  postId: string,
  extra: Partial<Pick<WallActivity, 'reaction' | 'excerpt'>> = {},
): WallActivity {
  return {
    id: newId('wa'),
    recipientId,
    actorId,
    kind,
    postId,
    createdAt: new Date().toISOString(),
    read: false,
    ...extra,
  };
}

/** New activity first; one reaction entry per (actor, post); capped. */
function pushActivity(list: WallActivity[], items: WallActivity[]): WallActivity[] {
  if (items.length === 0) return list;
  const replacedReactions = new Set(items.filter((a) => a.kind === 'reaction').map((a) => `${a.actorId}|${a.postId}|${a.recipientId}`));
  const rest = list.filter((a) => !(a.kind === 'reaction' && replacedReactions.has(`${a.actorId}|${a.postId}|${a.recipientId}`)));
  return [...items, ...rest].slice(0, ACTIVITY_CAP);
}

const excerptOf = (text: string) => (text.length > 80 ? `${text.slice(0, 80).trimEnd()}…` : text);

/** Specific / list audiences must point at things the owner actually has. */
function sanitizeAudience(ownerId: string, a: Audience | undefined, lists: AudienceList[], allowed = AUDIENCE_BASES_FOR.post): Audience {
  const norm = normalizeAudience(a, allowed);
  if (norm.base === 'list' && !lists.some((l) => l.id === norm.listId && l.ownerId === ownerId)) {
    return { base: 'connections' };
  }
  if (norm.base === 'specific') {
    const g = buildSocialGraph(lists);
    const ids = cleanMembers(ownerId, norm.includeIds ?? [], g);
    return ids.length ? { base: 'specific', includeIds: ids } : { base: 'only_me' };
  }
  return norm;
}

/* ───────────────────────── storage ───────────────────────── */

/** Never let a full device storage crash the app (photos are the big items). */

/* ───────────────────────── store ───────────────────────── */

export const useWallStore = create<WallState>()(
  persist(
    (set, get) => ({
      posts: mockWallPosts,
      lists: mockAudienceLists,
      privacyByUser: mockWallPrivacy,
      hiddenPostIds: {},
      savedPostIds: {},
      feedSeenAt: {},
      activity: mockWallActivity,

      createPost: (input) => {
        const me = viewerId();
        if (!me) return fail('Σύνδεση απαιτείται', 'Sign in required');
        const ownerId = input.wallOwnerId ?? me;
        const text = (input.text ?? '').trim();
        if (!text && !input.imageUrl && !input.eventId) {
          return fail('Γράψε κάτι ή πρόσθεσε φωτογραφία/εκδήλωση.', 'Write something or add a photo/event.');
        }
        if (text.length > POST_MAX_CHARS) {
          return fail(`Έως ${POST_MAX_CHARS} χαρακτήρες.`, `Up to ${POST_MAX_CHARS} characters.`);
        }
        if (input.imageUrl && !input.imageUrl.startsWith('data:image/') && !/^https:\/\//.test(input.imageUrl)) {
          return fail('Μη έγκυρη εικόνα.', 'Invalid image.');
        }
        if (input.eventId && !useStore.getState().events.some((e) => e.id === input.eventId)) {
          return fail('Η εκδήλωση δεν βρέθηκε.', 'Event not found.');
        }
        const ctx = wallAccessContext();
        const gate = canPostOnWall(me, ownerId, ctx);
        if (!gate.allowed) return fail(gate.reasonEl, gate.reasonEn);
        const now = Date.now();
        const recent = get().posts.filter(
          (p) => p.authorId === me && now - Date.parse(p.createdAt) < POST_RATE_LIMIT.windowMs,
        ).length;
        if (recent >= POST_RATE_LIMIT.count) {
          return fail('Πολλές δημοσιεύσεις σε λίγο χρόνο — δοκίμασε σε λίγα λεπτά.', 'Too many posts in a short time — try again in a few minutes.');
        }
        const audience =
          ownerId === me
            ? sanitizeAudience(me, input.audience ?? wallPrivacyOf(get().privacyByUser, me).defaultAudience, get().lists)
            : // Others' posts follow the wall owner's setting; store a display snapshot.
              wallPrivacyOf(get().privacyByUser, ownerId).othersPostsAudience;
        const taggedIds = cleanTags(me, input.taggedIds, ctx.graph);
        const post: WallPost = {
          id: newId('wp'),
          authorId: me,
          wallOwnerId: ownerId,
          text,
          ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
          ...(input.eventId ? { eventId: input.eventId } : {}),
          ...(taggedIds.length ? { taggedIds } : {}),
          audience,
          createdAt: new Date(now).toISOString(),
          reactions: {},
          comments: [],
        };
        const notes = [
          ...(ownerId !== me ? [makeActivity('wall_post', ownerId, me, post.id, { excerpt: excerptOf(text) })] : []),
          ...taggedIds.filter((id) => id !== ownerId).map((id) => makeActivity('tag', id, me, post.id, { excerpt: excerptOf(text) })),
        ];
        set((s) => ({ posts: [post, ...s.posts], activity: pushActivity(s.activity, notes) }));
        return { ok: true, id: post.id };
      },

      updatePost: (postId, patch) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return fail('Η δημοσίευση δεν βρέθηκε.', 'Post not found.');
        const isAuthor = post.authorId === me;
        const isOwner = post.wallOwnerId === me;
        if ((patch.text !== undefined || patch.audience !== undefined) && !isAuthor) {
          return fail('Μόνο ο συντάκτης μπορεί να την αλλάξει.', 'Only the author can change it.');
        }
        if (patch.commentsDisabled !== undefined && !isAuthor && !isOwner) {
          return fail('Δεν επιτρέπεται.', 'Not allowed.');
        }
        const next: WallPost = { ...post };
        if (patch.text !== undefined) {
          const text = patch.text.trim();
          if (!text && !post.imageUrl && !post.eventId) return fail('Η δημοσίευση δεν μπορεί να μείνει κενή.', 'A post cannot be empty.');
          if (text.length > POST_MAX_CHARS) return fail(`Έως ${POST_MAX_CHARS} χαρακτήρες.`, `Up to ${POST_MAX_CHARS} characters.`);
          if (text !== post.text) {
            next.text = text;
            next.editedAt = new Date().toISOString();
          }
        }
        if (patch.audience !== undefined) {
          if (post.wallOwnerId !== post.authorId) {
            return fail('Το κοινό ορίζεται από τον κάτοχο του τοίχου.', "The wall owner's setting decides who sees it.");
          }
          next.audience = sanitizeAudience(me, patch.audience, get().lists);
        }
        if (patch.commentsDisabled !== undefined) next.commentsDisabled = patch.commentsDisabled;
        let notes: WallActivity[] = [];
        if (patch.taggedIds !== undefined) {
          if (!isAuthor) return fail('Μόνο ο συντάκτης αλλάζει τις ετικέτες.', 'Only the author changes tags.');
          const tags = cleanTags(me, patch.taggedIds, buildSocialGraph());
          const before = new Set(post.taggedIds ?? []);
          next.taggedIds = tags;
          next.tagApprovedIds = (post.tagApprovedIds ?? []).filter((id) => tags.includes(id));
          notes = tags.filter((id) => !before.has(id)).map((id) => makeActivity('tag', id, me, postId, { excerpt: excerptOf(next.text) }));
        }
        set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? next : p)), activity: pushActivity(s.activity, notes) }));
        return { ok: true, id: postId };
      },

      deletePost: (postId) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return null;
        // The author, or the person whose wall it is, can remove it.
        if (post.authorId !== me && post.wallOwnerId !== me) return null;
        set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) }));
        return post;
      },

      restorePost: (post) =>
        set((s) => (s.posts.some((p) => p.id === post.id) ? s : { posts: [post, ...s.posts] })),

      togglePin: (postId) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return fail('Η δημοσίευση δεν βρέθηκε.', 'Post not found.');
        if (post.wallOwnerId !== me) return fail('Καρφιτσώνεις μόνο στον δικό σου τοίχο.', 'You can only pin on your own wall.');
        const pin = !post.pinned;
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId ? { ...p, pinned: pin } : p.wallOwnerId === me && p.pinned && pin ? { ...p, pinned: false } : p,
          ),
        }));
        return { ok: true, id: postId };
      },

      react: (postId, kind) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return fail('Η δημοσίευση δεν βρέθηκε.', 'Post not found.');
        if (!canViewPost(me, post, wallAccessContext())) return fail('Δεν είναι διαθέσιμο.', 'Not available.');
        if (kind !== null && !REACTION_KINDS.includes(kind)) return fail('Άγνωστη αντίδραση.', 'Unknown reaction.');
        const adding = kind !== null && post.reactions[me] !== kind;
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const reactions = { ...p.reactions };
            if (kind === null || reactions[me] === kind) delete reactions[me];
            else reactions[me] = kind;
            return { ...p, reactions };
          }),
          activity:
            adding && post.authorId !== me
              ? pushActivity(s.activity, [makeActivity('reaction', post.authorId, me, postId, { reaction: kind })])
              : // Taking a reaction back also takes back its notification.
                s.activity.filter((a) => !(a.kind === 'reaction' && a.actorId === me && a.postId === postId)),
        }));
        return { ok: true, id: postId };
      },

      addComment: (postId, raw, extra) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return fail('Η δημοσίευση δεν βρέθηκε.', 'Post not found.');
        const text = raw.trim();
        const hasMedia = Boolean(extra?.imageUrl || extra?.gifUrl);
        if (!text && !hasMedia) return fail('Γράψε ένα σχόλιο.', 'Write a comment.');
        if (text.length > COMMENT_MAX_CHARS) return fail(`Έως ${COMMENT_MAX_CHARS} χαρακτήρες.`, `Up to ${COMMENT_MAX_CHARS} characters.`);
        if (extra?.parentId && !post.comments.some((c) => c.id === extra.parentId)) {
          return fail('Το σχόλιο δεν βρέθηκε.', 'Comment not found.');
        }
        const gate = canCommentOnPost(me, post, wallAccessContext());
        if (!gate.allowed) return fail(gate.reasonEl, gate.reasonEn);
        const parentAuthor = extra?.parentId ? post.comments.find((c) => c.id === extra.parentId)?.authorId : undefined;
        const comment: WallComment = {
          id: newId('wc'),
          authorId: me,
          text,
          createdAt: new Date().toISOString(),
          ...(extra?.imageUrl ? { imageUrl: extra.imageUrl } : {}),
          ...(extra?.gifUrl ? { gifUrl: extra.gifUrl, ...(extra.gifFallbackUrl ? { gifFallbackUrl: extra.gifFallbackUrl } : {}) } : {}),
          ...(extra?.parentId ? { parentId: extra.parentId } : {}),
          ...(extra?.mentionIds?.length ? { mentionIds: [...new Set(extra.mentionIds)] } : {}),
        };
        const recipients = [...new Set([post.authorId, post.wallOwnerId, parentAuthor])].filter(
          (id): id is string => Boolean(id) && id !== me,
        );
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)),
          activity: pushActivity(
            s.activity,
            recipients.map((r) => makeActivity('comment', r, me, postId, { excerpt: excerptOf(text || '📎') })),
          ),
        }));
        return { ok: true, id: comment.id };
      },

      updateComment: (postId, commentId, patch) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        const comment = post?.comments.find((c) => c.id === commentId);
        if (!me || !post || !comment) return fail('Το σχόλιο δεν βρέθηκε.', 'Comment not found.');
        if (comment.authorId !== me) return fail('Επεξεργάζεσαι μόνο τα δικά σου σχόλια.', 'You can only edit your own comments.');
        if (!canViewPost(me, post, wallAccessContext())) return fail('Δεν είναι διαθέσιμο.', 'Not available.');
        const text = patch.text.trim();
        if (!text && !comment.imageUrl && !comment.gifUrl) return fail('Γράψε ένα σχόλιο.', 'Write a comment.');
        if (text.length > COMMENT_MAX_CHARS) return fail(`Έως ${COMMENT_MAX_CHARS} χαρακτήρες.`, `Up to ${COMMENT_MAX_CHARS} characters.`);
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId ? { ...c, text, editedAt: new Date().toISOString() } : c,
                  ),
                }
              : p,
          ),
        }));
        return { ok: true, id: commentId };
      },

      reactToComment: (postId, commentId, emoji) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        const comment = post?.comments.find((c) => c.id === commentId);
        if (!me || !post || !comment) return fail('Το σχόλιο δεν βρέθηκε.', 'Comment not found.');
        if (!canViewPost(me, post, wallAccessContext())) return fail('Δεν είναι διαθέσιμο.', 'Not available.');
        if (emoji !== null && (emoji.length === 0 || emoji.length > 8)) return fail('Άγνωστη αντίδραση.', 'Unknown reaction.');
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              comments: p.comments.map((c) => {
                if (c.id !== commentId) return c;
                const reactions = { ...(c.reactions ?? {}) };
                if (emoji === null || reactions[me] === emoji) delete reactions[me];
                else reactions[me] = emoji;
                return { ...c, reactions };
              }),
            };
          }),
        }));
        return { ok: true, id: commentId };
      },

      deleteComment: (postId, commentId) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        const comment = post?.comments.find((c) => c.id === commentId);
        if (!me || !post || !comment) return null;
        if (comment.authorId !== me && post.authorId !== me && post.wallOwnerId !== me) return null;
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) } : p)),
        }));
        return comment;
      },

      restoreComment: (postId, comment) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId && !p.comments.some((c) => c.id === comment.id)
              ? { ...p, comments: [...p.comments, comment].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }
              : p,
          ),
        })),

      removeMyTag: (postId) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post || !(post.taggedIds ?? []).includes(me)) return fail('Δεν υπάρχει ετικέτα σου εδώ.', 'You are not tagged here.');
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? { ...p, taggedIds: (p.taggedIds ?? []).filter((id) => id !== me), tagApprovedIds: (p.tagApprovedIds ?? []).filter((id) => id !== me) }
              : p,
          ),
          activity: s.activity.filter((a) => !(a.kind === 'tag' && a.recipientId === me && a.postId === postId)),
        }));
        return { ok: true, id: postId };
      },

      approveTag: (postId) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post || !(post.taggedIds ?? []).includes(me)) return fail('Δεν υπάρχει ετικέτα σου εδώ.', 'You are not tagged here.');
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId && !(p.tagApprovedIds ?? []).includes(me) ? { ...p, tagApprovedIds: [...(p.tagApprovedIds ?? []), me] } : p,
          ),
          activity: s.activity.map((a) => (a.kind === 'tag' && a.recipientId === me && a.postId === postId ? { ...a, read: true } : a)),
        }));
        return { ok: true, id: postId };
      },

      markActivityRead: (ids) => {
        const me = viewerId();
        if (!me) return;
        const only = ids ? new Set(ids) : null;
        set((s) => ({
          activity: s.activity.map((a) => (a.recipientId === me && !a.read && (!only || only.has(a.id)) ? { ...a, read: true } : a)),
        }));
      },

      reportPost: (postId, reason) => {
        const me = viewerId();
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return fail('Η δημοσίευση δεν βρέθηκε.', 'Post not found.');
        if (post.authorId === me) return fail('Δεν αναφέρεις δική σου δημοσίευση.', 'You cannot report your own post.');
        const reportId = useStore.getState().submitIssueReport({
          category: 'user_behavior',
          severity: 'medium',
          description: `${reason.trim().slice(0, 200) || 'Wall post'} — «${post.text.slice(0, 200)}»`,
          evidenceNames: [],
          targetType: 'wall_post',
          targetId: post.id,
          targetUserId: post.authorId,
        });
        get().hidePost(postId);
        return { ok: true, id: reportId };
      },

      moderatePost: (postId, action, reasonEl, reasonEn) => {
        const main = useStore.getState();
        const me = main.currentUser;
        const post = get().posts.find((p) => p.id === postId);
        if (!me || !post) return fail('Η δημοσίευση δεν βρέθηκε.', 'Post not found.');
        if (!isPlatformAdmin(me)) return fail('Μόνο για τη συντονιστική ομάδα.', 'Moderators only.');
        if (action === 'remove') {
          const moderation = {
            status: 'removed' as const,
            at: new Date().toISOString(),
            reasonEl: reasonEl?.trim() || 'Παραβιάζει τους κανόνες κοινότητας',
            reasonEn: reasonEn?.trim() || 'Breaks the community rules',
          };
          set((s) => ({
            posts: s.posts.map((p) => (p.id === postId ? { ...p, moderation, pinned: false } : p)),
            activity: pushActivity(s.activity, [makeActivity('moderation', post.authorId, me.id, postId, { excerpt: excerptOf(post.text) })]),
          }));
        } else {
          set((s) => ({ posts: s.posts.map((p) => (p.id === postId ? { ...p, moderation: undefined } : p)) }));
        }
        main.logAdminAction(action === 'remove' ? 'wall_post_removed' : 'wall_post_restored', postId);
        for (const r of main.issueReports) {
          if (r.targetType === 'wall_post' && r.targetId === postId && (r.status === 'open' || r.status === 'reviewing')) {
            main.resolveIssueReport(r.id, action === 'remove' ? 'resolved' : 'dismissed');
          }
        }
        return { ok: true, id: postId };
      },

      hidePost: (postId) => {
        const me = viewerId();
        if (!me) return;
        set((s) => {
          const cur = s.hiddenPostIds[me] ?? [];
          return cur.includes(postId) ? s : { hiddenPostIds: { ...s.hiddenPostIds, [me]: [...cur, postId] } };
        });
      },

      unhidePost: (postId) => {
        const me = viewerId();
        if (!me) return;
        set((s) => ({ hiddenPostIds: { ...s.hiddenPostIds, [me]: (s.hiddenPostIds[me] ?? []).filter((id) => id !== postId) } }));
      },

      toggleSavedPost: (postId) => {
        const me = viewerId();
        if (!me) return false;
        let saved = false;
        set((s) => {
          const cur = s.savedPostIds[me] ?? [];
          saved = !cur.includes(postId);
          return { savedPostIds: { ...s.savedPostIds, [me]: saved ? [...cur, postId] : cur.filter((id) => id !== postId) } };
        });
        return saved;
      },

      limitPastPosts: () => {
        const me = viewerId();
        if (!me) return {};
        const previous: Record<string, Audience> = {};
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.authorId !== me || p.wallOwnerId !== me) return p;
            if (AUDIENCE_RANK[p.audience.base] <= AUDIENCE_RANK.connections) return p;
            previous[p.id] = p.audience;
            const ex = p.audience.excludeIds;
            return { ...p, audience: ex?.length ? { base: 'connections', excludeIds: ex } : { base: 'connections' } };
          }),
        }));
        return previous;
      },

      restoreAudiences: (previous) =>
        set((s) => ({ posts: s.posts.map((p) => (previous[p.id] ? { ...p, audience: previous[p.id] } : p)) })),

      createList: (rawName, memberIds) => {
        const me = viewerId();
        if (!me) return fail('Σύνδεση απαιτείται', 'Sign in required');
        const name = rawName.trim().slice(0, LIST_NAME_MAX_CHARS);
        if (!name) return fail('Δώσε όνομα στη λίστα.', 'Give the list a name.');
        if (get().lists.some((l) => l.ownerId === me && l.name.toLowerCase() === name.toLowerCase())) {
          return fail('Υπάρχει ήδη λίστα με αυτό το όνομα.', 'A list with this name already exists.');
        }
        const list: AudienceList = {
          id: newId('al'),
          ownerId: me,
          name,
          memberIds: cleanMembers(me, memberIds, buildSocialGraph()),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ lists: [...s.lists, list] }));
        return { ok: true, id: list.id };
      },

      updateList: (listId, patch) => {
        const me = viewerId();
        const list = get().lists.find((l) => l.id === listId);
        if (!me || !list || list.ownerId !== me) return fail('Η λίστα δεν βρέθηκε.', 'List not found.');
        const name = patch.name !== undefined ? patch.name.trim().slice(0, LIST_NAME_MAX_CHARS) : list.name;
        if (!name) return fail('Δώσε όνομα στη λίστα.', 'Give the list a name.');
        const memberIds = patch.memberIds !== undefined ? cleanMembers(me, patch.memberIds, buildSocialGraph()) : list.memberIds;
        set((s) => ({ lists: s.lists.map((l) => (l.id === listId ? { ...l, name, memberIds } : l)) }));
        return { ok: true, id: listId };
      },

      deleteList: (listId) => {
        const me = viewerId();
        const list = get().lists.find((l) => l.id === listId);
        if (!me || !list || list.ownerId !== me) return;
        // Keep the intent of posts and settings that used the list: same people, named directly.
        const asSpecific: Audience = list.memberIds.length ? { base: 'specific', includeIds: list.memberIds } : { base: 'only_me' };
        const swap = (a: Audience): Audience => (a.base === 'list' && a.listId === listId ? asSpecific : a);
        set((s) => {
          const mine = wallPrivacyOf(s.privacyByUser, me);
          return {
            lists: s.lists.filter((l) => l.id !== listId),
            posts: s.posts.map((p) => (p.authorId === me ? { ...p, audience: swap(p.audience) } : p)),
            privacyByUser: {
              ...s.privacyByUser,
              [me]: {
                ...mine,
                defaultAudience: swap(mine.defaultAudience),
                whoCanPost: swap(mine.whoCanPost),
                othersPostsAudience: swap(mine.othersPostsAudience),
                whoCanComment: mine.whoCanComment,
                sections: {
                  about: swap(mine.sections.about),
                  interests: swap(mine.sections.interests),
                  connections: swap(mine.sections.connections),
                  events: swap(mine.sections.events),
                },
              },
            },
          };
        });
        // The profile audience lives in the main store.
        const priv = useStore.getState().userSettings.privacy;
        if (priv.profileAudience?.base === 'list' && priv.profileAudience.listId === listId) {
          useStore.getState().updatePrivacySettings({ profileAudience: asSpecific });
        }
      },

      updateWallPrivacy: (patch) => {
        const me = viewerId();
        if (!me) return;
        set((s) => {
          const cur = wallPrivacyOf(s.privacyByUser, me);
          const lists = s.lists;
          const next: WallPrivacySettings = {
            defaultAudience: patch.defaultAudience ? sanitizeAudience(me, patch.defaultAudience, lists) : cur.defaultAudience,
            whoCanPost: patch.whoCanPost
              ? sanitizeAudience(me, patch.whoCanPost, lists, AUDIENCE_BASES_FOR.whoCanPost)
              : cur.whoCanPost,
            othersPostsAudience: patch.othersPostsAudience
              ? sanitizeAudience(me, patch.othersPostsAudience, lists)
              : cur.othersPostsAudience,
            whoCanComment: patch.whoCanComment
              ? normalizeAudience(patch.whoCanComment, AUDIENCE_BASES_FOR.whoCanComment)
              : cur.whoCanComment,
            sections: { ...cur.sections },
            reviewTags: typeof patch.reviewTags === 'boolean' ? patch.reviewTags : cur.reviewTags,
          };
          for (const [k, v] of Object.entries(patch.sections ?? {})) {
            if (v) next.sections[k as keyof WallPrivacySettings['sections']] = sanitizeAudience(me, v, lists);
          }
          return { privacyByUser: { ...s.privacyByUser, [me]: next } };
        });
      },

      markFeedSeen: () => {
        const me = viewerId();
        if (!me) return;
        set((s) => ({ feedSeenAt: { ...s.feedSeenAt, [me]: new Date().toISOString() } }));
      },
    }),
    {
      name: 'nakamas-wall-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        posts: s.posts,
        lists: s.lists,
        privacyByUser: s.privacyByUser,
        hiddenPostIds: s.hiddenPostIds,
        savedPostIds: s.savedPostIds,
        feedSeenAt: s.feedSeenAt,
        activity: s.activity,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<WallState> | undefined;
        if (!p) return current;
        // Once saved, the saved list is authoritative: deleted posts and lists stay deleted.
        const mergeSeeds = <T extends { id: string }>(seeds: T[], saved: unknown): T[] =>
          Array.isArray(saved) ? (saved as T[]).filter((x) => x && typeof x.id === 'string') : seeds;
        const privacyByUser: Record<string, WallPrivacySettings> = { ...current.privacyByUser };
        for (const [uid, v] of Object.entries(p.privacyByUser ?? {})) {
          privacyByUser[uid] = wallPrivacyOf({ [uid]: v }, uid);
        }
        return {
          ...current,
          posts: mergeSeeds(current.posts, p.posts),
          lists: mergeSeeds(current.lists, p.lists),
          privacyByUser,
          hiddenPostIds: (p.hiddenPostIds as Record<string, string[]>) ?? {},
          savedPostIds: (p.savedPostIds as Record<string, string[]>) ?? {},
          feedSeenAt: (p.feedSeenAt as Record<string, string>) ?? {},
          activity: Array.isArray(p.activity) ? (p.activity as WallActivity[]) : current.activity,
        };
      },
    },
  ),
);

export { DEFAULT_WALL_PRIVACY };

/** Seed wall content, used on first load and when demo mode is exited. */
export function wallSeedState() {
  return {
    posts: mockWallPosts.map((p) => ({ ...p, reactions: { ...p.reactions }, comments: [...p.comments] })),
    lists: mockAudienceLists.map((l) => ({ ...l, memberIds: [...l.memberIds] })),
    privacyByUser: { ...mockWallPrivacy },
    hiddenPostIds: {} as Record<string, string[]>,
    savedPostIds: {} as Record<string, string[]>,
    feedSeenAt: {} as Record<string, string>,
    activity: mockWallActivity.map((a) => ({ ...a })),
  };
}

/* Demo exit («Έξοδος»): the demo wall returns to its original state. */
if (typeof window !== 'undefined') {
  window.addEventListener('nakamas:demo-reset', () => useWallStore.setState(wallSeedState()));
}
