import { useState } from 'react';
import { Palette } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { THEME_LABELS, type ThemeId } from '../../lib/themes';
import { toast } from 'sonner';

export function AdminBrandingPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logAdminAction = useStore((s) => s.logAdminAction);
  const [orgName, setOrgName] = useState('Nakamas');
  const [primary, setPrimary] = useState('#0E8B8D');

  const previewThemes = (Object.keys(THEME_LABELS) as ThemeId[]).slice(0, 4);

  return (
    <Card className={cn('p-5 space-y-4', a.cardSurface)}>
      <div className="flex items-center gap-2">
        <Palette className={cn('w-5 h-5', a.iconAccent)} />
        <h2 className={cn('text-sm font-bold', a.head)}>{t('Branding & Θέμα', 'Branding & Theme')}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={cn('text-xs font-bold uppercase tracking-wider', a.muted)}>
            {t('Όνομα οργανισμού', 'Organization name')}
          </span>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className={cn('mt-1 w-full rounded-xl border px-3 py-2 text-sm', a.borderB, a.cardSurface)}
          />
        </label>
        <label className="block">
          <span className={cn('text-xs font-bold uppercase tracking-wider', a.muted)}>
            {t('Κύριο χρώμα', 'Primary color')}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-10 w-14 rounded-lg border cursor-pointer"
            />
            <span className={cn('text-sm tabular-nums', a.sub)}>{primary}</span>
          </div>
        </label>
      </div>
      <div>
        <p className={cn('text-xs font-bold uppercase tracking-wider mb-2', a.muted)}>
          {t('Προεπιλεγμένο θέμα πλατφόρμας', 'Default platform theme')}
        </p>
        <div className="flex flex-wrap gap-2">
          {previewThemes.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                theme === id ? 'bg-cyan-600 text-white border-cyan-600' : cn(a.borderB, a.sub),
              )}
            >
              {THEME_LABELS[id]?.el ?? id}
            </button>
          ))}
        </div>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          logAdminAction('branding_save', orgName, primary);
          toast.success(t('Branding αποθηκεύτηκε (demo)', 'Branding saved (demo)'));
        }}
      >
        {t('Αποθήκευση', 'Save')}
      </Button>
    </Card>
  );
}
