# Nakamas — parea_app

Social experience companion for Athens, Greece. Matches verified users into small groups (3–5 people) for real-world events: concerts, hikes, board games, and more.

## Run & Operate

- `cd parea_app && npm install` — install dependencies (first time)
- `cd parea_app && npm run dev` — start the Vite dev server (port 5173 by default)
- `cd parea_app && npm run build` — production build
- `cd parea_app && npm run typecheck` — TypeScript check (if script exists)

## Stack

- React 19 + Vite 6, TypeScript 5.8
- Tailwind CSS v4
- Zustand for state management
- React Router v7
- Framer Motion (motion/react)
- Radix UI primitives
- react-virtuoso (virtualized message list)
- react-leaflet + @vis.gl/react-google-maps (dual map system)
- date-fns, QRCode (qrcode.react)
- Ticketmaster Discovery API integration

## Where things live

- `parea_app/src/store/index.ts` — single Zustand store (all app state + actions)
- `parea_app/src/types/index.ts` — all TypeScript types (Event, User, Group, etc.)
- `parea_app/src/data/` — mock data (mockEvents, mockUsers, mockGroups, mockNotifications)
- `parea_app/src/pages/` — page dispatcher files + 7 theme variants per page
- `parea_app/src/components/` — shared components (EventCard, AppShell, Badge, etc.)
- `parea_app/src/services/eventApi.ts` — Ticketmaster API integration
- `parea_app/src/lib/i18n.tsx` — bilingual Greek/English i18n via `t(greek, english)` calls
- `parea_app/docs/PRD.md` — full product requirements document
- `parea_app/docs/ARCHITECTURE.md` — intended backend architecture (Firestore + microservices)

## Architecture decisions

- **Pure frontend SPA** — no backend yet; all data is mock. The `docs/ARCHITECTURE.md` shows the intended backend (Firebase/Firestore + Node microservices).
- **7-theme system** — classic, vibrant, bento, neon + dark variants. Each page has 7 variant files (e.g. `HomeClassic.tsx`, `HomeVibrant.tsx`). A dispatcher file (`Home.tsx`) reads the Zustand `theme` state and renders the correct variant.
- **Trust tiers** — `1_explorer`, `2_confirmed`, `3_high_trust`. Controls access to events and group features.
- **Dual map system** — EventCard uses react-leaflet (OpenStreetMap, no key needed). EventDetail uses @vis.gl/react-google-maps (requires `VITE_GOOGLE_MAPS_API_KEY`).
- **Contract-first i18n** — all strings use `t(greek, english)` inline; no separate translation file needed.

## Product

- Event discovery with category/tag/price/date/radius filters and ML-style match score
- Small group formation (3–6 people) with group discount engine
- Ephemeral group chat (virtualized, auto-deletes 24h after event)
- Live location sharing + SOS flare in group chat
- ICS calendar export, QR code event sharing
- Post-event feedback & reliability score system
- Ticketmaster API integration for real Athens events

## User preferences

- **No UI/UX style changes** — only optimization and bug fixes are allowed. Preserve existing visual design exactly.

## Gotchas

- `VITE_TICKETMASTER_API_KEY` — optional; app falls back to mock events silently if not set.
- `VITE_GOOGLE_MAPS_API_KEY` — optional; EventDetail shows a styled placeholder map if missing.
- `SESSION_SECRET` env var exists in Replit but has no backend to use it (leftover).
- The theme dispatcher files (`Home.tsx`, `Login.tsx`, etc.) are minified single-liners by convention — do not reformat them.
- `mockDistances` in `HomeClassic.tsx` are static (no real geolocation). The radius filter uses these hardcoded values.

## Pointers

- See `parea_app/docs/PRD.md` for the full product specification and trust tier rules.
- See `parea_app/docs/ARCHITECTURE.md` for the intended backend architecture diagram.
