/**
 * P1-T7 codemod — map ad-hoc global z-index values to the named --z-* scale.
 * File-aware: the same literal maps to different rungs per role.
 * NOT touched (intentional):
 *  - local in-component stacking (z-0/10/20/30, z-[1], z-[5])
 *  - z-[1000] Leaflet-pane controls (NearbyGroups, LiveEventTracker)
 *  - ui/sidebar.tsx, ui/resizable.tsx (vendored, local)
 * AppShell.tsx is edited manually (same z-50 literal = different roles).
 * Usage: node scripts/codemod-z-scale.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DRY = process.argv.includes('--dry');

/** [relativeFile, [[from, to], ...]] — order matters, exact string replace */
const RULES = [
  ['components/buddySeek/PlansFormingMobileFab.tsx', [['z-[55]', 'z-fab']]],
  ['components/buddySeek/BuddySeekPageContent.tsx', [['z-50', 'z-modal']]],
  ['components/buddySeek/CreateCompanyRequestModal.tsx', [['z-[90]', 'z-modal']]],
  ['components/buddySeek/GroupMergeModal.tsx', [['z-[85]', 'z-modal']]],
  ['components/buddySeek/JoinRequestPreviewModal.tsx', [['z-[80]', 'z-modal']]],
  ['components/calendar/DayEventsStoriesModal.tsx', [['z-[200]', 'z-modal-high']]],
  ['components/calendar/DailyScheduleView.tsx', [['z-[210]', 'z-modal-high']]],
  ['components/calendar/CalendarHourlySchedule.tsx', [['z-50', 'z-modal']]],
  ['components/chat/ChatInboxPanel.tsx', [['z-[70]', 'z-sheet']]],
  ['components/chat/ChatWindow.tsx', [['fixed z-[65] ', 'fixed z-modal md:z-sheet ']]],
  ['components/chat/KeepChatRequestModal.tsx', [['z-[90]', 'z-modal']]],
  ['components/chat/PopupChatRoot.tsx', [['z-[60]', 'z-chat'], ['z-[68]', 'z-chat-scrim']]],
  ['components/common/CommandPalette.tsx', [['z-[300]', 'z-palette'], ['z-[301]', 'z-palette']]],
  ['components/common/DemoModeBanner.tsx', [['z-[90]', 'z-banner']]],
  ['components/common/FilterBottomSheet.tsx', [['z-[60]', 'z-sheet']]],
  ['components/common/OfflineBanner.tsx', [['z-[200]', 'z-banner']]],
  ['components/common/ThemePicker.tsx', [['z-[250]', 'z-palette'], ['z-[251]', 'z-palette']]],
  ['components/connections/ConnectionsPageContent.tsx', [['z-50', 'z-fab']]],
  ['components/events/EventCard.tsx', [['z-[9999]', 'z-modal']]],
  ['components/events/EventDetailQrModal.tsx', [['z-[100]', 'z-modal']]],
  ['components/events/EventMap.tsx', [['!z-[9999]', '!z-fullscreen']]],
  ['components/groups/GroupChatPageContent.tsx', [['z-50', 'z-modal'], ['z-[100]', 'z-modal'], ['z-[200]', 'z-raised']]],
  ['components/groups/NearbyGroupsPageContent.tsx', [['!z-[9999]', '!z-fullscreen']]],
  ['components/groups/groupChat/GroupChatLeaveModal.tsx', [['z-50', 'z-modal']]],
  ['components/groups/groupChat/GroupChatLocationModal.tsx', [['z-[60]', 'z-modal']]],
  ['components/groups/groupChat/GroupChatReportModal.tsx', [['z-50', 'z-modal']]],
  ['components/groups/groupChat/GroupChatSosModal.tsx', [['z-50', 'z-modal']]],
  ['components/home/StoryViewer.tsx', [['z-[120]', 'z-fullscreen']]],
  ['components/ui/select.tsx', [['z-50', 'z-modal-high']]],
  ['components/ui/sheet.tsx', [['z-50', 'z-modal']]],
  ['components/ui/toast.tsx', [['z-[100]', 'z-toast']]],
  ['components/ui/tooltip.tsx', [['z-50', 'z-modal-high']]],
  ['components/wallet/WalletPageContent.tsx', [['z-50', 'z-modal']]],
  ['lib/designTokens.ts', [['z-50', 'z-fab']]],
  ['pages/EventDetailBento.tsx', [['z-50', 'z-fab']]],
  ['pages/EventDetailBentoDark.tsx', [['z-50', 'z-fab']]],
  ['pages/EventDetailClassic.tsx', [['z-50', 'z-fab']]],
  ['pages/EventDetailNeon.tsx', [['z-50', 'z-fab']]],
  ['pages/EventDetailNeonDark.tsx', [['z-50', 'z-fab']]],
  ['pages/EventDetailVibrant.tsx', [['z-50', 'z-fab']]],
  ['pages/EventDetailVibrantDark.tsx', [['z-50', 'z-fab']]],
];

let totalRepl = 0;
for (const [rel, pairs] of RULES) {
  const file = join(SRC, rel);
  let out = readFileSync(file, 'utf8');
  let fileRepl = 0;
  const notes = [];
  for (const [from, to] of pairs) {
    const hits = out.split(from).length - 1;
    if (hits === 0) notes.push(`MISS:${from}`);
    out = out.split(from).join(to);
    fileRepl += hits;
  }
  totalRepl += fileRepl;
  console.log(`${String(fileRepl).padStart(3)}  ${rel}${notes.length ? '  <-- ' + notes.join(', ') : ''}`);
  if (!DRY && fileRepl > 0) writeFileSync(file, out);
}
console.log(`\n${totalRepl} replacements across ${RULES.length} files${DRY ? ' (dry run)' : ''}`);
