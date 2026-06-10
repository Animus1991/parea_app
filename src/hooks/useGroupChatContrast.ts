import { useMemo } from 'react';
import { usePageContrast } from './usePageContrast';

/** Theme-aware accent tokens for unified GroupChatPageContent. */
export function useGroupChatContrast() {
  const p = usePageContrast();

  return useMemo(() => {
    const f = p.accentFamily;
    const light = !p.isDark;

    const focusRing =
      f === 'fuchsia'
        ? 'focus:ring-fuchsia-500'
        : f === 'indigo'
          ? 'focus:ring-indigo-500'
          : f === 'emerald'
            ? 'focus:ring-emerald-500'
            : 'focus:ring-cyan-500';

    const focusIcon =
      f === 'fuchsia'
        ? 'group-focus-within:text-fuchsia-500'
        : f === 'indigo'
          ? 'group-focus-within:text-indigo-500'
          : f === 'emerald'
            ? 'group-focus-within:text-emerald-500'
            : 'group-focus-within:text-cyan-500';

    const infoActive =
      f === 'fuchsia'
        ? 'text-fuchsia-600 bg-fuchsia-50'
        : f === 'indigo'
          ? 'text-indigo-600 bg-indigo-50'
          : f === 'emerald'
            ? 'text-emerald-600 bg-emerald-50'
            : 'text-cyan-600 bg-cyan-50';

    const tagBadge =
      f === 'fuchsia'
        ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100'
        : f === 'indigo'
          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
          : f === 'emerald'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-cyan-50 text-cyan-700 border-cyan-100';

    const linkBtn =
      f === 'fuchsia'
        ? 'text-fuchsia-600 hover:text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100 border-fuchsia-100'
        : f === 'indigo'
          ? 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-100'
          : f === 'emerald'
            ? 'text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-100'
            : 'text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-100';

    const shareActive =
      f === 'fuchsia'
        ? 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100'
        : f === 'indigo'
          ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
          : f === 'emerald'
            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
            : 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100';

    const shareActiveText = light
      ? f === 'fuchsia'
        ? 'text-fuchsia-700'
        : f === 'indigo'
          ? 'text-indigo-700'
          : f === 'emerald'
            ? 'text-emerald-700'
            : 'text-cyan-700'
      : p.statVal;

    const shareMutedText = light
      ? f === 'fuchsia'
        ? 'text-fuchsia-600/80'
        : f === 'indigo'
          ? 'text-indigo-600/80'
          : f === 'emerald'
            ? 'text-emerald-600/80'
            : 'text-cyan-600/80'
      : p.muted;

    const avatarPlaceholder =
      f === 'fuchsia'
        ? 'bg-fuchsia-50 text-fuchsia-700'
        : f === 'indigo'
          ? 'bg-indigo-50 text-indigo-700'
          : f === 'emerald'
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-cyan-50 text-cyan-700';

    const panelAccent =
      f === 'fuchsia'
        ? 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-600'
        : f === 'indigo'
          ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
          : f === 'emerald'
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
            : 'bg-cyan-50 border-cyan-100 text-cyan-600';

    const panelSoft =
      f === 'fuchsia'
        ? 'bg-fuchsia-50 border-fuchsia-100/40 text-fuchsia-700'
        : f === 'indigo'
          ? 'bg-indigo-50 border-indigo-100/40 text-indigo-700'
          : f === 'emerald'
            ? 'bg-emerald-50 border-emerald-100/40 text-emerald-700'
            : 'bg-cyan-50 border-[#a5f3fc]/40 text-cyan-700';

    const radioOn =
      f === 'fuchsia'
        ? 'border-fuchsia-600 bg-fuchsia-600'
        : f === 'indigo'
          ? 'border-indigo-600 bg-indigo-600'
          : f === 'emerald'
            ? 'border-emerald-600 bg-emerald-600'
            : 'border-cyan-600 bg-cyan-600';

    const primaryBtn =
      f === 'fuchsia'
        ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'
        : f === 'indigo'
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : f === 'emerald'
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-cyan-600 text-white hover:bg-cyan-700';

    const accentText =
      f === 'fuchsia'
        ? 'text-fuchsia-600'
        : f === 'indigo'
          ? 'text-indigo-600'
          : f === 'emerald'
            ? 'text-emerald-600'
            : 'text-cyan-600';

    const selectedRow =
      f === 'fuchsia'
        ? 'border-fuchsia-500 bg-fuchsia-50/30'
        : f === 'indigo'
          ? 'border-indigo-500 bg-indigo-50/30'
          : f === 'emerald'
            ? 'border-emerald-500 bg-emerald-50/30'
            : 'border-[#18D8DB] bg-cyan-50/30';

    return {
      p,
      focusRing,
      focusIcon,
      infoActive,
      tagBadge,
      linkBtn,
      shareActive,
      shareActiveText,
      shareMutedText,
      avatarPlaceholder,
      panelAccent,
      panelSoft,
      radioOn,
      primaryBtn,
      accentText,
      selectedRow,
    };
  }, [p]);
}
