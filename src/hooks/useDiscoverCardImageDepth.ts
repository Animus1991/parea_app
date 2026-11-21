import { useCallback, useEffect, useState } from 'react';
import {
  CARD_IMAGE_DEPTHS,
  CARD_IMAGE_DEPTH_STORAGE_KEY,
  applyDefaultCardImageDepthIfUnset,
  parseCardImageDepth,
  subscribeCardImageDepth,
  writeStoredCardImageDepth,
  type EventCardImageDepth,
} from '../lib/discoverCardImagePreview';

export function useDiscoverCardImageDepth() {
  const [stored, setStored] = useState<EventCardImageDepth>(applyDefaultCardImageDepthIfUnset);

  useEffect(() => {
    const unsub = subscribeCardImageDepth(setStored);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CARD_IMAGE_DEPTH_STORAGE_KEY) return;
      setStored(parseCardImageDepth(event.newValue));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setDepth = useCallback((next: EventCardImageDepth) => {
    writeStoredCardImageDepth(next);
  }, []);

  return { depth: stored, setDepth, options: CARD_IMAGE_DEPTHS };
}
