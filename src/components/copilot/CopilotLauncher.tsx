import { Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useCopilotStore } from '../../store/copilotStore';

/** TopNav entry point for Nakamas AI (visible on every breakpoint). */
export function CopilotLauncher({ className }: { className?: string }) {
  const { t } = useLanguage();
  const open = useCopilotStore((s) => s.open);
  const toggle = useCopilotStore((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-keyshortcuts="Control+J Meta+J"
      aria-label={t('Nakamas AI — ο βοηθός σου', 'Nakamas AI — your assistant')}
      title={t('Nakamas AI (Ctrl/⌘ J)', 'Nakamas AI (Ctrl/⌘ J)')}
      className={cn(
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        open ? 'border-accent bg-accent text-accent-fg' : 'border-accent/30 bg-accent-soft text-ink hover:border-accent/60',
        className,
      )}
    >
      <Bot className={cn('h-4 w-4', !open && 'text-accent')} aria-hidden />
      <span className="hidden sm:inline">AI</span>
    </button>
  );
}
