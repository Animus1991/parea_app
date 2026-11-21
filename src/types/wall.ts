/**
 * Wall & audience model (Φ26).
 *
 * One `Audience` shape answers every "who can see / do this?" question on the
 * social layer: a post, a profile, a profile section, who may write on a wall
 * and who may comment. It mirrors the controls people already know from large
 * social networks, kept to what Nakamas needs.
 */

export type AudienceBase =
  /** Every signed-in Nakamas member. */
  | 'public'
  /** Mutual Nakamas connections only. */
  | 'connections'
  /** Connections plus their connections. */
  | 'friends_of_friends'
  /** Hand-picked connections (`includeIds`). */
  | 'specific'
  /** A saved custom list of connections (`listId`), e.g. «Κοντινοί φίλοι». */
  | 'list'
  /** Nobody but the owner. */
  | 'only_me';

export interface Audience {
  base: AudienceBase;
  /** `specific` → the chosen people (must also be connections). */
  includeIds?: string[];
  /** `list` → which of the owner's lists. */
  listId?: string;
  /**
   * "…except": people who never see it, on top of public / connections /
   * friends_of_friends / list. Ignored for `specific` and `only_me`.
   */
  excludeIds?: string[];
}

export const AUDIENCE_BASES: AudienceBase[] = ['public', 'connections', 'friends_of_friends', 'specific', 'list', 'only_me'];

export type ReactionKind =
  | 'like'
  | 'love'
  | 'haha'
  | 'wow'
  | 'sad'
  | 'fire'
  | 'clap'
  | 'going'
  | 'cheers'
  | 'party'
  | 'eyes'
  | 'hug'
  | 'think'
  | 'thanks'
  | 'toast'
  | 'star'
  | 'ticket'
  | 'music';

/** Keep in sync with firestore.rules `reactions.kind` and wallText REACTION_EMOJI. */
export const REACTION_KINDS: ReactionKind[] = [
  'like',
  'love',
  'haha',
  'wow',
  'sad',
  'fire',
  'clap',
  'going',
  'cheers',
  'party',
  'eyes',
  'hug',
  'think',
  'thanks',
  'toast',
  'star',
  'ticket',
  'music',
];

/**
 * Hover / long-press tray on a post — the five people expect from every
 * social app. Everything else lives in the comment composer.
 */
export const QUICK_POST_REACTIONS: ReactionKind[] = ['like', 'love', 'haha', 'wow', 'cheers'];

/** One-tap hearts on a comment (Instagram / Facebook style). */
export const COMMENT_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉'] as const;

export interface CommentDraft {
  imageUrl?: string;
  gifUrl?: string;
  gifFallbackUrl?: string;
  parentId?: string;
  mentionIds?: string[];
}

export interface WallComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  imageUrl?: string;
  gifUrl?: string;
  gifFallbackUrl?: string;
  /** Reply to another comment on the same post. */
  parentId?: string;
  mentionIds?: string[];
  /** userId → emoji. */
  reactions?: Record<string, string>;
}

export interface WallPost {
  id: string;
  authorId: string;
  /** Whose wall the post lives on (= authorId for one's own posts). */
  wallOwnerId: string;
  text: string;
  /** Downscaled JPEG data URL (see lib/imageResize). */
  imageUrl?: string;
  /** Optional event attached to the post («Πάω σε αυτό — ποιος έρχεται;»). */
  eventId?: string;
  /**
   * Who sees it. For a post on someone else's wall this is a snapshot for
   * display only: visibility follows the wall owner's current setting.
   */
  audience: Audience;
  createdAt: string;
  editedAt?: string;
  /** Pinned to the top of its wall (one per wall). */
  pinned?: boolean;
  commentsDisabled?: boolean;
  /** userId → reaction. */
  reactions: Record<string, ReactionKind>;
  comments: WallComment[];
  /**
   * People tagged «με …» (always connections of the author). A tagged person
   * always sees the post and can remove their tag.
   */
  taggedIds?: string[];
  /** Tagged people who approved showing the post on their own profile (tag review). */
  tagApprovedIds?: string[];
  /** Set by a moderator: removed posts stay visible only to their author (with a notice) and admins. */
  moderation?: { status: 'removed'; at: string; reasonEl: string; reasonEn: string };
}

/** Maximum people tagged in one post. */
export const MAX_TAGS = 20;

export type WallActivityKind = 'comment' | 'reaction' | 'wall_post' | 'tag' | 'moderation';

/** One line in someone's wall activity («Η Μαρία σχολίασε τη δημοσίευσή σου»). */
export interface WallActivity {
  id: string;
  recipientId: string;
  actorId: string;
  kind: WallActivityKind;
  postId: string;
  reaction?: ReactionKind;
  /** Short quote of the comment or post. */
  excerpt?: string;
  createdAt: string;
  read: boolean;
}

export interface AudienceList {
  id: string;
  ownerId: string;
  name: string;
  memberIds: string[];
  createdAt: string;
}

/** Profile parts that can each have their own audience. */
export type ProfileSectionKey = 'about' | 'interests' | 'connections' | 'events';

export const PROFILE_SECTION_KEYS: ProfileSectionKey[] = ['about', 'interests', 'connections', 'events'];

export interface WallPrivacySettings {
  /** Pre-selected audience in the composer for new posts. */
  defaultAudience: Audience;
  /** Who may write on my wall (bases: connections / specific / list / only_me). */
  whoCanPost: Audience;
  /** Who sees what other people write on my wall. */
  othersPostsAudience: Audience;
  /** Who may comment on my posts (bases: public / connections / friends_of_friends). */
  whoCanComment: Audience;
  /** Per-section visibility on my profile. */
  sections: Record<ProfileSectionKey, Audience>;
  /** Posts I am tagged in appear on my profile only after I approve them. */
  reviewTags: boolean;
}

export const DEFAULT_WALL_PRIVACY: WallPrivacySettings = {
  defaultAudience: { base: 'connections' },
  whoCanPost: { base: 'connections' },
  othersPostsAudience: { base: 'connections' },
  whoCanComment: { base: 'connections' },
  sections: {
    about: { base: 'public' },
    interests: { base: 'public' },
    connections: { base: 'connections' },
    events: { base: 'connections' },
  },
  reviewTags: true,
};

/** Bases offered by each picker (a wall never accepts posts from "everyone"). */
export const AUDIENCE_BASES_FOR = {
  post: AUDIENCE_BASES,
  profile: AUDIENCE_BASES,
  section: AUDIENCE_BASES,
  othersPosts: AUDIENCE_BASES,
  whoCanPost: ['connections', 'specific', 'list', 'only_me'] as AudienceBase[],
  whoCanComment: ['public', 'friends_of_friends', 'connections'] as AudienceBase[],
} as const;

export type AudienceContext = keyof typeof AUDIENCE_BASES_FOR;
