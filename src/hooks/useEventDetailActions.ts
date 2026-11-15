import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStore } from '../store';
import {
  getEventCalendarAvailability,
  openGoogleCalendar,
  downloadICS,
} from '../lib/eventCalendarExport';
import { useEventDetailShare } from './useEventDetailShare';
import { useLanguage } from '../lib/i18n';
import type { Event } from '../types';

/** Stable fallback so hook dependencies do not change on every render. */
const NO_SAVED_EVENTS: string[] = [];

/**
 * Share, QR, calendar export, and persisted save — synced with store.savedEvents.
 */
export function useEventDetailActions(eventId: string | undefined, event?: Event | null) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const savedEvents = useStore((s) => s.savedEvents) ?? NO_SAVED_EVENTS;
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
    if (!eventId) return;
    const nextSaved = !savedEvents.includes(eventId);
    toggleSavedEvent(eventId);
    if (nextSaved) {
      toast.success(t('Αποθηκεύτηκε', 'Saved'), {
        action: { label: t('Αποθηκευμένα', 'Saved'), onClick: () => navigate('/saved') },
      });
    } else {
      toast.success(t('Αφαιρέθηκε από τα αποθηκευμένα', 'Removed from saved'));
    }
  }, [eventId, savedEvents, toggleSavedEvent, t, navigate]);

  const handleAddToGoogleCalendar = useCallback(() => {
    if (event && calendarAvailability.ok) {
      openGoogleCalendar(event, calendarOptions);
      toast.info(t('Άνοιγμα Google Calendar', 'Opening Google Calendar'));
    }
  }, [event, calendarAvailability.ok, calendarOptions, t]);

  const handleDownloadIcs = useCallback(() => {
    if (event && calendarAvailability.ok) {
      downloadICS(event, calendarOptions);
      toast.success(t('Το ημερολόγιο εξήχθη', 'Calendar exported'));
    }
  }, [event, calendarAvailability.ok, calendarOptions, t]);

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
