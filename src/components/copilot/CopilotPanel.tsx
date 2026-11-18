import { FormEvent, KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ArrowUp, Bot, Cloud, Cpu, Mic, MicOff, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useCopilotStore } from '../../store/copilotStore';
import { sendToCopilot } from '../../ai/copilot';
import { getEngineStatus } from '../../ai/geminiClient';
import { suggestionsForPath } from '../../ai/suggestions';
import { useSpeechInput } from '../../hooks/useSpeechInput';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { DESKTOP_DOCK_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { CopilotMessageItem } from './CopilotMessageItem';

function EngineBadge() {
  const { t } = useLanguage();
  const engine = useCopilotStore((s) => s.engine);
  const setEngine = useCopilotStore((s) => s.setEngine);
  useEffect(() => {
    let alive = true;
    void getEngineStatus().then((st) => {
      if (alive) setEngine(st.available ? 'gemini' : 'local', st.model);
    });
    return () => {
      alive = false;
    };
  }, [setEngine]);
  const cloud = engine === 'gemini';
  const label = cloud ? t('Gemini · cloud', 'Gemini · cloud') : t('Τοπικός βοηθός', 'On-device');
  const hint = cloud
    ? t('Απαντά το Gemini μέσω ασφαλούς διακομιστή. Το κλειδί δεν εκτίθεται στον browser.', 'Answers come from Gemini via a secure server; the key never reaches the browser.')
    : t('Λειτουργεί χωρίς σύνδεση και χωρίς κλειδί API. Καταλαβαίνει ελληνικά και αγγλικά.', 'Works offline without an API key. Understands Greek and English.');
  return (
    <span title={hint} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-2xs font-semibold text-ink-muted">
      {cloud ? <Cloud className="h-3 w-3" aria-hidden /> : <Cpu className="h-3 w-3" aria-hidden />}
      {engine ? label : '…'}
      <span className="sr-only">{hint}</span>
    </span>
  );
}

function CopilotConversation({ onClose, onNavigate, headingId }: { onClose: () => void; onNavigate: () => void; headingId: string }) {
  const { t, language } = useLanguage();
  const { pathname } = useLocation();
  const messages = useCopilotStore((s) => s.messages);
  const busy = useCopilotStore((s) => s.busy);
  const clear = useCopilotStore((s) => s.clear);
  const userName = useStore((s) => s.currentUser?.name);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = useMemo(() => suggestionsForPath(pathname), [pathname]);

  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      setDraft('');
      void sendToCopilot(value);
    },
    [busy],
  );

  const speech = useSpeechInput(language, submit);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, busy]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(draft);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(draft);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-raised text-ink">
      {/* Header */}
      <div className="flex h-header shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-fg">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={headingId} className="text-sm md:text-base font-bold leading-tight text-ink">
            Nakamas AI
          </h2>
          <EngineBadge />
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label={t('Νέα συνομιλία', 'New conversation')}
            title={t('Νέα συνομιλία', 'New conversation')}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Κλείσιμο Nakamas AI', 'Close Nakamas AI')}
          title={t('Κλείσιμο (Esc)', 'Close (Esc)')}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Conversation */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 ? (
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm md:text-base font-bold text-ink">
                {userName ? t(`Γεια σου, ${userName}!`, `Hi ${userName}!`) : t('Γεια σου!', 'Hi there!')}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {t(
                  'Γράψε ή πες μου τι θέλεις — βρίσκω εκδηλώσεις, οργανώνω το πρόγραμμά σου, αλλάζω ρυθμίσεις και μιλάω στην ομάδα σου.',
                  'Type or say what you need — I find events, organise your schedule, change settings and message your group.',
                )}
              </p>
            </div>
            <ul className="grid gap-2" aria-label={t('Προτάσεις', 'Suggestions')}>
              {suggestions.map((s) => (
                <li key={s.el}>
                  <button
                    type="button"
                    onClick={() => submit(t(s.el, s.en))}
                    className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:border-accent/50 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Bot className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                    {t(s.el, s.en)}
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-ink-muted">
              {t(
                'Ενέργειες που στέλνουν, δημοσιεύουν ή αλλάζουν το απόρρητο ζητούν πάντα επιβεβαίωση. Κάθε αλλαγή αναιρείται με ένα κλικ.',
                'Anything that sends, publishes or changes privacy always asks first. Every change can be undone in one click.',
              )}
            </p>
          </div>
        ) : (
          messages.map((m) => <CopilotMessageItem key={m.id} message={m} onNavigate={onNavigate} />)
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs font-medium text-ink-muted" role="status">
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent" />
            </span>
            {t('Δουλεύω πάνω σε αυτό…', 'Working on it…')}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2">
        {messages.length > 0 && !busy && (
          <ul className="noscrollbar -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1" aria-label={t('Προτάσεις', 'Suggestions')}>
            {suggestions.slice(0, 3).map((s) => (
              <li key={s.el} className="shrink-0">
                <button
                  type="button"
                  onClick={() => submit(t(s.el, s.en))}
                  className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-accent/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {t(s.el, s.en)}
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={onSubmit} className="flex items-end gap-2 rounded-2xl border border-border bg-surface px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
          <label htmlFor="copilot-input" className="sr-only">
            {t('Μήνυμα προς το Nakamas AI', 'Message to Nakamas AI')}
          </label>
          <textarea
            id="copilot-input"
            ref={inputRef}
            data-autofocus
            rows={1}
            value={speech.listening ? speech.interim || draft : draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={speech.listening ? t('Σε ακούω…', 'Listening…') : t('Ρώτα ή ζήτα κάτι…', 'Ask or tell me to do something…')}
            className="max-h-[132px] min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2 text-sm text-ink outline-none focus-visible:outline-none! placeholder:text-ink-muted"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              aria-pressed={speech.listening}
              aria-label={speech.listening ? t('Διακοπή υπαγόρευσης', 'Stop dictation') : t('Υπαγόρευση με φωνή', 'Dictate with voice')}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                speech.listening ? 'bg-red-600 text-white' : 'text-ink-muted hover:bg-surface-raised hover:text-ink',
              )}
            >
              {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            aria-label={t('Αποστολή', 'Send')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg transition-colors hover:bg-accent-strong disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-1.5 hidden px-1 text-2xs text-ink-muted md:block">
          {t('Enter για αποστολή · Shift+Enter για νέα γραμμή · Ctrl/⌘ J άνοιγμα/κλείσιμο', 'Enter to send · Shift+Enter for a new line · Ctrl/⌘ J to toggle')}
        </p>
      </div>
    </div>
  );
}

function MobileSheet({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  useOverlayBehavior(true, onClose, panelRef);
  return createPortal(
    <div className="fixed inset-0 z-modal flex flex-col" role="dialog" aria-modal="true" aria-labelledby={headingId}>
      <div ref={panelRef} tabIndex={-1} className="flex h-full flex-col outline-none animate-in slide-in-from-bottom-4 fade-in duration-200 motion-reduce:animate-none">
        <CopilotConversation onClose={onClose} onNavigate={onClose} headingId={headingId} />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Nakamas AI panel (Φ24): docked as a resizable-free right column on ≥1024px
 * (the page stays interactive so users watch the AI act), full-screen dialog
 * on smaller screens.
 */
export function CopilotPanel() {
  const open = useCopilotStore((s) => s.open);
  const setOpen = useCopilotStore((s) => s.setOpen);
  const isDesktop = useMediaQuery(DESKTOP_DOCK_QUERY);
  const headingId = useId();
  const close = useCallback(() => setOpen(false), [setOpen]);
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open || !isDesktop) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && asideRef.current?.contains(document.activeElement)) {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isDesktop, close]);

  // Lets floating chat UI step aside while the panel is docked (see index.css).
  useEffect(() => {
    const root = document.documentElement;
    const docked = open && isDesktop;
    if (docked) {
      root.dataset.copilotDocked = 'true';
      root.style.setProperty('--copilot-dock-w', `${asideRef.current?.offsetWidth ?? 400}px`);
    }
    return () => {
      delete root.dataset.copilotDocked;
      root.style.removeProperty('--copilot-dock-w');
    };
  }, [open, isDesktop]);

  if (!open) return null;
  if (!isDesktop) return <MobileSheet onClose={close} />;
  return (
    <aside
      ref={asideRef}
      aria-labelledby={headingId}
      className={cn(
        'hidden lg:flex h-full w-[380px] xl:w-[400px] shrink-0 flex-col border-l border-border bg-surface-raised animate-in slide-in-from-right-4 fade-in duration-200 motion-reduce:animate-none',
      )}
    >
      <CopilotConversation onClose={close} onNavigate={() => undefined} headingId={headingId} />
    </aside>
  );
}
