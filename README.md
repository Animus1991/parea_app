<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ed9f9c59-7d05-4060-a12f-31b2acac79af

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cloudflare Pages

Static SPA deploy from `vite build` → `dist` (see `wrangler.toml`).

```bash
npm run build
npx wrangler pages deploy dist --project-name=nakamas
```

GitHub Actions: `.github/workflows/cloudflare-pages.yml` (needs repo secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). SPA fallback + security headers: `public/_redirects`, `public/_headers`.

Latest audit: [`docs/COMPREHENSIVE_AUDIT_2026-11-14.md`](docs/COMPREHENSIVE_AUDIT_2026-11-14.md).

## Nakamas AI (copilot)

Open it with the **AI** button in the top bar or **Ctrl/⌘ J**, then type or dictate in Greek or English, for example
«βρες μου δωρεάν πεζοπορία αυτό το Σαββατοκύριακο», «αποθήκευσε το δεύτερο» or "switch to dark mode".

- **Without any key** it runs a bilingual on-device engine (search, save, calendar, agenda, theme, language, privacy, notifications, group messages, drafting events, explanations).
- **With Gemini**: set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) for `npm run dev` / `server.ts`. Requests go through `/api/ai/copilot`, so the key never reaches the browser.
- Anything that sends, publishes or changes privacy asks for confirmation first, and every change can be undone.
