/**
 * P1-T7 codemod pass 2 — occurrences missed by the truncated first inventory.
 * Usage: node scripts/codemod-z-scale-pass2.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const DRY = process.argv.includes('--dry');

const RULES = [
  ['components/buddySeek/PlansFormingBottomSheet.tsx', [['z-[70]', 'z-sheet']]],
  ['components/chat/ReportConversationModal.tsx', [['z-[90]', 'z-modal']]],
  ['components/common/Modal.tsx', [['z-[100]', 'z-modal']]],
  ['components/home/HomeSearchDropdown.tsx', [['z-50', 'z-fab']]],
  ['components/groups/NearbyGroupsPageContent.tsx', [['z-50', 'z-fab']]],
  ['components/organizer/OrganizerProfilePageContent.tsx', [['z-50', 'z-modal']]],
  ['components/plans/PlansPageContent.tsx', [['z-50', 'z-modal']]],
  ['components/settings/SettingsPageContent.tsx', [['z-50', 'z-modal']]],
  ['components/ui/alert-dialog.tsx', [['z-50', 'z-modal']]],
  ['components/ui/dialog.tsx', [['z-50', 'z-modal']]],
  ['components/ui/drawer.tsx', [['z-50', 'z-modal']]],
  ['components/ui/dropdown-menu.tsx', [['z-50', 'z-modal-high']]],
  ['components/ui/context-menu.tsx', [['z-50', 'z-modal-high']]],
  ['components/ui/menubar.tsx', [['z-50', 'z-modal-high']]],
  ['components/ui/hover-card.tsx', [['z-50', 'z-modal-high']]],
  ['components/ui/popover.tsx', [['z-50', 'z-modal-high']]],
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
