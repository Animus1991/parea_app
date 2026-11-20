import { useCallback, useState } from 'react';
import {
  CARD_IMAGE_DEPTHS,
  readStoredCardImageDepth,
  writeStoredCardImageDepth,
  type EventCardImageDepth,
} from '../lib/discoverCardImagePreview';

export function useDiscoverCardImageDepth() {
  const [stored, setStored] = useState<EventCardImageDepth>(readStoredCardImageDepth);

  const setDepth = useCallback((next: EventCardImageDepth) => {
    setStored(next);
    writeStoredCardImageDepth(next);
  }, []);

  return { depth: stored, setDepth, options: CARD_IMAGE_DEPTHS };
}
