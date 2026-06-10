import { Sparkles, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';

interface HomeOnboardingWelcomeBannerProps {
  onDismiss: () => void;
  useClassicTokens?: boolean;
}

export function HomeOnboardingWelcomeBanner({
  onDismiss,
  useClassicTokens = false,
}: HomeOnboardingWelcomeBannerProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const p = usePageContrast();

  return (
    <div
      className={cn(
        'relative flex gap-3 p-4 rounded-2xl border',
        useClassicTokens
          ? cn('bg-cyan-50/80 border-cyan-100 shadow-soft', h.card)
          : cn(p.cardSurface, p.borderB, 'shadow-sm'),
      )}
      role="status"
    >
      <div
        className={cn(
          'shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center',
          useClassicTokens ? 'bg-cyan-100 text-cyan-700' : cn(p.isDark ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-50 text-cyan-600'),
        )}
      >
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-8">
        <p className={cn('text-sm font-bold', useClassicTokens ? h.heading : p.head)}>
          {t('Το προφίλ σου είναι έτοιμο!', 'Your profile is ready!')}
        </p>
        <p className={cn('text-xs font-medium mt-0.5', useClassicTokens ? h.labelMuted : p.sub)}>
          {t(
            'Φιλτράραμε την αρχική με βάση τα ενδιαφέροντά σου. Ρύθμισε περισσότερα από τα φίλτρα παρακάτω.',
            'We tailored the home feed to your interests. Fine-tune more using the filters below.',
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className={cn(
          'absolute top-3 right-3 p-2 rounded-full min-h-11 min-w-11 flex items-center justify-center transition-colors',
          useClassicTokens ? 'hover:bg-cyan-100 text-gray-500' : cn(p.muted, 'hover:opacity-80'),
        )}
        aria-label={t('Κλείσιμο', 'Close')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
