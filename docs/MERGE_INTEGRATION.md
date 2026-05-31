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

## Explicitly not merged (by design)
- Replacing 9× Home with single ZIP `Home.tsx`
- ZIP `App.tsx` (loses lazy routes + onboarding guard)
- ZIP Challenges/Leaderboard stubs

## Local-only (keep)
- Full `ChallengesClassic`, `GroupChatClassic`, `OnboardingClassic`
- 9-theme routing for Home, Calendar wrappers, EventDetail variants
- Lazy `App.tsx` + `ErrorBoundary`
