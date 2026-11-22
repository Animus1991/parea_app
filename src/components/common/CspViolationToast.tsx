import { useEffect, useRef } from 'react';
import { useLanguage } from '../../lib/i18n';
import { useToast } from '../../hooks/use-toast';

/**
 * Surfaces a single, calm notice if the browser reports a CSP violation.
 * Helps diagnose Google/Firebase login issues when CSP_MODE=enforce without
 * removing any auth flow. Silent when CSP is fine.
 */
export function CspViolationToast() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (shown.current) return;
      // Ignore noisy report-only noise for inline styles that we already allow via tokens.
      if (event.effectiveDirective === 'style-src-elem' || event.effectiveDirective === 'style-src-attr') {
        return;
      }
      shown.current = true;
      toast({
        title: t('Κάποιο σενάριο μπλοκαρίστηκε — αν η σύνδεση αποτύχει, δοκίμασε ξανά.', 'A script was blocked — if sign-in fails, retry.'),
      });
    };
    document.addEventListener('securitypolicyviolation', onViolation);
    return () => document.removeEventListener('securitypolicyviolation', onViolation);
  }, [t, toast]);

  return null;
}
