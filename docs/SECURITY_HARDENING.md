# Θωράκιση ασφαλείας (14/11/2026)

Το έγγραφο καλύπτει τα ευρήματα Critical και High του `COMPREHENSIVE_AUDIT_2026-11-14.md` §4 που λύνονται χωρίς πραγματικό backend χρηστών.
Λέει επίσης ρητά τι μένει ανοιχτό.

## 1. Τι άλλαξε

| Εύρημα | Πριν | Τώρα | Αρχεία |
|---|---|---|---|
| Εγγραφές `POST/PUT /api/events` χωρίς έλεγχο | Οποιοσδήποτε έγραφε ή αντικαθιστούσε εκδηλώσεις | Ανοιχτές μόνο σε development. Σε production κλειστές, εκτός αν οριστεί `EVENTS_WRITE_TOKEN` ή `EVENTS_WRITE_MODE=open`. Έλεγχος πεδίων, όριο ρυθμού, όχι αντικατάσταση υπάρχοντος id | `server.ts`, `server/security.ts` |
| CORS και Socket.IO `*` | Κάθε site μπορούσε να καλεί το API | Same-origin πάντα. Ξένα origins μόνο από `ALLOWED_ORIGINS`. Localhost μόνο σε development | `server.ts` |
| `/api/ai/generate` με μοντέλο από τον client | Ο client διάλεγε μοντέλο και ρυθμίσεις | Μόνο prompt έως 4000 χαρακτήρες. Μοντέλο και ρυθμίσεις από τον server | `server.ts` |
| `/api/ai/copilot` | Έλεγχος μεγέθους μόνο | Και έλεγχος ονομάτων εργαλείων και ρόλων μηνυμάτων | `server.ts` |
| Πλαστό `senderId` στο chat | Κάθε μήνυμα δήλωνε όποιον αποστολέα ήθελε | Η ταυτότητα ορίζεται στη σύνδεση. Αποστολή μόνο σε δωμάτιο όπου έγινε join. Έως 2000 χαρακτήρες, όριο ρυθμού | `server.ts` |
| Ρόλος admin = `isOrganizer` | Το «Γίνε οικοδεσπότης» άνοιγε τη Διαχείριση, τα εργαλεία admin του AI και τον έλεγχο κάθε ομαδικής συνομιλίας | Νέο `isAdmin` μόνο από τα seed δεδομένα. Επαναφέρεται σε κάθε φόρτωση. Το `updateUser` το αγνοεί | `src/lib/roles.ts`, `src/store/index.ts` |
| `/admin` χωρίς φρουρό | Ανοιγόταν με πληκτρολόγηση του URL | `RequireAdmin` επιστρέφει στην αρχική | `src/components/auth/RequireAdmin.tsx` |
| Firestore: αυτο-προαγωγή | Ο κάτοχος έγραφε `isOrganizer`. Όλοι διάβαζαν όλα τα προφίλ | Ανάγνωση και εγγραφή μόνο από τον κάτοχο. Απόρριψη προνομιακών πεδίων. Έλεγχος πεδίων | `firestore.rules`, `src/services/firebaseUserProfile.ts` |
| Firestore: chat | Κάθε συνδεδεμένος διάβαζε κάθε δωμάτιο | Αν υπάρχει έγγραφο δωματίου με `memberIds`, μόνο τα μέλη | `firestore.rules` |
| Headers ασφαλείας | `public/_headers` είχε κυριολεκτικό «\n» και δεν εφαρμοζόταν | Σωστό αρχείο και ίδια headers στον Express | `public/_headers`, `server/security.ts` |
| Ιστορικό ενεργειών AI | Δεν υπήρχε | Κάθε ενέργεια του copilot καταγράφεται και φαίνεται στη Διαχείριση → Σύστημα | `src/store/aiAuditStore.ts` |

## 2. Νέες ρυθμίσεις περιβάλλοντος

| Μεταβλητή | Τι κάνει |
|---|---|
| `ALLOWED_ORIGINS` | Ακριβή ξένα origins που επιτρέπονται, χωρισμένα με κόμμα |
| `EVENTS_WRITE_TOKEN` | 16+ χαρακτήρες. Απαιτεί `Authorization: Bearer <token>` για εγγραφές εκδηλώσεων |
| `EVENTS_WRITE_MODE` | `open` ανοίγει τις εγγραφές σε όλους. Μόνο για προσωρινές επιδείξεις |
| `EVENTS_WRITE_LIMIT_PER_MINUTE` | Όριο εγγραφών ανά IP, προεπιλογή 20 |
| `GEMINI_TEXT_MODEL` | Μοντέλο για σύντομα κείμενα. Προεπιλογή ίδιο με `GEMINI_MODEL` |
| `TRUST_PROXY` | Όταν ο server είναι πίσω από CDN ή proxy, για σωστή IP στα όρια ρυθμού |
| `FIREBASE_PROJECT_ID` | Ενεργοποιεί την επαλήθευση Firebase ID tokens στον server. Αν λείπει, χρησιμοποιείται το `VITE_FIREBASE_PROJECT_ID` |
| `AUTH_OPTIONAL` | `true` αφήνει το AI και το chat ανοιχτά χωρίς token. Δεν συνιστάται |
| `VITE_DEMO_LOGIN` | Λογαριασμοί demo στη σελίδα σύνδεσης. Προεπιλογή: εμφανίζονται, εκτός από build παραγωγής με Firebase |
| `AUTH_TEST_JWKS_FILE` | Μόνο εκτός παραγωγής: τοπικά κλειδιά για δοκιμές end-to-end χωρίς Google |
| `CSP_MODE` | `enforce` (προεπιλογή), `report-only` ή `off` για το Content-Security-Policy |
| `CSP_CONNECT_SRC` | Επιπλέον origins για `connect-src`, χωρισμένα με κενό |

## 3. Τι επαληθεύτηκε

| Έλεγχος | Αποτέλεσμα |
|---|---|
| Unit tests `server/security.test.ts` | 11/11 |
| Ζωντανός server, development | Ξένο origin 403, localhost 200, άκυρη εκδήλωση 400, έγκυρη 201, ίδιο id 409, άγνωστα πεδία δεν αποθηκεύονται |
| Ζωντανός server, production | Εγγραφή 403 χωρίς token, localhost origin 403, same-origin 200 |
| Socket.IO | Πλαστός αποστολέας και δωμάτιο χωρίς join απορρίπτονται. Ξένο origin δεν συνδέεται |
| Playwright | `/admin` κλειστό σε μέλη, ανοιχτό στον συντονιστή επίδειξης |

Οι κανόνες Firestore επαληθεύονται πλέον με emulator:

| Έλεγχος | Πώς |
|---|---|
| `npm run test:rules` | `firebase-tools` emulator + `server/firestore.rules.test.ts` |
| CI job `Firestore rules (emulator)` | `.github/workflows/ci.yml` |
| Ανάθεση ρόλων | `npm run set-role` → `scripts/set-role.ts` / `server/roleAdmin.ts` |

## 4. Ταυτότητα στον server (δεύτερος γύρος, 14/11/2026)

Όταν οριστεί `FIREBASE_PROJECT_ID`, ο server επαληθεύει το Firebase ID token κάθε κλήσης (`server/auth.ts`):
υπογραφή RS256 με τα δημόσια κλειδιά της Google, issuer, audience, λήξη, `iat`, `auth_time` και `sub`.
Οι ρόλοι έρχονται μόνο από υπογεγραμμένα custom claims (`role`, `admin`) που ορίζει backend με το Admin SDK.

| Πόρος | Χωρίς token | Επισκέπτης (anonymous) | Μέλος | Συντονιστής ή admin |
|---|---|---|---|---|
| `GET /api/events`, `/api/health` | Ναι | Ναι | Ναι | Ναι |
| `POST /api/events` | 401 | 403 | Ναι, με διοργανωτή τον εαυτό του | Ναι |
| `PUT /api/events/:id` | 401 | 403 | Μόνο δικές του, χωρίς αλλαγή διοργανωτή | Όλες |
| `/api/ai/*` | 401 | Ναι | Ναι | Ναι |
| Socket.IO chat | Απορρίπτεται | Ναι | Ναι | Ναι |

- Τα μηνύματα chat αποδίδονται πάντα στο επαληθευμένο uid. Ένα δηλωμένο `senderId` δεν μετράει.
- Τα όρια ρυθμού ακολουθούν τον χρήστη, όχι την IP, όταν είναι γνωστός.
- Το `EVENTS_WRITE_TOKEN` μένει για εργασίες back-office.
- Ο client στέλνει το token σε κάθε κλήση API, AI και socket (`src/lib/authToken.ts`).
- Το UI διαβάζει τον ρόλο από τα claims.
- Σε build παραγωγής με Firebase, η σελίδα σύνδεσης δεν δείχνει λογαριασμούς demo. Αν αποτύχει η σύνδεση Google, δεν γίνεται πια σύνδεση σε λογαριασμό demo.
- Χωρίς `FIREBASE_PROJECT_ID`, όλα δουλεύουν όπως πριν, σε λειτουργία demo.

| Επαλήθευση | Αποτέλεσμα |
|---|---|
| Unit tests `server/auth.test.ts` | 12/12: έγκυρο token, ξένο audience, ξένος issuer, λήξη, ξένη υπογραφή, μελλοντικό `auth_time`, κενό `sub`, ρόλοι, ιδιοκτησία |
| Ζωντανός server με υπογεγραμμένα tokens | 21/21 σενάρια: τα παραπάνω δικαιώματα, πλαστά και ληγμένα tokens, socket χωρίς token, απόδοση μηνύματος στο uid |
| Ζωντανός server χωρίς Firebase | Ίδια συμπεριφορά με πριν: εγγραφή στο development 201, AI χωρίς κλειδί 503 |

## 5. Content-Security-Policy

Ο server παραγωγής και το στατικό build (`dist/_headers`) στέλνουν το ίδιο CSP (`server/csp.ts`).
Οι κανόνες βγήκαν από απογραφή όλων των εξωτερικών πηγών της εφαρμογής.

| Οδηγία | Τιμή |
|---|---|
| `script-src` | Μόνο η εφαρμογή και τα σενάρια σύνδεσης της Google. Χωρίς `unsafe-inline` και `unsafe-eval` |
| `connect-src` | Η εφαρμογή, Firebase και Google APIs, Ticketmaster, και αυτόματα το `VITE_API_BASE_URL` και το `VITE_WS_URL` |
| `frame-src` | Σύνδεση Google και το iframe του Firebase Auth, μαζί με το `authDomain` |
| `img-src` | `https:`, γιατί οι φωτογραφίες εκδηλώσεων έρχονται από πολλές πηγές |
| `object-src`, `frame-ancestors` | `'none'` |

Οι παραβιάσεις καταγράφονται στο `/api/csp-report`. Η καταγραφή έχει όριο ρυθμού και δεν αποθηκεύεται.
Επαλήθευση: build παραγωγής, 30 διαδρομές σε υπολογιστή και κινητό, 0 παραβιάσεις και 0 σφάλματα σελίδας. Επίσης 4 unit tests, μεταξύ των οποίων η απόρριψη κακόβουλων τιμών στις ρυθμίσεις.

## 6. Τι μένει ανοιχτό

- Τα `memberIds` των δωματίων chat στο Firestore πρέπει να τα γράφει Cloud Function. Stub + οδηγίες: `functions/` (το demo chat συνεχίζει χωρίς να χαθεί λειτουργικότητα).
- Ορισμός ρόλων σε live project: `npm run set-role -- <uid> moderator|admin|member` όταν υπάρχουν Admin SDK credentials.
- Οι ροές σύνδεσης Firebase και Google με πραγματικό project × CSP: δοκίμασε πρώτα `CSP_MODE=report-only`. Το UI δείχνει μία ήρεμη ειδοποίηση αν ο browser αναφέρει CSP violation (`CspViolationToast`).
