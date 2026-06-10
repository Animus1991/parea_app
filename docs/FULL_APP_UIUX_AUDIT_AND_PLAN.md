# Parea — Εξονυχιστικός Έλεγχος & Πλάνο Βελτιστοποίησης UI/UX (Πλήρης Εφαρμογή)

**Ημερομηνία:** 10/06/2026 · **Μεθοδολογία:** Στατική ανάλυση όλου του πηγαίου κώδικα (pages, components, hooks, stores, libs, data, types), σελίδα-σελίδα, component-component, κουμπί-κουμπί, modal-modal, λειτουργία-λειτουργία.
**Αρχή:** **Καμία αφαίρεση υπάρχουσας λειτουργίας** — όλες οι προτάσεις είναι αυστηρά προσθετικές (additive) ή διορθωτικές.
**Συμπληρώνει:** `LOCAL_DESIGN_AUDIT.md`, `NAVIGATION_PAGE_AUDIT.md`, `MERGE_INTEGRATION.md` (εκείνα καλύπτουν design parity· το παρόν καλύπτει **λειτουργική πληρότητα, αυτοεπεξηγησιμότητα UI/UX, persistence, i18n, a11y**).

---

## ΜΕΡΟΣ Α — Κρίσιμα Συστημικά Ευρήματα (cross-cutting)

Αυτά επηρεάζουν πολλές σελίδες ταυτόχρονα και έχουν την υψηλότερη προτεραιότητα.

### Α1. Persistence: το `partialize` του zustand store «χάνει» κρίσιμα δεδομένα

> **Κατάσταση υλοποίησης (Φ16.1): ✅ Διορθώθηκε** — βλ. ΜΕΡΟΣ Ζ.

`src/store/index.ts:1008-1023` — Διατηρούνται μετά από refresh: `savedEvents, theme, homeHeroMode, waitlistedEvents, feedbackSubmitted, onboardingCompleted, recentSearches, commitmentHolds, companyRequests, companyRequestPreferences, companyJoinRequests, savedCompanyRequestIds, dismissedCompanyRequestIds, plansFormingSidebarOpen`.

**ΔΕΝ διατηρούνται** (χάνονται με refresh): `events`, `groups`, `users`, `currentUser`, `notifications`, `connectionRequests`, `groupMergeSuggestions`, `companyRequestReports`.

Συνέπειες που βλέπει ο χρήστης (η UI υπονοεί αποθήκευση που δεν υπάρχει):

| Ενέργεια χρήστη | Τι συμβαίνει μετά από refresh |
|---|---|
| Δημιουργία εκδήλωσης (`/create`) | Η εκδήλωση εξαφανίζεται από το feed |
| Επεξεργασία προφίλ (όνομα, bio, avatar, interests) | Όλα χάνονται |
| Απαντήσεις Onboarding (`discoveryPrefs`) | Χάνονται (ενώ το `onboardingCompleted` μένει — ασυνέπεια) |
| Αποδοχή αιτήματος «Plans forming» → δημιουργία ομάδας | Η ομάδα/συνομιλία εξαφανίζεται, το request μένει `matched` και δείχνει στο κενό |
| Αποχώρηση από ομάδα (Plans) | Επανέρχεται η συμμετοχή |
| Ειδοποιήσεις | Μηδενίζονται |

**Πλάνο (Φ16.1):** Προσθήκη `events`, `groups`, `notifications`, `connectionRequests`, `groupMergeSuggestions` + `currentUserId` (όχι ολόκληρο `currentUser` αντικείμενο) στο `partialize`, με custom `merge` που επανυδατώνει τα mock seeds για ids που λείπουν (ώστε νέα mock data σε μελλοντικές εκδόσεις να μη χάνονται).

### Α2. Τρία ασύνδετα συστήματα chat

| Σύστημα | Είσοδος | Πηγή δεδομένων | Persistence |
|---|---|---|---|
| A. Popup chat | `PopupChatRoot` (global στο `AppShell.tsx:452`) | `chatStore` (`conv_*` ids) | μόνο `privacy` + `dismissedEphemeralBanners` |
| B. Inbox (`/chats`) | `InboxPageContent` | κύριο store `groups` | καμία |
| C. Group chat (`/chat/:groupId`) | 7× `GroupChat*` (~1700 γρ. το καθένα) | τοπικά 1000 mock μηνύματα | καμία |

Μήνυμα σταλμένο στο popup **δεν** εμφανίζεται ποτέ στη σελίδα chat και αντίστροφα. Τα reports του C (toast μόνο) δεν φτάνουν ποτέ στο `ChatModerationPanel` (που διαβάζει μόνο A).

**Πλάνο (Φ17):** Ενιαίο data layer στο `chatStore` (persisted `messages`), gateway από B/C προς αυτό, ενιαίο pipeline αναφορών. Καμία UI επιφάνεια δεν αφαιρείται.

### Α3. Bug απόδοσης Ειδοποιήσεων (κενά μηνύματα)

`NotificationsPageContent.tsx:156-157, 203-204` διαβάζει `notif.message` / `notif.time`, αλλά τα seeded notifications έχουν `messageEn/messageGr/timeEn/timeGr` (`mockNotifications.ts:7-10`). → **Οι 4 αρχικές ειδοποιήσεις εμφανίζονται με κενό κείμενο και κενή ώρα.** Επιπλέον το `type:'buddy_seek'` (store `index.ts:676`) δεν υπάρχει στο `iconMap`/tabs (`:12-18,42-44`) → πέφτει σε default εικονίδιο και χάνεται από τα φίλτρα.

**Πλάνο (Φ16.2):** Δίγλωσση ανάγνωση `t(notif.messageGr, notif.messageEn)` με fallback στο legacy `message`, κανονικοποίηση όλων των callers του `addNotification`, προσθήκη `buddy_seek` σε icons/tabs.

### Α4. Πιθανό crash για guest στο EventDetail

`EventDetailClassic.tsx:173` — `currentUser.interests.filter(...)` **χωρίς null guard**· guest που ανοίγει εκδήλωση με tags → crash. (Τα `EventCard`/`EventDetailPageContent` το χειρίζονται σωστά ως optional.)

**Πλάνο (Φ16.3):** `currentUser?.interests ?? []` (και έλεγχος στα 6 themed αντίγραφα).

### Α5. Ασυνέπεια ορολογίας εμπιστοσύνης (jargon χωρίς εξήγηση)

- VerificationCenter: «Trust Score 72% → 87%» (hardcoded).
- TrustCenter: «Reliability Score» = `currentUser.reliabilityScore` (95).
- Profile: «Reliability» + «Tier».
- Ονόματα βαθμίδων UI («Newcomer/Trusted/Super Trusted», `TrustCenterPageContent:121`) ≠ κώδικα («Explorer/Confirmed/High Trust», `lib/trust.ts:40-60`).
- Τρία ανεξάρτητα μοντέλα XP/badges: `AchievementsPageContent` (inline), `LeaderboardClassic.computeXP`, `ChallengesClassic`.

**Πλάνο (Φ19):** Ενιαίος όρος «Reliability Score» δεμένος στο store παντού, ενιαία ονόματα βαθμίδων, tooltip/inline ορισμός ενός line («Τι είναι αυτό;») σε κάθε εμφάνιση, ενιαίο gamification slice.

### Α6. Επταπλά αντίγραφα σελίδων (συντελεστής κόστους ×7)

Πραγματικά duplicated (κάθε fix ×7): `GroupChat*` (7×~1700 γρ.), `AdminDashboard*`, `OrganizerProfile*`, `Home*` (9), `EventDetail*`, `CreateEventFlow*` (ήδη wrappers — OK), `ReportIssue*` (wrappers — OK).

**Πλάνο (Φ21):** Σταδιακή εξαγωγή `GroupChatPageContent`, `AdminDashboardPageContent`, `OrganizerProfilePageContent` (όπως έγινε με Inbox/Plans/NearbyGroups στη Φ15) — μηδενική αλλαγή λειτουργικότητας, μόνο αποφυγή drift.

---

## ΜΕΡΟΣ Β — Έλεγχος Σελίδα-Σελίδα

Συμβολισμός: ✅ λειτουργεί & αυτοεπεξηγείται · ⚠️ λειτουργεί αλλά ασαφές/ασυνεπές · ❌ νεκρό/placeholder · 🔄 χάνεται με refresh.

### B1. Ανακάλυψη (`/`) — Home (9 παραλλαγές)

| Στοιχείο | Θέση | Κατάσταση |
|---|---|---|
| Tabs «Για Σένα / Ανακάλυψε» | `HomeClassic.tsx:271-282` | ✅ |
| Κουμπί grid-view | `HomeClassic.tsx:286-288` | ❌ **χωρίς onClick** — παραπλανητικό affordance |
| Κουμπί χάρτη → `/nearby` | `:289-296` | ✅ |
| Φίλτρα URL (`cat,tag,price,date,safety,dist,sort,mood`) | `useHomeUrlFilters` | ✅ persisted σε URL |
| `feedType`, `seekingHostOnly` | local state | 🔄 |
| Skeletons + EmptyState με «Καθαρισμός φίλτρων» | `:124-128,305-320` | ✅ |
| `HomeDailyTip` | `Math.random` στο mount | ⚠️ αλλάζει σε κάθε remount |

**Ενέργειες:** (1) Λειτουργικό toggle grid/list στο νεκρό κουμπί ή αφαίρεση affordance κουμπιού (διατήρηση εικονιδίου ως ένδειξης). (2) Σταθεροποίηση daily tip ανά ημέρα (seed από ημερομηνία).

### B2. Κατηγορίες (`/categories`) — `CategoriesPageContent`

| Στοιχείο | Κατάσταση |
|---|---|
| Search, tabs, trending, grid, 3 selects, 2 empty-state resets | ✅ πλήρως wired |
| `?c=` deep link | ✅ |
| `priceFilter/dateFilter/sortBy/activeTab/searchQuery` | 🔄 μόνο local — δεν μοιράζονται με URL |

**Ενέργειες:** URL-sync όλων των φίλτρων (όπως στο Home) ώστε share/refresh να διατηρεί την προβολή. Διευκρίνιση placeholder αναζήτησης («Αναζήτηση κατηγοριών» — όχι εκδηλώσεων).

### B3. Τοπικές Ομάδες (`/nearby`) — `NearbyGroupsPageContent`

**Η σελίδα με τα περισσότερα νεκρά στοιχεία:**

| Στοιχείο | Θέση | Κατάσταση |
|---|---|---|
| Search input | `:241-245` | ❌ χωρίς value/onChange — διακοσμητικό |
| Κουμπί «Φίλτρα» (SlidersHorizontal) | `:249-251` | ❌ χωρίς onClick |
| Sidebar chips «Όλα/Σήμερα/Φίλοι» | `:318-320` | ❌ χωρίς onClick |
| Slider ακτίνας | `:314` | ⚠️ ενημερώνει μόνο το label, **δεν φιλτράρει** |
| Αποστάσεις καρτών | `:347` | ❌ ψεύτικες: `1.2 + idx * 0.8` km από index λίστας |
| Chips All/Available/Full/My Events, locate-me, fullscreen, layers, markers | `:226-283` | ✅ |
| «Map Error» fallback | `:169-170` | ⚠️ **εκτός `t()`** |

**Ενέργειες (Φ16.4):** Σύνδεση search με φίλτρο τίτλου· κουμπί «Φίλτρα» ανοίγει τα υπάρχοντα chips· sidebar chips → `mapFilter`· πραγματική απόσταση haversine από το ήδη διαθέσιμο `userLocation` + εφαρμογή φίλτρου ακτίνας· μετάφραση error fallback.

### B4. Λεπτομέρεια Εκδήλωσης (`/events/:id`) — 7 shells + shared sections

| Στοιχείο | Θέση | Κατάσταση |
|---|---|---|
| `currentUser.interests` χωρίς guard | `EventDetailClassic.tsx:173` | ❌ **πιθανό crash guest** |
| «Join Waitlist» | `:266` | ❌ `alert()` αντί toast, χωρίς πραγματική εγγραφή στο store |
| Link/«View Profile» διοργανωτή → `/profile` (δικό σου!) | `EventDetailOrganizerSection.tsx:203,237` | ❌ λάθος στόχος — πρέπει `/organizer/:id` (parity με `EventCard`) |
| ActionBar Save/QR/Share/GoogleCal/ICS | `EventDetailActionBar.tsx` | ✅ με σωστά disabled-reasons |
| Safety: share live location + toasts | `EventDetailSafetySection` | ✅ (το `isSharingLocation` 🔄) |
| Host rating, QuickInfo | `EventDetailPageContent` | ✅ (TODO backend στο `:221`) |
| Skeleton, not-found, empty groups | — | ✅ |

**Ενέργειες (Φ16.3/16.5):** Guard, διόρθωση organizer links, waitlist → `joinWaitlist` store action + toast (το `waitlistedEvents` ήδη persisted!).

### B5. JoinGroupFlow (`/events/:id/join`)

- 3-step wizard με trust/commitment gates ✅.
- ⚠️ «Join Existing» (`JoinGroupFlow.tsx:112-119`): **χωρίς επιλογέα ομάδας** — μπαίνει σιωπηλά στο `availableGroups[0]` (`:73-76`).
- ⚠️ Το deep-link `?group=` που στέλνουν 4 σημεία του BuddySeek (`PlansFormingCard.tsx:424`, `LookingForCompanyPanel.tsx:271,309`, `PlansFormingScarcityPromo.tsx:58`) πρέπει να επιβεβαιωθεί ότι διαβάζεται (διαφορετικά ο χρήστης δεν μπαίνει στην ομάδα που πάτησε).

**Ενέργειες (Φ16.6):** Λίστα επιλογής ομάδας στο βήμα «Join Existing» (με την τρέχουσα αυτόματη επιλογή ως προεπιλεγμένη), ανάγνωση/προσυμπλήρωση `?group=`.

### B6. Login (`/login`)

- Demo λογαριασμοί ✅ (σήμανση «Demo» καθαρή).
- ⚠️ «Continue with Google» (`LoginClassic.tsx:67-73`) → κάνει login με `users[0]` — να σημανθεί «(Demo)» μέχρι να υπάρξει OAuth.
- ⚠️ «Όροι/Απόρρητο» (`:78`) απλό κείμενο, όχι links.

### B7. Το Ημερολόγιό μου (`/agenda`)

| Στοιχείο | Θέση | Κατάσταση |
|---|---|---|
| Export ICS, Week/Month, Prev/Today/Next | `PlannedEventsCalendar.tsx:112-206` | ✅ |
| Μονό κλικ = stories modal, **διπλό κλικ = ωριαίο πρόγραμμα** | `:64-70`, `useCalendarDayInteraction.ts:13-27` | ⚠️ **μη ανακαλύψιμο gesture** — κανένα hint· αδύνατο με πληκτρολόγιο |
| Empty state όταν 0 events | — | ❌ λείπει (κενό πλέγμα, κρυμμένο Export) |
| `DayEventsStoriesModal` (Esc/βέλη/scroll-lock/aria) | — | ✅ υποδειγματικό |
| `CalendarHourlySchedule` | — | ⚠️ legacy διπλότυπο του `DailyScheduleView`, αχρησιμοποίητο |

**Ενέργειες (Φ18.1):** Hint «Πάτημα: προεπισκόπηση · Διπλό: ωριαίο πρόγραμμα», ρητό εικονίδιο «Ημερήσιο πρόγραμμα» ανά ημέρα (και keyboard path), empty state με CTA «Εξερεύνησε εκδηλώσεις».

### B8. Τα Σχέδιά μου (`/plans`) — `PlansPageContent`

| Στοιχείο | Θέση | Κατάσταση |
|---|---|---|
| Stat cards που είναι κρυφά tabs | `:71-88` | ⚠️ δεν φαίνονται clickable· διπλασιάζουν το TabBar |
| «Group Chat» → `/chat/${event.id}` | `:185` | ❌ **λάθος id** — το route είναι `/chat/:groupId` |
| Avatars μελών + «4/5 μέλη» | `:172-182` | ❌ hardcoded ίδια για κάθε κάρτα |
| «Σημείο συνάντησης ενεργό» | `:163-169` | ❌ hardcoded παντού |
| «Waiting for 2 more people» | `:238` | ❌ hardcoded αριθμός |
| Leave modal (Cancel/Confirm+toast) | `:307-335` | ⚠️ χωρίς Esc/overlay-close/focus trap |
| Πληθυντικός `t(\`${n} εκδηλώσεις…\`)` | `:268` | ⚠️ «1 εκδηλώσεις» |
| Tabs/empty states/Verify banner/Rate Experience | — | ✅ |

**Ενέργειες (Φ16.7):** groupId στο chat link, πραγματικά μέλη/μετρητές από το store group, meeting-point flag από πραγματικό state, singular/plural, a11y modal.

### B9. BuddySeek / «Σχέδια που σχηματίζονται» (`/buddy-seek`)

| Στοιχείο | Θέση | Κατάσταση |
|---|---|---|
| «Νέο αίτημα από εκδήλωση» → `navigate('/')` | `BuddySeekPageContent.tsx:86-97` | ❌ **label ≠ συμπεριφορά** — υπόσχεται flow δημιουργίας, ανοίγει Home |
| Chips `open_spots`/`small_groups` χωρίς counts | `:138-164` | ⚠️ ασυνέπεια με τα υπόλοιπα 4 |
| Footer με αγγλικά στο ελληνικό branch | `:207-210` | ⚠️ i18n gap |
| `reportRequest` selector αχρησιμοποίητος | `:29` | ❌ dead code |
| Requests to review / cards / hide+undo / merge / accept→chat+toast | — | ✅ |
| **«Requests I sent» πουθενά** — το `insights.pendingJoinsSent` υπολογίζεται (`usePlansFormingFeed.ts:126`) αλλά δεν εμφανίζεται | — | ❌ ο αιτών δεν βλέπει ΠΟΥΘΕΝΑ το αίτημά του εκτός BuddySeek |
| `PlansFormingSkeleton` ορισμένο, ποτέ imported | — | ❌ dead — δεν υπάρχει loading state |
| Έννοια «Plans forming» χωρίς first-visit εξήγηση | — | ⚠️ jargon |
| Φίλτρα Open-spots/Verified στο `LookingForCompanyPanel` | `:73-79` | ❌ **λειτουργικά no-ops** (όλα τα branches `return true`) |
| «Manage» & «Edit» στο `YourPlanBanner` → ίδιο `onManage` | `PlansFormingShared.tsx:106-129` | ⚠️ «Edit» δεν ανοίγει wizard επεξεργασίας |

**Ενέργειες (Φ18.2):** Event-picker → `CreateCompanyRequestModal` στο CTA, ενότητα «Αιτήματα που έστειλα» (pending/accepted/declined), πραγματικά φίλτρα, counts σε όλα τα chips, skeleton wiring, dismissible explainer «Τι είναι τα Σχέδια που σχηματίζονται;», «Edit» → άνοιγμα wizard, deep-link του chip «Ρυθμίσεις απορρήτου» στη σχετική ενότητα.

### B10. Ιστορικό (`/history`) & Αποθηκευμένες (`/saved`)

- History: tabs/stats/search ✅· κάρτες clickable `<Card onClick>` **χωρίς role/tabIndex/keyboard** ⚠️· stats `peopleMet` βασίζονται σε μη-persisted `groups` 🔄.
- Saved: πλήρως ✅ (καλύτερα persisted περιοχή)· αφαίρεση bookmark **χωρίς toast** ⚠️ (`SavedEventsPageContent.tsx:113-119`)· ίδιο a11y θέμα καρτών.

### B11. Post-Event Feedback (`/history/feedback/:eventId`)

- Πληρέστατο ✅ (mood/stars/attendance/safety/σχόλιο 500 + counter, disabled-until-rated, thank-you, persisted).
- ⚠️ Κουμπιά αστεριών **χωρίς aria-label** (`:236-279`).
- ⚠️ «+25 XP» (`:163,534`) καθαρά διακοσμητικό — δεν απονέμεται XP πουθενά.

**Ενέργειες:** aria-labels, και στη Φ19 πραγματική πίστωση XP στο ενιαίο gamification slice ώστε το «+25 XP» να λέει αλήθεια.

### B12. Inbox (`/chats`) & GroupChat (`/chat/:groupId`)

Inbox (`InboxPageContent`):
- ❌ `unread/isPinned/isTyping` hardcoded στο `g.id === 'g1'` (`:48-50`) — ψεύτικα δεδομένα.
- ⚠️ Notifications tab = stub κάρτα που απλώς δείχνει link στο `/notifications`.
- ✅ tabs/search/φίλτρα/empty state/navigation.

GroupChat (7 αντίγραφα ~1700 γρ., Classic ως αναφορά):
- 🔄 1000 mock μηνύματα τοπικά — τίποτα δεν σώζεται/μοιράζεται.
- ❌ Report modal → μόνο `toast.success`, **δεν γράφει πουθενά** (`:1372-1379`).
- ❌ `group.members.push(...)` **mutation εκτός zustand set** (`:1584`) — δεν re-render αξιόπιστα.
- ⚠️ Διπλό Status modal στο ίδιο flag (`:859` + `:1390`) — δύο stacked overlays.
- ⚠️ `<select>` αποστολέα χωρίς aria-label (`:326-339`).
- ✅ Πλούσιο λειτουργικά: icebreakers, ephemeral toggle (σωστό `role="switch"`), safety suite (status/location/SOS/radar/trusted link), leave/add member με toasts.

### B13. Popup chat (καθολικό)

- ❌ `MeetingPointPanel.tsx:31-40` — «Έφτασα» και «Χάρτης» **χωρίς onClick**.
- ❌ `KeepChatRequestModal.tsx:27-35` — «Αίτημα διατήρησης» μόνο `onClose()`, χωρίς αίτημα/toast· raw `conversationId` ορατό (`:44`)· χωρίς aria-modal/Esc/focus-trap.
- ⚠️ `ReportConversationModal` — λειτουργεί αλλά **χωρίς toast επιβεβαίωσης**.
- ⚠️ Unread badge launcher: μόνο μειώνεται (`chatStore.ts:116`), ποτέ δεν αυξάνεται — νεκρός μετρητής.
- ⚠️ Mute: αλλάζει flag χωρίς καμία ορατή ένδειξη πουθενά.
- ⚠️ `ChatInboxPanel`: χωρίς global empty state· `allowGroupMergeChats` setting χωρίς UI toggle (`chat.ts:73`).
- ⚠️ `PopupChatRoot.tsx:34` aria-label αγγλικό εκτός `t()`.

### B14. Ειδοποιήσεις (`/notifications`)

- ❌ Bug Α3 (κενά μηνύματα).
- ❌ «Δείτε ομάδα» / «Απάντηση» **χωρίς onClick** (`:158-166`).
- ⚠️ Click σε `system`/`buddy_seek` → σιωπηλό τίποτα (`:62-65`).
- 🔄 Dismissals σε τοπικό `Set` (`:56-58`).
- ✅ Mark-all-read, empty state.

### B15. Nakamas (`/connections`)

- ✅ Accept/decline/remove/connect με store + feedback.
- ⚠️ Εικονίδιο μηνύματος → `navigate('/chats')` αγνοώντας το `userId` (`:130`) — υπονοεί DM που δεν υπάρχει.
- ⚠️ «Invite to Event» → `/create` (label ≠ συμπεριφορά)· «Report» → γενικό `/report` χωρίς προσυμπλήρωση (`:280-281`).
- ⚠️ MoreVertical trigger χωρίς aria-label (`:27`).

### B16. Achievements / Leaderboard / Challenges

- ❌ Achievements «Κοινοπ./Share» χωρίς onClick (`AchievementsPageContent:141-143`).
- ⚠️ «Ημερήσια Πρόκληση» display-only — καμία ενέργεια (`:79-95`).
- ⚠️ Τρία ασύνδετα μοντέλα XP/badges (βλ. Α5)· in-page leaderboard ≠ σελίδα Leaderboard.
- ⚠️ `Leaderboard.tsx:4-6`, `Challenges.tsx:4-6` αγνοούν το theme (πάντα Classic) — αποδεκτό per `NAVIGATION_PAGE_AUDIT`, να μείνει.
- 🔄 Challenges Join/Leave μόνο local state (`:163-169`).
- ⚠️ Challenges: χωρίς empty state όταν φίλτρο = 0.

### B17. Πίνακας Διοργανωτή (`/manage`)

Στατικός με **8 νεκρά κουμπιά**: Message group (`:553-568`), Settings (`:503-507`), Edit (`:589-592`), Send Announcement (`:595-598`), Publish Meeting Point (`:599-610`), Cancel Event (`:611-617`), Archive (`:620-623`)· quick templates → σκέτο `/create` χωρίς prefill (`:439-454`)· όλα τα stats/chart/events hardcoded (`:23-160,328-398`)· χωρίς empty state.

**Ενέργειες (Φ20.1):** Δέσιμο stats/λίστας με πραγματικά `events`/`groups`/`feedbackSubmitted` του τρέχοντος διοργανωτή + empty state· wiring: Edit → `/create?edit=:id`, Announcement → system message στο group chat, Meeting Point → store flag (που διαβάζει και το Plans B8), Cancel/Archive → status store actions με confirm modal, Message group → `/chat/:groupId`, templates → `/create?template=hiking` με prefill.

### B18. Δημιουργία Εκδήλωσης (`/create`)

- ✅ Σωστό gating βημάτων, MapPinPicker, i18n.
- ❌ **Χωρίς success toast** μετά το publish (σιωπηλή προσθήκη + redirect).
- 🔄 Νέο event χάνεται με refresh (Α1)· blob εικόνας δεν αποθηκεύεται.
- ⚠️ Πάντα `isPaid:false` (`:87-88`) παρότι υπάρχει Wallet/έσοδα.
- ⚠️ Visibility cards `<div onClick>` χωρίς role/aria-pressed/keyboard (`:395-428`).
- ⚠️ Progress bar χωρίς «Βήμα x/4» αριθμητικά (το Onboarding το κάνει σωστά).

### B19. Πορτοφόλι (`/wallet`)

Όλα στατικά: «Withdraw» (`:34-36`) ❌, «Manage Payouts» (`:60`) ❌, φίλτρο συναλλαγών `<select>` χωρίς onChange (`:67-71`) ❌, ποσά/τράπεζα/συναλλαγές hardcoded. `useStore` import αχρησιμοποίητο (`:5`).

**Ενέργειες (Φ20.2):** Φίλτρο που πραγματικά φιλτράρει, Withdraw/Manage → modal ροής με toast («Demo λειτουργία» μέχρι backend), έσοδα δεμένα με paid events όταν προστεθεί τιμολόγηση στο `/create`.

### B20. Επαλήθευση (`/verification`) & Κέντρο Εμπιστοσύνης (`/trust`)

- Verification: «Verify Now» (`:66`) ❌, «Upload» (`:89`) ❌, πρόοδος «2/3» και «72%→87%» hardcoded — **αντιφάσκει** με TrustCenter (95) και αγνοεί τα πραγματικά `currentUser.*Verified` flags.
- TrustCenter: gauge/score/tier **live** ✅· rows Email/Phone/Payment hardcoded «Verified» (`:60-72`) ⚠️· timeline hardcoded (`:28-34`)· «Verify» → `/verification` ✅.

**Ενέργειες (Φ19):** Δέσιμο και των δύο σελίδων στα πραγματικά flags του χρήστη· «Verify Now/Upload» → mock flow που αλλάζει το flag (με toast)· κατάργηση του αυθαίρετου «72%» υπέρ του ενιαίου Reliability Score.

### B21. Αναφορά Προβλήματος (`/report`)

❌ **Ψεύτικη φόρμα:** `handleSubmit` (`:17-20`) = `preventDefault(); setStep(2)` — category/severity/description **δεν διαβάζονται ποτέ**· dropzone χωρίς file input (`:136-140`)· η οθόνη επιτυχίας ψεύδεται. (Καλό: `aria-pressed` στα severity, required validation.)

**Ενέργειες (Φ16.8):** `submitReport` store action (persisted λίστα), πραγματικό file input, toast, εμφάνιση των reports στο AdminDashboard.

### B22. Προφίλ (`/profile`)

- ✅ Επεξεργασία avatar/name/bio/interests (αλλά 🔄 λόγω Α1).
- ❌ Privacy block (`:352-404`): visibility/message-permission/share-location/3 checkboxes — **local μόνο** και **διπλά/συγκρουόμενα** με τα αντίστοιχα του Settings.
- ❌ Group Preferences radios διακοσμητικά (`:262-278`)· «+ Edit» διαθεσιμότητας → `/settings` που **δεν έχει** editor διαθεσιμότητας (`:333`) — αδιέξοδο.
- ⚠️ Fallback βαθμίδας: raw «2 CONFIRMED» (`:200`).
- ⚠️ Stat «Events 12» hardcoded (`:119`).

### B23. Ρυθμίσεις (`/settings`)

- ✅ Γλώσσα/Theme/Home layout persisted.
- 🔄 2FA, notificationPrefs, categoryPrefs μόνο local (`:32-50,141-198`).
- ❌ Νεκρές σειρές: Payment Methods (`:63`), Profile Visibility (`:69`), Blocked Users (`:70`), Sessions «Log out» (`:227`), Data Export «Download» (`:245`), **«Διαγραφή λογαριασμού» (`:259-261`)** — επικίνδυνη εμφάνιση, μηδέν συμπεριφορά.
- ⚠️ ThemePicker λέει «9 θέματα» ενώ είναι 7 (`:131`).
- ⚠️ Toggles `<div onClick>` χωρίς `role="switch"`/`aria-checked`/keyboard (`:163-168`).

**Ενέργειες (Φ20.3):** Κοινό persisted `settings` slice (ένα source of truth για Profile+Settings), wiring ή «Σύντομα» badge στις νεκρές σειρές (το pattern υπάρχει ήδη στο AppShell `:101`), σωστά switches, διόρθωση «9→7».

### B24. Κέντρο Βοήθειας (`/help`)

- ✅ Search άρθρων, FAQ accordion.
- ❌ Popular Topics (`:62-67`), κάρτες άρθρων με `cursor-pointer` (`:100-107`), «Αποστολή μηνύματος» (`:123-125`) — όλα χωρίς onClick· «Online now ~2min» ψεύτικο presence (`:121`).
- ⚠️ Search δεν ψάχνει FAQs· χωρίς «κανένα αποτέλεσμα» state.

### B25. Admin (`/admin`) — 7 αντίγραφα

Όλα τα metrics hardcoded· **όλα** τα κουμπιά νεκρά ×7: Review (`:83`), Ban (`:84`), Suspend (`:97`), user search/select/note/Apply (`:115-134`). Θετικό: ενσωματώνει τα ζωντανά `CompanyRequestModerationPanel` + `ChatModerationPanel` (`:142-143`).

### B26. Onboarding (`/onboarding`)

- ✅ Καλύτερο flow της εφαρμογής (πρόοδος «Βήμα x/7» + %, gating, skip).
- 🔄 Οι απαντήσεις (`updateUser` → `discoveryPrefs`) χάνονται με refresh ενώ το `onboardingCompleted` μένει (Α1) — ο χρήστης «τελείωσε» onboarding του οποίου τα δεδομένα δεν υπάρχουν.
- ⚠️ Υπότιτλος «τουλάχιστον 3 ενδιαφέροντα» (`:133`) αλλά gate = ≥1 (`:401`).

### B27. Προφίλ Διοργανωτή (`/organizer/:id`) — 7 αντίγραφα

- ✅ Δεμένο με store (events/users), σωστά not-found/empty states.
- ❌ Website link `href="#"` (`:77-84`) ×7.
- ❌ Επικοινωνία με **`alert()`** (`:150`) ×7 — χωρίς αποθήκευση/αποστολή.
- ⚠️ Rating «4.2 (120+ reviews)» hardcoded (`:65-66`)· typos «tickting» (`:134`), «Άυτος» (`:52`).

### B28. AppShell / 404

- ❌ Footer links Privacy/Report/Trust → `href="#"` (`AppShell.tsx:440-442`) ενώ **υπάρχουν** πραγματικά routes (`/report`, `/trust`).
- ✅ TopNav search, lang, notifications badge, «Σύντομα» pills, BottomNav.
- ❌ `not-found.tsx`: χωρίς CTA «Πίσω στην Αρχική» — αδιέξοδη σελίδα.

---

## ΜΕΡΟΣ Γ — Συγκεντρωτικά Μητρώα

### Γ1. Νεκρά κουμπιά / placeholder ενέργειες (πλήρης λίστα — 40+)

| # | Στοιχείο | Αρχείο:Γραμμή |
|---|---|---|
| 1 | Grid-view κουμπί Home | `HomeClassic.tsx:286` |
| 2 | Nearby search input | `NearbyGroupsPageContent.tsx:241` |
| 3 | Nearby κουμπί Φίλτρα | `:249` |
| 4 | Nearby sidebar chips ×3 | `:318-320` |
| 5 | Nearby slider ακτίνας (δεν φιλτράρει) | `:314` |
| 6 | EventDetail «Join Waitlist» → alert() | `EventDetailClassic.tsx:266` |
| 7 | EventCard safety-link copy/share → alert() ×2 | `EventCard.tsx:805,830` |
| 8 | Organizer links → `/profile` | `EventDetailOrganizerSection.tsx:203,237` |
| 9 | AppShell footer ×3 → `#` | `AppShell.tsx:440-442` |
| 10 | BuddySeek «Νέο αίτημα» → `/` | `BuddySeekPageContent.tsx:86-97` |
| 11 | LookingForCompany φίλτρα no-op | `LookingForCompanyPanel.tsx:73-79` |
| 12 | MeetingPoint «Έφτασα» / «Χάρτης» | `MeetingPointPanel.tsx:31,34` |
| 13 | KeepChat «Αίτημα διατήρησης» | `KeepChatRequestModal.tsx:27` |
| 14 | Notifications «Δείτε ομάδα»/«Απάντηση» | `NotificationsPageContent.tsx:159,164` |
| 15 | Achievements «Share» | `AchievementsPageContent.tsx:141` |
| 16 | GroupChat report → μόνο toast | `GroupChatClassic.tsx:1372` (×7 αρχεία) |
| 17 | Organizer Dashboard ×8 κουμπιά | `OrganizerDashboardPageContent.tsx:503-623` |
| 18 | Wallet Withdraw/Manage/φίλτρο | `WalletPageContent.tsx:34,60,67` |
| 19 | Verification Verify/Upload | `VerificationCenterPageContent.tsx:66,89` |
| 20 | ReportIssue ψεύτικο submit + dropzone | `ReportIssuePageContent.tsx:17,136` |
| 21 | Profile group prefs / privacy (local) | `ProfilePageContent.tsx:262-278,352-404` |
| 22 | Settings ×6 νεκρές σειρές (και Delete account) | `SettingsPageContent.tsx:63-70,227,245,259` |
| 23 | Help topics/άρθρα/Send message | `HelpCenterPageContent.tsx:62-67,100-107,123` |
| 24 | Admin Review/Ban/Suspend/Apply ×7 αρχεία | `AdminDashboardClassic.tsx:83-134` |
| 25 | OrganizerProfile website `#`, alert() ×7 | `OrganizerProfile*.tsx:77-84,150` |
| 26 | Plans «Group Chat» λάθος id | `PlansPageContent.tsx:185` |
| 27 | Connections message αγνοεί userId | `ConnectionsPageContent.tsx:130` |
| 28 | Login «Google» = demo | `LoginClassic.tsx:67-73` |
| 29 | 404 χωρίς CTA εξόδου | `not-found.tsx` |

### Γ2. Ψεύτικα/στατικά δεδομένα που παρουσιάζονται ως πραγματικά

Inbox unread/pinned/typing (`g1` μόνο)· Plans avatars/«4/5 μέλη»/«meeting point active»/«2 more people»· Nearby αποστάσεις από index· ActiveBuddies «online» από `charCodeAt` (`ActiveBuddiesRail.tsx:95`)· Organizer Dashboard stats/chart/events· Wallet ποσά· Verification 72%/2-of-3· TrustCenter rows «Verified»/timeline· Achievements όλα· Moderation «Suspicious: 2» (`CompanyRequestModerationPanel.tsx:42-44`)· Help «Online now»· OrganizerProfile rating· «+25 XP» χωρίς XP.

### Γ3. i18n κενά

| Θέση | Πρόβλημα |
|---|---|
| `NearbyGroupsPageContent.tsx:169-170` | «Map Error» εκτός `t()` |
| `BuddySeekPageContent.tsx:207-210` | Αγγλικά στο EL branch |
| `CreateCompanyRequestModal.tsx:186,196` | «Min»/«Max» hardcoded |
| `CompanyRequestModerationPanel.tsx:24,54` | EL==EN· «reports» hardcoded |
| `BuddySeekPrivacySettings.tsx:24,28-31` | Μερικά αγγλικά στο EL |
| `JoinRequestPreviewModal.tsx:35`, `CreateCompanyRequestModal.tsx:108`, `GroupMergeModal.tsx:61`, `PopupChatRoot.tsx:34` | aria-labels «Close» αγγλικά εκτός `t()` |
| `PlansPageContent.tsx:268`, `LookingForCompanyPanel.tsx:190` | Χωρίς singular/plural |
| `NotificationsPageContent.tsx:156-157` | Καμία γλωσσική επιλογή (bug Α3) |
| `ChatModerationPanel.tsx:17,32` | EL==EN· `toLocaleString` εκτός γλώσσας εφαρμογής |
| `GroupMergeModal.tsx:54` | Typo «Εγινε» → «Έγινε» |
| `OrganizerProfile*.tsx:52,134` | «Άυτος», «tickting» |

### Γ4. Προσβασιμότητα (a11y)

| Θέση | Πρόβλημα |
|---|---|
| `EventCard.tsx:505-511` | «+ Cal» κρυπτικό, χωρίς aria-label/title |
| `PostEventFeedbackPageContent.tsx:236-279` | Αστέρια χωρίς aria-label |
| `HistoryPageContent.tsx:126`, `SavedEventsPageContent.tsx:100` | Clickable Cards χωρίς role/tabIndex/keyboard |
| `PlansPageContent.tsx:307`, `KeepChatRequestModal`, `ReportConversationModal`, modals `GroupChatClassic` | Χωρίς aria-modal/Esc/overlay-close/focus-trap |
| Inbox/Notifications/Connections/Achievements/Challenges tabs | Χωρίς `role="tablist/tab"`/`aria-selected` |
| `SettingsPageContent.tsx:163-168` | Switches ως `<div onClick>` χωρίς role/keyboard |
| `CreateEventFlowPageContent.tsx:395-428` | Visibility cards `<div onClick>` χωρίς radio semantics |
| `ConnectionsPageContent.tsx:27`, `GroupChatClassic.tsx:326` | Icon triggers χωρίς aria-label |
| `QuickReplies.tsx:17-23` | Άκυρο `role="list/listitem"` σε div/button |
| `PlansFormingBottomSheet.tsx:67-82` | Amber CTA χωρίς dark-mode contrast |
| Calendar double-click | Χωρίς keyboard ισοδύναμο |

---

## ΜΕΡΟΣ Δ — Πλάνο Υλοποίησης (Φάσεις 16–22, αυστηρά additive)

### Φάση 16 — Διορθώσεις ακεραιότητας & «γρήγορες νίκες» (ΥΨΙΣΤΗ προτεραιότητα)

| # | Εργασία | Αρχεία | Κριτήριο αποδοχής |
|---|---|---|---|
| 16.1 | Επέκταση `partialize` (+`events,groups,notifications,connectionRequests,groupMergeSuggestions,currentUserId`) με merge-rehydration των mock seeds | `store/index.ts` | Create event / profile edit / BuddySeek accept επιβιώνουν refresh |
| 16.2 | Fix Notifications: δίγλωσση ανάγνωση + κανονικοποίηση `addNotification` + `buddy_seek` σε icons/tabs + wiring «Δείτε ομάδα»/«Απάντηση» + persisted dismissals | `NotificationsPageContent.tsx`, callers | Καμία κενή ειδοποίηση· όλα τα κουμπιά οδηγούν κάπου |
| 16.3 | Guard `currentUser?.interests` σε όλα τα EventDetail shells | `EventDetail*.tsx` | Guest δεν κρασάρει |
| 16.4 | Nearby: λειτουργικά search/Φίλτρα/sidebar chips/ακτίνα + haversine αποστάσεις + `t()` στο Map Error | `NearbyGroupsPageContent.tsx` | Κανένα νεκρό στοιχείο στη σελίδα |
| 16.5 | Organizer links → `/organizer/:id`· Waitlist → store action + toast· alert()→toast στα EventCard safety | `EventDetailOrganizerSection.tsx`, `EventDetailClassic.tsx`, `EventCard.tsx` | Μηδέν `alert()` στην εφαρμογή |
| 16.6 | JoinGroupFlow: επιλογέας ομάδας + ανάγνωση `?group=` | `JoinGroupFlow.tsx` | Deep links BuddySeek προεπιλέγουν τη σωστή ομάδα |
| 16.7 | Plans: σωστό groupId στο chat, πραγματικά μέλη/μετρητές, singular/plural, a11y leave-modal | `PlansPageContent.tsx` | Καμία ψεύτικη πληροφορία σε κάρτα |
| 16.8 | ReportIssue: `submitReport` store action + file input + toast + προβολή στο Admin | `ReportIssuePageContent.tsx`, `store`, Admin | Το report αποθηκεύεται και φαίνεται στο Admin |
| 16.9 | AppShell footer → πραγματικά routes· 404 CTA «Πίσω στην Αρχική»· «+ Cal» aria/title | `AppShell.tsx`, `not-found.tsx`, `EventCard.tsx` | — |

### Φάση 17 — Ενοποίηση Chat (ένα data layer)

1. Persisted `messages`/`unreadCount` στο `chatStore` (`partialize` επέκταση).
2. `InboxPageContent`: πραγματικά unread/typing/pinned από chatStore· σύνδεση rows με συνομιλίες.
3. `GroupChat*`: ανάγνωση/εγγραφή μέσω chatStore (διατήρηση ΟΛΩΝ των features — icebreakers, safety suite, ephemeral)· report → `chatStore.reports`· fix mutation `members.push` → store action· αφαίρεση διπλού Status modal render (ένα flag, ένα modal — όχι αφαίρεση λειτουργίας).
4. Popup: wiring «Έφτασα» (system message), «Χάρτης» (maps link), KeepChat → πραγματικό αίτημα + toast, Report toast, ένδειξη mute, live unread, empty state inbox panel, toggle για `allowGroupMergeChats`.

### Φάση 18 — Αυτοεπεξηγησιμότητα & Ανακαλυψιμότητα

1. Ημερολόγιο: hint διπλού κλικ + ρητό κουμπί «Ημερήσιο πρόγραμμα» + empty state + keyboard path.
2. BuddySeek: explainer πρώτης επίσκεψης, «Αιτήματα που έστειλα», event-picker στο «Νέο αίτημα», πραγματικά φίλτρα + counts, skeleton wiring, «Edit» → wizard, badge «Από Σχέδια που σχηματίζονται» στις κάρτες Plans/Calendar που προέκυψαν από match.
3. Onboarding: ευθυγράμμιση «≥3» υπότιτλου με gate (ή gate=3).
4. Connections: «Invite to Event» → επιλογέας υπαρχουσών εκδηλώσεων· message icon → άνοιγμα σχετικής συνομιλίας ή tooltip «Ομαδικές συνομιλίες».

### Φάση 19 — Ενιαίο σύστημα Εμπιστοσύνης & Gamification

1. Ένας όρος («Βαθμός Αξιοπιστίας / Reliability Score»), μία πηγή (`currentUser.reliabilityScore`) σε Verification/Trust/Profile + tooltips ορισμού.
2. Verification δεμένο στα πραγματικά `*Verified` flags + mock verify flows με toast· TrustCenter rows/timeline από πραγματικά δεδομένα.
3. Ενιαία ονόματα βαθμίδων (UI = `lib/trust.ts`).
4. `gamification` slice: XP/badges/streaks κοινά για Achievements/Leaderboard/Challenges· πραγματική πίστωση «+25 XP» στο feedback· persist Challenges join/leave· wiring «Share» badge (Web Share/clipboard + toast)· ενεργό CTA στην Ημερήσια Πρόκληση· empty state φίλτρων Challenges.

### Φάση 20 — Λειτουργικοποίηση Organizer/Wallet/Settings/Help/Admin

1. Organizer Dashboard: live stats/events + empty state + wiring 8 κουμπιών + templates με prefill (B17).
2. Wallet: λειτουργικό φίλτρο, Withdraw/Manage flows (demo-σημασμένα), σύνδεση με paid events· βήμα τιμολόγησης στο `/create` + success toast publish.
3. Settings+Profile: κοινό persisted slice (privacy/notifications/2FA/categories), σωστά switches, «Σύντομα» pills στις εκτός-scope σειρές, διόρθωση «9→7 θέματα», editor διαθεσιμότητας (ώστε το «+ Edit» του Profile να μην είναι αδιέξοδο).
4. Help: wiring topics/άρθρων/Send message + search σε FAQs + no-results state.
5. Admin: wiring Review/Ban/Suspend/Apply σε moderation store actions + live metrics.
6. OrganizerProfile: toast αντί alert, πραγματικό/κρυφό website link, ορθογραφικά.

### Φάση 21 — Αποπληθωρισμός διπλότυπων (μηδενική αλλαγή λειτουργίας)

`GroupChatPageContent`, `AdminDashboardPageContent`, `OrganizerProfilePageContent` (pattern Φ15)· σήμανση `CalendarHourlySchedule` ως deprecated alias· καθάρισμα dead imports (`PlansFormingCard.tsx:16`, `BuddySeek.tsx:1`, `BuddySeekPageContent.tsx:29`, `WalletPageContent.tsx:5`).

### Φάση 22 — Οριζόντιο πέρασμα i18n + a11y

Όλα τα στοιχεία των πινάκων Γ3/Γ4: `t()` παντού (συμπεριλαμβανομένων aria-labels), singular/plural helper, `role="tablist/tab"`, `role="switch"`, dialog semantics (aria-modal/Esc/overlay/focus-trap) σε όλα τα custom modals, aria-labels σε κουμπιά-εικονίδια, dark-mode contrast στο amber CTA.

---

## ΜΕΡΟΣ Ε — Επαλήθευση

1. `npx tsc --noEmit` + `npm run lint` μετά από κάθε φάση.
2. Χειροκίνητα σενάρια regression ανά φάση: guest → EventDetail με tags (16.3)· create event → refresh → υπάρχει στο feed (16.1)· BuddySeek accept → refresh → ομάδα στο Plans/Calendar/Chat (16.1+17)· αλλαγή γλώσσας EL↔EN σε κάθε τροποποιημένη σελίδα· πλοήγηση με Tab/Enter/Esc στα modals (22).
3. Έλεγχος και των 7 θεμάτων για κάθε σελίδα που αγγίζεται (το pattern `*PageContent` καλύπτει τα περισσότερα αυτόματα).

**Ρήτρα μη αφαίρεσης:** Καμία εργασία του πλάνου δεν αφαιρεί υπάρχουσα λειτουργία, σελίδα, κουμπί ή modal. Ισχύουν αναλλοίωτες οι απαγορεύσεις του `NAVIGATION_PAGE_AUDIT.md` («Μην συγχωνεύσετε ποτέ»: ZIP stubs, ενιαίο ZIP App/Home, αφαίρεση GroupChatClassic/OnboardingClassic/9× Home).

---

## ΜΕΡΟΣ Ζ — Κατάσταση Υλοποίησης (ενημέρωση 10/06/2026)

Σύμβολισμός: ✅ ολοκληρωμένο/wired · 🟡 μερικό · ⬜ εκκρεμές

### Φ16 — Ακεραιότητα & γρήγορες νίκες

| # | Κατάσταση | Σημειώσεις |
|---|---|---|
| 16.1 | ✅ | `partialize`/`merge` επεκτάθηκε (`events`, `groups`, `users`, `currentUserId`, `notifications`, `connectionRequests`, `groupMergeSuggestions`, `issueReports`, `userSettings`, `bonusXp`, κ.λπ.) |
| 16.2 | ✅ | `NotificationsPageContent` — δίγλωσσα, `buddy_seek`, wiring κουμπιών, `dismissNotification` persisted |
| 16.3 | ✅ | Όλα τα 7× `EventDetail*` — guest guard, `useEventWaitlist`, toast αντί `alert()` |
| 16.4 | ✅ | `NearbyGroupsPageContent` — search, φίλτρα, haversine, ακτίνα |
| 16.5 | ✅ | `EventDetailOrganizerSection` → `/organizer/:id`, waitlist store, `EventCard` toast + `+ Cal` a11y |
| 16.6 | ✅ | `JoinGroupFlow` — group picker, `?group=` / `?groupId=` preselect |
| 16.7 | ✅ | `PlansPageContent` — σωστό groupId, live μέλη, plural, leave modal a11y |
| 16.8 | ✅ | `ReportIssuePageContent` + `submitIssueReport` + Admin εμφάνιση |
| 16.9 | ✅ | AppShell footer → `/settings`, `/report`, `/trust`· `not-found` CTA· Saved/History a11y |

### Φ17 — Chat

| Στοιχείο | Κατάσταση |
|---|---|
| chatStore persist (`conversations`, `messages`, `reports`) | ✅ |
| `receiveMessage`, `requestKeepChat`, `announceArrival` | ✅ |
| GroupChat ×7 → chatStore reports, mutation fix, duplicate modal | ⬜ |
| Popup: MeetingPoint, KeepChat, ReportConversation, `allowGroupMergeChats` | ✅ |
| Popup: mute badge, Inbox unread live | 🟡 |
| `alert()` → `toast` στα GroupChat themed | ✅ (6 variants) |

### Φ18 — Αυτοεπεξηγησιμότητα

| Στοιχείο | Κατάσταση |
|---|---|
| Calendar hint + schedule button + empty state (Φ18.1) | ✅ |
| BuddySeek explainer, sent requests, event-picker, skeleton (Φ18.2) | ✅ |
| LookingForCompany φίλτρα + «Edit» wizard + chip counts | ⬜ |
| Onboarding gate «≥3» | ⬜ |
| Connections invite picker / DM tooltip | ⬜ |

### Φ19 — Εμπιστοσύνη & Gamification

| Στοιχείο | Κατάσταση |
|---|---|
| `lib/gamification.ts` ενιαίο slice | ✅ |
| LeaderboardClassic → `computeUserXp` + `bonusXp` | ✅ |
| PostEventFeedback `awardXp(25)` | ✅ |
| Achievements Share + Daily Challenge XP | ✅ |
| VerificationCenter live flags + mock verify | ✅ |
| TrustCenter rows από `currentUser.*Verified` | ✅ |
| Profile tier labels → `lib/trust.ts` | ✅ |
| Challenges persisted join/leave | ⬜ |

### Φ20 — Organizer / Wallet / Settings / Help / Admin

| Στοιχείο | Κατάσταση |
|---|---|
| OrganizerDashboard 8 κουμπιά wired (demo ids) | ✅ |
| OrganizerDashboard live stats από store | ⬜ (ακόμα mock ORGANIZER_EVENTS) |
| Wallet φίλτρο + Withdraw/Manage modals | ✅ |
| Settings `userSettings` persisted, 2FA, export, delete modal, availability editor, 7 θέματα, switches a11y | ✅ |
| Profile privacy → `updatePrivacySettings` | ✅ |
| Help topics/search/FAQ/send message | ✅ |
| AdminDashboardPageContent + 7 thin wrappers + live reports | ✅ |
| OrganizerProfilePageContent + 7 thin wrappers + contact toast | ✅ |
| CreateEventFlow success toast / paid step | ⬜ |

### Φ21 — Αποπληθωρισμός

| Component | Κατάσταση |
|---|---|
| `OrganizerProfilePageContent` | ✅ |
| `AdminDashboardPageContent` | ✅ |
| `GroupChatPageContent` | ⬜ |
| `CalendarHourlySchedule` @deprecated | ✅ |

### Φ22 — i18n + a11y οριζόντιο πέρασμα

⬜ Μερικό (Notifications tabs, Settings switches, Profile/Help/Wallet modals)· **πλήρες πέρασμα πινάκων Γ3/Γ4 εκκρεμές**

### Νέα ευρήματα (προστέθηκαν κατά την υλοποίηση)

| # | Εύρημα | Αρχείο |
|---|---|---|
| Ν1 | PowerShell bulk edit έσπασε 6× `OrganizerProfile*` με literal `` `n `` — **διορθώθηκε** με `OrganizerProfilePageContent` | `pages/OrganizerProfile*.tsx` |
| Ν2 | `LeaderboardClassic` χρησιμοποιούσε `computeXP`/`badge.gr` — **διορθώθηκε** προς `gamification.ts` | `LeaderboardClassic.tsx` |
| Ν3 | `SettingsPageContent` και `ProfilePageContent` είχαν διπλό local state για privacy — **ενώθηκαν** στο `userSettings` slice | `SettingsPageContent`, `ProfilePageContent` |
| Ν4 | `VerificationCenter` hardcoded «72%→87%» — **αντικαταστάθηκε** από live flags + Reliability Score | `VerificationCenterPageContent.tsx` |
| Ν5 | `OrganizerDashboardPageContent` χρησιμοποιεί ακόμα `ORGANIZER_EVENTS` mock — κουμπιά wired με demo ids (`e1`, `g1`) μέχρι live mapping | `OrganizerDashboardPageContent.tsx` |
| Ν6 | `HelpCenter` articles expand χωρίς περιεχόμενο άρθρου — click toggles selection μόνο· **προτεινόμενο:** modal με πλήρες κείμενο | `HelpCenterPageContent.tsx` |

### Επόμενα βήματα (προτεραιότητα)

1. Φ17 GroupChat ×7 — reports pipeline, immutable members, ένα Status modal· Inbox unread live
2. Φ18 leftovers — LookingForCompany φίλτρα, Edit wizard, Onboarding gate, Connections picker
3. Φ20 CreateEventFlow success/paid· OrganizerDashboard live events/stats
4. Φ21 `GroupChatPageContent` extraction
5. Φ22 πλήρες i18n/a11y πέρασμα (Γ3/Γ4)
6. Regression χειροκίνητα σενάρια ΜΕΡΟΥΣ Ε

