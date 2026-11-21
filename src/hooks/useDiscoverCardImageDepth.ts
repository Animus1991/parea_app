import { useCallback, useState } from 'react';
import {
  CARD_IMAGE_DEPTHS,
  applyDefaultCardImageDepthIfUnset,
  writeStoredCardImageDepth,
  type EventCardImageDepth,
} from '../lib/discoverCardImagePreview';

export function useDiscoverCardImageDepth() {
  const [stored, setStored] = useState<EventCardImageDepth>(applyDefaultCardImageDepthIfUnset);

  const setDepth = useCallback((next: EventCardImageDepth) => {
    setStored(next);
    writeStoredCardImageDepth(next);
  }, []);

  return { depth: stored, setDepth, options: CARD_IMAGE_DEPTHS };
}
