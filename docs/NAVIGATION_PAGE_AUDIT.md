# Επανέλεγχος σελίδα-σελίδα (πλοήγηση AppShell)

**Ημερομηνία:** 30/05/2026 · **Φάσεις merge:** 1–15 · **Πρότυπο:** Classic theme tokens

## Classic reference (εφαρμόζεται σε όλα τα θέματα μέσω hooks)

| Token | Τιμή |
|-------|------|
| Κάρτες | `rounded-2xl` + `shadow-soft` |
| Ετικέτες ενότητας | `text-[11px] font-bold tracking-wide` |
| Σώμα | `text-[13px]`, τίτλοι `#111827` |
| Primary CTA | `#0E8B8D` / `cyan-600`, `rounded-2xl` |
| i18n | `t('Ελ', 'En')` παντού |

## Αρχιτεκτονικοί τύποι

| Τύπος | Περιγραφή | Classic parity |
|-------|-----------|----------------|
| **A** | `*PageContent` + `usePageContrast` (1 body, 7 θέματα αυτόματα) | ⭐⭐⭐⭐–⭐⭐⭐⭐⭐ |
| **B** | 7–9 themed `*Classic.tsx` … wrappers (διπλότυπο UI) | ⭐⭐⭐–⭐⭐⭐⭐ |
| **C** | Shared sections + themed page shells (EventDetail) | ⭐⭐⭐⭐⭐ |
| **D** | Local-only πλήρες (GroupChat, Onboarding, Challenges) | ⭐⭐⭐⭐⭐ λειτουργικά |

---

## Εξερεύνηση & Ανακάλυψη

### Ανακάλυψη Εκδηλώσεων (`/`)

**Αρχιτεκτονική:** Τύπος B — 9× `Home*.tsx` (Classic, Vibrant, Neon, Bento, ActiveBuddies × light/dark).

**Ενσωματωμένα (Phases 1–14):**

| Block | Κατάσταση |
|-------|-----------|
| Stories + `useStoryEvents` | ✅ |
| `ActiveBuddiesRail` + online dot | ✅ |
| `HomeQuickActions`, hero modes, guest/logged hero | ✅ |
| `HomeFiltersSection` + URL (`cat`, `tag`, `price`, `date`, `safety`, `dist`, `sort`, **`mood`**) | ✅ |
| **`MoodSelector`** → φίλτρο κατηγοριών + scroll `#home-filters` | ✅ Φ13–14 |
| `HomeSearchDropdown`, personalization, discovery chips | ✅ |
| `useHomeEventFeed`, geo, For You scoring | ✅ |
| `EventCard` (feed) — CTAs `rounded-2xl` | ✅ Φ14 |
| Onboarding welcome banner + bridge | ✅ |

**Classic parity:** ⭐⭐⭐⭐½ — κοινά sections σε `rounded-2xl`· themed Home shells κρατούν accent χρώματα (σωστά) με μερικά fractional `text-[12.73px]` (Classic idiom).

**ZIP έλεγχος (Φ15):** Τοπικό Home είναι **υπερσύνολο** του ZIP `Home.tsx` (mood, URL filters, personalization, Active Buddies, onboarding banner). **Μην** αντικατασταθεί με ZIP.

**Βελτίωση (additive):**

- Ενοποίηση fractional typography σε `text-[11px]` / `text-[13px]` στα 6 non-Classic Home (μόνο μέγεθος, όχι χρώμα).
- `PlatformEventBanner` CTA → `rounded-2xl` (Φ15).

---

### Κατηγορίες (`/categories`)

**Αρχιτεκτονική:** Τύπος A — `CategoriesPageContent` + 7 thin wrappers.

**Ενσωματωμένα (Φ11):** group tabs, `?c=`, Weekend filter, Trending sort, `categoriesCatalog` (20), `usePageContrast`.

**Classic parity:** ⭐⭐⭐⭐⭐

**Βελτίωση:** Καμία υψηλής προτεραιότητας.

---

### Τοπικές Ομάδες (`/nearby`)

**Αρχιτεκτονική:** Τύπος A — `NearbyGroupsPageContent` + 7 thin wrappers (Φ15).

**Ενσωματωμένα (Φ15):** ZIP Leaflet map, filters (All/Available/Full/My Events), satellite layer, resizable sidebar, `filteredLocalGroups` στη λίστα, `usePageContrast`, `rounded-2xl` / `shadow-soft`.

**Classic parity:** ⭐⭐⭐⭐⭐

**Σημείωση:** Το παλιό `NearbyGroupsClassic` είχε Google-mock fallback χωρίς API key· η νέα έκδοση είναι Leaflet-only (ZIP parity).

---

### Event Detail (`/events/:id`) — κεντρική για ανακάλυψη

**Αρχιτεκτονική:** Τύπος C — 7 shells + 10+ shared sections.

**Ενσωματωμένα (Phases 3–11):** Meta, Map, About, Organizer, **Safety**, **Adventure**, Reliability, ActionBar (share/QR/ICS/save), GroupCard, groups sidebar `rounded-2xl`, `eventDetailDesignTokens`, `PlatformEventBanner`, smart back.

**Classic parity:** ⭐⭐⭐⭐⭐ (καλύτερη σελίδα merge).

**Βελτίωση:** `PlatformEventBanner` κουμπί → `rounded-2xl`· capacity chip `rounded-lg` (προαιρετικό).

---

## Η Εμπειρία μου

### Το Ημερολόγιό μου (`/agenda`, `/calendar` → redirect)

**Αρχιτεκτονική:** Τύπος A — `MyCalendarPageContent` + calendar wrappers.

**Ενσωματωμένα (1, 4, 5, 13):** day stories, `StoryViewer`, hourly modal, ICS export, geometric cells, `useUserCalendarEvents`.

**Classic parity:** ⭐⭐⭐⭐⭐ μετά Φ13 pass (`rounded-2xl`).

**ZIP έλεγχος (Φ15):** Ισοδύναμα features με ZIP `MyCalendarPageContent` (week/month, hourly modal, ICS, stories) — μικρότερο αρχείο λόγω refactor, όχι έλλειψη λειτουργίας.

**Βελτίωση:** Καμία κρίσιμη.

---

### Τα Σχέδιά μου (`/plans`)

**Αρχιτεκτονική:** Τύπος A — `PlansPageContent` + 7 thin wrappers (Φ15). **Όχι** ZIP `Plans.tsx` (subscription pricing).

**Ενσωματωμένα:** Waitlist, leave group, verify banner, `feedbackSubmitted`, σύνδεση `/history/feedback/:id`, `usePageContrast`.

**Classic parity:** ⭐⭐⭐⭐⭐

---

### Αποθηκευμένες (`/saved`)

**Αρχιτεκτονική:** Τύπος A — `SavedEventsPageContent`.

**Ενσωματωμένα:** `savedEvents` store, sort/filter, σύνδεση με EventDetail save rings (Phase 5).

**Classic parity:** ⭐⭐⭐⭐ — search/select `rounded-xl` (γραμμές 64, 70).

**Βελτίωση:** Inputs → `rounded-2xl shadow-soft`.

---

### Ιστορικό (`/history`)

**Αρχιτεκτονική:** Τύπος A — `HistoryPageContent`· feedback route ξεχωριστά.

**Ενσωματωμένα (Φ15):** Tabs reviewed/pending, stats από store groups + `feedbackSubmitted`, navigate to feedback, `rounded-2xl` inputs/thumbnails.

**Classic parity:** ⭐⭐⭐⭐⭐

---

### Post-Event Feedback (`/history/feedback/:eventId`)

**Αρχιτεκτονική:** Τύπος A — `PostEventFeedbackPageContent` + 7 wrappers (Φ12).

**Ενσωματωμένα:** ZIP parity UI, `submitFeedback`, reliability delta, event context από store.

**Classic parity:** ⭐⭐⭐⭐⭐

---

## Κοινότητα

### Οι Nakamas μου (`/connections`)

**Αρχιτεκτονική:** Τύπος A — `ConnectionsPageContent`.

**Ενσωματωμένα:** Requests, invite, remove, report, connection store.

**Classic parity:** ⭐⭐⭐⭐ — dropdown `rounded-lg` (μικρό drift).

---

### Ομαδικές Συνομιλίες (`/chats`, `/chat/:groupId`)

**Inbox:** Τύπος A — `InboxPageContent` + 7 thin wrappers (Φ15): store groups, active/past, `/chat/:groupId`, messages/notifications tabs.

**GroupChat:** Τύπος D — 7× **`GroupChatClassic`** πλήρες (~1600+ γρ.) + `LiveEventTracker`, SOS, location.

**Ενσωματωμένα:** Live location (και στο EventDetail Safety)· **ποτέ** ZIP stub.

**Classic parity:** Inbox ⭐⭐⭐⭐⭐ (Φ15) · GroupChat Classic ⭐⭐⭐⭐⭐ λειτουργικά, ⭐⭐⭐⭐ design.

**Βελτίωση:** GroupChat themed variants alignment pass (μην αγγίξετε λειτουργίες Classic).

---

### Κατάταξη (`/leaderboard`)

**Αρχιτεκτονική:** Router → **μόνο** `LeaderboardClassic` (σωστά — όχι ZIP stub).

**Ενσωματωμένα:** XP από reliability, feedback count, periods, `usePageContrast`.

**Classic parity:** ⭐⭐⭐⭐½

---

### Προκλήσεις (`/challenges`)

**Αρχιτεκτονική:** Router → **μόνο** `ChallengesClassic` (σωστά).

**Ενσωματωμένα:** Πλήρες local challenges, filters, progress από store.

**Classic parity:** ⭐⭐⭐⭐½

---

## Διοργάνωση

### Πίνακας Διοργανωτή (`/manage`)

**Αρχιτεκτονική:** Τύπος A — `OrganizerDashboardPageContent` (Φ12) + 7 wrappers.

**Ενσωματωμένα:** Stats, recharts traffic, fill rate, satisfaction, quick-create, 2 events (τοπικό Hike preserved).

**Classic parity:** ⭐⭐⭐⭐⭐

---

### Δημιουργία Εκδήλωσης (`/create`)

**Αρχιτεκτονική:** Τύπος B — 7× `CreateEventFlow*.tsx`.

**Ενσωματωμένα:** Πλήρες multi-step τοπικό.

**Classic parity:** ⭐⭐⭐ — `rounded-xl` drift (~5 ανά themed file).

**Βελτίωση:** `CreateEventFlowPageContent` (μεσαία προτεραιότητα).

---

### Πορτοφόλι & Κέρδη (`/wallet`)

**Αρχιτεκτονική:** Τύπος A — `WalletPageContent`.

**Classic parity:** ⭐⭐⭐⭐ — select `rounded-lg`.

---

## Εμπιστοσύνη & Ασφάλεια

### Επαλήθευση (`/verification`)

**Τύπος A** — `VerificationCenterPageContent` · ⭐⭐⭐⭐

### Κέντρο Εμπιστοσύνης (`/trust`)

**Τύπος A** — `TrustCenterPageContent` · ⭐⭐⭐⭐⭐ (καθαρό από xl drift)

**ZIP έλεγχος (Φ15):** ~πλήρης parity με ZIP· tier labels μέσω `tierLabelEl` / `tierLabelEn` (όχι raw `trustTier` string).

### Αναφορά (`/report`)

**Τύπος B** — 7× `ReportIssue*.tsx` · ⭐⭐⭐

---

## Λογαριασμός & Ρυθμίσεις

### Προφίλ (`/profile`)

**Τύπος A** — `ProfilePageContent` · reliability, tiers, privacy toggles.

**Classic parity:** ⭐⭐⭐⭐ — πολλά `rounded-lg` σε badges/editing.

**Βελτίωση:** Badges/inputs → `rounded-2xl` where card-like.

---

### Ειδοποιήσεις (`/notifications`)

**Τύπος A** — `NotificationsPageContent` · ⭐⭐⭐⭐

### Ρυθμίσεις (`/settings`)

**Τύπος A** — `SettingsPageContent` + **`HomeHeroModeSetting`** (Φ4) · ⭐⭐⭐⭐⭐

### Κέντρο Βοήθειας (`/help`)

**Τύπος A** — `HelpCenterPageContent` · ⭐⭐⭐⭐ — topics `rounded-xl`, CTA `rounded-lg`.

---

## Διαχείριση & Έλεγχος

### Οδηγός Εισαγωγής (`/onboarding`)

**Τύπος D** — `OnboardingClassic` 7 βήματα + `onboardingHomeBridge` (Φ6).

**Classic parity:** ⭐⭐⭐⭐⭐ λειτουργικά · ⭐⭐⭐⭐ design (2× `rounded-xl`).

**Ποτέ** αντικατάσταση με ZIP.

---

### Admin (`/admin`)

**Τύπος B** — 7× AdminDashboard · τοπικό πλήρες.

**Βελτίωση:** Shared content (χαμηλή προτεραιότητα).

---

### Achievements (`/achievements`)

**Τύπος A** — `AchievementsPageContent` · ⭐⭐⭐⭐

---

## Σελίδες εκτός μενού (συνδεδεμένες)

| Route | Σημειώσεις |
|-------|-----------|
| `/login` | 7 themes + `LoginGuestHeroStrip` (Φ4) · ⭐⭐⭐⭐ |
| `/organizer/:id` | 7× OrganizerProfile · ⭐⭐⭐ |
| `/events/:id/join` | `JoinGroupFlow` · ⭐⭐⭐⭐ |
| `*` NotFound | 7 themes · ⭐⭐⭐ |

---

## Μην συγχωνεύσετε ποτέ (ρήτα)

- ZIP stubs: Challenges, Leaderboard, HomeActiveBuddies, OrganizerProfile maintenance
- Ενιαίο ZIP `App.tsx` / `Home.tsx`
- Αφαίρεση GroupChatClassic / OnboardingClassic / 9× Home

---

## Προτεραιότητα Phase 16+ (μόνο additive)

| Προτεραιότητα | Εργασία | Αρχεία |
|---------------|---------|--------|
| **Μέτρια** | `CreateEventFlowPageContent` | 7 create flows |
| **Χαμηλή** | Inputs pass `rounded-2xl` | Saved, Help, Profile, Wallet |
| **Χαμηλή** | `ReportIssuePageContent` | 7 themes |
| **Χαμηλή** | Fractional typography στα 6 non-Classic Home | `HomeVibrant*.tsx` κ.λπ. |

**Ολοκληρώθηκε Φ15:** NearbyGroups, History/store, Plans, Inbox, Trust tier i18n, PlatformEventBanner CTA.

---

## Συνολική αξιολόγηση merge

| Κατηγορία | Βαθμός |
|-----------|--------|
| Λειτουργική πληρότητα (τοπική) | **98%** — τίποτα αφαιρέθηκε |
| ZIP parity (shared content) | **~75%** — Home, EventDetail, Calendar, Categories, Feedback, Organizer = άριστα |
| Classic design parity (όλα τα θέματα) | **~82%** — PageContent pages καλά· 7× duplicate pages υστερούν |
| Cross-feature cohesion | **90%** — stories, save, feedback, deep links, mood URL |

*Το παρόν έγγραφο συμπληρώνει `LOCAL_DESIGN_AUDIT.md` και `MERGE_INTEGRATION.md`.*
