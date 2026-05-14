import React, { useState, useEffect, useRef } from "react";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { ProfileSkeleton } from "../common/Skeleton";
import { useStore } from "../../store";
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
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../lib/i18n";

// ─── Theme accent helper ─────────────────────────────────────
function useAccent() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark";

  if (theme === "vibrant" || theme === "vibrant-dark") return {
    isDark,
    accent: isDark ? "text-fuchsia-400" : "text-fuchsia-600",
    accentBg: isDark ? "bg-fuchsia-900/20" : "bg-fuchsia-50",
    accentBorder: isDark ? "border-fuchsia-800" : "border-fuchsia-200",
    accentLight: isDark ? "text-fuchsia-300" : "text-fuchsia-700",
    ring: "focus:ring-fuchsia-500 focus:border-fuchsia-500",
    checkbox: isDark ? "text-fuchsia-400" : "text-fuchsia-600",
    radioActive: isDark ? "border-fuchsia-600 bg-fuchsia-900/20" : "border-fuchsia-200 bg-fuchsia-50/30",
    radioText: isDark ? "text-fuchsia-300" : "text-fuchsia-900",
    radioSub: isDark ? "text-fuchsia-400/80" : "text-fuchsia-700/80",
    tierHighlight: isDark ? "border-fuchsia-700 bg-fuchsia-900/20" : "border-emerald-200 bg-emerald-50/50",
    tierHighlightText: isDark ? "text-fuchsia-300" : "text-emerald-800",
    tierHighlightSub: isDark ? "text-fuchsia-400/80" : "text-emerald-600/80",
    btnAccent: isDark ? "text-fuchsia-400 hover:bg-fuchsia-900/30" : "text-fuchsia-600 hover:bg-fuchsia-50",
    historyIcon: isDark ? "bg-fuchsia-900/30 text-fuchsia-400" : "bg-fuchsia-100 text-fuchsia-600",
    selectBg: isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200",
    selectRing: isDark ? "focus:border-fuchsia-500 focus:ring-fuchsia-500" : "focus:border-fuchsia-500 focus:ring-fuchsia-500",
    settingCard: isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-100",
    avatarBg: isDark ? "bg-fuchsia-900/30 border-fuchsia-700" : "bg-fuchsia-100 border-fuchsia-200",
    avatarText: isDark ? "text-fuchsia-400" : "text-fuchsia-700",
  };

  if (theme === "bento") return {
    isDark: false,
    accent: "text-indigo-600", accentBg: "bg-indigo-50", accentBorder: "border-indigo-200", accentLight: "text-indigo-700",
    ring: "focus:ring-indigo-500 focus:border-indigo-500", checkbox: "text-indigo-600",
    radioActive: "border-indigo-200 bg-indigo-50/30", radioText: "text-indigo-900", radioSub: "text-indigo-700/80",
    tierHighlight: "border-emerald-200 bg-emerald-50/50", tierHighlightText: "text-emerald-800", tierHighlightSub: "text-emerald-600/80",
    btnAccent: "text-indigo-600 hover:bg-indigo-50", historyIcon: "bg-indigo-100 text-indigo-600",
    selectBg: "bg-gray-50 border-gray-200", selectRing: "focus:border-indigo-500 focus:ring-indigo-500",
    settingCard: "bg-white border-gray-100", avatarBg: "bg-indigo-100 border-indigo-200", avatarText: "text-indigo-700",
  };

  if (theme === "neon" || theme === "neon-dark" || theme === "bento-dark") return {
    isDark,
    accent: isDark ? "text-emerald-400" : "text-emerald-600",
    accentBg: isDark ? "bg-emerald-900/20" : "bg-emerald-50",
    accentBorder: isDark ? "border-emerald-800" : "border-emerald-200",
    accentLight: isDark ? "text-emerald-300" : "text-emerald-700",
    ring: "focus:ring-emerald-500 focus:border-emerald-500",
    checkbox: isDark ? "text-emerald-400" : "text-emerald-600",
    radioActive: isDark ? "border-emerald-700 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50/30",
    radioText: isDark ? "text-emerald-300" : "text-emerald-900",
    radioSub: isDark ? "text-emerald-400/80" : "text-emerald-700/80",
    tierHighlight: isDark ? "border-emerald-700 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50/50",
    tierHighlightText: isDark ? "text-emerald-300" : "text-emerald-800",
    tierHighlightSub: isDark ? "text-emerald-400/80" : "text-emerald-600/80",
    btnAccent: isDark ? "text-emerald-400 hover:bg-emerald-900/30" : "text-emerald-600 hover:bg-emerald-50",
    historyIcon: isDark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-100 text-emerald-600",
    selectBg: isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200",
    selectRing: isDark ? "focus:border-emerald-500 focus:ring-emerald-500" : "focus:border-emerald-500 focus:ring-emerald-500",
    settingCard: isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-100",
    avatarBg: isDark ? "bg-emerald-900/30 border-emerald-700" : "bg-emerald-100 border-emerald-200",
    avatarText: isDark ? "text-emerald-400" : "text-emerald-700",
  };

  // Classic
  return {
    isDark: false,
    accent: "text-[#0E8B8D]", accentBg: "bg-cyan-50", accentBorder: "border-cyan-200", accentLight: "text-cyan-700",
    ring: "focus:ring-cyan-500 focus:border-cyan-500", checkbox: "text-cyan-600",
    radioActive: "border-cyan-200 bg-cyan-50/30", radioText: "text-cyan-900", radioSub: "text-cyan-700/80",
    tierHighlight: "border-emerald-200 bg-emerald-50/50", tierHighlightText: "text-emerald-800", tierHighlightSub: "text-emerald-600/80",
    btnAccent: "text-cyan-600 hover:bg-cyan-50", historyIcon: "bg-cyan-100 text-cyan-600",
    selectBg: "bg-gray-50 border-gray-200", selectRing: "focus:border-cyan-500 focus:ring-cyan-500",
    settingCard: "bg-white border-gray-100", avatarBg: "bg-cyan-100 border-cyan-200", avatarText: "text-cyan-700",
  };
}

// ─── Main component ──────────────────────────────────────────
export default function ProfilePageContent() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const a = useAccent();
  const currentUser = useStore((state) => state.currentUser);
  const updateUser = useStore((state) => state.updateUser);
  const logout = useStore((state) => state.logout);
  const users = useStore((state) => state.users);

  const [isLoading, setIsLoading] = useState(true);
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
  const [settings, setSettings] = useState({
    revealPhoto: true, allowMutualPing: true, allowOrganizerMsg: false,
    profileVisibility: "public" as "public" | "verified" | "private",
    messagePermission: "anyone" as "anyone" | "verified" | "friends",
    shareLocation: false,
  });

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newUrl = URL.createObjectURL(e.target.files[0]);
      setPhotoUrl(newUrl);
      updateUser(currentUser.id, { photoUrl: newUrl });
    }
  };

  if (isLoading) return <div className="mx-auto max-w-full px-4 py-8"><ProfileSkeleton /></div>;

  // Computed
  const connectionCount = (currentUser.connections || []).length;
  const connectedUsers = users.filter((u) => (currentUser.connections || []).includes(u.id));

  const heading = a.isDark ? "text-white" : "text-[#111827]";
  const sub = a.isDark ? "text-gray-400" : "text-gray-500";
  const label = a.isDark ? "text-gray-400" : "text-[#6B7280]";
  const bodyText = a.isDark ? "text-gray-300" : "text-gray-700";
  const bodyTextLight = a.isDark ? "text-gray-400" : "text-gray-600";
  const sectionBorder = a.isDark ? "border-gray-700/50" : "border-gray-100";
  const inputBg = a.isDark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900";
  const historyBg = a.isDark ? "bg-gray-800/50 border-gray-700/50" : "bg-gray-50 border-gray-200";

  return (
    <div className="mx-auto max-w-full space-y-8 pb-12 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div>
        <h1 className={`text-xl md:text-2xl font-extrabold tracking-tight ${heading}`}>{t("Προφίλ", "Profile")}</h1>
        <p className={`mt-1 text-xs font-medium leading-relaxed ${sub}`}>
          {t("Διαχειριστείτε τις ρυθμίσεις εμπιστοσύνης, τις επαληθεύσεις και το ιστορικό σας.", "Manage your trust settings, verifications, and history.")}
        </p>
      </div>

      {/* ═══ Quick Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, label: t("Nakamas", "Nakamas"), value: connectionCount, to: "/connections" },
          { icon: Calendar, label: t("Εκδηλώσεις", "Events"), value: 12, to: "/plans" },
          { icon: Star, label: t("Αξιοπιστία", "Reliability"), value: `${currentUser.reliabilityScore}%`, to: "/trust" },
          { icon: Award, label: t("Επίπεδο", "Tier"), value: currentUser.trustTier === "3_high_trust" ? "3" : currentUser.trustTier === "2_confirmed" ? "2" : "1", to: "/trust" },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 cursor-pointer group" onClick={() => navigate(stat.to)}>
            <div className="flex items-center gap-2">
              <stat.icon className={`w-4 h-4 ${a.accent}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${sub}`}>{stat.label}</span>
            </div>
            <p className={`text-lg font-extrabold mt-1 ${heading}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* ═══ Profile Card ═══ */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar */}
          <div className="relative group">
            <div className={`h-20 w-20 sm:h-16 sm:w-16 rounded-full flex items-center justify-center shrink-0 border overflow-hidden ${a.avatarBg}`}>
              {photoUrl ? (
                <img referrerPolicy="no-referrer" src={photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className={`font-bold text-xl ${a.avatarText}`}>{currentUser.name.substring(0, 2)}</span>
              )}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full" title={t("Ανέβασμα φωτογραφίας", "Upload photo")}>
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>

          {/* Name & Bio */}
          <div className="flex-1 space-y-1 min-w-0">
            <div className="mt-1 flex items-center justify-between">
              {isEditingName ? (
                <div className="flex w-full items-center gap-2">
                  <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)}
                    className={`flex-1 text-lg font-bold rounded-md px-2 py-1 focus:ring-2 outline-none ${inputBg} ${a.ring}`} />
                  <Button size="sm" onClick={() => { if (tempName.trim()) { updateUser(currentUser.id, { name: tempName }); setIsEditingName(false); } }}>{t("Αποθήκευση", "Save")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setTempName(currentUser.name); setIsEditingName(false); }}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="group/name relative flex w-full items-center justify-between">
                  <h2 className={`text-lg font-bold pr-8 ${heading}`}>{currentUser.name}</h2>
                  <button onClick={() => setIsEditingName(true)} className={`p-1 opacity-0 group-hover/name:opacity-100 transition-opacity rounded-md ${a.isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"} ${a.accent}`}>
                    <Edit2 className="w-3.5 h-3.5" />
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
                  <textarea value={tempBio} onChange={(e) => setTempBio(e.target.value)} className={`w-full text-sm rounded-md p-2 focus:ring-2 outline-none resize-none ${inputBg} ${a.ring}`} rows={3} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setBio(tempBio); setIsEditingBio(false); updateUser(currentUser.id, { bio: tempBio }); }}>{t("Αποθήκευση", "Save")}</Button>
                    <Button size="sm" variant="outline" onClick={() => { setTempBio(bio); setIsEditingBio(false); }}>{t("Ακύρωση", "Cancel")}</Button>
                  </div>
                </div>
              ) : (
                <div className="group/bio relative">
                  <p className={`text-sm font-medium pr-8 ${bodyTextLight}`}>{bio}</p>
                  <button onClick={() => setIsEditingBio(true)} className={`absolute top-0 right-0 p-1 opacity-0 group-hover/bio:opacity-100 transition-opacity rounded-md ${a.isDark ? "text-gray-400 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"} ${a.accent}`}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className={`text-xs py-1 px-2.5 shadow-sm ${currentUser.reliabilityScore >= 80 ? "text-green-700 bg-green-50 border-green-200" : currentUser.reliabilityScore >= 50 ? "text-blue-700 bg-blue-50 border-blue-200" : "text-amber-700 bg-amber-50 border-amber-200"}`}>
                <ShieldCheck className="h-4 w-4 mr-1.5 inline" />{currentUser.reliabilityScore}% {t("Αξιοπιστία", "Reliability")}
              </Badge>
              <Badge variant="outline" className={`text-xs py-1 px-2.5 shadow-sm ${currentUser.trustTier === "3_high_trust" ? (a.isDark ? "text-emerald-300 bg-emerald-900/20 border-emerald-700" : "text-cyan-700 bg-cyan-50 border-cyan-200") : (a.isDark ? "text-gray-300 bg-gray-800 border-gray-600" : "text-gray-700 bg-gray-50 border-gray-200")}`}>
                {currentUser.trustTier === "3_high_trust" ? t("Υψηλό Επίπεδο Εμπιστοσύνης", "High Trust Tier") : currentUser.trustTier.replace(/_/g, " ").toUpperCase() + " " + t("Επίπεδο", "Tier")}
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsEditingBio(true)}>{t("Επεξεργασία", "Edit")}</Button>
            {currentUser.isOrganizer ? (
              <Button size="sm" onClick={() => navigate(`/organizer/${currentUser.id}`)}>{t("Το Προφίλ Διοργανωτή μου", "My Organizer Profile")}</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => navigate("/manage")}>{t("Γίνε Διοργανωτής", "Become an Organizer")}</Button>
            )}
          </div>
        </div>

        {/* ─── Identity Tiers ─── */}
        <div className={`mt-6 pt-6 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-3 ${label}`}>{t("Επίπεδα Ταυτότητας & Δικαιώματα", "Identity Tiers & Permissions")}</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${a.isDark ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
                <CheckCircle2 className={`h-4 w-4 ${a.isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${heading}`}>{t("Επίπεδο 1: Εξερευνητής", "Tier 1: Explorer")}</p>
                <p className={`text-[10px] capitalize font-medium tracking-wide ${sub}`}>{t("Email/Τηλέφωνο επαληθευμένο. Συμμετοχή σε Δημόσιες Εκδηλώσεις.", "Email/Phone verified. Can join Public Free Events.")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${a.isDark ? "bg-emerald-900/30" : "bg-emerald-100"}`}>
                <CheckCircle2 className={`h-4 w-4 ${a.isDark ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>
              <div className={`flex-1 border p-2 rounded ${a.tierHighlight}`}>
                <p className={`text-sm font-bold ${a.tierHighlightText}`}>{t("Επίπεδο 2: Επιβεβαιωμένος", "Tier 2: Confirmed")}</p>
                <p className={`text-[10px] capitalize font-bold tracking-wide ${a.tierHighlightSub}`}>{t("Προσθήκη Μεθόδου Πληρωμής. Συμμετοχή σε Πληρωμένες/Μικρές Ομάδες.", "Payment Method added. Can join Paid/Small Group Events.")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/verification")}>
              <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${a.isDark ? "bg-gray-800 border-gray-600" : "bg-gray-100 border-gray-200"}`}>
                <Shield className={`h-4 w-4 ${a.isDark ? "text-gray-500" : "text-gray-400"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${a.isDark ? "text-gray-300" : "text-gray-700"}`}>{t("Επίπεδο 3: Υψηλή Εμπιστοσύνη", "Tier 3: High Trust")}</p>
                <p className={`text-[10px] capitalize font-medium tracking-wide ${sub}`}>{t("Ταυτότητα/Selfie επαληθευμένα + Υψηλή Αξιοπιστία. Πρόσβαση σε Ιδιωτικές/Εκδρομές.", "Identity/Selfie verified + High Reliability. Access to Private/Home events.")}</p>
              </div>
              <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${sub}`} />
            </div>
          </div>
        </div>

        {/* ─── Group Preferences ─── */}
        <div className={`mt-8 pt-6 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-3 ${label}`}>{t("Προτιμήσεις Ομάδας", "Group Preferences")}</h3>
          <div className="space-y-4">
            <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer ${a.radioActive}`}>
              <input type="radio" name="groupsize" defaultChecked className={`mt-0.5 h-4 w-4 rounded-full ${a.checkbox}`} />
              <div>
                <span className={`text-sm font-bold block ${a.radioText}`}>{t("Προεπιλογή: Ομάδες (3-5 άτομα)", "Default: Groups (3-5 people)")}</span>
                <span className={`text-xs font-medium leading-relaxed block mt-1 ${a.radioSub}`}>{t("Συνιστάται. Το Nakamas λειτουργεί καλύτερα σε μικρές ομάδες για ασφάλεια.", "Recommended. Nakamas works best in small groups for safety.")}</span>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer opacity-75 ${a.isDark ? "border-gray-700" : "border-gray-200"}`}>
              <input type="radio" name="groupsize" disabled className="mt-0.5 h-4 w-4 text-gray-400 rounded-full border-gray-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold block ${a.isDark ? "text-gray-300" : "text-gray-700"}`}>{t("1-προς-1 Εμπειρίες", "1-on-1 Experiences")}</span>
                  <Badge variant="neutral">{t("Επίπεδο 3", "Tier 3 Req")}</Badge>
                </div>
                <span className={`text-xs font-medium leading-relaxed block mt-1 ${sub}`}>{t("Απαιτεί Υψηλό Επίπεδο Εμπιστοσύνης.", "Requires High Trust Tier.")}</span>
              </div>
            </label>
          </div>
        </div>

        {/* ─── History & Reviews ─── */}
        <div className={`mt-8 pt-6 border-t ${sectionBorder}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-xs font-bold capitalize tracking-wide ${label}`}>{t("Ιστορικό & Αξιολογήσεις", "History & Reviews")}</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")} className={`font-bold ${a.btnAccent}`}>{t("Προβολή Όλων", "View All")}</Button>
          </div>
          <div className={`rounded-xl border p-4 flex items-center justify-between ${historyBg}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded ${a.historyIcon}`}><History className="h-5 w-5" /></div>
              <div>
                <p className={`text-sm font-bold ${heading}`}>{t("Παρελθούσες Εκδηλώσεις & Ιδιωτική Αξιολόγηση", "Past Events & Private Feedback")}</p>
                <p className={`text-xs font-medium ${sub}`}>{t("Αξιολογήστε τις εμπειρίες σας ιδιωτικά", "Review your experiences privately")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/history")}>{t("Αξιολόγηση", "Review")}</Button>
          </div>
        </div>

        {/* ─── Interests ─── */}
        <div className={`mt-8 pt-6 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-3 ${label}`}>{t("Ενδιαφέροντα", "Interests")}</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {interests.map((i) => (
              <Badge key={i} variant="neutral" className={`pr-1.5 select-none ${a.isDark ? "" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                {i}
                <button onClick={() => { const updated = interests.filter((int) => int !== i); setInterests(updated); updateUser(currentUser.id, { interests: updated }); }}
                  className={`ml-1.5 p-0.5 rounded-full transition-colors ${a.isDark ? "hover:bg-gray-600 text-gray-400 hover:text-gray-200" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"}`}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {isAddingInterest ? (
              <form onSubmit={(e) => { e.preventDefault(); if (newInterest.trim() && !interests.includes(newInterest.trim())) { const updated = [...interests, newInterest.trim()]; setInterests(updated); updateUser(currentUser.id, { interests: updated }); setNewInterest(""); setIsAddingInterest(false); } }} className="flex items-center gap-2">
                <input type="text" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} placeholder={t("Νέο ενδιαφέρον...", "New interest...")}
                  className={`text-xs border rounded px-2 py-1 w-28 focus:outline-none ${inputBg} ${a.ring}`} autoFocus onBlur={() => { if (!newInterest.trim()) setIsAddingInterest(false); }} />
                <Button type="submit" size="sm" variant="ghost" className={`h-6 px-2 font-bold capitalize text-[11px] ${a.accent}`}>{t("Προσθήκη", "Add")}</Button>
              </form>
            ) : (
              <Button variant="ghost" size="sm" className={`h-6 px-2 text-xs font-medium flex items-center gap-1 ${a.isDark ? "bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"}`} onClick={() => setIsAddingInterest(true)}>
                <Plus className="w-3 h-3" /> {t("Προσθήκη", "Add Interest")}
              </Button>
            )}
          </div>
        </div>

        {/* ─── Availability ─── */}
        <div className={`mt-8 pt-6 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-3 ${label}`}>{t("Προτιμήσεις Διαθεσιμότητας", "Availability Preferences")}</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">{t("Σαββατοκύριακα", "Weekends")}</Badge>
            <Badge variant="neutral">{t("Βράδια Καθημερινών", "Weekday Evenings")}</Badge>
            <Button variant="ghost" size="sm" className={`${a.isDark ? "bg-gray-800 border border-gray-700 text-gray-300" : "bg-gray-50 border border-gray-200"}`} onClick={() => navigate("/settings")}>
              + {t("Επεξεργασία", "Edit")}
            </Button>
          </div>
        </div>

        {/* ─── Privacy Settings ─── */}
        <div className={`mt-8 pt-6 border-t ${sectionBorder}`}>
          <h3 className={`text-xs font-bold capitalize tracking-wide mb-3 ${label}`}>{t("Ορατότητα, Συνδέσεις & Απόρρητο", "Visibility, Connections & Privacy")}</h3>
          <div className="space-y-4">
            {/* Profile Visibility */}
            <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3 border rounded-xl shadow-sm ${a.settingCard}`}>
              <div>
                <p className={`text-sm font-bold ${heading}`}>{t("Ορατότητα Προφίλ", "Profile Visibility")}</p>
                <p className={`text-xs mt-0.5 ${sub}`}>{t("Επιλέξτε ποιοι μπορούν να δουν το πλήρες προφίλ σας.", "Choose who can see your full profile.")}</p>
              </div>
              <select value={settings.profileVisibility} onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value as any })}
                className={`text-xs rounded-lg shadow-sm py-1.5 px-2 outline-none ${a.selectBg} ${a.selectRing}`}>
                <option value="public">{t("Όλοι", "Everyone")}</option>
                <option value="verified">{t("Μόνο επαληθευμένοι", "Verified Only")}</option>
                <option value="private">{t("Ιδιωτικό", "Private")}</option>
              </select>
            </div>

            {/* Message Permission */}
            <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-2 p-3 border rounded-xl shadow-sm ${a.settingCard}`}>
              <div>
                <p className={`text-sm font-bold ${heading}`}>{t("Ποιοι μπορούν να μου στείλουν μήνυμα", "Who can message me")}</p>
                <p className={`text-xs mt-0.5 ${sub}`}>{t("Διαχειριστείτε ποιοι μπορούν να ξεκινήσουν συνομιλία μαζί σας.", "Manage who can initiate a chat with you.")}</p>
              </div>
              <select value={settings.messagePermission} onChange={(e) => setSettings({ ...settings, messagePermission: e.target.value as any })}
                className={`text-xs rounded-lg shadow-sm py-1.5 px-2 outline-none ${a.selectBg} ${a.selectRing}`}>
                <option value="anyone">{t("Όλοι", "Everyone")}</option>
                <option value="verified">{t("Μόνο επαληθευμένοι", "Verified Only")}</option>
                <option value="friends">{t("Μόνο Nakamas", "Nakamas Only")}</option>
              </select>
            </div>

            {/* Share Location */}
            <label className={`flex items-start gap-3 p-3 border rounded-xl shadow-sm cursor-pointer transition-colors ${a.settingCard} ${a.isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}`}>
              <input type="checkbox" checked={settings.shareLocation} onChange={(e) => setSettings({ ...settings, shareLocation: e.target.checked })}
                className={`mt-0.5 h-4 w-4 rounded border-gray-300 ${a.checkbox} focus:ring-2`} />
              <div>
                <span className={`text-sm font-bold block ${heading}`}>{t("Κοινοποίηση Δεδομένων Τοποθεσίας", "Share Location Data")}</span>
                <span className={`text-xs font-medium leading-relaxed block mt-0.5 ${sub}`}>{t("Να επιτρέπεται η χρήση τοποθεσίας για προτάσεις εκδηλώσεων και ζωντανή παρακολούθηση.", "Allow location use for event recommendations and live tracking.")}</span>
              </div>
            </label>

            {/* Checkboxes */}
            {[
              { key: "revealPhoto", label: t("Αποκάλυψη φωτογραφίας στις ομάδες 2 ώρες πριν την εκδήλωση", "Reveal my photo to groups 2h before event") },
              { key: "allowMutualPing", label: t("Αμοιβαία αιτήματα επικοινωνίας μετά την εκδήλωση", 'Allow mutual "Keep in touch" requests post-event') },
              { key: "allowOrganizerMsg", label: t("Διοργανωτές να στέλνουν μηνύματα μετά την εκδήλωση", "Allow organizers to message me after event") },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-3">
                <input type="checkbox" checked={(settings as any)[opt.key]} onChange={(e) => setSettings({ ...settings, [opt.key]: e.target.checked })}
                  className={`h-4 w-4 rounded border-gray-300 ${a.checkbox} focus:ring-2`} />
                <span className={`text-sm font-medium ${bodyText}`}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ─── Connected Nakamas Preview ─── */}
        {connectedUsers.length > 0 && (
          <div className={`mt-8 pt-6 border-t ${sectionBorder}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-bold capitalize tracking-wide ${label}`}>{t("Οι Nakamas μου", "My Nakamas")}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/connections")} className={`font-bold ${a.btnAccent}`}>{t("Προβολή Όλων", "View All")}</Button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {connectedUsers.slice(0, 6).map((u) => (
                <div key={u.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group" onClick={() => u.isOrganizer ? navigate(`/organizer/${u.id}`) : navigate("/connections")}>
                  <img referrerPolicy="no-referrer" src={u.photoUrl || `https://i.pravatar.cc/80?u=${u.id}`} alt={u.name}
                    className={`w-10 h-10 rounded-full object-cover border-2 transition-colors ${a.isDark ? "border-gray-700 group-hover:border-gray-500" : "border-gray-200 group-hover:border-gray-300"}`} />
                  <span className={`text-[10px] font-bold truncate max-w-[60px] ${a.isDark ? "text-gray-300" : "text-gray-700"}`}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ═══ Quick Links ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Settings, label: t("Ρυθμίσεις", "Settings"), to: "/settings" },
          { icon: ShieldCheck, label: t("Επαλήθευση", "Verification"), to: "/verification" },
          { icon: Bookmark, label: t("Αποθηκευμένα", "Saved Events"), to: "/saved" },
          { icon: MessageSquare, label: t("Συνομιλίες", "Chats"), to: "/chats" },
        ].map((link) => (
          <Card key={link.to} className="p-3 cursor-pointer group" onClick={() => navigate(link.to)}>
            <div className="flex items-center gap-2">
              <link.icon className={`w-4 h-4 ${a.accent}`} />
              <span className={`text-xs font-bold ${heading}`}>{link.label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Sign Out */}
      <div className="flex justify-center">
        <Button onClick={() => { logout(); navigate("/login"); }} variant="ghost" className="text-gray-400 hover:text-red-500 font-bold capitalize tracking-wide text-[11px]">
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> {t("Αποσύνδεση", "Sign Out")}
        </Button>
      </div>
    </div>
  );
}
