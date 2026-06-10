import { useState, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import {
  getEventCalendarAvailability,
  openGoogleCalendar,
  downloadICS,
} from '../lib/eventCalendarExport';
import { useEventDetailShare } from './useEventDetailShare';
import type { Event } from '../types';

/**
 * Share, QR, calendar export, and persisted save — synced with store.savedEvents.
 */
export function useEventDetailActions(eventId: string | undefined, event?: Event | null) {
  const savedEvents = useStore((s) => s.savedEvents) || [];
  const toggleSavedEvent = useStore((s) => s.toggleSavedEvent);
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const [showQRCode, setShowQRCode] = useState(false);

  const isSaved = eventId ? savedEvents.includes(eventId) : false;
  const { isCopied, handleShare } = useEventDetailShare(event?.title);

  const calendarAvailability = useMemo(
    () => (event ? getEventCalendarAvailability(event) : { ok: false, reasonEl: '', reasonEn: '' }),
    [event],
  );

  const calendarOptions = useMemo(() => {
    if (!event) return undefined;
    const host = users.find((u) => u.id === event.organizerId);
    const meetingPoint = groups.find((g) => g.eventId === event.id && g.meetingPoint)?.meetingPoint;
    return { hostName: host?.name, meetingPoint };
  }, [event, users, groups]);

  const handleSave = useCallback(() => {
    if (eventId) toggleSavedEvent(eventId);
  }, [eventId, toggleSavedEvent]);

  const handleAddToGoogleCalendar = useCallback(() => {
    if (event && calendarAvailability.ok) {
      openGoogleCalendar(event, calendarOptions);
    }
  }, [event, calendarAvailability.ok, calendarOptions]);

  const handleDownloadIcs = useCallback(() => {
    if (event && calendarAvailability.ok) {
      downloadICS(event, calendarOptions);
    }
  }, [event, calendarAvailability.ok, calendarOptions]);

  return {
    isSaved,
    handleSave,
    showQRCode,
    setShowQRCode,
    isCopied,
    handleShare,
    handleAddToGoogleCalendar,
    handleDownloadIcs,
    calendarAvailability,
  };
}
