import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Heart, Pencil, Reply, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { COMMENT_MAX_CHARS, useWallStore } from '../../store/wallStore';
import { cn } from '../../lib/utils';
import { profilePathFor } from '../../lib/profileLinks';
import type { WallComment } from '../../types/wall';
import { COMMENT_REACTION_EMOJIS } from '../../types/wall';
import type { User } from '../../types';
import { OverflowMenu, type OverflowMenuItem } from './OverflowMenu';
import { PersonAvatar } from './PersonAvatar';
import { RichText } from './RichText';
import { relativeTime } from './wallText';
import { Button } from '../common/Button';

function CommentMedia({ comment, alt }: { comment: WallComment; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = comment.imageUrl ?? (failed ? comment.gifFallbackUrl : comment.gifUrl);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="mt-1.5 max-h-48 max-w-[16rem] rounded-xl object-cover"
    />
  );
}

function CommentReactionTray({
  open,
  myEmoji,
  onPick,
  t,
}: {
  open: boolean;
  myEmoji?: string;
  onPick: (emoji: string) => void;
  t: (el: string, en: string) => string;
}) {
  if (!open) return null;
  return (
    <div
      role="group"
      aria-label={t('Αντίδραση στο σχόλιο', 'React to comment')}
      className="absolute bottom-full left-0 z-20 mb-1 flex items-center gap-0.5 rounded-full border border-border bg-surface-raised px-1 py-0.5 shadow-soft-lg after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
    >
      {COMMENT_REACTION_EMOJIS.map((em) => (
        <button
          key={em}
          type="button"
          onClick={() => onPick(em)}
          aria-pressed={myEmoji === em}
          className={cn('flex h-9 w-9 items-center justify-center rounded-full text-lg hover:scale-125', myEmoji === em && 'bg-accent-soft')}
        >
          {em}
        </button>
      ))}
    </div>
  );
}

function CommentCard({
  comment,
  depth,
  postId,
  users,
  viewer,
  language,
  t,
  canModerate,
  readOnly,
  onReply,
}: {
  comment: WallComment;
  depth: number;
  postId: string;
  users: User[];
  viewer: User | null | undefined;
  language: string;
  t: (el: string, en: string) => string;
  canModerate: boolean;
  readOnly: boolean;
  onReply: (c: WallComment) => void;
}) {
  const { updateComment, deleteComment, restoreComment, reactToComment } = useWallStore.getState();
  const author = users.find((u) => u.id === comment.authorId);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [tray, setTray] = useState(false);
  const hold = useRef(false);
  const holdTimer = useRef<number | null>(null);
  if (!author) return null;

  const mine = viewer?.id === comment.authorId;
  const myEmoji = viewer?.id ? comment.reactions?.[viewer.id] : undefined;
  const reactionCounts = Object.values(comment.reactions ?? {}).reduce<Record<string, number>>((acc, em) => {
    acc[em] = (acc[em] ?? 0) + 1;
    return acc;
  }, {});
  const reactionChips = Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]);

  const run = (res: { ok: boolean; reasonEl?: string; reasonEn?: string }) => {
    if (!res.ok) toast.error(t(res.reasonEl ?? 'Δεν επιτρέπεται', res.reasonEn ?? 'Not allowed'));
    return res.ok;
  };

  const menuItems: OverflowMenuItem[] = [];
  if (!readOnly && viewer) {
    if (mine) {
      menuItems.push({
        key: 'edit',
        icon: Pencil,
        label: t('Επεξεργασία', 'Edit'),
        onSelect: () => {
          setEditText(comment.text);
          setEditing(true);
        },
      });
    }
    menuItems.push({
      key: 'copy',
      icon: Copy,
      label: t('Αντιγραφή', 'Copy'),
      onSelect: () => {
        void navigator.clipboard?.writeText(comment.text || '');
        toast.success(t('Αντιγράφηκε', 'Copied'));
      },
    });
    if (mine || canModerate) {
      menuItems.push({
        key: 'delete',
        icon: Trash2,
        label: t('Διαγραφή', 'Delete'),
        danger: true,
        onSelect: () => {
          const removed = deleteComment(postId, comment.id);
          if (removed) {
            toast.success(t('Το σχόλιο διαγράφηκε', 'Comment deleted'), {
              action: { label: t('Αναίρεση', 'Undo'), onClick: () => restoreComment(postId, removed) },
            });
          }
        },
      });
    }
  }

  return (
    <div className={cn('flex items-start gap-2', depth > 0 && 'ml-8 sm:ml-10')}>
      <PersonAvatar user={author} size="sm" viewer={viewer} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-surface px-3 py-2">
          <p className="text-xs font-bold text-ink">
            <Link to={profilePathFor(author)} className="hover:underline">
              {author.name}
            </Link>
            <span className="ml-2 font-medium text-ink-muted">{relativeTime(comment.createdAt, language)}</span>
            {comment.editedAt && <span className="ml-1 font-medium text-ink-muted">· {t('επεξεργασμένο', 'edited')}</span>}
          </p>
          {editing ? (
            <div className="mt-1.5 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, COMMENT_MAX_CHARS))}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-surface-raised px-2.5 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  {t('Ακύρωση', 'Cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (run(updateComment(postId, comment.id, { text: editText }))) {
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
            <>
              {comment.text && (
                <p className="whitespace-pre-wrap break-words text-sm font-medium text-ink">
                  <RichText text={comment.text} />
                </p>
              )}
              <CommentMedia comment={comment} alt={t(`Συνημμένο από ${author.name}`, `Attachment from ${author.name}`)} />
            </>
          )}
        </div>
        {reactionChips.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1 pl-1">
            {reactionChips.map(([em, n]) => (
              <button
                key={em}
                type="button"
                disabled={readOnly}
                onClick={() => run(reactToComment(postId, comment.id, em))}
                className={cn(
                  'inline-flex min-h-6 items-center gap-0.5 rounded-full border px-1.5 text-2xs font-bold',
                  myEmoji === em ? 'border-accent bg-accent-soft text-ink' : 'border-border text-ink-muted',
                )}
              >
                {em} {n}
              </button>
            ))}
          </div>
        )}
        {!readOnly && viewer && (
          <div className="mt-0.5 flex items-center gap-1 pl-1 text-xs font-bold text-ink-muted">
            <div
              className="relative"
              onMouseEnter={() => setTray(true)}
              onMouseLeave={() => setTray(false)}
            >
              <CommentReactionTray
                open={tray}
                myEmoji={myEmoji}
                t={t}
                onPick={(em) => {
                  run(reactToComment(postId, comment.id, em));
                  setTray(false);
                }}
              />
              <button
                type="button"
                aria-pressed={Boolean(myEmoji)}
                aria-label={t(`Μου αρέσει το σχόλιο του/της ${author.name}`, `Like ${author.name}'s comment`)}
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  if (e.pointerType !== 'touch') return;
                  hold.current = false;
                  holdTimer.current = window.setTimeout(() => {
                    hold.current = true;
                    setTray(true);
                  }, 380);
                }}
                onPointerUp={() => {
                  if (holdTimer.current) window.clearTimeout(holdTimer.current);
                }}
                onClick={() => {
                  if (hold.current) {
                    hold.current = false;
                    return;
                  }
                  run(reactToComment(postId, comment.id, myEmoji ?? '👍'));
                }}
                className={cn('inline-flex min-h-8 items-center gap-1 rounded-full px-2 hover:bg-surface', myEmoji && 'text-rose-600')}
              >
                <Heart className={cn('h-3.5 w-3.5', myEmoji && 'fill-current')} aria-hidden />
                {t('Μου αρέσει', 'Like')}
              </button>
            </div>
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 hover:bg-surface hover:text-ink"
            >
              <Reply className="h-3.5 w-3.5" aria-hidden />
              {t('Απάντηση', 'Reply')}
            </button>
          </div>
        )}
      </div>
      <OverflowMenu items={menuItems} label={t(`Ενέργειες σχολίου του/της ${author.name}`, `Actions for ${author.name}'s comment`)} />
    </div>
  );
}

export function CommentThread({
  postId,
  comments,
  users,
  viewer,
  readOnly,
  canModerate,
  showAll,
  onShowAll,
  onReply,
}: {
  postId: string;
  comments: WallComment[];
  users: User[];
  viewer: User | null | undefined;
  readOnly: boolean;
  canModerate: boolean;
  showAll: boolean;
  onShowAll: () => void;
  onReply: (c: WallComment) => void;
}) {
  const { t, language } = useLanguage();
  const { roots, byParent } = useMemo(() => {
    const ids = new Set(comments.map((c) => c.id));
    const roots = comments.filter((c) => !c.parentId || !ids.has(c.parentId));
    const byParent = new Map<string, WallComment[]>();
    for (const c of comments) {
      if (c.parentId && ids.has(c.parentId)) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      }
    }
    return { roots, byParent };
  }, [comments]);

  const shownRoots = showAll ? roots : roots.slice(-2);

  if (roots.length === 0) return null;

  const renderTree = (c: WallComment, depth: number) => (
    <div key={c.id} className="space-y-2">
      <CommentCard
        comment={c}
        depth={depth}
        postId={postId}
        users={users}
        viewer={viewer}
        language={language}
        t={t}
        canModerate={canModerate}
        readOnly={readOnly}
        onReply={onReply}
      />
      {(byParent.get(c.id) ?? []).map((child) => renderTree(child, Math.min(depth + 1, 1)))}
    </div>
  );

  return (
    <ul className="mt-3 space-y-2">
      {!showAll && roots.length > shownRoots.length && (
        <li>
          <button type="button" onClick={onShowAll} className="text-xs font-bold text-ink-muted hover:underline">
            {t(`Προβολή όλων των ${comments.length} σχολίων`, `View all ${comments.length} comments`)}
          </button>
        </li>
      )}
      {shownRoots.map((c) => (
        <li key={c.id} className="space-y-2">
          {renderTree(c, 0)}
        </li>
      ))}
    </ul>
  );
}
