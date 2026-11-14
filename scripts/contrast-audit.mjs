#!/usr/bin/env node
/**
 * Token-level contrast audit for every [data-theme] in src/index.css.
 * Checks WCAG 2.x AA (4.5:1) for body text pairs and 3:1 for large/UI brand pairs.
 * Not a full page×theme pixel audit — that remains residual.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, '..', 'src', 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

const THEME_IDS = [
  'classic',
  'vibrant',
  'bento',
  'neon',
  'vibrant-dark',
  'bento-dark',
  'neon-dark',
  'activebuddies',
  'activebuddies-dark',
];

const AA_TEXT = 4.5;
const AA_UI = 3;

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(fg);
  const L2 = relativeLuminance(bg);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (full.length !== 6) return null;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function parseRgb(str) {
  const m = str.match(
    /rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i,
  );
  if (!m) return null;
  const a = m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  if (a < 1) return null; // skip translucent — cannot resolve without composite bg
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parseHsl(str) {
  const m = str.match(
    /hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?(?:\s*[,/]\s*([\d.]+%?))?\s*\)/i,
  );
  // modern: hsl(220 14% 12%)
  const m2 = !m
    ? str.match(
        /hsla?\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?\s*\)/i,
      )
    : null;
  const g = m || m2;
  if (!g) return null;
  const a = g[4] == null ? 1 : g[4].endsWith('%') ? parseFloat(g[4]) / 100 : parseFloat(g[4]);
  if (a < 1) return null;
  const h = Number(g[1]);
  const s = Number(g[2]) / 100;
  const l = Number(g[3]) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m0 = l - c / 2;
  let r = 0;
  let g0 = 0;
  let b = 0;
  if (h < 60) [r, g0, b] = [c, x, 0];
  else if (h < 120) [r, g0, b] = [x, c, 0];
  else if (h < 180) [r, g0, b] = [0, c, x];
  else if (h < 240) [r, g0, b] = [0, x, c];
  else if (h < 300) [r, g0, b] = [x, 0, c];
  else [r, g0, b] = [c, 0, x];
  return [
    Math.round((r + m0) * 255),
    Math.round((g0 + m0) * 255),
    Math.round((b + m0) * 255),
  ];
}

function parseColor(raw) {
  if (!raw) return null;
  const v = raw.trim();
  if (v.startsWith('#')) return parseHex(v);
  if (v.startsWith('rgb')) return parseRgb(v);
  if (v.startsWith('hsl')) return parseHsl(v);
  return null;
}

function extractVars(block) {
  const vars = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block))) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

function extractClassicDefaults() {
  const themeMatch = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  return themeMatch ? themeMatch[1] : '';
}

/** All rule bodies whose selector mentions this data-theme (group + specific), in file order. */
function extractThemeBodies(themeId) {
  if (themeId === 'classic') return [extractClassicDefaults()];

  const bodies = [];
  const ruleRe = /(\[[^\]]+\](?:\s*,\s*\[[^\]]+\])*)\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = ruleRe.exec(css))) {
    const selector = m[1];
    if (!selector.includes(`data-theme="${themeId}"`)) continue;
    bodies.push(m[2]);
  }
  return bodies;
}

function resolveTheme(themeId) {
  const vars = extractVars(extractClassicDefaults());
  for (const body of extractThemeBodies(themeId)) {
    Object.assign(vars, extractVars(body));
  }
  return vars;
}

const PAIRS = [
  { fg: 'color-ink', bg: 'color-surface', min: AA_TEXT, label: 'ink on surface' },
  { fg: 'color-ink', bg: 'color-surface-raised', min: AA_TEXT, label: 'ink on surface-raised' },
  { fg: 'color-ink-muted', bg: 'color-surface', min: AA_TEXT, label: 'ink-muted on surface' },
  // Brand/accent chips often carry small bold UI text — require AA text (4.5:1).
  { fg: 'color-brand-fg', bg: 'color-brand', min: AA_TEXT, label: 'brand-fg on brand' },
  { fg: 'color-accent-fg', bg: 'color-accent', min: AA_TEXT, label: 'accent-fg on accent' },
  { fg: 'color-hero-fg', bg: 'color-hero-from', min: AA_UI, label: 'hero-fg on hero-from' },
  // Φ24/Φ25 — pairs relied on by token-only components (Nakamas AI panel, segmented tabs,
  // gamification hub). Accent is used as TEXT only on surface-raised; on accent-soft and
  // surface it is reserved for icons (non-text, 3:1) with ink text. Muted text is never
  // placed on accent-soft (fails AA in Active Buddies themes).
  { fg: 'color-ink-muted', bg: 'color-surface-raised', min: AA_TEXT, label: 'ink-muted on surface-raised' },
  { fg: 'color-accent', bg: 'color-surface-raised', min: AA_TEXT, label: 'accent text on surface-raised' },
  { fg: 'color-ink', bg: 'color-accent-soft', min: AA_TEXT, label: 'ink on accent-soft' },
  { fg: 'color-accent', bg: 'color-accent-soft', min: AA_UI, label: 'accent icon on accent-soft' },
];

const failures = [];
const skipped = [];
let checks = 0;

for (const themeId of THEME_IDS) {
  const vars = resolveTheme(themeId);
  for (const pair of PAIRS) {
    const fgRaw = vars[pair.fg];
    const bgRaw = vars[pair.bg];
    if (!fgRaw || !bgRaw) {
      skipped.push(`${themeId}: missing ${pair.fg}/${pair.bg}`);
      continue;
    }
    const fg = parseColor(fgRaw);
    const bg = parseColor(bgRaw);
    if (!fg || !bg) {
      skipped.push(`${themeId}: unparsed ${pair.label} (${fgRaw} / ${bgRaw})`);
      continue;
    }
    const ratio = contrastRatio(fg, bg);
    checks += 1;
    if (ratio + 1e-6 < pair.min) {
      failures.push({
        themeId,
        label: pair.label,
        ratio: ratio.toFixed(2),
        min: pair.min,
        fg: fgRaw,
        bg: bgRaw,
      });
    }
  }
}

console.log(`Contrast audit: ${checks} pairs across ${THEME_IDS.length} themes`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  for (const s of skipped.slice(0, 20)) console.log(`  · ${s}`);
  if (skipped.length > 20) console.log(`  · … +${skipped.length - 20} more`);
}

if (failures.length) {
  console.error(`\nFAIL: ${failures.length} contrast pair(s) below AA threshold:\n`);
  for (const f of failures) {
    console.error(
      `  [${f.themeId}] ${f.label}: ${f.ratio}:1 < ${f.min}:1  (${f.fg} on ${f.bg})`,
    );
  }
  process.exit(1);
}

console.log('PASS: all resolved semantic pairs meet AA thresholds.');
process.exit(0);
