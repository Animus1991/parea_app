# Local Project — Page-by-Page Design & Integration Audit

**Scope:** Features integrated in merge phases 1–14, audited for **Classic theme parity** (typography, radii, shadows, spacing) across all theme variants. **No feature removals.**

**Classic reference tokens** (`HomeClassic`, `EventDetailClassic`):

| Token | Classic value |
|-------|----------------|
| Card radius | `rounded-2xl` |
| Card shadow | `shadow-soft` |
| Section label | `text-[11px] font-bold tracking-wide` |
| Body (detail) | `text-[13px]`, heading `#111827` |
| Micro label | `text-[10px] font-bold tracking-wider` |
| List copy | `text-xs`, muted `text-gray-600` |
| Primary CTA | `bg-[#0E8B8D]` / `cyan-600`, `rounded-2xl` |
| Border (light) | `border-gray-100` |
| Accent icon bg | `bg-cyan-50`, `text-cyan-600` |

Shared: `useHomeTheme()` / `getHomeContrastTheme()` — chips & selects already use `rounded-2xl` + `shadow-soft` on Classic branch.

---

## Phase 10 (completed this session)

| Component | Role | Classic alignment |
|-----------|------|-------------------|
| `eventDetailDesignTokens.ts` | Central typography/radii for EventDetail blocks | ✅ Classic-first |
| `EventDetailSafetySection` | Verified event + Share Live Location | ✅ `rounded-2xl`, `text-[11px]`/`[13px]`, toast (not alert) |
| `EventDetailAdventureSection` | Hiking / Nearby escapes | ✅ `rounded-2xl` inner cards (was `rounded-xl` on themes) |
| `EventDetailReliabilityNote` | Trust bullet list (sibling section) | ✅ `rounded-2xl shadow-soft` shell |
| Themed detail **page shells** | Outer left column card | ✅ Normalized 6 themes → `rounded-2xl` + `shadow-soft` |

---

## 1. Home (9 variants)

### Integrated blocks

| Block | File | Classic parity | Notes |
|-------|------|----------------|-------|
| Stories | `EventStories` + `useStoryEvents` | ✅ | Uses theme hooks |
| Active Buddies | `ActiveBuddiesRail` | ✅ | `useClassicTokens` on Classic |
| Quick Actions | `HomeQuickActions` | ✅ Fixed | Feature icon `rounded-2xl` (was `xl`) |
| Hero | `HomeLoggedInHero` / `HomeGuestHero` | ✅ | Classic uses `rounded-2xl` cards |
| Filters | `HomeFiltersSection` | ✅ | `h.sectionLabel`, `rounded-2xl` selects |
| Personalization | `HomePersonalizationHint` + chips | ✅ | `text-[11px]` |
| Enrichment | `HomeThemedEnrichment` | ✅ | Stats, tip, seeking-host |
| Search dropdown | `HomeSearchDropdown` | ✅ Fixed | `rounded-2xl shadow-soft` |
| Welcome banner | `HomeOnboardingWelcomeBanner` | ✅ Fixed | Icon `rounded-2xl` |
| Mobile filters | `HomeMobileFilterSheet` | ✅ | Uses `FilterBottomSheet` |

### Remaining drift (Phase 11 — design pass)

| Item | Issue | Recommendation |
|------|--------|----------------|
| `HomeQuickActions` (themed branch) | — | ✅ Phase 11: `rounded-2xl` + `shadow-soft` |
| `HomeLoggedInHero` contrast | — | ✅ Phase 11: CTA `rounded-2xl` |
| `ActiveBuddiesRail` | — | ✅ Phase 11: `rounded-2xl shadow-soft` |
| Themed `Home*.tsx` shells | Hero padding/colors differ | Keep accent hues; unify **sizes** only |

**Verdict:** Functional merge complete; minor radius drift on non-Classic hero CTAs only.

---

## 2. Calendar (7 wrappers + `MyCalendarPageContent`)

| Feature | Status | Classic parity |
|---------|--------|----------------|
| Day stories + `StoryViewer` | ✅ | `usePageContrast` |
| Hourly schedule | ✅ | `CalendarHourlySchedule` |
| Geometric cells | ✅ | clipPath thumbnails |
| Bulk ICS | ✅ | `calendarIcs.ts` |

**Verdict:** Unified body is theme-aware; wrappers are thin — **OK**.

---

## 3. EventDetail (7 themes + shared sections)

### Shared stack (order inside left card)

1. `EventDetailMetaSection`
2. `EventDetailMapSection`
3. `EventDetailAboutSection`
4. `EventDetailOrganizerSection`
5. `EventDetailSafetySection` ← **Phase 10**
6. `EventDetailAdventureSection` ← **Phase 10**

**Outside card:** `EventDetailReliabilityNote` ← **Phase 10**

### Right column (unchanged)

Groups, filters, waitlist, mobile CTA — still per-theme pages.

### Design audit per section

| Section | `rounded-2xl` | `text-[11px]` labels | Theme accent |
|---------|---------------|----------------------|--------------|
| Meta | ✅ | ✅ | Per accent link color |
| Map | ✅ map frame | ✅ | Pin colors per accent |
| About | ✅ | ✅ | Tag/badge hover per accent |
| Organizer | ✅ card | ✅ | Avatar ring per accent |
| Safety | ✅ | ✅ | CTA uses accent button |
| Adventure | ✅ inner cards | ✅ `text-[10px]` micro | Emerald/amber preserved |
| Reliability | ✅ outer shell | ✅ | List uses gray scale |

### Remaining drift

| Item | Location | Fix |
|------|----------|-----|
| Group capacity banner | `rounded-lg` inner chip | Acceptable; optional `rounded-2xl` |

**Verdict:** Phases 10–11 complete; left + right EventDetail shells Classic-normalized.

---

## 4. Categories (7 wrappers + `CategoriesPageContent`)

| Feature | Status | Classic parity |
|---------|--------|----------------|
| Group tabs (Explore / Social / …) | ✅ Phase 11 | `rounded-2xl` tab pills |
| URL `?c=` category deep link | ✅ | Syncs with store |
| Weekend date filter | ✅ | Select `rounded-2xl shadow-soft` |
| Trending sort + trending row | ✅ | Hero + cards via `usePageContrast` |
| 20-category catalog | ✅ | `categoriesCatalog.ts` |

**Verdict:** Functional ZIP parity on shared body; theme hue via `usePageContrast` — **OK**.

---

## 5. Onboarding → Home bridge

| Feature | File | Classic parity |
|---------|------|----------------|
| 7-step flow | `OnboardingClassic` | ✅ Native Classic styling |
| `discoveryPrefs` | store + chips on Home | ✅ `text-[11px]` hints |
| Welcome + URL filters | `onboardingHomeBridge` | ✅ |

**Verdict:** **OK** — no regression.

---

## 5. Login (7 themes)

| Feature | Status |
|---------|--------|
| `LoginGuestHeroStrip` | ✅ Added to all themed Login pages |

**Verdict:** **OK**.

---

## 7. Settings

| Feature | Status |
|---------|--------|
| `HomeHeroModeSetting` | ✅ Persists `homeHeroMode` |

**Verdict:** **OK**.

---

## 8. Preserved local-only (not subject to ZIP merge)

| Area | Status |
|------|--------|
| `ChallengesClassic` | ✅ Untouched |
| `GroupChatClassic` + themed chats | ✅ Untouched |
| Lazy `App.tsx` + guards | ✅ Untouched |
| ~149 theme page files | ✅ Architecture intact |

---

## 9. Cross-cutting i18n & a11y

- All new Phase 10 strings use `t('Ελληνικά', 'English')` ✅
- Touch targets: safety CTA `py-2 px-4`, mobile EventDetail CTAs `min-h-11` ✅

---

## Phase 12 (completed)

| Page | Shared component | Notes |
|------|------------------|-------|
| PostEventFeedback | `PostEventFeedbackPageContent` | Store submit + `eventId` route; Classic `rounded-2xl` |
| OrganizerDashboard | `OrganizerDashboardPageContent` | Chart + 2 local events preserved |

## Phase 13 (completed)

| Item | Status |
|------|--------|
| `MoodSelector` on Home (7 variants) | ✅ Filters feed + scroll to `#home-filters` |
| Calendar / StoryViewer radii | ✅ `rounded-2xl` pass |

## Phase 14 (completed)

| Item | Status |
|------|--------|
| URL `?mood=` deep links | ✅ `useHomeUrlFilters` + `homePathWithMood()` |
| `EventCard` CTA radii | ✅ `rounded-2xl` + `shadow-soft` on action buttons |

## Phase 15+ backlog (optional)

| Priority | Item |
|----------|------|
| Low | `PlatformEventBanner` CTA radius alignment |

**Never merge:** ZIP stubs (Challenges, Leaderboard, HomeActiveBuddies, OrganizerProfile maintenance pages).

---

## Verification

```bash
npm run lint
```

Manual: open EventDetail (Classic + VibrantDark) → safety toggle, adventure on Hiking event, reliability list below card.

*Audit date: 30/05/2026.*

---

## Πλήρης επανέλεγχος πλοήγησης (Φάση 15 review)

Δείτε **[NAVIGATION_PAGE_AUDIT.md](./NAVIGATION_PAGE_AUDIT.md)** — σελίδα-σελίδα για όλες τις ενότητες του AppShell (Εξερεύνηση, Εμπειρία μου, Κοινότητα, Διοργάνωση, Εμπιστοσύνη, Λογαριασμός, Onboarding), με βαθμολογία Classic parity, gaps και προτεραιότητες Phase 15+.
