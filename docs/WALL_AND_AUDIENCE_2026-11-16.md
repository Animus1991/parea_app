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

## 5. Recommended next steps

1. Backend: maintain `socialGraph` from accepted requests/blocks and fan posts out to
   `feeds/{uid}/items` so listing respects the same rules.
2. Store post photos in Firebase Storage (URLs, not data URLs) with size/type rules.
3. Notifications for comments, reactions and posts on your wall (respecting notification prefs).
4. Tagging people in posts with tag review («έλεγχος ετικετών»).
5. Moderation view for reported wall posts in Admin (reports already land in the issue queue).

## 6. Cloudflare preview

The workflow `.github/workflows/cloudflare-pages.yml` deploys every push to `main`, `ccr-*` and
`cursor/**` and comments the `https://<branch>.nakamas.pages.dev` link — once the repository has
the secrets `CLOUDFLARE_API_TOKEN` (Pages:Edit) and `CLOUDFLARE_ACCOUNT_ID` under
*Settings → Secrets and variables → Actions*.
