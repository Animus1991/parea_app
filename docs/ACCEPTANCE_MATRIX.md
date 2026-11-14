# Nakamas — Acceptance Matrix (UI/UX plan closure)

**Date:** 2026-07-31 · **Method:** static re-verification of `docs/FULL_APP_UIUX_AUDIT_AND_PLAN.md` Γ1–Γ4 + P0–P5 roadmap against current `main` source.  
**Legend:** ✅ closed in code · 🟡 honest demo / partial · ⬜ open

> This is an engineering acceptance matrix, **not** a third-party WCAG certification.

---

## A. Γ1 — Dead / misleading affordances

| # | Item | Status | Evidence |
|---|---|---|---|
| 1–26 | Prior Γ1 items | ✅ | See previous closure commits |
| 27 | Connections message → 1:1 DM | ✅ | `ensureDirectConversation` + popup |
| 28 | Login Google | 🟡 | Firebase **or** `VITE_GOOGLE_OAUTH_CLIENT_ID` (GIS); else «(Demo)» |
| 29 | 404 CTA | ✅ | Back to Home |

---

## B–D. Γ2 / Γ3 / Γ4

Prior rows remain ✅ / 🟡 as in commit `7fe38f2` + follow-ups (i18n, Modal a11y, tabs, etc.).

### P5 / WCAG posture (honest)

| Area | Status |
|---|---|
| Focus-visible / reduced motion | ✅ baseline |
| jsx-a11y in ESLint | ✅ warn-first |
| Token contrast gate | ✅ `npm run audit:contrast` (9 themes, AA text pairs) |
| Axe smoke + **page×theme matrix** | ✅ CI: 5 themes × 10 routes with `color-contrast` (`e2e/a11y.spec.ts`) |
| Full WCAG 2.2 AA certification | ⬜ | engineering gate ≠ third-party cert; not every route |
| Exhaustive 9 themes × every route | 🟡 | CI uses representative set; full list in `A11Y_THEMES` for local runs |

---

## E. Integrations residual → env-gated product paths

| Area | Status | How to enable |
|---|---|---|
| Google OAuth without Firebase | ✅ code path | `VITE_GOOGLE_OAUTH_CLIENT_ID` → Google Identity Services |
| Google OAuth via Firebase | ✅ code path | Full `VITE_FIREBASE_*` |
| Stripe payments / payouts | 🟡 env-gated | `VITE_STRIPE_PUBLISHABLE_KEY` + `VITE_STRIPE_CHECKOUT_URL` → Wallet opens Checkout; else demo |
| Live support | 🟡 env-gated | `VITE_SUPPORT_URL` or `VITE_SUPPORT_EMAIL` → Help opens channel; else demo label |

---

## F. Still not claimed as “production certified”

1. Third-party WCAG 2.2 AA audit / every page × every theme in CI.  
2. Live bank settlement / Stripe Connect backend (client opens Checkout URL only).  
3. Staffed live support agents (env opens your helpdesk URL/email).  
4. OAuth that works with **zero** credentials (impossible — needs Google client id or Firebase).

**Verdict:** engineering acceptance for the UI/UX plan ≈ **closed**. Production cert / funded payments / staffed support require ops + secrets outside the repo.

---

## G. AI-first upgrade (Φ23–Φ25, 14/11/2026)

Full detail: [`docs/AI_FIRST_AUDIT_AND_PLAN.md`](./AI_FIRST_AUDIT_AND_PLAN.md) §Ι.

| Area | Status | Evidence |
|---|---|---|
| Nakamas AI copilot acts across the app (33 tools, confirm + undo) | ✅ | `src/ai/*`, `e2e/copilot.spec.ts` |
| Works with zero keys (on-device bilingual engine) | ✅ | `src/ai/localEngine.test.ts` (24 cases) |
| Gemini function calling via server proxy | 🟡 | code path ready; needs `GEMINI_API_KEY` on the server |
| Gemini key no longer inlined in the client bundle | ✅ | `vite.config.ts` |
| Copilot panel axe-clean (results + confirmation) in 5 CI themes | ✅ | `e2e/copilot.spec.ts` |
| Gamification, admin, organizer, trust numbers are live (no hardcoded metrics) | ✅ | `src/lib/achievements.ts`, admin/organizer/trust page contents |
| a11y page × theme matrix runs to completion | ✅ | 50/50 (was stopping at test 1 on animation flake) |
