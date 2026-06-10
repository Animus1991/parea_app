import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';

export function DemoModeBanner() {
  const { t } = useLanguage();
  const demoMode = useStore((s) => s.demoMode);
  const exitDemoMode = useStore((s) => s.exitDemoMode);

  if (!demoMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-amber-500 text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-4">
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
