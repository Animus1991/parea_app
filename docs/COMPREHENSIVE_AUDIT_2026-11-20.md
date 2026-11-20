# Nakamas / parea_app — Εξονυχιστικός έλεγχος (20/11/2026)

**Αντικείμενο:** πιο επικαιροποιημένο remote tip — **https://github.com/Animus1991/parea_app.git** `ccr-4a44ddef-fgcwnr` @ `d53da7e` (20/11 20:14 UTC), το οποίο ήδη περιλαμβάνει το `tasoasteritopeleven` `29169270` + audit PR + νεότερα UX.  
**Source tip (αυτή η συνεδρία):** `animus/ccr-4a44ddef-fgcwnr` @ `d53da7ed46f54a580bbf882420b00008e872a024`  
**Working branch:** `cursor/animus-tip-quiet-chips-2581` (fast-forward από το Animus tip + σαφέστερα quiet-reveal chips)  
**Μέθοδος:** `git fetch --all --prune` · σύγκριση όλων των remote branches · στατική ανάλυση ασφάλειας / αρχιτεκτονικής / i18n / a11y · `typecheck` · `eslint` · `audit:contrast` · `vitest` · `vite build` · `npm audit` · χειροκίνητη ροή στο browser μέσω Cloudflare Quick Tunnel · επαλήθευση GitHub Actions στο `main`  
**Ρήτρα:** αντικειμενικός, τεκμηριωμένος έλεγχος — όχι marketing. Το app είναι **mock-first prototype**. «Πράσινα tests» ≠ production-ready.

---

## 0. Περίληψη (executive)

| Πεδίο | Βαθμός /0–10 | Κρίση |
|---|---|---|
| Συνολική ωριμότητα προϊόντος (demo/prototype) | **8.6** | Ώριμο client prototype· Wall, Φ27, AI, loyalty «Ξανά μαζί», weekly picks, night timeline, public invites |
| Αρχιτεκτονική frontend | **8.4** | Lazy routes, ErrorBoundaries, shared PageContent· ~100 νεκρά theme re-exports |
| Ασφάλεια (SPA + Express shell) | **6.4** | Hardening του 17/11 επιβεβαιώνεται· chat membership, GIS χωρίς verify, FoF `reachIds` ανοιχτά |
| A11y / i18n | **8.4** | Contrast 90/90 AA · axe matrix · δίγλωσσο `t()` · PWA shortcuts μόνο στα ελληνικά |
| Testing / CI | **8.3** | 371 unit pass · CI στο `main` πράσινο· **κενό:** default branch `devin/**` δεν πυροδοτούσε workflows (διορθώνεται σε αυτό το PR) |
| Production readiness | **4.3** | Mock-first· χρειάζεται Firebase Functions + fail-closed authz για δημόσιο prod |

**Verdict:** Το tip `29169270` είναι το σωστό **source of truth**. `main` και `devin/1795187527-calm-ui` είναι **ίδιο SHA**. Το `origin/ccr-92dfba55-iwthnx` (`eac0f80`) είναι **6 commits πίσω**. **Demo / investor-demo ready.** **Όχι** public-production-ready χωρίς server authz και persistence.

**Cloudflare preview (αυτή η συνεδρία — Express + Vite + Socket.IO πίσω από Quick Tunnel):**  
https://hat-nuke-emails-apart.trycloudflare.com

> Μόνιμο Pages (`nakamas.pages.dev`) **δεν** δημοσιεύτηκε: λείπουν τα repo secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`. Το workflow στο `main` (`run 44773152071`) έκανε build επιτυχώς και **skip-άρισε** το publish σε 0s.

---

## 1. Branch inventory

Μετά από `git fetch --all --prune` (20/11/2026 19:13 UTC):

| Ref | Commit | Ημερομηνία (UTC) | Σχέση |
|---|---|---|---|
| **`origin/devin/1795187527-calm-ui`** (default) | `29169270` | 2026-11-20 16:18 | **Νεότερο tip · επιλεγμένο** |
| `origin/main` | `29169270` | 2026-11-20 16:18 | Ίδιο SHA με το default |
| `origin/ccr-92dfba55-iwthnx` | `eac0f80` | 2026-11-20 15:07 | **0 ahead / 6 behind** του tip |

Δεν υπάρχουν ανοιχτά PRs. Open issues: 0.

### Δέλτα έναντι του ελέγχου 17/11 (`f885374`)

**118 commits.** Κύρια νέα:

| Θέμα | Commits / επιφάνεια |
|---|---|
| Calm UI / λιγότερο chrome | `4a7a89c`, `822e5c7` |
| Card-photo picker Discover/Categories | `a4964bb` |
| Weekly picks | `561e8e7`, `src/lib/weekPicks.ts`, `HomeWeekCard` |
| Night timeline + offline banner | `8ce7eb3` |
| Loyalty «Ξανά μαζί» (μόνο αμοιβαία) | `54eb453` |
| Public invites `/i/:id` cross-device | `17bee12`, `server/invitesStore.ts` |
| Tags index `/tags` | `f9a51d2` |
| Find Nakamas / Plans forming | σειρά UX commits 20/11 |
| Tests: countdown, picks, night steps | `2916927` |

---

## 2. Επαλήθευση ποιότητας (αυτή η εκτέλεση, SHA `29169270`)

| Έλεγχος | Αποτέλεσμα |
|---|---|
| `git fetch --all --prune` | ✅ working tree ήδη στο tip |
| `tsc --noEmit` | ✅ 0 errors |
| `eslint .` | ✅ 0 errors · **11 warnings** (jsx-a11y label, react-refresh, hooks deps) |
| `audit:contrast` | ✅ **90/90** pairs · 9 themes · AA |
| `vitest run` | ✅ **371 passed** · 26 skipped · 66 files (+1 skipped) |
| `vite build` | ✅ 6.64s · `index` **497 kB** / gzip **142 kB** · `firebase` **465 kB** / gzip **111 kB** |
| `npm audit` | ✅ **0 vulnerabilities** (765 packages) |
| GitHub CI στο `main` @ `29169270` | ✅ Typecheck/Lint/Test/Build · Firestore rules emulator · Playwright e2e |
| GitHub Cloudflare Pages @ `29169270` | 🟡 build OK · **publish skipped** (κενά secrets) |
| Cloudflare Tunnel smoke | ✅ HTTP 200 `/login` · `/api/health` `{"ok":true,"app":"nakamas","eventsStore":"sqlite","auth":"off"}` |
| Χειροκίνητη ροή (guest → Discover → event → Categories/Tags/BuddySeek/Wall/Agenda/Settings · EL↔EN · mobile 390×844 · 404) | ✅ UI ζωντανό· **κόκκινα WebSocket** στο console μέσω του tunnel |

---

## 3. Αρχιτεκτονική (πραγματικότητα, όχι το Mermaid στόχος)

### 3.1 Τι είναι πραγματικά

- **Client:** React 19.0.1 + Vite 6 + Zustand (mock-seeded) + React Query + 9 θέματα + 40 lazy loaders
- **Server (`server.ts`):** Express + Vite middleware + Socket.IO + SQLite events/invites + AI proxy + προαιρετική επαλήθευση Firebase ID token
- **Optional:** Firebase Auth/Firestore, Ticketmaster, Google Maps, Stripe Checkout URL
- **Hosting:** static `dist/` για Cloudflare Pages (`wrangler.toml` project `nakamas`)· Express για API/WS/AI

Το διάγραμμα microservices / Onfido / Stripe Connect στο `docs/ARCHITECTURE.md` παραμένει **στόχος**, όχι shipped code.

### 3.2 Κλίμακα @ `29169270`

| Μετρική | Τιμή |
|---|---|
| `src/**/*.tsx` | 423 |
| `src/**/*.ts` | 278 |
| Page files | 149 |
| Shared `*PageContent` | 30 |
| Routes στο `App.tsx` | 42 path routes |
| Θέματα | 9 |
| Copilot actions | 52 |
| Unit/e2e test files | 79 |
| `raw_greek_remaining.json` | 812 entries |

### 3.3 Ισχυρά σημεία

- Route-level `lazy()` + `ErrorBoundary` σχεδόν σε όλες τις διαδρομές
- Δημόσιες διαδρομές χωρίς login: `/i/:inviteId`, `/embed/organizer/:id`
- Semantic tokens + contrast CI
- Nakamas AI: 52 actions, risk tiers, confirm, undo, local EL/EN engine + Gemini proxy
- Security hardening: CORS allowlist, events write gate, `RequireAdmin`/`RequireOrganizer`, Firestore privileged-field deny, CSP στο `vite build`

### 3.4 Τεχνικό χρέος

- ~100 νεκρά `pages/*Theme*.tsx` re-exports· 7 ορφανά `EventDetail*.tsx` μετά την ενοποίηση σε `EventDetailPageBody`
- `HomeClassic.tsx` ακόμα ξεχωριστό layout έναντι `HomeThemedPageBody`
- `index` 497 kB + `firebase` 465 kB raw (κίνδυνος cold-load σε κινητό αν φορτωθεί νωρίς το Firebase)
- `store/index.ts` ~2396 γραμμές
- `framer-motion` dependency αχρησιμοποίητο (το app χρησιμοποιεί `motion`)
- `raw_greek_remaining.json` 812 leftovers (over-count: περιλαμβάνει ήδη `t()` arguments)

---

## 4. Ασφάλεια (επικαιροποίηση έναντι 17/11)

Επανέλεγχος στον κώδικα· **δεν** εμπιστευόμαστε τα docs χωρίς απόδειξη.

| Sev | Εύρημα | Status 17/11 | **Status 20/11** |
|---|---|---|---|
| **Critical** | Unauth `POST/PUT /api/events` | Mitigated prod | **Επιβεβαιωμένο.** Dev ανοιχτό (live: κενό POST → 400). Prod fail-closed χωρίς token/Firebase |
| **Critical** | Firestore self-escalation `isAdmin`/`isOrganizer` | Mitigated | **Επιβεβαιωμένο** (`firestore.rules` privilegedKeys + client strip) |
| **Critical** | `/admin` χωρίς server enforcement | Partial | **Ακόμα UI-only** (`RequireAdmin`). Demo accounts με `isAdmin` |
| **High** | AI proxy όταν `AUTH.mode=off` | Mostly mitigated | **Prod χωρίς Firebase:** `required:true` → 401. `AUTH_OPTIONAL=true` ξανανοίγει |
| **High** | CORS / socket `senderId` spoof | Mitigated | **OK με Firebase.** Demo: `handshake.auth.userId` χωρίς verify |
| **High** | Socket `join_room` χωρίς membership | Still present | **Ακόμα.** `memberOf` δεν περνάει (`server.ts`) |
| **High** | Firestore chat `!exists(room)` → κάθε signed-in | Still present | **Ακόμα** (`firestore.rules` `canUseRoom`) |
| **High** | `VITE_GEMINI_API_KEY` στον client | Still present | **Ακόμα** (opt-in) |
| **Medium** | Demo login impersonation | Gated | **Επιβεβαιωμένο:** default off σε production build |
| **Medium** | `/manage` χωρίς organizer guard | Docs 17/11 αντιφατικά | **Διορθωμένο στον κώδικα:** `RequireOrganizer` στο `App.tsx` |
| **Medium** | GIS JWT decode χωρίς verify | Still present | **Ακόμα** (`googleIdentityAuth.ts`) |
| **Medium** | Wall FoF `reachIds` client-authored | Still present | **Ακόμα** στους Firestore rules |
| **Medium** | Check-in QR χωρίς HMAC | Demo limitation | **Ακόμα** (FNV + public salt) |
| **Medium** | Invite API: unauth PUT, squatting | — | **Νέο βάρος:** `PUT /api/invites/:id` χωρίς auth· first-writer wins |
| **Low** | `dangerouslySetInnerHTML` | Static CSS | Chart themes + Leaflet CSS· όχι user HTML |
| **Info** | `npm audit` | 0 | **0** |

**Production χωρίς Firebase:** ασφαλέστερο από τις 14/11 (`authConfig` κλείνει AI/socket). **Public production** χωρίς Functions/claims παραμένει **ανεπαρκές**.

Προτεινόμενη σειρά: (1) Firebase verifier σε κάθε Node host, ποτέ `AUTH_OPTIONAL`/`EVENTS_WRITE_MODE=open` σε prod · (2) chat deny-by-default + membership writer · (3) GIS μόνο μέσω Firebase/JWKS · (4) FoF `reachIds` + check-in HMAC από Functions · (5) απαγόρευση `VITE_GEMINI_API_KEY` σε prod builds · (6) `VITE_DEMO_LOGIN=false`.

---

## 5. Προϊόν / UX

| Επιφάνεια | Κατάσταση |
|---|---|
| Discover / Home + weekly picks | ✅ UI + demo data (χειροκίνητα επαληθευμένο στο tunnel) |
| Categories / Tags | ✅ |
| BuddySeek / Find Nakamas | ✅ |
| Wall Φ26 | ✅ UI · persist mock/localStorage |
| Outings Φ27 / Our Night timeline | ✅ |
| Calendar / Agenda | ✅ |
| Loyalty «Ξανά μαζί» | ✅ αμοιβαία μόνο · e2e |
| Public invites `/i/:id` | 🟡 UI + SQLite όταν τρέχει Node· soft-fail σε static Pages |
| Copilot | ✅ local engine · 🟡 Gemini χρειάζεται Node + key |
| Chat | 🟡 πλούσιο UI· μηνύματα mock· **χωρίς πραγματικό AV** (τίμιος copy) |
| Wallet / Stripe | 🟡 Demo μέχρι env keys |
| Live GPS | ⬜ προσομοίωση |

**UX παρατηρήσεις από το live preview:**

- Temporary **card-image picker** ακόμα στο Home («Εικόνα κάρτας») — Round 4 το χαρακτηρίζει προσωρινό.
- Weekly picks: το ίδιο φεστιβάλ εμφανίστηκε δύο φορές (εκδήλωση + σχηματιζόμενο σχέδιο) — χαμηλή σοβαρότητα, πιθανή διπλοεγγραφή στο `selectWeekPicks` vs forming plans.
- Demo banner εμφανές και ειλικρινές.
- 404 με fuzzy hint «Did you mean Calendar?» για `/calendario` — δουλεύει.
- Mobile 390×844: bottom nav Discover / Plans / Create / Friends / Profile χωρίς overlap.

---

## 6. A11y / i18n / PWA

- Contrast CI: **90/90** AA, 9 themes
- Playwright axe: 22 routes × 5 CI themes (λείπουν `/tags` και μερικά collection paths από το matrix)
- `t()`: χιλιάδες κλήσεις· 203/204 TSX με ελληνικά έχουν `useLanguage`
- Gaps: PWA `manifest.webmanifest` `lang: el` και shortcuts μόνο ελληνικά· `og:description` μόνο ελληνικά· 812-entry debt file
- PWA: prod SW, network-first nav, αποκλεισμός `/api/` και `/socket.io/` από cache
- ESLint jsx-a11y: warnings, όχι errors

---

## 7. Integrations (τίμια)

| Integration | Κατάσταση |
|---|---|
| Demo login / guest | ✅ (off σε production build με Firebase) |
| Firebase / GIS Google | 🟡 env-gated · GIS χωρίς crypto verify |
| Ticketmaster | 🟡 optional key |
| Stripe | 🟡 ανοίγει Checkout URL |
| Maps | 🟡 Leaflet default · Google optional |
| Cloudflare Pages | 🟡 workflow ready · secrets missing → Quick Tunnel |
| Socket.IO μέσω Quick Tunnel | 🟡 UI ζωντανό · console WS errors (QUIC/tunnel, όχι απαραίτητα bug εφαρμογής) |

---

## 8. Προτεραιότητες

1. Repo secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` για μόνιμο `*.pages.dev` — ⬜
2. **CI στο default branch `devin/**`** — ✅ διορθώνεται σε αυτό το PR (προηγουμένως μόνο `main`/`master`/`ccr-*`/`cursor/**`)
3. Socket.IO membership (`memberOf` + deny-missing Firestore room) — ⬜
4. Server-backed invites/groups/strikes σε Functions — 🟡 SQLite invites υπάρχουν· Firestore `planInvites` world-readable
5. Διαγραφή νεκρών theme forks — ⬜
6. Καθαρισμός i18n debt / PWA EN shortcuts — ⬜
7. GIS verify ή αφαίρεση του unverified path σε prod — ⬜
8. FoF `reachIds` server-side — ⬜
9. Μείωση `index` 497 kB — ⬜
10. Αφαίρεση προσωρινού card-image picker όταν κλειδώσει default — 🟡 στο `ccr-4a44ddef-fgcwnr` έγινε ένα ήσυχο chip που ανοίγει τις επιλογές· η αφαίρεση περιμένει την τελική επιλογή
11. Dedup weekly picks όταν η ίδια εκδήλωση είναι και forming plan — ✅ στο `ccr-4a44ddef-fgcwnr` (`HomeWeekCard`: μία γραμμή ανά εκδήλωση)
12. `ARCHITECTURE.md` Mermaid ως «στόχος» — ✅ ήδη σημειωμένο

---

## 9. Cloudflare

| Τι | URL / αρχείο |
|---|---|
| **Live preview (αυτή η συνεδρία)** | https://hat-nuke-emails-apart.trycloudflare.com |
| `wrangler.toml` | Pages project `nakamas`, output `dist` |
| Workflow | `.github/workflows/cloudflare-pages.yml` (publish skipped χωρίς secrets) |
| SPA | `public/_redirects`, `public/_headers` · CSP εγχέεται στο `dist/_headers` στο `vite build` |
| Προηγούμενο tip (17/11) | https://deliver-originally-generally-pay.trycloudflare.com (ληγμένο Quick Tunnel) |

**Σημείωση διάρκειας:** το Quick Tunnel ζει όσο τρέχει αυτός ο Cloud Agent. Χωρίς Pages secrets δεν υπάρχει σταθερό `nakamas.pages.dev`.

---

## 10. Συμπέρασμα

Στις 20/11/2026 το project στο tip `29169270` (`devin/1795187527-calm-ui` = `main`) είναι το πιο πλήρες, συγχωνευμένο snapshot του Nakamas: calm UI, weekly picks, night timeline, «Ξανά μαζί», public invites, tags, Find Nakamas, **0 npm vulns**, 371 unit tests, πράσινο CI στο `main`. Για public production απαιτείται ακόμη πραγματικό backend authz/persistence. Για demo/preview η διεύθυνση Cloudflare Tunnel παραπάνω είναι η ζωντανή απόδειξη του **τελευταίου tip**.
