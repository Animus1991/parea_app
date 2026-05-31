import { useState, useCallback } from 'react';
import { useLanguage } from '../lib/i18n';

export function useEventDetailShare(eventTitle?: string) {
  const { t } = useLanguage();
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = eventTitle || t('Εκδήλωση Parea', 'Parea Event');

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      // User dismissed native share sheet
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setIsCopied(false);
    }
  }, [eventTitle, t]);

  return { isCopied, handleShare, shareUrl: typeof window !== 'undefined' ? window.location.href : '' };
}
