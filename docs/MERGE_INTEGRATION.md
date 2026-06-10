# Selective ZIP → Local Integration Log

**Strategy:** Additive merge only. Local multi-theme architecture (~149 theme pages) is preserved.

## Completed phases

### Phase 1 — High value, low risk
- `MyCalendarPageContent` — smart calendar (day stories, hourly view, geometric thumbnails)
- `ActiveBuddiesRail` on all Home variants
- `docs/PLATFORM_FEATURES.md`
- `useStoryEvents`, `useHomeExternalEvents`, `runtimeMode.ts`

### Phase 2 — Home UX from ZIP
- `HomeQuickActions` (4 shortcuts + 3 feature cards)
- `HomeLoggedInHero` / `HomeGuestHero` + `homeHeroMode` store
- `smartBackNavigation` on EventDetail

### Phase 2.5 — Classic parity on themed Home
- `useHomeUrlFilters`, `useHomeGeoDistance`, `useHomeEventFeed`
- `HomeFiltersSection`, `HomeMobileFilterSheet`, `HomeThemedEnrichment`
- Shared hooks/libs for feed, categories, greeting, pending feedback

### Phase 3 — Event detail & search
- `eventIcs.ts`, `useEventDetailShare`, `EventDetailQrModal`
- `HomeSearchDropdown` (recent + popular)
- Shared share/ICS/QR on all EventDetail theme pages

### Phase 4 — Cohesion & polish
- `useHomeScrollToFilters` + `#home-filters` anchor; Categories shortcut scrolls on Home
- `useHomeUrlFilters` — browser back/forward sync for filter params
- `HomeHeroModeSetting` in Settings (persists with Zustand)
- `calendarIcs.ts` — shared bulk `.ics` export for calendar
- `LoginGuestHeroStrip` on all themed Login pages
- Calendar day-story modal respects `usePageContrast` (light + dark themes)

### Phase 5 — Cross-feature unity
- `storyEventOrdering.ts` — shared sort for Home stories + calendar day stories
- `useUserCalendarEvents` — single source for calendar grid / ICS / hourly view
- Calendar 1-click day → **`StoryViewer`** (same immersive UX as Home rail) + «Πρόγραμμα Ημέρας»
- `CalendarHourlySchedule` — extracted hourly modal (theme-aware)
- `useEventDetailActions` + `EventDetailActionBar` — share/QR/ICS/save on all 7 EventDetail themes; **save syncs with `savedEvents`** (story «seen» rings)
- `EventDetailActionBar` `darkSurface` for VibrantDark / NeonDark / BentoDark

### Phase 6 — Onboarding bridge & EventDetail groups
- `onboardingHomeBridge.ts` — interests → Home `cat`, location → `dist`, post-onboarding URL
- `OnboardingClassic` saves `discoveryPrefs` on user + redirects to filtered Home
- `useOnboardingWelcome` + `HomeOnboardingWelcomeBanner` on Classic + themed Home
- `EventDetailGroupCard` — shared group list UI (7 themes); photo reveal parity on all variants
- `scripts/patch-event-detail-groups.mjs` — maintenance helper for themed EventDetail wrappers

### Phase 7 — Personalization, maps & deep links
- `homePersonalization.ts` — interest match + «Για Σένα» scoring (`discoveryPrefs` aware)
- `homeDeepLinks.ts` — `homePathWithCategory` / `Search` / `Tag` for URL filter sync
- `homeEventFeed.ts` — improved For You filter/sort using personalization scores
- `HomePersonalizationHint` in `HomeFiltersSection` (all 9 Home variants via shared section)
- `EventDetailMapSection` — shared Google Maps block (7 themes, `darkSurface` on dark variants)
- `ActiveBuddiesRail` — online dot (connections + activity heuristic)
- Tag clicks on EventDetail → `homePathWithSearch()` (all 7 themed pages)
- `scripts/patch-event-detail-maps.mjs` — map block extraction helper

### Phase 8 — Discovery prefs UI & EventDetail about block
- `discoveryPrefsLabels.ts` + `HomeDiscoveryPrefsChips` — read-only onboarding preference chips on Home
- `EventDetailAboutSection` — shared description, official link, tag rail (theme tokens + dark surface)
- `scripts/patch-event-detail-about.mjs` — about-block extraction helper
- `HomePersonalizationHint` shows when interests or discovery prefs exist (localized labels)

### Phase 9 — EventDetail meta & organizer (shared sections)
- `EventDetailMetaSection` — date, time, location, participation rules (7 themes + `darkSurface`)
- `EventDetailOrganizerSection` — organizer card with trust/reliability badges, profile link
- `eventParticipationRule.ts` — i18n participation rules via `trust.ts` tier labels
- Organizer bio fallback uses **live hosted event count** from store (replaces hardcoded «12 events»)
- `scripts/patch-event-detail-meta-organizer.mjs` — meta + organizer extraction helper
- Themed pages keep adventure block, reliability note, groups column — **no removals**

See **`docs/ZIP_PAGE_AUDIT.md`** for full page-by-page ZIP comparison and phases 10+ backlog.

### Phase 10 — EventDetail safety, adventure, reliability (Classic-normalized)
- `EventDetailSafetySection` — verified event + Share Live Location (`toast`, group membership guard)
- `EventDetailAdventureSection` — Hiking / Nearby escapes (`rounded-2xl` inner cards)
- `EventDetailReliabilityNote` — trust bullets (sibling section, Classic shell)
- `eventDetailDesignTokens.ts` — shared typography/radii (Classic-first across accents)
- Themed EventDetail left-column shells → `rounded-2xl` + `shadow-soft` (6 non-Classic pages)
- Home polish: `HomeQuickActions`, `HomeSearchDropdown`, `HomeOnboardingWelcomeBanner` radii
- See **`docs/LOCAL_DESIGN_AUDIT.md`** for local page-by-page design audit

### Phase 11 — Design polish & Categories (functional)
- `eventDetailDesignTokens.ts` — `getEventDetailContentTokens`, groups sidebar shell/heading helpers
- `EventDetailMetaSection` / `EventDetailAboutSection` — DRY via content tokens (`rounded-2xl`, `shadow-soft`)
- EventDetail **right column** groups card → `rounded-2xl shadow-soft` on all 7 themes (`patch-event-detail-groups-sidebar.mjs`)
- `EventDetailGroupCard` / `EventDetailOrganizerSection` — inner cards `rounded-2xl shadow-soft`
- `HomeQuickActions` themed branch — `rounded-2xl`, `shadow-soft`, Classic typography
- `HomeLoggedInHero` CTA, `ActiveBuddiesRail` shell — Classic radii/shadows
- **Categories:** `categoriesCatalog.ts`, `CategoriesPageContent` (group tabs, `?c=`, Weekend filter, Trending sort); 7 thin `Categories*.tsx` wrappers
- **Route:** `/calendar` → `/agenda` redirect (additive)

### Phase 12 — PostEventFeedback & OrganizerDashboard (shared content)
- `PostEventFeedbackPageContent` — ZIP parity: event context card, mood grid, dual star ratings, attendance/safety toggles, comment counter, XP banners; wired to `useParams` + `submitFeedback` + store events
- `OrganizerDashboardPageContent` — ZIP parity: hero workspace, stats, traffic chart (recharts), fill rate + satisfaction, quick-create templates, group management UI
- **Preserved local:** 2nd organizer event (Hike on Hymettus), Edit/Archive actions, unread group message dot
- All 7 themed wrappers per page → thin imports of shared content (`usePageContrast`)

### Phase 14 — Mood URL deep links & EventCard CTA polish
- `?mood=chill|active|social|learn|explore` synced via `useHomeUrlFilters` (back/forward + shareable links)
- `homePathWithMood()` in `homeDeepLinks.ts`
- `EventCard` primary CTAs → `rounded-2xl` + `shadow-soft` (tracking, host, arrival, location actions)

### Phase 13 — MoodSelector & calendar visual pass
- `MoodSelector` + `homeMoodConstants` + `useHomeMoodFilter` — mood chips filter feed by category groups; wired in `HomeFiltersSection` on all 7 Home variants via `useHomeEventFeed`
- Selecting a mood clears category/tag filters, scrolls to `#home-filters`; category/tag selection clears mood
- `MyCalendarPageContent` / `CalendarHourlySchedule` / `StoryViewer` — `rounded-xl`/`rounded-3xl` → `rounded-2xl`, `shadow-soft` where applicable

### Phase 15 — NearbyGroups, History, Plans, Inbox (shared content)
- **`NearbyGroupsPageContent`** — ZIP Leaflet map + filters (All/Available/Full/My Events), satellite layer, resizable sidebar, intersection observer; sidebar list uses `filteredLocalGroups`; Classic tokens (`rounded-2xl`, `shadow-soft`); all 7 `NearbyGroups*.tsx` → thin wrappers
- **`HistoryPageContent`** — removed mock `feedbackStatus`; past events from store groups + `feedbackSubmitted`; `rounded-2xl` inputs/thumbnails
- **`PlansPageContent`** — extracted from `PlansClassic` (not ZIP subscription `Plans.tsx`); upcoming/pending/past tabs, leave group, feedback CTA; 7 thin wrappers
- **`InboxPageContent`** — hybrid: store-driven groups + active/past tabs, typing/pin UX; navigates to `/chat/:groupId`; messages/notifications tabs
- **`TrustCenterPageContent`** — tier label i18n via `tierLabelEl` / `tierLabelEn`

### Phase 16+ — Shared page content & polish
- `CreateEventFlowPageContent` — 7× create-flow themes re-export shared content (`usePageContrast` / `useProfileContrast`, `rounded-2xl` inputs)
- `ReportIssuePageContent` — 7× report themes re-export shared content
- Saved / Help / Profile / Wallet — form `select` & `input` use `rounded-2xl`
- `HOME_TYPO` (`src/lib/homeTypography.ts`) — fractional scale on 6 non-Classic Home variants

### Phase 16 — Planned Events Calendar (web/mobile)
- `PlannedEventsCalendar`, `CalendarDayCell`, `DayEventsStoriesModal`, `DailyScheduleView`
- `usePlannedEvents` + `mockCalendarPlan` demo seed (June 2026, user `u1`)
- Web/tablet: multi-event cell layouts; mobile: count + category dots
- Single tap → day stories; double tap / button → hourly schedule

### ZIP verification — Home, Calendar, Trust (no regressions)
- **Home (`/`)** — local 9× themed Home is a strict superset of ZIP `Home.tsx` (mood filters, personalization, Active Buddies, etc.); do not replace with ZIP single page
- **Calendar (`/agenda`)** — `MyCalendarPageContent` has ZIP-equivalent features via refactor (week/month, hourly modal, ICS, stories, `usePageContrast`)
- **Trust (`/trust`)** — ~parity with ZIP; tier labels now localized

## Explicitly not merged (by design)
- Replacing 9× Home with single ZIP `Home.tsx`
- ZIP `App.tsx` (loses lazy routes + onboarding guard)
- ZIP Challenges/Leaderboard stubs

## Local-only (keep)
- Full `ChallengesClassic`, `GroupChatClassic`, `OnboardingClassic`
- 9-theme routing for Home, Calendar wrappers, EventDetail variants
- Lazy `App.tsx` + `ErrorBoundary`
