/** Normalized 0–1 position of the chat hat inside the movable viewport range. */
export type ChatHatAnchor = {
  nx: number;
  ny: number;
};

export type ChatHatInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ChatHatChromeVariant = 'default' | 'event';

export const CHAT_HAT_EDGE_PAD = 8;
export const CHAT_HAT_DRAG_THRESHOLD_PX = 10;
export const CHAT_HAT_NUDGE_PX = 16;
export const CHAT_HAT_NUDGE_SHIFT_PX = 48;

/** Keep in sync with `--header-h` / `--bottom-nav-total` / `--chat-hat-bottom` in index.css. */
const HEADER_H = 52;
const BOTTOM_NAV_TOTAL = 75;
const HAT_ABOVE_NAV = 6;
const EVENT_ACTION_BAR = 84; // 5.25rem
const DESKTOP_HAT_BOTTOM = 24; // 1.5rem

export const CHAT_HAT_EDGE_INSETS: ChatHatInsets = {
  top: CHAT_HAT_EDGE_PAD,
  right: CHAT_HAT_EDGE_PAD,
  bottom: CHAT_HAT_EDGE_PAD,
  left: CHAT_HAT_EDGE_PAD,
};

/** Matches `w-24` / `md:w-28` on the live FAB. */
export function chatHatSizePx(viewportWidth: number): number {
  return viewportWidth >= 768 ? 112 : 96;
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Reserved space so the hat cannot cover the header, tab bar, or event Join row. */
export function chatHatChromeInsets(
  viewportWidth: number,
  variant: ChatHatChromeVariant = 'default',
): ChatHatInsets {
  const pad = CHAT_HAT_EDGE_PAD;
  if (viewportWidth >= 768) {
    return { top: HEADER_H + pad, right: pad, bottom: DESKTOP_HAT_BOTTOM, left: pad };
  }
  const bottomNav = BOTTOM_NAV_TOTAL + HAT_ABOVE_NAV;
  return {
    top: HEADER_H + pad,
    right: pad,
    bottom: variant === 'event' ? bottomNav + EVENT_ACTION_BAR : bottomNav,
    left: pad,
  };
}

export function chatHatMovableRange(
  size: number,
  vw: number,
  vh: number,
  insets: ChatHatInsets = CHAT_HAT_EDGE_INSETS,
) {
  const minLeft = insets.left;
  const minTop = insets.top;
  const maxLeft = Math.max(insets.left, vw - size - insets.right);
  const maxTop = Math.max(insets.top, vh - size - insets.bottom);
  return {
    minLeft,
    minTop,
    maxLeft,
    maxTop,
    spanX: Math.max(0, maxLeft - minLeft),
    spanY: Math.max(0, maxTop - minTop),
  };
}

export function chatHatPixelsFromAnchor(
  anchor: ChatHatAnchor,
  size: number,
  vw: number,
  vh: number,
  insets: ChatHatInsets = CHAT_HAT_EDGE_INSETS,
): { left: number; top: number } {
  const range = chatHatMovableRange(size, vw, vh, insets);
  return {
    left: range.minLeft + clamp01(anchor.nx) * range.spanX,
    top: range.minTop + clamp01(anchor.ny) * range.spanY,
  };
}

export function chatHatAnchorFromPixels(
  left: number,
  top: number,
  size: number,
  vw: number,
  vh: number,
  insets: ChatHatInsets = CHAT_HAT_EDGE_INSETS,
): ChatHatAnchor {
  const range = chatHatMovableRange(size, vw, vh, insets);
  return {
    nx: range.spanX === 0 ? 1 : clamp01((left - range.minLeft) / range.spanX),
    ny: range.spanY === 0 ? 1 : clamp01((top - range.minTop) / range.spanY),
  };
}

export function clampChatHatPixels(
  left: number,
  top: number,
  size: number,
  vw: number,
  vh: number,
  insets: ChatHatInsets = CHAT_HAT_EDGE_INSETS,
): { left: number; top: number } {
  const range = chatHatMovableRange(size, vw, vh, insets);
  return {
    left: Math.min(Math.max(left, range.minLeft), range.maxLeft),
    top: Math.min(Math.max(top, range.minTop), range.maxTop),
  };
}

export function isChatHatAnchor(value: unknown): value is ChatHatAnchor {
  if (!value || typeof value !== 'object') return false;
  const nx = (value as ChatHatAnchor).nx;
  const ny = (value as ChatHatAnchor).ny;
  return Number.isFinite(nx) && Number.isFinite(ny);
}
