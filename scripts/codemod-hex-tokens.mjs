/**
 * P1-T3 codemod — replace hardcoded brand/ink hex inside arbitrary-value class
 * strings with semantic token names (prefix stays attached, alpha /NN preserved):
 *   [#111827] → ink      (text/bg/border/ring — strongest foreground, inverts in dark)
 *   [#0E8B8D] → brand    (canonical parea teal; mono themes intentionally decolor)
 *   [#18D8DB] → accent   (legacy cyan drift; follows per-theme accent)
 * JS/style-prop occurrences (QR fg, map markers, branding seed) are NOT bracketed
 * and are intentionally untouched.
 * Usage: node scripts/codemod-hex-tokens.mjs [--dry]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAP = new Map([
  ['[#111827]', 'ink'],
  ['[#0e8b8d]', 'brand'],
  ['[#18d8db]', 'accent'],
]);

const DRY = process.argv.includes('--dry');
const ROOT = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) yield p;
  }
}

function replaceAllCI(haystack, needle, replacement) {
  let out = '';
  let i = 0;
  let hits = 0;
  const lower = haystack.toLowerCase();
  while (true) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) break;
    out += haystack.slice(i, idx) + replacement;
    i = idx + needle.length;
    hits++;
  }
  return { text: out + haystack.slice(i), hits };
}

let totalFiles = 0;
let totalRepl = 0;
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8');
  let out = src;
  let fileRepl = 0;
  for (const [from, to] of MAP) {
    const r = replaceAllCI(out, from, to);
    out = r.text;
    fileRepl += r.hits;
  }
  if (fileRepl > 0) {
    totalFiles++;
    totalRepl += fileRepl;
    console.log(`${String(fileRepl).padStart(4)}  ${file.replace(ROOT, 'src')}`);
    if (!DRY) writeFileSync(file, out);
  }
}
console.log(`\n${totalRepl} replacements in ${totalFiles} files${DRY ? ' (dry run)' : ''}`);
