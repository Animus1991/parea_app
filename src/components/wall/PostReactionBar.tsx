import { useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, ThumbsUp } from 'lucide-react';
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
 * long-press (touch) to pick from the basic five. Extra emojis live in the
 * comment composer.
 */
export function PostReactionBar({
  myReaction,
  onReact,
  onComment,
  canComment,
}: {
  myReaction?: ReactionKind;
  onReact: (kind: ReactionKind | null) => void;
  onComment: () => void;
  canComment: boolean;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const held = useRef(false);

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
    const onKey = (e: KeyboardEvent) => {
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
  };

  const likeLabel = reactionLabel(myReaction ?? 'like', t);

  return (
    <div className={cn('mt-2 border-t border-border pt-1', canComment && 'grid grid-cols-2 gap-1')}>
      <div
        ref={wrapRef}
        className="relative"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
      >
        {open && (
          <div
            role="group"
            aria-label={t('Διάλεξε αντίδραση', 'Choose a reaction')}
            className="absolute bottom-full left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-border bg-surface-raised px-1.5 py-1 mb-1 shadow-soft-lg after:absolute after:left-0 after:right-0 after:top-full after:h-2 after:content-['']"
          >
            {QUICK_POST_REACTIONS.map((k) => (
              <button
                key={k}
                type="button"
                aria-label={reactionLabel(k, t)}
                aria-pressed={myReaction === k}
                title={reactionLabel(k, t)}
                onClick={() => pick(k)}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none transition-transform hover:scale-125',
                  myReaction === k && 'bg-accent-soft',
                )}
              >
                <span aria-hidden>{REACTION_EMOJI[k]}</span>
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          aria-pressed={Boolean(myReaction)}
          aria-label={likeLabel}
          aria-haspopup="true"
          aria-expanded={open}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            if (e.pointerType !== 'touch') return;
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
            onReact(myReaction ? null : 'like');
          }}
          className={cn(
            'inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold hover:bg-surface',
            reactionTint(myReaction),
          )}
        >
          {myReaction === 'love' ? (
            <Heart className="h-4 w-4 fill-current" aria-hidden />
          ) : myReaction && myReaction !== 'like' ? (
            <span aria-hidden className="text-base leading-none">
              {REACTION_EMOJI[myReaction]}
            </span>
          ) : (
            <ThumbsUp className={cn('h-4 w-4', myReaction === 'like' && 'fill-current')} aria-hidden />
          )}
          {likeLabel}
        </button>
      </div>
      {canComment && (
        <button
          type="button"
          onClick={onComment}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-ink-muted hover:bg-surface hover:text-ink"
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> {t('Σχόλιο', 'Comment')}
        </button>
      )}
    </div>
  );
}
