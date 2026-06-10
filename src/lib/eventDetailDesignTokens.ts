import type { EventDetailMapAccent } from '../components/events/EventDetailMapSection';

/** Classic-first typography & radii — accent colors vary per theme. */
export interface EventDetailSurfaceTokens {
  sectionBorder: string;
  sectionHeading: string;
  body: string;
  muted: string;
  card: string;
  innerCard: string;
  labelMicro: string;
  listText: string;
  listStrong: string;
  iconMuted: string;
  shadow: string;
  primaryBtn: string;
  primaryBtnStop: string;
  verifiedIcon: string;
  verifiedBg: string;
}

const ACCENT_BTN: Record<EventDetailMapAccent, { on: string; off: string }> = {
  classic: { on: 'bg-[#0E8B8D] hover:bg-[#0b6d6f] text-white', off: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-200' },
  vibrant: { on: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white', off: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-200' },
  neon: { on: 'bg-emerald-600 hover:bg-emerald-700 text-white', off: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-200' },
  bento: { on: 'bg-indigo-600 hover:bg-indigo-700 text-white', off: 'bg-red-500/15 text-red-600 hover:bg-red-500/25 border border-red-200' },
};

const ACCENT_BTN_DARK: Record<EventDetailMapAccent, { on: string; off: string }> = {
  classic: { on: 'bg-cyan-600 hover:bg-cyan-700 text-white', off: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-800' },
  vibrant: { on: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white', off: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-800' },
  neon: { on: 'bg-emerald-600 hover:bg-emerald-700 text-white', off: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-800' },
  bento: { on: 'bg-indigo-600 hover:bg-indigo-700 text-white', off: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-800' },
};

export function getEventDetailSurfaceTokens(
  accent: EventDetailMapAccent,
  darkSurface = false,
): EventDetailSurfaceTokens {
  const btn = darkSurface ? ACCENT_BTN_DARK[accent] : ACCENT_BTN[accent];

  if (darkSurface) {
    return {
      sectionBorder: 'border-gray-700',
      sectionHeading: 'text-[11px] font-bold text-white tracking-wide',
      body: 'text-[13px] text-white font-medium',
      muted: 'text-[13px] text-gray-300 font-medium',
      card: 'rounded-2xl border border-gray-700 bg-gray-800/80 p-4 md:p-5',
      innerCard: 'rounded-2xl border p-4',
      labelMicro: 'text-[10px] font-bold tracking-wider',
      listText: 'text-xs text-gray-200',
      listStrong: 'text-white',
      iconMuted: 'text-gray-400',
      shadow: 'shadow-sm',
      primaryBtn: `text-xs font-bold py-2 px-4 rounded-2xl transition-all duration-200 ${btn.on}`,
      primaryBtnStop: `text-xs font-bold py-2 px-4 rounded-2xl transition-all duration-200 ${btn.off}`,
      verifiedIcon: 'text-emerald-400',
      verifiedBg: 'bg-emerald-950/40 border-emerald-900',
    };
  }

  return {
    sectionBorder: 'border-gray-200',
    sectionHeading: 'text-[11px] font-bold text-[#111827] tracking-wide',
    body: 'text-[13px] text-[#111827] font-medium',
    muted: 'text-[13px] text-gray-600 font-medium',
    card: 'rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-soft',
    innerCard: 'rounded-2xl border p-4',
    labelMicro: 'text-[10px] font-bold tracking-wider',
    listText: 'text-xs text-gray-600',
    listStrong: 'text-gray-700',
    iconMuted: 'text-gray-400',
    shadow: 'shadow-soft',
    primaryBtn: `text-xs font-bold py-2 px-4 rounded-2xl transition-all duration-200 shadow-soft ${btn.on}`,
    primaryBtnStop: `text-xs font-bold py-2 px-4 rounded-2xl transition-all duration-200 ${btn.off}`,
    verifiedIcon: 'text-emerald-600',
    verifiedBg: 'bg-emerald-50/80 border-emerald-100',
  };
}

/** Outer reliability note — Classic card (all themes). */
export function getEventDetailReliabilityShell(darkSurface: boolean): string {
  return darkSurface
    ? 'rounded-2xl border border-gray-700 bg-gray-900/50 p-5 md:p-6 text-sm shadow-sm'
    : 'rounded-2xl border border-gray-100 bg-gray-50/50 p-5 md:p-6 text-sm shadow-soft';
}

interface AccentContentTokens {
  metaLabel: string;
  metaValue: string;
  metaMuted: string;
  trustLink: string;
  aboutBody: string;
  tagBadge: string;
  tagIcon: string;
  externalLink: string;
}

const ACCENT_CONTENT: Record<EventDetailMapAccent, { light: AccentContentTokens; dark: AccentContentTokens }> = {
  classic: {
    light: {
      metaLabel: 'text-gray-500',
      metaValue: 'text-[#111827]',
      metaMuted: 'text-gray-400',
      trustLink: 'text-cyan-600',
      aboutBody: 'text-gray-600',
      tagBadge: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-gray-400',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-[#0E8B8D] hover:border-[#a5f3fc] rounded-2xl',
    },
    dark: {
      metaLabel: 'text-gray-300',
      metaValue: 'text-white',
      metaMuted: 'text-gray-400',
      trustLink: 'text-cyan-400',
      aboutBody: 'text-white',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700/60',
      tagIcon: 'text-white',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-cyan-400 hover:border-cyan-800 rounded-2xl',
    },
  },
  vibrant: {
    light: {
      metaLabel: 'text-gray-500',
      metaValue: 'text-[#111827]',
      metaMuted: 'text-gray-400',
      trustLink: 'text-fuchsia-600',
      aboutBody: 'text-gray-600',
      tagBadge: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-gray-400',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-fuchsia-600 hover:border-fuchsia-200 rounded-2xl',
    },
    dark: {
      metaLabel: 'text-white',
      metaValue: 'text-white',
      metaMuted: 'text-gray-300',
      trustLink: 'text-fuchsia-400',
      aboutBody: 'text-white',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700/60',
      tagIcon: 'text-white',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-fuchsia-400 hover:border-fuchsia-800 rounded-2xl',
    },
  },
  neon: {
    light: {
      metaLabel: 'text-gray-500',
      metaValue: 'text-[#111827]',
      metaMuted: 'text-gray-400',
      trustLink: 'text-emerald-600',
      aboutBody: 'text-gray-600',
      tagBadge: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-gray-400',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 rounded-2xl',
    },
    dark: {
      metaLabel: 'text-white',
      metaValue: 'text-white',
      metaMuted: 'text-gray-300',
      trustLink: 'text-emerald-400',
      aboutBody: 'text-white',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700/60',
      tagIcon: 'text-white',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-emerald-400 hover:border-emerald-800 rounded-2xl',
    },
  },
  bento: {
    light: {
      metaLabel: 'text-gray-500',
      metaValue: 'text-[#111827]',
      metaMuted: 'text-gray-500',
      trustLink: 'text-indigo-600',
      aboutBody: 'text-gray-600',
      tagBadge: 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200/60',
      tagIcon: 'text-gray-400',
      externalLink:
        'border-gray-100 text-gray-700 bg-white hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl',
    },
    dark: {
      metaLabel: 'text-white',
      metaValue: 'text-white',
      metaMuted: 'text-gray-300',
      trustLink: 'text-indigo-400',
      aboutBody: 'text-white',
      tagBadge: 'bg-gray-700 text-white hover:bg-gray-600 border-gray-700/60',
      tagIcon: 'text-white',
      externalLink:
        'border-gray-700 text-white bg-gray-800 hover:bg-gray-700/60 hover:text-indigo-400 hover:border-indigo-800 rounded-2xl',
    },
  },
};

export function getEventDetailContentTokens(accent: EventDetailMapAccent, darkSurface = false) {
  const surface = getEventDetailSurfaceTokens(accent, darkSurface);
  const content = darkSurface ? ACCENT_CONTENT[accent].dark : ACCENT_CONTENT[accent].light;
  return { surface, content };
}

/** Right-column groups card — Classic shell on all themes. */
export function getEventDetailGroupsSidebarShell(darkSurface: boolean): string {
  return darkSurface
    ? 'rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-soft sticky top-24'
    : 'rounded-2xl border border-gray-100 bg-white p-6 shadow-soft sticky top-24';
}

export function getEventDetailGroupsSidebarHeading(darkSurface: boolean): string {
  return darkSurface
    ? 'text-[11px] font-bold text-white tracking-wide mb-4'
    : 'text-[11px] font-bold text-[#6B7280] tracking-wide mb-4';
}
