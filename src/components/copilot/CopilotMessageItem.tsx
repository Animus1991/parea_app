import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  Bot,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useCopilotStore, type CopilotMessage } from '../../store/copilotStore';
import { useAiAuditStore } from '../../store/aiAuditStore';
import { canUndo, cancelAction, confirmAction, undoAction } from '../../ai/copilot';
import { formatEventLine } from '../../ai/actions';
import { explainEventMatch } from '../../lib/matchingExplain';
import { trackEvent } from '../../lib/analytics';

/** Minimal, safe rendering of model text (no HTML): strips markdown emphasis, keeps bullets. */
function cleanModelText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^#+\s*/gm, '')
    .trim();
}

const VOTES_KEY = 'nakamas.copilotVotes';
type CopilotVote = { helpful: boolean; reason?: 'wrong_result' | 'not_done' | 'unclear' };

function readVotes(): Record<string, CopilotVote> {
  try {
    const parsed = JSON.parse(localStorage.getItem(VOTES_KEY) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, CopilotVote>) : {};
  } catch {
    return {};
  }
}

function rememberVote(messageId: string, vote: CopilotVote | null) {
  try {
    const next = { ...readVotes() };
    delete next[messageId];
    if (vote) next[messageId] = vote;
    localStorage.setItem(VOTES_KEY, JSON.stringify(Object.fromEntries(Object.entries(next).slice(-100))));
  } catch {
    /* Private mode: the thumb forgets on reload; the analytics event was still sent. */
  }
}

/**
 * Quiet 👍 / 👎 under an assistant reply. The other thumb changes the verdict,
 * the same thumb takes it back; a 👎 offers a short optional reason. Votes are
 * remembered on this device and counted through analytics.
 */
function CopilotFeedback({ messageId, engine }: { messageId: string; engine?: 'local' | 'gemini' }) {
  const { t } = useLanguage();
  const [vote, setVote] = useState<CopilotVote | null>(() => readVotes()[messageId] ?? null);
  const updateMessage = useCopilotStore((s) => s.update);
  const recordAudit = useAiAuditStore((s) => s.record);
  const currentUserId = useStore((s) => s.currentUser?.id ?? null);

  const save = (next: CopilotVote | null) => {
    setVote(next);
    rememberVote(messageId, next);
    updateMessage(messageId, { feedback: next ? (next.helpful ? 'up' : 'down') : undefined });
    if (next) {
      trackEvent({ name: 'copilot_feedback', messageId, helpful: next.helpful, reason: next.reason });
      recordAudit({
        userId: currentUserId,
        action: `answer_feedback_${next.helpful ? 'up' : 'down'}`,
        risk: 'safe',
        status: 'done',
        engine: engine ?? 'local',
        argKeys: ['messageId'],
        messageId,
      });
    }
  };

  const thumb =
    'flex h-7 w-7 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
  const reasons = [
    { id: 'wrong_result', el: 'Λάθος αποτέλεσμα', en: 'Wrong result' },
    { id: 'not_done', el: 'Δεν έγινε η ενέργεια', en: 'Action not done' },
    { id: 'unclear', el: 'Ασαφής απάντηση', en: 'Unclear answer' },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-1 pl-1">
      <button
        type="button"
        aria-pressed={vote?.helpful === true}
        aria-label={t('Χρήσιμη απάντηση', 'Helpful answer')}
        title={t('Χρήσιμη απάντηση', 'Helpful answer')}
        onClick={() => save(vote?.helpful === true ? null : { helpful: true })}
        className={cn(thumb, vote?.helpful === true ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface hover:text-ink')}
      >
        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={vote?.helpful === false}
        aria-label={t('Όχι χρήσιμη απάντηση', 'Not a helpful answer')}
        title={t('Όχι χρήσιμη απάντηση', 'Not a helpful answer')}
        onClick={() => save(vote?.helpful === false ? null : { helpful: false })}
        className={cn(thumb, vote?.helpful === false ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface hover:text-ink')}
      >
        <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
      </button>
      {vote?.helpful === false && (
        <span role="group" aria-label={t('Τι δεν πήγε καλά;', 'What was wrong?')} className="flex flex-wrap items-center gap-1">
          {reasons.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={vote.reason === r.id}
              onClick={() => save({ helpful: false, reason: vote.reason === r.id ? undefined : r.id })}
              className={cn(
                'rounded-full border px-2 py-0.5 text-2xs font-semibold transition-colors',
                vote.reason === r.id ? 'border-accent bg-accent-soft text-accent' : 'border-border text-ink-muted hover:text-ink',
              )}
            >
              {t(r.el, r.en)}
            </button>
          ))}
        </span>
      )}
    </div>
  );
}

function EventResult({ eventId, index, onNavigate }: { eventId: string; index: number; onNavigate: () => void }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const saved = useStore((s) => s.savedEvents.includes(eventId));
  const toggleSaved = useStore((s) => s.toggleSavedEvent);
  const currentUser = useStore((s) => s.currentUser);
  if (!event) return null;
  // One quiet line on why this fits the user, same source as the event page chips.
  const matchReason = currentUser
    ? explainEventMatch(currentUser, event, language === 'el' ? 'el' : 'en').sharedStrengths[0]
    : undefined;
  const open = () => {
    navigate(`/events/${event.id}`);
    onNavigate();
  };
  return (
    <li className="group relative flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-2 pr-1.5 transition-colors hover:border-border-strong">
      <span
        aria-hidden
        className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-2xs font-bold text-surface-raised tabular-nums"
      >
        {index + 1}
      </span>
      <button type="button" onClick={open} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="h-10 w-10 shrink-0 rounded-lg bg-accent-soft" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{event.title}</span>
          <span className="block truncate text-xs text-ink-muted">{formatEventLine(event, language).split(' · ').slice(1).join(' · ')}</span>
          {matchReason && <span className="block truncate text-xs font-medium text-accent">{matchReason}</span>}
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          const nextSaved = !saved;
          toggleSaved(event.id);
          if (!nextSaved) {
            toast.success(t('Αφαιρέθηκε από τα αποθηκευμένα', 'Removed from saved'), {
              action: {
                label: t('Αναίρεση', 'Undo'),
                onClick: () => toggleSaved(event.id),
              },
            });
          }
        }}
        aria-pressed={saved}
        aria-label={saved ? t('Αφαίρεση από αποθηκευμένες', 'Remove from saved') : t('Αποθήκευση', 'Save')}
        title={saved ? t('Αποθηκευμένη', 'Saved') : t('Αποθήκευση', 'Save')}
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          saved ? 'text-accent' : 'text-ink-muted hover:bg-surface hover:text-ink',
        )}
      >
        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      </button>
    </li>
  );
}

export function CopilotMessageItem({ message, onNavigate }: { message: CopilotMessage; onNavigate: () => void }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const lang = message.lang ?? language;
  const pick = (el?: string, en?: string) => (lang === 'en' ? en ?? el : el ?? en) ?? '';

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-accent-fg">
          {message.text}
        </p>
      </div>
    );
  }

  const body = message.text ? cleanModelText(message.text) : pick(message.el, message.en);
  const action = message.action;
  const undoable = canUndo(message.id) && !message.undone;

  if (message.confirm && action) {
    const destructive = action.risk === 'destructive';
    const preview = pick(action.previewEl, action.previewEn);
    const resolved = action.status !== 'pending';
    return (
      <div
        role="group"
        aria-label={t('Επιβεβαίωση ενέργειας', 'Confirm action')}
        className={cn(
          'rounded-2xl border p-3 text-sm',
          destructive ? 'border-red-300 bg-red-50 dark:border-red-800/60 dark:bg-red-950/30' : 'border-accent/40 bg-accent-soft',
        )}
      >
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          {destructive ? <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400" /> : <Bot className="h-3.5 w-3.5 text-accent" />}
          {body}
        </p>
        <p className="mt-1.5 font-semibold text-ink">{preview}</p>
        {resolved ? (
          <p className="mt-2 text-xs font-medium text-ink">
            {action.status === 'cancelled' && t('Ακυρώθηκε', 'Cancelled')}
            {action.status === 'done' && t('Επιβεβαιώθηκε', 'Confirmed')}
            {action.status === 'failed' && t('Απέτυχε', 'Failed')}
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              data-autofocus
              onClick={() => void confirmAction(message.id)}
              className={cn(
                'inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                destructive ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500' : 'bg-accent text-accent-fg hover:bg-accent-strong focus-visible:ring-accent',
              )}
            >
              <Check className="h-4 w-4" /> {t('Επιβεβαίωση', 'Confirm')}
            </button>
            <button
              type="button"
              onClick={() => cancelAction(message.id)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-raised px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="h-4 w-4" /> {t('Άκυρο', 'Cancel')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (message.compact) {
    return (
      <p className={cn('flex items-start gap-1.5 text-xs font-medium', message.error ? 'text-red-600 dark:text-red-400' : 'text-ink-muted')}>
        {message.error ? <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />}
        <span className="flex-1">{body}</span>
        {undoable && (
          <button type="button" onClick={() => undoAction(message.id)} className="shrink-0 font-semibold text-accent underline-offset-2 hover:underline">
            {t('Αναίρεση', 'Undo')}
          </button>
        )}
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Bot className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {body && (
          <p
            className={cn(
              'whitespace-pre-line rounded-2xl rounded-tl-md border px-3.5 py-2 text-sm leading-relaxed',
              message.error ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200' : 'border-border bg-surface text-ink',
            )}
          >
            {body}
          </p>
        )}
        {message.eventIds && message.eventIds.length > 0 && (
          <ol className="space-y-2 pl-1.5 pt-1" aria-label={t('Αποτελέσματα', 'Results')}>
            {message.eventIds.map((id, i) => (
              <EventResult key={id} eventId={id} index={i} onNavigate={onNavigate} />
            ))}
          </ol>
        )}
        {(message.link || undoable || message.undone) && (
          <div className="flex flex-wrap items-center gap-2">
            {message.link && (
              <button
                type="button"
                onClick={() => {
                  navigate(message.link!.path);
                  onNavigate();
                }}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {pick(message.link.el, message.link.en)} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
            {undoable && (
              <button
                type="button"
                onClick={() => undoAction(message.id)}
                className="inline-flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-accent transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t('Αναίρεση', 'Undo')}
              </button>
            )}
            {message.undone && <span className="text-xs font-medium text-ink-muted">{t('Αναιρέθηκε', 'Undone')}</span>}
          </div>
        )}
        {!message.error && <CopilotFeedback messageId={message.id} engine={message.engine} />}
      </div>
    </div>
  );
}
