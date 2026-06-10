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

  return (
    <div className={cn('rounded-2xl border p-4 space-y-4 mt-8', a.cardSurface, a.borderB)}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-red-500" />
        <h2 className={cn('text-sm font-bold', a.head)}>
          {t('Looking for company — moderation (mock)', 'Looking for company — moderation (mock)')}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-lg font-black">{active.length}</p>
          <p className="text-[10px] font-bold opacity-60">{t('Ενεργά', 'Active')}</p>
        </div>
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-lg font-black">{reported.length}</p>
          <p className="text-[10px] font-bold opacity-60">{t('Αναφερμένα', 'Reported')}</p>
        </div>
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-lg font-black">{reports.length}</p>
          <p className="text-[10px] font-bold opacity-60">{t('Αναφορές', 'Reports')}</p>
        </div>
        <div className={cn('rounded-xl border p-3', a.borderB)}>
          <p className="text-lg font-black">2</p>
          <p className="text-[10px] font-bold opacity-60">{t('Ύποπτα', 'Suspicious')}</p>
        </div>
      </div>

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {reported.length === 0 ? (
          <li className={cn('text-[12px]', a.sub)}>{t('Καμία αναφερμένη αίτηση.', 'No reported requests.')}</li>
        ) : (
          reported.map((r) => (
            <li key={r.id} className={cn('flex items-center justify-between gap-2 rounded-xl border p-3 text-[11px]', a.borderB)}>
              <span className="font-mono truncate">{r.id}</span>
              <span className="opacity-60">{r.reportCountInternal} reports</span>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => pauseRequest(r.id)}
                  className="p-1.5 rounded-lg border"
                  title={t('Παύση', 'Pause')}
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteRequest(r.id)}
                  className="p-1.5 rounded-lg border text-red-600"
                  title={t('Αφαίρεση', 'Remove')}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <p className={cn('text-[10px] flex items-center gap-1', a.sub)}>
        <Flag className="w-3 h-3" />
        {t('Εσωτερικό mock — χωρίς δημόσια counts αναφορών.', 'Internal mock — no public report counts.')}
      </p>
    </div>
  );
}
