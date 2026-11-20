import { useCallback, useState } from 'react';
import {
  cardImageDepthOptions,
  clampCardImageDepth,
  readStoredCardImageDepth,
  writeStoredCardImageDepth,
  type EventCardImageDepth,
} from '../lib/discoverCardImagePreview';
import { WEB_VIEW_QUERY, useMediaQuery } from './useMediaQuery';

export function useDiscoverCardImageDepth() {
  const isWebView = useMediaQuery(WEB_VIEW_QUERY);
  const [stored, setStored] = useState<EventCardImageDepth>(readStoredCardImageDepth);
  const options = cardImageDepthOptions(isWebView);
  const depth = clampCardImageDepth(stored, isWebView);

  const setDepth = useCallback((next: EventCardImageDepth) => {
    setStored(next);
    writeStoredCardImageDepth(next);
  }, []);

  return { depth, setDepth, options, isWebView };
}
