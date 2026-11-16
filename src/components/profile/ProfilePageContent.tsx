import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { useStore } from "../../store";
import { tierLabelEl, tierLabelEn } from "../../lib/trust";
import { pressable } from "../../lib/a11y";
import type { TrustTier } from "../../types";
import {
  CheckCircle2,
  History,
  Camera,
  Edit2,
  X,
  Plus,
  Shield,
  ShieldCheck,
  Users,
  Calendar,
  Bookmark,
  Star,
  MapPin,
  Award,
  Settings,
  LogOut,
  MessageSquare,
  TrendingUp,
  Eye,
  Lock,
  ChevronRight,
  Share2,
  User as UserIcon,
  CreditCard as CreditCardIcon,
  Bot,
  Newspaper,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { TabBar } from "../common/TabBar";
import { cn } from "../../lib/utils";
import { useLanguage } from "../../lib/i18n";
import { APP_TYPO } from "../../lib/typographyTokens";
import { canonicalInterest, interestLabel, sameInterest } from "../../lib/interests";
import { useProfileContrast } from "../../hooks/usePageContrast";
import { ProfileCompletionMeter } from "./ProfileCompletionMeter";
import { useFormDraft, type FormDraftFields } from "../../lib/formDraft";
import { fileToResizedDataUrl, imageErrorText } from "../../lib/imageResize";
import { profilePathFor } from "../../lib/profileLinks";
import { useWallAccess, useWallStore } from "../../store/wallStore";
import { pendingTagReviews, profileWallPosts, profileVisibilityToAudience } from "../../lib/audience";
import { resolveProfileAudience } from "../../lib/profilePrivacy";
import { AudienceChip } from "../wall/AudienceChip";
import { AudiencePickerModal } from "../wall/AudiencePickerModal";
import { PostComposer } from "../wall/PostComposer";
import { WallPostList } from "../wall/WallPostList";
import { WallPrivacyPanel } from "../wall/WallPrivacyPanel";
import { PersonAvatar } from "../wall/PersonAvatar";

// ─── Main component ──────────────────────────────────────────
export default function ProfilePageContent() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const a = useProfileContrast();
  const currentUser = useStore((state) => state.currentUser);
  const updateUser = useStore((state) => state.updateUser);
  const logout = useStore((state) => state.logout);
  const users = useStore((state) => state.users);
  const feedbackSubmitted = useStore((state) => state.feedbackSubmitted);
  const userSettings = useStore((state) => state.userSettings);
  const updatePrivacySettings = useStore((state) => state.updatePrivacySettings);

  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentUser?.name || "");
  const [interests, setInterests] = useState(currentUser?.interests || []);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [newInterest, setNewInterest] = useState("");

  // Φ25 (port from nakamas): progressive disclosure — one purpose per tab, deep-linkable via ?tab=.
  type ProfileTab = "overview" | "wall" | "trust" | "privacy";
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: ProfileTab = tabParam === "trust" || tabParam === "privacy" || tabParam === "wall" ? tabParam : "overview";
  const [profileAudienceOpen, setProfileAudienceOpen] = useState(false);
  const wallPostsAll = useWallStore((state) => state.posts);
  const wallAccess = useWallAccess();
  const myWallPosts = React.useMemo(
    () => (currentUser ? profileWallPosts(currentUser.id, currentUser.id, wallPostsAll, wallAccess) : []),
    [currentUser, wallPostsAll, wallAccess],
  );
  const myPendingTags = React.useMemo(
    () => (currentUser ? pendingTagReviews(currentUser.id, wallPostsAll, wallAccess) : []),
    [currentUser, wallPostsAll, wallAccess],
  );
  const setActiveTab = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id === "overview") next.delete("tab");
    else next.set("tab", id);
    setSearchParams(next, { replace: true });
  };

  const applyProfileDraft = useCallback(
    (fields: FormDraftFields) => {
      if (typeof fields.bio === "string") {
        setTempBio(fields.bio);
        setIsEditingBio(true);
      }
      if (typeof fields.name === "string") {
        setTempName(fields.name);
        setIsEditingName(true);
      }
      if (typeof fields.interest === "string" && fields.interest.trim()) {
        setNewInterest(fields.interest);
        setIsAddingInterest(true);
      }
    },
    [],
  );
  const profileDraft = useFormDraft("profile", applyProfileDraft, Boolean(currentUser));

  const handleInvite = async () => {
    const url = `${window.location.origin}/login?ref=${encodeURIComponent(currentUser?.id ?? "")}`;
    const text = t("Έλα στο Nakamas — βρίσκουμε παρέα για εκδηλώσεις!", "Join me on Nakamas — we find company for events!");
    try {
      if (navigator.share) {
        await navigator.share({ title: "Nakamas", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success(t("Ο σύνδεσμος πρόσκλησης αντιγράφηκε", "Invite link copied"));
    } catch {
      toast.info(t("Η κοινοποίηση ακυρώθηκε", "Share cancelled"));
    }
  };

  const patchPrivacy = (patch: Partial<typeof userSettings.privacy>) => {
    updatePrivacySettings(patch);
    toast.success(t('Οι ρυθμίσεις απορρήτου αποθηκεύτηκαν', 'Privacy settings saved'));
  };

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
  }, [currentUser, navigate]);

  // Deep link from Settings › «Τοίχος & κοινό»: open the wall/audience block directly.
  useEffect(() => {
    if (activeTab !== "privacy" || window.location.hash !== "#wall-privacy") return;
    const id = window.setTimeout(() => document.getElementById("wall-privacy")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => window.clearTimeout(id);
  }, [activeTab]);

  if (!currentUser) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Allow picking the same file again later.
    e.target.value = "";
    if (!file) return;
    try {
      // A downscaled data URL survives reloads (blob: links died on refresh).
      const newUrl = await fileToResizedDataUrl(file, { maxSize: 320, quality: 0.85 });
      setPhotoUrl(newUrl);
      updateUser(currentUser.id, { photoUrl: newUrl });
      toast.success(t('Η φωτογραφία ενημερώθηκε', 'Photo updated'));
    } catch (err) {
      toast.error(imageErrorText(err, t));
    }
  };

  // Computed
  const connectionCount = (currentUser.connections || []).length;
  const connectedUsers = users.filter((u) => (currentUser.connections || []).includes(u.id));
  const attendedEventsCount = Object.keys(feedbackSubmitted).length;
  const tierLabel = t(tierLabelEl(currentUser.trustTier as TrustTier), tierLabelEn(currentUser.trustTier as TrustTier));

  const heading = a.isDark ? "text-white" : "text-ink";
  const sub = a.isDark ? "text-gray-400" : "text-gray-500";
  const label = a.isDark ? "text-gray-400" : "text-[#6B7280]";
  const bodyText = a.isDark ? "text-gray-300" : "text-gray-700";
  const bodyTextLight = a.isDark ? "text-gray-400" : "text-gray-600";
  const sectionBorder = a.isDark ? "border-gray-700/40" : "border-gray-100";
  const inputBg = a.isDark ? "bg-gray-800/60 border-gray-700/60 text-white placeholder-gray-500" : "bg-gray-50 border-gray-200 text-gray-900";
  const historyBg = a.isDark ? "bg-gray-800/40 border-gray-700/40" : "bg-gray-50 border-gray-200";
  const subtleBg = a.isDark ? "bg-gray-800/30" : "bg-gray-50/50";

  return (
    <div className="mx-auto max-w-full space-y-4 pb-20 md:pb-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className={`text-sm md:text-base font-extrabold tracking-tight ${heading}`}>{t("Προφίλ", "Profile")}</h1>
          <p className={`mt-1 text-sm font-medium leading-relaxed ${sub}`}>
            {t("Διαχειριστείτε τις ρυθμίσεις εμπιστοσύνης, τις επαληθεύσεις και το ιστορικό σας.", "Manage your trust settings, verifications, and history.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/settings")} className="flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> {t("Ρυθμίσεις", "Settings")}
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate("/trust")} className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> {t("Κέντρο Εμπιστοσύνης", "Trust Center")}
          </Button>
        </div>
      </div>

      {profileDraft.filled.length > 0 && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-3 py-2 text-sm font-medium text-ink">
          <Bot className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span className="flex-1">
            {t(
              "Το Nakamas AI πρότεινε αλλαγές — έλεγξέ τις και πάτα Αποθήκευση.",
              "Nakamas AI proposed changes — review them and press Save.",
            )}
          </span>
          <button type="button" onClick={profileDraft.dismiss} className="text-xs font-bold underline shrink-0">
            {t("Απόκρυψη", "Dismiss")}
          </button>
        </p>
      )}

      <ProfileCompletionMeter />

      {/* ═══ Quick Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: t("Nakamas", "Nakamas"), value: connectionCount, to: "/connections", color: a.accent },
          { icon: Calendar, label: t("Εκδηλώσεις", "Events"), value: attendedEventsCount, to: "/plans", color: a.accent },
          { icon: TrendingUp, label: t("Αξιοπιστία", "Reliability"), value: `${currentUser.reliabilityScore}%`, to: "/trust", color: currentUser.reliabilityScore >= 80 ? (a.isDark ? "text-green-400" : "text-green-600") : a.accent },
          { icon: Award, label: t("Επίπεδο", "Tier"), value: tierLabel, to: "/trust", color: a.accent },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => navigate(stat.to)}
            className={cn(
              "rounded-2xl border p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              a.isDark ? "bg-gray-800/60 border-gray-700/50" : "bg-white border-gray-100",
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn(APP_TYPO.sectionLabel, sub)}>{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} aria-hidden />
            </div>
            <p className={cn(APP_TYPO.statValue, 'mt-2', heading)}>{stat.value}</p>
          </button>
        ))}
      </div>

      {/* ═══ Profile Card ═══ */}
      <Card className="p-0 overflow-hidden">
        {/* Profile header band */}
        <div className={`px-4 pt-4 pb-5 ${subtleBg}`}>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="relative group">
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 border-2 overflow-hidden shadow-soft ${a.avatarBg}`}>
                {photoUrl ? (
                  <img referrerPolicy="no-referrer" src={photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span className={`font-bold text-sm md:text-base ${a.avatarText}`}>{currentUser.name.substring(0, 2)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 transition-opacity rounded-2xl"
                title={t("Ανέβασμα φωτογραφίας", "Upload photo")}
                aria-label={t("Ανέβασμα φωτογραφίας", "Upload photo")}
              >
                <Camera className="h-5 w-5 text-white" aria-hidden />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>

            {/* Name & Bio */}
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center justify-between">
                {isEditingName ? (
                  <div className="flex w-full items-center gap-2">
                    {/* eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves only after the user opened this field */}
                    <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)}
                      className={`flex-1 text-sm md:text-base font-bold rounded-2xl px-3 py-1.5 focus:ring-2 outline-none ${inputBg} ${a.ring}`} />
                    <Button size="sm" onClick={() => { if (tempName.trim()) { updateUser(currentUser.id, { name: tempName }); setIsEditingName(false); toast.success(t('Το όνομα αποθηκεύτηκε', 'Name saved')); } }}>{t("Αποθήκευση", "Save")}</Button>
                    <Button size="sm" variant="ghost" aria-label={t('Ακύρωση', 'Cancel')} onClick={() => { setTempName(currentUser.name); setIsEditingName(false); }}><X className="w-4 h-4" aria-hidden /></Button>
                  </div>
                ) : (
                  <div className="group/name relative flex w-full items-center justify-between">
                    <h2 className={`text-sm md:text-base font-extrabold pr-8 ${heading}`}>{currentUser.name}</h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      aria-label={t("Επεξεργασία ονόματος", "Edit name")}
                      className={`p-1.5 min-h-9 min-w-9 flex items-center justify-center opacity-0 group-hover/name:opacity-100 group-focus-within/name:opacity-100 focus-visible:opacity-100 transition-opacity rounded-lg ${a.isDark ? "text-gray-400 hover:bg-gray-700/40" : "text-gray-400 hover:bg-white/80"} ${a.accent}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </div>
                )}
              </div>
              <div className={`flex flex-wrap gap-2 text-xs font-medium ${sub}`}>
                <span>{currentUser.ageRange}</span><span>•</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{currentUser.city}</span>
              </div>

              <div className="mt-3">
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)} className={`w-full text-sm rounded-2xl p-3 focus:ring-2 outline-none resize-none ${inputBg} ${a.ring}`} rows={3} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setBio(tempBio); setIsEditingBio(false); updateUser(currentUser.id, { bio: tempBio }); toast.success(t('Το bio αποθηκεύτηκε', 'Bio saved')); }}>{t("Αποθήκευση", "Save")}</Button>
                      <Button size="sm" variant="outline" onClick={() => { setTempBio(bio); setIsEditingBio(false); }}>{t("Ακύρωση", "Cancel")}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group/bio relative">
                    <p className={`card-copy font-medium pr-8 leading-relaxed ${bodyTextLight}`}>{bio}</p>
                    <button
                      type="button"
                      onClick={() => setIsEditingBio(true)}
                      aria-label={t("Επεξεργασία bio", "Edit bio")}
                      className={`absolute top-0 right-0 p-1.5 min-h-9 min-w-9 flex items-center justify-center opacity-0 group-hover/bio:opacity-100 group-focus-within/bio:opacity-100 focus-visible:opacity-100 transition-opacity rounded-lg ${a.isDark ? "text-gray-400 hover:bg-gray-700/40" : "text-gray-400 hover:bg-white/80"} ${a.accent}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden />
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditingBio(true)} className="flex items-center gap-1.5">
                <Edit2 className="w-3 h-3" /> {t("Επεξεργασία", "Edit")}
              </Button>
              {currentUser.isOrganizer ? (
                <>
                  <Button size="sm" onClick={() => navigate(`/organizer/${currentUser.id}`)}>
                    {t('Προφίλ Διοργανωτή', 'Organizer Profile')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/manage')}
                    className="flex items-center gap-1.5"
                  >
                    <Star className="w-3 h-3" /> {t('Πίνακας Διοργανωτή', 'Organizer Workspace')}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate('/create')}
                  className="flex items-center gap-1.5"
                >
                  <Star className="w-3 h-3" /> {t('Γίνε Διοργανωτής', 'Become Organizer')}
                </Button>
              )}
            </div>
          </div>
        </div>

      </Card>

      {/* ═══ Progressive disclosure (Φ25, from nakamas) ═══ */}
      <TabBar
        variant="segmented"
        idBase="profile"
        ariaLabel={t("Ενότητες προφίλ", "Profile sections")}
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "overview", label: t("Ενδιαφέροντα & Δίκτυο", "Interests & Network"), icon: UserIcon },
          { id: "wall", label: t("Ο Τοίχος μου", "My Wall"), icon: Newspaper, count: myWallPosts.length },
          { id: "trust", label: t("Επίπεδα & Ομάδες", "Tiers & Group Prefs"), icon: ShieldCheck },
          { id: "privacy", label: t("Ορατότητα & Απόρρητο", "Visibility & Privacy"), icon: Lock },
        ]}
      />

      <Card className={activeTab === "wall" ? "p-0 border-0 shadow-none bg-transparent" : "p-4"} role="tabpanel" id={`profile-panel-${activeTab}`} aria-labelledby={`profile-tab-${activeTab}`}>
        {activeTab === "overview" && (
          <div className="space-y-5 [&>*:first-child]:mt-0 [&>*:first-child]:pt-0 [&>*:first-child]:border-t-0">
        {/* ─── Interests ─── */}
        <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-4 ${label}`}>{t("Ενδιαφέροντα", "Interests")}</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {interests.map((i) => (
              <Badge key={i} variant="neutral" className={`pr-1.5 select-none ${a.isDark ? "" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                {interestLabel(i, language)}
                <button onClick={() => {
                    const updated = interests.filter((int) => int !== i);
                    setInterests(updated);
                    updateUser(currentUser.id, { interests: updated });
                    toast.success(t('Το ενδιαφέρον αφαιρέθηκε', 'Interest removed'));
                  }}
                  type="button"
                  aria-label={t(`Αφαίρεση ενδιαφέροντος ${interestLabel(i, 'el')}`, `Remove interest ${interestLabel(i, 'en')}`)}
                  title={t('Αφαίρεση', 'Remove')}
                  className={`ml-1.5 p-0.5 rounded-full transition-colors ${a.isDark ? "hover:bg-gray-600 text-gray-400 hover:text-gray-200" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}>
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
            {isAddingInterest ? (
              <form onSubmit={(e) => { e.preventDefault(); if (!newInterest.trim()) return; if (interests.some((x) => sameInterest(x, newInterest))) { toast.message(t(`Το «${interestLabel(newInterest, "el")}» υπάρχει ήδη`, `«${interestLabel(newInterest, "en")}» is already in your interests`)); return; } const updated = [...interests, canonicalInterest(newInterest)]; setInterests(updated); updateUser(currentUser.id, { interests: updated }); setNewInterest(""); setIsAddingInterest(false); toast.success(t('Το ενδιαφέρον προστέθηκε', 'Interest added')); }} className="flex items-center gap-2">
                <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder={t("Νέο ενδιαφέρον...", "New interest...")}
                  aria-label={t("Νέο ενδιαφέρον", "New interest")}
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves only after the user opened this field
                  className={`text-xs border rounded-lg px-2 py-1 w-28 focus:outline-none ${inputBg} ${a.ring}`} autoFocus onBlur={() => { if (!newInterest.trim()) setIsAddingInterest(false); }} />
                <Button type="submit" size="sm" variant="ghost" className={`h-6 px-2 font-bold capitalize text-xs ${a.accent}`}>{t("Προσθήκη", "Add")}</Button>
              </form>
            ) : (
              <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs font-medium flex items-center gap-1 ${a.isDark ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"}`} onClick={() => setIsAddingInterest(true)}>
                <Plus className="w-3 h-3" /> {t("Προσθήκη", "Add Interest")}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Availability ─── */}
        <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-4 ${label}`}>{t("Προτιμήσεις Διαθεσιμότητας", "Availability Preferences")}</h3>
          <div className="flex flex-wrap gap-2">
            {userSettings.availability.includes('weekends') && <Badge variant="neutral">{t("Σαββατοκύριακα", "Weekends")}</Badge>}
            {userSettings.availability.includes('weekday_evenings') && <Badge variant="neutral">{t("Βράδια Καθημερινών", "Weekday Evenings")}</Badge>}
            {userSettings.availability.includes('weekday_mornings') && <Badge variant="neutral">{t("Πρωινά καθημερινών", "Weekday mornings")}</Badge>}
            {userSettings.availability.length === 0 && (
              <span className={`text-xs ${sub}`}>{t('Δεν έχετε ορίσει διαθεσιμότητα', 'No availability set yet')}</span>
            )}
            <Button variant="ghost" size="sm" className={`${a.isDark ? "bg-gray-800 border border-gray-700 text-gray-300" : "bg-gray-50 border border-gray-200"}`} onClick={() => navigate("/settings?availability=1")}>
              + {t("Επεξεργασία", "Edit")}
            </Button>
          </div>
        </div>

        {/* ─── History & Reviews ─── */}
        <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xs font-bold capitalize tracking-wide ${label}`}>{t("Ιστορικό & Αξιολογήσεις", "History & Reviews")}</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className={`font-bold ${a.btnAccent}`}>{t("Προβολή Όλων", "View All")}</Button>
          </div>
          <div className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${historyBg}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl shrink-0 ${a.historyIcon}`}><History className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className={`text-sm font-bold ${heading}`}>{t("Παρελθούσες Εκδηλώσεις & Ιδιωτική Αξιολόγηση", "Past Events & Private Feedback")}</p>
                <p className={`text-xs font-medium ${sub}`}>{t("Αξιολογήστε τις εμπειρίες σας ιδιωτικά", "Review your experiences privately")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/history")} className="shrink-0">{t("Αξιολόγηση", "Review")}</Button>
          </div>
        </div>

        {/* ─── Connected Nakamas Preview ─── */}
        {connectedUsers.length > 0 && (
          <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-bold capitalize tracking-wide ${label}`}>{t("Οι Nakamas μου", "My Nakamas")} <span className={`ml-1 ${sub}`}>({connectionCount})</span></h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/connections")} className={`font-bold ${a.btnAccent}`}>{t("Προβολή Όλων", "View All")}</Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
              {connectedUsers.slice(0, 8).map((u) => (
                <div key={u.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group" {...pressable<HTMLDivElement>(() => navigate(profilePathFor(u)))}>
                  <PersonAvatar user={u} className={`w-11 h-11 rounded-xl border-2 transition-all ${a.isDark ? "border-gray-700/50 group-hover:border-gray-500" : "border-gray-200 group-hover:border-gray-300"} group-hover:scale-105`} />
                  <span className={`text-2xs font-bold truncate max-w-[64px] ${a.isDark ? "text-gray-300" : "text-gray-700"}`}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        )}
        {activeTab === "wall" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface-raised px-4 py-3">
              <p className="text-xs font-medium text-ink-muted">
                {t("Κάθε δημοσίευση έχει το δικό της κοινό. Δες πώς φαίνεται ο τοίχος σου στους άλλους.", "Every post has its own audience. See how your wall looks to others.")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/u/${currentUser.id}?viewAs=public`)} className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" aria-hidden /> {t("Δες ως…", "View as…")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate("/wall")} className="gap-1.5">
                  <Newspaper className="w-3.5 h-3.5" aria-hidden /> {t("Ροή Nakamas", "Nakamas feed")}
                </Button>
              </div>
            </div>
            {myPendingTags.length > 0 && (
              <section aria-labelledby="pending-tags-title" className="space-y-2 rounded-2xl border border-accent bg-accent-soft p-3">
                <h3 id="pending-tags-title" className="text-sm font-bold text-ink">
                  {myPendingTags.length === 1
                    ? t("1 ετικέτα περιμένει την έγκρισή σου", "1 tag is waiting for your approval")
                    : t(`${myPendingTags.length} ετικέτες περιμένουν την έγκρισή σου`, `${myPendingTags.length} tags are waiting for your approval`)}
                </h3>
                <p className="text-xs font-medium text-ink">
                  {t("Εμφανίζονται στο προφίλ σου μόνο αφού τις εγκρίνεις (Έλεγχος ετικετών).", "They show on your profile only after you approve them (Tag review).")}
                </p>
                <WallPostList posts={myPendingTags} />
              </section>
            )}
            <PostComposer />
            {myWallPosts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm font-medium text-ink-muted">
                {t("Ο τοίχος σου είναι άδειος — γράψε τι σχεδιάζεις.", "Your wall is empty — share what you are planning.")}
              </p>
            ) : (
              <WallPostList posts={myWallPosts} />
            )}
          </div>
        )}
        {activeTab === "trust" && (
          <div className="space-y-5 [&>*:first-child]:mt-0 [&>*:first-child]:pt-0 [&>*:first-child]:border-t-0">
        {/* ─── Identity Tiers ─── */}
        <div className={`mt-4 pt-4 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-4 ${label}`}>{t("Επίπεδα Ταυτότητας & Δικαιώματα", "Identity Tiers & Permissions")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${a.isDark ? "bg-emerald-900/20" : "bg-emerald-100"}`}>
                <CheckCircle2 className={`h-4 w-4 ${a.isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${heading}`}>{t("Επίπεδο 1: Εξερευνητής", "Tier 1: Explorer")}</p>
                <p className={`text-2xs capitalize font-medium tracking-wide ${sub}`}>{t("Email/Τηλέφωνο επαληθευμένο. Συμμετοχή σε Δημόσιες Εκδηλώσεις.", "Email/Phone verified. Can join Public Free Events.")}</p>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${a.isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`}
              {...pressable<HTMLDivElement>(() => navigate("/wallet"))}
            >
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                currentUser.paymentVerified
                  ? (a.isDark ? "bg-emerald-900/20" : "bg-emerald-100")
                  : (a.isDark ? "bg-gray-800/40 border border-gray-600/40" : "bg-gray-100 border border-gray-200")
              }`}>
                {currentUser.paymentVerified ? (
                  <CheckCircle2 className={`h-4 w-4 ${a.isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                ) : (
                  <CreditCardIcon className={`h-4 w-4 ${a.isDark ? "text-gray-500" : "text-gray-400"}`} />
                )}
              </div>
              <div className={`flex-1 border p-3 rounded-lg ${currentUser.paymentVerified ? a.tierHighlight : (a.isDark ? "border-gray-700/40" : "border-gray-200")}`}>
                <p className={`text-sm font-bold ${currentUser.paymentVerified ? a.tierHighlightText : heading}`}>{t("Επίπεδο 2: Επιβεβαιωμένος", "Tier 2: Confirmed")}</p>
                <p className={`text-2xs capitalize font-bold tracking-wide ${currentUser.paymentVerified ? a.tierHighlightSub : sub}`}>
                  {currentUser.paymentVerified
                    ? t("Προσθήκη Μεθόδου Πληρωμής. Συμμετοχή σε Πληρωμένες/Μικρές Ομάδες.", "Payment Method added. Can join Paid/Small Group Events.")
                    : t("Προσθέστε μέθοδο πληρωμής για πληρωμένες/μικρές ομάδες.", "Add a payment method for paid/small group events.")}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${sub}`} aria-hidden />
            </div>
            <div className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${a.isDark ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}`} {...pressable<HTMLDivElement>(() => navigate("/verification"))}>
              <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${a.isDark ? "bg-gray-800/40 border-gray-600/40" : "bg-gray-100 border-gray-200"}`}>
                <Shield className={`h-4 w-4 ${a.isDark ? "text-gray-500" : "text-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${a.isDark ? "text-gray-300" : "text-gray-700"}`}>{t("Επίπεδο 3: Υψηλή Εμπιστοσύνη", "Tier 3: High Trust")}</p>
                <p className={`text-2xs capitalize font-medium tracking-wide ${sub}`}>{t("Ταυτότητα/Selfie + Υψηλή Αξιοπιστία → Ιδιωτικές/Εκδρομές", "ID/Selfie + High Reliability → Private/Trips")}</p>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${sub}`} />
            </div>
          </div>
        </div>

        {/* ─── Group Preferences ─── */}
        <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-4 ${label}`}>{t("Προτιμήσεις Ομάδας", "Group Preferences")}</h3>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-colors ${a.radioActive}`}>
              <input type="radio" name="groupsize" defaultChecked className={`mt-0.5 h-4 w-4 rounded-full ${a.checkbox}`} />
              <div>
                <span className={`text-sm font-bold block ${a.radioText}`}>{t("Προεπιλογή: Ομάδες (3-5 άτομα)", "Default: Groups (3-5 people)")}</span>
                <span className={`text-xs font-medium leading-relaxed block mt-1 ${a.radioSub}`}>{t("Συνιστάται. Το Nakamas λειτουργεί καλύτερα σε μικρές ομάδες για ασφάλεια.", "Recommended. Nakamas works best in small groups for safety.")}</span>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-colors opacity-60 ${a.isDark ? "border-gray-700/40" : "border-gray-200"}`}>
              <input type="radio" name="groupsize" disabled className="mt-0.5 h-4 w-4 text-gray-400 rounded-full border-gray-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold block ${a.isDark ? "text-gray-300" : "text-gray-700"}`}>{t("1-προς-1 Εμπειρίες", "1-on-1 Experiences")}</span>
                  <Badge variant="neutral" className="rounded-lg">{t("Επίπεδο 3", "Tier 3")}</Badge>
                </div>
                <span className={`text-xs font-medium leading-relaxed block mt-1 ${sub}`}>{t("Απαιτεί Υψηλό Επίπεδο Εμπιστοσύνης.", "Requires High Trust Tier.")}</span>
              </div>
            </label>
          </div>
        </div>

          </div>
        )}
        {activeTab === "privacy" && (
          <div className="space-y-5 [&>*:first-child]:mt-0 [&>*:first-child]:pt-0 [&>*:first-child]:border-t-0">
        {/* ─── Privacy Settings ─── */}
        <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-4 ${label}`}>{t("Ορατότητα, Συνδέσεις & Απόρρητο", "Visibility, Connections & Privacy")}</h3>
          <div className="space-y-3">
            {/* Profile Visibility */}
            <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 border rounded-2xl transition-colors ${a.settingCard}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${a.isDark ? "bg-gray-700/30" : "bg-gray-100"}`}><Eye className={`w-4 h-4 ${sub}`} /></div>
                <div>
                  <p className={`text-sm font-bold ${heading}`}>{t("Ορατότητα Προφίλ", "Profile Visibility")}</p>
                  <p className={`text-xs mt-0.5 ${sub}`}>{t("Δημόσιο, Nakamas, συγκεκριμένα άτομα, λίστα ή «εκτός από…».", "Public, Nakamas, specific people, a list or “except…”.")}</p>
                </div>
              </div>
              <AudienceChip
                audience={resolveProfileAudience(userSettings.privacy) ?? profileVisibilityToAudience(userSettings.privacy.profileVisibility)}
                onClick={() => setProfileAudienceOpen(true)}
                className="self-start"
              />
              <AudiencePickerModal
                open={profileAudienceOpen}
                onClose={() => setProfileAudienceOpen(false)}
                value={resolveProfileAudience(userSettings.privacy) ?? profileVisibilityToAudience(userSettings.privacy.profileVisibility)}
                context="profile"
                title={t("Ποιος βλέπει το προφίλ μου;", "Who can see my profile?")}
                description={t("Όσοι δεν είναι στο κοινό βλέπουν μόνο ότι το προφίλ είναι ιδιωτικό.", "People outside the audience only see that the profile is private.")}
                onSave={(a) => patchPrivacy({ profileAudience: a })}
              />
            </div>

            {/* Message Permission */}
            <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 border rounded-2xl transition-colors ${a.settingCard}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${a.isDark ? "bg-gray-700/30" : "bg-gray-100"}`}><MessageSquare className={`w-4 h-4 ${sub}`} /></div>
                <div>
                  <p className={`text-sm font-bold ${heading}`}>{t("Ποιοι μπορούν να μου στείλουν μήνυμα", "Who can message me")}</p>
                  <p className={`text-xs mt-0.5 ${sub}`}>{t("Ποιοι μπορούν να ξεκινήσουν συνομιλία.", "Who can start a chat with you.")}</p>
                </div>
              </div>
              <select aria-label={t("Ποιος μπορεί να σας στείλει μήνυμα", "Who can message you")}
                value={userSettings.privacy.messagePermission}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === 'everyone' || v === 'connections' || v === 'groups') {
                    patchPrivacy({ messagePermission: v });
                  }
                }}
                className={`filter-select outline-none border ${a.selectBg} ${a.selectRing}`}
              >
                <option value="everyone">{t("Όλοι", "Everyone")}</option>
                <option value="connections">{t("Μόνο συνδέσεις Nakamas", "Connections only")}</option>
                <option value="groups">{t("Ομάδες ίδιας εκδήλωσης", "Same event groups")}</option>
              </select>
            </div>

            {/* Share Location */}
            <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-colors ${a.settingCard} ${a.isDark ? "hover:bg-gray-700/20" : "hover:bg-gray-50"}`}>
              <div className={`p-2 rounded-lg shrink-0 ${a.isDark ? "bg-gray-700/30" : "bg-gray-100"}`}><MapPin className={`w-4 h-4 ${sub}`} /></div>
              <div className="flex-1">
                <span className={`text-sm font-bold block ${heading}`}>{t("Κοινοποίηση Τοποθεσίας", "Share Location")}</span>
                <span className={`text-xs font-medium leading-relaxed block mt-0.5 ${sub}`}>{t("Για καλύτερες προτάσεις εκδηλώσεων και ζωντανή παρακολούθηση.", "For better event recommendations and live tracking.")}</span>
              </div>
              <input
                type="checkbox"
                checked={userSettings.privacy.shareLocation}
                onChange={(e) => patchPrivacy({ shareLocation: e.target.checked })}
                className={`mt-1 h-4 w-4 rounded-lg border-gray-300 ${a.checkbox} focus:ring-2`}
              />
            </label>

            {/* Toggle Checkboxes */}
            <div className={`p-4 border rounded-2xl space-y-4 ${a.settingCard}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${a.isDark ? "bg-gray-700/30" : "bg-gray-100"}`}><Lock className={`w-4 h-4 ${sub}`} /></div>
                <span className={`text-sm font-bold ${heading}`}>{t("Ρυθμίσεις Απορρήτου", "Privacy Controls")}</span>
              </div>
              {[
                { key: "revealPhoto", icon: Camera, label: t("Εμφάνιση φωτογραφίας σε μη-συνδέσεις", "Show photo to non-connections") },
                { key: "allowMutualPing", icon: Users, label: t("Αμοιβαία αιτήματα μετά εκδήλωση", 'Allow "Keep in touch" post-event') },
                { key: "allowOrganizerMsg", icon: MessageSquare, label: t("Μηνύματα διοργανωτών μετά εκδήλωση", "Organizer messages after event") },
              ].map((opt) => (
                <label key={opt.key} className={`flex items-center justify-between gap-3 py-2 cursor-pointer ${a.isDark ? "border-gray-700/30" : "border-gray-100"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <opt.icon className={`w-3.5 h-3.5 shrink-0 ${sub}`} />
                    <span className={`card-copy font-medium ${bodyText}`}>{opt.label}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={userSettings.privacy[opt.key as keyof typeof userSettings.privacy] as boolean}
                    onChange={(e) => patchPrivacy({ [opt.key]: e.target.checked } as Partial<typeof userSettings.privacy>)}
                    className={`h-4 w-4 rounded-lg border-gray-300 shrink-0 ${a.checkbox} focus:ring-2`}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Wall, sections & audience lists (Φ26) ─── */}
        <div className={`mt-5 pt-4 border-t ${sectionBorder}`}>
          <WallPrivacyPanel showProfileRow={false} />
        </div>

          </div>
        )}
      </Card>

      {activeTab === "overview" && (
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${a.isDark ? "bg-gray-700/40" : "bg-gray-100"}`}>
            <Share2 className={`h-5 w-5 ${a.accent}`} aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${heading}`}>{t("Φέρε τους δικούς σου Nakamas", "Bring your own Nakamas")}</p>
            <p className={`text-xs font-medium mt-0.5 ${sub}`}>{t("Οι φίλοι που προσκαλείς μπαίνουν κατευθείαν στο δίκτυό σου — πιο εύκολα σχηματίζονται ομάδες.", "Friends you invite join your network directly — groups form faster.")}</p>
          </div>
          <Button size="sm" onClick={() => void handleInvite()} className="flex items-center gap-1.5 shrink-0">
            <Share2 className="w-3.5 h-3.5" aria-hidden /> {t("Πρόσκληση φίλων", "Invite friends")}
          </Button>
        </Card>
      )}

      {/* ═══ Quick Links ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Settings, label: t("Ρυθμίσεις", "Settings"), desc: t("Γλώσσα, θέμα & λοιπά", "Language, theme & more"), to: "/settings" },
          { icon: ShieldCheck, label: t("Επαλήθευση", "Verification"), desc: t("Αύξηση εμπιστοσύνης", "Increase your trust"), to: "/verification" },
          { icon: Bookmark, label: t("Αποθηκευμένα", "Saved"), desc: t("Αγαπημένες εκδηλώσεις", "Favorite events"), to: "/saved" },
          { icon: MessageSquare, label: t("Συνομιλίες", "Chats"), desc: t("Ομαδικά μηνύματα", "Group messages"), to: "/chats" },
        ].map((link) => (
          <button
            key={link.to}
            type="button"
            onClick={() => navigate(link.to)}
            className={cn(
              "group rounded-2xl border p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              a.isDark ? "bg-gray-800/60 border-gray-700/50" : "bg-white border-gray-100",
            )}
          >
            <div className="flex items-center justify-between">
              <link.icon className={`w-4 h-4 ${a.accent}`} aria-hidden />
              <ChevronRight className={`w-3.5 h-3.5 ${sub} opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity`} aria-hidden />
            </div>
            <p className={`text-sm font-bold mt-2 ${heading}`}>{link.label}</p>
            <p className={`text-2xs font-medium mt-0.5 ${sub}`}>{link.desc}</p>
          </button>
        ))}
      </div>

      {/* Sign Out */}
      <div className="flex justify-center">
        <Button onClick={() => { logout(); navigate("/login"); }} variant="ghost" className="text-gray-400 hover:text-red-500 font-bold capitalize tracking-wide text-xs">
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> {t("Αποσύνδεση", "Sign Out")}
        </Button>
      </div>
    </div>
  );
}
