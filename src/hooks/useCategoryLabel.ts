import { useCallback, useMemo } from 'react';
import { useLanguage } from '../lib/i18n';
import { getHomeCategoryTranslations } from '../lib/homeCategoryLabels';

/** Event categories are stored in English; show them in the reader's language. */
export function useCategoryLabel() {
  const { t } = useLanguage();
  const labels = useMemo(() => getHomeCategoryTranslations(t), [t]);
  return useCallback((category: string) => labels[category] ?? category, [labels]);
}
