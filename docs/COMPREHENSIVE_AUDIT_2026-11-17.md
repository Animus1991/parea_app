# Nakamas / parea_app — Εξονυχιστικός Έλεγχος (17/11/2026)

**Αντικείμενο:** πιο επικαιροποιημένο remote tip του project  
**Source tip:** `origin/cursor/audit-loyalty-pass17-6f96` @ `f885374`  
**Working branch:** `cursor/exhaustive-audit-preview-a43c` (fast-forward από το tip)  
**Μέθοδος:** `git fetch --prune` · σύγκριση όλων των remote branches · στατική ανάλυση ασφάλειας/αρχιτεκτονικής/i18n/a11y · `typecheck` · `eslint` · `audit:contrast` · `vitest` · `vite build` · `npm audit` · Cloudflare Quick Tunnel πάνω στο `dist` · ανασκόπηση CI/PR/docs  
**Ρήτρα:** αντικειμενικός, τεκμηριωμένος έλεγχος — όχι marketing.

---

## 0. Περίληψη (executive)

| Πεδίο | Βαθμός /0–10 | Κρίση |
|---|---|---|
| Συνολική ωριμότητα προϊόντος (demo/prototype) | **8.4** | Πολύ ώριμο client prototype· Wall + Φ27 + AI + loyalty bridges |
| Αρχιτεκτονική frontend | **8.5** | Lazy routes, ErrorBoundaries, shared PageContent, tokens, AI registry |
| Ασφάλεια (ως SPA + Express shell) | **6.2** | Πολλά Critical του 14/11 έχουν κλείσει· μένουν demo/open modes & chat membership |
| A11y / i18n | **8.3** | Contrast 90/90 AA · axe matrix · δίγλωσσο `t()` · υπόλοιπο inventory debt |
| Testing / CI | **8.5** | 262 unit pass · Playwright + Firestore rules green στο tip PR |
| Production readiness | **4.2** | Mock-first· χρειάζεται Firebase Functions + fail-closed auth για public prod |

**Verdict:** Το tip `cursor/audit-loyalty-pass17-6f96` είναι το σωστό **source of truth** έναντι του `main` (115 commits ahead, 0 behind). Περιλαμβάνει το υπερσύνολο των loyalty passes 7–17, Wall (Φ26), Outings (Φ27), lean privacy, CFB AI waves, Wallet typography και security hardening. **Demo / investor-demo ready.** **Όχι** public-production-ready χωρίς server authz και persistence.

**Cloudflare preview (αυτή η συνεδρία — Express + Vite + Socket.IO):**  
https://deliver-originally-generally-pay.trycloudflare.com  

> Quick Tunnel πάνω στο `npm run dev` (API + WS + Vite). Static-only SPA επίσης δοκιμάστηκε (`serve dist -s`). Μόνιμο Pages (`nakamas.pages.dev`) **δεν** δημοσιεύτηκε: λείπουν τα repo secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (το workflow τρέχει αλλά skip-άρει το publish).

---

## 1. Branch inventory & merge strategy

| Ref | Ημερομηνία (UTC) | Ahead of main | Σημείωση |
|---|---|---|---|
| **`cursor/audit-loyalty-pass17-6f96`** | 2026-11-17 09:57 | **115** | **Νεότερο tip · επιλεγμένο** |
| `cursor/audit-loyalty-pass16-6f96` | 2026-11-17 08:01 | 112 | Παράλληλο 16b· περιεχόμενο ήδη στο tip via `e210c3c` + pass 17 |
| `ccr-4a44ddef-fgcwnr` | 2026-11-17 08:15 | ⊂ tip | Ancestor του tip |
| `main` | 2026-11-14 11:38 | 0 | Πίσω 115 commits |
| `replit-updates` / `replit_branch` | 2026-05 | — | Παλαιά· **δεν** συγχωνεύονται (θα έκαναν regression) |

### Επιλογή «βέλτιστων από κάθε εκδοχή»

1. `git fetch origin --prune`
2. Σύγκριση όλων των `origin/cursor/*` και `origin/ccr-*`
3. Το pass17 tip είναι **strict superset** όλων των λειτουργικών αλλαγών Νοεμβρίου (0 unique commits σε άλλα tip εκτός παλαιών replit και ενός παράλληλου SHA pass16b με ισοδύναμο ή ασθενέστερο περιεχόμενο)
4. Working branch = fast-forward από το tip (χωρίς cherry-pick που θα έχανε merges)

Ανοιχτά PRs στο tip lineage: **#24** (pass 17), #23 (pass 16), #20 (Wall/outings), #12/#10 (UI typography — ήδη συγχωνευμένα στο tip).

---

## 2. Επαλήθευση ποιότητας (αυτή η εκτέλεση)

| Έλεγχος | Αποτέλεσμα |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint .` | ✅ 0 errors (exit 0) |
| `audit:contrast` | ✅ **90/90** pairs · 9 themes · AA |
| `vitest run` | ✅ **262 passed** · 26 skipped · 40 files (+1 skipped) |
| `vite build` | ✅ · προειδοποίηση chunk `index` **~615 KB** (gzip ~181 KB) + firebase ~465 KB |
| `npm audit` | ✅ **0 vulnerabilities** |
| Cloudflare Tunnel smoke | ✅ HTTP 200 · Playwright: Demo Alex → Skip onboarding → `/wall` · **0 page/console errors** |
| CI στο tip (PR #24) | ✅ Typecheck/Lint/Test/Build · E2E Playwright · Firestore rules emulator · CF Pages job (publish skipped) |

---

## 3. Αρχιτεκτονική (πραγματικότητα)

### 3.1 Τι είναι πραγματικά

- **Client:** React 19 + Vite + Zustand (mock-seeded) + React Query + 9 θέματα + lazy routes  
- **Server (`server.ts`):** Express + Vite middleware + Socket.IO + SQLite events catalog + AI proxy + Firebase token verify (όταν ρυθμιστεί)  
- **Optional:** Firebase Auth/Firestore, Ticketmaster, Google Maps, Stripe Checkout URL  
- **Νέα (Νοέμβριος):** Nakamas Wall (`wallStore`), Group Outings Φ27 (`outingsSlice`), lean privacy, 50 AI actions, loyalty UX bridges

### 3.2 Έναντι `docs/ARCHITECTURE.md`

Το Mermaid διάγραμμα (microservices / Onfido / Stripe Connect) παραμένει **στόχος**. Η πεζή εισαγωγή του ίδιου αρχείου και τα `SECURITY_HARDENING.md` / προηγούμενα audits περιγράφουν σωστά το mock-first Express shell.

### 3.3 Κλίμακα

| Μετρική | Τιμή |
|---|---|
| `src/**/*.tsx` | ~398 |
| `src/**/*.ts` | ~223 |
| Page files | ~148 |
| Routes στο `App.tsx` | ~46 |
| Shared `*PageContent` | ~29 |
| Θέματα | 9 |
| Diff vs `main` | **401 files** · +29 130 / −5 026 |

### 3.4 Ισχυρά σημεία

- Route-level `lazy()` + `ErrorBoundary`  
- Shared content pages αντί για πλήρη theme forks σε νέες επιφάνειες (Wall, OurNight, Collections, BuddySeek)  
- Semantic design tokens + contrast CI  
- Nakamas AI: risk tiers, confirm, undo, local bilingual engine + Gemini proxy  
- Security hardening γύρος (CORS allowlist, events write gate, RequireAdmin, Firestore privileged-field deny)

### 3.5 Τεχνικό χρέος

- Theme re-export forks ακόμα για Home/Login/EventDetail και ~14 παλαιότερα features  
- Main JS chunk ακόμα μεγάλος (καλύτερο από ~1.4 MB του 14/11, αλλά `index` + `firebase` βαριά)  
- `raw_greek_remaining.json` ~812 leftovers  
- Persistence groups/invites/strikes ακόμα demo/localStorage (rules έτοιμοι· Functions stubs)

---

## 4. Ασφάλεια (επικαιροποιημένα ευρήματα)

Βάση: `docs/SECURITY_HARDENING.md` + νέος έλεγχος στο tip `f885374`.

| Sev | Εύρημα | Status 17/11 | Σύσταση |
|---|---|---|---|
| **Critical** | Unauth `POST/PUT /api/events` | **Mitigated** σε prod/Firebase· ανοιχτό σε dev ή `EVENTS_WRITE_MODE=open` | Fail-closed σε κάθε production build |
| **Critical** | Firestore self-escalation `isOrganizer`/`isAdmin` | **Mitigated** (rules + client strip) | Διατήρηση· Admin SDK μόνο για ρόλους |
| **Critical** | `/admin` χωρίς guard | **Partial** — `RequireAdmin` UI· demo moderator ακόμα | Server claims + demo off σε prod |
| **High** | AI proxy / client model | **Mostly mitigated**· ανοιχτό όταν `AUTH.mode=off` | Απαίτηση auth σε prod |
| **High** | CORS / Socket spoof `senderId` | **Mitigated** (allowlist + bind on connect) | — |
| **High** | Socket `join_room` χωρίς membership | **Still present** | Enforce membership |
| **High** | Firestore chat χωρίς `memberIds` doc → any signed-in | **Still present** (demo fallback) | Deploy membership writers· remove `!exists` |
| **High** | Optional `VITE_GEMINI_API_KEY` | **Still present** (opt-in) | Απαγόρευση σε production builds |
| **Medium** | Demo login impersonation | Gated· on by default εκτός prod+Firebase | `VITE_DEMO_LOGIN=false` πάντα σε production |
| **Medium** | `/manage` χωρίς organizer guard | **Still present** | `RequireOrganizer` ή claims |
| **Medium** | GIS token decode χωρίς verify | **Still present** (client-only) | Μην εμπιστεύεσαι για server privileges |
| **Medium** | Wall `reachIds` client-authored | **Still present** | Server-side FoF expansion |
| **Low** | `dangerouslySetInnerHTML` | Static CSS only | — |
| **Info** | `npm audit` | **0 vulns** (βελτίωση έναντι 41 του 14/11) | — |

---

## 5. Προϊόν / UX / AI

### Wall (Φ26)
Audiences (public / connections / FoF / specific / list / only_me), moderation, tags, event sharing, member profiles. Docs: `WALL_AND_AUDIENCE_2026-11-16.md`. E2E: `e2e/wall.spec.ts`.

### Group Outings (Φ27) — 20 ideas
Check-in, invites (`/i/:id`), Our Night, collections, vibe quiz, standing/strikes, mini-outings, tickets, hike routes, organizer embed. Docs: `OUTINGS_2026-11-16.md`. E2E: `e2e/outings.spec.ts`.

### Lean privacy
Block αφαιρεί connection edge· privacy denormalized· Settings bridges wall + profile audience.

### Loyalty passes 7–17b
Empty CTAs + Ask AI, toast Undo, deep-links (feedback/night/Φ27), quieter notifications, wall composer-first, cancelled-group integrity, host handoff + safety honesty.

### AI Copilot
| Στοιχείο | Status |
|---|---|
| ~50 actions, confirm/undo | ✅ |
| Local EL/EN engine | ✅ |
| Gemini via `/api/ai/copilot` | 🟡 κώδικας έτοιμος· χρειάζεται `GEMINI_API_KEY` + Node server |
| UI docked/mobile + Ctrl/⌘J | ✅ |
| Wall/outings actions | ✅ |

Σημείωση: το static Cloudflare preview **δεν** τρέχει Express· ο on-device engine δουλεύει χωρίς key· Gemini proxy χρειάζεται Node.

---

## 6. A11y / i18n

- Contrast CI: **90/90** AA across 9 themes  
- Playwright axe matrix: ~22 routes × 5 CI themes  
- ~3 377 `t(` calls · `useLanguage` σε ~186 TSX  
- Gaps: `raw_greek_remaining.json` (~812)· onboarding/challenges catalogs με `titleGr`/`titleEn`· dual keyed+inline i18n styles  
- Residual: mobile contrast σε `activebuddies-dark` event detail (τεκμηριωμένο)

---

## 7. Integrations (honest)

| Integration | Κατάσταση |
|---|---|
| Demo login / guest | ✅ |
| Firebase / GIS Google | 🟡 env-gated |
| Ticketmaster | 🟡 optional key |
| Stripe | 🟡 ανοίγει Checkout URL |
| Maps | 🟡 Leaflet default· Google optional |
| Cloudflare Pages | 🟡 workflow ready· secrets missing → Quick Tunnel |
| Support | 🟡 mailto/URL ή demo label |

---

## 8. Προτεραιότητες (Top 12) — κατάσταση εφαρμογής

1. Προσθήκη `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` για μόνιμα `*.pages.dev` — ⬜ secrets  
2. Merge tip → `main` — 🟡 ανοιχτό PR #25  
3. Fail-closed AI/chat όταν auth off σε production — ✅ `authConfig` 17/11  
4. Socket.IO membership — 🟡 `checkChatJoin` + identity· πλήρες membership με Functions ακόμα ανοιχτό  
5. Demo login off σε κάθε production build — ✅  
6. Server-backed invites/groups/strikes — ⬜  
7. `RequireOrganizer` στο `/manage` — ✅  
8. Μείωση `index` + lazy-load Firebase — ⬜  
9. Καθαρισμός `raw_greek_remaining.json` / ενοποίηση i18n — ⬜  
10. Διαγραφή άχρηστων theme re-export forks — 🟡 EventDetail ενιαίο body· υπόλοιπα forks παραμένουν  
11. Active Buddies dark event-detail contrast — ✅ `isDarkTheme` → `darkSurface`  
12. `ARCHITECTURE.md` Mermaid ως «στόχος» — ✅

---

## 9. Cloudflare

| Τι | URL / αρχείο |
|---|---|
| **Live preview (αυτή η συνεδρία)** | https://deliver-originally-generally-pay.trycloudflare.com |
| Static SPA tunnel (προηγ. σε αυτή τη συνεδρία) | https://dressed-eng-here-occupational.trycloudflare.com |
| Προηγούμενο tip preview (PR #24 body) | https://subsidiaries-portions-ddr-discharge.trycloudflare.com |
| `wrangler.toml` | Pages project `nakamas`, output `dist` |
| Workflow | `.github/workflows/cloudflare-pages.yml` (publish skipped χωρίς secrets) |
| SPA | `public/_redirects`, `public/_headers` |

---

## 10. Συμπέρασμα

Στις 17/11/2026 το project στο tip `f885374` είναι το πιο πλήρες, συγχωνευμένο και επαληθευμένο snapshot του Nakamas: AI-first, a11y-gated, Wall + Φ27, loyalty UX, security hardening, **0 npm vulns**, πράσινα unit/CI tests. Για public production απαιτείται ακόμη πραγματικό backend authz/persistence. Για demo/preview η Cloudflare Tunnel διεύθυνση παραπάνω είναι η ζωντανή απόδειξη του **τελευταίου tip**.
