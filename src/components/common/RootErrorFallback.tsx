import { fallbackLanguage } from '../../lib/fallbackLanguage';

export function RootErrorFallback({
  error,
  onReload = () => window.location.reload(),
  onHome = () => window.location.assign('/'),
}: {
  error: unknown;
  onReload?: () => void;
  onHome?: () => void;
}) {
  const language = fallbackLanguage();
  const t = (gr: string, en: string) => language === 'el' ? gr : en;
  return (
    <main lang={language} className="flex flex-col items-center justify-center min-h-screen p-5 text-center gap-4">
      <h1 className="text-sm md:text-base font-bold text-red-600">{t('Κάτι πήγε στραβά', 'Something went wrong')}</h1>
      <p>{t('Δοκίμασε ξανά ή επέστρεψε στην αρχική σελίδα.', 'Try again or return to the home page.')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onReload} className="min-h-11 rounded-xl border px-4">{t('Επαναφόρτωση', 'Reload')}</button>
        <button type="button" onClick={onHome} className="min-h-11 rounded-xl border px-4">{t('Αρχική σελίδα', 'Go home')}</button>
      </div>
      <details className="max-w-lg text-left">
        <summary className="min-h-11 cursor-pointer py-3">{t('Τεχνικές λεπτομέρειες', 'Technical details')}</summary>
        <pre className="text-xs whitespace-pre-wrap break-words overflow-auto">{String(error ?? '')}</pre>
      </details>
    </main>
  );
}
