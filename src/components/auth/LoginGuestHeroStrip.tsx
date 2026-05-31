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
  accentClass = 'bg-cyan-50 text-cyan-600',
  variant = 'light',
}: LoginGuestHeroStripProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className={cn('w-full max-w-md mx-auto mb-6 text-center space-y-3', className)}>
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
          'text-[10px] font-bold uppercase tracking-widest',
          variant === 'dark' ? 'text-cyan-400' : 'text-cyan-600',
        )}
      >
        {t('Εξερεύνηση Δραστηριοτήτων', 'Explore Activities')}
      </p>
      <p
        className={cn(
          'text-sm font-medium leading-relaxed px-2',
          variant === 'dark' ? 'text-gray-400' : 'text-gray-600',
        )}
      >
        {t(
          'Ανακαλύψτε εκδηλώσεις, συνδεθείτε με ομάδες και σχεδιάστε βόλτες — πριν συνδεθείτε.',
          'Discover events, join groups, and plan outings — before you sign in.',
        )}
      </p>
      <button
        type="button"
        onClick={() => navigate('/trust')}
        className={cn(
          'text-xs font-bold underline-offset-2 hover:underline',
          variant === 'dark'
            ? 'text-cyan-400 hover:text-cyan-300'
            : 'text-cyan-600 hover:text-cyan-700',
        )}
      >
        {t('Πώς λειτουργεί το Nakamas', 'How Nakamas works')}
      </button>
    </div>
  );
}
