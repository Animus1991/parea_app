import { useMemo } from 'react';
import { getGroupChatAccentTones } from '../lib/designTokens';
import { usePageContrast } from './usePageContrast';

/** Theme-aware accent tokens for unified GroupChatPageContent. */
export function useGroupChatContrast() {
  const p = usePageContrast();

  return useMemo(() => {
    const tones = getGroupChatAccentTones(p.accentFamily);
    const light = !p.isDark;

    return {
      p,
      focusRing: tones.focusRing,
      focusIcon: tones.focusIcon,
      infoActive: tones.infoActive,
      tagBadge: tones.tagBadge,
      linkBtn: tones.linkBtn,
      shareActive: tones.shareActive,
      shareActiveText: light ? tones.shareActiveText : p.statVal,
      shareMutedText: light ? tones.shareMutedText : p.muted,
      avatarPlaceholder: tones.avatarPlaceholder,
      panelAccent: tones.panelAccent,
      panelSoft: tones.panelSoft,
      radioOn: tones.radioOn,
      primaryBtn: tones.primaryBtn,
      accentText: tones.accentText,
      selectedRow: tones.selectedRow,
    };
  }, [p]);
}
