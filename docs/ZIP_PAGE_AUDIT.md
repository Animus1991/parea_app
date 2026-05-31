# ZIP ↔ Local Page-by-Page Audit

**ZIP source:** `c:\Users\anast\Downloads\parea-zip-extract\` (export `parea---event-companion-app.zip`, ~01/06/2026)  
**Local:** `parea_app` after commit `774a163` (phases 1–9 integrated, pushed to `origin/main`)  
**Method:** Compare ZIP `src/pages/*.tsx` + `*PageContent.tsx` vs local themed routers + shared components. **Additive-only** recommendations.

---

## Executive summary

| Area | Status |
|------|--------|
| **Home, Calendar, EventDetail core** | ZIP advantages largely **merged** (phases 1–9) |
| **Challenges / Leaderboard / HomeActiveBuddies** | ZIP = stubs → **keep local** |
| **GroupChat, Onboarding, Plans** | **Local ≥ ZIP** |
| **Remaining ZIP wins** | EventDetail safety/live-location block; Categories UX (group tabs + URL); optional MoodSelector; shared adventure/reliability blocks |
| **Architecture** | Keep 9-theme routers + lazy `App.tsx` — do **not** replace with ZIP single-file pages |

---

## Route map (functional pages)

| Route | ZIP page | Local entry | Merge status |
|-------|----------|-------------|--------------|
| `/` | `Home.tsx` (605 ln) | `Home.tsx` → 9× `Home*` | ✅ Phases 1–2.5,7–8 |
| `/login` | `Login.tsx` | 9× `Login*` + `LoginGuestHeroStrip` | ✅ Mostly aligned |
| `/events/:id` | `EventDetail.tsx` → `EventDetailPageContent` | 7× `EventDetail*` + shared sections | ✅ Phases 3,5,8–9; ⚠️ see gaps below |
| `/agenda` (local) / `/calendar` (ZIP) | `MyCalendar.tsx` | `MyCalendar.tsx` + `MyCalendarPageContent` | ✅ Phase 1,4,5 |
| `/categories` | `CategoriesPageContent` | 7× `Categories*` (~217 ln Classic) | ⚠️ ZIP richer (tabs, URL `?c=`) |
| `/nearby` | `NearbyGroupsPageContent` (371 ln) | `NearbyGroupsClassic` (~733 ln) | ✅ Local likely ≥ ZIP (map/leaflet) |
| `/connections` | `ConnectionsPageContent` | `MyConnections` → shared content | ✅ Same pattern |
| `/chats` | `Inbox.tsx` (109 ln) | 7× `Inbox*` | ✅ Themed parity |
| `/chat/:id` | `GroupChat.tsx` (163 ln) | `GroupChatClassic` (~1720 ln) | ✅ **Local far superior** |
| `/onboarding` | `Onboarding.tsx` (187 ln) | `OnboardingClassic` (421 ln, 7 steps) | ✅ **Local superior** |
| `/challenges` | **stub** | `ChallengesClassic` (~303 ln) | ✅ **Never merge ZIP stub** |
| `/leaderboard` | **stub** | `LeaderboardClassic` (~314 ln) | ✅ **Never merge ZIP stub** |
| `/plans` | `Plans.tsx` (126 ln, unified) | `PlansClassic` (~368 ln) | ✅ **Local superior** |
| `/history` | `HistoryPageContent` | `History.tsx` → shared | ✅ Aligned |
| `/saved` | `SavedEventsPageContent` | `SavedEvents.tsx` → shared | ✅ Aligned |
| `/history/feedback/:id` | `PostEventFeedbackPageContent` (230 ln) | `PostEventFeedbackClassic` (~158 ln) | ⚠️ ZIP slightly richer |
| `/create` | `CreateEventFlowContent` | 7× `CreateEventFlow*` | 🔍 Spot-check per theme |
| `/manage` | `OrganizerDashboardPageContent` (248 ln) | `OrganizerDashboardClassic` (~207 ln) | ⚠️ Minor ZIP extras |
| `/profile`, `/settings`, `/trust`, `/wallet`, `/verification`, `/help`, `/notifications`, `/achievements`, `/report`, `/admin` | `*PageContent` wrappers | Same wrapper + local `*PageContent` | ✅ Mostly aligned |
| `HomeActiveBuddies` | **stub** | Full `HomeActiveBuddies` theme | ✅ **Never merge ZIP stub** |
| `OrganizerProfile` (ZIP page) | **stub** | 7× `OrganizerProfile*` | ✅ Keep local |

---

## Page-by-page detail

### ✅ Fully integrated or local clearly ahead

1. **Home** — ZIP: stories, Active Buddies, quick actions, filters. Local: all of the above **plus** 9 themes, `useStoryEvents`, `useHomeExternalEvents`, seeking-host, Quick Stats, Daily Tip, URL filters, geo radius, personalization (phases 1–8).
2. **MyCalendar** — ZIP smart calendar → `MyCalendarPageContent` + `StoryViewer` + hourly + ICS (phases 1,4,5).
3. **EventDetail (partial)** — Share/QR/ICS/save, map, meta, about, organizer, groups, match badge (phases 3,5,8–9).
4. **GroupChat** — Ephemeral chat, SOS, icebreakers, `LiveEventTracker` — **local only**.
5. **Onboarding** — 7 steps, `discoveryPrefs`, Home bridge — **local only**.
6. **Challenges / Leaderboard** — ZIP maintenance stubs — **local full flows**.
7. **Plans** — Local themed Plans with tabs, leave confirm — **≥ ZIP**.
8. **NearbyGroups** — Local Leaflet map experience — **≥ ZIP** (verify UX per theme).
9. **App shell** — Local: lazy routes, `ErrorBoundary`, `/leaderboard`, `/challenges`, `/onboarding` — **keep**.

### ⚠️ ZIP still ahead (recommended Phase 10+)

#### A. EventDetail — Safety & live location (high value)

**ZIP:** `EventDetailPageContent.tsx` — block «Επαληθευμένη Εκδήλωση» + **Share Live Location** with `updateMemberLocation` (lines ~650–695).

**Local:** Share live location exists on `EventCard` and `GroupChat*`, **not** on EventDetail pages.

**Recommendation (additive):** `EventDetailSafetySection.tsx` (accent + `darkSurface`) wired after `EventDetailOrganizerSection` on all 7 themes. Reuse store `updateMemberLocation`; only show when user is in a group for this event.

#### B. EventDetail — Adventure + reliability blocks (medium)

**ZIP:** N/A (inline in themed local pages today).

**Local:** Duplicated across 7× `EventDetail*.tsx` — «Λεπτομέρειες Περιπέτειας» + «Γιατί αυτή η ομάδα είναι αξιόπιστη».

**Recommendation:** `EventDetailAdventureSection` + `EventDetailReliabilityNote` (phase 10 in prior plan) — reduces duplication, zero feature loss.

#### C. Categories (medium)

**ZIP `CategoriesPageContent` (364 ln):**

- Category **group tabs** (Arts, Culture, Activities, …)
- URL sync `?c=` via `useSearchParams`
- **Weekend** date filter + **Trending** sort
- Grouped grid layout

**Local `CategoriesClassic` (~217 ln):** Flat category grid, filters, no group tabs/URL.

**Recommendation:** Extract `CategoriesPageContent` with `usePageContrast` / `useHomeTheme` tokens; keep 7 themed wrappers as thin shells (same pattern as calendar).

#### D. PostEventFeedback (low–medium)

**ZIP:** 230 ln unified flow. **Local:** ~158 ln Classic with XP banner — comparable; ZIP may have extra steps/fields.

**Recommendation:** Diff `PostEventFeedbackPageContent` vs `PostEventFeedbackClassic`; port missing steps into shared `PostEventFeedbackPageContent` + themed wrapper.

#### E. OrganizerDashboard (low)

**ZIP:** 248 ln analytics-style blocks. **Local:** ~207 ln Classic — close; port any missing KPI cards into shared content.

#### F. MoodSelector (optional / low)

**ZIP component exists** (`MoodSelector.tsx`) but **not used** in ZIP `Home.tsx`.

**Recommendation:** Optional Home section below filters — maps mood → tag/category filters via `homeDeepLinks`. Skip if product does not want mood UX.

#### G. Route alias (polish)

ZIP links `/calendar`; local uses `/agenda`. Add redirect route `/calendar` → `/agenda` in `App.tsx` (no removal).

---

## ZIP stubs — do not merge

| ZIP file | Content |
|----------|---------|
| `Challenges.tsx` | «Under maintenance» |
| `Leaderboard.tsx` | «Under maintenance» |
| `HomeActiveBuddies.tsx` | «Under maintenance» |
| `OrganizerProfile.tsx` | «Under maintenance» |

---

## Explicitly do not merge

- ZIP `App.tsx` (eager imports, no lazy, no onboarding route)
- Single ZIP `Home.tsx` replacing 9 Home variants
- ZIP `EventDetailPageContent` as full replacement (loses per-theme layout)
- ZIP stubs for Challenges/Leaderboard

---

## Suggested phase plan (post–phase 9)

| Phase | Scope | Risk |
|-------|--------|------|
| **10** | `EventDetailSafetySection`, `EventDetailAdventureSection`, `EventDetailReliabilityNote` | Low |
| **11** | Shared `CategoriesPageContent` + themed wrappers | Medium |
| **12** | PostEventFeedback + OrganizerDashboard diff merge | Low |
| **13** | `/calendar` alias, optional `MoodSelector` on Home | Low |

---

## Verification checklist (after each phase)

- [ ] `npm run lint` passes
- [ ] All 9 Home themes render stories + filters + buddies
- [ ] All 7 EventDetail themes: meta → map → about → organizer → groups column
- [ ] `ChallengesClassic` / `GroupChatClassic` unchanged
- [ ] Lazy `App.tsx` + onboarding guard intact

*Audit date: 30/05/2026. ZIP extract path: `parea-zip-extract`.*
