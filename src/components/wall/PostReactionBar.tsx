import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Heart, MessageCircle, ThumbsUp } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import type { ReactionKind } from '../../types/wall';
import { QUICK_POST_REACTIONS } from '../../types/wall';
import { REACTION_EMOJI, reactionLabel } from './wallText';

const HOLD_MS = 380;

function reactionTint(kind: ReactionKind | undefined): string {
  if (kind === 'love') return 'text-rose-600 dark:text-rose-400';
  if (kind === 'haha' || kind === 'wow') return 'text-amber-600 dark:text-amber-400';
  if (kind === 'cheers') return 'text-violet-600 dark:text-violet-400';
  if (kind) return 'text-accent';
  return 'text-ink-muted';
}

/**
 * Facebook / Instagram-style post actions: tap Like, or hover (desktop) /
 * long-press (touch) to pick from the basic five. Comment reactions can open
 * the wider emoji set.
 */
export function PostReactionBar({
  myReaction,
  onReact,
  onComment,
  onOpenReactions,
  onShare,
  reactionCount,
  reactionEmojis,
  commentCount,
  canReact,
  canComment,
}: {
  myReaction?: ReactionKind;
  onReact: (kind: ReactionKind | null) => void;
  onComment: () => void;
  onOpenReactions: () => void;
  onShare: () => void;
  reactionCount: number;
  reactionEmojis: string[];
  commentCount: number;
  canReact: boolean;
  canComment: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const likeRef = useRef<HTMLButtonElement>(null);
  const trayBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const holdTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const held = useRef(false);
  const focusTray = (index: number) => {
    const n = QUICK_POST_REACTIONS.length;
    trayBtnRefs.current[((index % n) + n) % n]?.focus();
  };
  const openTrayFromKeyboard = () => {
    cancelClose();
    setOpen(true);
    requestAnimationFrame(() => {
      const idx = Math.max(0, QUICK_POST_REACTIONS.indexOf(myReaction ?? 'like'));
      focusTray(idx);
    });
  };
  const onTrayKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = trayBtnRefs.current.findIndex((b) => b === document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      likeRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusTray(i + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusTray(i - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTray(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTray(QUICK_POST_REACTIONS.length - 1);
    }
  };

  const clearHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      clearHold();
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const pick = (kind: ReactionKind) => {
    onReact(myReaction === kind ? null : kind);
    setOpen(false);
    likeRef.current?.focus();
  };

  const likeLabel = reactionLabel(myReaction ?? 'like', t);

  return (
    <div className="mt-2 grid grid-cols-3 gap-1 border-t border-border/60 pt-1">
      <div className="flex min-w-0 items-center">
        <div
          ref={wrapRef}
          role="presentation"
          className="relative min-w-0 flex-1"
          onMouseEnter={() => {
            if (!canReact) return;
            cancelClose();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          {open && canReact && (
            <div
              role="toolbar"
              aria-label={t('Διάλεξε αντίδραση', 'Choose a reaction')}
              onKeyDown={onTrayKeyDown}
              className="absolute bottom-full left-1/2 z-20 mb-1 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-surface-raised px-1.5 py-1 shadow-soft-lg after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
            >
              {QUICK_POST_REACTIONS.map((k, i) => (
                <button
                  key={k}
                  type="button"
                  ref={(el) => {
                    trayBtnRefs.current[i] = el;
                  }}
                  aria-label={reactionLabel(k, t)}
                  aria-pressed={myReaction === k}
                  title={reactionLabel(k, t)}
                  onClick={() => pick(k)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none transition-transform hover:scale-125',
                    myReaction === k && 'bg-accent-soft motion-safe:animate-reaction-pop',
                  )}
                >
                  <span aria-hidden>{REACTION_EMOJI[k]}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            ref={likeRef}
            disabled={!canReact}
            aria-pressed={Boolean(myReaction)}
            aria-label={likeLabel}
            aria-haspopup="true"
            aria-expanded={open}
            data-testid="wall-post-like"
            aria-keyshortcuts="ArrowUp"
            title={t('Πάτα ↑ ή κράτα πατημένο για περισσότερες αντιδράσεις', 'Press ↑ or hold for more reactions')}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                openTrayFromKeyboard();
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              if (!canReact || e.pointerType !== 'touch') return;
              held.current = false;
              clearHold();
              holdTimer.current = window.setTimeout(() => {
                held.current = true;
                setOpen(true);
              }, HOLD_MS);
            }}
            onPointerUp={clearHold}
            onPointerCancel={clearHold}
            onClick={() => {
              if (held.current) {
                held.current = false;
                return;
              }
              if (canReact) onReact(myReaction ? null : 'like');
            }}
            className={cn(
              'inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl text-xs font-medium hover:bg-surface disabled:cursor-default',
              reactionTint(myReaction),
              myReaction && 'motion-safe:animate-reaction-pop',
            )}
          >
            {myReaction === 'love' ? (
              <Heart className="h-4 w-4 fill-current" aria-hidden />
            ) : myReaction && myReaction !== 'like' ? (
              <span aria-hidden className="text-base leading-none">{REACTION_EMOJI[myReaction]}</span>
            ) : (
              <ThumbsUp className={cn('h-4 w-4', myReaction === 'like' && 'fill-current')} aria-hidden />
            )}
            {likeLabel}
          </button>
        </div>
        {reactionCount > 0 && (
          <button
            type="button"
            onClick={onOpenReactions}
            aria-label={t(`${reactionCount} αντιδράσεις`, `${reactionCount} reactions`)}
            className="inline-flex min-h-9 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-xs font-medium text-ink-muted hover:bg-surface"
          >
            <span aria-hidden>{reactionEmojis.slice(0, 3).join('')}</span>
            <span className="tabular-nums">{reactionCount}</span>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onComment}
        disabled={!canComment && commentCount === 0}
        aria-label={commentCount ? t(`${commentCount} σχόλια`, `${commentCount} comments`) : t('Σχόλιο', 'Comment')}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink disabled:cursor-default disabled:opacity-50"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        {commentCount > 0 ? <span className="tabular-nums">{commentCount}</span> : t('Σχόλιο', 'Comment')}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink"
      >
        <ArrowUpRight className="h-4 w-4" aria-hidden /> {t('Κοινοποίηση', 'Share')}
      </button>
    </div>
  );
}
