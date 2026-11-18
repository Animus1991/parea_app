# Nakamas / parea_app — Εξονυχιστικός Έλεγχος (14/11/2026)

**Αντικείμενο:** πιο επικαιροποιημένο remote branch  
**Branch:** `ccr-4a44ddef-fgcwnr` @ `dd3041d` (4 commits ahead of `main`)  
**Μέθοδος:** `git fetch --all` · στατική ανάλυση · `typecheck` · `eslint` · `audit:contrast` · `vitest` · `vite build` · Playwright smoke μέσω Cloudflare Tunnel · ανασκόπηση docs/CI/deps  
**Ρήτρα:** αντικειμενικός, τεκμηριωμένος έλεγχος — όχι marketing.

---

## 0. Περίληψη (executive)

| Πεδίο | Βαθμός /0–10 | Κρίση |
|---|---|---|
| Συνολική ωριμότητα προϊόντος (demo/prototype) | **7.6** | Πολύ ώριμο client prototype· όχι production backend |
| Αρχιτεκτονική frontend | **8.2** | Lazy routes, ErrorBoundaries, tokens, AI registry |
| Ασφάλεια (ως SPA demo) | **4.5** | Main Gemini OK· Critical: unauth writes, client RBAC, Firestore |
| A11y / i18n | **8.0** | Contrast + axe matrix· όχι πλήρες WCAG cert |
| Testing / CI | **7.0** | 47 unit + ~63 e2e· CI ήταν μόνο `main` (διορθώνεται σε αυτό το PR) |
| Production readiness | **3.5** | Mock-first· unauth APIs· client-only roles· demo login |

**Verdict:** Το `ccr-*` branch είναι το σωστό «source of truth» έναντι του `main` (Ιούλιος 2026). Η εφαρμογή είναι **demo-ready / investor-demo-ready** με ισχυρό AI copilot και a11y gates. **Δεν είναι production-ready** χωρίς backend authz, hardened APIs και dependency hygiene.

**Cloudflare preview (live):** https://shine-gnome-historical-folding.trycloudflare.com  
(Quick Tunnel πάνω στο `vite build` → `dist`. Μόνιμο Pages: βλ. `wrangler.toml` + `.github/workflows/cloudflare-pages.yml` — απαιτεί `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.)

---

## 1. Branch & inventory

| Ref | Ημερομηνία | Σημείωση |
|---|---|---|
| `origin/ccr-4a44ddef-fgcwnr` | 2026-11-14 | **Νεότερο** · AI copilot + UX ports + a11y matrix |
| `origin/main` | 2026-07-31 | Πίσω 4 commits |
| `origin/replit-updates` | 2026-05-21 | Παλαιό |
| `origin/replit_branch` | 2026-05-08 | Παλαιό |

Commits πάνω από main: AI copilot, progressive disclosure από nakamas σε live data, a11y matrix completion, AI-first audit docs.

Κλίμακα: ~485 TS/TSX σε `src/`, ~143 page files (πολλά theme variants), 9 θέματα, ~30 routes, 6 stores, Express+SQLite+Socket.IO server.

---

## 2. Επαλήθευση ποιότητας (αυτή η εκτέλεση)

| Έλεγχος | Αποτέλεσμα |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint` | ✅ 0 errors / **125 warnings** |
| `audit:contrast` | ✅ PASS (86 pairs / 9 themes· 4 skipped unparsed alpha) |
| `vitest` | ✅ **47/47** |
| `vite build` | ✅ · προειδοποίηση chunk **~1.4 MB** main bundle |
| `npm audit` | ⚠ **41** (3 critical, 21 high) — βλ. §4 |
| Cloudflare Tunnel smoke | ✅ Login → Demo guest → Home → Settings (HTTP 200, `server: cloudflare`) |

---

## 3. Αρχιτεκτονική

### 3.1 Πραγματική vs τεκμηριωμένη

Το `docs/ARCHITECTURE.md` περιγράφει microservices / API gateway / Onfido / Stripe Connect. **Η πραγματική υλοποίηση** είναι:

- **Client:** React 19 + Vite 6 + Zustand (mock-seeded) + React Query + theme routers  
- **Server (`server.ts`):** Express + Vite middleware + Socket.IO (`cors: *`) + SQLite events catalog + AI proxy  
- **Optional:** Firebase Auth/Firestore, Ticketmaster, Google Maps, Stripe Checkout URL, GIS OAuth  

### 3.2 Ισχυρά σημεία

- Route-level `lazy()` + `ErrorBoundary` ανά σελίδα (`App.tsx`)  
- Onboarding + demoMode guards  
- Semantic design tokens + contrast CI  
- Nakamas AI: action registry (risk tiers, confirm, undo), local bilingual engine + Gemini proxy  
- Progressive disclosure ports με live store data (όχι hardcoded metrics)  

### 3.3 Τεχνικό χρέος

- Theme explosion: 7–9 αντίγραφα σελίδων αντί για 1 content + theme tokens  
- Main JS chunk ~1.4 MB (gzip ~401 KB) — κακό για mobile TTI  
- `ARCHITECTURE.md` overstates backend maturity  
- CI triggers μόνο `main`/`master` στο upstream HEAD — **αυτό το PR** επεκτείνει σε `ccr-*` / `cursor/**`  
- Unauthenticated `POST/PUT /api/events`  
- `OrganizerDashboardPageContent` κάτω από `components/admin/` · `Dummy.tsx` orphan · διπλά mobile hooks · ημιτελή Modal migrations  
- Fat Classic pages (`HomeClassic`, `OnboardingClassic`, …) + 34 scripts (πολλά one-off)

---

## 4. Ασφάλεια (ευρήματα)

> Βαθύτερη ανασκόπηση από [Security & secrets audit](bc-b08766e7-369f-536f-9ed6-8a9680ce2590) + [Architecture & quality audit](bc-a4d2a36e-a743-5c24-82d9-6a214dff8a99). Δεν βρέθηκαν hardcoded live secrets στο source.

| Sev | Εύρημα | Evidence | Σύσταση |
|---|---|---|---|
| **Critical** | Unauth `POST`/`PUT /api/events` → SQLite poisoning | `server.ts` · `eventsCatalog.ts` | Auth + schema validation |
| **Critical** | Admin/organizer authz μόνο client/`localStorage` (`nakamas-store-v1`)· `/admin` χωρίς guard· `becomeEventHost` elevates | `App.tsx` · `AppShell.tsx` · `store/index.ts` | Server claims· ποτέ trust client `isOrganizer` |
| **Critical** | Firestore: owner μπορεί να γράψει `isOrganizer`· οποιοσδήποτε auth διαβάζει όλα profiles/chats | `firestore.rules` · `firebaseUserProfile.ts` | Deny privileged fields· membership reads |
| **High** | Unauth AI proxy + client-controlled `/api/ai/generate` (model/contents) | `server.ts` | Auth + lock model· drop open `/generate` |
| **High** | CORS / Socket.IO `*` · spoofable `senderId` | `server.ts` · `socket.ts` | Origin allowlist· socket auth |
| **High** → ✅ | Legacy `app/applet/vite.config.ts` έκανε `define` το `GEMINI_API_KEY` | διορθώθηκε σε αυτό το PR | Ίδιο pattern με root Ε1 |
| **High** | Optional `VITE_GEMINI_API_KEY` / `VITE_AI_USE_PROXY=false` | `.env.example` · `geminiClient.ts` | Απαγόρευση σε production |
| **Medium** | Demo login impersonation (συμπ. organizers) σε shipped UI | `LoginPageBody.tsx` | DEV-only / feature flag |
| **Medium** | GIS ID token μόνο base64 decode (χωρίς verify) | `googleIdentityAuth.ts` | Server-side token verify |
| **Medium** | Weak in-memory AI rate limit· unvalidated `externalLink` / checkout URLs | `server.ts` · EventDetail / payments | Redis limits· `https:` allowlist |
| **Medium** | `npm audit`: critical `proxy-addr`, `tinypool`/`vitest`· high `ws`, `react-router`, firebase chain | `npm audit` | Targeted upgrades |
| **Low** | Limited `dangerouslySetInnerHTML` (static CSS)· no CSP on Express | chart / NearbyGroups | Helmet + CSP |
| **Info** | Main app `vite.config.ts` **δεν** inlines Gemini key (Ε1) | `vite.config.ts` | Διατήρηση |

---

## 5. AI Copilot

Κατάσταση από κώδικα + `docs/AI_FIRST_AUDIT_AND_PLAN.md` §Ι (επιβεβαιωμένο με tests):

| Στοιχείο | Status |
|---|---|
| 33 actions, confirm/undo | ✅ |
| Local EL/EN engine | ✅ (24 unit tests) |
| Gemini via `/api/ai/copilot` | 🟡 κώδικας έτοιμος· χρειάζεται `GEMINI_API_KEY` |
| UI docked/mobile + Ctrl/⌘J + voice | ✅ |
| Proactive AI / server-side tool execution | ⬜ Φ26–Φ27 |

---

## 6. A11y / i18n / UX

- jsx-a11y warn-first· axe smoke + 5×10 page×theme matrix με contrast  
- `useLanguage`/`t()` κυριαρχεί· onboarding κρατά δίγλωσσους πίνακες (OK)  
- Δεν είναι third-party WCAG 2.2 AA certification  
- 125 eslint warnings (hooks deps, unused, react-refresh) — θόρυβος αλλά όχι blockers  

---

## 7. Integrations (honest)

| Integration | Κατάσταση |
|---|---|
| Demo login / guest | ✅ |
| Firebase / GIS Google | 🟡 env-gated |
| Ticketmaster | 🟡 optional `VITE_TICKETMASTER_API_KEY` |
| Stripe | 🟡 ανοίγει Checkout URL· όχι Connect backend |
| Maps | 🟡 Leaflet default· Google key optional |
| Support | 🟡 mailto/URL ή demo label |

---

## 8. Προτεραιότητες (Top 15)

1. Authz σε `/api/events` + `/api/ai/*` (Critical/High)  
2. Server-verified roles· guard `/admin`· μην εμπιστεύεσαι `localStorage` `isOrganizer`  
3. Firestore rules: deny self-escalation + membership-scoped chat/profile reads  
4. Lock CORS / Socket.IO · authenticate sockets  
5. Αφαίρεση `GEMINI_API_KEY` define από `app/applet/vite.config.ts`  
6. Demo login / GIS verify μόνο σε DEV· production OAuth πραγματικό  
7. Extend CI to `ccr-*` (**σε αυτό το PR**) + axe για `/events`, `/agenda`, `/create`, `/chat`, `/admin`  
8. Reduce 1.4 MB main chunk  
9. `npm audit` remediation  
10. Finish Modal migration · consolidate `useIsMobile`/`useMediaQuery` · move organizer out of `admin/`  
11. Delete `Dummy.tsx` · quarantine one-off `scripts/fix_*.cjs`  
12. Permanent Cloudflare Pages + secrets  
13. Align ARCHITECTURE.md με πραγματικότητα · transport banner (mock/Firebase/socket)  
14. Gemini live key verification σε staging  
15. Φ26 proactive AI μόνο μετά από audit log + authz

---

## 9. Cloudflare

| Τι | URL / αρχείο |
|---|---|
| **Live preview (αυτή η συνεδρία)** | https://shine-gnome-historical-folding.trycloudflare.com |
| `wrangler.toml` | Pages project name `nakamas`, output `dist` |
| Workflow | `.github/workflows/cloudflare-pages.yml` |
| SPA | `public/_redirects`, `public/_headers` |

Σημείωση: το static Pages preview **δεν** τρέχει το Express AI/Socket server· ο local engine του copilot λειτουργεί χωρίς key· Gemini proxy χρειάζεται Node server.

---

## 10. Συμπέρασμα

Το project στο `ccr-4a44ddef-fgcwnr` είναι το πιο πλήρες και επικαιροποιημένο snapshot του Nakamas: AI-first, a11y-gated, mock-rich. Για public production απαιτείται hardening ασφαλείας και πραγματικό backend· για demo/preview η Cloudflare Tunnel διεύθυνση παραπάνω είναι επαρκής απόδειξη λειτουργίας.

---

## 11. Κατάσταση των προτεραιοτήτων (ενημέρωση 14/11/2026, απόγευμα)

Λεπτομέρειες στο `docs/SECURITY_HARDENING.md`.

| # | Προτεραιότητα | Κατάσταση |
|---|---|---|
| 1 | Authz σε `/api/events` + `/api/ai/*` | ✅ Μερικώς. Εγγραφές κλειστές σε production χωρίς token, έλεγχος πεδίων, κλειδωμένο μοντέλο AI, όρια ρυθμού. Χρειάζεται ακόμη πραγματική ταυτότητα χρηστών |
| 2 | Ρόλοι στον server, φρουρός `/admin` | ✅ Μερικώς. Ξεχωριστό `isAdmin` μόνο από seed, `RequireAdmin`, το «Γίνε οικοδεσπότης» δεν δίνει πια δικαιώματα admin. Custom claims ανοιχτά |
| 3 | Firestore rules | ✅ Προφίλ μόνο από τον κάτοχο, απαγόρευση προνομιακών πεδίων, chat με `memberIds` όταν υπάρχει έγγραφο δωματίου. Δεν δοκιμάστηκε σε emulator |
| 4 | CORS / Socket.IO | ✅ Allowlist, σταθερή ταυτότητα ανά σύνδεση, όρια. Η ταυτότητα δηλώνεται ακόμη από τον client |
| 5 | `GEMINI_API_KEY` στο applet | ✅ Από το προηγούμενο PR |
| 6 | Demo login / GIS μόνο σε DEV | ⬜ Ανοιχτό. Η επίδειξη βασίζεται σε αυτό |
| 7 | CI σε `ccr-*` + axe σε περισσότερες σελίδες | ✅ Axe σε `/events/e1`, `/agenda`, `/create`, `/admin` σε 5 θέματα. Βρέθηκαν και διορθώθηκαν 21 παραβάσεις |
| 8 | Κύριο bundle 1,4 MB | ✅ 567 KB (163 KB gzip). Firebase φορτώνεται μόνο όταν είναι ρυθμισμένο |
| 9 | `npm audit` | 🟡 41 → 21 (critical 3 → 2, high 21 → 4). Τα υπόλοιπα θέλουν αναβαθμίσεις που σπάνε συμβατότητα |
| 10 | Modal, hooks, οργάνωση φακέλων | ⬜ Ανοιχτό |
| 11 | `Dummy.tsx`, scripts | ✅ `Dummy.tsx` αφαιρέθηκε. Τα scripts παραμένουν |
| 12 | Μόνιμο Cloudflare Pages | ⬜ Χρειάζεται secrets. Διορθώθηκε το `public/_headers` που δεν εφαρμοζόταν |
| 13 | ARCHITECTURE.md | ⬜ Ανοιχτό |
| 14 | Gemini με πραγματικό κλειδί | ⬜ Ανοιχτό |
| 15 | Proactive AI μετά από audit log + authz | 🟡 Το ιστορικό ενεργειών AI υπάρχει πλέον (Διαχείριση → Σύστημα). Το proactive AI δεν ξεκίνησε |
