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
| 27 | Connections message ignores user | 🟡 | Inbox + tooltip (no 1:1 DM product yet) |
| 28 | Login Google = demo | ✅ | label «(Demo)» + toast on fallback |
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
| Contrast AA certification | ⬜ | **not certified** — theme tokens improve contrast; no axe/Lighthouse gate in CI |
| Full keyboard audit every page | ⬜ | high-traffic done; residual low-traffic pages incremental |
| Screen-reader full pass | ⬜ | not performed end-to-end |

---

## E. Manual smoke checklist (acceptance)

1. Guest opens event with tags → no crash.  
2. Create event → toast → `/manage` → survives refresh.  
3. BuddySeek Edit → modal prefilled → save updates request.  
4. Accept join → chat conversation exists in popup + `/chat/:groupId`.  
5. Login Google (Demo) → toast + demo user when Firebase absent.  
6. Tab through Notifications dismiss / Profile edit controls without hover.  
7. Toggle `prefers-reduced-motion` → no ping/bounce.  
8. EL↔EN on BuddySeek, Login, Organizer, Challenges.  
9. Nearby map remount (Strict Mode) → no Leaflet crash.  
10. 404 → «Πίσω στην Αρχική».

---

## F. Residual (explicitly out of “closed”)

1. Full WCAG 2.2 AA certification + CI axe.  
2. Real Google OAuth (Firebase configured).  
3. Real payment / bank / live support agents.  
4. 1:1 DM product (Connections → personal chat).  
5. Pixel-perfect contrast audit of every theme × every page.  

Until F1–F5, claims must remain **“engineering acceptance / prototype completeness”**, not **“certified accessible production”**.
