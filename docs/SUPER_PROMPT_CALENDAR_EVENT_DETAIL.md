# SUPER PROMPT — Calendar parity (ZIP) + Event Detail enhancements

> **Χρήση:** Επικόλλησε ολόκληρο αυτό το έγγραφο σε νέο agent chat. Απαίτησε **ολοκλήρωση όλων των acceptance criteria** πριν θεωρηθεί έτοιμο. Μην σταματάς στο «καλό αρκετά» — η εργασία είναι **εξονυχιστική, διεξοδική, σχολαστική**.

---

## 0. Αποστολή (Mission)

Η εφαρμογή **parea_app** (React + Vite + TypeScript + Tailwind + `useLanguage` / `t('Ελ', 'En')`) πρέπει να φτάσει **οπτική και λειτουργική ισοδυναμία** με το ZIP reference (`parea-zip-extract`) για το **Ημερολόγιο** (`/agenda`), και να προστεθούν/ολοκληρωθούν συγκεκριμένα blocks στο **Event Detail**, **μόνο για web/tablet** όπου ορίζεται ρητά· στο mobile calendar μόνο **αριθμός events**.

**Κρίσιμο:** Οι screenshots του ZIP δείχνουν κελιά με φωτογραφίες events (Ιούνιος 2026, πολλαπλά events ανά μέρα). Η τοπική εφαρμογή **έχει ήδη** μεγάλο μέρος του UI στο `MyCalendarPageContent.tsx`, αλλά **δεν εμφανίζεται** όταν ο χρήστης δεν έχει events στο scope του ημερολογίου — αυτό πρέπει να διορθωθεί **πριν** θεωρηθεί «ολοκληρωμένο».

---

## 1. Μη διαπραγματεύσιμα (Hard constraints)

1. **Μην αφαιρέσεις** λειτουργίες: 9× Home, 7× EventDetail shells, onboarding guard, lazy `App.tsx`, `ChallengesClassic`, `GroupChatClassic`, `OnboardingClassic`.
2. **Additive merge μόνο** — επέκταση, όχι αντικατάσταση με ZIP stubs.
3. **Όλα τα user-facing strings** μέσω `t('Ελληνικά', 'English')`.
4. **Classic design tokens:** `rounded-2xl`, `shadow-soft`, `text-[11px]` labels, `text-[13px]` body, cyan-600 primary.
5. **Μην δημιουργήσεις** `EventDetailPageContent.tsx` αν δεν υπάρχει — το project χρησιμοποιεί **shared sections** + 7 themed shells (`EventDetailClassic.tsx` κ.λπ.). Νέα λογική → **νέα shared components** ή επέκταση υπαρχόντων sections/hooks, wired σε **όλα** τα themes.
6. **Δεν υπάρχει** `EventMap.tsx` — ο χάρτης είναι `src/components/events/EventDetailMapSection.tsx` (`@vis.gl/react-google-maps`).
7. **Τρέξε** `npm run lint` στο τέλος — πρέπει να περνάει.

---

## 2. Χάρτης αρχείων (File map)

| Περιοχή | Αρχεία |
|---------|--------|
| Calendar body | `src/components/calendar/MyCalendarPageContent.tsx` |
| Hourly modal (double-click) | `src/components/calendar/CalendarHourlySchedule.tsx` |
| Day interaction | `src/hooks/useCalendarDayInteraction.ts` (250ms single vs double) |
| User events scope | `src/hooks/useUserCalendarEvents.ts` |
| Stories overlay | `src/components/home/StoryViewer.tsx`, `src/lib/storyEventOrdering.ts` |
| ICS export (page) | `src/lib/calendarIcs.ts` → `downloadCalendarIcs` |
| ICS per event | `src/lib/eventIcs.ts` → `downloadEventIcs` |
| Event detail actions | `src/hooks/useEventDetailActions.ts`, `EventDetailActionBar.tsx` |
| Meta / trust / category | `EventDetailMetaSection.tsx`, `src/lib/trust.ts` (`tierLabelEl`, `tierLabelEn`) |
| Map | `EventDetailMapSection.tsx` |
| ZIP reference | `parea-zip-extract/src/components/calendar/MyCalendarPageContent.tsx` |
| Mock QA data | `src/data/mockEvents.ts` (Ιούνιος 2026), `src/data/mockGroups.ts` |

---

## 3. BLOCK A — Διόρθωση scope ημερολογίου (γιατί τα κελιά είναι άδεια)

### 3.1 Πρόβλημα

`useUserCalendarEvents` επιστρέφει events μόνο αν `userEventIds.has(e.id)` όταν ο χρήστης έχει **τουλάχιστον μία** ομάδα. Ο logged-in χρήστης `u1` (Alex) συχνά **δεν** είναι μέλος στα demo events του Ιουνίου → `dayEvents.length === 0` → κενά κελιά (screenshots χρήστη), ενώ το ZIP demo φαίνεται «γεμάτο».

### 3.2 Απαίτηση

Ορίστε ρητά **ποια events εμφανίζονται στο ημερολόγιο**:

- Events όπου ο `currentUser` είναι **member ή pendingMember** σε group του event (**υποχρεωτικό** — αυτό είναι «έχω κανονίσει να πάω»).
- Προαιρετικά για QA/dev: αν `import.meta.env.DEV` και κανένα event στο scope, **μην** fallback σε όλα τα events χωρίς ρητή σημαία — αντίθετα **ενημέρωσε mock data** ώστε ο Alex να είναι member σε **όλα** τα demo events Ιουνίου 1–7 (ίδια μέρα πολλαπλά events για layout QA), όπως στο ZIP visual.

### 3.3 Mock data (υποχρεωτικό για QA)

Στο `mockGroups.ts` (ή seed logic):

- **Ιούνιος 1:** 1 event (π.χ. e20) — full cell με εικόνα + title + time + location.
- **Ιούνιος 3–4:** 4 events την ίδια μέρα — 2×2 grid.
- **Ιούνιος 5:** 5 ή 6 events — 3×2 grid με `+N` overflow slot αν >5 εμφανιζόμενα.
- Όλα με `members` που περιέχουν `u1`.

**Ημερομηνίες events** πρέπει να είναι **≥ σήμερα** (ή ρύθμισε system date mock) ώστε να μην φιλτράρονται ως παρελθόν.

---

## 4. BLOCK B — Calendar grid (WEB/TABLET μόνο: `md:` και άνω)

### 4.1 Γενικά

- Route: `/agenda` (`MyCalendarPageContent`).
- Views: **Εβδομάδα** + **Μήνας** (υπάρχουν — διατήρησέ τες).
- Κάθε **ημέρα με ≥1 event** στο scope του χρήστη δείχνει **rich cell**· όχι μόνο αριθμό.
- Κελιά: `rounded-2xl`, `overflow-hidden`, aspect ratio όπως τώρα (`md:aspect-[3/4] lg:aspect-square`).
- Φωτογραφία: `event.imageUrl` ως `background-image` cover center.
- Overlay: gradient `from-black/80` στο κάτω μέρος για readability.
- **Ταξινόμηση events μέσα στη μέρα:** κατά `time` αύξουσα.

### 4.2 Layout ανά πλήθος events (ΑΚΡΙΒΩΣ — διορθώστε τρέχουσα απόκλιση)

| # events | Layout | Πληροφορίες ανά υπο-κομμάτι |
|----------|--------|------------------------------|
| **1** | Full cell, μία εικόνα | **Title** (truncate), **ώρα**, **τοποθεσία** (`locationArea`), **ημερομηνία** (μικρό, π.χ. `d MMM`) — όλα στο κάτω gradient |
| **2** | **Διαγώνιο slash** (δύο τρίγωνα via `clip-path: polygon(...)`) | Κάθε μισό: εικόνα + **title** + **ώρα** (τοποθεσία optional αν χωράει) |
| **3** | **3 οριζόντιες λωρίδες** (`grid-rows-3`, `grid-cols-1`) — **ΟΧΙ** 2+1 grid | Title μόνο ή title + ώρα (μικρότερο font) |
| **4** | **2×2** (`grid-cols-2 grid-rows-2`) | Title truncate, `text-[7.5px]`–`[8px]` |
| **5** | **Προτίμηση A:** 3×2 με 5 γεμάτα + 1 κενό/teal `+0` **ή** **Προτίμηση B:** 5 οριζόντιες λωρίδες — διάλεξε ό,τι είναι πιο όμορφο σε side-by-side με ZIP screenshot #3/#4 | Αν 6ο event υπάρχει: slot `+1` |
| **6** | **3×2** όλα γεμάτα **ή** 6 οριζόντιες λωρίδες (ίδια αισθητική γραμμή με 5) | Title μόνο στα μικρότερα |
| **>6** | Δείξε πρώτα 5–6 slots + **`+N`** overflow (N = extras) | Κλικ ανοίγει stories με **όλα** |

**Υλοποίηση:** Εξάγαγε `CalendarDayCell.tsx` (ή `calendarDayLayouts.tsx`) — **μία** πηγή αλήθειας, όχι 80 γραμμές inline στο page.

### 4.3 Αριθμός ημέρας

- Ο αριθμός ημέρας (`format(day, 'd')`) πάνω από overlays: `z-10`, λευκό με `drop-shadow` όταν υπάρχουν events.
- Σήμερα: cyan highlight όπως τώρα.

### 4.4 Mobile (`< md`)

- **Μόνο** badge με **αριθμό** events (υπάρχει `md:hidden` badge — διατήρησέ το).
- **Όχι** εικόνες/διαχωρισμοί στο κελί.
- **Ίδια** interaction (single/double click) όπως παρακάτω.

---

## 5. BLOCK C — Αλληλεπίδραση ημερολογίου

### 5.1 Single click (1 κλικ) — Stories

**Για κάθε ημέρα με ≥1 event:**

1. Άνοιγμα `StoryViewer` (ή ισοδύναμο full-screen overlay) με **μόνο** τα events **αυτής της ημέρας**.
2. Ταξινόμηση: `sortEventsForStories(dayEvents, groups)`.
3. Κάθε story slide **υποχρεωτικά** εμφανίζει:
   - Cover image (`imageUrl`)
   - **Title**
   - **Ημερομηνία** (formatted, locale-aware)
   - **Ώρα** (`time`)
   - **Τοποθεσία** (`locationArea` + optional `exactLocation` αν υπάρχει)
   - CTA: «Προβολή εκδήλωσης» → `/events/:id`
   - Αν ο χρήστης είναι σε group: σύντομο group status (spots, host)
4. **Μην** ανοίγεις stories για ημέρες με 0 events (ignore click ή subtle toast).
5. Mobile + desktop: **ίδια** συμπεριφορά.

**Υπάρχει:** `useCalendarDayInteraction` + `StoryViewer` — **επαλήθευσε** ότι τα πεδία είναι πλήρη και ότι το overlay κλείνει σωστά (ESC, backdrop).

### 5.2 Double click (2 κλικ) — Hourly schedule UI

**Μόνο** με double-click στο ίδιο κελί (υπάρχει 250ms debounce στο `useCalendarDayInteraction`):

1. Άνοιγμα `CalendarHourlySchedule` modal για την **επιλεγμένη ημερομηνία**.
2. UI/UX απαιτήσεις:
   - Τίτλος: `d MMMM yyyy` + subtitle «Ημερήσιο Πρόγραμμα» / `Daily Schedule`
   - **24 ώρες** (00:00–23:00) — κάθε ώρα row
   - Events τοποθετημένα στο slot που ταιριάζει με `event.time` (parse `HH:mm`)
   - Κάθε event card: thumbnail, title, time, location, κλικ → `/events/:id`
   - Κενές ώρες: διακριτικό dashed / muted — όχι κενό χάος
   - `rounded-2xl`, `shadow-soft`, `usePageContrast`, κουμπί κλεισίματος accessible
3. Αν **0 events** την ημέρα: modal με empty state + CTA «Αναζήτηση εκδηλώσεων» → `/`.
4. Double-click **δεν** πρέπει να εκκινεί και story (clear timeout on 2nd click — ήδη έτσι· επιβεβαίωσε).

### 5.3 Export ICS (σελίδα)

Διατήρησε κουμπί «Εξαγωγή» → `downloadCalendarIcs` για όλα τα upcoming events στο scope.

---

## 6. BLOCK D — Event Detail enhancements

> Υλοποίηση σε **shared** modules, import σε `EventDetailClassic`, `EventDetailVibrant`, … (ή ένα hook που καλούν όλα).

### 6.1 «Add to Google Calendar»

**Τοποθεσία:** `EventDetailActionBar` ή αμέσως κάτω από τον τίτλο — ορατό χωρίς scroll σε tablet.

**Συμπεριφορά:**

1. Κουμπί: `t('Προσθήκη στο Google Calendar', 'Add to Google Calendar')`.
2. **Primary path:** άνοιγμα Google Calendar URL:
   ```
   https://calendar.google.com/calendar/render?action=TEMPLATE
   &text={encodedTitle}
   &dates={start}/{end}   // UTC compact YYYYMMDDTHHmmssZ
   &details={encodedDescription}
   &location={encodedLocation}
   ```
   Parse `event.date` + `event.time` + `event.duration` (fallback 2h αν λείπει duration).
3. **Secondary path (dropdown ή δεύτερο κουμπί):** «Λήψη .ics» → `downloadEventIcs(event)` (υπάρχει στο `useEventDetailActions`).
4. i18n, `rounded-2xl`, icon `Calendar` ή `CalendarPlus`.

### 6.2 Star rating — completed events (rate host)

**Συνθήκη εμφάνισης:** `parseISO(event.date) < startOfToday()` **ΚΑΙ** ο χρήστης ήταν participant (member σε group του event) **ΚΑΙ** δεν έχει ήδη `feedbackSubmitted[event.id]`.

**UI:**

- Block κάτω από hero ή πάνω από organizer: «Πώς ήταν η εμπειρία;» / `How was your experience?`
- 5 αστέρια interactive (hover + click).
- Submit → `submitFeedback` store action **ή** navigate `/history/feedback/:eventId` με pre-filled rating — **ένα** consistent flow (μην διπλο-υποβάλλεις).
- Μετά submit: `CheckCircle` + «Ευχαριστούμε» / disabled stars.

**Μην** εμφανίζεις για μελλοντικά events.

### 6.3 Quick Info widget

**Τοποθεσία:** **Αμέσως κάτω από τον τίτλο** event (πριν την περιγραφή).

**Περιεχόμενο (visually distinct box):**

- `rounded-2xl border shadow-soft p-4` με αμυδρό cyan/indigo background (`bg-cyan-50` / dark: `bg-cyan-900/20`).
- **Κατηγορία:** icon + `event.category` (μεταφρασμένη αν υπάρχει catalog).
- **Trust tier required:** `tierLabelEl` / `tierLabelEn` από `event.minTrustTierAccess` — **όχι** raw enum string.
- Optional: `safetyLevel` badge, `isPaid` / price snippet.
- Grid 2 στήλες σε tablet+, 1 στήλη mobile.

**Νέο αρχείο προτείνεται:** `EventDetailQuickInfoSection.tsx`.

---

## 7. BLOCK E — Interactive map marker (Event Detail)

**Αρχείο:** `EventDetailMapSection.tsx`

**Απαιτήσεις:**

1. `AdvancedMarker` / custom pin στο `(event.lat, event.lng)` (fallback Athens center μόνο αν λείπουν coords).
2. **Click στο marker** → `map.panTo` / `setCenter` + zoom **15–16** (animate αν το API το επιτρέπει).
3. Optional: pulse ring όταν centered.
4. Διατήρησε fullscreen toggle, `ErrorBoundary`, API key guard message.
5. `rounded-2xl` στο frame (αντί `rounded-lg` αν εύκολο).

---

## 8. BLOCK F — ZIP parity checklist (visual)

Σύγκρινε side-by-side με dev server vs ZIP screenshots:

- [ ] Week view Ιούνιος 2026 — κελιά 1, 3, 4, 5 με εικόνες όπως ZIP
- [ ] Month view — ίδιο layout logic
- [ ] Διαγώνιο 2-events ξεκάθαρο slash (όχι μόνο clip χωρίς οπτική γραμμή — πρόσθεσε `linear-gradient` diagonal line 1px white/30 αν χρειάζεται)
- [ ] 3 events = **3 horizontal strips** (όχι 2+1)
- [ ] Mobile: μόνο αριθμός
- [ ] Single click → stories πλήρη
- [ ] Double click → hourly modal

---

## 9. Acceptance criteria (ολοκληρωμένο = όλα checked)

### Calendar
- [ ] Logged-in Alex βλέπει demo events Ιουνίου στα κελιά (μετά mock fix)
- [ ] Layouts 1–6+ σύμφωνα με πίνακα §4.2
- [ ] `CalendarDayCell` (ή ισοδύναμο) extracted, tested visually
- [ ] Web/tablet rich cells· mobile count only
- [ ] Single click → StoryViewer με πλήρη metadata
- [ ] Double click → CalendarHourlySchedule, no double-firing story
- [ ] Export ICS λειτουργεί

### Event Detail (όλα τα 7 themes)
- [ ] Google Calendar link + ICS download
- [ ] Quick Info widget κάτω από title
- [ ] Star rating για past participated events
- [ ] Map marker click centers map

### Quality
- [ ] `npm run lint` passes
- [ ] Καμία hardcoded user-facing string χωρίς `t()`
- [ ] Docs: ενημέρωσε `docs/MERGE_INTEGRATION.md` με σύντομη ενότητα «Calendar visual parity + Event detail calendar actions»

---

## 10. Σειρά υλοποίησης (ακολούθησέ την αυστηρά)

1. **Fix `useUserCalendarEvents` + mockGroups** — ώστε να εμφανίζονται events (unblock QA).
2. **Extract + fix `CalendarDayCell` layouts** (διόρθωση 3→horizontal, 5–6 polish, diagonal line).
3. **Verify interactions** (stories + hourly).
4. **`EventDetailQuickInfoSection`** + wire 7 themes.
5. **Google Calendar button** (+ ICS) στο action bar.
6. **Post-event star rating** block.
7. **Map marker click-to-center**.
8. **Lint + visual pass** vs ZIP screenshots.

---

## 11. Αναφορά κώδικα ZIP (για diff, όχι blind copy)

```
parea-zip-extract/src/components/calendar/MyCalendarPageContent.tsx
```

Αντιγράψτε **λογική layout & interaction**, όχι ολόκληρο αρχείο — κρατήστε τοπικά hooks (`useUserCalendarEvents`, `calendarIcs`, `usePageContrast`).

**Γνωστή απόκλιση ZIP που ΔΕΝ αντιγράφεις:**

- ZIP `3 events` = 2+1 grid — **εσύ** υλοποίησε **3 οριζόντικες** λωρίδες (απαίτηση product owner).

---

## 12. Τι να μην κάνεις

- Μην αντικαταστήσεις 9× Home με ZIP `Home.tsx`.
- Μην αφαιρέσεις themed EventDetail shells.
- Μην βάλεις εικόνες σε mobile calendar cells.
- Μην χρησιμοποιήσεις `EventDetailPageContent.tsx` ως monolith — χρησιμοποίησε shared sections.
- Μην κλείσεις την εργασία αν τα κελιά είναι ακόμα άδεια για τον default logged-in user.

---

## 13. Prompt προς agent (one-liner για επικόλληση)

```
Implement docs/SUPER_PROMPT_CALENDAR_EVENT_DETAIL.md in full: fix calendar event scope + June mock data so cells show images; implement exact day-cell layouts (1 full, 2 diagonal, 3 horizontal strips, 4 quad, 5-6 grid/horizontal +N); single-click day stories, double-click hourly modal; mobile count-only; add EventDetailQuickInfoSection, Google Calendar link + ICS, post-event host star rating, map marker click-to-center in EventDetailMapSection; wire all 7 EventDetail themes; npm run lint; update MERGE_INTEGRATION.md. Do not stop until every acceptance checkbox in §9 is satisfied.
```

---

*Τελευταία ενημέρωση: 30/05/2026 — βασισμένο σε audit Phase 15 + σύγκριση τοπικού `MyCalendarPageContent.tsx` vs ZIP extract.*
