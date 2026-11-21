import type { ReactNode } from 'react';
import { ShieldAlert, type LucideIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { useLanguage } from '../../lib/i18n';

interface ResourceStateGateProps {
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  loading: ReactNode;
  children: ReactNode;
  errorIcon?: LucideIcon;
  errorTitle?: string;
  errorDescription?: string;
}

/**
 * Shared gate for secondary pages: skeleton → error EmptyState → content.
 */
export function ResourceStateGate({
  isLoading,
  isError,
  onRetry,
  loading,
  children,
  errorIcon = ShieldAlert,
  errorTitle,
  errorDescription,
}: ResourceStateGateProps) {
  const { t } = useLanguage();

  if (isLoading) return <>{loading}</>;

  if (isError) {
    return (
      <EmptyState
        character="helper"
        icon={errorIcon}
        title={errorTitle ?? t('Αδυναμία φόρτωσης', 'Could not load')}
        description={
          errorDescription ??
          t(
            'Έλεγξε τη σύνδεσή σου.',
            'Check your connection.',
          )
        }
        actionLabel={onRetry ? t('Δοκιμή ξανά', 'Try again') : undefined}
        onAction={onRetry}
      />
    );
  }

  return <>{children}</>;
}
