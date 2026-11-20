# Round 4 — declutter, invites on any device, «Ξανά μαζί» — 2026-11-20

Branch `ccr-92dfba55-iwthnx`. It now contains every newer branch on `origin`:
`cursor/quick-nav-edit-a43c` (the newest superset, 109 commits by other agents
up to 20/11: quiet passes, lazy-loaded AI, chat, tags index, quick-nav editor),
and the six `ccr-4a44ddef-fgcwnr` commits that branch lacked (Back restores the
feed, readable own chat bubbles in dark themes, honest test call).

## 1. Merge decisions

Where upstream had already solved the same noise more completely, upstream won:

| Area | Kept from upstream | Re-applied from this round |
|---|---|---|
| Trust Center | One ring + verifications grid + «Η κατάστασή σου» | — |
| Discover filters | Toggle on desktop, sheet on phones, active-filter chips, schedule filter | One search box on Home (the top bar hides its own there) |
| Plans | No ID nag on Plans (the verify nudge lives on Home) | — |
| Event quick info | New labels («Ποιοι μπαίνουν», «Χώρος») | Rows already shown as chips or sections removed |
| Invite panel | No always-on aside | Only the exception is said: «ανοίγει προς το παρόν μόνο σε αυτή τη συσκευή» |
| Call modal | Quieter icons | Honest «Δεν έχει μπει ακόμα» (there is no peer transport yet) |

## 2. Declutter and honesty fixes (no feature removed)

- **Event page.** The meeting point is said once, under «Τοποθεσία», and it is
  *your* group's point. It used to show the first group's point, repeat it in
  Quick info, and sit next to «appears after confirmation». The «Βρες Nakamas»
  rail no longer squeezes the page to about 200 px, because the page has its own
  company panel.
- **Discover.** The chips «Συγκρούσεις (n)» and «Άλλες (n)» now read «Ίδια ώρα με
  σχέδιά σου (n)» and «Πλήρεις ή ήδη μέσα (n)».
- **Plans.** «σε 6μ» now reads «σε 6 μέρες» or «Αύριο». «· έτοιμη» is gone from
  the button, because the photo already says «Επιβεβαιωμένο».
- **Profile completeness.** ID verification is asked of hosts only (the Trust
  Center says «Αν διοργανώνεις»). Members therefore reach 100%; before, they were
  stuck at 90% under «Το προφίλ σου είναι πλήρες». Hosts see «Επαλήθευσε
  ταυτότητα (για διοργανωτές)».
- **Profile.** The bottom «Ρυθμίσεις» tile repeated the header button. It is now
  «Τα Σχέδιά μου».
- **«Πες στο Nakamas AI» cards.** They hide in one tap, with Undo. Settings brings
  them back. The AI button stays in the header.
- **Our night.** The cover picker and the partner-place list fold away once
  chosen. The door list appears only when check-in is open.
- **Dark themes on phones (axe, 390 px).**
  - The map placeholder now follows the theme; it was 1.2:1.
  - «Πρόοδος έκπτωσης» was 1.07:1 and is fixed.
  - activebuddies-dark muted ink went from 55% to 60%: ≥ 4.5:1 on every card shade,
    including accent-soft.
  - Clean in activebuddies-dark, vibrant-dark, neon-dark, bento-dark and classic.

**Left as is, on purpose.** The «Εικόνα κάρτας» picker on Discover is a temporary
control the repository owner added to compare card layouts before locking a
default (commit 291836b). It should be removed once a default is chosen.

## 3. Invites that open on any device

- **Storage.** `server/invitesStore.ts` uses `node:sqlite`. It keeps the public
  invite card: event, area (never the exact spot), host first name and counts.
  Each guest name has one answer, which can be updated. Names can be read only
  with the host key; the server stores its SHA-256 and compares it in constant
  time. Closed outings refuse answers, and each invite takes at most 100.
- **API.** `PUT/GET /api/invites/:id` and `POST/GET /api/invites/:id/responses`,
  with rate limits. `X-Invite-Key` is allowed by CORS.
- **Client.**
  - `invitesApi` fails soft on static hosting.
  - The host panel publishes the card and pulls answers every 20 s and on focus.
  - The public page reads the card from the server when the invite is not on
    this device.
- **Checked end-to-end against the real server**, with two browser profiles
  (11/11):
  - The card opens on another device, without the exact spot or any names.
  - The answer reaches the host.
  - Without the key, or with a wrong key, the names endpoint returns 403.
  - Nobody else can overwrite the invite.

## 4. Door scanning on every browser

`lib/qrScan` uses the native `BarcodeDetector` where it exists. Elsewhere
(Safari, Firefox) it lazy-loads `jsQR`, a 131 kB chunk that loads only when the
host starts scanning. The camera is released even when permission arrives after
Stop, and the same ticket is answered once, not twice a second. A unit test
rasterises the ticket QR exactly as the app draws it and decodes it.

## 5. «Ξανά μαζί» — mutual only

- **Where.** The feedback page has an optional «Ξανά μαζί;» row listing the people
  of that outing. After a door check-in, it lists only those who were there, and
  never anyone blocked.
- **Privacy.** Marks are private. Both people find out only if they marked each
  other for the same outing.
- **What a match does.** Two strangers become Nakamas, because both chose it, and
  any pending request between them is settled. People already connected get a
  nudge to plan the next one. A match is announced once.

## 6. Validation

| Check | Result |
|---|---|
| tsc / eslint | 0 errors; 11 warnings, the same set as upstream |
| Token contrast | 90/90 AA |
| Vitest | 369 passed, 26 skipped (emulator only) |
| Firestore rules (emulator) | 26/26 |
| Playwright | 164/164, plus the new «Ξανά μαζί» flow |
| Build | Main chunk 494 kB (was 598 kB; the AI was split upstream); jsQR is lazy |
