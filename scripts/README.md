# Development scripts (not runtime)

Node/CJS utilities for one-off maintenance — **not imported by the Vite app**.

| Script | Purpose |
|--------|---------|
| `auto_translate.cjs` / `apply_translations.cjs` / `extract_str.cjs` | i18n string extraction and batch translation helpers |
| `fix_*.cjs` | Targeted codemods for theme/page migrations |

Run from repo root, e.g. `node scripts/extract_str.cjs`.

For app behaviour (mock data, Ticketmaster, themes), see `src/lib/runtimeMode.ts` and `docs/ARCHITECTURE.md`.
