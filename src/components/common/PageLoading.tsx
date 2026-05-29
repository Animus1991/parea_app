import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { cn } from '../../lib/utils';

export function PageLoading({ label }: { label?: string }) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className={cn('h-8 w-8 animate-spin', tok.accentText)} aria-hidden />
      <p className={cn('text-sm font-medium', tok.sub)}>
        {label ?? t('Φόρτωση…', 'Loading…')}
      </p>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn('h-1.5 w-1.5 rounded-full animate-pulse', tok.accentBg)}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
