# P1-T9 — Visual Regression Checklist (9 θέματα)

> Σκοπός: επικύρωση ότι τα P1-T1…T7 + dark-variant fix + chat theming δεν άλλαξαν ούτε έσπασαν οπτικά τίποτα, σε κάθε θέμα, με έμφαση σε **OS-preference parity** (Cursor browser vs πραγματικός browser).

## Α. Αυτοματοποιημένοι έλεγχοι — ✅ PASS (2026-07-30, dist/index-*.css)

| # | Έλεγχος | Αποτέλεσμα |
|---|---|---|
| A1 | `prefers-color-scheme` στο built CSS | **0** — το `dark:` ακολουθεί πλέον μόνο `data-theme` |
| A2 | Custom variant selector `[data-theme$="-dark"]` emitted | ✅ |
| A3 | Και τα 9 `[data-theme]` blocks στο built CSS | ✅ (classic, bento, bento-dark, neon, neon-dark, vibrant, vibrant-dark, activebuddies, activebuddies-dark) |
| A4 | `--color-brand-fg` ορισμένο 4× + `#083344` fix στα chromatic dark | ✅ |
| A5 | Z-utilities emitted (`z-fab/chat/sheet/banner/topnav/modal/toast`) | ✅ 7/7 |
| A6 | Shadow utilities emitted (`shadow-soft/-md/-lg/-up`) | ✅ 4/4 |
| A7 | `text-2xs` utility emitted | ✅ |
| A8 | Chat token classes emitted (`bg-surface`, `text-ink`, `bg-brand`, `text-brand-fg`, `bg-ink/10`) | ✅ |
| A9 | Pipeline: typecheck / eslint 0 errors / build | ✅ |

## Β. Manual checklist ανά θέμα (×9)

Για κάθε θέμα (αλλαγή από Settings → Appearance, ή ThemePicker):

### Β.1 Home (`/`)
- [ ] Hero gradient αντιστοιχεί στο accent του θέματος (teal / amber / indigo / fuchsia / cyan· mono στα AB)
- [ ] Category/mood chips: ενεργό chip = accent, ανενεργά = surface/ink σωστής αντίθεσης
- [ ] EventCard: τίτλος αναγνώσιμος, meta muted αλλά ≥ AA, CTA button = brand με σωστό `brand-fg` κείμενο
- [ ] BuddySeek strip: **ΟΧΙ μαύρο φόντο σε light θέμα** (regression guard του OS-preference bug)
- [ ] Stories rail: crowns/borders θεματικά

### Β.2 Event Detail (`/event/:id`)
- [ ] Accent consistency: badges, CTA, group cards στο ίδιο accent (BentoDark = **indigo**, όχι emerald)
- [ ] QuickInfo/Map/Safety sections: surface/raised σωστά, borders ορατά
- [ ] Mobile CTA bar: σωστό ύψος, χωρίς overlap με FAB

### Β.3 Chat (popup)
- [ ] Window surface: λευκό στα light, σκούρο στα dark, mono στα AB — **όχι πάντα μαύρο**
- [ ] Bubbles: δικά μου = brand + brand-fg αναγνώσιμο (λευκό σε teal, σκούρο σε κυανό-neon, μαύρο σε κίτρινο AB-light, κ.λπ.)
- [ ] Bubbles άλλων: αχνό `ink/10` fill, κείμενο `ink`
- [ ] Launcher/minimized dock: surface + brand border, unread badge brand+brand-fg
- [ ] Ephemeral banner & MeetingPoint panel: brand-soft φόντο, brand τίτλος
- [ ] Lock notice: amber, αναγνώσιμο και στα δύο είδη θεμάτων (dark:text-amber-200)

### Β.4 Inbox / `/chats`
- [ ] Rows: hover fill, unread pill = brand
- [ ] Tabs Messages/Notifications: active state ορατό

### Β.5 Calendar (`/calendar`)
- [ ] Day cells: ώρα/τοποθεσία ≥ 11px, αναγνώσιμα
- [ ] Event chips: accent σωστό ανά θέμα

### Β.6 Overlays
- [ ] Modals/bottom sheets: **πάνω** από TopNav (z-modal > z-topnav)
- [ ] Scrim ορατό, κλικ-έξω κλείνει
- [ ] Popup chat: mobile fullscreen πάνω από TopNav, desktop docked χωρίς overlap με launcher

### Β.7 OS-preference parity (κρίσιμο)
- [ ] Ίδια render σε Cursor browser **και** Chrome/Firefox με **αντίθετο** OS dark/light setting από το επιλεγμένο θέμα
- [ ] Ειδικά: light θέμα + OS dark → ΚΑΝΕΝΑ τμήμα δεν γυρνά σε dark (παλιό bug στο BuddySeek strip)
- [ ] Dark θέμα + OS light → πλήρες dark χωρίς λευκά «τρύπια» surfaces

### Β.8 Typography/Shape spot-check
- [ ] Κανένα text κάτω από 10px (type floor)
- [ ] Shadows: μόνο soft scale (όχι σκληρά default Tailwind shadows)
- [ ] Radii συνεπή: controls lg/xl, cards 2xl

## Γ. Sign-off matrix

| Θέμα | A-checks | Β.1 | Β.2 | Β.3 | Β.4 | Β.5 | Β.6 | Β.7 | Β.8 |
|---|---|---|---|---|---|---|---|---|---|
| classic | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| bento | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| bento-dark | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| neon | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| neon-dark | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| vibrant | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| vibrant-dark | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| activebuddies | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| activebuddies-dark | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
