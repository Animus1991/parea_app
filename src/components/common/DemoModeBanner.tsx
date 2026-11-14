import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';

export function DemoModeBanner() {
  const { t } = useLanguage();
  const demoMode = useStore((s) => s.demoMode);
  const exitDemoMode = useStore((s) => s.exitDemoMode);

  if (!demoMode) return null;

  return (
    <div role="status" className="relative shrink-0 z-banner bg-amber-800 text-white text-xs font-semibold py-1.5 px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-center">
      <span>
        {t(
          'Λειτουργία επίδειξης — οι αλλαγές δεν αποθηκεύονται μόνιμα',
          'Demo mode — changes are not permanently saved',
        )}
      </span>
      <button type="button" onClick={() => exitDemoMode()} className="underline hover:opacity-80">
        {t('Έξοδος', 'Exit')}
      </button>
    </div>
  );
}
