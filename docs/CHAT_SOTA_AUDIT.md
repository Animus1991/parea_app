# State-of-the-Art Chat Audit — Nakamas / Parea

> Εξονυχιστικός έλεγχος του chat subsystem και πλάνο αναβάθμισης σε state-of-the-art επίπεδο.
> Βάση: πλήρης χαρτογράφηση κώδικα (file:line), ποσοτικοποιημένη απογραφή, gap analysis έναντι SOTA προτύπων (WhatsApp / Telegram / Messenger / Discord / Slack patterns, προσαρμοσμένα στο social-event context της εφαρμογής).
> Ημερομηνία: 2026-07-30. Συνδέεται με τα tickets P3.1 / P3.2 / P4.11–P4.14 / P5 του master UI/UX plan.

---

## Μέρος 1: Executive Summary — Διάγνωση

Το chat της εφαρμογής έχει **δυνατό product DNA** (contextual conversations, relationship-gated permissions, ephemeral-by-default, meeting-point & safety flows, quick replies) αλλά η εκτέλεση πάσχει δομικά σε 4 επίπεδα:

| Επίπεδο | Διάγνωση | Σοβαρότητα |
|---|---|---|
| **Αλήθεια δεδομένων** | **3 αποσυνδεδεμένα chat stacks** με 3 διαφορετικά message models και 3 persistence namespaces. Το accept-flow γράφει στο ένα, ο launcher δείχνει το άλλο. | Κρίσιμη |
| **Πραγματικότητα συμπεριφορών** | Unread/typing/expiry/privacy είναι **mocked ή write-only**: 7 στατικές seed συνομιλίες, 50 fake μηνύματα ανά group, hardcoded unread/typing στο `g1`, κανένας expiry timer, privacy toggles που δεν εφαρμόζονται πουθενά. | Κρίσιμη |
| **Real-time** | Υπάρχει έτοιμο plumbing (Socket.IO + Firebase Firestore + hook), αλλά είναι **αδρανές** χωρίς env config· το send είναι optimistic μόνο μονής κατεύθυνσης (χωρίς ack/retry/dedupe). | Υψηλή |
| **Feature completeness** | Απουσιάζουν SOTA βασικά: send states, read receipts, typing (πραγματικό), replies/reactions/mentions, media, polls, search, presence, πραγματικό expiry. | Υψηλή |

**Θετικό:** Το theming gap **διορθώθηκε σήμερα** (2026-07-30): ολόκληρο το popup stack μετατράπηκε σε semantic tokens (`surface/ink/brand/border`) και κληρονομεί αυτόματα κάθε ένα από τα 9 θέματα· διορθώθηκε και token gap `brand-fg` στα chromatic dark θέματα.

---

## Μέρος 2: Ποσοτικοποιημένη Απογραφή Τρέχουσας Κατάστασης

### 2.1 Τα 3 stacks («3 αλήθειες»)

| # | Stack | Store / persistence | Message model | Ποιος γράφει |
|---|-------|--------------------|---------------|--------------|
| **A** | Popup chat (launcher + inbox + windows) | `useChatStore` → `localStorage['nakamas-chat-v1']` | `ChatMessage` | **Μόνο mock seeds.** Κανένα flow δεν δημιουργεί συνομιλία εδώ. |
| **B** | Full-page group chat (`/chat/:groupId`) | `useGroupChatMessages` → `localStorage['nakamas-group-chat-v1:<groupId>']` | `GroupChatMessage` | Fake seed (50 μηνύματα) + local `setMessages` |
| **C** | Main store (ο *πραγματικός* κόσμος) | `useStore` → `localStorage['nakamas-store-v1']` | `Group`, `AppNotification`, `CompanyJoinRequest` | `acceptCompanyJoinRequest`, `respondGroupMerge` κ.λπ. |

Ροή σφάλματος: τα accept/merge flows δημιουργούν **Groups στο C** → το `/chats` inbox διαβάζει **C** → το tap ανοίγει **B** → και το popup **A δεν μαθαίνει ποτέ τίποτα**. Ο launcher/inbox δείχνει μόνο τις 7 hardcoded mock συνομιλίες.

### 2.2 Message models (3 ασύμβατα σχήματα)

| Model | Αρχείο | Σχήμα | Ασυμβατότητες |
|---|---|---|---|
| `ChatMessage` | `src/types/chat.ts:63-71` | `{id, conversationId, senderId, senderType, type, body, createdAt}` | — |
| `GroupChatMessage` | `src/hooks/useGroupChatMessages.ts:3-10` | `{id, senderId, senderName, text, timestamp, type?}` | `body↔text`, `createdAt↔timestamp`, χωρίς `senderType`, διαφορετικό `type` union |
| `FirebaseChatMessage` | `src/lib/realtime/firebaseChat.ts:18-23` | `{conversationId, senderId, body, createdAt}` | wire-only, χωρίς adapter |

Κανένας adapter/μετασχηματισμός δεν υπάρχει μεταξύ τους.

### 2.3 Αρχεία & όγκος

**Popup stack (15 αρχεία, ~1.450 γραμμές):** `chatStore.ts` (287), `chat.ts` types (96), `chatPermissions.ts` (116), `mockChatData.ts` (168), `PopupChatRoot` (76), `PopupChatLauncher` (45), `ChatInboxPanel` (121), `ChatWindow` (249), `EphemeralChatBanner` (39), `MeetingPointPanel` (66), `QuickReplies` (31), `KeepChatRequestModal` (74), `ReportConversationModal` (78), `ChatModerationPanel` (40), `ChatPrivacySettingsPanel` (85).

**Full-page stack (~2.000 γραμμές):** `GroupChatPageContent.tsx` (**1293 γραμμές** — header, virtualized list, composer, info panel, 6 inline modals), `useGroupChatMessages` (60), `useGroupChatContrast` (32), `GroupChatLocationModal` (252), `GroupChatSosModal` (65), `GroupChatReportModal` (73), `GroupChatLeaveModal` (56), `ChatIcebreakers` (64), `LiveEventTracker`.

**Inbox:** `InboxPageContent.tsx` (272) — διαβάζει `useStore.groups` (stack C), όχι `useChatStore`.

### 2.4 Mocked / fake συμπεριφορές (πλήρης λίστα)

1. Popup conversations & messages = **στατικά seeds** (`mockChatData.ts`)· κανένα flow δεν προσθέτει συνομιλίες.
2. Full-page group chat: **50 συνθετικά μηνύματα + greetings** ανά group (`GroupChatPageContent.tsx:53-89`).
3. Inbox unread/pinned/typing **hardcoded στο `g1`** (`InboxPageContent.tsx:49-51`).
4. Popup unread προέρχεται μόνο από seed `unreadCount`· το `receiveMessage` δεν πυροδοτείται ποτέ χωρίς backend.
5. Προσομοιωμένο GPS στο `LiveEventTracker` (`setInterval` 3s γύρω από Σύνταγμα).
6. Trusted-contact link hardcoded (`GroupChatPageContent.tsx:909`).
7. `GroupChatReportModal` δεν υποβάλλει τίποτα (toast only) — ενώ το popup report **επιμένει** στο store. Δύο αντίθετες συμπεριφορές για ίδια πράξη.
8. Ephemeral «expiry» είναι σκηνοθετημένο: seed με `status:'expired'`· **κανένας timer δεν λήγει συνομιλία**· `autoExpireEventChats`/`expiresAt` αχρησιμοποίητα.
9. Keep-chat και arrival γράφουν system messages αλλά **δεν αλλάζουν καμία πραγματική συμπεριφορά**.
10. Real-time transports υπάρχουν αλλά αδρανή χωρίς env config.

### 2.5 Dead / write-only state (πλήρης λίστα)

| Πεδίο / API | Κατάσταση |
|---|---|
| `ChatState.openConversationIds` | γράφεται, **δεν διαβάζεται ποτέ** |
| `ChatPrivacySettings.showReadReceipts` / `showTypingIndicators` | υπάρχουν σε type/defaults, ούτε toggle ούτε ανάγνωση |
| Όλα τα υπόλοιπα privacy flags (7 toggles) | persisted αλλά **`canOpenConversation` δεν συμβουλεύεται ποτέ το `privacy`** → καλλυντικά |
| `Conversation.expiresAt` | τίθεται σε seeds, δεν χρησιμοποιείται σε κανέναν υπολογισμό |
| `Conversation.relatedGroupIds` | τίθεται, δεν καταναλώνεται πουθενά |
| `Conversation.keepRequested` / `arrivedAt` | γράφονται από actions, δεν διαβάζονται από components |
| `canOpenConversation(ctx.companyJoinRequests)` | required παράμετρος, **αχρησιμοποίητη στο σώμα** |
| `ctx.blockedUserIds` | χρησιμοποιείται στο σώμα αλλά **δεν τροφοδοτείται ποτέ** από `useChatPermission` → dead branch |
| `ChatPermissions.canPersist` | υπολογίζεται, το Keep flow δεν το ελέγχει |
| `useGroupChatMessages().appendMessage` | επιστρέφεται, **δεν καλείται ποτέ** |
| `GROUP_CHAT_TYPO` | νεκρό — **διαγράφηκε σήμερα** |
| `ConversationType 'group_to_person'` | declared + icon-mapped, χωρίς seed και χωρίς `sectionFor` branch |

### 2.6 Real-time plumbing (υπάρχον, αδρανές)

| Κομμάτι | Αρχείο | Γραμμές | Κατάσταση |
|---|---|---:|---|
| Socket.IO client | `src/lib/realtime/socket.ts` | 43 | `connectChatSocket/joinChatRoom/emitChatMessage` — no-op χωρίς `VITE_WS_URL` |
| Firebase Firestore | `src/lib/realtime/firebaseChat.ts` | 88 | `onSnapshot` limit 200, `serverTimestamp` — gated από `isFirebaseConfigured()` |
| Subscription hook | `src/hooks/useRealtimeChat.ts` | 80 | mounted στο `AppShell.tsx:406`· Firebase else Socket.IO· inbound → `receiveMessage` |
| Send path | `chatStore.ts:122-127` | — | optimistic write + emit· **χωρίς ack/rollback/dedupe** (echo-guard μόνο `senderId===userId`) |

### 2.7 Theming (επιλυμένο 2026-07-30)

Το popup stack ήταν dark-only hardcoded (`#0c1016`/`#141820`/`#1a2030`, `white/*`, `cyan-*`, `gray-*`, ~60 σημεία σε 9 αρχεία + `CHAT_TYPO`). Μετατράπηκε πλήρως σε semantic tokens (`bg-surface`, `text-ink`, `bg-brand`/`text-brand-fg`, `border-border`, `bg-ink/*`, `text-brand`, `bg-brand-soft`) + προστέθηκε `--color-brand-fg: #083344` στα chromatic dark θέματα. Τα full-page/inbox ήταν ήδη theme-aware. **Κατάσταση: ✅ λύθηκε.**

---

## Μέρος 3: Gap Analysis έναντι State-of-the-Art

Λεζάντα: ✅ πλήρες · ◐ μερικό · ⚠ fake/mock · ✗ απουσιάζει

### 3.1 Core messaging

| Δυνατότητα | SOTA benchmark | Nakamas σήμερα | Σχόλιο |
|---|---|---|---|
| Αποστολή text | ✅ | ✅ | |
| Optimistic UI | ✅ με ack/rollback | ◐ | μονής κατεύθυνσης, χωρίς dedupe |
| Send states (sending/sent/delivered/read) | ✅ | ✗ | |
| Failed-message retry queue | ✅ | ✗ | |
| Offline outbox | ✅ | ✗ | |
| Drafts ανά συνομιλία | ✅ | ✗ | |
| Edit / delete own | ✅ | ◐ | delete μόνο στο full-page |
| Search εντός συνομιλίας | ✅ | ◐ | μόνο full-page |
| Pagination / infinite history | ✅ | ✗ | popup χωρίς καν virtualization |
| Virtualized list | ✅ | ◐ | μόνο full-page (`react-virtuoso`) |
| Day dividers / timestamp grouping | ✅ | ✗ | |

### 3.2 Rich content

| Δυνατότητα | Nakamas | Σχόλιο |
|---|---|---|
| Media/attachments | ✗ | |
| Voice messages | ✗ | |
| Emoji picker | ✗ | μόνο 7 static quick replies |
| Link previews | ✗ | |
| Polls | ✗ | κρίσιμο για plan coordination |
| Location share | ◐ | live-location (full-page) + meeting point (popup) — αποσυνδεδεμένα |
| Replies / quote | ✗ | |
| Reactions | ✗ | |
| Mentions (@) | ✗ | |
| Pinned messages | ✗ | |

### 3.3 Conversation management

| Δυνατότητα | Nakamas | Σχόλιο |
|---|---|---|
| Unread counts | ◐ | derived στο popup, **fake** στο inbox |
| Mute / archive | ✅ | popup |
| Pin συνομιλίας | ⚠ | hardcoded `g1` |
| Sections/folders | ✅ | popup inbox (6 sections) |
| Unread-first filter / global search | ✗ | |
| Badge sync (launcher/nav) | ✅ | launcher badge ✓ |

### 3.4 Presence & real-time

| Δυνατότητα | Nakamas | Σχόλιο |
|---|---|---|
| Typing indicators | ⚠ | fake στο `g1`· πεδίο privacy υπάρχει αλλά δεν διαβάζεται |
| Read receipts | ✗ | πεδίο υπάρχει, δεν διαβάζεται |
| Online presence / last seen | ✗ | |
| Multi-tab sync | ✗ | ούτε BroadcastChannel |
| Live transport | ◐ | plumbing έτοιμο, αδρανές |

### 3.5 Group & event coordination (το differentiation της εφαρμογής)

| Δυνατότητα | Nakamas | Σχόλιο |
|---|---|---|
| Accept request → chat | ◐ | δημιουργεί Group, **αόρατο στο popup** |
| Meeting point | ◐ | μόνο popup |
| Live radar | ⚠ | simulated GPS |
| SOS | ✅ | πραγματικό `triggerSos` |
| Icebreakers (AI) | ✅ | Gemini + offline fallback |
| Arrival/ETA status | ◐ | system msgs χωρίς state effect |
| Roles (organizer/member) | ◐ | organizer_announcement type μόνο |

### 3.6 Trust & safety

| Δυνατότητα | Nakamas | Σχόλιο |
|---|---|---|
| Report | ◐ | popup persists, full-page toast-only (ασυνέπεια) |
| Block integration | ✗ | `blockedUserIds` dead branch |
| Privacy settings enforcement | ⚠ | 7 toggles persisted, **ποτέ enforced** |
| Ephemeral expiry | ⚠ | χωρίς timer |
| Keep-chat consent flow | ⚠ | χωρίς effect |
| Rate limiting / anti-spam | ✗ | |
| Moderation actions | ◐ | panel read-only |

### 3.7 UX / a11y / theming

| Δυνατότητα | Nakamas | Σχόλιο |
|---|---|---|
| Theme parity | ✅ | **διορθώθηκε σήμερα** |
| Focus trap / focus restore | ✗ | αναμένει P2.4 overlay primitive |
| Escape / scroll lock | ◐ | Escape μόνο στο inbox |
| Keyboard navigation | ✗ | |
| Touch targets / mobile sheets | ✅ | inbox sheet ✓, window fullscreen ✓ |
| Max-windows affordance | ✗ | σιωπηλή αντικατάσταση (P4.14) |

**Σύνολο: ~10 ✅ / ~14 ◐ / ~7 ⚠ / ~19 ✗ από 50 ελεγχθείσες δυνατότητες.**

---

## Μέρος 4: Αρχιτεκτονική Αξιολόγηση

### 4.1 Το θεμελιώδες πρόβλημα

Η εφαρμογή χρειάζεται **ένα conversation aggregate**. Σήμερα:
- Ο **domain κόσμος** (Groups, CompanyJoinRequests) ζει στο main store.
- Το **popup chat** ζει σε απομονωμένο store με immutable σύνολο 7 seeds — δεν υπάρχει καν `createConversation` action.
- Το **full-page chat** γράφει σε ξεχωριστό localStorage key ανά group με ασύμβατο message model.

Συνέπειες: (α) ο χρήστης βλέπει διαφορετικές συνομιλίες σε launcher vs `/chats`, (β) accept → δεν εμφανίζεται πουθενά στο popup, (γ) κάθε feature (unread, typing, safety) πρέπει να υλοποιηθεί 2–3 φορές ή μένει fake, (δ) αδύνατη η real-time ενοποίηση.

### 4.2 Δευτερεύοντα ελαττώματα

1. **Persistence χωρίς versioning** και στα 2 stores (χειροκίνητο `merge`, εύθραυστο σε schema changes).
2. **Permissions layer διαρρέει**: privacy δεν συμμετέχει, blocked users dead, dead required param.
3. **Δύο report pipelines** με αντίθετη συμπεριφορά.
4. **1293-γραμμών monolith** (`GroupChatPageContent`) — 6 inline modals, θέλει decomposition ανεξάρτητα από το chat plan (συνδέεται με P2).
5. **Feature scatter**: meeting point μόνο popup, location/SOS/radar μόνο full-page, icebreakers μόνο full-page — ο χρήστης χάνει δυνατότητες ανάλογα με το surface.

---

## Μέρος 5: Target Architecture (πρόταση)

### 5.1 Αρχές

1. **Μία αλήθεια**: ένα `chatStore` (v2) για conversations+messages+presence. Main store κρατά domain entities· το chat store κρατά communication entities.
2. **Domain-event-driven creation**: κάθε business γεγονός που «ξεκλειδώνει chat» (accept join request, merge, group create, direct approval) καλεί `createConversation()` — αμφίδρομη σύνδεση μέσω `conversation.domainRef` (groupId/requestId).
3. **Views, όχι stacks**: `ChatWindow` = compact view, `GroupChatPageContent` = full view, `ChatInboxPanel`/`InboxPageContent` = list densities — όλα πάνω στα ίδια δεδομένα.
4. **Transport-agnostic sync**: interface + strategy (Local → Socket → Firebase), outbox queue με retry & dedupe.
5. **Functional privacy-by-design**: κάθε permission predicate διαβάζει πραγματικά settings + block list.

### 5.2 Unified message model

```ts
interface UnifiedMessage {
  id: string;                 // server id ή cuid
  clientId: string;           // dedupe/optimistic key
  conversationId: string;
  senderId: string;           // 'system' για system messages
  senderType: 'user' | 'system' | 'organizer';
  kind: 'text' | 'system' | 'location' | 'arrival_status'
      | 'meeting_point' | 'poll' | 'media' | 'voice' | 'reply';
  body: string;
  createdAt: number;          // epoch ms (ενιαίο, όχι ISO/string mix)
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyToId?: string;
  meta?: Record<string, unknown>; // poll options, media refs, coords
}
```

Migration adapter: `ChatMessage`/`GroupChatMessage` → `UnifiedMessage` (πεδίο-προς-πεδίο mapping, `text→body`, `timestamp→createdAt`, `senderName` derive από users).

### 5.3 Sync engine

```
┌────────────┐   send()   ┌─────────────┐   ┌──────────────────────────┐
│ ChatWindow │ ─────────► │  Outbox     │──►│ ChatTransport (strategy) │
│ (view)     │ ◄───────── │  queue      │◄──│  Local | Socket | FB     │
└────────────┘  status    └─────────────┘   └──────────────────────────┘
   updates         transitions: sending → sent | failed → retry
```

- `LocalTransport` (default): BroadcastChannel cross-tab + same-tab echo — δίνει πραγματικό multi-tab chat **χωρίς backend** (ιδανικό για demo/dev).
- Env-driven selection: Firebase configured → Firebase, αλλιώς WS URL → Socket, αλλιώς Local.
- Dedupe με `clientId`· reconnect resync με `lastSeenAt` cursor.

### 5.4 Permissions v2

`canUseConversation(viewer, conversation, ctx)` όπου ctx τροφοδοτείται πραγματικά: `privacy` (7 flags enforced), `blockedUserIds` (από main store block list), `companyJoinRequests` (relationship proofs). Έξοδος: `{canRead, canSend, canReport, canPersist, canShareLocation, reasonIfLocked}`.

### 5.5 Ephemeral v2

Πραγματικός lifecycle: `expiresAt` υπολογίζεται στο creation (event end + Nh)· sweep on app start + timer ενώ το window είναι ανοιχτό· `keepRequested` → consent flow → `status:'persistent'`. Αυτό ενεργοποιεί τα σημερινά νεκρά πεδία.

---

## Μέρος 6: Phased Roadmap (ticket-level, με dependencies)

### ΦΑΣΗ C0 — Correctness sweep (0.5–1 εβδ., μηδενικό ρίσκο) — εξαρτήσεις: καμία

| # | Ticket | Αρχεία |
|---|---|---|
| C0.1 | Αφαίρεση fake unread/pinned/typing `g1` από inbox → derive από store | `InboxPageContent.tsx:49-51,224-227` |
| C0.2 | Αφαίρεση/περιορισμός 50 fake seed messages (κρατάμε μόνο system greeting) | `GroupChatPageContent.tsx:53-89` |
| C0.3 | Wire `blockedUserIds` από main store στο `useChatPermission` | `chatPermissions.ts:115` |
| C0.4 | Καθαρισμός dead fields: `openConversationIds`, `appendMessage`, dead param `companyJoinRequests`, `group_to_person` branch cleanup | chatStore, useGroupChatMessages, chatPermissions, types |
| C0.5 | `GroupChatReportModal` → πραγματικό `reportConversation` (ίδιο pipeline με popup) | `GroupChatReportModal.tsx` |
| C0.6 | Max-windows affordance «2/2 ανοιχτά» (P4.14) | `PopupChatLauncher.tsx` |

### ΦΑΣΗ C1 — Unification (1.5–2 εβδ.) — supersedes/αναλύει τα P3.1 + P3.2 — εξαρτήσεις: C0, P1 ✓

| # | Ticket | Περιγραφή |
|---|---|---|
| C1.1 | `UnifiedMessage` + `Conversation` v2 types + adapters από τα 2 legacy models | types/chat.ts |
| C1.2 | chatStore v2: `version: 2`, `migrate` από `nakamas-chat-v1` + `nakamas-group-chat-v1:*`, `createConversation` action | chatStore.ts |
| C1.3 | Domain-event wiring: `acceptCompanyJoinRequest`, `respondGroupMerge`, group create → `createConversation` (με `domainRef`) | store/index.ts |
| C1.4 | `GroupChatPageContent` επάνω στο unified store (αφαίρεση `useGroupChatMessages`) — full view | groups/ |
| C1.5 | Ένα inbox, δύο densities: `InboxPageContent` + `ChatInboxPanel` στα ίδια δεδομένα | inbox/ |
| C1.6 | Meeting point + ephemeral banner διαθέσιμα και στο full view (feature parity) | full-page |

**Acceptance C1:** accept request → συνομιλία ορατή ταυτόχρονα σε popup, `/chat/:id`, `/chats`· refresh → ίδια κατάσταση· ένα μόνο persistence namespace.

### ΦΑΣΗ C2 — Core chat UX (1–1.5 εβδ.) — εξαρτήσεις: C1

| # | Ticket |
|---|---|
| C2.1 | Send states: `sending/sent/failed` + retry affordance + outbox (LocalTransport πρώτα) |
| C2.2 | Drafts ανά συνομιλία (persisted) |
| C2.3 | Search εντός συνομιλίας + global conversation search στο inbox |
| C2.4 | Unread-first filter + πραγματικό pin conversations |
| C2.5 | Day dividers + timestamp grouping στο message list |
| C2.6 | Edit/delete own (delete υπάρχει στο full-page → port στο model, both views) |

### ΦΑΣΗ C3 — Rich messaging (2–3 εβδ.) — εξαρτήσεις: C2

| # | Ticket |
|---|---|
| C3.1 | Replies (quote) + jump-to-message |
| C3.2 | Reactions (emoji) |
| C3.3 | Mentions @ + highlight + notification |
| C3.4 | Emoji picker (πέρα από quick replies) |
| C3.5 | Polls (κρίσιμο για plan coordination: «πού πάμε;») |
| C3.6 | Media attachments (image first, compression, lazy load) |
| C3.7 | Link previews (unfurl με safe-fetch) |
| C3.8 | Pinned messages ανά συνομιλία |
| C3.9 | Voice messages (optional — αξιολόγηση κόστους) |

### ΦΑΣΗ C4 — Real-time & presence (1.5–2 εβδ.) — εξαρτήσεις: C1 + απόφαση backend

| # | Ticket |
|---|---|
| C4.1 | Ενεργοποίηση transport (env) + reconnect/resync cursor |
| C4.2 | Typing indicators (πραγματικά, gated από `showTypingIndicators`) |
| C4.3 | Read receipts (gated από `showReadReceipts`) |
| C4.4 | Presence (online/last seen) |
| C4.5 | Cross-tab sync (BroadcastChannel — δουλεύει και χωρίς backend) |
| C4.6 | Push/in-app notifications για νέα μηνύματα (respect mute) |

### ΦΑΣΗ C5 — Safety & privacy enforcement (1–1.5 εβδ.) — εξαρτήσεις: C1

| # | Ticket |
|---|---|
| C5.1 | Permissions v2: enforce 7 privacy flags + block list σε κάθε entry point |
| C5.2 | Ephemeral v2: πραγματικό expiry timer + keep-chat consent effect |
| C5.3 | Moderation panel actions (freeze/close/delete), όχι read-only |
| C5.4 | Rate limiting / anti-spam guards στο send path |
| C5.5 | Report triage states (open → reviewed → actioned) |

### ΦΑΣΗ C6 — Scale, polish & a11y (1 εβδ.) — εξαρτήσεις: C2, P2.4

| # | Ticket |
|---|---|
| C6.1 | Virtualization στο popup window (react-virtuoso, όπως full-page) |
| C6.2 | Pagination/history loading (`limit 200` cursor) |
| C6.3 | Focus trap + restore + Escape παντού (μέσω P2.4 overlay primitive) |
| C6.4 | Keyboard navigation (composer shortcuts, list nav) |
| C6.5 | Performance budgets: message list render <16ms, store selectors memoized |
| C6.6 | `GroupChatPageContent` decomposition (1293 → ~500 γρ. shell + extracted panels) — συνεργασία με P2 |

---

## Μέρος 7: UX Redesign ανά Surface

| Surface | Σήμερα | Target |
|---|---|---|
| **Launcher** | FAB με badge | FAB + max-windows affordance + connection status dot (offline/live) |
| **Popup inbox** | 6 sections, fake δεδομένα | ίδιες sections σε πραγματικά δεδομένα + search bar + unread filter + pin |
| **Chat window** | bubbles, quick replies | + send states, day dividers, replies/reactions, meeting-point parity, virtualization |
| **Full-page** | πλούσιο αλλά απομονωμένο | ίδιο μοντέλο: δεξί info rail (members/meeting point/safety), shared composer |
| **`/chats` page** | διαβάζει Groups | unified inbox page (ίδια δεδομένα με popup inbox, full density) |
| **Mobile** | fullscreen window ✓ | + swipe gestures, bottom-sheet parity, ενιαίο floating entry (P4.13) |

---

## Μέρος 8: Μετρικές Επιτυχίας (Definition of Done)

| Δείκτης | Σήμερα | Στόχος |
|---|---|---|
| Chat data truths | 3 stacks | 1 store, 3 views |
| Message models | 3 ασύμβατα | 1 (`UnifiedMessage`) + adapters |
| Persistence namespaces | 3 | 1 (v2, migrated) |
| `createConversation` action | δεν υπάρχει | καλείται από κάθε unlock flow |
| Fake unread/typing/seeds | 4 σημεία | 0 |
| Privacy flags enforced | 0/7 | 7/7 |
| Dead state fields | 12+ | 0 |
| Ephemeral expiry | σκηνοθετημένο | πραγματικό timer + consent |
| Report pipelines | 2 αντίθετα | 1 |
| Send states | κανένα | sending/sent/delivered/read/failed |
| SOTA feature coverage (50 checks) | 10 ✅ | ≥ 40 ✅ |
| Virtualization | 1/2 lists | 2/2 |
| Theme parity | ✅ (σήμερα) | διατηρείται (guard σε T9 checklist) |

---

## Μέρος 9: Ρίσκα & Διαχείριση

| Ρίσκο | Πιθανότητα | Μετριασμός |
|---|---|---|
| Migration persisted keys (3 namespaces → 1) σπάει υπάρχοντα δεδομένα | Μεσαία | version bump + migrate με adapters· dry-run σε dev fixtures· fallback reseed |
| Transition period με δύο UIs (old full-page + unified) | Μεσαία | feature flag `unifiedChat`· σταδιακό cutover ανά route |
| Backend απουσία → real-time features χωρίς αξία | Υψηλή | LocalTransport (BroadcastChannel) δίνει cross-tab πραγματικότητα χωρίς backend· transports πίσω από interface |
| Scope creep (50 features) | Υψηλή | αυστηρή σειρά C0→C6· C3.9 voice optional· κάθε φάση shippable |
| Dedupe/echo bugs στο optimistic send | Μεσαία | `clientId` key + status transitions + tests |
| 1293-line monolith refactor σπάει safety flows | Μεσαία | C6.6 τελευταίο· extraction με parity tests |

---

## Μέρος 10: Συσχέτιση με Master UI/UX Plan

| Master ticket | Σχέση με chat plan |
|---|---|
| P3.1 (unified conversation model) | **Αναλύεται σε C1.1–C1.3** |
| P3.2 (ένα inbox, δύο densities) | **Αναλύεται σε C1.5** |
| P3.5 (minimized dock) | ✓ ολοκληρώθηκε σε P0· συντηρείται |
| P4.13 (ένα mobile floating entry) | ενσωματώνεται στο C1.5 + Μέρος 7 |
| P4.14 (max-windows affordance) | C0.6 |
| P5.2/P5.3 (focus trap, Escape) | C6.3 (μέσω P2.4) |
| P1 tokens | ✓ θεμέλιο· **chat theming ήδη token-driven από σήμερα** |

**Προτεινόμενη σειρά:** ολοκλήρωση P1 (T9→T6→T8→exit) → P2 (variants + overlay primitive) → **C0+C1** (το μεγαλύτερο structural win) → C4.5/C5.1 (γρήγορα wins) → C2 → υπόλοιπα κατά προτεραιότητα.
