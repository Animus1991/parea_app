# Cloud Functions (planned)

Το client και οι `firestore.rules` περιμένουν ότι τα `memberIds` των chat rooms
τα γράφει **μόνο** μια αξιόπιστη Cloud Function (όχι ο browser).

Αυτός ο φάκελος είναι το σημείο εκκίνησης — δεν αφαιρεί καμία υπάρχουσα ροή.
Μέχρι να συνδεθεί πραγματικό Firebase Functions project, το demo chat
συνεχίζει να δουλεύει τοπικά μέσω Socket.IO / mock store.

## Προϋπόθεση

Τα μέλη πρέπει να έρχονται από έμπιστη πηγή. Σήμερα οι ομάδες ζουν μόνο στον client, οπότε πρώτα πρέπει να μεταφερθούν στο Firestore ή στον server, με έλεγχο συμμετοχής. Αλλιώς τα `memberIds` θα ήταν ψεύτικη ασφάλεια.

## Ρόλος

| Trigger | Ενέργεια |
|---|---|
| Δημιουργία / ενημέρωση ομαδικής συνομιλίας | Γράφει `chatRooms/{id}.memberIds` |
| Αποχώρηση μέλους | Αφαιρεί το uid από `memberIds` |

## Τοπική δοκιμή

```bash
# όταν υπάρχει project:
# firebase emulators:start --only functions,firestore
```

Δες επίσης `npm run set-role -- --uid <uid> --role moderator` και `npm run test:rules` στο root.

## Τοίχος & κοινό (Φ26) — `src/socialGraph.ts`

Καθαρές συναρτήσεις (χωρίς εξάρτηση από Firebase), με unit tests (`npx vitest run functions`),
που ένα Cloud Function τρέχει αυτούσιες όταν συνδεθεί project. Χρησιμοποιούν **τον ίδιο** κανόνα
κοινού με την εφαρμογή (`src/lib/audience.ts`), οπότε ό,τι βλέπει κάποιος στο demo είναι ακριβώς
ό,τι θα λάβει στη ροή του από τον server.

| Trigger | Συνάρτηση | Εγγραφή |
|---|---|---|
| Αποδοχή αιτήματος σύνδεσης | `applyConnection` | `socialGraph/{a}`, `socialGraph/{b}` (αμοιβαία) |
| Αφαίρεση σύνδεσης | `applyDisconnect` | και οι δύο πλευρές |
| Αποκλεισμός / άρση | `applyBlock` / `applyUnblock` | `blocked` + αφαίρεση σύνδεσης |
| Δημιουργία / αλλαγή / διαγραφή δημοσίευσης | `diffFanOut` | `feeds/{uid}/items/{postId}` (add/remove), δημόσιος δείκτης για `public` |
| Δημοσίευση «Nakamas των Nakamas» | `friendsOfFriendsReach` | `audience.reachIds` (οι κανόνες δεν διασχίζουν γράφημα) |

Οι `firestore.rules` εμπιστεύονται μόνο το `socialGraph` (εγγραφή: μόνο backend) και τα
custom claims (`role: moderator|admin`) για την εποπτεία.
