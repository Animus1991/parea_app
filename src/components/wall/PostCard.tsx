import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CalendarDays,
  ChevronRight,
  EyeOff,
  Flag,
  Lock,
  MessageCircle,
  MessageSquareOff,
  Pencil,
  Pin,
  PinOff,
  Send,
  SmilePlus,
  Trash2,
  Users2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { COMMENT_MAX_CHARS, POST_MAX_CHARS, useWallAccess, useWallStore } from '../../store/wallStore';
import { canCommentOnPost, visibleComments } from '../../lib/audience';
import { profilePathFor } from '../../lib/profileLinks';
import type { ReactionKind, WallPost } from '../../types/wall';
import { REACTION_KINDS } from '../../types/wall';
import type { User } from '../../types';
import { cn } from '../../lib/utils';
import { AudienceChip } from './AudienceChip';
import { AudiencePickerModal } from './AudiencePickerModal';
import { PersonAvatar } from './PersonAvatar';
import { REACTION_EMOJI, reactionLabel, relativeTime } from './wallText';
import { OverflowMenu, type OverflowMenuItem } from './OverflowMenu';

const LONG_TEXT = 420;

/**
 * One wall post: who wrote it, where, for whom, and everything people can do
 * with it. Every action re-checks permissions in the store.
 */
export function PostCard({ post, viewerOverride }: { post: WallPost; viewerOverride?: User | null }) {
  const { t, language } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const blockUser = useStore((s) => s.blockUser);
  const submitIssueReport = useStore((s) => s.submitIssueReport);
  const access = useWallAccess();
  const { react, addComment, deleteComment, restoreComment, deletePost, restorePost, updatePost, togglePin, hidePost, unhidePost } =
    useWallStore.getState();

  const viewer = viewerOverride === undefined ? me : viewerOverride;
  const readOnly = viewerOverride !== undefined; // «Δες ως…» preview
  const viewerId = viewer?.id ?? null;
  const author = users.find((u) => u.id === post.authorId);
  const owner = users.find((u) => u.id === post.wallOwnerId);
  const event = post.eventId ? events.find((e) => e.id === post.eventId) : undefined;
  const isAuthor = !readOnly && me?.id === post.authorId;
  const isOwner = !readOnly && me?.id === post.wallOwnerId;
  const onOtherWall = post.authorId !== post.wallOwnerId;

  const [expanded, setExpanded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const commentRef = useRef<HTMLInputElement>(null);

  const comments = useMemo(() => visibleComments(viewerId, post, access.graph), [viewerId, post, access.graph]);
  const shownComments = showAllComments ? comments : comments.slice(-2);
  const commentGate = viewerId ? canCommentOnPost(viewerId, post, access) : null;

  const reactionEntries = useMemo(
    () => Object.entries(post.reactions).filter(([uid]) => !viewerId || uid === viewerId || !access.graph.viewerBlockedIds?.includes(uid)),
    [post.reactions, viewerId, access.graph.viewerBlockedIds],
  );
  const topReactions = useMemo(() => {
    const counts = new Map<ReactionKind, number>();
    for (const [, k] of reactionEntries) counts.set(k, (counts.get(k) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 3);
  }, [reactionEntries]);
  const myReaction = viewerId ? post.reactions[viewerId] : undefined;

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
    submitIssueReport({
      category: 'user_behavior',
      severity: 'medium',
      description: `Wall post ${post.id} by ${author.name} (${author.id}): "${post.text.slice(0, 280)}"`,
      evidenceNames: [],
    });
    hidePost(post.id);
    toast.success(t('Ευχαριστούμε — η ομάδα ασφαλείας θα το εξετάσει. Η δημοσίευση κρύφτηκε για σένα.', 'Thanks — the safety team will review it. The post is hidden for you.'));
  };

  const handleBlock = () => {
    blockUser(author.id);
    toast.success(t(`Αποκλείστηκε ο/η ${author.name}. Δεν θα βλέπετε ο ένας τον άλλον.`, `Blocked ${author.name}. You will not see each other.`));
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
      menuItems.push({ key: 'report', icon: Flag, label: t('Αναφορά δημοσίευσης', 'Report post'), onSelect: handleReport, danger: true });
      menuItems.push({ key: 'block', icon: Ban, label: t(`Αποκλεισμός ${author.name}`, `Block ${author.name}`), onSelect: handleBlock, danger: true });
    }
  }

  const sendComment = () => {
    if (!comment.trim()) return;
    if (run(addComment(post.id, comment))) setComment('');
  };

  const text = post.text;
  const long = text.length > LONG_TEXT;
  const shownText = long && !expanded ? `${text.slice(0, LONG_TEXT).trimEnd()}…` : text;

  return (
    <Card className="p-0" data-testid="wall-post" data-post-id={post.id}>
      <article aria-label={t(`Δημοσίευση από ${author.name}`, `Post by ${author.name}`)} className="p-4">
        <header className="flex items-start gap-3">
          <Link to={profilePathFor(author)} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={author.name}>
            <PersonAvatar user={author} viewer={viewer} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-snug text-ink">
              <Link to={profilePathFor(author)} className="hover:underline">
                {author.name}
              </Link>
              {onOtherWall && owner && (
                <>
                  <ChevronRight className="mx-0.5 inline h-3.5 w-3.5 text-ink-muted" aria-label={t('στον τοίχο του/της', 'on the wall of')} />
                  <Link to={profilePathFor(owner)} className="hover:underline">
                    {owner.name}
                  </Link>
                </>
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
            <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-ink">
              {shownText}
              {long && (
                <button type="button" onClick={() => setExpanded((v) => !v)} className="ml-1 font-bold underline">
                  {expanded ? t('Λιγότερα', 'Less') : t('Περισσότερα', 'More')}
                </button>
              )}
            </p>
          )
        )}

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={t(`Φωτογραφία από ${author.name}`, `Photo by ${author.name}`)}
            loading="lazy"
            className="mt-3 max-h-[28rem] w-full rounded-2xl border border-border object-cover"
          />
        )}

        {event && (
          <Link
            to={`/events/${event.id}`}
            className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-strong"
          >
            {event.imageUrl && !thumbFailed ? (
              <img
                src={event.imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setThumbFailed(true)}
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent-soft">
                <CalendarDays className="h-5 w-5 text-ink" aria-hidden />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{event.title}</span>
              <span className="block truncate text-xs font-medium text-ink-muted">
                {event.date} · {event.time} · {event.locationArea}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          </Link>
        )}

        {(reactionEntries.length > 0 || comments.length > 0) && (
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-ink-muted">
            {reactionEntries.length > 0 ? (
              <button type="button" onClick={() => setReactionsOpen(true)} className="inline-flex min-h-8 items-center gap-1 hover:underline">
                <span aria-hidden>{topReactions.map((k) => REACTION_EMOJI[k]).join('')}</span>
                <span>
                  {reactionEntries.length === 1 ? t('1 αντίδραση', '1 reaction') : t(`${reactionEntries.length} αντιδράσεις`, `${reactionEntries.length} reactions`)}
                </span>
              </button>
            ) : (
              <span />
            )}
            {comments.length > 0 && (
              <button type="button" onClick={() => setShowAllComments((v) => !v)} className="min-h-8 hover:underline">
                {comments.length === 1 ? t('1 σχόλιο', '1 comment') : t(`${comments.length} σχόλια`, `${comments.length} comments`)}
              </button>
            )}
          </div>
        )}

        {!readOnly && viewerId && (
          <div className="mt-2 border-t border-border pt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => run(react(post.id, myReaction ? null : 'like'))}
                aria-pressed={Boolean(myReaction)}
                className={cn(
                  'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors hover:bg-surface',
                  myReaction ? 'text-ink' : 'text-ink-muted',
                )}
              >
                <span aria-hidden className="text-base leading-none">{myReaction ? REACTION_EMOJI[myReaction] : '👍'}</span>
                {myReaction ? reactionLabel(myReaction, t) : t('Μου αρέσει', 'Like')}
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={pickerOpen}
                aria-label={t('Περισσότερες αντιδράσεις', 'More reactions')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-surface hover:text-ink"
              >
                <SmilePlus className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAllComments(true);
                  commentRef.current?.focus();
                }}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> {t('Σχόλιο', 'Comment')}
              </button>
            </div>
            {pickerOpen && (
              <div role="group" aria-label={t('Διάλεξε αντίδραση', 'Choose a reaction')} className="mt-1 flex flex-wrap gap-1">
                {REACTION_KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={myReaction === k}
                    onClick={() => {
                      run(react(post.id, k));
                      setPickerOpen(false);
                    }}
                    className={cn(
                      'inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs font-bold',
                      myReaction === k ? 'border-accent bg-accent-soft text-ink' : 'border-border text-ink-muted hover:text-ink',
                    )}
                  >
                    <span aria-hidden className="text-base leading-none">{REACTION_EMOJI[k]}</span> {reactionLabel(k, t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {shownComments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {!showAllComments && comments.length > shownComments.length && (
              <li>
                <button type="button" onClick={() => setShowAllComments(true)} className="text-xs font-bold text-ink-muted hover:underline">
                  {t(`Προβολή όλων των ${comments.length} σχολίων`, `View all ${comments.length} comments`)}
                </button>
              </li>
            )}
            {shownComments.map((c) => {
              const cu = users.find((u) => u.id === c.authorId);
              if (!cu) return null;
              const canDelete = !readOnly && Boolean(me && (c.authorId === me.id || isAuthor || isOwner));
              return (
                <li key={c.id} className="flex items-start gap-2">
                  <PersonAvatar user={cu} size="sm" viewer={viewer} />
                  <div className="min-w-0 flex-1 rounded-2xl bg-surface px-3 py-2">
                    <p className="text-xs font-bold text-ink">
                      <Link to={profilePathFor(cu)} className="hover:underline">{cu.name}</Link>
                      <span className="ml-2 font-medium text-ink-muted">{relativeTime(c.createdAt, language)}</span>
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm font-medium text-ink">{c.text}</p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        const removed = deleteComment(post.id, c.id);
                        if (removed) {
                          toast.success(t('Το σχόλιο διαγράφηκε', 'Comment deleted'), {
                            action: { label: t('Αναίρεση', 'Undo'), onClick: () => restoreComment(post.id, removed) },
                          });
                        }
                      }}
                      aria-label={t(`Διαγραφή σχολίου του/της ${cu.name}`, `Delete ${cu.name}'s comment`)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface hover:text-ink"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!readOnly && viewerId && commentGate && (
          commentGate.allowed ? (
            <form
              className="mt-3 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendComment();
              }}
            >
              {me && <PersonAvatar user={me} size="sm" />}
              <label className="sr-only" htmlFor={`comment-${post.id}`}>{t('Γράψε σχόλιο', 'Write a comment')}</label>
              <input
                ref={commentRef}
                id={`comment-${post.id}`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={COMMENT_MAX_CHARS}
                placeholder={t('Γράψε ένα σχόλιο…', 'Write a comment…')}
                className="min-h-10 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={!comment.trim()}
                aria-label={t('Αποστολή σχολίου', 'Send comment')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg disabled:opacity-40"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </form>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-xs font-medium text-ink-muted">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden /> {t(commentGate.reasonEl, commentGate.reasonEn)}
            </p>
          )
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
    </Card>
  );
}
