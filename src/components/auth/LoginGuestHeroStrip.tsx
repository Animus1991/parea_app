import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

interface LoginGuestHeroStripProps {
  className?: string;
  /** Theme-specific accent classes for icon pill */
  accentClass?: string;
  variant?: 'light' | 'dark';
}

/** Compact guest marketing block for themed Login pages (additive; mirrors HomeGuestHero). */
export function LoginGuestHeroStrip({
  className,
  accentClass = 'bg-cyan-50 text-cyan-700',
  variant = 'light',
}: LoginGuestHeroStripProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className={cn('w-full max-w-md mx-auto mb-4 text-center space-y-3', className)}>
      <div
        className={cn(
          'inline-flex items-center justify-center w-10 h-10 rounded-xl mb-1',
          accentClass,
        )}
      >
        <Compass className="w-5 h-5" />
      </div>
      <p
        className={cn(
          'text-2xs font-bold tracking-widest',
          variant === 'dark' ? 'text-cyan-300' : 'text-cyan-700',
        )}
      >
        {t('Εξερεύνηση Δραστηριοτήτων', 'Explore Activities')}
      </p>
      <p
        className={cn(
          'text-sm font-medium leading-relaxed px-2',
          variant === 'dark' ? 'text-gray-300' : 'text-gray-600',
        )}
      >
        {t(
          'Ανακαλύψτε εκδηλώσεις, συνδεθείτε με ομάδες και σχεδιάστε βόλτες — πριν συνδεθείτε.',
          'Discover events, join groups, and plan outings — before you sign in.',
        )}
      </p>
      <button
        type="button"
        onClick={() => navigate('/help')}
        className={cn(
          'text-xs font-bold underline-offset-2 hover:underline',
          variant === 'dark'
            ? 'text-cyan-300 hover:text-cyan-200'
            : 'text-cyan-700 hover:text-cyan-800',
        )}
      >
        {t('Πώς λειτουργεί το Nakamas', 'How Nakamas works')}
      </button>
    </div>
  );
}
