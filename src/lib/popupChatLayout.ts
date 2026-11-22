/** How many popup windows can sit on screen at once. Extra opens minimize the oldest. */
export const MAX_POPUP_WINDOWS = 4;
export const POPUP_WINDOW_WIDTH_PX = 360;
export const POPUP_STACK_STEP_REM = 22.5;
export const POPUP_EDGE_REM = 1.5;
/** Web rail width — popups stack in the remaining content column. */
export const POPUP_SIDEBAR_PX = 72;
export const POPUP_MD_PX = 768;

/**
 * How many 360px chat windows fit beside the rail without running off-screen.
 * Phones keep one (the sheet). Wide desktops still cap at four.
 */
export function desktopPopupSlots(viewportWidth: number): number {
  if (viewportWidth < POPUP_MD_PX) return 1;
  const usable = viewportWidth - POPUP_SIDEBAR_PX - POPUP_EDGE_REM * 16;
  return Math.max(1, Math.min(MAX_POPUP_WINDOWS, Math.floor(usable / POPUP_WINDOW_WIDTH_PX)));
}

/** CSS `right` for the hat / restore column, just left of the open stack. */
export function popupDockRightCss(openWindows: number): string | undefined {
  if (openWindows <= 0) return undefined;
  return `calc(${POPUP_EDGE_REM}rem + ${openWindows} * ${POPUP_STACK_STEP_REM}rem)`;
}

export function popupMaxFromViewport(): number {
  if (typeof window === 'undefined') return MAX_POPUP_WINDOWS;
  return desktopPopupSlots(window.innerWidth);
}
