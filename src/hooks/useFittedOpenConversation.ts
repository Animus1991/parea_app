import { useCallback } from 'react';
import { popupMaxFromViewport } from '../lib/popupChatLayout';
import { useChatStore } from '../store/chatStore';

/** Open a popup, spilling extras into restore pills when the screen is too narrow. */
export function useFittedOpenConversation() {
  const openConversation = useChatStore((s) => s.openConversation);
  return useCallback(
    (id: string) => {
      openConversation(id, { maxWindows: popupMaxFromViewport() });
    },
    [openConversation],
  );
}
