# System Architecture

## Overview
The architecture is designed to manage event discovery, secure group formation, strict role-based access control (Tiers), and integrations with external ticketing APIs.

### Client prototype (current repo)
See also `docs/PLATFORM_FEATURES.md` for the full feature roadmap (smart calendar, stories, trust).

The Vite app under `src/` runs **mock-first**: Zustand seeds users/events/groups; optional Ticketmaster merge uses ids prefixed `tm_` (see `src/lib/runtimeMode.ts`).

**Home (9 theme variants):** Each `Home*.tsx` keeps its hero/visual identity; shared behaviour lives in hooks and components:
- `useHomeExternalEvents()` — central Ticketmaster fetch
- `useStoryEvents()` — story rail ordering (seeking-host → trending → date)
- `useHomeEventFeed()` + `useHomeUrlFilters()` + `useHomeGeoDistance()` — filters, URL sync, radius with geolocation
- `HomeFiltersSection`, `HomeMobileFilterSheet`, `HomeThemedEnrichment`, `ActiveBuddiesRail`, `HomeQuickActions`, `HomeSearchDropdown` (recent + popular searches)
- `HomePersonalizationHint` + `HomeDiscoveryPrefsChips` — «Για Σένα» context from interests + `discoveryPrefs` (`homePersonalization.ts`)
- `useHomeScrollToFilters` + `#home-filters` — Categories shortcut scrolls; URL filter sync on back/forward
- `homeHeroMode` in store + Settings (`HomeHeroModeSetting`) and inline `HomeHeroModeBar`

**Calendar:** `MyCalendar.tsx` routes to theme wrappers; body is unified `MyCalendarPageContent` (day stories, hourly view, geometric cell thumbnails). Bulk export via `lib/calendarIcs.ts`; per-event via `lib/eventIcs.ts`.

See `docs/MERGE_INTEGRATION.md` for ZIP merge phase log.

**Event detail (7 theme variants):** Themed pages remain separate; shared logic includes `navigateBack()`, `useEventDetailActions()`, `EventDetailActionBar`, `EventDetailQrModal`, `downloadEventIcs()`, `EventDetailMetaSection`, `EventDetailMapSection`, `EventDetailAboutSection`, `EventDetailOrganizerSection`, `EventDetailGroupCard`. Tag/search deep links use `homeDeepLinks.ts`; participation rules use `eventParticipationRule.ts` + `trust.ts`.

**Stories & calendar:** `sortEventsForStories()` powers Home `EventStories` and calendar day taps; calendar reuses `StoryViewer` + `CalendarHourlySchedule`.

**Onboarding → Home:** `OnboardingClassic` (7 steps, local-only richness) redirects with URL filters; `HomeOnboardingWelcomeBanner` confirms tailoring. Full flow preserved; not replaced by ZIP 3-step onboarding.

**Event detail groups:** `EventDetailGroupCard` shared across themed pages (thin `Group` wrapper per theme file).

Dev-only scripts live in `scripts/`; legacy AI Studio repair tools in `app/applet/` are not part of the build. 

## Mermaid System Architecture Diagram

```mermaid
graph TD
    %% Client Layer
    subgraph Client ["Client App (React + Vite)"]
        UI[User Interface - Event/Group Dashboards]
        State[State Management / Caching]
        AuthClient[Authentication Client]
        Routing[App Routing]
        UI --> State
        UI --> AuthClient
        UI --> Routing
    end

    %% API Gateway Layer
    subgraph APIGateway ["API Gateway & Services"]
        Route[Router / Load Balancer]
        AuthProxy[Auth Middleware]
        Rate[Rate Limiting]
        Route --> AuthProxy
    end

    %% Backend Services Layer
    subgraph Backend ["Backend Microservices (Node/Express)"]
        EventSvc[Event Service]
        GroupSvc[Group Matching Service]
        ScoreSvc[Reliability & Trust Service]
        PaymentSvc[Payment & Discount Engine]
        ChatSvc[Ephemeral Chat Service]
        
        AuthProxy --> EventSvc
        AuthProxy --> GroupSvc
        AuthProxy --> ScoreSvc
        AuthProxy --> PaymentSvc
        AuthProxy --> ChatSvc
    end

    %% Persistence Layer
    subgraph Persistence ["Data Persistence (Firebase/Firestore)"]
        DB[(Firestore DB)]
        Storage[(Cloud Storage - Avatars/Selfies)]
        EventSvc --> DB
        GroupSvc --> DB
        ScoreSvc --> DB
        ChatSvc --> DB
        ScoreSvc --> Storage
    end

    %% External Systems Layer
    subgraph External ["External Third-Party APIs"]
        Ticketing[Ticketing Partners API e.g. more.com]
        Identity[Identity Verification API e.g. Onfido]
        Stripe[Stripe Payments]
        Map[Mapping Service API]
    end

    %% Cross-Domain Interactions
    Client --> Route
    PaymentSvc --"Process Payments & Affiliates"--> Stripe
    PaymentSvc --"Confirm Tickets/Discounts"--> Ticketing
    ScoreSvc --"Selfie/ID Checks"--> Identity
    EventSvc --"Geo-Spatial Query"--> Map
    
    %% Event Matching Flow
    GroupSvc -.->|"Evaluates Tier Rules"| ScoreSvc
    PaymentSvc -.->|"Applies Group Discount"| GroupSvc

    %% Internal Structure Notes
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px;
    classDef api fill:#fef08a,stroke:#ca8a04,stroke-width:2px;
    classDef backend fill:#dcfce7,stroke:#16a34a,stroke-width:2px;
    classDef database fill:#fce7f3,stroke:#db2777,stroke-width:2px;
    classDef external fill:#f3f4f6,stroke:#4b5563,stroke-width:2px;

    class UI,State,AuthClient,Routing client;
    class Route,AuthProxy,Rate api;
    class EventSvc,GroupSvc,ScoreSvc,PaymentSvc,ChatSvc backend;
    class DB,Storage database;
    class Ticketing,Identity,Stripe,Map external;
```
