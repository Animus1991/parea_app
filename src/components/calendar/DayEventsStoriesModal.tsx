import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO, isSameDay } from 'date-fns';
import { el as elLocale, enUS } from 'date-fns/locale';
import {
  X,
  MapPin,
  Calendar,
  Download,
  MessageCircle,
  ExternalLink,
  CalendarDays,
  ShieldCheck,
  Users,
  Ticket,
  Navigation,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import type { TrustTier } from '../../types';
import type { PlannedEvent } from '../../types/plannedEvent';
import { openGoogleCalendar, downloadICS } from '../../lib/eventCalendarExport';
import { EventCoverImage } from '../events/EventCoverImage';
import { cn } from '../../lib/utils';
import { SlideNavArrows } from '../ui/SlideNavArrows';

export interface DayEventsStoriesModalProps {
  day: Date;
  events: PlannedEvent[];
  startIndex?: number;
  onClose: () => void;
  onOpenDaySchedule: () => void;
}

export function DayEventsStoriesModal({
  day,
  events,
  startIndex = 0,
  onClose,
  onOpenDaySchedule,
}: DayEventsStoriesModalProps) {
  const [index, setIndex] = useState(startIndex);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const locale = language === 'el' ? elLocale : enUS;
  const ev = events[index];

  const goNext = useCallback(() => {
    setIndex((i) => (i >= events.length - 1 ? i : i + 1));
  }, [events.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex, day]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, goNext, goPrev]);

  if (!ev) return null;

  const eventDay = ev.parsedDate;
  const headerDayLabel = isSameDay(eventDay, day)
    ? format(day, 'EEEE d MMMM yyyy', { locale })
    : `${format(day, 'EEEE d MMMM', { locale })} · ${format(eventDay, 'd MMMM yyyy', { locale })}`;

  const tierLabel = t(
    tierLabelEl(ev.trustTier as TrustTier),
    tierLabelEn(ev.trustTier as TrustTier),
  );

  const groupLabel =
    ev.groupStatus === 'confirmed'
      ? t('Ομάδα επιβεβαιωμένη', 'Group confirmed')
      : ev.groupStatus === 'pending'
        ? t('Ομάδα σε αναμονή', 'Group pending')
        : t('Χωρίς ομάδα', 'No group');

  const ticketLabel =
    ev.ticketStatus === 'active'
      ? t('Εισιτήριο ενεργό', 'Ticket active')
      : ev.ticketStatus === 'pending'
        ? t('Εισιτήριο σε εκκρεμότητα', 'Ticket pending')
        : ev.ticketStatus === 'used'
          ? t('Εισιτήριο χρησιμοποιήθηκε', 'Ticket used')
          : t('Δωρεάν / χωρίς εισιτήριο', 'Free / no ticket');

  const hasMap = ev.lat != null && ev.lng != null;

  const openMaps = () => {
    if (hasMap) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}`,
        '_blank',
        'noopener,noreferrer',
      );
    } else if (ev.address) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}`,
        '_blank',
        'noopener,noreferrer',
      );
    }
  };

  const actionBtn =
    'flex items-center justify-center gap-2 rounded-2xl font-bold transition-colors min-h-11 text-sm';
  const outlineBtn = cn(actionBtn, 'border border-white/15 bg-white/5 text-white hover:bg-white/10');
  const primaryBtn = cn(actionBtn, 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-soft');

  const hasMultiple = events.length > 1;

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6 bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-stories-title"
    >
      {hasMultiple && (
        <SlideNavArrows
          placement="outside"
          canPrev={index > 0}
          canNext={index < events.length - 1}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
      <div className="relative w-full max-w-lg h-full md:h-auto md:max-h-[90vh] flex flex-col bg-[#0f1419] md:rounded-2xl overflow-hidden shadow-soft border border-white/10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#151b22] shrink-0">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 truncate">
              {headerDayLabel}
            </p>
            <p className="text-sm text-gray-400 font-medium">
              {index + 1} / {events.length} {t('εκδηλώσεις', 'events')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 min-h-11 min-w-11 flex items-center justify-center shrink-0"
            aria-label={t('Κλείσιμο', 'Close')}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative w-full aspect-[4/5] md:aspect-[16/10] shrink-0">
          {hasMultiple && (
            <>
              <button
                type="button"
                aria-label={t('Προηγούμενη', 'Previous')}
                onClick={goPrev}
                className="absolute left-0 top-14 bottom-32 w-1/4 z-[5] md:hidden"
              />
              <button
                type="button"
                aria-label={t('Επόμενη', 'Next')}
                onClick={goNext}
                className="absolute right-0 top-14 bottom-32 w-1/4 z-[5] md:hidden"
              />
            </>
          )}
          <EventCoverImage
            src={ev.imageUrl}
            alt={ev.title}
            category={ev.category}
            className="absolute inset-0"
            imgClassName="opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1419] via-[#0f1419]/20 to-black/40 pointer-events-none" />

          {hasMultiple && (
            <>
              <SlideNavArrows
                placement="inside"
                canPrev={index > 0}
                canNext={index < events.length - 1}
                onPrev={goPrev}
                onNext={goNext}
              />
              <div className="absolute top-3 inset-x-0 flex justify-center gap-1.5 z-10 md:top-4">
                {events.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 rounded-full transition-all',
                      i === index ? 'w-6 bg-cyan-400' : 'w-2 bg-white/40',
                    )}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-0 inset-x-0 p-4 md:p-5 space-y-1.5 z-[1]">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-200 bg-cyan-950/90 border border-cyan-800/50 px-2 py-0.5 rounded-lg">
              {ev.category}
            </span>
            <h2 id="day-stories-title" className="text-lg md:text-xl font-extrabold text-white leading-tight">
              {ev.title}
            </h2>
            <p className="text-sm text-gray-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">{ev.locationName}</span>
            </p>
            <p className="text-sm text-gray-400 font-medium">
              {format(parseISO(ev.event.date), 'PPP', { locale })} · {ev.time}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#151b22]">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-gray-500 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 shrink-0" /> {t('Εμπιστοσύνη', 'Trust')}
              </p>
              <p className="text-white font-bold text-sm">{tierLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-gray-500 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" /> {t('Ομάδα', 'Group')}
              </p>
              <p className="text-white font-bold text-sm">{groupLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 col-span-2">
              <p className="text-gray-500 font-bold uppercase tracking-wide mb-1 flex items-center gap-1">
                <Ticket className="w-3 h-3 shrink-0" /> {t('Εισιτήριο', 'Ticket')}
              </p>
              <p className="text-white font-bold text-sm">{ticketLabel}</p>
            </div>
          </div>

          {ev.meetingPoint && (
            <div className="rounded-2xl border border-cyan-800/40 bg-cyan-950/30 p-3">
              <p className="text-cyan-400/90 font-bold text-xs uppercase tracking-wide mb-1">
                {t('Σημείο συνάντησης', 'Meeting point')}
              </p>
              <p className="text-white text-sm font-medium leading-snug">{ev.meetingPoint}</p>
            </div>
          )}

          {hasMap || ev.address ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-cyan-900/40 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">
                  {t('Τοποθεσία', 'Location')}
                </p>
                <p className="text-sm text-white font-medium leading-snug">
                  {ev.address || ev.locationName}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-medium text-center py-2 rounded-2xl border border-dashed border-white/10">
              {t(
                'Η τοποθεσία θα είναι διαθέσιμη μετά την επιβεβαίωση',
                'Location will be available after confirmation',
              )}
            </p>
          )}

          <div className="space-y-2 pt-1 border-t border-white/10">
            <button type="button" onClick={onOpenDaySchedule} className={cn(outlineBtn, 'w-full border-cyan-700/50 text-cyan-100')}>
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              {t('Άνοιγμα ημερήσιου προγράμματος', 'Open day schedule')}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/events/${ev.id}`);
              }}
              className={cn(primaryBtn, 'w-full')}
            >
              <ExternalLink className="w-4 h-4" />
              {t('Προβολή εκδήλωσης', 'View event')}
            </button>

            {ev.groupId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/chat/${ev.groupId}`);
                }}
                className={cn(outlineBtn, 'w-full')}
              >
                <MessageCircle className="w-4 h-4" />
                {t('Συνομιλία ομάδας', 'Group chat')}
              </button>
            )}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 px-1">
                {t('Προσθήκη στο ημερολόγιο', 'Add to calendar')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openGoogleCalendar(ev.event, { meetingPoint: ev.meetingPoint })}
                  className={cn(outlineBtn, 'w-full text-xs')}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  {t('Google Calendar', 'Google Calendar')}
                </button>
                <button
                  type="button"
                  onClick={() => downloadICS(ev.event, { meetingPoint: ev.meetingPoint })}
                  className={cn(outlineBtn, 'w-full text-xs')}
                >
                  <Download className="w-4 h-4 shrink-0" />
                  {t('Λήψη .ics', 'Download .ics')}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={openMaps}
              disabled={!hasMap && !ev.address}
              className={cn(
                outlineBtn,
                'w-full',
                !hasMap && !ev.address && 'opacity-50 cursor-not-allowed',
              )}
            >
              <Navigation className="w-4 h-4" />
              {t('Χάρτης / οδηγίες', 'Map / directions')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
