import React, { useState, memo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Card } from "../common/Card";
import { Modal } from "../common/Modal";
import { BottomSheet } from "../common/BottomSheet";
import {
  Bookmark,
  Share2,
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Navigation,
  Link2,
  X,
  Crown,
  UserPlus,
  CalendarPlus,
  MessageSquare,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { el as elLocale, enUS as enLocale } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../store";
import type { Event } from "../../types";
import { useLanguage } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { stopBubbling } from "../../lib/a11y";
import { EVENT_CARD_TYPO } from "../../lib/typographyTokens";
import { computeMatchScore, getMatchingPreview } from "../../lib/matching";
import { isDarkTheme } from "../../lib/themes";
import { MatchExplainChips } from "./MatchExplainChips";
import { getEventGroupProgress } from "../../lib/groupUtils";
import { GroupProgressBar } from "./GroupProgressBar";
import { toast } from "sonner";
import { useOverlayBehavior } from "../../hooks/useOverlayBehavior";
import { TileLayer, Marker } from "react-leaflet";
import { LeafletMapHost, LeafletMapReady } from "../common/LeafletMapHost";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface EventCardProps {
  event: Event;
}

/** Mount Leaflet only when the mini-map enters the viewport (avoids N× Strict Mode races). */
function EventCardMiniMap({ lat, lng, isDark, className }: { lat: number; lng: number; isDark: boolean; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn(
        'h-24 w-full rounded-lg overflow-hidden border mt-1 relative z-0 pointer-events-none',
        isDark ? 'border-gray-700/40' : 'border-gray-200',
        className,
      )}
      {...stopBubbling}
    >
      {inView ? (
        <LeafletMapHost
          center={[lat, lng]}
          zoom={14}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          placeholder={<div className="h-full w-full bg-gray-100 dark:bg-gray-800" aria-hidden />}
        >
          <LeafletMapReady>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]} />
          </LeafletMapReady>
        </LeafletMapHost>
      ) : (
        <div className="h-full w-full bg-gray-100 dark:bg-gray-800" aria-hidden />
      )}
    </div>
  );
}

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  const groups = useStore((state) => state.groups);
  const theme = useStore((state) => state.theme);
  const savedEvents = useStore((state) => state.savedEvents) || [];
  const toggleSavedEvent = useStore((state) => state.toggleSavedEvent);
  const canJoinEvent = useStore((state) => state.canJoinEvent);
  const isSaved = savedEvents.includes(event.id);
  const groupProgress = getEventGroupProgress(event, groups);
  const matchScore = currentUser ? computeMatchScore(currentUser, event) : null;
  const matchingPreview = getMatchingPreview(event, groups, users, currentUser);
  const [imgError, setImgError] = useState(false);

  const isDark = isDarkTheme(theme);
  const accent = theme === 'vibrant' || theme === 'vibrant-dark' ? 'fuchsia' : theme === 'bento' || theme === 'bento-dark' ? 'indigo' : theme === 'neon' || theme === 'neon-dark' ? 'emerald' : 'cyan';
  const accentText = isDark ? (accent === 'fuchsia' ? 'text-fuchsia-400' : accent === 'indigo' ? 'text-indigo-400' : accent === 'emerald' ? 'text-emerald-400' : 'text-cyan-400') : (accent === 'fuchsia' ? 'text-fuchsia-600' : accent === 'indigo' ? 'text-indigo-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-brand');
  const accentBg = isDark ? (accent === 'fuchsia' ? 'bg-fuchsia-900/20' : accent === 'indigo' ? 'bg-indigo-900/20' : accent === 'emerald' ? 'bg-emerald-900/20' : 'bg-cyan-900/20') : (accent === 'fuchsia' ? 'bg-fuchsia-50' : accent === 'indigo' ? 'bg-indigo-50' : accent === 'emerald' ? 'bg-emerald-50' : 'bg-cyan-50');
  const headColor = isDark ? 'text-white' : 'text-ink';
  const subColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const mutedColor = isDark ? 'text-gray-500' : 'text-gray-500';
  const borderSub = isDark ? 'border-gray-700/40' : 'border-gray-100';

  const userGroup = currentUser ? groups.find(g => g.eventId === event.id && g.members.includes(currentUser.id)) : null;

  // Arrival & Safety State
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);
  const [arrivalStatus, setArrivalStatus] = useState<string | null>(null);
  const [showEtaPrompt, setShowEtaPrompt] = useState(false);
  const [etaValue, setEtaValue] = useState("15 mins");
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [showLocationConfigModal, setShowLocationConfigModal] = useState(false);
  const [locationConfig, setLocationConfig] = useState({
    precision: "approximate",
    shareWith: "all",
    duration: "event_end",
  });
  const [showSafetyLinkModal, setShowSafetyLinkModal] = useState(false);
  const locationPanelRef = useRef<HTMLDivElement>(null);
  useOverlayBehavior(showLocationConfigModal, () => setShowLocationConfigModal(false), locationPanelRef);

  const organizer = users.find((u) => u.id === event.organizerId);
  const hostGroup = groups.find((g) => g.eventId === event.id && g.hostId);
  const hostUser = hostGroup ? users.find((u) => u.id === hostGroup.hostId) : undefined;
  const displayOrganizer = organizer ?? hostUser;
  const seeksHost = !!event.isPlatformEvent && !displayOrganizer;
  const becomeEventHost = useStore((state) => state.becomeEventHost);
  const handleBecomeHost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) { navigate('/login'); return; }
    becomeEventHost(event.id);
    const hosted = useStore.getState().groups.find(
      (g) => g.eventId === event.id && g.hostId === currentUser.id,
    );
    toast.success(t('Έγινες ο διοργανωτής της ομάδας!', "You're now the group's organizer!"), {
      action: hosted
        ? {
            label: t('Η βραδιά μας', 'Our night'),
            onClick: () => navigate(`/night/${hosted.id}`),
          }
        : {
            label: t('Βρες Nakamas', 'Find Nakamas'),
            onClick: () => navigate('/buddy-seek'),
          },
    });
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSaved = !isSaved;
    toggleSavedEvent(event.id);
    if (nextSaved) {
      toast.success(t('Αποθηκεύτηκε', 'Saved'), {
        action: { label: t('Αποθηκευμένα', 'Saved'), onClick: () => navigate('/saved') },
      });
    } else {
      toast.success(t('Αφαιρέθηκε από τα αποθηκευμένα', 'Removed from saved'), {
        action: {
          label: t('Αναίρεση', 'Undo'),
          onClick: () => toggleSavedEvent(event.id),
        },
      });
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.id}`;
    const shareUrl = `${url}?ref=${currentUser?.id ?? "guest"}`;
    if (navigator.share) {
      navigator.share({ title: event.title, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(t("event_card.copied", "Link copied to clipboard!"));
    }
  };

  const getCalendarUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || "");
    const location = encodeURIComponent(
      event.exactLocation || event.locationArea || "",
    );
    const dateStr = event.date.replace(/-/g, "");
    const timeStr = event.time ? event.time.replace(":", "") + "00" : "000000";
    let endHour = parseInt(event.time ? event.time.split(":")[0] : "0") + 2;
    if (endHour >= 24) endHour = endHour - 24;
    const endHourStr = endHour.toString().padStart(2, "0");
    const minStr = event.time ? event.time.split(":")[1] : "00";
    const endTimeStr = `${endHourStr}${minStr}00`;
    const start = `${dateStr}T${timeStr}`;
    const end = `${dateStr}T${endTimeStr}`;
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${start}/${end}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const dateLocale = language === 'en' ? enLocale : elLocale;
  const eventDate = parseISO(event.date);
  const day = format(eventDate, "d");
  const month = format(eventDate, "MMM", { locale: dateLocale }).toUpperCase();
  const weekday = format(eventDate, "EEEE", { locale: dateLocale });

  return (
    <Card
      className={cn("flex h-full flex-col overflow-hidden cursor-pointer relative group border border-gray-100/80 hover:border-gray-200 hover:shadow-soft-md transition-all duration-300 rounded-2xl p-0", isDark ? "border-white/5 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.25)] bg-gray-800/60 hover:border-white/10" : "shadow-soft bg-white")}
      onClick={() => navigate(`/events/${event.id}`)}
      containsControls
    >
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 shrink-0">
        {!imgError ? (
          <motion.img
            layoutId={`event-image-${event.id}`}
            referrerPolicy="no-referrer"
            src={
              event.imageUrl ||
              "https://picsum.photos/seed/eventdefault/800/600"
            }
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-purple-50 flex items-center justify-center p-4 text-center">
            <span className="text-cyan-600 font-bold card-heading capitalize tracking-tight">
              {event.category}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />

        {/* Date Badge — top left */}
        <div className="absolute top-3 left-3 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl w-11 h-[46px] shadow-soft z-10">
          <span className={cn(EVENT_CARD_TYPO.badge, "mb-0.5", accent === 'fuchsia' ? 'text-gray-500' : accent === 'indigo' ? 'text-indigo-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-brand')}>
            {month}
          </span>
          <span className="text-sm font-extrabold text-gray-900 leading-none">
            {day}
          </span>
        </div>

        {/* Action buttons — top right */}
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <button
            className="p-2 rounded-full backdrop-blur-md focus:outline-none transition-colors bg-white/75 hover:bg-white text-gray-600 hover:text-gray-900"
            onClick={handleShare}
            title={t("Κοινοποίηση", "Share")}
            aria-label={t("Κοινοποίηση", "Share")}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded-full backdrop-blur-md focus:outline-none transition-colors ${isSaved ? (accent === 'fuchsia' ? 'bg-fuchsia-500/20 text-fuchsia-600' : accent === 'emerald' ? 'bg-emerald-500/20 text-emerald-600' : accent === 'indigo' ? 'bg-indigo-500/20 text-indigo-600' : 'bg-accent/20 text-brand') : "bg-white/75 hover:bg-white text-gray-600 hover:text-gray-900"}`}
            onClick={toggleSave}
            title={t("Αποθήκευση", "Save")}
            aria-label={isSaved ? t("Αφαίρεση αποθήκευσης", "Remove from saved") : t("Αποθήκευση", "Save")}
          >
            <Bookmark
              className="h-4 w-4"
              fill={isSaved ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Tags + Price — bottom of image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10 gap-2">
          <div className="flex flex-nowrap overflow-hidden gap-1.5 flex-1 w-full max-w-[65%]">
            {(event.tags ?? []).slice(0, 2).map((tag: string) => (
              <span
                key={tag}
                className="bg-black/35 backdrop-blur-sm text-white/95 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-medium capitalize tracking-wide whitespace-nowrap truncate max-w-[100px] text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className={cn("bg-white/90 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl font-bold text-ink tracking-tight flex flex-col items-end shrink-0", EVENT_CARD_TYPO.dateBadge)}>
            {event.isPaid ? `€${event.price}` : t("event_card.free", "Free")}
            {event.isPaid && event.groupDiscount && (
              <span className={cn(EVENT_CARD_TYPO.dateSub, "text-brand block mt-0.5")}>
                -{event.groupDiscount.percentage}% {t('ομαδική έκπτωση', 'group discount')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section — quieter hierarchy; all info kept */}
      <div className="p-4 flex flex-col flex-1 gap-0">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <h3 className={cn(EVENT_CARD_TYPO.title, "transition-colors line-clamp-2", headColor, isDark ? (accent === 'fuchsia' ? '' : accent === 'indigo' ? 'group-hover:text-indigo-400' : accent === 'emerald' ? 'group-hover:text-emerald-400' : 'group-hover:text-cyan-400') : (accent === 'fuchsia' ? '' : accent === 'indigo' ? 'group-hover:text-indigo-600' : accent === 'emerald' ? 'group-hover:text-emerald-600' : 'group-hover:text-brand'))}>
            <Link
              to={`/events/${event.id}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded-sm outline-none focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {event.title}
            </Link>
          </h3>
          {currentUser && matchScore != null && (
            <div className="flex flex-col items-end shrink-0 pt-0.5" title={t("Ταίριασμα", "Match")}>
              <span className={cn(EVENT_CARD_TYPO.matchScore, "font-bold", accent === 'fuchsia' ? headColor : accentText)}>
                {matchScore}%
              </span>
              <span className={cn(EVENT_CARD_TYPO.matchLabel, mutedColor, "opacity-80")}>
                {t("Ταίριασμα", "Match")}
              </span>
            </div>
          )}
        </div>

        <p className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 font-medium leading-relaxed", EVENT_CARD_TYPO.meta, subColor)}>
          <span className="inline-flex items-center gap-1 capitalize">
            <Clock className={cn("w-3.5 h-3.5 shrink-0 opacity-70", mutedColor)} aria-hidden />
            {weekday}, {event.time}
          </span>
          <span aria-hidden className={cn(mutedColor, "opacity-50")}>·</span>
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin className={cn("w-3.5 h-3.5 shrink-0 opacity-70", mutedColor)} aria-hidden />
            <span className="truncate max-w-[150px]">{event.locationArea}</span>
          </span>
          <span aria-hidden className={cn(mutedColor, "opacity-50")}>·</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Users className={cn("w-3.5 h-3.5 shrink-0 opacity-70", mutedColor)} aria-hidden />
            {groupProgress.spotsLeft} {t("θέσεις", "spots left")}
          </span>
        </p>

        {/* One quiet reason line — matchingPreview wins; else MatchExplainChips reasons (no double chrome). */}
        {matchingPreview ? (
          <p className={cn(EVENT_CARD_TYPO.hint, "mt-2 font-medium", accentText, "opacity-90")}>
            {t(matchingPreview.labelEl, matchingPreview.labelEn)}
          </p>
        ) : (
          currentUser && (
            <MatchExplainChips user={currentUser} event={event} showScore={matchScore == null} className="mt-2" />
          )
        )}

        {/* Organizer — compact row */}
        {displayOrganizer && (
          <button
            type="button"
            className="mt-2.5 flex items-center gap-2 text-left self-start min-h-9 group/org rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/organizer/${displayOrganizer.id}`);
            }}
          >
            <span className="relative shrink-0">
              <img
                referrerPolicy="no-referrer"
                src={displayOrganizer.photoUrl}
                alt=""
                className={cn("w-6 h-6 rounded-full object-cover", isDark ? "ring-1 ring-gray-700" : "ring-1 ring-gray-200")}
              />
              <span className={cn("absolute -bottom-0.5 -right-0.5 bg-green-500 w-2 h-2 rounded-full border border-white", isDark ? "border-gray-800" : "border-white")} aria-hidden />
            </span>
            <span className={cn("card-copy font-medium", mutedColor)}>
              {hostUser && !organizer ? t('Διοργανωτής ομάδας', 'Group host') : t('Διοργανωτής', 'Organizer')}:
            </span>
            <span className={cn("card-copy font-semibold truncate max-w-[140px] group-hover/org:underline", headColor)}>
              {displayOrganizer.name}
            </span>
          </button>
        )}

        {/* Platform event — seeks a group organizer */}
        {seeksHost && (
          <div className={cn("mt-3 rounded-2xl p-3 border", isDark ? "bg-amber-500/10 border-amber-500/25" : "bg-amber-50 border-amber-200")}>
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className={cn("w-4 h-4 shrink-0", isDark ? "text-amber-400" : "text-amber-600")} />
              <div className="flex flex-col">
                <span className={cn(EVENT_CARD_TYPO.avatarLabel, "capitalize", isDark ? "text-amber-300/90" : "text-amber-700")}>
                  {t('Προσφέρεται από Nakamas', 'Offered by Nakamas')}
                </span>
                <span className={cn("text-xs font-bold", isDark ? "text-amber-100" : "text-amber-900")}>
                  {t('Αναζητείται διοργανωτής', 'Looking for an organizer')}
                </span>
              </div>
            </div>
            <button
              onClick={handleBecomeHost}
              className={cn("w-full py-2 rounded-2xl font-bold transition-colors flex items-center justify-center gap-1.5 shadow-soft", EVENT_CARD_TYPO.cta, isDark ? "bg-amber-500 text-gray-900 hover:bg-amber-400" : "bg-amber-600 text-white hover:bg-amber-700")}
            >
              <Crown className="w-3.5 h-3.5" />
              {t('Γίνε Διοργανωτής Nakamas', 'Become Nakamas organizer')}
            </button>
          </div>
        )}

        {/* Group progress + actions */}
        <div className={cn("mt-auto pt-3 border-t border-dashed", borderSub)}>
          <GroupProgressBar
            current={groupProgress.current}
            target={groupProgress.target}
            className="mt-0.5 mb-2.5"
          />
          {groupProgress.discountUnlocked && event.groupDiscount && (
            <p className={cn(EVENT_CARD_TYPO.safetyLabel, "mb-2", isDark ? "text-emerald-400" : "text-emerald-600")}>
              -{event.groupDiscount.percentage}% {t("ομαδική έκπτωση", "group discount")}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSafetyPanel(true);
              }}
              aria-haspopup="dialog"
              aria-label={arrivalStatus ?? (isSharingLocation ? t("Κοινοποίηση τοποθεσίας", "Location sharing") : t("Χάρτης & Ασφάλεια", "Map & Safety"))}
              title={t("Χάρτης & Ασφάλεια", "Map & Safety")}
              className={cn(
                "inline-flex min-w-0 shrink items-center gap-1.5 px-3 min-h-10 rounded-full text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                arrivalStatus || isSharingLocation
                  ? isDark ? "bg-emerald-950/40 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                  : isDark ? "text-gray-300 hover:bg-white/[0.06]" : "text-gray-600 hover:bg-gray-50",
              )}
            >
              <ShieldCheck className={cn("w-3.5 h-3.5 shrink-0 opacity-80", accentText)} aria-hidden />
              {/* With the chat button present the card is tight: icon only (name stays in aria-label). */}
              <span className={cn("truncate max-w-[110px]", userGroup && "sr-only")}>
                {arrivalStatus ?? (isSharingLocation ? t("Τοποθεσία", "Sharing") : t("Ασφάλεια", "Safety"))}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              {userGroup && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/chat/${userGroup.id}`);
                  }}
                  aria-label={t('Μετάβαση στο Group Chat', 'View Group Chat')}
                  title={t('Ομαδική συνομιλία', 'Group chat')}
                  className={cn("min-h-11 min-w-11 rounded-full flex items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent", accentBg, accentText, isDark ? "border-white/10" : "border-transparent")}
                >
                  <MessageSquare className="w-4 h-4" aria-hidden />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const gate = canJoinEvent(event.id);
                  if (!gate.ok) {
                    toast.error(t(gate.messageEl, gate.messageEn));
                    if (gate.messageEn.includes("feedback")) {
                      const pending = useStore.getState().getPendingFeedbackEventId();
                      if (pending) navigate(`/history/feedback/${pending}`);
                    }
                    return;
                  }
                  navigate(`/events/${event.id}/join`);
                }}
                className={cn("px-4 py-2 min-h-11 shrink-0 whitespace-nowrap text-white font-bold rounded-full shadow-soft", EVENT_CARD_TYPO.modalBtn, accent === 'fuchsia' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : accent === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : accent === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-accent hover:bg-accent-strong text-accent-fg')}
              >
                {t("Βρες Nakamas", "Find Nakamas")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* «Map & Safety» sheet — wrapper stops React event bubbling from the portal to the card. */}
      <div {...stopBubbling} className="contents">
        <BottomSheet
          open={showSafetyPanel}
          onClose={() => {
            setShowSafetyPanel(false);
            setShowEtaPrompt(false);
          }}
          title={t("Χάρτης & Ασφάλεια", "Map & Safety")}
          className="sm:max-w-lg sm:mx-auto sm:mb-4 sm:rounded-2xl sm:border"
        >
          <div className="space-y-4">
            <div>
              <p className="card-heading font-bold text-ink line-clamp-2">{event.title}</p>
              <p className="card-copy font-medium text-ink-muted capitalize">
                {weekday}, {event.time} · {event.locationArea}
              </p>
            </div>
            {event.lat && event.lng ? (
              <EventCardMiniMap lat={event.lat} lng={event.lng} isDark={isDark} className="h-40 rounded-xl" />
            ) : (
              <div className={cn("h-24 w-full rounded-xl border flex items-center justify-center", isDark ? "border-gray-700/40 bg-gray-800/30" : "border-gray-200 bg-gray-50")}>
                <span className={cn("text-xs font-bold flex items-center gap-1", mutedColor)}>
                  <MapPin className="w-4 h-4" aria-hidden /> {event.locationArea}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={getCalendarUrl}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-xs font-bold text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <CalendarPlus className="w-4 h-4" aria-hidden /> {t('Προσθήκη στο ημερολόγιο', 'Add to calendar')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSafetyPanel(false);
                  navigate(`/events/${event.id}`);
                }}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-bold text-accent-fg transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {t('Πλήρης σελίδα', 'Full event page')}
              </button>
            </div>
            <div className="space-y-3">
              {/* 1. Arrival Status */}
              <div className="space-y-1.5">
                <p className={cn(EVENT_CARD_TYPO.progressTitle, "tracking-tight capitalize", subColor)}>
                  {t("Κατάσταση Άφιξης", "Arrival Status")}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    t("Είμαι καθ' οδόν", "I'm on my way"),
                    t("Θα αργήσω", "I'll be late"),
                    t("Έφτασα στο σημείο", "I arrived at meeting point"),
                    t("Δεν θα τα καταφέρω", "Cannot make it"),
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => setArrivalStatus(status)}
                      className={cn(EVENT_CARD_TYPO.statusBtn, "py-1.5 px-2 rounded-2xl border transition-colors shadow-soft", arrivalStatus === status ? (accent === 'fuchsia' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : accent === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600' : accent === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-cyan-600 text-white border-cyan-600') : isDark ? 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:border-gray-600' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300')}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Share ETA */}
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowEtaPrompt(!showEtaPrompt)}
                    className={cn("flex-1 py-1.5 px-2 rounded-2xl flex items-center justify-center gap-1 border shadow-soft", EVENT_CARD_TYPO.statusBtn, isDark ? "bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/40" : "bg-white text-cyan-700 border-cyan-100 hover:bg-cyan-50")}
                  >
                    <Clock className="w-3 h-3" />{" "}
                    {t("Κοινοποίηση ETA", "Share ETA")}
                  </button>
                  <button
                    onClick={() => setShowSafetyLinkModal(true)}
                    className={cn("flex-1 py-1.5 px-2 rounded-2xl flex items-center justify-center gap-1 border shadow-soft", EVENT_CARD_TYPO.statusBtn, isDark ? "bg-emerald-900/20 text-emerald-400 border-emerald-800 hover:bg-emerald-900/30" : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100")}
                  >
                    <Link2 className="w-3 h-3" />{" "}
                    {t("Επαφή Εμπιστοσύνης", "Trusted Contact")}
                  </button>
                </div>
                {showEtaPrompt && (
                  <div className={cn("flex gap-2 items-center p-2 rounded-2xl border mt-1.5 shadow-soft", isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-100")}>
                    <input
                      type="text"
                      value={etaValue}
                      onChange={(e) => setEtaValue(e.target.value)}
                      className={cn(EVENT_CARD_TYPO.etaInput, "p-1 border-b outline-none bg-transparent", isDark ? "border-gray-700 focus:border-gray-500 text-white placeholder-gray-500" : "border-gray-200 focus:border-cyan-600")}
                      placeholder={t("π.χ. 15 λεπτά", "e.g. 15 mins")}
                    />
                    <button
                      onClick={() => {
                        setArrivalStatus(`${t("ETA")}: ${etaValue}`);
                        setShowEtaPrompt(false);
                      }}
                      className={cn(EVENT_CARD_TYPO.etaSubmit, "text-white px-3 py-1 rounded-lg", accent === 'fuchsia' ? 'bg-fuchsia-600' : accent === 'emerald' ? 'bg-emerald-600' : accent === 'indigo' ? 'bg-indigo-600' : 'bg-cyan-600')}
                    >
                      {t("Αποστολή", "Send")}
                    </button>
                  </div>
                )}
              </div>

              {/* 3 & 4. Location Sharing */}
              <div className="pt-1.5">
                <button
                  onClick={() => setShowLocationConfigModal(true)}
                  className={cn("w-full flex items-center justify-between px-3 py-2 border rounded-2xl transition-all duration-200 text-left shadow-soft", isSharingLocation ? (isDark ? "bg-cyan-900/20 border-cyan-800 hover:bg-cyan-900/30" : "bg-cyan-50 border-[#a5f3fc] hover:bg-cyan-100") : (isDark ? "bg-gray-800/50 hover:bg-gray-700/40 border-gray-700/50" : "bg-white hover:bg-gray-50 border-gray-100"))}
                >
                  <div>
                    <p
                      className={cn(EVENT_CARD_TYPO.toggleLabel, isSharingLocation ? (isDark ? "text-cyan-400" : "text-cyan-700") : headColor)}
                    >
                      {isSharingLocation
                        ? t("Η τοποθεσία κοινοποιείται", "Location Shared")
                        : t(
                            "Κοινοποίηση Τοποθεσίας",
                            "Share Location",
                          )}
                    </p>
                    <p
                      className={cn(EVENT_CARD_TYPO.toggleHint, "mt-0.5", isSharingLocation ? (isDark ? "text-cyan-500/80" : "text-cyan-600/80") : mutedColor)}
                    >
                      {isSharingLocation
                        ? t(
                            "Πατήστε για διαχείριση ή διακοπή",
                            "Tap to manage or stop",
                          )
                        : t(
                            "Προαιρετική, προσωρινή κοινοποίηση",
                            "Opt-in, temporary sharing",
                          )}
                    </p>
                  </div>
                  <MapPin
                    className={`w-3.5 h-3.5 ${isSharingLocation ? "text-cyan-600" : "text-gray-400"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </BottomSheet>
      </div>

      {/* Modals via Portal */}
      {showLocationConfigModal &&
        typeof document !== "undefined" &&
        createPortal(
          // React events bubble through portals: this wrapper keeps clicks and keys
          // inside the dialog from reaching the card behind it.
          <div {...stopBubbling} className="contents">
          <div
            className="fixed inset-0 z-modal flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-0"
              aria-label={t("Κλείσιμο", "Close")}
              onClick={() => setShowLocationConfigModal(false)}
            />
            <div
              ref={locationPanelRef}
              tabIndex={-1}
              className="relative modal-panel max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 outline-none"
              {...stopBubbling}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-full flex items-center justify-center text-cyan-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="card-heading-lg font-bold text-ink">
                      {t(
                        "Κοινοποίηση Τοποθεσίας",
                        "Share Location",
                      )}
                    </h3>
                    <p className={cn(EVENT_CARD_TYPO.hint, "font-medium text-gray-500")}>
                      {t("Προαιρετικό & Προσωρινό", "Optional & temporary")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
                  aria-label={t("Κλείσιμο", "Close")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {isSharingLocation && (
                  <div className="bg-cyan-50 border border-[#a5f3fc]/40 rounded-2xl p-4 flex flex-col gap-3 shadow-soft">
                    <div className="flex items-center gap-2 text-cyan-700">
                      <Navigation className="w-4 h-4 animate-pulse" />
                      <span className="card-heading font-bold">
                        {t(
                          "Αυτή τη στιγμή κοινοποιείτε την τοποθεσία σας",
                          "You are currently sharing location",
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsSharingLocation(false);
                        setShowLocationConfigModal(false);
                      }}
                      className={cn("w-full bg-white text-red-600 border border-red-200 hover:bg-red-50 py-2 rounded-2xl font-bold tracking-tight capitalize shadow-soft", EVENT_CARD_TYPO.link)}
                    >
                      {t("Διακοπή Κοινοποίησης", "Stop Sharing Now")}
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-xs font-bold capitalize text-gray-600 tracking-tight">
                    {t("1. Ακρίβεια", "1. Precision")}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setLocationConfig({
                          ...locationConfig,
                          precision: "approximate",
                        })
                      }
                      className={`p-3 rounded-2xl border text-left flex flex-col h-full transition-all duration-200 ${locationConfig.precision === "approximate" ? "border-ink bg-gray-50 ring-1 ring-ink shadow-soft" : "border-gray-100 hover:border-[#a5f3fc]"}`}
                    >
                      <span
                        className={cn(EVENT_CARD_TYPO.locationTitle, locationConfig.precision === "approximate" ? "text-ink" : "text-gray-700")}
                      >
                        {t("Κατά προσέγγιση", "Approximate")}
                      </span>
                      <span className={cn(EVENT_CARD_TYPO.locationHint, "text-gray-500 mt-1")}>
                        {t(
                          "Μόνο απόσταση & ETA, χωρίς χάρτη",
                          "Distance & ETA only, no map pin",
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        setLocationConfig({
                          ...locationConfig,
                          precision: "exact",
                        })
                      }
                      className={`p-3 rounded-2xl border text-left flex flex-col h-full transition-all duration-200 ${locationConfig.precision === "exact" ? "border-ink bg-gray-50 ring-1 ring-ink shadow-soft" : "border-gray-100 hover:border-[#a5f3fc]"}`}
                    >
                      <span
                        className={cn(EVENT_CARD_TYPO.locationTitle, locationConfig.precision === "exact" ? "text-ink" : "text-gray-700")}
                      >
                        {t("Ακριβής", "Exact")}
                      </span>
                      <span className={cn(EVENT_CARD_TYPO.locationHint, "text-gray-500 mt-1")}>
                        {t(
                          "Ακριβής θέση στον χάρτη (προσωρινά)",
                          "Exact map pin (temporary)",
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold capitalize text-gray-600 tracking-tight">
                    {t("2. Κοινοποίηση Σε", "2. Share With")}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {["organizer", "all"].map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${locationConfig.shareWith === option ? "border-accent bg-cyan-50/30 shadow-soft" : "border-gray-100 hover:bg-gray-50 hover:border-[#a5f3fc]"}`}
                      >
                        <div className="flex items-center justify-center relative">
                          <input
                            type="radio"
                            name="shareWith"
                            className="sr-only"
                            checked={locationConfig.shareWith === option}
                            onChange={() =>
                              setLocationConfig({
                                ...locationConfig,
                                shareWith: option,
                              })
                            }
                          />
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${locationConfig.shareWith === option ? "border-cyan-600 bg-cyan-600" : "border-gray-300"}`}
                          >
                            {locationConfig.shareWith === option && (
                              <span className="w-2 h-2 rounded-full bg-white"></span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="card-heading font-bold text-ink">
                            {option === "organizer" &&
                              t("Μόνο Διοργανωτής", "Organizer Only")}
                            {option === "all" &&
                              t(
                                "Όλη η Επιβεβαιωμένη Ομάδα",
                                "Entire Confirmed Group",
                              )}
                          </span>
                          {option === "organizer" && (
                            <span className={cn(EVENT_CARD_TYPO.locationHint, "text-gray-500")}>
                              {t(
                                "Ιδανικό για ξεναγήσεις & πεζοπορίες",
                                "Best for guided hikes or escapes",
                              )}
                            </span>
                          )}
                          {option === "all" && (
                            <span className={cn(EVENT_CARD_TYPO.locationHint, "text-amber-600")}>
                              {t(
                                "Όλοι σε αυτό το chat βλέπουν την τοποθεσία σας",
                                "Everyone in this chat will see your location",
                              )}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold capitalize text-gray-600 tracking-tight">
                    {t("3. Αυτόματη Λήξη", "3. Auto-Expiry")}
                  </h4>
                  <select aria-label={t("Διάρκεια κοινοποίησης τοποθεσίας", "Location sharing duration")}
                    value={locationConfig.duration}
                    onChange={(e) =>
                      setLocationConfig({
                        ...locationConfig,
                        duration: e.target.value,
                      })
                    }
                    className="w-full border border-gray-100 rounded-2xl p-3 text-xs font-medium focus:ring-2 focus:ring-accent/40 bg-white outline-none shadow-soft"
                  >
                    <option value="arrival">
                      {t(
                        "Μέχρι να φτάσω στο σημείο",
                        "Until I arrive at meeting point",
                      )}
                    </option>
                    <option value="event_start">
                      {t("Μέχρι να ξεκινήσει η εκδήλωση", "Until event starts")}
                    </option>
                    <option value="event_end">
                      {t("Μέχρι το τέλος της εκδήλωσης", "Until event ends")}
                    </option>
                    <option value="1hr">{t("Για 1 ώρα", "For 1 hour")}</option>
                  </select>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                <button
                  onClick={() => {
                    setIsSharingLocation(true);
                    setShowLocationConfigModal(false);
                    toast.success(
                      t(
                        "Προεπισκόπηση κοινοποίησης — το pin δεν στάλθηκε ακόμη στην ομάδα.",
                        "Sharing preview — the pin was not sent to the group yet.",
                      ),
                    );
                  }}
                  className="w-full px-4 py-3 text-xs font-bold text-white bg-ink hover:bg-gray-900 rounded-2xl transition-all duration-200 shadow-soft active:scale-[0.98]"
                >
                  {isSharingLocation
                    ? t("Ενημέρωση", "Update Configuration")
                    : t("Έναρξη", "Start Sharing")}
                </button>
              </div>
            </div>
          </div>
          </div>,
          document.body,
        )}

      <Modal
        open={showSafetyLinkModal}
        onClose={() => setShowSafetyLinkModal(false)}
        title={t("Σύνδεσμος Επαφής Εμπιστοσύνης", "Trusted Contact Link")}
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Link2 className="w-6 h-6" />
          </div>
          <p className="card-copy font-medium leading-relaxed text-ink-muted mb-4">
            {t(
              "Προεπισκόπηση demo — ο πραγματικός σύνδεσμος ασφαλείας θα εκδίδεται ανά έξοδο με ανάκληση. Μην τον μοιραστείς ως ενεργό.",
              "Demo preview — a real safety link will be minted per outing with revoke. Do not share this as live.",
            )}
          </p>
          <div className="bg-surface border border-border rounded-lg p-3 mb-4 text-left">
            <p className="text-2xs font-bold uppercase tracking-wide text-ink-muted mb-1">
              {t('Demo', 'Demo')}
            </p>
            <span className="card-copy font-medium text-ink-muted break-all">
              https://nakamas.app/safe/demo-preview
            </span>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={() => setShowSafetyLinkModal(false)}
            className="w-full px-4 py-3 text-xs font-bold text-white bg-ink hover:bg-gray-900 rounded-2xl transition-all duration-200 shadow-soft active:scale-[0.98]"
          >
            {t("Τέλος", "Done")}
          </button>
        </div>
      </Modal>
    </Card>
  );
});
