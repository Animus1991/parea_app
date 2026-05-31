# Προδιαγραφές & Χαρακτηριστικά Πλατφόρμας (Platform Features & Architecture)

Το παρόν έγγραφο καταγράφει αναλυτικά και υπερεξονυχιστικά το σύνολο των αρχιτεκτονικών, λειτουργικών και σχεδιαστικών (UI/UX) προδιαγραφών που έχουν τεθεί για την πλατφόρμα. Μπορεί να χρησιμοποιηθεί ως ο βασικός οδικός χάρτης (roadmap) ανάπτυξης, ως τεχνικό εγχειρίδιο αναφοράς (reference manual) και ως documentation των χαρακτηριστικών της εφαρμογής.

---

## 1. Κεντρική Φιλοσοφία & Όραμα (Executive Philosophy)
Η πλατφόρμα είναι σχεδιασμένη ως ένα **"Event-Intent-First"** (και όχι αμιγώς social-media) εργαλείο δικτύωσης. Στοχεύει στη διαμόρφωση μικρών, κλειστών ομάδων συνοδείας (companionship) για την παρακολούθηση εκδηλώσεων. Βασικός γνώμονας είναι η ασφάλεια, η διαφάνεια, ο σεβασμός της ιδιωτικότητας και η απουσία "οπτικού θορύβου" (minimal, anti-clutter AI slop UI). 

---

## 2. Ιεραρχία Υλοποίησης & Βασικότερων Χαρακτηριστικών

### Α. Επίπεδο Συστήματος Στόχευσης & Ασφάλειας (High Priority - Core Business Logic)
- **Σύστημα Trust Tiers (Επίπεδα Εμπιστοσύνης):**
  - Εφαρμογή πολύπλοκης ιεραρχίας χρηστών (π.χ. `1_explorer`, `2_confirmed`). Διακριτή οπτική και λειτουργική σηματοδότηση του επιπέδου εμπιστοσύνης σε κάθε event και προφίλ.
  - Έλεγχος πρόσβασης: Προϋποθέσεις εγγραφής σε ομάδες με βάση το Trust Tier.
- **Διαχείριση Ασφάλειας & Τοποθεσίας (Safety & Live Tracking):**
  - Δυνατότητα `Share Live Location` (Κοινοποίηση Ζωντανής Τοποθεσίας) στα επιβεβαιωμένα μέλη της ομάδας την ημέρα του event.
  - Ενσωμάτωση χάρτη (`EventMap`) με custom markers και pinpoints ακριβείας.
- **Δομή Δεδομένων / Store (Zustand):**
  - Υβριδική λειτουργία με `Mode` επιλογής μεταξύ εικονικών δεδομένων (`mockEvents`, `mockUsers`) και πραγματικού API payload.
  - Κεντρικό State Management για ταυτόχρονη διαχείριση `events`, `groups`, `currentUser`, και `notifications`.

### Β. Επίπεδο Σχεδιασμού UI/UX & Responsive Development (High/Medium Priority)
- **Σχεδιαστική Γλώσσα (Design Language):** 
  - Χρήση Tailwind CSS για Utility-first styling. Επιβολή αυστηρών αποχρώσεων (π.χ. `cyan-600` primary) και rounded (md: `rounded-2xl`, `rounded-3xl`) γωνιών.
  - Minimalistic cards, χρήση αρνητικού χώρου (negative space) και κομψή τυπογραφία.
- **Ανταποκρίσιμος Σχεδιασμός (Adaptive Density / Responsiveness):**
  - *Tablet / Desktop:* Δομημένη παρουσίαση υψηλής πυκνότητας δεδομένων. (π.χ. στα κελιά του Ημερολογίου εμφανίζονται micro-thumbnails βάσει γεωμετρικών pattern - split halves, grids).
  - *Mobile:* Απλοποιημένη εμπειρία. H πολυπλοκότητα συμπτύσσεται (π.χ. εμφάνιση απλών dot indicators ή του αθροίσματος "N+" αντί για φωτογραφίες) ώστε να διατηρείται τεράστιο το touch area (Accessibility).
- **Προηγμένο Θεματικό Σύστημα:**
  - Χρήση του custom hook `usePageContrast` για δυναμική εναλλαγή (Light / Dark mode, Background context contrast).
- **Διεθνοποίηση (i18n):**
  - **Αμιγώς δίγλωσση υλοποίηση.** Υποχρεωτική χρήση της συνάρτησης `t("Ελληνικά", "English")` σε όλο το user-facing κείμενο ("εξονυχιστική εφαρμογή").

### Γ. Προηγμένα Χαρακτηριστικά Διεπαφών (Specific Component Implementations)

#### 3.1. Το έξυπνο Ημερολόγιο (Advanced Smart Calendar)
- **Πολυεπίπεδη Διαδραστικότητα στα Κελιά (Cell Interactivity):**
  - *Single Click / Tap:* Ανοίγει την immersive προβολή "Stories Mode" για την επιλεγμένη ημέρα. Ο χρήστης εστιάζει στην ανακάλυψη.
  - *Double Click:* Εμφανίζει τη λεπτομερή προβολή του Ωριαίου Προγράμματος (Hourly Schedule View).
- **Γεωμετρικός Σχεδιασμός Thumbnail Κελιών:**
  - Απαιτητικός αλγόριθμος background εικόνων εάν η ημέρα περιέχει πολλαπλά Events:
    - *1 Event:* Πλήρης κάλυψη.
    - *2 Events:* Split screen ή διαγώνιο κόψιμο `clipPath`.
    - *3 Events:* Grid / Columns distribution.
    - *4+ Events:* Χωρισμός 2x2 grid ή εμφάνιση του υπολοίπου σε κουτί (`+N`).
- **Λειτουργία Εξαγωγής (Export):**
  - Άμεση δημιουργία και λήψη `.ics` αρχείων για συγχρονισμό με Outlook / Apple Calendar / Google Calendar εξωτερικά.
- **Μηχανισμοί Ασφαλείας Δεδομένων:**
  - Σωστή αποτύπωση των current dates, φιλτράρισμα παλιών γεγονότων και αποτροπή ατελέρμονης κύλισης του State (αποφυγή memory leaks).

#### 3.2. Immersive "Story Viewer"
- **Μηχανισμός:** Οπτική αναπαράσταση παρόμοια με Instagram Stories, αλλά αποκλειστικά για γεγονότα.
- **Χαρακτηριστικά:**
  - Αυτόματη εναλλαγή, μπάρα προόδου (progress bars).
  - Εμφάνιση της κύριας πληροφορίας: Φωτογραφία, Ώρα, Τύπος (π.χ. Δωρεάν / Επί πληρωμή), Επίπεδο Ασφαλείας.
  - Smart Call to Actions (CTAs): Κουμπί "Δες εκδήλωση" / "Ημερήσιο πρόγραμμα" που αναλαμβάνει ομαλό redirect με το `useNavigate`.

#### 3.3. Σελίδα Λεπτομερειών Εκδήλωσης (Event Detail Page)
- **Διαχείριση Εικόνων & CDNs:**
  - Χρήση ακριβών `imageUrl` απευθείας από τη βάση δεδομένων και πλήρης εξάλειψη broken URL paths (π.χ. κατάργηση ερωτημάτων `unsplash.com/random` που σπάνε).
- **Λειτουργίες Κοινοποίησης & Σύνδεσης:**
  - **Native Share Web API:** `navigator.share` για κινητά, fallback σε απλό `navigator.clipboard.writeText` με Toast Notifications.
  - **QR Code Modal:** Δυνατότητα dynamic παραγωγής QR με το link της εκδήλωσης για άμεσο on-site sharing.
- **Ομαλή Πλοήγηση:**
  - Intelligent "Back Button": `navigate(-1)` εάν υπάρχει ιστορικό στο `window.history.state`, αλλιώς fallback στο `/`.

#### 3.4. Σύστημα Ομάδων (Group Dynamics)
- Μηχανισμός Join: Ροή `JoinGroupFlow`. Έλεγχος για κενές θέσεις.
- Συνομιλίες:`GroupChat` Integration (mock-up functionality που αντικατοπτρίζει WebSocket rooms).
- Feedback / Βαθμολογία μετά το πέρας της εκδήλωσης.

---

## 4. Τεχνικό Χρέος & Προδιαγραφές Ανάπτυξης (Technical Guidelines)
1. **Δομή Αρχείων:** Διατηρούνται αυστηρά ξεχωριστά αρχεία ανά Context. Large logic μπαίνει σε ξεχωριστά Hooks (π.χ. `usePageContrast`).
2. **Type-Safe Code:** Υποχρεωτική χρήση Typescript Interfaces για όλο το Payload structure (πχ το Interface `Event` και `User`). Δεν επιτρέπονται ανύπαρκτες μεταβλητές σε Props.
3. **Icons & Animations:** Αυστηρή χρήση της βιβλιοθήκης `lucide-react` για εικονογράφηση και `motion/react` (Framer Motion) για page transitions, popups, scale up buttons.

*(Το έγγραφο ανανεώνεται δυναμικά κατά την εξέλιξη της παραγωγής του Nakamas Project - V1.0.0)*
