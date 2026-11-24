import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  Link2,
  ShieldAlert,
  ShieldCheck,
  Tag,
  UserMinus,
  UsersRound,
  ChevronRight,
  EyeOff,
  Flag,
  Lock,
  MessageSquareOff,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Users2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { POST_MAX_CHARS, useWallAccess, useWallStore } from '../../store/wallStore';
import { canCommentOnPost, tagShownOnProfile, visibleComments } from '../../lib/audience';
import { isPlatformAdmin } from '../../lib/roles';
import { RichText } from './RichText';
import { profilePathFor } from '../../lib/profileLinks';
import type { ReactionKind, WallComment, WallPost } from '../../types/wall';
import type { User } from '../../types';
import { cn } from '../../lib/utils';
import { AudienceChip } from './AudienceChip';
import { AudiencePickerModal } from './AudiencePickerModal';
import { PersonAvatar } from './PersonAvatar';
import { REACTION_EMOJI, reactionLabel, relativeTime } from './wallText';
import { OverflowMenu, type OverflowMenuItem } from './OverflowMenu';
import { PostReactionBar } from './PostReactionBar';
import { CommentComposer } from './CommentComposer';
import { CommentThread } from './CommentThread';
import { formatLocationArea } from '../../lib/eventDisplay';
import { FEELINGS, WALL_TEXT_BACKGROUNDS } from '../../lib/chatMediaCatalog';

const LONG_TEXT = 420;

/**
 * One wall post: who wrote it, where, for whom, and everything people can do
 * with it. Every action re-checks permissions in the store.
 */
const REPORT_REASONS: { id: string; el: string; en: string }[] = [
  { id: 'spam', el: 'Spam ή διαφήμιση', en: 'Spam or advertising' },
  { id: 'harassment', el: 'Παρενόχληση ή εκφοβισμός', en: 'Harassment or bullying' },
  { id: 'inappropriate', el: 'Ακατάλληλο περιεχόμενο', en: 'Inappropriate content' },
  { id: 'false', el: 'Ψευδείς πληροφορίες ή απάτη', en: 'False information or scam' },
  { id: 'safety', el: 'Κίνδυνος για την ασφάλεια', en: 'Safety risk' },
];

export function PostCard({
  post,
  viewerOverride,
  highlighted = false,
}: {
  post: WallPost;
  viewerOverride?: User | null;
  /** Opened from a notification or link: outline it once. */
  highlighted?: boolean;
}) {
  const { t, language } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const blockUser = useStore((s) => s.blockUser);
  const access = useWallAccess();
  const {
    react,
    deletePost,
    restorePost,
    updatePost,
    togglePin,
    hidePost,
    unhidePost,
    reportPost,
    moderatePost,
    approveTag,
    removeMyTag,
    toggleSavedPost,
    votePoll,
  } = useWallStore.getState();
  const savedByViewer = useWallStore((s) => s.savedPostIds);

  const viewer = viewerOverride === undefined ? me : viewerOverride;
  const readOnly = viewerOverride !== undefined; // «Δες ως…» preview
  const viewerId = viewer?.id ?? null;
  const savedIds = useMemo(() => (viewerId ? savedByViewer[viewerId] ?? [] : []), [savedByViewer, viewerId]);
  const author = users.find((u) => u.id === post.authorId);
  const owner = users.find((u) => u.id === post.wallOwnerId);
  const event = post.eventId ? events.find((e) => e.id === post.eventId) : undefined;
  const myEventGroup =
    me && event
      ? groups.find(
          (g) =>
            g.eventId === event.id &&
            g.status !== 'cancelled' &&
            (g.members.includes(me.id) || g.waitlist?.includes(me.id)),
        )
      : undefined;
  const authorRecruitingGroup =
    event && !myEventGroup
      ? groups.find(
          (g) =>
            g.eventId === event.id &&
            g.status !== 'cancelled' &&
            g.status !== 'completed' &&
            (g.hostId === post.authorId || g.members.includes(post.authorId)),
        )
      : undefined;
  const isAuthor = !readOnly && me?.id === post.authorId;
  const isOwner = !readOnly && me?.id === post.wallOwnerId;
  const onOtherWall = post.authorId !== post.wallOwnerId;

  const [expanded, setExpanded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [replyTo, setReplyTo] = useState<WallComment | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].id);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const comments = useMemo(() => visibleComments(viewerId, post, access.graph), [viewerId, post, access.graph]);
  const commentGate = viewerId ? canCommentOnPost(viewerId, post, access) : null;
  const mentionPeople = useMemo(() => {
    const ids = new Set<string>([
      post.authorId,
      post.wallOwnerId,
      ...(post.taggedIds ?? []),
      ...comments.map((c) => c.authorId),
      ...(me?.connections ?? []),
    ]);
    if (me) ids.delete(me.id);
    return users.filter((u) => ids.has(u.id)).map((u) => ({ id: u.id, name: u.name }));
  }, [post.authorId, post.wallOwnerId, post.taggedIds, comments, me, users]);

  const openComments = () => {
    setShowAllComments(true);
    setCommenting(true);
  };

  const reactionEntries = useMemo(
    () => Object.entries(post.reactions).filter(([uid]) => !viewerId || uid === viewerId || !access.graph.viewerBlockedIds?.includes(uid)),
    [post.reactions, viewerId, access.graph.viewerBlockedIds],
  );
  const topReactions = useMemo(() => {
    const counts = new Map<ReactionKind, number>();
    for (const [, k] of reactionEntries) counts.set(k, (counts.get(k) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [reactionEntries]);
  const myReaction = viewerId ? post.reactions[viewerId] : undefined;
  const postImages = post.imageUrls ?? (post.imageUrl ? [post.imageUrl] : []);
  const feeling = FEELINGS.find((item) => item.id === post.feeling);
  const background = WALL_TEXT_BACKGROUNDS.find((item) => item.id === post.bg);
  const authorGoingTogether = Boolean(myEventGroup?.members.includes(post.authorId));

  if (!author) return null;

  const run = (res: { ok: boolean; reasonEl?: string; reasonEn?: string }) => {
    if (!res.ok) toast.error(t(res.reasonEl ?? 'Δεν επιτρέπεται', res.reasonEn ?? 'Not allowed'));
    return res.ok;
  };

  const handleDelete = () => {
    const removed = deletePost(post.id);
    if (!removed) return;
    toast.success(isAuthor ? t('Η δημοσίευση διαγράφηκε', 'Post deleted') : t('Αφαιρέθηκε από τον τοίχο σου', 'Removed from your wall'), {
      action: { label: t('Αναίρεση', 'Undo'), onClick: () => restorePost(removed) },
    });
  };

  const handleHide = () => {
    hidePost(post.id);
    toast.success(t('Η δημοσίευση κρύφτηκε από τη ροή σου', 'Post hidden from your feed'), {
      action: { label: t('Αναίρεση', 'Undo'), onClick: () => unhidePost(post.id) },
    });
  };

  const handleReport = () => {
    const reason = REPORT_REASONS.find((r) => r.id === reportReason) ?? REPORT_REASONS[0];
    const res = reportPost(post.id, reason.en);
    setReportOpen(false);
    if (!run(res)) return;
    toast.success(t('Ευχαριστούμε — η ομάδα ασφαλείας θα το εξετάσει. Η δημοσίευση κρύφτηκε για σένα.', 'Thanks — the safety team will review it. The post is hidden for you.'), {
      action: { label: t('Εμφάνιση ξανά', 'Show again'), onClick: () => unhidePost(post.id) },
    });
  };

  const isAdmin = !readOnly && isPlatformAdmin(me);
  const removed = post.moderation?.status === 'removed';
  const iAmTagged = Boolean(!readOnly && me && (post.taggedIds ?? []).includes(me.id));
  const myTagShown = iAmTagged && me ? tagShownOnProfile(post, me.id, access.privacyByUser) : false;
  const tagged = (post.taggedIds ?? []).map((id) => users.find((u) => u.id === id)).filter((u): u is User => Boolean(u));

  const handleBlock = () => {
    blockUser(author.id);
    toast.success(t(`Αποκλείστηκε ο/η ${author.name}. Δεν θα βλέπετε ο ένας τον άλλον.`, `Blocked ${author.name}. You will not see each other.`));
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/wall?post=${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t('Ο σύνδεσμος αντιγράφηκε', 'Link copied'));
    } catch {
      toast.success(url);
    }
  };

  const menuItems: OverflowMenuItem[] = [];
  if (!readOnly && me) {
    if (isAuthor) {
      menuItems.push({ key: 'edit', icon: Pencil, label: t('Επεξεργασία', 'Edit'), onSelect: () => { setEditText(post.text); setEditing(true); } });
      if (!onOtherWall) menuItems.push({ key: 'aud', icon: Users2, label: t('Αλλαγή κοινού', 'Change audience'), onSelect: () => setAudienceOpen(true) });
    }
    if (isOwner) {
      menuItems.push({
        key: 'pin',
        icon: post.pinned ? PinOff : Pin,
        label: post.pinned ? t('Ξεκαρφίτσωμα', 'Unpin') : t('Καρφίτσωμα στην κορυφή του τοίχου', 'Pin to the top of your wall'),
        onSelect: () => run(togglePin(post.id)) && toast.success(post.pinned ? t('Ξεκαρφιτσώθηκε', 'Unpinned') : t('Καρφιτσώθηκε', 'Pinned')),
      });
    }
    if (iAmTagged && !isAuthor) {
      if (!myTagShown) {
        menuItems.push({
          key: 'approve-tag',
          icon: Tag,
          label: t('Εμφάνιση στο προφίλ μου', 'Show on my profile'),
          onSelect: () => run(approveTag(post.id)) && toast.success(t('Εμφανίζεται πλέον στο προφίλ σου', 'Now shown on your profile')),
        });
      }
      menuItems.push({
        key: 'untag',
        icon: UserMinus,
        label: t('Αφαίρεση της ετικέτας μου', 'Remove my tag'),
        onSelect: () => run(removeMyTag(post.id)) && toast.success(t('Η ετικέτα σου αφαιρέθηκε', 'Your tag was removed')),
      });
    }
    menuItems.push({
      key: 'save',
      icon: savedIds.includes(post.id) ? BookmarkCheck : Bookmark,
      label: savedIds.includes(post.id) ? t('Αφαίρεση από αποθηκευμένες', 'Remove from saved') : t('Αποθήκευση δημοσίευσης', 'Save post'),
      onSelect: () => toast.success(toggleSavedPost(post.id) ? t('Αποθηκεύτηκε', 'Saved') : t('Αφαιρέθηκε από τις αποθηκευμένες', 'Removed from saved')),
    });
    menuItems.push({
      key: 'copy',
      icon: Link2,
      label: t('Αντιγραφή συνδέσμου', 'Copy link'),
      onSelect: () => {
        const url = `${window.location.origin}/wall?post=${post.id}`;
        void navigator.clipboard?.writeText(url).then(
          () => toast.success(t('Ο σύνδεσμος αντιγράφηκε', 'Link copied')),
          () => toast.success(url),
        );
      },
    });
    if (isAuthor || isOwner) {
      menuItems.push({
        key: 'comments',
        icon: MessageSquareOff,
        label: post.commentsDisabled ? t('Άνοιγμα σχολίων', 'Turn on comments') : t('Κλείσιμο σχολίων', 'Turn off comments'),
        onSelect: () =>
          run(updatePost(post.id, { commentsDisabled: !post.commentsDisabled })) &&
          toast.success(post.commentsDisabled ? t('Τα σχόλια άνοιξαν', 'Comments on') : t('Τα σχόλια έκλεισαν', 'Comments off')),
      });
      menuItems.push({
        key: 'delete',
        icon: Trash2,
        label: isAuthor ? t('Διαγραφή', 'Delete') : t('Αφαίρεση από τον τοίχο μου', 'Remove from my wall'),
        onSelect: handleDelete,
        danger: true,
      });
    } else {
      menuItems.push({ key: 'hide', icon: EyeOff, label: t('Απόκρυψη από τη ροή μου', 'Hide from my feed'), onSelect: handleHide });
      menuItems.push({ key: 'report', icon: Flag, label: t('Αναφορά δημοσίευσης', 'Report post'), onSelect: () => setReportOpen(true), danger: true });
      menuItems.push({ key: 'block', icon: Ban, label: t(`Αποκλεισμός ${author.name}`, `Block ${author.name}`), onSelect: handleBlock, danger: true });
    }
    if (isAdmin && !isAuthor) {
      menuItems.push(
        removed
          ? { key: 'mod-restore', icon: ShieldCheck, label: t('Επαναφορά (συντονισμός)', 'Restore (moderation)'), onSelect: () => run(moderatePost(post.id, 'restore')) && toast.success(t('Η δημοσίευση επανήλθε', 'Post restored')) }
          : { key: 'mod-remove', icon: ShieldAlert, label: t('Αφαίρεση (συντονισμός)', 'Remove (moderation)'), onSelect: () => run(moderatePost(post.id, 'remove')) && toast.success(t('Η δημοσίευση αφαιρέθηκε για όλους εκτός του συντάκτη', 'Post removed for everyone but its author')), danger: true },
      );
    }
  }

  const text = post.text;
  const long = text.length > LONG_TEXT;
  const shownText = long && !expanded ? `${text.slice(0, LONG_TEXT).trimEnd()}…` : text;

  return (
    <Card
      className={cn('border-border/60 p-0 scroll-mt-24', highlighted && 'ring-2 ring-accent')}
      data-testid="wall-post"
      data-post-id={post.id}
      id={`post-${post.id}`}
    >
      <article aria-label={t(`Δημοσίευση από ${author.name}`, `Post by ${author.name}`)} className="p-4">
        <header className="flex items-start gap-3">
          <Link
            to={profilePathFor(author)}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={authorGoingTogether ? t(`${author.name}, πάτε μαζί`, `${author.name}, going together`) : author.name}
          >
            <PersonAvatar
              user={author}
              viewer={viewer}
              ring={authorGoingTogether}
              title={authorGoingTogether ? t('Πάτε μαζί', 'Going together') : undefined}
            />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-semibold leading-snug text-ink">
              <Link to={profilePathFor(author)} className="tap-area-y hover:underline">
                {author.name}
              </Link>
              {feeling && <span className="ml-1 font-normal text-ink-muted">· {feeling.emoji} {t(feeling.el, feeling.en)}</span>}
              {post.location && <span className="ml-1 font-normal text-ink-muted">· 📍 {post.location}</span>}
              {onOtherWall && owner && (
                <>
                  <ChevronRight className="mx-0.5 inline h-3.5 w-3.5 text-ink-muted" aria-hidden />
                  <span className="sr-only">{t(' στον τοίχο του/της ', ' on the wall of ')}</span>
                  <Link to={profilePathFor(owner)} className="tap-area-y hover:underline">
                    {owner.name}
                  </Link>
                </>
              )}
              {tagged.length > 0 && (
                <span className="font-medium text-ink-muted">
                  {' '}
                  {t('με', 'with')}{' '}
                  {tagged.slice(0, 3).map((u, i) => (
                    <span key={u.id}>
                      {i > 0 && ', '}
                      <Link to={profilePathFor(u)} className="tap-area-y font-bold text-ink hover:underline">
                        {u.id === me?.id ? t('εσένα', 'you') : u.name}
                      </Link>
                    </span>
                  ))}
                  {tagged.length > 3 && t(` και ${tagged.length - 3} ακόμη`, ` and ${tagged.length - 3} more`)}
                </span>
              )}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ink-muted">
              <time dateTime={post.createdAt}>{relativeTime(post.createdAt, language)}</time>
              {post.editedAt && <span>· {t('επεξεργασμένο', 'edited')}</span>}
              {post.pinned && (
                <span className="inline-flex items-center gap-1 font-bold text-ink">
                  <Pin className="h-3 w-3" aria-hidden /> {t('Καρφιτσωμένο', 'Pinned')}
                </span>
              )}
              {isAuthor && !onOtherWall ? (
                <AudienceChip audience={post.audience} onClick={() => setAudienceOpen(true)} />
              ) : (
                <AudienceChip audience={onOtherWall ? access.privacyByUser[post.wallOwnerId]?.othersPostsAudience ?? post.audience : post.audience} />
              )}
            </div>
          </div>
          <OverflowMenu items={menuItems} label={t('Ενέργειες δημοσίευσης', 'Post actions')} />
        </header>

        {removed && (isAuthor || isAdmin) && (
          <p role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              {isAuthor
                ? t('Η συντονιστική ομάδα αφαίρεσε αυτή τη δημοσίευση — τη βλέπεις μόνο εσύ. Λόγος: ', 'The moderation team removed this post — only you can see it. Reason: ')
                : t('Αφαιρεμένη από τη συντονιστική ομάδα. Λόγος: ', 'Removed by moderation. Reason: ')}
              {t(post.moderation?.reasonEl ?? '', post.moderation?.reasonEn ?? '')}
            </span>
          </p>
        )}



        {editing ? (
          <div className="mt-3 space-y-2">
            <label className="sr-only" htmlFor={`edit-${post.id}`}>{t('Επεξεργασία δημοσίευσης', 'Edit post')}</label>
            <textarea
              id={`edit-${post.id}`}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              maxLength={POST_MAX_CHARS}
              className="w-full resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                {t('Ακύρωση', 'Cancel')}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (run(updatePost(post.id, { text: editText }))) {
                    setEditing(false);
                    toast.success(t('Οι αλλαγές αποθηκεύτηκαν', 'Changes saved'));
                  }
                }}
              >
                {t('Αποθήκευση', 'Save')}
              </Button>
            </div>
          </div>
        ) : (
          text && (
            <div
              className={cn(
                'mt-3 whitespace-pre-wrap break-words text-xl font-normal leading-[1.55] text-ink',
                background && 'flex min-h-44 items-center justify-center rounded-2xl p-5 text-center text-2xl font-bold text-white',
              )}
              style={background ? { backgroundImage: background.gradient } : undefined}
            >
              <div>
                <RichText text={shownText} />
                {long && (
                  <button type="button" onClick={() => setExpanded((v) => !v)} className="ml-1 font-semibold underline">
                    {expanded ? t('Λιγότερα', 'Less') : t('Περισσότερα', 'More')}
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {postImages.length > 0 && (
          <div
            className={cn(
              'mt-3 -mx-4 overflow-hidden rounded-none sm:mx-0 sm:rounded-2xl',
              postImages.length === 1 && 'aspect-[4/3]',
              postImages.length === 2 && 'grid aspect-[2/1] grid-cols-2 gap-[2px]',
              postImages.length >= 3 && 'grid aspect-square grid-cols-2 grid-rows-2 gap-[2px]',
            )}
          >
            {postImages.slice(0, 4).map((url, index) => (
              <button
                key={`${url.slice(0, 32)}-${index}`}
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={t(`Άνοιγμα φωτογραφίας ${index + 1} από ${postImages.length}`, `Open photo ${index + 1} of ${postImages.length}`)}
                className={cn('min-h-0 min-w-0 overflow-hidden', postImages.length === 3 && index === 0 && 'row-span-2')}
              >
                <img
                  src={url}
                  alt={t(`Φωτογραφία ${index + 1} από ${author.name}`, `Photo ${index + 1} by ${author.name}`)}
                  loading="lazy"
                  className={cn('h-full w-full object-cover', postImages.length === 1 && 'aspect-[4/3]')}
                />
              </button>
            ))}
          </div>
        )}

        {post.gifUrl && (
          <img
            src={gifFailed ? post.gifFallbackUrl ?? post.gifUrl : post.gifUrl}
            alt={t(`GIF από ${author.name}`, `GIF by ${author.name}`)}
            onError={() => setGifFailed(true)}
            loading="lazy"
            className="mt-3 max-h-[28rem] w-full rounded-2xl object-cover"
          />
        )}

        {post.poll && (
          <section className="mt-3 space-y-2 rounded-2xl border border-border/60 bg-surface-raised p-3" aria-label={t('Δημοσκόπηση', 'Poll')}>
            <p className="text-sm font-semibold text-ink">{post.poll.question || text}</p>
            {(() => {
              const totalVotes = post.poll.options.reduce((total, option) => total + option.voterIds.length, 0);
              const selectedOption = post.poll.options.find((option) => viewerId && option.voterIds.includes(viewerId));
              return (
                <>
                  <div className="space-y-1.5">
                    {post.poll.options.map((option) => {
                      const votes = option.voterIds.length;
                      const percent = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                      const selected = selectedOption?.id === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={readOnly || !viewerId}
                          onClick={() => run(votePoll(post.id, option.id))}
                          aria-pressed={selected}
                          className="relative flex min-h-10 w-full items-center justify-between overflow-hidden rounded-xl border border-border px-3 text-left text-sm font-medium text-ink disabled:cursor-default"
                        >
                          <span className="absolute inset-y-0 left-0 bg-accent-soft/80" style={{ width: `${percent}%` }} aria-hidden />
                          <span className="relative inline-flex min-w-0 items-center gap-2">
                            {selected && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />}
                            <span className="truncate">{option.label}</span>
                          </span>
                          <span className="relative ml-2 shrink-0 text-xs tabular-nums text-ink-muted">{percent}%</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-medium text-ink-muted">
                    {t(`${totalVotes} ψήφοι`, `${totalVotes} votes`)}
                  </p>
                </>
              );
            })()}
          </section>
        )}

        {event && (
          <Link
            to={`/events/${event.id}`}
            className="mt-3 block overflow-hidden rounded-2xl border border-border/60 bg-surface transition-colors hover:border-border-strong"
          >
            <span className="relative block aspect-video w-full overflow-hidden bg-accent-soft">
              {event.imageUrl && !thumbFailed ? (
                <img
                  src={event.imageUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setThumbFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-accent-soft">
                  <CalendarDays className="h-8 w-8 text-ink-muted" aria-hidden />
                </span>
              )}
              <span className="absolute left-2 top-2 flex min-w-10 flex-col items-center rounded-lg bg-white px-1.5 py-1 text-center text-ink shadow-soft">
                <span className="text-2xs font-bold uppercase leading-none">
                  {new Intl.DateTimeFormat(language === 'el' ? 'el-GR' : 'en-US', { weekday: 'short' })
                    .format(new Date(`${event.date}T12:00:00`))
                    .replace('.', '')
                    .toLocaleUpperCase(language === 'el' ? 'el-GR' : 'en-US')}
                </span>
                <span className="mt-0.5 text-sm font-bold leading-none">
                  {new Intl.DateTimeFormat(language === 'el' ? 'el-GR' : 'en-US', { day: '2-digit' })
                    .format(new Date(`${event.date}T12:00:00`))}
                </span>
              </span>
            </span>
            <span className="block min-w-0 p-3">
              <span className="block truncate text-sm font-semibold text-ink">{event.title}</span>
              <span className="mt-0.5 block truncate text-xs font-medium text-ink-muted">
                {[event.time, formatLocationArea(event.locationArea, language)].filter(Boolean).join(' · ')}
              </span>
            </span>
          </Link>
        )}
        {event && !readOnly && event.status !== 'cancelled' && event.status !== 'archived' && (
          myEventGroup ? (
            <Link
              to={`/night/${myEventGroup.id}`}
              className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 text-xs font-bold text-ink hover:border-accent"
            >
              <UsersRound className="h-3.5 w-3.5" aria-hidden /> {t('Η βραδιά μας', 'Our night')}
            </Link>
          ) : !isAuthor ? (
            <Link
              to={
                authorRecruitingGroup
                  ? `/events/${event.id}/join?groupId=${authorRecruitingGroup.id}`
                  : `/events/${event.id}/join`
              }
              className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 text-xs font-bold text-ink hover:border-accent"
            >
              <UsersRound className="h-3.5 w-3.5" aria-hidden /> {t(`Παρέα με ${author.name}`, `With ${author.name}`)}
            </Link>
          ) : null
        )}

        <PostReactionBar
          myReaction={myReaction}
          onReact={(kind) => run(react(post.id, kind))}
          onComment={() => {
            if (!readOnly && commentGate?.allowed) openComments();
            else setShowAllComments(true);
          }}
          onOpenReactions={() => setReactionsOpen(true)}
          onShare={() => void sharePost()}
          reactionCount={reactionEntries.length}
          reactionEmojis={topReactions.map((kind) => REACTION_EMOJI[kind])}
          commentCount={comments.length}
          canReact={!readOnly && Boolean(viewerId)}
          canComment={!readOnly && commentGate?.allowed === true}
        />

        {comments.length > 0 && (
          <CommentThread
            postId={post.id}
            comments={comments}
            users={users}
            viewer={viewer}
            readOnly={readOnly}
            canModerate={isAuthor || isOwner}
            canReply={commentGate?.allowed === true}
            showAll={showAllComments}
            onShowAll={openComments}
            onReply={(c) => {
              setReplyTo(c);
              setCommenting(true);
              setShowAllComments(true);
            }}
          />
        )}

        {!readOnly && viewerId && commentGate && commenting && commentGate.allowed && me && (
          <CommentComposer
            postId={post.id}
            me={me}
            mentionPeople={mentionPeople}
            replyTo={replyTo}
            onClearReply={() => setReplyTo(null)}
            focusOnOpen
            inputId={`comment-${post.id}`}
          />
        )}
        {!readOnly && viewerId && commentGate && !commentGate.allowed && (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-ink-muted">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> {t(commentGate.reasonEl, commentGate.reasonEn)}
            </p>
        )}
      </article>

      {isAuthor && !onOtherWall && (
        <AudiencePickerModal
          open={audienceOpen}
          onClose={() => setAudienceOpen(false)}
          value={post.audience}
          context="post"
          title={t('Ποιος βλέπει αυτή τη δημοσίευση;', 'Who can see this post?')}
          onSave={(a) => {
            if (run(updatePost(post.id, { audience: a }))) toast.success(t('Το κοινό άλλαξε', 'Audience updated'));
          }}
        />
      )}

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title={t('Αναφορά δημοσίευσης', 'Report post')} size="sm">
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-ink-muted">
            {t('Τι συμβαίνει; Η αναφορά είναι ανώνυμη για τον συντάκτη.', "What's wrong? The author won't see who reported it.")}
          </legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className={cn('flex min-h-8 cursor-pointer items-center gap-3 rounded-xl border px-3', reportReason === r.id ? 'border-accent bg-accent-soft' : 'border-border')}>
              <input type="radio" name={`report-${post.id}`} checked={reportReason === r.id} onChange={() => setReportReason(r.id)} className="h-4 w-4 accent-[var(--color-accent)]" />
              <span className="text-sm font-bold text-ink">{t(r.el, r.en)}</span>
            </label>
          ))}
        </fieldset>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setReportOpen(false)}>{t('Ακύρωση', 'Cancel')}</Button>
          <Button size="sm" variant="danger" onClick={handleReport}>{t('Αποστολή αναφοράς', 'Send report')}</Button>
        </div>
      </Modal>

      <Modal open={reactionsOpen} onClose={() => setReactionsOpen(false)} title={t('Αντιδράσεις', 'Reactions')} size="sm">
        <ul className="space-y-2">
          {reactionEntries.map(([uid, kind]) => {
            const u = users.find((x) => x.id === uid);
            if (!u) return null;
            return (
              <li key={uid} className="flex items-center gap-3">
                <PersonAvatar user={u} size="sm" viewer={viewer} />
                <Link to={profilePathFor(u)} className="flex-1 text-sm font-bold text-ink hover:underline" onClick={() => setReactionsOpen(false)}>
                  {u.name}
                </Link>
                <span aria-label={reactionLabel(kind, t)} className="text-lg leading-none">{REACTION_EMOJI[kind]}</span>
              </li>
            );
          })}
        </ul>
      </Modal>

      <Modal
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        title={t('Φωτογραφίες δημοσίευσης', 'Post photos')}
        size="lg"
        className="p-3"
      >
        {lightboxIndex !== null && postImages[lightboxIndex] && (
          <div className="relative flex items-center justify-center">
            <img
              src={postImages[lightboxIndex]}
              alt={t(
                `Φωτογραφία ${lightboxIndex + 1} από ${author.name}`,
                `Photo ${lightboxIndex + 1} by ${author.name}`,
              )}
              className="max-h-[72vh] w-full rounded-xl object-contain"
            />
            {postImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((index) => ((index ?? 0) + postImages.length - 1) % postImages.length)}
                  aria-label={t('Προηγούμενη φωτογραφία', 'Previous photo')}
                  className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((index) => ((index ?? 0) + 1) % postImages.length)}
                  aria-label={t('Επόμενη φωτογραφία', 'Next photo')}
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
