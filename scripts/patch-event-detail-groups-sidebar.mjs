import fs from 'fs';
import path from 'path';

const pages = [
  'EventDetailVibrant.tsx',
  'EventDetailVibrantDark.tsx',
  'EventDetailNeon.tsx',
  'EventDetailNeonDark.tsx',
  'EventDetailBento.tsx',
  'EventDetailBentoDark.tsx',
];

const lightRe =
  /<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-24">/;
const lightHeadingRe =
  /<h3 className="text-\[11px\] font-bold text-black tracking-wide mb-4">/;
const darkRe =
  /<div className="rounded-xl border border-gray-700 bg-gray-800[^"]*p-6 shadow-sm sticky top-24">/;
const darkHeadingRe =
  /<h3 className="text-\[11px\] font-bold text-white tracking-wide mb-4">/;

const lightShell =
  '<div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-soft sticky top-24">';
const lightHeading =
  '<h3 className="text-[11px] font-bold text-[#6B7280] tracking-wide mb-4">';
const darkShell =
  '<div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-soft sticky top-24">';
const darkHeading =
  '<h3 className="text-[11px] font-bold text-white tracking-wide mb-4">';

for (const name of pages) {
  const file = path.join('src/pages', name);
  let s = fs.readFileSync(file, 'utf8');
  const isDark = name.includes('Dark');
  if (isDark) {
    if (!darkRe.test(s)) {
      console.error('no dark sidebar', name);
      process.exit(1);
    }
    s = s.replace(darkRe, darkShell);
    s = s.replace(darkHeadingRe, darkHeading);
  } else {
    if (!lightRe.test(s)) {
      console.error('no light sidebar', name);
      process.exit(1);
    }
    s = s.replace(lightRe, lightShell);
    s = s.replace(lightHeadingRe, lightHeading);
  }
  fs.writeFileSync(file, s);
  console.log('ok', name);
}
