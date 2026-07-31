# Nakamas — Acceptance Matrix (UI/UX plan closure)

**Date:** 2026-07-31 · **Method:** static re-verification of `docs/FULL_APP_UIUX_AUDIT_AND_PLAN.md` Γ1–Γ4 + P0–P5 roadmap against current `main` source.  
**Legend:** ✅ closed in code · 🟡 honest demo / partial · ⬜ open

> This is an engineering acceptance matrix, **not** a third-party WCAG certification.

---

## A. Γ1 — Dead / misleading affordances

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Home grid-view dead button | ✅ | Affordance removed / `LayoutGrid` sr-only in heroes |
| 2–5 | Nearby search / filters / radius / chips | ✅ | `NearbyGroupsPageContent` wired |
| 6 | EventDetail waitlist `alert()` | ✅ | toast + store waitlist |
| 7 | EventCard safety `alert()` | ✅ | toast |
| 8 | Organizer → `/profile` | ✅ | `/organizer/:id` |
| 9 | AppShell footer `#` | ✅ | real routes |
| 10 | BuddySeek «Νέο αίτημα» → `/` | ✅ | event picker + create modal |
| 11 | LookingForCompany filters no-op | ✅ | spots/verified filter |
| 12 | MeetingPoint Έφτασα / Χάρτης | ✅ | chatStore + maps URL |
| 13 | KeepChat request | ✅ | `requestKeepChat` |
| 14 | Notifications CTAs | ✅ | wired actions |
| 15 | Achievements Share | ✅ | Web Share / clipboard |
| 16 | GroupChat report toast-only | ✅ | chatStore reports pipeline |
| 17 | Organizer Dashboard actions | ✅ | live events + actions |
| 18 | Wallet Withdraw/Manage | 🟡 | demo-labelled flows |
| 19 | Verification Verify/Upload | 🟡 | demo toast + flags |
| 20 | ReportIssue submit | ✅ | store + Admin |
| 21 | Profile privacy local | ✅ | `userSettings` |
| 22 | Settings dead rows | 🟡 | «Σύντομα» value + toast (Payment / Blocked) |
| 23 | Help topics/send | 🟡 | wired; support marked demo (no live agent) |
| 24 | Admin Review/Ban | ✅ | AdminDashboardPageContent actions |
| 25 | OrganizerProfile `#` / alert | ✅ | toast + website guard |
| 26 | Plans Group Chat wrong id | ✅ | groupId |
| 27 | Connections message → 1:1 DM | ✅ | `ensureDirectConversation` + popup window |
| 28 | Login Google | 🟡 | Firebase OAuth when configured; else «(Demo)» + toast |
| 29 | 404 CTA | ✅ | Back to Home |

---

## B. Γ2 — Fake data presented as real

| Item | Status | Notes |
|---|---|---|
| Inbox unread | ✅ | chatStore `unreadCount` |
| Plans members / meeting point | ✅ | store-backed |
| Nearby distances | ✅ | haversine |
| ActiveBuddies online dots | ✅ | removed (no fake presence) |
| Organizer stats/chart/events | ✅ / 🟡 | live store; chart = derived demo analytics |
| Wallet amounts | 🟡 | prototype ledger |
| Verification % / Trust timeline | ✅ / 🟡 | live flags; some mock rows remain illustrative |
| Moderation «Suspicious: 2» | ✅ | derived from `reportCountInternal >= 2` |
| Help «Online now» | ✅ | replaced with «Demo support (no live agent)» |
| +25 XP decorative | ✅ | `awardXp` on feedback |

---

## C. Γ3 — i18n

| Item | Status |
|---|---|
| Nearby Map Error `t()` | ✅ |
| BuddySeek EL/EN footer | ✅ |
| CreateCompanyRequest Min/Max | ✅ |
| Moderation / Privacy / Close aria | ✅ |
| Plans / LFC singular-plural | ✅ |
| Notifications bilingual | ✅ |
| ChatModeration locale | ✅ |
| GroupMerge «Έγινε» | ✅ |
| OrganizerProfile typos | ✅ |

---

## D. Γ4 — a11y

| Item | Status |
|---|---|
| EventCard calendar aria + visible label | ✅ |
| Feedback star aria-labels | ✅ |
| History/Saved keyboard cards | ✅ |
| Modal Esc / focus / scroll-lock | ✅ | `Modal` + `useOverlayBehavior` |
| Tabs role/aria-selected | ✅ | Notifications, Connections, Inbox, Achievements, Challenges |
| Settings switches role | ✅ | `role="switch"` |
| CreateEvent visibility radios | ✅ | `role="radiogroup/radio"` |
| Icon triggers aria-label | ✅ | high-traffic surfaces |
| QuickReplies valid roles | ✅ | `role="toolbar"` |
| BottomSheet amber dark contrast | ✅ |
| Calendar keyboard schedule path | ✅ | schedule button per day |

### P5 / WCAG posture (honest)

| Area | Status |
|---|---|
| Focus-visible global ring | ✅ baseline |
| Reduced motion | ✅ |
| Touch targets ≥40px (primary controls) | ✅ / 🟡 | Button sizes + many controls; not every legacy control |
| jsx-a11y in ESLint | ✅ | `eslint-plugin-jsx-a11y` (warn-first on noisy rules) |
| Axe smoke in CI (Playwright) | ✅ | serious/critical on `/login` + demo `/` (excludes `color-contrast` — see token gate) — **not** full AA certification |
| Semantic token contrast gate | ✅ | `npm run audit:contrast` per theme in CI |
| Contrast AA certification (every page × theme) | ⬜ | token audit ≠ axe/pixel audit of every composed surface |
| Full keyboard audit every page | ⬜ | high-traffic done; residual low-traffic pages incremental |
| Screen-reader full pass | ⬜ | not performed end-to-end |

---

## E. Manual smoke checklist (acceptance)

1. Guest opens event with tags → no crash.  
2. Create event → toast → `/manage` → survives refresh.  
3. BuddySeek Edit → modal prefilled → save updates request.  
4. Accept join → chat conversation exists in popup + `/chat/:groupId`.  
5. Connections → message icon → 1:1 DM popup opens.  
6. Login Google: Firebase when env configured; else Demo toast + demo user.  
7. Tab through Notifications dismiss / Profile edit controls without hover.  
8. Toggle `prefers-reduced-motion` → no ping/bounce.  
9. EL↔EN on BuddySeek, Login, Organizer, Challenges.  
10. Nearby map remount (Strict Mode) → no Leaflet crash.  
11. 404 → «Πίσω στην Αρχική».

---

## F. Residual (explicitly out of “closed”)

| # | Item | Engineering status | Still not claimed |
|---|---|---|---|
| 1 | WCAG 2.2 AA | Baseline: jsx-a11y + axe smoke CI + token contrast | Full certification / every page pass |
| 2 | Google OAuth | Code path via Firebase when configured | Production OAuth without Firebase env |
| 3 | Payments / live support | Honest demo labels | Real bank / live agents |
| 4 | 1:1 DM | ✅ `ensureDirectConversation` product path | — |
| 5 | Contrast every theme × page | Token pairs gated in CI | Pixel audit of every composed UI |

**Verdict:** engineering acceptance for the prototype UI/UX plan ≈ **closed**. Certified production a11y / live payments / always-on OAuth ≠ closed.
