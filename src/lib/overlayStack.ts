/**
 * Module-level registry of mounted overlays (modals, sheets).
 *
 * - Tracks mount order so only the TOP overlay reacts to Escape / Tab traps
 *   (nested overlays, e.g. confirm dialog over a sheet, behave correctly).
 * - Reference-counted body scroll lock: the first overlay locks scrolling and
 *   the last one restores the previous `overflow` value, so nested overlays
 *   never unlock prematurely.
 */
let stack: symbol[] = [];
let lockCount = 0;
let prevOverflow = '';

export function pushOverlay(id: symbol): void {
  stack = [...stack, id];
  if (lockCount === 0 && typeof document !== 'undefined') {
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

export function removeOverlay(id: symbol): void {
  stack = stack.filter((entry) => entry !== id);
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && typeof document !== 'undefined') {
    document.body.style.overflow = prevOverflow;
  }
}

export function isTopOverlay(id: symbol): boolean {
  return stack.length > 0 && stack[stack.length - 1] === id;
}

/** True while any modal/sheet is on the stack — used to avoid opening a second overlay. */
export function hasOpenOverlay(): boolean {
  return stack.length > 0;
}
