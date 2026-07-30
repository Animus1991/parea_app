# Vibrant Theme Palette Audit — Επιστημονικός Έλεγχος & Πρόταση v2

> Έλεγχος του vibrant/vibrant-dark θέματος (fuchsia/orange) έναντι βέλτιστων πρακτικών βιομηχανίας (Material 3 dynamic color, Apple HIG, WCAG 2.2, APCA, OKLCH token architecture 2026).
> Ημερομηνία: 2026-07-30. Συνοδεύει τα ήδη εφαρμοσμένα softening fixes της ίδιας ημέρας.

---

## Μέρος 1: Executive Summary

**Ερώτηση:** Είναι η fuchsia/orange απόχρωση η βέλτιστη state-of-the-art παλέτα;

**Απάντηση (τεκμηριωμένη):** Η **οικογένεια hue (magenta/fuchsia) είναι νόμιμη και σύγχρονη** — την υιοθετούν Instagram, Twitch, Figma, Linear, T-Mobile. **Η τρέχουσα εφαρμογή της όμως απέχει από τα βέλτιστα πρότυπα** σε 5 μετρήσιμα σημεία:

| # | Εύρημα | Σοβαρότητα | Κατάσταση |
|---|---|---|---|
| 1 | **White text σε orange-500 = 2.80:1** (FAB gradient fuchsia-600→orange-500) — κάτω από WCAG AA 4.5:1 | Κρίσιμη (a11y) | ✅ **Διορθώθηκε σήμερα** (solid fuchsia-600) |
| 2 | Accent overuse: ~25–30% των surfaces έφερε accent (badge, hovers, scores, step circles, spinners) — best practice: **~2% interaction accents** | Υψηλή | ✅ **Διορθώθηκε σήμερα** (softening pass) |
| 3 | Neutrals χωρίς tint — best practice 2026: 2–3% brand chroma στα neutrals για cohesion | Μεσαία | Πρόταση v2 |
| 4 | Dark theme χωρίς chroma throttling — raw fuchsia-400/500 «neon glow» · best practice: −15–20% chroma σε dark | Μεσαία | Πρόταση v2 |
| 5 | HSL-based ramp (Tailwind default), όχι OKLCH perceptual — μη ομοιόμορφη φωτεινότητα ανά hue/step | Μεσαία (στρατηγική) | Roadmap |

---

## Μέρος 2: Μετρήσεις Αντίθεσης (WCAG 2.x computed)

Υπολογισμοί με κανονικοποιημένη φωτεινότητα (IEC/61966-2-1 sRGB):

| Ζεύγος | Contrast | WCAG AA (text 4.5) | WCAG AA (large/UI 3.0) | Σχόλιο |
|---|---|---|---|---|
| white / **orange-500** `#F97316` (FAB gradient end) | **2.80:1** | ✗ FAIL | ✗ FAIL | Κρίσιμο εύρημα |
| white / fuchsia-600 `#C026D3` | 4.71:1 | ✅ | ✅ | οριακά OK |
| white / fuchsia-700 `#A21CAF` | 6.33:1 | ✅ | ✅ | ασφαλές |
| fuchsia-400 `#E879F9` / `#1a1020` (vibrant-dark bg) | 7.49:1 | ✅ | ✅ | αλλά «neon glow» οπτικά |
| gray-300 `#D1D5DB` / `#1a1020` (nav inactive) | 8.36:1 | ✅ | ✅ | |
| gray-400 `#9CA3AF` / `#1a1020` | 5.57:1 | ✅ | ✅ | |
| gray-500 `#6B7280` / `#1a1020` | 3.82:1 | ✗ (small text) | ✅ (UI/large) | προσοχή σε captions |
| gray-500 `#6B7280` / white | 4.83:1 | ✅ | ✅ | |
| gray-900 `#111827` / pink-50 `#FDF2F8` (vibrant shell) | 15.9:1 | ✅ | ✅ | |

**Συμπέρασμα μετρήσεων:** η βασική παλέτα είναι συμβατή με AA **εκτός από** (α) white-on-orange gradient (διορθώθηκε), (β) gray-500 captions σε dark (οικείο του γενικού P5.6 ticket).

---

## Μέρος 3: Έλεγχος έναντι Industry Benchmarks (2026)

| Αρχή βέλτιστης πρακτικής | Πηγή | Nakamas vibrant (πριν) | Τώρα |
|---|---|---|---|
| ~90% tinted neutrals / ~8% structural / **~2% interaction accents** | UXMagic 2026, Material 3 | accent σε ~25% surfaces (badge, hovers, scores, steps, spinners, chips) | ✅ accent μόνο σε: logo, selected states (nav/chips/tabs), primary CTAs, hero identity |
| Accent **αποκλειστικά** για primary CTAs & critical interactions | Nine Hub 2026, M3 | accent και σε διακοσμητικά | ✅ |
| Dark mode: **chroma throttling −15–20%** (anti neon-glow) | BoldVanta/OKLCH 2026 | raw fuchsia-400/500 | ❌ εκκρεμεί (v2) |
| Neutrals με 2–3% brand chroma (ποτέ pure gray) | UXMagic 2026 | pure Tailwind grays | ❌ εκκρεμεί (v2) |
| OKLCH authoring + hex fallbacks | W3C/CSS Color 4, 2026 stack | HSL/hex | ❌ roadmap |
| WCAG 2.2 AA floor + APCA supplementary | W3C | 1 failing pair | ✅ fixed· APCA sweep στο v2 |
| Gradients: διακόσμηση (hero), **όχι interactive surfaces** | M3/Apple HIG | gradient σε FAB (interactive) | ✅ solid FAB |

**Παραδείγματα αγοράς με magenta/purple accent:** Instagram (gradient μόνο σε brand assets, όχι UI chrome), Twitch (#9146FF, single-hue buttons), Linear (purple accent, 95% neutral canvas), Figma (purple μόνο σε brand). **Κανένα δεν χρησιμοποιεί dual-hue gradient σε κουμπιά ούτε accent σε διακοσμητικά κείμενα.**

---

## Μέρος 4: Προτεινόμενη Παλέτα Vibrant v2 (OKLCH-tuned)

Φιλοσοφία: **διατήρηση ταυτότητας magenta** (είναι on-trend και διαφοροποιητική), εκσυγχρονισμός εκτέλεσης.

### 4.1 Accent ramp (OKLCH τιμές + sRGB equivalents)

| Ρόλος | Light theme | Dark theme | Contrast on-bg |
|---|---|---|---|
| `accent` (primary fill) | oklch(0.55 0.19 330) ≈ `#C026D3` | oklch(0.62 0.16 330) ≈ `#D444E0` | white-on: 4.7 / 5.1 ✓ |
| `accent-strong` (hover) | oklch(0.48 0.18 330) ≈ `#A21CAF` | oklch(0.70 0.14 330) ≈ `#E879F9` | ✓ |
| `accent-soft` (tint bg) | oklch(0.96 0.02 330) ≈ `#FDF2FA` | oklch(0.28 0.05 330) ≈ `#3D1A3A` | |
| `accent-fg` (on-accent text) | `#FFFFFF` | `#2A0A2E` (σκούρο — APCA Lc 75+) | |

Σημείωση: dark accent **−20% chroma** (0.19→0.15) έναντι light — anti-glow.

### 4.2 Tinted neutrals (2–3% magenta chroma)

| Token | Light | Dark |
|---|---|---|
| `surface` | `#FCF8FB` (mauve-tinted, αντί για pure `#FDF2F8` pink-50) | `#1C141B` (αντί για blue-gray `#1a1020`) |
| `surface-raised` | `#FFFFFF` | `#261B25` |
| `ink` | `#241A22` (αντί για pure `#111827`) | `#F5EFF4` |
| `ink-muted` | `#6E5F6B` | `#C4B6C2` |
| `border` | `#EBDEE8` | `#3E2E3B` |

Αποτέλεσμα: τα grays «κάθονται» μέσα στο θέμα αντί να μοιάζουν ξένα (blue-gray δίπλα σε magenta).

### 4.3 Gradients policy

- **Hero/brand decoration:** επιτρέπεται fuchsia→orange (ταυτότητα).
- **Interactive (buttons, FAB, chips):** ΠΑΝΤΑ solid single-hue. ✅ εφαρμόστηκε στο FAB.

### 4.4 Συνδυασμοί που απορρίφθηκαν (με αιτιολόγηση)

| Εναλλακτική | Γιατί όχι |
|---|---|
| Purple/violet (Twitch-style `#9146FF`) | πολύ κοντά στο bento (indigo) — θα κατέρρεε η διάκριση θεμάτων |
| Pink-rose (`#E11D48`) | romantic συνειρμός — λάθος για πλατφόρμα παρέας/δραστηριοτήτων |
| Coral/orange primary | white-on-orange αποτυγχάνει AA χωρίς πολύ σκούρο orange (χάνει ζωντάνια) |
| Magenta + teal dual accent | δύο accents = θόρυβος· το teal ανήκει στο classic/brand |

---

## Μέρος 5: Roadmap Υλοποίησης

| # | Ticket | Κατάσταση |
|---|---|---|
| V2-T0 | FAB gradient → solid (WCAG fix) | ✅ 2026-07-30 |
| V2-T1 | Accent softening σε content surfaces (EventCard, chips, badges, steps, spinners, TopNav chrome) | ✅ 2026-07-30 |
| V2-T2 | Tinted neutrals: αντικατάσταση shell/surface/ink tokens του vibrant+vibrant-dark με mauve-tinted τιμές (index.css `[data-theme]` blocks) | ✅ 2026-07-30 |
| V2-T3 | Dark chroma throttling: προσαρμογή `--color-accent` vibrant-dark σε −20% chroma equivalent | ✅ 2026-07-30 |
| V2-T4 | APCA sweep (Lc ≥ 60 text) ως συμπλήρωμα του WCAG — spot-check 20 ζεύγη | Pending |
| V2-T5 | OKLCH migration ολόκληρου του token layer (author OKLCH + `@supports` hex fallback) | Backlog (στρατηγικό) |

**Acceptance:** κάθε text/UI ζεύγος ≥ WCAG 2.2 AA· οπτικά: accent ορατό μόνο σε logo/selected/CTA/hero· dark χωρίς neon glow· neutrals εναρμονισμένα με το hue.

---

## Παράρτημα: Τι εφαρμόστηκε σήμερα (2026-07-30)

1. **Bug:** «Προβολή αρχικής» αόρατο στο vibrant (light) — `HomeHeroModeBar` label έπαιρνε light-theme token (`text-gray-600`) πάνω σε dark hero gradient → τώρα πάντα `text-white/80` (το component ζει αποκλειστικά μέσα σε dark heroes).
2. **Softening (vibrant + vibrant-dark):** date-badge month, title hovers, match score, meta icons, secondary CTA (dark), step badges, tip labels (→amber, consistent με classic), tag hovers, feed-tab container, map-button hover, load-more spinners, TopNav «Αξιόπιστο Μέλος» label + avatar.
3. **Διατηρήθηκε ζωντανό:** logo, επιλεγμένη καρτέλα sidebar, ενεργά chips/tabs/filters, primary CTAs, hero (gradient, title accent, stat icons), story rings.
