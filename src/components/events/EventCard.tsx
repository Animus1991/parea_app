import React, { useState, memo } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Card } from "../common/Card";
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
  Sparkles,
  Crown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { el as elLocale } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store";
import type { Event } from "../../types";
import { useLanguage } from "../../lib/i18n";
import { cn } from "../../lib/utils";
import { computeMatchScore, getMatchingPreview } from "../../lib/matching";
import { MatchExplainChips } from "./MatchExplainChips";
import { getEventGroupProgress } from "../../lib/groupUtils";
import { GroupProgressBar } from "./GroupProgressBar";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
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

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const { t } = useLanguage();
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

  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';
  const accent = theme === 'vibrant' || theme === 'vibrant-dark' ? 'fuchsia' : theme === 'bento' ? 'indigo' : theme === 'neon' || theme === 'neon-dark' || theme === 'bento-dark' ? 'emerald' : 'cyan';
  const accentText = isDark ? (accent === 'fuchsia' ? 'text-fuchsia-400' : accent === 'emerald' ? 'text-emerald-400' : 'text-cyan-400') : (accent === 'fuchsia' ? 'text-fuchsia-600' : accent === 'indigo' ? 'text-indigo-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-[#0E8B8D]');
  const accentBg = isDark ? (accent === 'fuchsia' ? 'bg-fuchsia-900/20' : accent === 'emerald' ? 'bg-emerald-900/20' : 'bg-cyan-900/20') : (accent === 'fuchsia' ? 'bg-fuchsia-50' : accent === 'indigo' ? 'bg-indigo-50' : accent === 'emerald' ? 'bg-emerald-50' : 'bg-cyan-50');
  const headColor = isDark ? 'text-white' : 'text-[#111827]';
  const subColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const mutedColor = isDark ? 'text-gray-500' : 'text-gray-500';
  const chipBg = isDark ? 'bg-gray-800/50' : 'bg-gray-50';
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
    toast.success(t('Έγινες ο διοργανωτής της ομάδας! 🎉', "You're now the group's organizer! 🎉"));
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSavedEvent(event.id);
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
    );
  };

  const eventDate = parseISO(event.date);
  const day = format(eventDate, "d");
  const month = format(eventDate, "MMM", { locale: elLocale }).toUpperCase();
  const weekday = format(eventDate, "EEEE", { locale: elLocale });

  return (
    <Card
      className={cn("flex h-full flex-col overflow-hidden cursor-pointer relative group border-0 hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl p-0", isDark ? "shadow-[0_2px_15px_-3px_rgba(0,0,0,0.3)] bg-gray-800/60" : "shadow-soft-md bg-white")}
      onClick={() => navigate(`/events/${event.id}`)}
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
            <span className="text-cyan-600 font-bold text-lg capitalize tracking-tight">
              {event.category}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />

        {/* Date Badge — top left */}
        <div className="absolute top-3 left-3 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl w-12 h-[50px] shadow-soft border border-white/20 z-10">
          <span className={cn("text-[10.61px] font-extrabold tracking-wide leading-none mb-0.5", accent === 'fuchsia' ? 'text-fuchsia-600' : accent === 'indigo' ? 'text-indigo-600' : accent === 'emerald' ? 'text-emerald-600' : 'text-[#0E8B8D]')}>
            {month}
          </span>
          <span className="text-lg font-black text-gray-900 leading-none">
            {day}
          </span>
        </div>

        {/* Action buttons — top right */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            className="p-2 rounded-full shadow-soft backdrop-blur-md focus:outline-none transition-all duration-200 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900"
            onClick={handleShare}
            title={t("Κοινοποίηση", "Share")}
            aria-label={t("Κοινοποίηση", "Share")}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            className={`p-2 rounded-full shadow-soft backdrop-blur-md focus:outline-none transition-all duration-200 ${isSaved ? (accent === 'fuchsia' ? 'bg-fuchsia-500/20 text-fuchsia-600' : accent === 'emerald' ? 'bg-emerald-500/20 text-emerald-600' : accent === 'indigo' ? 'bg-indigo-500/20 text-indigo-600' : 'bg-[#18D8DB]/20 text-[#0E8B8D]') : "bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900"}`}
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
                className="bg-black/50 backdrop-blur-md text-white/95 border border-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10.61px] font-semibold capitalize tracking-wide shadow-soft whitespace-nowrap truncate max-w-[100px]"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-2xl shadow-soft-md font-black text-[#111827] text-[11.67px] sm:text-[12.73px] tracking-tight flex flex-col items-end shrink-0 border border-white/60">
            {event.isPaid ? `€${event.price}` : t("event_card.free", "Free")}
            {event.isPaid && event.groupDiscount && (
              <span className="text-[9.55px] text-[#0E8B8D] leading-none block mt-0.5 font-bold">
                -{event.groupDiscount.percentage}% GRP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className={cn("font-bold text-[15.91px] leading-snug transition-colors line-clamp-2", headColor, isDark ? (accent === 'fuchsia' ? 'group-hover:text-fuchsia-400' : accent === 'emerald' ? 'group-hover:text-emerald-400' : 'group-hover:text-cyan-400') : (accent === 'fuchsia' ? 'group-hover:text-fuchsia-600' : accent === 'indigo' ? 'group-hover:text-indigo-600' : accent === 'emerald' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E8B8D]'))}>
            {event.title}
          </h3>
          {currentUser && matchScore != null && (
            <div className="flex flex-col items-end shrink-0">
              <span className={cn("text-[12.73px] font-black leading-none", accentText)}>
                {matchScore}%
              </span>
              <span className={cn("text-[9.55px] font-semibold capitalize tracking-wide", mutedColor)}>
                {t("Ταίριασμα", "Match")}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.73px] font-medium", subColor)}>
            <div className={cn("flex items-center px-2 py-1 rounded-md", chipBg)}>
              <Clock className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", accentText)} />
              <span>{weekday}, {event.time}</span>
            </div>
            <div className={cn("flex items-center px-2 py-1 rounded-md", chipBg)}>
              <MapPin className={cn("w-3.5 h-3.5 mr-1.5 shrink-0", accentText)} />
              <span className="truncate max-w-[160px]">{event.locationArea}</span>
            </div>
          </div>
          {event.lat && event.lng ? (
            <div
              className={cn("h-24 w-full rounded-lg overflow-hidden border mt-1 relative z-0 pointer-events-none", isDark ? "border-gray-700/40" : "border-gray-200")}
              onClick={(e) => e.stopPropagation()}
            >
              <MapContainer
                center={[event.lat, event.lng]}
                zoom={14}
                zoomControl={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[event.lat, event.lng]} />
              </MapContainer>
            </div>
          ) : (
            <div className={cn("h-24 w-full rounded-lg border flex items-center justify-center mt-2", isDark ? "border-gray-700/40 bg-gray-800/30" : "border-gray-200 bg-gray-50")}>
              <span className={cn("text-xs font-bold flex items-center gap-1", mutedColor)}>
                <MapPin className="w-4 h-4" /> {event.locationArea}
              </span>
            </div>
          )}
          {matchingPreview && (
            <p className={cn("text-[11px] font-semibold rounded-lg px-2.5 py-1.5", accentBg, accentText)}>
              {t(matchingPreview.labelEl, matchingPreview.labelEn)}
            </p>
          )}
          {currentUser && (
            <MatchExplainChips user={currentUser} event={event} className="mt-1" />
          )}
          <div className={cn("flex items-center text-[12.73px] font-medium mt-2", subColor)}>
            <Users className={cn("w-3.5 h-3.5 mr-2 shrink-0", mutedColor)} />
            <span>
              {groupProgress.spotsLeft}{" "}
              {t("θέσεις έμειναν", "spots left")}
            </span>
          </div>
          
          {userGroup && (
            <button
               onClick={(e) => {
                 e.stopPropagation();
                 navigate(`/chat/${userGroup.id}`);
               }}
               className={cn("mt-3 w-full py-2 rounded-2xl text-[12.73px] font-bold transition-colors flex items-center justify-center gap-2 border shadow-soft", isDark ? (accent === 'fuchsia' ? 'bg-fuchsia-900/20 hover:bg-fuchsia-900/30 text-fuchsia-400 border-fuchsia-800' : accent === 'emerald' ? 'bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-cyan-900/20 hover:bg-cyan-900/30 text-cyan-400 border-cyan-800') : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-100')}
            >
               <Users className="w-4 h-4" />
               {t('Μετάβαση στο Group Chat', 'View Group Chat')}
            </button>
          )}
        </div>

        {/* Organizer */}
        {displayOrganizer && (
          <div className={cn("flex items-center justify-between mb-4 rounded-2xl p-2.5 border transition-all duration-200", isDark ? "bg-gray-800/30 border-gray-700/40 hover:bg-gray-800/50" : "bg-gray-50/50 border-gray-100 hover:bg-gray-50")}>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  referrerPolicy="no-referrer"
                  src={displayOrganizer.photoUrl}
                  alt={displayOrganizer.name}
                  className={cn("w-8 h-8 rounded-full object-cover border-2 shadow-soft", isDark ? "border-gray-700" : "border-white")}
                />
                <div className={cn("absolute -bottom-0.5 -right-0.5 bg-green-500 w-2.5 h-2.5 rounded-full border-2", isDark ? "border-gray-800" : "border-white")}></div>
              </div>
              <div className="flex flex-col">
                <span className={cn("text-[10.93px] font-semibold mb-0.5 capitalize", mutedColor)}>
                  {hostUser && !organizer ? t('Διοργανωτής ομάδας', 'Group host') : t("event_card.organizer", "Organizer")}
                </span>
                <button
                  className={cn("text-xs font-bold text-left transition-colors line-clamp-1", headColor, isDark ? (accent === 'fuchsia' ? 'hover:text-fuchsia-400' : accent === 'emerald' ? 'hover:text-emerald-400' : 'hover:text-cyan-400') : 'hover:text-cyan-600')}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/organizer/${displayOrganizer.id}`);
                  }}
                >
                  {displayOrganizer.name}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Platform event — seeks a group organizer */}
        {seeksHost && (
          <div className={cn("mb-4 rounded-2xl p-3 border", isDark ? "bg-amber-500/10 border-amber-500/25" : "bg-amber-50 border-amber-200")}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={cn("w-4 h-4 shrink-0", isDark ? "text-amber-400" : "text-amber-600")} />
              <div className="flex flex-col">
                <span className={cn("text-[10.93px] font-semibold capitalize", isDark ? "text-amber-300/90" : "text-amber-700")}>
                  {t('Προσφέρεται από Nakamas', 'Offered by Nakamas')}
                </span>
                <span className={cn("text-xs font-bold", isDark ? "text-amber-100" : "text-amber-900")}>
                  {t('Αναζητείται διοργανωτής', 'Looking for an organizer')}
                </span>
              </div>
            </div>
            <button
              onClick={handleBecomeHost}
              className={cn("w-full py-2 rounded-2xl text-[12.73px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-soft", isDark ? "bg-amber-500 text-gray-900 hover:bg-amber-400" : "bg-amber-600 text-white hover:bg-amber-700")}
            >
              <Crown className="w-3.5 h-3.5" />
              {t('Γίνε Διοργανωτής Παρέας', 'Become group organizer')}
            </button>
          </div>
        )}

        {/* Arrival & Safety Toggle */}
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSafetyPanel(!showSafetyPanel);
            }}
            className="w-full flex items-center justify-between py-1.5 focus:outline-none"
          >
            <span className={cn("text-[12.02px] font-bold flex items-center gap-1.5 capitalize tracking-tight", headColor)}>
              <ShieldCheck className={cn("w-3.5 h-3.5", accentText)} />
              {t("Άφιξη & Ασφάλεια", "Arrival & Safety")}
            </span>
            <span className={cn("text-[10.93px] font-medium", mutedColor)}>
              {showSafetyPanel ? t("Απόκρυψη", "Hide") : t("Εμφάνιση", "Show")}
            </span>
          </button>

          {showSafetyPanel && (
            <div
              className={cn("mt-2 space-y-3 p-3 border rounded-2xl", isDark ? "bg-gray-800/30 border-gray-700/40" : "bg-gray-50 border-gray-100")}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Arrival Status */}
              <div className="space-y-1.5">
                <p className={cn("text-[12.02px] font-semibold tracking-tight capitalize", subColor)}>
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
                      className={cn("text-[9.84px] font-bold py-1.5 px-2 rounded-2xl border transition-colors shadow-soft", arrivalStatus === status ? (accent === 'fuchsia' ? 'bg-fuchsia-600 text-white border-fuchsia-600' : accent === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600' : accent === 'indigo' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-cyan-600 text-white border-cyan-600') : isDark ? 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:border-gray-600' : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300')}
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
                    className={cn("flex-1 text-[10.93px] font-bold py-1.5 px-2 rounded-2xl flex items-center justify-center gap-1 border shadow-soft", isDark ? "bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/40" : "bg-white text-cyan-700 border-cyan-100 hover:bg-cyan-50")}
                  >
                    <Clock className="w-3 h-3" />{" "}
                    {t("Κοινοποίηση ETA", "Share ETA")}
                  </button>
                  <button
                    onClick={() => setShowSafetyLinkModal(true)}
                    className={cn("flex-1 text-[10.93px] font-bold py-1.5 px-2 rounded-2xl flex items-center justify-center gap-1 border shadow-soft", isDark ? "bg-emerald-900/20 text-emerald-400 border-emerald-800 hover:bg-emerald-900/30" : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100")}
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
                      className={cn("flex-1 text-[11px] font-medium p-1 border-b outline-none bg-transparent", isDark ? "border-gray-700 focus:border-gray-500 text-white placeholder-gray-500" : "border-gray-200 focus:border-cyan-600")}
                      placeholder={t("π.χ. 15 λεπτά", "e.g. 15 mins")}
                    />
                    <button
                      onClick={() => {
                        setArrivalStatus(`${t("ETA")}: ${etaValue}`);
                        setShowEtaPrompt(false);
                      }}
                      className={cn("text-[10px] font-bold text-white px-3 py-1 rounded", accent === 'fuchsia' ? 'bg-fuchsia-600' : accent === 'emerald' ? 'bg-emerald-600' : accent === 'indigo' ? 'bg-indigo-600' : 'bg-cyan-600')}
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
                      className={cn("text-[11px] font-bold", isSharingLocation ? (isDark ? "text-cyan-400" : "text-cyan-700") : headColor)}
                    >
                      {isSharingLocation
                        ? t("Η τοποθεσία κοινοποιείται", "Location Shared")
                        : t(
                            "Κοινοποίηση Ζωντανής Τοποθεσίας",
                            "Share Live Location",
                          )}
                    </p>
                    <p
                      className={cn("text-[9px] mt-0.5", isSharingLocation ? (isDark ? "text-cyan-500/80" : "text-cyan-600/80") : mutedColor)}
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
          )}
        </div>

        {/* Group progress + Join */}
        <div className={cn("mt-auto pt-3 border-t", borderSub)}>
          <GroupProgressBar
            current={groupProgress.current}
            target={groupProgress.target}
            className="mb-3"
          />
          {groupProgress.discountUnlocked && event.groupDiscount && (
            <p className={cn("text-[10px] font-bold mb-2", isDark ? "text-emerald-400" : "text-emerald-600")}>
              -{event.groupDiscount.percentage}% {t("ομαδική έκπτωση", "group discount")}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              className={cn("text-[10.93px] min-h-11 px-2 transition-colors font-medium underline underline-offset-2", isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-500 hover:text-[#0E8B8D]")}
              onClick={getCalendarUrl}
              type="button"
              aria-label={t('Προσθήκη στο ημερολόγιο', 'Add to calendar')}
              title={t('Προσθήκη στο ημερολόγιο', 'Add to calendar')}
            >
              + Cal
            </button>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSave(e);
                }}
                className={cn("px-3 py-2 min-h-11 text-[12.02px] font-bold rounded-full", isDark ? "bg-gray-700/40 text-gray-300" : "bg-gray-100 text-gray-600")}
              >
                {isSaved ? t("Αποθηκευμένο", "Saved") : t("Αποθήκευση", "Save")}
              </button>
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
                className={cn("px-5 py-2 min-h-11 text-white text-[12.02px] font-bold rounded-full shadow-soft", accent === 'fuchsia' ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : accent === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : accent === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#111827] hover:bg-black')}
              >
                {t("Βρες παρέα", "Find company")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals via Portal */}
      {showLocationConfigModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-panel max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 rounded-full flex items-center justify-center text-cyan-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">
                      {t(
                        "Κοινοποίηση Ζωντανής Τοποθεσίας",
                        "Live Location Sharing",
                      )}
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500">
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

              <div className="p-5 space-y-6">
                {isSharingLocation && (
                  <div className="bg-cyan-50 border border-[#a5f3fc]/40 rounded-2xl p-4 flex flex-col gap-3 shadow-soft">
                    <div className="flex items-center gap-2 text-cyan-700">
                      <Navigation className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-bold">
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
                      className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-50 py-2 rounded-2xl text-[11px] font-bold tracking-tight capitalize shadow-soft"
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
                      className={`p-3 rounded-2xl border text-left flex flex-col h-full transition-all duration-200 ${locationConfig.precision === "approximate" ? "border-[#111827] bg-gray-50 ring-1 ring-[#111827] shadow-soft" : "border-gray-100 hover:border-[#a5f3fc]"}`}
                    >
                      <span
                        className={`text-[13px] font-bold ${locationConfig.precision === "approximate" ? "text-[#111827]" : "text-gray-700"}`}
                      >
                        {t("Κατά προσέγγιση", "Approximate")}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 leading-relaxed">
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
                      className={`p-3 rounded-2xl border text-left flex flex-col h-full transition-all duration-200 ${locationConfig.precision === "exact" ? "border-[#111827] bg-gray-50 ring-1 ring-[#111827] shadow-soft" : "border-gray-100 hover:border-[#a5f3fc]"}`}
                    >
                      <span
                        className={`text-[13px] font-bold ${locationConfig.precision === "exact" ? "text-[#111827]" : "text-gray-700"}`}
                      >
                        {t("Ακριβής", "Exact")}
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        {t(
                          "Ακριβής παρακολούθηση GPS",
                          "Precise GPS live tracking",
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
                    {["organizer", "selected", "all"].map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${locationConfig.shareWith === option ? "border-[#18D8DB] bg-cyan-50/30 shadow-soft" : "border-gray-100 hover:bg-gray-50 hover:border-[#a5f3fc]"}`}
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
                          <span className="text-sm font-bold text-[#111827]">
                            {option === "organizer" &&
                              t("Μόνο Διοργανωτής", "Organizer Only")}
                            {option === "selected" &&
                              t("Επιλεγμένα Μέλη", "Selected Members")}
                            {option === "all" &&
                              t(
                                "Όλη η Επιβεβαιωμένη Ομάδα",
                                "Entire Confirmed Group",
                              )}
                          </span>
                          {option === "organizer" && (
                            <span className="text-[10px] text-gray-500 leading-relaxed">
                              {t(
                                "Ιδανικό για ξεναγήσεις & πεζοπορίες",
                                "Best for guided hikes or escapes",
                              )}
                            </span>
                          )}
                          {option === "all" && (
                            <span className="text-[10px] text-amber-600 leading-relaxed">
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
                  <select
                    value={locationConfig.duration}
                    onChange={(e) =>
                      setLocationConfig({
                        ...locationConfig,
                        duration: e.target.value,
                      })
                    }
                    className="w-full border border-gray-100 rounded-2xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#18D8DB]/40 bg-white outline-none shadow-soft"
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
                  }}
                  className="w-full px-4 py-3 text-sm font-bold text-white bg-[#111827] hover:bg-gray-900 rounded-2xl transition-all duration-200 shadow-soft active:scale-[0.98]"
                >
                  {isSharingLocation
                    ? t("Ενημέρωση", "Update Configuration")
                    : t("Έναρξη", "Start Sharing")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {showSafetyLinkModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-panel max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111827] mb-2">
                {t("Σύνδεσμος Επαφής Εμπιστοσύνης", "Trusted Contact Link")}
              </h3>
              <p className="text-xs font-medium leading-relaxed text-gray-500 mb-6">
                {t(
                  "Αυτό δημιουργεί έναν προσωρινό σύνδεσμο ασφαλείας. Μοιραστείτε τον με ένα φίλο. Θα βλέπει την τοποθεσία σας μέχρι το τέλος της εκδήλωσης.",
                  "This creates a temporary safety link. Share this securely with a trusted friend or family member outside of Nakamas. They will see your live location until the event ends.",
                )}
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between mb-6">
                <span className="text-xs font-medium text-gray-700 truncate mr-2">
                  https://nakamas.app/safe/r9x2p
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "https://nakamas.app/safe/r9x2p",
                    );
                    toast.success(t("Ο σύνδεσμος αντιγράφηκε", "Copied to clipboard"));
                  }}
                  className="text-[#0E8B8D] font-bold text-[11px] hover:bg-cyan-50 px-2 py-1 rounded transition-colors"
                >
                  {t("Αντιγραφη", "Copy")}
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSafetyLinkModal(false)}
                  className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-[0.98]"
                >
                  {t("Ακύρωση", "Cancel")}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: t("Σύνδεσμος Παρακολούθησης", "Tracking Link"),
                        url: "https://nakamas.app/safe/r9x2p",
                      });
                    } else {
                      navigator.clipboard.writeText(
                        "https://nakamas.app/safe/r9x2p",
                      );
                      toast.success(t("Ο σύνδεσμος αντιγράφηκε", "Copied"));
                    }
                    setShowSafetyLinkModal(false);
                  }}
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all duration-200 shadow-soft active:scale-[0.98]"
                >
                  {t("Κοινοποιηση", "Share")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Card>
  );
});
