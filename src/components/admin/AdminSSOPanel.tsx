import { useState } from 'react';
import { KeyRound, Shield } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { toast } from 'sonner';

export function AdminSSOPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const logAdminAction = useStore((s) => s.logAdminAction);
  const [provider, setProvider] = useState<'google' | 'microsoft' | 'okta'>('google');
  const [domain, setDomain] = useState('');
  const [enforce, setEnforce] = useState(false);

  return (
    <Card className={cn('p-5 space-y-4', a.cardSurface)}>
      <div className="flex items-center gap-2">
        <KeyRound className={cn('w-5 h-5', a.iconAccent)} />
        <h2 className={cn('text-sm font-bold', a.head)}>{t('SSO & Enterprise Auth', 'SSO & Enterprise Auth')}</h2>
      </div>
      <p className={cn('text-sm', a.sub)}>
        {t(
          'Ρύθμιση SAML/OIDC για οργανισμούς — demo UI, έτοιμο για backend.',
          'SAML/OIDC setup for organizations — demo UI, backend-ready.',
        )}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={cn('text-xs font-bold uppercase tracking-wider', a.muted)}>Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as typeof provider)}
            className={cn('mt-1 w-full rounded-xl border px-3 py-2 text-sm', a.borderB, a.cardSurface)}
          >
            <option value="google">Google Workspace</option>
            <option value="microsoft">Microsoft Entra</option>
            <option value="okta">Okta</option>
          </select>
        </label>
        <label className="block">
          <span className={cn('text-xs font-bold uppercase tracking-wider', a.muted)}>
            {t('Domain', 'Email domain')}
          </span>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.org"
            className={cn('mt-1 w-full rounded-xl border px-3 py-2 text-sm', a.borderB, a.cardSurface)}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={enforce} onChange={(e) => setEnforce(e.target.checked)} />
        <span className={cn('text-sm font-medium', a.head)}>
          {t('Υποχρεωτικό SSO για admin', 'Enforce SSO for admin users')}
        </span>
        <Shield className={cn('w-4 h-4', a.muted)} />
      </label>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          logAdminAction('sso_configure', provider, domain || undefined);
          toast.success(t('SSO ρυθμίσεις αποθηκεύτηκαν (demo)', 'SSO settings saved (demo)'));
        }}
      >
        {t('Αποθήκευση ρυθμίσεων', 'Save settings')}
      </Button>
    </Card>
  );
}
