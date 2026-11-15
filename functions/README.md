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
