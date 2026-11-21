# Εξονυχιστικός έλεγχος και συγχώνευση (21/11/2026)

Αντικείμενο: το πιο πρόσφατο branch του [Animus1991/parea_app](https://github.com/Animus1991/parea_app.git) μαζί με όλη την επικαιροποιημένη στοίβα του fork `tasoasteritopeleven/parea_app`, χωρίς παράλειψη λειτουργίας.

## 1. Ποιο είναι το «πιο επικαιροποιημένο» branch

Το default `main` στο GitHub του Animus σταματά στις 14/11/2026 (π.χ. `a3d0f24`). **Δεν είναι η άκρη του project.** Η ζωντανή γραμμή είναι:

| Άκρη | SHA | Ώρα (UTC) | Περιεχόμενο |
|---|---|---|---|
| `Animus1991/parea_app` `ccr-4a44ddef-fgcwnr` | `94f6727` | 21/11 12:41 | Round 21: μία μορφή ημερομηνίας, μεγαλύτερες επιφάνειες αφής, μασκότ, ασπίδα %, Playwright 165/165 |
| `tasoasteritopeleven` `cursor/mini-outings-nearby-now-2581` (PR #14) | `b990847` | 21/11 12:22 | Mini outings nearby/now, διαχωρισμός overlay / Nakamas / Σχέδια, Full chips, ελληνικές γειτονιές |
| **Αυτό το merge** `cursor/animus-round21-audit-2581` | (μετά το merge + διορθώσεις) | 21/11 | Και τα δύο, χωρίς απώλεια |

Κοινός πρόγονος: `3a4acf4` (round 19 docs). Από εκεί ο Animus έχει 4 μοναδικά commits (`86ba9f1`, `39e83e1`, `18e088e`, `94f6727`). Η στοίβα του fork έχει τα PR #2–#14 (tags, quick nav, wall, cards, mini outings).

**Στρατηγική:** `git fetch` και των δύο remotes · νέο branch από την άκρη των mini outings · `git merge animus/ccr-4a44ddef-fgcwnr` (όχι μεμονωμένα cherry-picks, ώστε να μην χαθεί κανένα αρχείο). Μετά το merge: `HEAD...animus/ccr-4a44ddef-fgcwnr` = **42 μπροστά, 0 πίσω**.

## 2. Μέθοδος

| Έλεγχος | Εργαλείο | Κάλυψη |
|---|---|---|
| Τοπολογία git | `fetch` Animus + origin, `rev-list --left-right` | Όλα τα branches `ccr-*` / `cursor/**` |
| Τύποι | `tsc --noEmit` | Όλο το project |
| ESLint | `eslint .` (react-hooks, jsx-a11y, restricted tokens) | `src/` |
| Unit | `vitest run` | Client + server |
| Αντίθεση | `npm run audit:contrast` | 90 ζεύγη × 9 θέματα |
| Build | `vite build` | Production bundle |
| Εξαρτήσεις | `npm audit` / `npm audit --omit=dev` | Όλο το δέντρο |
| Ασφάλεια | grep `eval`/`innerHTML`/`dangerouslySetInnerHTML`, CSP, headers, `safeExternalUrl`, keys | Client, server, dist |
| i18n | `t()` σάρωση, `formatPlanWhen*`, `toLocale*` | UI strings |
| a11y | axe E2E matrix + lint jsx-a11y | Υψηλής κίνησης διαδρομές |
| E2E | Playwright Chromium | 177 tests (Animus 165 + overlay/cards/wall extras) |
| Runtime | Playwright στο `127.0.0.1:3000` + Cloudflare Quick Tunnel | Home, Plans, Nakamas, overlay, Wall, Tags |

## 3. Συγκρούσεις merge και τι κρατήθηκε

Πέντε αρχεία είχαν σύγκρουση. Κανένα δεν έμεινε με markers.

| Αρχείο | Απόφαση |
|---|---|
| `BuddySeekPageContent` | Και `formatPlanWhen` (Animus) και Full photo chips. **Χωρίς** `MiniOutingsSection` (ο διαχωρισμός του overlay μένει) |
| `ConnectionsPageContent` | `locationMatchesQuery` + `formatPlanWhenDay` + μασκότ |
| `PlansPageContent` | `CardImageDepthFrame` + κλικ στη φωτογραφία + τίτλος-`Link` + `formatPlanWhen`. Το κουμπί «Λεπτομέρειες» αφαιρέθηκε μετά το merge, όπως στον Animus: φωτογραφία και τίτλος ανοίγουν την εκδήλωση |
| `TagsPageContent` | Ευρετήριο A–Ω + compact/detailed **και** `character="explorer"` |
| `PostCard` | `CommentThread` (σύγχρονα σχόλια) + `formatPlanWhen`. Διπλό import διορθώθηκε |

Το τεστ `e2e/outings.spec.ts` πήρε το `page.clock` του Animus ώστε το demo καφέ να μην πέφτει στο Ιστορικό μετά τις 11:00.

## 4. Αποτελέσματα αυτοματισμού

| Μέτρηση | Αποτέλεσμα |
|---|---|
| TypeScript | 0 σφάλματα (μετά τη διόρθωση διπλού `formatPlanWhen`) |
| ESLint σφάλματα | 0 |
| ESLint προειδοποιήσεις | 7 (βλ. §8) · το CI δεν αποτυγχάνει σε warnings |
| Vitest | 418 πέρασαν, 26 παραλείφθηκαν, 0 απέτυχαν (72 αρχεία + 1 skipped) |
| Contrast AA | 90/90 ζεύγη, 9 θέματα |
| `npm audit` | 0 ευπάθειες (με και χωρίς dev) |
| Production build | OK, ~12 s · μεγαλύτερα chunks: `index` 524 kB / firebase 465 kB (προϋπάρχον) |
| Playwright | 177 tests. Πλήρης διαδρομή 176/177· το `img[alt]` στα Σχέδια απέτυχε επειδή το Full depth καλύπτει τη φωτογραφία με κουμπί (το img είναι `alt=""`). Το τεστ κοιτάζει πλέον `img[src*="/covers/coffee.jpg"]` και πέρασε. Buddy-seek / overlay / cards: όλα πράσινα. |

## 5. Ασφάλεια

**Θετικά (επαληθευμένα στο merge tree):**

- CSP enforce στο Express **μόνο σε production** (`NODE_ENV=production`) και στο `dist/_headers` (Cloudflare Pages). Στο dev `tsx server.ts` το CSP παραλείπεται σκόπιμα. `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`.
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` για camera/mic/geo, `COOP: same-origin-allow-popups`.
- Δεν υπάρχει `eval` / `new Function` / `document.write` στο `src/`.
- `dangerouslySetInnerHTML` μόνο σε σταθερό CSS (Leaflet sidebar, shadcn chart themes) — όχι δεδομένα χρήστη.
- Εξωτερικά `target="_blank"` έχουν `rel="noopener noreferrer"` (και `nofollow ugc` στο wall).
- `safeExternalUrl` μπλοκάρει `javascript:` / `data:` / `vbscript:`.
- GPS συσκευής **δεν** γίνεται δημόσιο pin (`publicMiniOutingPin`). Δημοσίευση mini outing απαιτεί γνωστή γειτονιά (`placeForArea`, aliases Αθήνα/Αττική).
- Γράψιμο καταλόγου εκδηλώσεων: κλειστό σε production εκτός token.
- Socket.IO δεν είναι πλέον `origin: '*'`.
- `npm audit`: 0.

**Υπολειπόμενοι κίνδυνοι (όχι παλινδρόμηση του merge):**

1. `style-src 'unsafe-inline'` — αναγκαίο για Tailwind runtime / λίγα inline `<style>`. Scripts μένουν `'self'` + Google Identity.
2. Κλειδιά `VITE_*` (Ticketmaster, Gemini, Maps, Firebase) μπαίνουν στο client bundle αν οριστούν. Το Ticketmaster `apikey` πηγαίνει query string. Σωστό για public Discovery keys· **μην** βάζετε secret Gemini στο `VITE_GEMINI_API_KEY` χωρίς proxy (`VITE_AI_USE_PROXY`).
3. Demo login ανοιχτό εκτός `MODE=production` (ή `VITE_DEMO_LOGIN=true`).
4. Firestore rules ελέγχονται στο ξεχωριστό CI job με emulator· δεν ξανατρέχουν σε αυτό το VM.

## 6. i18n

- Οι ημερομηνίες περνούν από `formatPlanWhen` / `formatPlanWhenDay` / `formatLongDay` (el/en, έτος μόνο αν δεν είναι το τρέχον).
- User-facing copy συνεχίζει να περνά από `t(el, en)` / `useLanguage`.
- Ελληνικές γειτονιές: `Παγκράτι, Αθήνα` και `Πλάκα, Αττική` γίνονται δεκτές· `Plaka, Milos` απορρίπτεται.
- Υπόλοιπα (προϋπάρχοντα, χαμηλής σοβαρότητας): `HikeRouteCard` / adventure km χρησιμοποιούν πάντα `el-GR` για αριθμούς· το shadcn `calendar.tsx` έχει `toLocaleString("default")` (μηνιαίες ετικέτες widget, όχι σελίδα προϊόντος).

## 7. UX — τρεις επιφάνειες, όχι τρία αντίγραφα

| Επιφάνεια | Τι δείχνει | Τι δεν δείχνει |
|---|---|---|
| Overlay «Βρες παρέα τώρα» | Mini outings, Now 48h + Nearby 5 km, κατάταξη ρολόι+απόσταση | Κλεισμένα βράδια, αιτήματα παρέας για εκδήλωση |
| `/buddy-seek` | Παρέα για εκδήλωση (Plans forming) | `MiniOutingsSection` / «Καφές στο Κουκάκι» |
| `/plans` | Βράδια που έχεις ήδη κλείσει | Overlay shortcut (`hidesFindCompanyShortcut`) |

Και τα δύο δέντρα (Animus round 21 + cards/wall/mini-outings) συνυπάρχουν: Full photo chips, τίτλος-σύνδεσμος, μία ημερομηνία, μασκότ στα κενά, ασπίδα %, σύγχρονα σχόλια τοίχου.

## 8. Προσβασιμότητα — υπολειπόμενες προειδοποιήσεις ESLint

Καμία δεν είναι σφάλμα CI. Καμία δεν εισήχθη ως νέο σφάλμα τύπου.

| Αρχείο | Κανόνας | Κρίση |
|---|---|---|
| `PostCard.tsx` | `jsx-a11y/no-autofocus` | Σκόπιμο στο composer απάντησης |
| `PostReactionBar.tsx` / `CommentThread.tsx` | static/noninteractive listeners | Hover+πληκτρολόγιο tray· τα κουμπιά μέσα είναι native |
| `CardImageDepthFrame.tsx` | react-refresh export | Helper μαζί με component |
| `JoinGroupFlow.tsx` | exhaustive-deps `myGroup` | Προϋπάρχον |

Το ad-hoc `z-[90]` στο reaction tray αντικαταστάθηκε με `z-20` (τοπικό stacking, ίδιο με το comment tray).

## 9. Cloudflare preview

Το workflow `cloudflare-pages.yml` χρειάζεται `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` στο fork για `*.pages.dev`. Χωρίς αυτά το job παραλείπει το deploy.

Ζωντανό preview αυτού του tip μέσω Cloudflare Quick Tunnel στο ίδιο VM που σερβίρει το merged `tsx server.ts`:

**https://moisture-aug-freight-betting.trycloudflare.com**

Headers του tunnel: `cf-ray`, `x-frame-options: DENY`, `nosniff`, Permissions-Policy. HTTP 200 τη στιγμή του ελέγχου.

## 10. Συμπέρασμα

Το merge είναι πλήρες ως προς την άκρη Animus `94f6727` και ως προς τη στοίβα mini-outings/cards/wall. Δεν μένει commit του Animus πίσω. Οι διορθώσεις μετά το merge είναι μηχανικές (διπλό import, z-index, αφαίρεση του πλεονάζοντος «Λεπτομέρειες» στα Σχέδια ώστε να ισχύει η απόφαση του Animus). Τα υπολειπόμενα ευρήματα είναι προϋπάρχοντα και καταγεγραμμένα· κανένα δεν μπλοκάρει typecheck, tests, contrast ή production build.
