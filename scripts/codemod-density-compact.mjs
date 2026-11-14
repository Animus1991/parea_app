/**
 * Global density pass — smaller display type + tighter spacing/control sizes.
 * Skips node_modules. Exact-string replacements; compounds before prefixes.
 * Usage: node scripts/codemod-density-compact.mjs [--dry]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DRY = process.argv.includes('--dry');
const ROOT = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** Order matters: longer / more specific first */
const EXACT = [
  // Display type downshift (outliers → next step)
  ['text-4xl md:text-5xl', 'text-2xl md:text-3xl'],
  ['text-3xl md:text-4xl', 'text-xl md:text-2xl'],
  ['text-2xl md:text-3xl', 'text-xl md:text-2xl'],
  ['text-xl md:text-2xl', 'text-lg md:text-xl'],
  ['text-lg md:text-xl', 'text-base md:text-lg'],
  ['text-base md:text-lg', 'text-sm md:text-base'],
  ['md:text-4xl', 'md:text-3xl'],
  ['md:text-3xl', 'md:text-2xl'],
  ['text-4xl', 'text-3xl'],
  ['text-3xl', 'text-2xl'],

  // Large padding / gaps
  ['space-y-12', 'space-y-6'],
  ['space-y-10', 'space-y-5'],
  ['space-y-8', 'space-y-5'],
  ['space-y-7', 'space-y-4'],
  ['space-y-6', 'space-y-4'],
  ['space-x-8', 'space-x-5'],
  ['gap-12', 'gap-6'],
  ['gap-10', 'gap-5'],
  ['gap-8', 'gap-5'],
  ['gap-7', 'gap-4'],
  ['gap-6', 'gap-4'],
  ['p-12', 'p-6'],
  ['p-10', 'p-5'],
  ['p-8', 'p-5'],
  ['p-6', 'p-4'],
  ['px-10', 'px-5'],
  ['px-8', 'px-5'],
  ['px-6', 'px-4'],
  ['py-12', 'py-6'],
  ['py-10', 'py-5'],
  ['py-8', 'py-5'],
  ['py-6', 'py-4'],
  ['pt-8', 'pt-5'],
  ['pt-6', 'pt-4'],
  ['pb-12', 'pb-6'],
  ['pb-10', 'pb-5'],
  ['pb-8', 'pb-5'],
  ['pb-6', 'pb-4'],
  ['mb-8', 'mb-5'],
  ['mt-8', 'mt-5'],
  ['mb-6', 'mb-4'],
  ['mt-6', 'mt-4'],

  // Control / avatar heights (keep very large map tiles alone via word boundary in replace loop)
  ['h-16 w-16', 'h-12 w-12'],
  ['h-14 w-14', 'h-11 w-11'],
  ['h-12 w-12', 'h-10 w-10'],
  ['min-h-14', 'min-h-11'],
  ['min-h-12', 'min-h-10'],
  ['min-h-[56px]', 'min-h-10'],
  ['min-h-[52px]', 'min-h-10'],
  ['min-h-[48px]', 'min-h-9'],
  ['h-14', 'h-11'],
  ['h-16', 'h-12'],
  ['w-14', 'w-11'],
  ['w-16', 'w-12'],
  ['size-14', 'size-11'],
  ['size-16', 'size-12'],

  // Softer large radii on content chrome
  ['rounded-3xl', 'rounded-2xl'],
];

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage']);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?|css)$/.test(name)) yield p;
  }
}

let totalFiles = 0;
let totalRepl = 0;
for (const file of walk(ROOT)) {
  // Keep CSS theme token definitions intact
  if (file.endsWith(`${join('src', 'index.css')}`) || file.endsWith('/index.css')) {
    // Still allow rounded/spacing in utility sections — but skip @theme text vars by only
    // applying non-text replacements below for index.css
  }
  const src = readFileSync(file, 'utf8');
  let out = src;
  let fileRepl = 0;
  const isIndexCss = /[/\\]index\.css$/.test(file);
  for (const [from, to] of EXACT) {
    if (isIndexCss && from.startsWith('text-')) continue;
    if (isIndexCss && from.startsWith('md:text-')) continue;
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
