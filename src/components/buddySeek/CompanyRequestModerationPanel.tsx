import { Flag, EyeOff, Pause, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

/** Mock admin moderation for company requests */
export function CompanyRequestModerationPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const requests = useStore((s) => s.companyRequests);
  const reports = useStore((s) => s.companyRequestReports);
  const pauseRequest = useStore((s) => s.pauseCompanyRequest);
  const deleteRequest = useStore((s) => s.deleteCompanyRequest);

  const active = requests.filter((r) => r.status === 'active');
  const reported = requests.filter((r) => (r.reportCountInternal ?? 0) > 0);
  /** ≥2 internal reports = elevated risk (live, not hardcoded). */
  const suspicious = reported.filter((r) => (r.reportCountInternal ?? 0) >= 2).length;

  return (
    <div className={cn('rounded-2xl border p-4 space-y-4 mt-5', a.cardSurface, a.borderB)}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-red-500" />
        <h2 className={cn('text-sm md:text-base font-bold', a.head)}>
          {t('Αναζήτηση Nakamas — εποπτεία', 'Looking for Nakamas — moderation')}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-sm md:text-base font-black">{active.length}</p>
          <p className="text-xs font-bold tracking-wide opacity-60">{t('Ενεργά', 'Active')}</p>
        </div>
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-sm md:text-base font-black">{reported.length}</p>
          <p className="text-xs font-bold tracking-wide opacity-60">{t('Αναφερμένα', 'Reported')}</p>
        </div>
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-sm md:text-base font-black">{reports.length}</p>
          <p className="text-xs font-bold tracking-wide opacity-60">{t('Αναφορές', 'Reports')}</p>
        </div>
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-sm md:text-base font-black">{suspicious}</p>
          <p className="text-xs font-bold tracking-wide opacity-60">{t('Ύποπτα', 'Suspicious')}</p>
        </div>
      </div>

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {reported.length === 0 ? (
          <li className={cn('text-sm', a.sub)}>{t('Καμία αναφερμένη αίτηση.', 'No reported requests.')}</li>
        ) : (
          reported.map((r) => (
            <li key={r.id} className={cn('flex items-center justify-between gap-2 rounded-xl border p-3 text-xs', a.borderB)}>
              <span className="font-mono truncate">{r.id}</span>
              <span className="opacity-60">{r.reportCountInternal} {t('αναφορές', 'reports')}</span>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => pauseRequest(r.id)}
                  className="p-2 min-h-10 min-w-10 flex items-center justify-center rounded-lg border"
                  title={t('Παύση', 'Pause')}
                  aria-label={t('Παύση αιτήματος', 'Pause request')}
                >
                  <Pause className="w-3.5 h-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => deleteRequest(r.id)}
                  className="p-2 min-h-10 min-w-10 flex items-center justify-center rounded-lg border text-red-600"
                  title={t('Αφαίρεση', 'Remove')}
                  aria-label={t('Αφαίρεση αιτήματος', 'Remove request')}
                >
                  <EyeOff className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <p className={cn('text-xs flex items-center gap-1', a.sub)}>
        <Flag className="w-3 h-3" />
        {t('Οι αναφορές δεν εμφανίζονται ποτέ δημόσια.', 'Report counts are never shown publicly.')}
      </p>
    </div>
  );
}
