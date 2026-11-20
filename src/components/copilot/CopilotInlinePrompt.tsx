import { ArrowRight, Bot, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { openCopilot } from '../../ai/copilot';
import { suggestionsForPath, type CopilotSuggestion } from '../../ai/suggestions';

interface Props {
  className?: string;
  title?: { el: string; en: string };
  suggestions?: CopilotSuggestion[];
  /** Max chips shown (desktop shows all, phones show the first). */
  maxChips?: number;
}

/**
 * Slim, page-level entry point to Nakamas AI (Φ24). One row: what the AI can
 * do + page-aware one-tap prompts. Token-only styling → correct in all themes.
 */
export function CopilotInlinePrompt({ className, title, suggestions, maxChips = 3 }: Props) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const hidden = useUIStore((s) => s.aiHintsHidden);
  const setHidden = useUIStore((s) => s.setAiHintsHidden);
  const chips = (suggestions ?? suggestionsForPath(pathname)).slice(0, maxChips);
  if (hidden) return null;
  const hide = () => {
    setHidden(true);
    toast.message(t('Οι προτάσεις AI κρύφτηκαν', 'AI suggestions hidden'), {
      description: t('Το κουμπί «AI» μένει πάνω δεξιά. Επαναφορά από Ρυθμίσεις.', 'The «AI» button stays at the top. Bring them back in Settings.'),
      action: { label: t('Αναίρεση', 'Undo'), onClick: () => setHidden(false) },
    });
  };
  return (
    <section
      aria-label={t('Nakamas AI', 'Nakamas AI')}
      className={cn('@container relative rounded-2xl border border-border bg-surface-raised p-3 pr-10 shadow-soft', className)}
    >
      <button
        type="button"
        onClick={hide}
        aria-label={t('Απόκρυψη προτάσεων AI', 'Hide AI suggestions')}
        title={t('Απόκρυψη προτάσεων AI', 'Hide AI suggestions')}
        className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-accent-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <div className="flex flex-col gap-3 @4xl:flex-row @4xl:items-center">
      <button
        type="button"
        onClick={() => openCopilot()}
        className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent @4xl:max-w-[42%] @4xl:shrink-0"
      >
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg">
          <Bot className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink">
            {title ? t(title.el, title.en) : t('Πες στο Nakamas AI τι θέλεις', 'Tell Nakamas AI what you want')}
          </span>
          <span className="block truncate text-xs text-ink-muted">
            {t('Βρίσκει, αποθηκεύει, οργανώνει και ρυθμίζει για σένα', 'It finds, saves, organises and sets things up for you')}
          </span>
        </span>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-muted md:hidden" aria-hidden />
      </button>
      <div className="noscrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1">
        {chips.map((s, i) => (
          <button
            key={s.el}
            type="button"
            onClick={() => openCopilot(t(s.el, s.en))}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent/50 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              i > 0 && 'hidden @md:inline-flex',
            )}
          >
            {t(s.el, s.en)}
          </button>
        ))}
      </div>
      </div>
    </section>
  );
}
