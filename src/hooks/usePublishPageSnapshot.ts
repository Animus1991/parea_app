import { useEffect } from 'react';
import { clearPageSnapshot, publishPageSnapshot, type PageSnapshot } from '../lib/pageSnapshot';

/** Publish a lightweight page packet for Nakamas AI while this screen is mounted. */
export function usePublishPageSnapshot(partial: Omit<PageSnapshot, 'updatedAt'>): void {
  const { titleEl, titleEn, state, summaryEl, summaryEn, visibleIds } = partial;
  // The ids take part as a string so a fresh array with the same ids republishes nothing.
  const idsKey = visibleIds ? visibleIds.join(',') : undefined;
  useEffect(() => {
    publishPageSnapshot({ titleEl, titleEn, state, summaryEl, summaryEn, visibleIds: idsKey === undefined ? undefined : idsKey === '' ? [] : idsKey.split(',') });
    return () => clearPageSnapshot();
  }, [titleEl, titleEn, state, summaryEl, summaryEn, idsKey]);
}
