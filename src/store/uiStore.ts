import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sideNavCollapsed: boolean;
  commandPaletteOpen: boolean;
  setSideNavCollapsed: (v: boolean) => void;
  toggleSideNav: () => void;
  setCommandPaletteOpen: (v: boolean) => void;
  toggleCommandPalette: () => void;
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
    }),
    {
      name: 'nakamas-ui',
      partialize: (s) => ({ sideNavCollapsed: s.sideNavCollapsed }),
    },
  ),
);
