/**
 * P1-T4 codemod — snap arbitrary text-[Npx] font sizes to the @theme type scale.
 * Rule: nearest step; ties round DOWN (density convention).
 * Exact-string replacement (closing bracket prevents prefix collisions).
 * Usage: node scripts/codemod-type-scale.mjs [--dry]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAP = new Map([
  ['text-[7.5px]', 'text-2xs'],
  ['text-[8.5px]', 'text-2xs'],
  ['text-[9px]', 'text-2xs'],
  ['text-[10px]', 'text-2xs'],
  ['text-[10.5px]', 'text-2xs'],
  ['text-[10.9px]', 'text-xs'],
  ['text-[11px]', 'text-xs'],
  ['text-[11.5px]', 'text-xs'],
  ['text-[11.6px]', 'text-xs'],
  ['text-[11.82px]', 'text-xs'],
  ['text-[12.1px]', 'text-sm'],
  ['text-[12.15px]', 'text-sm'],
  ['text-[12.38px]', 'text-sm'],
  ['text-[12.5px]', 'text-sm'],
  ['text-[12.73px]', 'text-sm'],
  ['text-[12.75px]', 'text-sm'],
  ['text-[13px]', 'text-sm'],
  ['text-[13.5px]', 'text-sm'],
  ['text-[13.55px]', 'text-sm'],
  ['text-[13.8px]', 'text-base'],
  ['text-[14.5px]', 'text-base'],
  ['text-[14.63px]', 'text-base'],
  ['text-[15px]', 'text-base'],
  ['text-[16px]', 'text-lg'],
  ['text-[16.2px]', 'text-lg'],
  ['text-[16.25px]', 'text-lg'],
  ['text-[16.76px]', 'text-lg'],
  ['text-[17px]', 'text-lg'],
  ['text-[18px]', 'text-xl'],
  ['text-[22px]', 'text-2xl'],
  ['text-[25px]', 'text-3xl'],
  ['text-[26px]', 'text-3xl'],
  ['text-[30px]', 'text-4xl'],
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

let totalFiles = 0;
let totalRepl = 0;
for (const file of walk(ROOT)) {
  const src = readFileSync(file, 'utf8');
  let out = src;
  let fileRepl = 0;
  for (const [from, to] of MAP) {
    const hits = out.split(from).length - 1;
    if (hits > 0) {
      out = out.split(from).join(to);
      fileRepl += hits;
    }
  }
  if (fileRepl > 0) {
    totalFiles++;
    totalRepl += fileRepl;
    console.log(`${String(fileRepl).padStart(4)}  ${file.replace(ROOT, 'src')}`);
    if (!DRY) writeFileSync(file, out);
  }
}
console.log(`\n${totalRepl} replacements in ${totalFiles} files${DRY ? ' (dry run)' : ''}`);
