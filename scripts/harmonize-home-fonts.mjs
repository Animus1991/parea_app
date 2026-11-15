/**
 * Bring page / panel / card titles that still use oversized Tailwind steps
 * down to the Home standard (text-sm md:text-base), without touching KPI
 * numerals (text-lg font-black tabular-nums) or decorative emoji/avatar-only spans.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const FILES = [
  'src/components/categories/CategoriesPageContent.tsx',
  'src/components/groups/NearbyGroupsPageContent.tsx',
  'src/components/buddySeek/BuddySeekPageContent.tsx',
  'src/components/plans/PlansPageContent.tsx',
  'src/components/groups/JoinGroupFlow.tsx',
  'src/components/create/CreateEventFlowPageContent.tsx',
  'src/components/report/ReportIssuePageContent.tsx',
  'src/components/auth/LoginPageBody.tsx',
  'src/components/common/Modal.tsx',
  'src/components/common/BottomSheet.tsx',
  'src/components/profile/ProfilePageContent.tsx',
  'src/components/calendar/DailyScheduleView.tsx',
  'src/components/calendar/CalendarHourlySchedule.tsx',
  'src/components/calendar/PlannedEventsCalendar.tsx',
  'src/components/calendar/MyCalendarPageContent.tsx',
  'src/components/calendar/CalendarDayCell.tsx',
  'src/components/organizer/OrganizerProfilePageContent.tsx',
  'src/components/copilot/CopilotPanel.tsx',
  'src/pages/OnboardingClassic.tsx',
  'src/pages/not-found.tsx',
  'src/pages/NotFoundClassic.tsx',
  'src/pages/NotFoundBento.tsx',
  'src/pages/NotFoundBentoDark.tsx',
  'src/pages/NotFoundNeon.tsx',
  'src/pages/NotFoundNeonDark.tsx',
  'src/pages/NotFoundVibrant.tsx',
  'src/pages/NotFoundVibrantDark.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/alert-dialog.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/drawer.tsx',
  'src/components/home/StoryViewer.tsx',
  'src/components/home/HomeLoggedInHero.tsx',
  'src/components/home/HomeLoggedInHeroContrast.tsx',
  'src/components/events/PostEventFeedbackPageContent.tsx',
  'src/components/admin/OrganizerDashboardPageContent.tsx',
  'src/components/connections/ConnectionsPageContent.tsx',
];

/** Order matters: longer / more specific first */
const REPLACEMENTS = [
  // Oversized page / section titles → Home pageTitle scale
  ['text-base md:text-lg font-extrabold', 'text-sm md:text-base font-extrabold'],
  ['text-base md:text-lg font-black', 'text-sm md:text-base font-black'],
  ['text-base md:text-lg font-bold', 'text-sm md:text-base font-bold'],
  ['text-sm md:text-lg font-black', 'text-sm md:text-base font-black'],
  ['text-sm md:text-lg font-extrabold', 'text-sm md:text-base font-extrabold'],
  ['text-sm md:text-lg font-bold', 'text-sm md:text-base font-bold'],
  ['font-extrabold text-base md:text-lg', 'font-extrabold text-sm md:text-base'],
  ['font-bold text-base md:text-lg', 'font-bold text-sm md:text-base'],
  ['text-lg font-extrabold tracking-tight', 'text-sm md:text-base font-extrabold tracking-tight'],
  ['text-lg font-extrabold', 'text-sm md:text-base font-extrabold'],
  ['text-lg font-black', 'text-sm md:text-base font-black'],
  ['text-lg font-bold', 'text-sm md:text-base font-bold'],
  ['font-bold text-lg', 'font-bold text-sm md:text-base'],
  ['font-extrabold text-lg', 'font-extrabold text-sm md:text-base'],
  ['font-black text-lg', 'font-black text-sm md:text-base'],
  // Subtitles that stepped up on md
  ['text-sm md:text-base font-medium', 'text-sm font-medium'],
  ['text-sm md:text-lg', 'text-sm'],
  ['font-medium text-xs md:text-sm', 'font-medium text-sm'],
  // Redundant override once HOME_TYPO.heroTitle matches
  ["h.heroTitle, 'text-sm md:text-base max-w-2xl'", "h.heroTitle, 'max-w-2xl'"],
  ['h.heroTitle, "text-sm md:text-base max-w-2xl"', 'h.heroTitle, "max-w-2xl"'],
];

// Patterns that must stay (KPI numerals) — skip lines containing these
const KEEP_IF = [
  'tabular-nums',
  'statValue',
  'QuickStats',
  'font-black tabular',
  'leading-none',
  'emoji',
  'aria-hidden',
];

let changedFiles = 0;
let totalHits = 0;

for (const rel of FILES) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) continue;
  let src = fs.readFileSync(abs, 'utf8');
  const lines = src.split('\n');
  let fileHits = 0;
  const next = lines.map((line) => {
    // Preserve KPI / decorative lines
    if (KEEP_IF.some((k) => line.includes(k) && (line.includes('text-lg') || line.includes('tabular')))) {
      // Still allow non-KPI replacements on lines that only mention emoji/aria without text-lg title intent
      if (
        (line.includes('tabular-nums') || line.includes('leading-none')) &&
        line.includes('text-lg') &&
        !line.includes('<h1') &&
        !line.includes('<h2') &&
        !line.includes('<h3') &&
        !line.includes('titleId')
      ) {
        return line;
      }
    }
    let out = line;
    for (const [from, to] of REPLACEMENTS) {
      if (out.includes(from)) {
        out = out.split(from).join(to);
        fileHits += 1;
      }
    }
    return out;
  });
  const joined = next.join('\n');
  if (joined !== src) {
    fs.writeFileSync(abs, joined);
    changedFiles += 1;
    totalHits += fileHits;
    console.log(`updated ${rel} (${fileHits})`);
  }
}

console.log(`Done: ${changedFiles} files, ${totalHits} replacements`);
