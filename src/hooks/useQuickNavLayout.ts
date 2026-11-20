import { useMemo } from 'react';
import { useStore } from '../store';
import { useUIStore } from '../store/uiStore';
import { isOrganizerUser, isPlatformAdmin } from '../lib/roles';
import {
  addQuickNavTile,
  DEFAULT_QUICK_NAV_LAYOUT,
  moveQuickNavTile,
  pinQuickNavToBar,
  removeQuickNavTile,
  sanitizeQuickNavLayout,
  splitQuickNav,
  type QuickNavLayout,
} from '../lib/quickNavLayout';

export function useQuickNavLayout() {
  const stored = useUIStore((s) => s.quickNavLayout);
  const setQuickNavLayout = useUIStore((s) => s.setQuickNavLayout);
  const resetQuickNavLayout = useUIStore((s) => s.resetQuickNavLayout);
  const currentUser = useStore((s) => s.currentUser);
  const role = useMemo(
    () => ({
      isAdmin: isPlatformAdmin(currentUser),
      isOrganizer: isOrganizerUser(currentUser),
    }),
    [currentUser],
  );
  const layout = useMemo(() => sanitizeQuickNavLayout(stored ?? DEFAULT_QUICK_NAV_LAYOUT, role), [stored, role]);
  const split = useMemo(() => splitQuickNav(layout, role), [layout, role]);

  const setLayout = (next: QuickNavLayout) => setQuickNavLayout(sanitizeQuickNavLayout(next, role));

  return {
    role,
    layout,
    ...split,
    add: (id: string) => setLayout(addQuickNavTile(layout, id, role)),
    remove: (id: string) => setLayout(removeQuickNavTile(layout, id, role)),
    pinToBar: (id: string) => setLayout(pinQuickNavToBar(layout, id, role)),
    move: (from: number, to: number) => setLayout(moveQuickNavTile(layout, from, to, role)),
    reset: resetQuickNavLayout,
  };
}
