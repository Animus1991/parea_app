import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  Reply,
  Pin,
  Trash2,
  Pencil,
  Check,
  CheckCheck,
  Play,
  Pause,
  SmilePlus,
  X,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import type { ChatMessage } from '../../types/chat';
import { QUICK_REACTIONS } from '../../lib/chatMediaCatalog';
import { cn } from '../../lib/utils';
import { redundantClick } from '../../lib/a11y';
import { CHAT_TYPO } from '../../lib/typographyTokens';
import { localizeSystemBody } from '../../lib/chatSystemCopy';

/** Render message text with highlighted @mentions and clickable #tags. */
function RichBodyText({
  text,
  mine,
  onTagClick,
}: {
  text: string;
  mine: boolean;
  onTagClick?: (tag: string) => void;
}) {
  const parts = text.split(/([@#][\p{L}\p{N}_-]{2,28})/gu);
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 2) {
          return (
            <span
              key={i}
              className={cn(
                'font-bold px-1 py-0.5 rounded',
                mine ? 'bg-brand-fg/10 text-brand-fg' : 'bg-brand-soft text-brand',
              )}
            >
              {part}
            </span>
          );
        }
        if (part.startsWith('#') && part.length > 2) {
          const clean = part.slice(1).toLowerCase();
          return (
            <button
              key={i}
              type="button"
              onClick={() => onTagClick?.(clean)}
              className={cn(
                'inline font-bold underline underline-offset-2 hover:opacity-80',
                mine ? 'text-brand-fg' : 'text-brand',
              )}
            >
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function VoiceNotePlayer({
  url,
  durationSec = 4,
  waveform = [4, 7, 10, 6, 11, 8, 5, 9, 12, 7, 5, 8],
  mine,
}: {
  url: string;
  durationSec?: number;
  waveform?: number[];
  mine: boolean;
}) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const stopSim = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePlay = () => {
    if (playing) {
      audioRef.current?.pause();
      stopSim();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    setProgress(0);
    if (url && !url.startsWith('sim:')) {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
      audio.onerror = () => {
        // Simulated timer fallback if browser cannot decode codec
        const stepMs = Math.max(80, Math.round((durationSec * 1000) / 20));
        let step = 0;
        timerRef.current = window.setInterval(() => {
          step += 1;
          setProgress(Math.min(100, step * 5));
          if (step >= 20) {
            stopSim();
            setPlaying(false);
            setProgress(0);
          }
        }, stepMs);
      };
      void audio.play().catch(() => audio.onerror?.(new Event('error')));
    } else {
      const stepMs = Math.max(80, Math.round((durationSec * 1000) / 20));
      let step = 0;
      timerRef.current = window.setInterval(() => {
        step += 1;
        setProgress(Math.min(100, step * 5));
        if (step >= 20) {
          stopSim();
          setPlaying(false);
          setProgress(0);
        }
      }, stepMs);
    }
  };

  const mins = String(Math.floor(durationSec / 60));
  const secs = String(durationSec % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-2.5 min-w-[175px]">
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? t('Παύση', 'Pause') : t('Αναπαραγωγή φωνητικού', 'Play voice note')}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95',
          mine ? 'bg-brand-fg/15 text-brand-fg hover:bg-brand-fg/25' : 'bg-brand text-brand-fg',
        )}
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex items-center gap-0.5 h-5 flex-1" aria-hidden>
        {waveform.map((h, idx) => {
          const filled = (idx / waveform.length) * 100 <= progress && playing;
          return (
            <span
              key={idx}
              className={cn(
                'w-1 rounded-full transition-colors',
                filled
                  ? mine
                    ? 'bg-white'
                    : 'bg-brand'
                  : mine
                    ? 'bg-white/45'
                    : 'bg-ink/25',
              )}
              style={{ height: `${Math.max(4, Math.min(18, h * 1.4))}px` }}
            />
          );
        })}
      </div>
      <span className={cn('text-2xs font-bold tabular-nums', mine ? 'text-brand-fg' : 'text-ink-muted')}>
        {mins}:{secs}
      </span>
    </div>
  );
}

export function ChatMessageBubble({
  message,
  senderName,
  mine,
  viewerId,
  compact = false,
  onReply,
  onJumpTo,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onVotePoll,
  onTagClick,
  selected = false,
  onSelect,
}: {
  message: ChatMessage;
  senderName: string;
  mine: boolean;
  viewerId?: string;
  compact?: boolean;
  onReply: (msg: ChatMessage) => void;
  onJumpTo?: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string, newBody: string) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onTagClick?: (tag: string) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { t } = useLanguage();
  const [localSelected, setLocalSelected] = useState(false);
  const isSelected = onSelect ? selected : localSelected;
  const toggleSelect = onSelect ?? (() => setLocalSelected((v) => !v));
  const [reactOpen, setReactOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const [imgFallback, setImgFallback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isSystem = message.senderType === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-1.5 px-2" data-message-id={message.id}>
        <div className={cn('bg-ink/5 text-ink-muted rounded-full px-3 py-1 text-center max-w-[90%]', CHAT_TYPO.systemBubble)}>
          {message.pinned && <Pin className="w-2.5 h-2.5 inline mr-1 opacity-70" aria-hidden />}
          {localizeSystemBody(message.body, t)}
        </div>
      </div>
    );
  }

  const reactionEntries = Object.entries(message.reactions ?? {}).filter(([, ids]) => ids.length > 0);
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const totalVotes = message.poll
    ? message.poll.options.reduce((acc, o) => acc + o.voterIds.length, 0)
    : 0;

  // Click and long-press/right-click select the message; keyboards use the message actions button.
  const bubblePointer = {
    ...redundantClick<HTMLDivElement>((event) => {
      if ((event.target as HTMLElement).closest('button, a, input, textarea')) return;
      toggleSelect();
    }),
    onContextMenu: (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      toggleSelect();
    },
  };

  return (
    <div
      id={`msg-${message.id}`}
      data-message-id={message.id}
      className={cn(
        'group relative flex flex-col transition-colors rounded-2xl',
        compact ? 'max-w-[92%]' : 'max-w-[85%] sm:max-w-[75%]',
        mine ? 'ml-auto items-end' : 'items-start',
      )}
      {...bubblePointer}
    >
      <button
        type="button"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:z-10 focus:inline-flex focus:items-center rounded-full border border-border bg-surface-raised px-2 py-1 text-2xs font-bold text-ink shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
        aria-expanded={isSelected}
        onClick={(event) => {
          event.stopPropagation();
          toggleSelect();
        }}
      >
        {mine
          ? t('Ενέργειες μηνύματος', 'Message actions')
          : t(`Ενέργειες μηνύματος από ${senderName}`, `Message actions from ${senderName}`)}
      </button>
      {!mine && <span className={CHAT_TYPO.sender}>{senderName}</span>}

      <div className={cn('flex items-end gap-1.5', mine && 'flex-row-reverse')}>
        <div
          className={cn(
            CHAT_TYPO.bubble,
            'rounded-2xl px-3 py-2 relative shadow-soft',
            mine
              ? 'bg-brand text-brand-fg rounded-tr-sm'
              : 'bg-surface-raised border border-border text-ink rounded-tl-sm',
            message.pinned && 'ring-1 ring-amber-400/70',
          )}
        >
          {/* Story Reply preview */}
          {message.storyRef && (
            <div
              className={cn(
                'mb-1.5 rounded-xl px-2.5 py-1.5 text-2xs border-l-2',
                mine ? 'bg-brand-fg/10 border-brand-fg text-brand-fg' : 'bg-surface border-brand text-ink-muted',
              )}
            >
              <span className="font-bold block">
                {t(`Απάντηση στο story · ${message.storyRef.authorName}`, `Replied to ${message.storyRef.authorName}'s story`)}
              </span>
              {message.storyRef.caption && (
                <span className="line-clamp-1 opacity-85">«{message.storyRef.caption}»</span>
              )}
            </div>
          )}

          {/* Quoted Reply-to-Reply */}
          {message.replyTo && (
            <button
              type="button"
              onClick={() => onJumpTo?.(message.replyTo!.id)}
              className={cn(
                'mb-1.5 w-full text-left rounded-xl px-2.5 py-1 border-l-2 transition-opacity hover:opacity-90',
                mine ? 'bg-brand-fg/10 border-brand-fg/70 text-brand-fg' : 'bg-surface border-brand text-ink',
              )}
            >
              <span className="block text-2xs font-bold">{message.replyTo.senderName}</span>
              <span className="block text-xs truncate max-w-[200px]">
                {message.replyTo.body}
              </span>
            </button>
          )}

          {/* Media: GIF / Image / Voice */}
          {message.media?.kind === 'gif' && (
            <div className="mb-1 overflow-hidden rounded-xl bg-black/10 max-w-[210px]">
              <img
                src={imgFallback && message.media.fallbackUrl ? message.media.fallbackUrl : message.media.url}
                alt={message.media.label || 'GIF'}
                onError={() => {
                  if (!imgFallback && message.media?.fallbackUrl) setImgFallback(true);
                }}
                className="w-full h-auto max-h-36 object-cover rounded-xl"
              />
            </div>
          )}

          {message.media?.kind === 'image' && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="mb-1 block overflow-hidden rounded-xl max-w-[220px]"
            >
              <img
                src={message.media.url}
                alt={message.media.label || t('Φωτογραφία', 'Photo')}
                className="w-full max-h-44 object-cover rounded-xl"
              />
            </button>
          )}

          {message.media?.kind === 'voice' && (
            <VoiceNotePlayer
              url={message.media.url}
              durationSec={message.media.durationSec}
              waveform={message.media.waveform}
              mine={mine}
            />
          )}

          {/* Poll */}
          {message.poll && (
            <div className="space-y-1.5 min-w-[200px]">
              <p className="text-xs font-bold">📊 {message.poll.question}</p>
              <div className="space-y-1">
                {message.poll.options.map((opt) => {
                  const pct = totalVotes > 0 ? Math.round((opt.voterIds.length / totalVotes) * 100) : 0;
                  const voted = Boolean(viewerId && opt.voterIds.includes(viewerId));
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onVotePoll?.(message.id, opt.id)}
                      className={cn(
                        'w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-semibold relative overflow-hidden border transition-colors',
                        mine
                          ? voted
                            ? 'border-brand-fg bg-brand-fg/20 text-brand-fg'
                            : 'border-brand-fg/30 bg-brand-fg/10 text-brand-fg hover:bg-brand-fg/20'
                          : voted
                            ? 'border-brand bg-brand-soft text-ink'
                            : 'border-border bg-surface text-ink hover:border-brand/40',
                      )}
                    >
                      <span
                        className={cn(
                          'absolute inset-y-0 left-0 transition-all',
                          mine ? 'bg-brand-fg/15' : 'bg-brand/15',
                        )}
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                      <span className="relative z-10 flex items-center justify-between gap-2">
                        <span className="truncate">{opt.label}</span>
                        <span className="tabular-nums">
                          {pct}% ({opt.voterIds.length})
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className={cn('text-2xs opacity-75')}>
                {totalVotes} {totalVotes === 1 ? t('ψήφος', 'vote') : t('ψήφοι', 'votes')}
              </p>
            </div>
          )}

          {/* Body / inline edit */}
          {editing ? (
            <form
              className="flex items-center gap-1.5 min-w-[160px]"
              onSubmit={(e) => {
                e.preventDefault();
                if (editText.trim()) {
                  onEdit?.(message.id, editText.trim());
                  setEditing(false);
                }
              }}
            >
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 rounded-full bg-white text-gray-900 px-3 py-1 text-xs focus:outline-none"
              />
              <button type="submit" aria-label={t('Αποθήκευση', 'Save')} className="p-1 rounded bg-emerald-600 text-white">
                <Check className="w-3 h-3" />
              </button>
              <button type="button" onClick={() => setEditing(false)} aria-label={t('Ακύρωση', 'Cancel')} className="p-1 rounded bg-black/20 text-white">
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            message.body &&
            message.type !== 'poll' &&
            message.media?.kind !== 'gif' &&
            message.media?.kind !== 'voice' && (
              <RichBodyText text={message.body} mine={mine} onTagClick={onTagClick} />
            )
          )}

          {/* Meta row inside bubble footer */}
          <div
            className={cn(
              'mt-0.5 flex items-center justify-end gap-1 text-2xs',
              mine ? 'text-brand-fg' : 'text-ink-muted',
            )}
          >
            {message.pinned && <Pin className="w-2.5 h-2.5" aria-hidden />}
            {message.editedAt && <span>{t('(επεξ.)', '(edited)')}</span>}
            <span className="tabular-nums">{timeStr}</span>
            {mine && (
              (message.readBy?.length ?? 0) > 1 ? (
                <CheckCheck className="w-3 h-3" aria-label={t('Διαβάστηκε', 'Read')} />
              ) : (
                <Check className="w-3 h-3" aria-label={t('Στάλθηκε', 'Sent')} />
              )
            )}
          </div>
        </div>

        {/* Actions stay tucked until hover (desktop) or a tap on the bubble (touch). */}
        <div
          className={cn(
            'flex items-center gap-1 shrink-0 transition-opacity',
            isSelected || reactOpen
              ? 'visible opacity-100'
              : 'invisible opacity-0 md:group-hover:visible md:group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100',
          )}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setReactOpen((v) => !v)}
              aria-label={t('Αντίδραση', 'React')}
              title={t('Αντίδραση', 'React')}
              className="min-h-7 min-w-7 p-1 rounded-full text-ink-muted hover:bg-ink/10 hover:text-ink"
            >
              <SmilePlus className="w-3.5 h-3.5" />
            </button>
            {reactOpen && (
              <div
                className={cn(
                  'absolute bottom-full mb-1 z-20 flex items-center gap-1 rounded-full border border-border bg-surface-raised px-2 py-1 shadow-soft-lg',
                  mine ? 'right-0' : 'left-0',
                )}
              >
                {QUICK_REACTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      onReact(message.id, em);
                      setReactOpen(false);
                    }}
                    className="text-sm hover:scale-125 transition-transform px-0.5"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onReply(message)}
            aria-label={t('Απάντηση', 'Reply')}
            title={t('Απάντηση', 'Reply')}
            className="min-h-7 min-w-7 p-1 rounded-full text-ink-muted hover:bg-ink/10 hover:text-ink"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          {onPin && (
            <button
              type="button"
              onClick={() => onPin(message.id)}
              aria-label={t('Καρφίτσωμα', 'Pin')}
              title={t('Καρφίτσωμα', 'Pin')}
              className={cn(
                'min-h-7 min-w-7 p-1 rounded-full hover:bg-ink/10',
                message.pinned ? 'text-amber-500' : 'text-ink-muted hover:text-ink',
              )}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
          {mine && onEdit && message.type === 'text' && (
            <button
              type="button"
              onClick={() => {
                setEditText(message.body);
                setEditing(true);
              }}
              aria-label={t('Επεξεργασία', 'Edit')}
              title={t('Επεξεργασία', 'Edit')}
              className="min-h-7 min-w-7 p-1 rounded-full text-ink-muted hover:bg-ink/10 hover:text-ink"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {mine && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              aria-label={t('Διαγραφή', 'Delete')}
              title={t('Διαγραφή', 'Delete')}
              className="min-h-7 min-w-7 p-1 rounded-full text-ink-muted hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Reaction chips */}
      {reactionEntries.length > 0 && (
        <div className="flex flex-wrap gap-x-1 gap-y-3 mt-1 px-1">
          {reactionEntries.map(([em, ids]) => {
            const reacted = Boolean(viewerId && ids.includes(viewerId));
            return (
              <button
                key={em}
                type="button"
                onClick={() => onReact(message.id, em)}
                className={cn(
                  'tap-area-y inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-count font-bold border transition-colors',
                  reacted
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-border bg-surface-raised text-ink-muted hover:border-border-strong',
                )}
              >
                <span>{em}</span>
                <span className="tabular-nums">{ids.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Photo lightbox */}
      {lightboxOpen && message.media?.kind === 'image' && (
        <div
          className="fixed inset-0 z-fullscreen bg-black/85 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={message.media.label || t('Φωτογραφία', 'Photo')}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={t('Κλείσιμο', 'Close')}
            onClick={() => setLightboxOpen(false)}
            className="absolute inset-0 w-full h-full cursor-default"
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label={t('Κλείσιμο', 'Close')}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/15 text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={message.media.url}
            alt={message.media.label || ''}
            className="relative z-10 max-w-full max-h-[85vh] rounded-2xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
