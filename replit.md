# Nakamas

Athens social event discovery app — find small groups for shared experiences.

## Run & Operate

- `pnpm --filter @workspace/nakamas run dev` — run the Nakamas web app (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + TypeScript
- Routing: React Router DOM v7 (BrowserRouter)
- Styling: Tailwind CSS v4 (`@import "tailwindcss"` + `@theme {}` in CSS — no tailwind.config.js)
- Icons: lucide-react
- Dates: date-fns
- Utilities: clsx, tailwind-merge
- QR codes: qrcode.react
- Virtual lists: react-virtuoso
- Maps: @vis.gl/react-google-maps (optional — needs `VITE_GOOGLE_MAPS_PLATFORM_KEY`)
- Animations: framer-motion
- All data is mock (no backend)

## Where things live

- `artifacts/nakamas/src/` — all source code
  - `App.tsx` — React Router routes (25 pages)
  - `main.tsx` — BrowserRouter wrapper + Google Maps error suppression
  - `index.css` — Tailwind v4 config + Google Fonts (Inter) + brand tokens
  - `types/index.ts` — shared TypeScript types
  - `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
  - `components/layout/AppShell.tsx` — sidebar + top nav shell
  - `components/common/` — Badge, Button, Card, ErrorBoundary, Skeleton
  - `components/events/EventCard.tsx` — event listing card
  - `components/groups/JoinGroupFlow.tsx` — multi-step join flow modal
  - `data/` — mockEvents, mockGroups, mockUsers (currentUser = mockUsers[0])
  - `pages/` — 25 page components (Home, EventDetail, NearbyGroups, etc.)

## Architecture decisions

- Pure frontend with mock data — no API server needed
- Tailwind CSS v4 used without a config file; brand colors defined in `@theme {}` block in `index.css`
- NearbyGroups page uses a resizable sidebar with a CSS variable `--sidebar-width` for drag-to-resize
- Google Maps is optional; NearbyGroups has an ErrorBoundary + mock map fallback if no API key is set
- AdminDashboard is imported as `SettingsPage` and mounted at `/admin` route in App.tsx

## Product

Social event discovery for Athens — users browse events, join small groups, chat with group members, manage their calendar and connections, and optionally host events.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Set `VITE_GOOGLE_MAPS_PLATFORM_KEY` env var to enable the live Google Map in NearbyGroups; without it, a styled mock fallback renders instead
- Button component only accepts variants: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'` — not `'default'`
- Do NOT modify `artifacts/nakamas/vite.config.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
