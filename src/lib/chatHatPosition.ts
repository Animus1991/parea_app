/** Normalized 0–1 position of the chat hat inside the movable viewport range. */
export type ChatHatAnchor = {
  nx: number;
  ny: number;
};

export const CHAT_HAT_EDGE_PAD = 8;
export const CHAT_HAT_DRAG_THRESHOLD_PX = 10;
export const CHAT_HAT_NUDGE_PX = 16;
export const CHAT_HAT_NUDGE_SHIFT_PX = 48;

/** Matches `w-24` / `md:w-28` on the live FAB. */
export function chatHatSizePx(viewportWidth: number): number {
  return viewportWidth >= 768 ? 112 : 96;
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function chatHatMovableRange(
  size: number,
  vw: number,
  vh: number,
  pad = CHAT_HAT_EDGE_PAD,
) {
  const minLeft = pad;
  const minTop = pad;
  const maxLeft = Math.max(pad, vw - size - pad);
  const maxTop = Math.max(pad, vh - size - pad);
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
): { left: number; top: number } {
  const range = chatHatMovableRange(size, vw, vh);
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
): ChatHatAnchor {
  const range = chatHatMovableRange(size, vw, vh);
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
): { left: number; top: number } {
  const range = chatHatMovableRange(size, vw, vh);
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
