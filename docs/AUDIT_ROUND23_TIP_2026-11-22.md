# Εξονυχιστικός έλεγχος — άκρη Animus round 23 (22/11/2026)

Αντικείμενο: το πιο επικαιροποιημένο branch του [Animus1991/parea_app](https://github.com/Animus1991/parea_app.git), μαζί με όλη τη στοίβα του fork `tasoasteritopeleven/parea_app`, χωρίς παράλειψη. Cherry-pick μεμονωμένων commits **δεν** χρειάστηκε: η άκρη του Animus περιέχει ήδη κάθε origin tip.

## 1. Ποιο είναι το «πιο επικαιροποιημένο» branch

| Άκρη | SHA | Ώρα (UTC) | Περιεχόμενο |
|---|---|---|---|
| **`Animus1991` `ccr-4a44ddef-fgcwnr`** | `491ce6e` | 21/11 21:43 | Round 23: εικονίδια αντί για μακριά links, 10px floor, συντομότερα Σχέδια |
| `tasoasteritopeleven` `cursor/animus-round21-audit-2581` (PR #15) | `4f83748` | 21/11 19:13 | Chat popups (4 παράθυρα, group threads στο web), menu z-index, hat, mini-outings stack |
| `Animus1991` `main` | `a3d0f24` | 14/11 | **Δεν είναι η άκρη.** Default GitHub, 7 ημέρες πίσω |

`git merge-base --is-ancestor` για κάθε `origin/*` (συμπεριλαμβανομένων `cursor/**`, `devin/1795187527-calm-ui`, `mini-outings`, `exhaustive-audit-preview-2581`): όλα μέσα στο `491ce6e`. `HEAD...animus/ccr` πριν το checkout: **0 πίσω, 12 μπροστά**. Μετά το fast-forward: 0/0.

Τα 12 commits του Animus πάνω από το PR #15:

1. Merge mini-outings (41 commits)
2. Post-merge clarity (round 22)
3–5. E2E προσαρμογές (mini outing cover, reaction toolbar, tag checkbox)
6. Μέλος μία φορά στις Full φωτογραφίες
7. Docs round 22 (Playwright 177, μετά 183)
8–10. Επανειλημμένα merge του `cursor/animus-round21-audit-2581` (συμπεριλαμβανομένων των 22 commits του chat)
11. **Round 23** — εικονίδια Find Nakamas, 10px, λίστα «Αργότερα» στα Σχέδια

Στρατηγική: `git fetch animus origin` · νέο branch από `animus/ccr-4a44ddef-fgcwnr` (όχι cherry-pick, ώστε να μην χαθεί κανένα αρχείο).

## 2. Μέθοδος

| Έλεγχος | Εργαλείο | Κάλυψη |
|---|---|---|
| Τοπολογία git | `fetch` + `rev-list` + `merge-base --is-ancestor` | Όλα τα `origin/*` και `animus/*` |
| TypeScript | `tsc --noEmit` | Όλο το project |
| ESLint | `eslint . --max-warnings 0` | `src/` + configs |
| Unit | `vitest run` | Client + server |
| Αντίθεση | `npm run audit:contrast` | 90 ζεύγη × 9 θέματα |
| Build | `vite build` | Production `dist/` |
| Εξαρτήσεις | `npm audit` και `npm audit --omit=dev` | Όλο το δέντρο |
| Ασφάλεια | CSP, headers, `eval`/`innerHTML`, `safeExternalUrl`, Socket.IO origin, Firestore rules (ανάγνωση), `VITE_*` | Client, server, dist |
| i18n | `t()` / `tu()` / `formatPlanWhen*` / `toLocale*` | UI strings |
| a11y | axe matrix 9 θέματα × υψηλής κίνησης διαδρομές | Playwright |
| E2E | Playwright Chromium, 211 tests | Chat, wall, plans, buddy-seek, outings, tags, copilot, smoke, type |
| Runtime | `tsx server.ts` :3000 + Cloudflare Quick Tunnel | HTTP 200, CF headers |

## 3. Αποτελέσματα αυτοματισμού

| Μέτρηση | Αποτέλεσμα |
|---|---|
| TypeScript | 0 σφάλματα |
| ESLint | 0 σφάλματα, 0 προειδοποιήσεις (`--max-warnings 0`) |
| Vitest | **441 πέρασαν**, 27 παραλείφθηκαν, 0 απέτυχαν (77 αρχεία + 1 skipped) |
| Contrast AA | 90/90 ζεύγη, 9 θέματα |
| `npm audit` | 0 ευπάθειες (με και χωρίς dev) |
| Production build | OK, ~8 s. Μεγαλύτερα chunks: `index` 536 kB / firebase 465 kB (προϋπάρχον warning) |
| Playwright | 211 tests. Πρώτο πέρασμα 210/211. Το `web-type-scale` περίμενε story tile **&lt; 9.6px** στο τηλέφωνο· το round 23 έβαλε floor **10px**. Διορθώθηκε το τεστ (όχι το CSS). Μετά: **211/211**. |

## 4. Round 23 — τι άλλαξε στο προϊόν

- **Find Nakamas:** πέντε ενέργειες σε μία σειρά εικονιδίων (Απόρρητο, Νέο αίτημα, Παρέα τώρα, Σχέδια, Στυλ παρέας). Το `aria-label` ξεκινά από το ορατό κείμενο και προσθέτει το υπόλοιπο. Φίλτρα και επιλογή φωτογραφίας στην ίδια σειρά. Πλέγμα 2–3 στηλών σε φαρδιά οθόνη.
- **Τυπογραφία τηλεφώνου:** `--text-2xs` → 10px (`0.625rem`). Οι αριθμοί σε μικρές φυσαλίδες μένουν 9px μέσω `.text-count`.
- **Mini outing cards:** αφαιρέθηκε το «Λεπτομέρειες»· η φωτογραφία ανοίγει την εκδήλωση.
- **Ετικέτες:** στο τηλέφωνο το αλφαβητικό ευρετήριο είναι μία οριζόντια σειρά.
- **Σχέδια στο τηλέφωνο:** τα επόμενα 3 ως κάρτες, τα υπόλοιπα στη λίστα «Αργότερα». Ένα tap ανοίγει πλήρη κάρτα (Leave κ.λπ. μένουν). Desktop: όλες οι κάρτες. Ύψος σελίδας ~7.8k → ~2.7k px.
- **Badges:** sentence case («Νέα μικρή ομάδα», «1–2 άτομα»).

Δεν αφαιρέθηκε λειτουργία: τα ίδια κουμπιά υπάρχουν ως εικονίδια / expand, όχι ως διαγραμμένες ροές.

## 5. Ασφάλεια

**Θετικά (επαληθευμένα στο `491ce6e` + αυτό το branch):**

- CSP enforce στην παραγωγή (`server/csp.ts`) και στο `dist/_headers` (Cloudflare Pages). `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`. Στο `tsx` dev το CSP παραλείπεται σκόπιμα.
- Headers στο tunnel και στο Express: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` camera/mic/geo, `COOP: same-origin-allow-popups`.
- Δεν υπάρχει `eval` / `new Function` / `document.write` στο `src/`.
- `dangerouslySetInnerHTML` μόνο σε σταθερό CSS (Leaflet sidebar, shadcn chart) — όχι δεδομένα χρήστη. `el.innerHTML = ''` στο Leaflet host είναι καθάρισμα κόμβου.
- Εξωτερικά `target="_blank"` έχουν `rel="noopener noreferrer"` (και `nofollow ugc` στο wall). `safeExternalUrl` μπλοκάρει `javascript:` / `data:` / `vbscript:`.
- Socket.IO δεν είναι `origin: '*'`.
- Gemini **δεν** μπαίνει στο client bundle από `GEMINI_API_KEY`· πάει `/api/ai/*` εκτός αν κάποιος βάλει ρητά `VITE_GEMINI_API_KEY`.
- Demo login κλειστό σε production build εκτός `VITE_DEMO_LOGIN=true`.
- Firestore rules: reads δεσμευμένα σε `signedIn()` / membership· αρκετά `allow write: if false` σε ευαίσθητα paths. Το emulator job (`test:rules`) **δεν** έτρεξε σε αυτό το VM.

**Υπολειπόμενοι κίνδυνοι (προϋπάρχοντες, όχι παλινδρόμηση του merge):**

1. `style-src 'unsafe-inline'` — αναγκαίο για Tailwind / λίγα `<style>`. Scripts μένουν `'self'` + Google Identity.
2. `VITE_*` public keys (Maps, Firebase, Ticketmaster query `apikey`) αν οριστούν στο build. Μην βάλετε secret Gemini στο `VITE_GEMINI_API_KEY`.
3. Chunk `index` 536 kB — προϋπάρχον, όχι μυστικό.
4. Firestore rules χωρίς emulator σε αυτή τη συνεδρία.

## 6. i18n

- User-facing copy περνά από `t` / `tu`. Round 23: ετικέτες εικονιδίων και «Αργότερα» δίγλωσσες.
- Ημερομηνίες στα Σχέδια: `formatPlanWhen(event.date, event.time, language)`.
- Υπόλοιπα χαμηλής σοβαρότητας: `HikeRouteCard` / adventure km με `el-GR` πάντα· shadcn `calendar.tsx` `toLocaleString("default")` (widget, όχι σελίδα προϊόντος).

## 7. UX — επιφάνειες

| Επιφάνεια | Τι δείχνει | Τι δεν δείχνει |
|---|---|---|
| Overlay «Βρες παρέα τώρα» | Mini outings Now 48h + Nearby 5 km | Κλεισμένα βράδια, αιτήματα εκδήλωσης |
| `/buddy-seek` | Παρέα για εκδήλωση + εικονίδια ενεργειών | Επανάληψη mini outings στο feed |
| `/plans` | Βράδια που έχεις κλείσει· στο τηλέφωνο 3 κάρτες + «Αργότερα» | Overlay shortcut |

Chat (από PR #15, μέσα στην άκρη): web popup μέχρι 4· group threads από Συνομιλίες ανοίγουν popup στο `md+`· στο τηλέφωνο τα event groups πάνε `/chat/:id`.

## 8. Γνωστά κενά (όχι blockers του merge)

| Θέμα | Κρίση |
|---|---|
| 4ο popup στα 1024px βγαίνει αριστερά (360px × 3 + offset) | Αληθές. Το 5ο μικραίνει το παλιότερο, αλλά το restore chip κάθεται κάτω από το δεξιότερο `z-modal`. Δεν διορθώθηκε εδώ (θέλει fit-to-width). |
| Devin: header crowding στα 1024 με Copilot· focus στο bubble καλύπτει «OK»· popup πάνω από Daily Schedule Close | Προϋπάρχοντα, δεν απαντήθηκαν στο GitHub. |
| Μόνιμο `*.nakamas.pages.dev` | Το workflow skip-άρει χωρίς `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`. |
| Firestore emulator | Δεν έτρεξε σε αυτό το VM. |
| `aria-expanded={false}` στη λίστα «Αργότερα» | Το στοιχείο φεύγει από τη λίστα με το tap· χαμηλή σοβαρότητα. |

## 9. Cloudflare preview

Μόνιμο Pages: **δεν** δημοσιεύτηκε (λείπουν τα repo secrets).

Ζωντανό preview αυτού του tip μέσω Cloudflare Quick Tunnel πάνω στο `tsx server.ts` (API + WS + Vite):

**https://romance-hon-legislative-hobby.trycloudflare.com**

Επαλήθευση: HTTP 200, `server: cloudflare`, `cf-ray`, `x-frame-options: DENY`, `nosniff`, `<title>Nakamas</title>`.

Το Quick Tunnel ζει όσο τρέχει αυτός ο Cloud Agent. Με τα δύο GitHub secrets, κάθε push σε `cursor/**` δίνει σταθερό `*.pages.dev`.

## 10. Συμπέρασμα

Η άκρη του project είναι το `Animus1991/parea_app` `ccr-4a44ddef-fgcwnr` @ `491ce6e` (round 23), και περιέχει ολόκληρη τη στοίβα του fork μέχρι το chat PR #15. Δεν μένει origin commit πίσω. Ο αυτοματισμός είναι πράσινος μετά τη μία προσαρμογή τεστ στον 10px floor. Τα υπολειπόμενα ευρήματα είναι προϋπάρχοντα ή θέματα διάταξης πολλών popup σε στενό desktop — κανένα δεν μπλοκάρει typecheck, lint, tests, contrast ή production build.
