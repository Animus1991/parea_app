/**
 * P6 typography sweep — replaces arbitrary text-[Npx] with Tailwind scale (UTF-8 safe).
 * Skips token definition files that intentionally reference pixel values.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_FILES = new Set([
  'src/lib/contrastTheme.ts',
  'src/lib/eventDetailDesignTokens.ts',
]);

const TARGETS = [
  'src/components/calendar',
  'src/components/home',
  'src/components/report',
  'src/pages/OnboardingClassic.tsx',
  'src/components/settings',
  'src/components/trust',
  'src/components/categories',
  'src/components/notifications',
  'src/components/connections',
  'src/components/history',
  'src/components/achievements',
  'src/components/wallet',
  'src/components/verification',
  'src/components/admin/OrganizerDashboardPageContent.tsx',
  'src/components/events/EventDetailQuickInfoSection.tsx',
  'src/components/events/EventDetailGroupCard.tsx',
  'src/components/events/EventDetailHostRatingSection.tsx',
  'src/components/events/PostEventFeedbackPageContent.tsx',
  'src/components/events/EventMap.tsx',
  'src/components/chat',
  'src/pages/ChallengesClassic.tsx',
  'src/pages/LeaderboardClassic.tsx',
  'src/pages/LoginClassic.tsx',
  'src/pages/LoginBento.tsx',
  'src/pages/LoginBentoDark.tsx',
  'src/pages/LoginNeon.tsx',
  'src/pages/LoginNeonDark.tsx',
  'src/pages/LoginVibrant.tsx',
  'src/pages/LoginVibrantDark.tsx',
];

const REPLACEMENTS = [
  ['text-[22px] lg:text-[26px]', 'text-xl lg:text-2xl'],
  ['text-[18px] lg:text-[22px]', 'text-lg lg:text-xl'],
  ['text-[16px] lg:text-[18px]', 'text-base lg:text-lg'],
  ['text-[14.58px]', 'text-sm'],
  ['text-[14.42px]', 'text-sm'],
  ['text-[13.35px]', 'text-sm'],
  ['text-[12.5px]', 'text-sm'],
  ['text-[11.33px]', 'text-xs'],
  ['text-[10.3px]', 'text-xs'],
  ['text-[9.27px]', 'text-xs'],
  ['text-[22px]', 'text-xl'],
  ['text-[20px]', 'text-xl'],
  ['text-[18px]', 'text-lg'],
  ['text-[16px]', 'text-base'],
  ['text-[15px]', 'text-base'],
  ['text-[14px]', 'text-base'],
  ['text-[13px]', 'text-sm'],
  ['text-[12px]', 'text-sm'],
  ['text-[11px]', 'text-xs'],
  ['text-[10px]', 'text-xs'],
  ['text-[9px]', 'text-xs'],
  ['text-[8px]', 'text-xs'],
  ['text-[7px]', 'text-xs'],
];

function collectFiles(entry) {
  const abs = path.join(ROOT, entry);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return [abs];
  const out = [];
  for (const name of fs.readdirSync(abs)) {
    const child = path.join(abs, name);
    if (fs.statSync(child).isDirectory()) out.push(...collectFiles(path.relative(ROOT, child)));
    else if (child.endsWith('.tsx') || child.endsWith('.ts')) out.push(child);
  }
  return out;
}

let changed = 0;
for (const target of TARGETS) {
  for (const file of collectFiles(target)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (SKIP_FILES.has(rel)) continue;
    let content = fs.readFileSync(file, 'utf8');
    const before = content;
    for (const [from, to] of REPLACEMENTS) {
      content = content.split(from).join(to);
    }
    if (content !== before) {
      fs.writeFileSync(file, content, 'utf8');
      changed += 1;
      console.log('updated', rel);
    }
  }
}
console.log(`P6 typography: ${changed} files updated.`);
