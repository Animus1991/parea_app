import { useEffect } from 'react';
import { clearPageSnapshot, publishPageSnapshot, type PageSnapshot } from '../lib/pageSnapshot';

/** Publish a lightweight page packet for Nakamas AI while this screen is mounted. */
export function usePublishPageSnapshot( partial: Omit<PageSnapshot, 'updatedAt'>): void {
  const { titleEl, titleEn, state, summaryEl, summaryEn, visibleIds } = partial;
  const idsKey = visibleIds?.join(',') ?? '';
  useEffect(() => {
    publishPageSnapshot({ titleEl, titleEn, state, summaryEl, summaryEn, visibleIds });
    return () => clearPageSnapshot();
  }, [titleEl, titleEn, state, summaryEl, summaryEn, idsKey]);
}
