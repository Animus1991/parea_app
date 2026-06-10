import React, { useState } from "react";
import {
  Camera,
  MapPin,
  Clock,
  Calendar,
  Users,
  Target,
  Lock,
  Globe,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { useLanguage } from "../../lib/i18n";
import { MapPinPicker } from "../common/MapPinPicker";
import { cn } from "../../lib/utils";
import { usePageContrast } from "../../hooks/usePageContrast";
import { useProfileContrast } from "../../hooks/usePageContrast";

export default function CreateEventFlowPageContent() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const { t } = useLanguage();
  const navigate = useNavigate();
  const createEvent = useStore((state) => state.createEvent);
  const currentUser = useStore((state) => state.currentUser);
  const p = usePageContrast();
  const pc = useProfileContrast();

  const inputClass = cn(
    "w-full border rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:border-transparent outline-none transition-all",
    p.inputBg,
    p.ring,
  );
  const labelClass = cn(
    "block text-sm font-semibold capitalize tracking-tight mb-2",
    p.head,
  );
  const progressFill = p.iconAccent.replace("text-", "bg-");
  const visSelected = cn("border-2 shadow-soft ring-1", pc.accentBorder, pc.accentBg);
  const visIdle = cn(
    "border rounded-2xl p-4 cursor-pointer transition-all duration-200",
    p.isDark ? "border-white/10 hover:border-white/20" : "border-gray-100 hover:border-gray-200",
  );

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [maxAttendees, setMaxAttendees] = useState(4);
  const [duration, setDuration] = useState("2h");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    const newEvent = {
      title: title || "New Experience",
      category: category || "Social",
      description: description || "A new gathering created from the app.",
      date: date || new Date().toISOString().split("T")[0],
      time: time || "18:00",
      duration: duration || "2h",
      locationArea: location || "Athens",
      exactLocation: location || "Athens (TBD)",
      lat: coordinates.lat || 37.9838,
      lng: coordinates.lng || 23.7275,
      isPaid: false,
      price: 0,
      organizerId: currentUser.id,
      timeZone: "EET (Athens)",
      safetyLevel: "low" as const,
      minTrustTierAccess: (visibility === "private" ? "2_confirmed" : "1_explorer") as import("../../types").TrustTier,
      maxParticipants: maxAttendees,
      tags: ["social"],
      imageUrl: imagePreview || `https://picsum.photos/seed/${Date.now()}/800/600`,
    };

    createEvent(newEvent);
    // Redirect to home page
    navigate("/");
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-full mx-auto pb-24 md:pb-8"
    >
      <div className="mb-8">
        <h1 className={cn("text-[16px] md:text-[18px] font-bold", p.head)}>
          {t("Δημιουργία Εμπειρίας", "Create Experience")}
        </h1>
        <p className={cn("text-sm mt-1", p.muted)}>
          {t(
            "Σχεδιάστε την τέλεια συνάντησή σας.",
            "Design your perfect real-world gathering.",
          )}
        </p>

        <div className="flex items-center gap-2 mt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i < step ? progressFill : p.progressBg)}
              initial={false}
            />
          ))}
        </div>
      </div>

      <Card className="p-6 md:p-8 overflow-hidden relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <h2 className={cn("text-lg font-bold", p.head)}>
                {t("Τα Βασικά", "The Basics")}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    {t("Εικόνα Εκδήλωσης", "Event Image")}
                  </label>
                  <div 
                    className={cn(
                      "w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative overflow-hidden",
                      p.uploadArea,
                      p.cardHover,
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                       <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt={t('Προεπισκόπηση εκδήλωσης', 'Event preview')} />
                    ) : (
                       <>
                         <Camera className={cn("w-8 h-8 mb-2", p.muted)} />
                         <span className={cn("text-sm font-bold block", p.head)}>{t('Ανέβασμα Εικόνας', 'Upload Image')}</span>
                         <span className={cn("text-[11px] mt-1 capitalize tracking-tight", p.muted)}>{t('JPG, PNG έως 5MB', 'JPG, PNG up to 5MB')}</span>
                       </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png" onChange={handleImageUpload} />
                  {imagePreview && (
                     <button onClick={() => setImagePreview(null)} className="text-[11px] text-red-500 font-bold capitalize tracking-tight mt-2 hover:underline">
                        {t('Αφαίρεση Εικόνας', 'Remove Image')}
                     </button>
                  )}
                </div>

                <div>
                  <label className={labelClass}>
                    {t("Τίτλος Εκδήλωσης", "Event Title")}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t(
                      "π.χ Κοινωνικός Καφές Κυριακής",
                      "e.g. Sunday Morning Hike & Coffee",
                    )}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    {t("Κατηγορία", "Category")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn(inputClass, "bg-transparent")}
                  >
                    <option value="">
                      {t("Επιλέξτε κατηγορία...", "Select a category...")}
                    </option>
                    <option value="Hiking & Outdoors">
                      {t("Πεζοπορία & Εξόρμηση", "Hiking & Outdoors")}
                    </option>
                    <option value="Board Games">
                      {t("Επιτραπέζια", "Board Games")}
                    </option>
                    <option value="Stand-up Comedy">
                      {t("Stand-up κωμωδία", "Stand-up Comedy")}
                    </option>
                    <option value="Theatre">{t("Θέατρο", "Theatre")}</option>
                    <option value="Live Music">
                      {t("Ζωντανή Μουσική", "Live Music")}
                    </option>
                    <option value="Social">
                      {t("Κοινωνικό / Social", "Social")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    {t("Περιγραφή", "Description")}
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t(
                      "Τι πρόκειται να κάνουμε; Τι πρέπει να περιμένουν οι συμμετέχοντες;",
                      "What are we going to do? What should people expect?",
                    )}
                    className={cn(inputClass, "resize-none")}
                  ></textarea>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!title || !category}
              >
                {t("Επόμενο: Πότε & Πού", "Next: When & Where")}
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <h2 className={cn("text-lg font-bold", p.head)}>
                {t("Πότε & Πού", "When & Where")}
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn(labelClass, "flex items-center gap-1.5")}>
                      <Calendar className="w-3.5 h-3.5" />{" "}
                      {t("Ημερομηνία", "Date")}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={cn(labelClass, "flex items-center gap-1.5")}>
                      <Clock className="w-3.5 h-3.5" /> {t("Ώρα", "Time")}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={cn(labelClass, "flex items-center gap-1.5")}>
                    <Clock className="w-3.5 h-3.5" /> {t("Διάρκεια", "Duration")}
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className={cn(inputClass, "bg-transparent")}
                  >
                    <option value="1h">1 {t("ώρα", "hour")}</option>
                    <option value="2h">2 {t("ώρες", "hours")}</option>
                    <option value="3h">3 {t("ώρες", "hours")}</option>
                    <option value="4+h">4+ {t("ώρες", "hours")}</option>
                    <option value="custom">{t("Προσαρμοσμένη", "Custom")}</option>
                  </select>
                  {duration === "custom" && (
                     <input 
                       type="text" 
                       placeholder={t("Λεπτομέρειες (π.χ. Όλη μέρα)...", "Details (e.g. All day)...")}
                       className={cn(inputClass, "mt-2")}
                       onChange={(e) => setDuration(e.target.value)}
                     />
                  )}
                </div>

                <div>
                  <label className={cn(labelClass, "flex items-center gap-1.5")}>
                    <MapPin className="w-3.5 h-3.5" />{" "}
                    {t("Τοποθεσία", "Location")}
                  </label>
                  <div className="relative mb-2">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t(
                        "Αναζήτηση χώρου ή διεύθυνσης...",
                        "Search venue or address...",
                      )}
                      className={cn(inputClass, "pl-10")}
                    />
                    <MapPin className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", p.muted)} />
                  </div>
                  <div className="w-full">
                    <p className={cn("text-[10px] mb-2", p.muted)}>
                      {t(
                        "Επιλέξτε το ακριβές σημείο στον χάρτη:",
                        "Select exact location on map:",
                      )}
                    </p>
                    <MapPinPicker
                      location={coordinates}
                      onChange={setCoordinates}
                      height="200px"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  {t("Πίσω", "Back")}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-[2]"
                  disabled={!date || !time || !location}
                >
                  {t("Επόμενο: Δυναμική Ομάδας", "Next: Group Dynamics")}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <h2 className={cn("text-lg font-bold", p.head)}>
                {t("Δυναμική Ομάδας", "Group Dynamics")}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className={cn(labelClass, "mb-3")}>
                    {t("Ορατότητα", "Visibility")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={visibility === "public" ? visSelected : visIdle}
                      onClick={() => setVisibility("public")}
                    >
                      <Globe
                        className={cn("w-5 h-5 mb-2", visibility === "public" ? pc.accent : p.muted)}
                      />
                      <h4 className={cn("text-sm font-bold mb-1", p.head)}>
                        {t("Δημόσια", "Public")}
                      </h4>
                      <p className={cn("text-[10px]", p.muted)}>
                        {t(
                          "Όλοι μπορούν να βρουν και να ζητήσουν να συμμετάσχουν.",
                          "Anyone can find and request to join.",
                        )}
                      </p>
                    </div>
                    <div
                      className={visibility === "private" ? visSelected : visIdle}
                      onClick={() => setVisibility("private")}
                    >
                      <Lock
                        className={cn("w-5 h-5 mb-2", visibility === "private" ? pc.accent : p.muted)}
                      />
                      <h4 className={cn("text-sm font-bold mb-1", p.head)}>
                        {t("Ιδιωτική", "Private")}
                      </h4>
                      <p className={cn("text-[10px]", p.muted)}>
                        {t(
                          "Ορατή μόνο μέσω απευθείας συνδέσμου πρόσκλησης.",
                          "Only visible via direct invite link.",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={cn(labelClass, "flex items-center gap-1.5")}>
                    <Users className="w-3.5 h-3.5" />{" "}
                    {t("Όριο μεγέθους ομάδας", "Group Size limit")}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(Number(e.target.value))}
                      className={cn(inputClass, "w-20 px-3 text-center")}
                    />
                    <span className={cn("text-sm font-medium", p.muted)}>
                      {t("άτομα το μέγιστο", "people maximum")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  {t("Πίσω", "Back")}
                </Button>
                <Button onClick={() => setStep(4)} className="flex-[2]">
                  {t("Επόμενο: Αναθεώρηση", "Next: Review")}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div className="text-center">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3", pc.accentBg)}>
                  <CheckCircle className={cn("w-6 h-6", pc.accent)} />
                </div>
                <h2 className={cn("text-lg font-bold", p.head)}>
                  {t("Έτοιμο για Δημοσίευση!", "Ready to Publish!")}
                </h2>
                <p className={cn("text-sm mt-1", p.muted)}>
                  {t(
                    "Αναθεωρήστε τις λεπτομέρειες πριν τη δημοσίευση.",
                    "Review your event details before sharing.",
                  )}
                </p>
              </div>

              <div className={cn("rounded-2xl p-4 space-y-3 text-sm shadow-soft", p.infoBg)}>
                <div className={cn("flex justify-between pb-3 border-b", p.borderB)}>
                  <span className={cn("font-medium", p.muted)}>
                    {t("Τίτλος", "Title")}
                  </span>
                  <span className={cn("font-bold truncate max-w-[200px] text-right", p.head)}>
                    {title || t("Χωρίς Τίτλο", "Untitled")}
                  </span>
                </div>
                <div className={cn("flex justify-between pb-3 border-b", p.borderB)}>
                  <span className={cn("font-medium", p.muted)}>
                    {t("Ημερομηνία & Ώρα", "Date & Time")}
                  </span>
                  <span className={cn("font-bold", p.head)}>
                    {date} • {time}
                  </span>
                </div>
                <div className={cn("flex justify-between pb-3 border-b", p.borderB)}>
                  <span className={cn("font-medium", p.muted)}>
                    {t("Ορατότητα", "Visibility")}
                  </span>
                  <span className={cn("font-bold capitalize", p.head)}>
                    {visibility === "public"
                      ? t("Δημόσια", "Public")
                      : t("Ιδιωτική", "Private")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={cn("font-medium", p.muted)}>
                    {t("Χωρητικότητα", "Capacity")}
                  </span>
                  <span className={cn("font-bold", p.head)}>
                    {maxAttendees} {t("θέσεις", "spots")}
                  </span>
                </div>
              </div>

              <div className={cn("rounded-2xl p-3 flex gap-3 text-sm shadow-soft border", p.isDark ? "bg-amber-950/30 border-amber-800/40 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800")}>
                <Target className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs">
                  {t(
                    "Μόλις δημοσιευθεί, οι συμμετέχοντες μπορούν να ζητήσουν συμμετοχή. Μπορείτε να εγκρίνετε τα αιτήματα χειροκίνητα ή αυτόματα.",
                    "Once published, attendees can start joining. You can manually approve requests or set it to auto-approve.",
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="flex-1"
                >
                  {t("Πίσω", "Back")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-[2]"
                >
                  {t("Δημοσίευση Εμπειρίας", "Publish Experience")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
