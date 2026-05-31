import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { downloadEventIcs } from '../lib/eventIcs';
import { useEventDetailShare } from './useEventDetailShare';
import type { Event } from '../types';

/**
 * Share, QR, ICS, and persisted save — synced with store.savedEvents (story rail «seen» rings).
 */
export function useEventDetailActions(eventId: string | undefined, event?: Event | null) {
  const savedEvents = useStore((s) => s.savedEvents) || [];
  const toggleSavedEvent = useStore((s) => s.toggleSavedEvent);
  const [showQRCode, setShowQRCode] = useState(false);

  const isSaved = eventId ? savedEvents.includes(eventId) : false;
  const { isCopied, handleShare } = useEventDetailShare(event?.title);

  const handleSave = useCallback(() => {
    if (eventId) toggleSavedEvent(eventId);
  }, [eventId, toggleSavedEvent]);

  const handleAddToCalendar = useCallback(() => {
    if (event) downloadEventIcs(event);
  }, [event]);

  return {
    isSaved,
    handleSave,
    showQRCode,
    setShowQRCode,
    isCopied,
    handleShare,
    handleAddToCalendar,
  };
}
