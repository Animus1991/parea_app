import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sideNavCollapsed: boolean;
  commandPaletteOpen: boolean;
  setSideNavCollapsed: (v: boolean) => void;
  toggleSideNav: () => void;
  setCommandPaletteOpen: (v: boolean) => void;
  toggleCommandPalette: () => void;
  /** Φ25 (port from nakamas): ids of side-nav sections the user collapsed. */
  navCollapsed: string[];
  toggleNavSection: (id: string) => void;
  /** Declutter: hide the page-level «Πες στο Nakamas AI» cards (the AI button stays in the header). */
  aiHintsHidden: boolean;
  setAiHintsHidden: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sideNavCollapsed: false,
      commandPaletteOpen: false,
      setSideNavCollapsed: (sideNavCollapsed) => set({ sideNavCollapsed }),
      toggleSideNav: () => set((s) => ({ sideNavCollapsed: !s.sideNavCollapsed })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      // Less frequent destinations start collapsed; the active section always opens.
      navCollapsed: ['host', 'trust', 'support'],
      toggleNavSection: (id) =>
        set((s) => ({
          navCollapsed: s.navCollapsed.includes(id) ? s.navCollapsed.filter((x) => x !== id) : [...s.navCollapsed, id],
        })),
      aiHintsHidden: false,
      setAiHintsHidden: (aiHintsHidden) => set({ aiHintsHidden }),
    }),
    {
      name: 'nakamas-ui',
      partialize: (s) => ({ sideNavCollapsed: s.sideNavCollapsed, navCollapsed: s.navCollapsed, aiHintsHidden: s.aiHintsHidden }),
    },
  ),
);
