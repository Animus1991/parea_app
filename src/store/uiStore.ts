import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_QUICK_NAV_LAYOUT,
  type QuickNavLayout,
} from '../lib/quickNavLayout';
import { isChatHatAnchor, type ChatHatAnchor } from '../lib/chatHatPosition';
import { CHAT_HAT_STYLES, DEFAULT_CHAT_HAT_STYLE } from '../lib/chatHatStyles';

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
  /** Mobile bottom bar + swipe-up shortcuts the user arranged. */
  quickNavLayout: QuickNavLayout;
  setQuickNavLayout: (layout: QuickNavLayout) => void;
  resetQuickNavLayout: () => void;
  /** Which straw-hat photo/sketch is the chat FAB. */
  chatHatStyle: string;
  dismissedChatHats: string[];
  setChatHatStyle: (id: string) => void;
  dismissChatHat: (id: string) => void;
  restoreChatHats: () => void;
  /** Normalized chat-hat screen position. Null keeps the default corner. */
  chatHatPos: ChatHatAnchor | null;
  setChatHatPos: (pos: ChatHatAnchor | null) => void;
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
      navCollapsed: ['community', 'host', 'account', 'trust', 'support'],
      toggleNavSection: (id) =>
        set((s) => ({
          navCollapsed: s.navCollapsed.includes(id) ? s.navCollapsed.filter((x) => x !== id) : [...s.navCollapsed, id],
        })),
      aiHintsHidden: false,
      setAiHintsHidden: (aiHintsHidden) => set({ aiHintsHidden }),
      quickNavLayout: DEFAULT_QUICK_NAV_LAYOUT,
      setQuickNavLayout: (quickNavLayout) => set({ quickNavLayout }),
      resetQuickNavLayout: () => set({ quickNavLayout: DEFAULT_QUICK_NAV_LAYOUT }),
      chatHatStyle: DEFAULT_CHAT_HAT_STYLE,
      dismissedChatHats: [],
      chatHatPos: null,
      setChatHatPos: (chatHatPos) =>
        set({ chatHatPos: chatHatPos && isChatHatAnchor(chatHatPos) ? chatHatPos : null }),
      setChatHatStyle: (chatHatStyle) =>
        set((s) => ({
          chatHatStyle,
          dismissedChatHats: s.dismissedChatHats.filter((id) => id !== chatHatStyle),
        })),
      restoreChatHats: () => set({ dismissedChatHats: [] }),
      dismissChatHat: (id) =>
        set((s) => {
          const dismissed = s.dismissedChatHats.includes(id)
            ? s.dismissedChatHats
            : [...s.dismissedChatHats, id];
          const remaining = CHAT_HAT_STYLES.filter((h) => !dismissed.includes(h.id));
          const nextStyle =
            s.chatHatStyle === id
              ? (remaining[0]?.id ?? DEFAULT_CHAT_HAT_STYLE)
              : s.chatHatStyle;
          return { dismissedChatHats: dismissed, chatHatStyle: nextStyle };
        }),
    }),
    {
      name: 'nakamas-ui',
      partialize: (s) => ({
        sideNavCollapsed: s.sideNavCollapsed,
        navCollapsed: s.navCollapsed,
        quickNavLayout: s.quickNavLayout,
        aiHintsHidden: s.aiHintsHidden,
        chatHatStyle: s.chatHatStyle,
        dismissedChatHats: s.dismissedChatHats,
        chatHatPos: s.chatHatPos,
      }),
    },
  ),
);
