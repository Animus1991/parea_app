/**
 * P1-T5 codemod — shape & elevation scale.
 * Radii: collapse sub-tiers to canonical (controls lg/xl, cards 2xl, display 3xl),
 * snap arbitrary to nearest tier (ties round DOWN).
 * Shadows: default Tailwind shadows → shadow-soft* tokens; bottom-bar up-shadows
 * → shadow-soft-up*; KEEP shadow-none/shadow-inner/colored glows/high-alpha
 * dark-surface shadows/vendored ring-shadows (intentional exceptions).
 * Usage: node scripts/codemod-shape-scale.mjs [--dry]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DRY = process.argv.includes('--dry');

/** Exact-string rules [from, to] — order: compounds before their prefixes */
const EXACT = [
  // radii — directional compounds first
  ['rounded-r-md', 'rounded-r-lg'],
  ['rounded-l-md', 'rounded-l-lg'],
  ['rounded-md', 'rounded-lg'],
  ['rounded-sm', 'rounded-lg'],
  ['rounded-[24px]', 'rounded-3xl'],
  ['rounded-[20px]', 'rounded-2xl'],
  ['rounded-[18px]', 'rounded-2xl'],
  ['rounded-t-[10px]', 'rounded-t-lg'],
  ['rounded-t-[2.5rem]', 'rounded-t-3xl'],
  ['rounded-[2px]', 'rounded-sm'],
  // shadows
  ['shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]', 'shadow-soft-up'],
  ['shadow-[0_-4px_20px_rgba(0,0,0,0.05)]', 'shadow-soft-up-lg'],
  ['shadow-[0_8px_30px_rgb(0,0,0,0.04)]', 'shadow-soft-lg'],
  ['shadow-[0_4px_12px_-3px_rgba(0,0,0,0.09)]', 'shadow-soft-md'],
  ['shadow-2xl', 'shadow-soft-lg'],
  ['shadow-xl', 'shadow-soft-lg'],
  ['shadow-lg', 'shadow-soft-lg'],
  ['shadow-md', 'shadow-soft-md'],
  ['shadow-sm', 'shadow-soft'],
];

/** Regex rules for bare radius classes (boundary: next char not word/hyphen) */
const REGEX = [
  [/rounded-t(?![\w-])/g, 'rounded-t-lg'],
  [/rounded-b(?![\w-])/g, 'rounded-b-lg'],
  [/rounded(?![\w-])/g, 'rounded-lg'],
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) yield p;
  }
}

let totalFiles = 0;
let totalRepl = 0;
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  let out = src;
  let fileRepl = 0;
  for (const [from, to] of EXACT) {
    const hits = out.split(from).length - 1;
    if (hits > 0) {
      out = out.split(from).join(to);
      fileRepl += hits;
    }
  }
  for (const [re, to] of REGEX) {
    const hits = out.match(re)?.length ?? 0;
    if (hits > 0) {
      out = out.replace(re, to);
      fileRepl += hits;
    }
  }
  if (fileRepl > 0) {
    totalFiles++;
    totalRepl += fileRepl;
    console.log(`${String(fileRepl).padStart(4)}  ${file.replace(SRC, 'src')}`);
    if (!DRY) writeFileSync(file, out);
  }
}
console.log(`\n${totalRepl} replacements in ${totalFiles} files${DRY ? ' (dry run)' : ''}`);
