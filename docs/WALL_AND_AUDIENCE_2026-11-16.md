# Audit & Wall/Audience build — 2026-11-16

Branch audited: `cursor/lean-privacy-enforce-6f96` @ `4645952` — the most recent branch on
`origin`, which contains every other active branch (`main`, `ccr-4a44ddef-fgcwnr`, all
`cursor/*`). The two `replit*` branches (May 2026) have unrelated histories and older code;
they were reviewed but not merged.

## 1. Baseline (before any change)

| Check | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint .` | 0 problems |
| Contrast audit (9 themes) | 90/90 pairs AA |
| Vitest | 146 passed, 10 skipped (emulator-only) |
| Firestore rules (emulator) | 10/10 |
| Playwright | 90/90 (local run needs the sandbox Chromium, see F11) |
| `vite build` | OK; main chunk 523.9 kB (pre-existing >500 kB warning) |
| `npm audit` | 0 vulnerabilities |

## 2. Findings

Severity: **H** high · **M** medium · **L** low · **I** info. All H/M/L items are fixed in this branch.

| ID | Sev | Area | Finding | Fix | Verified by |
|---|---|---|---|---|---|
| F1 | H | Privacy | `removeConnection` removed the *wrong id* from the other person (`filter(id !== userId)` on their own list), so they kept listing you. `areConnected` accepts either side, so removed — and **blocked** — people still passed «μόνο συνδέσεις» profile and DM gates. | Mutual removal; `symmetrizeConnections` repairs saved state on load; `blockUser` always drops the edge. | `wallStore.test.ts` «social graph fixes» |
| F2 | M | Social graph | `acceptConnectionRequest` did not check the recipient, duplicated ids on repeat, ignored crossing requests and did not update `currentUser` when it was the sender. | Recipient-only, set semantics, crossing request settled. | unit tests |
| F3 | M | Social graph | `sendConnectionRequest` ignored blocks, existing connections and a pending request in the other direction; there was no way to withdraw a request. | Returns an outcome (`sent / accepted / exists / connected / blocked / invalid`) shown in plain words; `cancelConnectionRequest`. | unit tests |
| F4 | L | Data | Seed half-edge: Elena listed Alex, Alex did not list Elena → treated as connected by the ACL but invisible in «Οι Nakamas μου». | Mutual seeds + a pending request from Elena (also demonstrates the wall ACL). | unit + e2e |
| F5 | M | Profile | Photo upload stored `blob:` URLs in persisted state → broken image after every reload. | Downscaled JPEG data URL (`lib/imageResize.ts`); saved `blob:` photos fall back to the seed photo. | `imageResize.test.ts` |
| F6 | M | Privacy / honesty | Suggestions, requests, Leaderboard, Achievements and Plans showed non-connections' photos regardless of «Εμφάνιση φωτογραφίας σε μη-συνδέσεις», and used random stock faces (pravatar) when there was no photo. New Google/Firebase users were **saved** with a random stranger's face. | One privacy-aware `PersonAvatar` (photo ACL + initials fallback, also on load errors); no stock faces for real accounts. | screenshots, e2e axe |
| F7 | M | UX | Members' profiles opened the *organizer* page («Εκδηλώσεις από…», «Επικοινωνία με διοργανωτή», stars derived from reliability), with no Connect/Message; profile previews of members sent people to `/connections`. Tab title said «Διοργανωτής». | Personal profile `/u/:id`; `/organizer/:id` redirects members there; title «Προφίλ μέλους». | e2e, typography spec |
| F8 | L | UX | «Αφαίρεση σύνδεσης» from a menu had no Undo. | Undo on the toast (`restoreConnection`). | unit test |
| F9 | L | Privacy | Pending requests list did not filter blocked people. | Filtered. | — |
| F10 | I | Delivery | Cloudflare Pages workflow succeeds but **skips the deploy on every run**: repo secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are not set, so no `*.pages.dev` preview exists. | Owner action (see §6). | Actions logs, run 43856474098 |
| F11 | I | Test infra | Local `playwright test` looks for `chromium_headless_shell-1223`; the sandbox ships 1243. CI is unaffected. | Local-only config pointing at `/opt/pw-browsers/chromium` (not committed). | 90/90 → 105/105 locally |
| F12 | I | Performance | Main chunk was already >500 kB. | Wall UI and the wall store are lazy chunks; main chunk +4.5 kB gzip. | build output |
| F13 | I | Repo | `replit-updates` / `replit_branch` have no merge base with `main`. | Left untouched (superseded). | `git merge-base` |

## 3. The Wall (Φ26) — what was built

**Question asked:** should Nakamas have a Facebook-style wall and private profile, where by
default only friends see each other's posts, some people post to the whole network, some to
specific people, some exclude specific people — and the same for the profile and wall?

**Answer:** yes, scoped to what serves Nakamas (finding company for events): posts carry plans
and events, every audience choice is visible *before* posting, and nothing reaches a person the
author did not choose. Defaults are private-leaning (connections).

### Audience model (`src/types/wall.ts`, `src/lib/audience.ts`)

One `Audience` shape for every question — posts, the profile, each profile section, who may
write on a wall, who sees others' posts on it, who may comment:

| Base | Who sees it |
|---|---|
| `public` | every signed-in Nakamas member |
| `connections` | mutual connections («Nakamas μου») |
| `friends_of_friends` | connections + people who share one |
| `specific` | hand-picked connections |
| `list` | one of the owner's custom lists («Κοντινοί φίλοι») |
| `only_me` | nobody else |

plus **«Εκτός από…»** (`excludeIds`) on public / connections / friends-of-friends / list.
Rules, in order: owner always sees → a block either way denies → exclusions deny → the base
decides. `specific` and `list` also require a *current* connection, so unfriending revokes access.
Posts written on someone else's wall follow the **wall owner's** setting, retroactively.
Suspended authors' posts are hidden from everyone but admins.

### Surfaces

- **`/wall` — Τοίχος Nakamas:** composer (text, photo, event; audience chip always visible; draft
  kept for the session), filters *Όλα / Nakamas μου / Δημόσια δικτύου / Ο τοίχος μου* with counts,
  «νέες από την τελευταία σου επίσκεψη», hidden posts can be restored.
- **Posts:** author → wall owner, time, «επεξεργασμένο», pinned, audience chip (the author can
  change it). Reactions (👍 ❤️ 😂 😮 🎉) with «who reacted», comments (latest two, «view all»),
  per-post comments off, edit, pin, delete / remove from my wall (Undo), hide from my feed
  (Undo), report (goes to the Admin issue queue), block author.
- **`/u/:id` — personal profile:** cover, avatar (photo ACL), city/age (if «Σχετικά» is visible),
  trust tier, mutual Nakamas + shared interests; Connect / Withdraw / Accept–Decline / «Είστε
  Nakamas», Message (DM gate), «⋯» Remove / Report / Block (with a clear confirmation). Tabs
  Τοίχος / Σχετικά / Nakamas / Εκδηλώσεις, each gated by its own audience; locked sections say so
  without leaking counts of hidden posts.
- **«Δες ως…»:** on your own profile, preview it as a network member or as any one of your
  Nakamas (`/u/<you>?viewAs=public|<id>`).
- **Organizer pages** gain «Ανακοινώσεις & Τοίχος».
- **Privacy (Profile › Ορατότητα & Απόρρητο, linked from Settings):** profile audience (now a
  superset of Δημόσιο / Συνδέσεις / Ιδιωτικό), per-section audiences, default post audience, who
  writes on my wall, who sees others' posts there, who comments, audience lists manager,
  «Περιορισμός παλαιότερων δημοσιεύσεων» (Undo). Every row shows its current value; the picker
  shows live «Θα το βλέπουν N άτομα: …».
- **Navigation & return:** «Τοίχος Nakamas» in Κοινότητα; the Home welcome-back line and the
  AI «τι νέο;» count new posts from your Nakamas.
- **Nakamas AI:** `post_to_wall` (confirm card, Undo) and `limit_past_posts` (confirm, Undo);
  the local engine understands e.g. «δημοσίευσε στον τοίχο μου μόνο για τους φίλους μου «…»»
  while «δημοσίευσε εκδήλωση …» still creates an event.

### Server-side rules (`firestore.rules`)

`socialGraph/{uid}` (connections + blocks, backend-written only), `wallPosts/{id}` with
`comments` and per-user `reactions`, owner-private `wallSettings/{uid}` and `audienceLists/{id}`,
and `profileAudience` validation on profiles. They mirror `lib/audience.ts` for single-document
access; feed listing should be served by a backend fan-out (rules are not filters).

### Compatibility

Nothing was removed. The coarse `profileVisibility` stays and is kept in sync; a coarse change
from any path (AI, older client) replaces a stale fine-grained audience instead of reviving it.
Saved wall state lives under its own key (`nakamas-wall-v1`) with a storage-full guard.

## 4. Verification after the change

| Check | Result |
|---|---|
| `tsc` / `eslint` / contrast | 0 / 0 / 90 of 90 AA |
| Vitest | see the PR description for the final count (was 146) |
| Firestore rules (emulator) | 18/18 (10 existing + 8 wall) |
| Playwright | full suite incl. `e2e/wall.spec.ts` and `/wall`, `/u/u2` in the axe × 5-theme matrix and the type-hierarchy guard |
| Bundle | main 538.7 kB (+14.8 kB raw / +4.5 kB gzip); wall store 14 kB lazy |

## 5. Recommended next steps (status after round 2, §7)

1. ✅ Backend contract: `functions/src/socialGraph.ts` maintains `socialGraph` and computes
   feed fan-out with the app's own ACL (unit-tested); deploying it needs a Firebase project.
2. ⏳ Post photos in Firebase Storage — waits for posts to sync to Firestore (they are
   device-local in the demo); data URLs stay meanwhile.
3. ✅ Notifications for comments, reactions, posts on your wall and tags (with a preference).
4. ✅ Tagging people with tag review.
5. ✅ Moderation view for reported wall posts in Admin.

## 6. Cloudflare preview

The workflow `.github/workflows/cloudflare-pages.yml` deploys every push to `main`, `ccr-*` and
`cursor/**` and comments the `https://<branch>.nakamas.pages.dev` link — once the repository has
the secrets `CLOUDFLARE_API_TOKEN` (Pages:Edit) and `CLOUDFLARE_ACCOUNT_ID` under
*Settings → Secrets and variables → Actions*.

## 7. Round 2 — re-audit and the next steps, built

The newest branch was `ccr-92dfba55-iwthnx` itself (it contains every other branch); `git pull`
was already up to date.

### Findings (all fixed)

| ID | Sev | Finding | Fix |
|---|---|---|---|
| R2-1 | M | The demo banner promised «τα demo δεδομένα χάνονται με την Έξοδο», but `exitDemoMode` only signed out — every change stayed saved. | Exit now restores the demo data in the main, chat and wall stores (theme, language, layout kept). Signed-in accounts are untouched. `demoReset.test.ts` |
| R2-2 | M | Contrast: secondary text on the highlighted (accent-soft) background was 3.96:1 in *activebuddies-dark* (found by the axe matrix on /notifications). | Full-contrast text on highlighted rows (activity, audience picker, pending tags). |
| R2-3 | L | «⋯» menu: no arrow-key navigation, focus did not return to the button. | WAI-ARIA menu button: ↑/↓/Home/End, Escape/Tab close, focus returns. |
| R2-4 | L | Audience lists used `tab` roles without tab panels; the «→» between author and wall owner had an icon label that screen readers skip. | `aria-pressed` buttons; visually hidden «στον τοίχο του/της». |
| R2-5 | L | The composer kept an old default audience after it changed in Settings or via the AI. | Follows the default until the person picks one for that post. |

### Built

- **Tags «με…»** (connections only, max 20): tagged people always see the post, can remove
  their tag, and — with **Έλεγχος ετικετών** (on by default) — approve it before it shows on
  their profile. Profiles show approved tags; your own profile lists tags awaiting approval.
- **Activity**: comments, reactions (one per person, withdrawn with the reaction), posts on
  your wall, tags and moderation notices; panel on the Wall and Notifications, badge on «Τοίχος
  Nakamas» and the bell, «Όλα αναγνωσμένα», one tap opens the post (`/wall?post=…`).
  Preference «Δραστηριότητα τοίχου» in Settings and via the AI.
- **Reports & moderation**: report with a reason → Admin › Μετριασμός › «Δημοσιεύσεις τοίχου»
  (grouped by post, remove / dismiss / view, restore removed). Removed posts stay visible
  only to the author (with the reason) and moderators; actions are in the admin log.
- **Sharing & joining**: «Στον τοίχο μου» on every event page (composer opens with the event
  attached); «Μπες στην παρέα με …» on friends' event posts opens the join flow.
- **Composer**: quick starts (Ψάχνω παρέα για / Πάω σε αυτό / Σας προτείνω / Στιγμές από),
  «Με ποιους;», safe clickable links (http/https only, `nofollow ugc`).
- **AI**: `summarize_wall` («τι κάνουν οι φίλοι μου;» — only posts you may see) and the wall
  notification preference.
- **Server**: rules for tags (only your connections; tagged people manage only their own tag)
  and moderation (custom-claim moderators only); `functions/src/socialGraph.ts` (graph sync,
  fan-out, friends-of-friends snapshot).

### Verification (round 2)

| Check | Result |
|---|---|
| tsc / eslint / contrast | 0 / 0 / 90 of 90 AA |
| Vitest (incl. `functions/`) | 215 passed, 21 skipped without the emulator |
| Firestore rules (emulator) | 21/21 |
| Playwright | 108/108 (8 wall flows, axe ×5 themes incl. /wall, /u/u2, /notifications) |
| Bundle | main 544.5 kB (+1.9 kB gzip this round); wall store 19.5 kB lazy |
