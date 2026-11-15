import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  RotateCcw,
  ShieldAlert,
  Bot,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import type { CopilotMessage } from '../../store/copilotStore';
import { canUndo, cancelAction, confirmAction, undoAction } from '../../ai/copilot';
import { formatEventLine } from '../../ai/actions';

/** Minimal, safe rendering of model text (no HTML): strips markdown emphasis, keeps bullets. */
function cleanModelText(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^#+\s*/gm, '')
    .trim();
}

function EventResult({ eventId, index, onNavigate }: { eventId: string; index: number; onNavigate: () => void }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const saved = useStore((s) => s.savedEvents.includes(eventId));
  const toggleSaved = useStore((s) => s.toggleSavedEvent);
  if (!event) return null;
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
        </span>
      </button>
      <button
        type="button"
        onClick={() => toggleSaved(event.id)}
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
        {message.error ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />}
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
      </div>
    </div>
  );
}
