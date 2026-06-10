import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';
import {
  buildPostOnboardingHomePath,
  markOnboardingWelcomeSession,
} from '../lib/onboardingHomeBridge';
import { motion, AnimatePresence } from 'motion/react';

const INTERESTS = [
  { id: 'Theatre', gr: 'Θέατρο', en: 'Theatre', emoji: '🎭' },
  { id: 'Cinema', gr: 'Σινεμά', en: 'Cinema', emoji: '🎬' },
  { id: 'Hiking', gr: 'Πεζοπορία', en: 'Hiking', emoji: '🥾' },
  { id: 'Concerts', gr: 'Συναυλίες', en: 'Concerts', emoji: '🎵' },
  { id: 'Board games', gr: 'Επιτραπέζια', en: 'Board Games', emoji: '🎲' },
  { id: 'Food & Drink', gr: 'Γαστρονομία', en: 'Food & Dining', emoji: '🍽️' },
  { id: 'Sports', gr: 'Αθλητισμός', en: 'Sports', emoji: '⚽' },
  { id: 'Exhibitions', gr: 'Εκθέσεις / Τέχνη', en: 'Art & Exhibitions', emoji: '🖼️' },
  { id: 'Tech Meetups', gr: 'Τεχνολογία', en: 'Tech Meetups', emoji: '💻' },
  { id: 'Nearby escapes', gr: 'Εκδρομές', en: 'Day Trips', emoji: '🚌' },
  { id: 'Wine Tasting', gr: 'Wine Tasting', en: 'Wine Tasting', emoji: '🍷' },
  { id: 'Escape Rooms', gr: 'Escape Rooms', en: 'Escape Rooms', emoji: '🔐' },
  { id: 'Wellness', gr: 'Ευεξία & Yoga', en: 'Wellness & Yoga', emoji: '🧘' },
  { id: 'Language exchange', gr: 'Ανταλλαγή Γλωσσών', en: 'Language Exchange', emoji: '🌐' },
  { id: 'Stand-up', gr: 'Stand-up Comedy', en: 'Stand-up Comedy', emoji: '🎤' },
  { id: 'Photography', gr: 'Φωτογραφία', en: 'Photography', emoji: '📷' },
];

const GROUP_SIZES = [
  { id: 'tiny', gr: '2–3 άτομα', en: '2–3 people', emoji: '👥' },
  { id: 'small', gr: '3–6 άτομα (συνιστάται)', en: '3–6 people (recommended)', emoji: '👨‍👩‍👦' },
  { id: 'medium', gr: '6–10 άτομα', en: '6–10 people', emoji: '👨‍👩‍👧‍👦' },
  { id: 'any', gr: 'Δεν με πειράζει', en: 'No preference', emoji: '🤝' },
];

const ACTIVITY_LEVELS = [
  { id: 'low', gr: 'Χαλαρό', en: 'Relaxed', emoji: '😌', dgr: 'Καφέ, ταινίες, βόλτες', den: 'Coffee, movies, strolls' },
  { id: 'medium', gr: 'Μέτριο', en: 'Moderate', emoji: '🚶', dgr: 'Πεζοπορία, αθλητισμός, εκδρομές', den: 'Hiking, sports, day trips' },
  { id: 'high', gr: 'Έντονο', en: 'Active', emoji: '🏃', dgr: 'Αγώνες, αναρρίχηση, extreme', den: 'Races, climbing, extreme' },
];

const SCHEDULES = [
  { id: 'weekends', gr: 'Σαββατοκύριακα', en: 'Weekends', emoji: '🌅' },
  { id: 'weekday_eve', gr: 'Βραδιές Εργάσιμων', en: 'Weekday Evenings', emoji: '🌆' },
  { id: 'flexible', gr: 'Ελεύθερο πρόγραμμα', en: 'Flexible schedule', emoji: '🔄' },
  { id: 'mornings', gr: 'Πρωινά', en: 'Morning hours', emoji: '☀️' },
];

const LOCATION_PREFS = [
  { id: 'local', gr: 'Κοντά μου (< 10χλμ)', en: 'Near me (< 10km)', emoji: '📍' },
  { id: 'city', gr: 'Παντού στην πόλη', en: 'Anywhere in the city', emoji: '🏙️' },
  { id: 'anywhere', gr: 'Οπουδήποτε', en: 'Anywhere', emoji: '🌍' },
];

const TOTAL_STEPS = 7;

export default function OnboardingClassic() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const updateUser = useStore((s) => s.updateUser);
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser?.interests ?? [],
  );
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>(['weekends']);
  const [selectedGroupSize, setSelectedGroupSize] = useState<string>('small');
  const [selectedActivity, setSelectedActivity] = useState<string>('medium');
  const [selectedLocation, setSelectedLocation] = useState<string>('city');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [name, setName] = useState(currentUser?.name ?? '');

  const goNext = () => { setDir(1); setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const goPrev = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  const toggleInterest = (id: string) =>
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleSchedule = (id: string) =>
    setSelectedSchedule((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleComplete = () => {
    if (currentUser) {
      updateUser(currentUser.id, {
        interests: selectedInterests,
        bio: bio || currentUser.bio,
        name: name || currentUser.name,
        discoveryPrefs: {
          groupSize: selectedGroupSize,
          activityLevel: selectedActivity,
          schedule: selectedSchedule,
          locationPref: selectedLocation,
        },
      });
    }
    completeOnboarding();
    markOnboardingWelcomeSession();
    navigate(
      buildPostOnboardingHomePath({
        interests: selectedInterests,
        locationPref: selectedLocation,
      }),
    );
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/');
  };

  const progressPct = Math.round((step / (TOTAL_STEPS - 1)) * 100);

  const stepTitles = [
    { gr: 'Καλώς ήρθες στο Nakamas!', en: 'Welcome to Nakamas!' },
    { gr: 'Τι σε ενδιαφέρει;', en: 'What are you into?' },
    { gr: 'Μέγεθος ομάδας', en: 'Group size preference' },
    { gr: 'Επίπεδο δραστηριότητας', en: 'Activity level' },
    { gr: 'Πρόγραμμα διαθεσιμότητας', en: 'Availability schedule' },
    { gr: 'Τοποθεσία', en: 'Location preference' },
    { gr: 'Σχεδόν έτοιμος/η!', en: 'Almost done!' },
  ];
  const stepSubs = [
    { gr: 'Ας στήσουμε το προφίλ σου γρήγορα για να βρεις τις ιδανικές παρέες.', en: "Let's set up your profile quickly to find your ideal group." },
    { gr: 'Επίλεξε τουλάχιστον 3 κατηγορίες που σε εκφράζουν.', en: 'Pick at least 3 categories that represent you.' },
    { gr: 'Με πόσα άτομα νιώθεις πιο άνετα;', en: 'How many people are you most comfortable with?' },
    { gr: 'Πόσο δυναμικές εκδηλώσεις ψάχνεις;', en: 'How active do you want your events to be?' },
    { gr: 'Πότε συνήθως είσαι διαθέσιμος/η;', en: 'When are you usually available?' },
    { gr: 'Πόσο μακριά είσαι διατεθειμένος/η να πας;', en: 'How far are you willing to travel?' },
    { gr: 'Πρόσθεσε ένα σύντομο bio και το όνομά σου.', en: 'Add a short bio and confirm your name.' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t('Βήμα', 'Step')} {step + 1} / {TOTAL_STEPS}
            </span>
            <span className="text-xs font-bold text-[#0E8B8D]">{progressPct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#18D8DB] to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-[#18D8DB]' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100 space-y-5"
          >
            <div>
              <h2 className="text-xl font-black text-[#111827] leading-tight">
                {t(stepTitles[step].gr, stepTitles[step].en)}
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {t(stepSubs[step].gr, stepSubs[step].en)}
              </p>
            </div>

            {/* Step 0 — Welcome */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-6 gap-3">
                  <span className="text-6xl">👋</span>
                  <p className="text-base text-gray-600 font-medium text-center max-w-xs leading-relaxed">
                    {t(
                      'Το Nakamas συνδέει ανθρώπους για μικρές ομαδικές εμπειρίες βασισμένες σε κοινά ενδιαφέροντα.',
                      'Nakamas connects people for small group experiences based on shared interests.',
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Step 1 — Interests */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-2">
                {INTERESTS.map((item) => {
                  const sel = selectedInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleInterest(item.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 text-left ${
                        sel
                          ? 'bg-[#111827] text-white border-[#111827]'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-[#111827]'
                      }`}
                    >
                      <span className="text-lg leading-none shrink-0">{item.emoji}</span>
                      <span className="truncate">{t(item.gr, item.en)}</span>
                      {sel && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0 text-[#18D8DB]" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2 — Group size */}
            {step === 2 && (
              <div className="space-y-2">
                {GROUP_SIZES.map((gs) => (
                  <button
                    key={gs.id}
                    onClick={() => setSelectedGroupSize(gs.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
                      selectedGroupSize === gs.id
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-[#111827]'
                    }`}
                  >
                    <span className="text-2xl leading-none">{gs.emoji}</span>
                    <span className="font-semibold text-base">{t(gs.gr, gs.en)}</span>
                    {selectedGroupSize === gs.id && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-[#18D8DB]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 — Activity level */}
            {step === 3 && (
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((al) => (
                  <button
                    key={al.id}
                    onClick={() => setSelectedActivity(al.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
                      selectedActivity === al.id
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-[#111827]'
                    }`}
                  >
                    <span className="text-2xl leading-none mt-0.5">{al.emoji}</span>
                    <div className="text-left">
                      <p className="font-bold text-base">{t(al.gr, al.en)}</p>
                      <p
                        className={`text-sm font-medium mt-0.5 ${
                          selectedActivity === al.id ? 'text-gray-300' : 'text-gray-400'
                        }`}
                      >
                        {t(al.dgr, al.den)}
                      </p>
                    </div>
                    {selectedActivity === al.id && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-[#18D8DB] shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 4 — Schedule */}
            {step === 4 && (
              <div className="grid grid-cols-2 gap-2">
                {SCHEDULES.map((sc) => {
                  const sel = selectedSchedule.includes(sc.id);
                  return (
                    <button
                      key={sc.id}
                      onClick={() => toggleSchedule(sc.id)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-2xl border transition-all duration-200 ${
                        sel
                          ? 'bg-[#111827] text-white border-[#111827]'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-[#111827]'
                      }`}
                    >
                      <span className="text-xl leading-none">{sc.emoji}</span>
                      <span className="font-semibold text-sm text-left leading-snug">
                        {t(sc.gr, sc.en)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 5 — Location */}
            {step === 5 && (
              <div className="space-y-2">
                {LOCATION_PREFS.map((lp) => (
                  <button
                    key={lp.id}
                    onClick={() => setSelectedLocation(lp.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200 ${
                      selectedLocation === lp.id
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-[#111827]'
                    }`}
                  >
                    <span className="text-2xl leading-none">{lp.emoji}</span>
                    <span className="font-semibold text-base">{t(lp.gr, lp.en)}</span>
                    {selectedLocation === lp.id && (
                      <CheckCircle2 className="w-4 h-4 ml-auto text-[#18D8DB]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 6 — Bio & name */}
            {step === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    {t('Όνομα', 'Name')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('Το όνομά σου...', 'Your name...')}
                    className="w-full h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-base font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#18D8DB]/50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    {t('Σύντομο Bio', 'Short Bio')}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t(
                      'Πες μας λίγα πράγματα για σένα...',
                      'Tell us a bit about yourself...',
                    )}
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-base font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#18D8DB]/50 focus:bg-white transition-all resize-none"
                  />
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {bio.length}/160 {t('χαρακτήρες', 'characters')}
                  </p>
                </div>
                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t('Σύνοψη επιλογών', 'Your selections')}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    🎯 {selectedInterests.length} {t('ενδιαφέροντα', 'interests')}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    👥 {t(GROUP_SIZES.find((g) => g.id === selectedGroupSize)?.gr ?? '', GROUP_SIZES.find((g) => g.id === selectedGroupSize)?.en ?? '')}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    📅 {selectedSchedule.length} {t('διαθεσιμότητες', 'schedule slots')}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    📍 {t(LOCATION_PREFS.find((l) => l.id === selectedLocation)?.gr ?? '', LOCATION_PREFS.find((l) => l.id === selectedLocation)?.en ?? '')}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={step === 0 ? handleSkip : goPrev}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-500 hover:text-[#111827] hover:border-gray-300 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? t('Παράλειψη', 'Skip') : t('Πίσω', 'Back')}
          </button>

          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={goNext}
              disabled={step === 1 && selectedInterests.length < 1}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#111827] text-white text-sm font-bold hover:bg-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('Επόμενο', 'Next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#18D8DB] to-cyan-400 text-white text-sm font-bold hover:opacity-90 transition-all duration-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('Ολοκλήρωση!', 'Complete!')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
