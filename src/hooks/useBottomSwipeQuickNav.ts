import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BOTTOM_SWIPE_QUICK_NAV_ENABLED,
  isBottomSwipeGestureStart,
  isDownwardCloseSwipe,
  isUpwardOpenSwipe,
  suppressClickOnce,
} from '../lib/bottomSwipeQuickNav';
import { hasOpenOverlay } from '../lib/overlayStack';
import { useMediaQuery } from './useMediaQuery';

const MD_UP = '(min-width: 768px)';

type Point = { x: number; y: number };

/**
 * Swipe-up from the existing bottom chrome (tabs + dock) opens the page grid.
 * Swipe-down on the expanded sheet (not the dimmed page) closes it.
 *
 * Phones use Touch Events: iOS cancels Pointer Events when the system home
 * gesture steals the finger, which previously aborted the open. We act as
 * soon as the swipe crosses the threshold — including on touchcancel /
 * pointercancel — so the OS can take the rest of the gesture.
 */
export function useBottomSwipeQuickNav(): {
  open: boolean;
  close: () => void;
  navRef: RefObject<HTMLDivElement | null>;
} {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery(MD_UP);
  const navRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const desktopRef = useRef(isDesktop);
  desktopRef.current = isDesktop;

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!BOTTOM_SWIPE_QUICK_NAV_ENABLED) return;

    let start: Point | null = null;
    let acted = false;
    let owner: 'touch' | 'mouse' | null = null;
    let last: Point | null = null;

    const tryAct = (point: Point) => {
      if (!start || acted) return false;
      if (desktopRef.current) return false;
      const delta = { dx: point.x - start.x, dy: point.y - start.y };
      if (openRef.current) {
        if (!isDownwardCloseSwipe(delta)) return false;
        acted = true;
        suppressClickOnce(undefined, 400);
        setOpen(false);
        return true;
      }
      if (!isUpwardOpenSwipe(delta)) return false;
      if (hasOpenOverlay()) return false;
      acted = true;
      suppressClickOnce(undefined, 400);
      setOpen(true);
      return true;
    };

    const finish = (point: Point | null) => {
      const at = point ?? last;
      if (at) tryAct(at);
      start = null;
      last = null;
      acted = false;
      owner = null;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('pointermove', onMouseMove);
      window.removeEventListener('pointerup', onMouseUp);
      window.removeEventListener('pointercancel', onMouseUp);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (owner !== 'touch' || !start) return;
      const t = event.touches[0] ?? event.changedTouches[0];
      if (!t) return;
      last = { x: t.clientX, y: t.clientY };
      if (event.cancelable) event.preventDefault();
      tryAct(last);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (owner !== 'touch') return;
      const t = event.changedTouches[0];
      finish(t ? { x: t.clientX, y: t.clientY } : last);
    };

    const onMouseMove = (event: PointerEvent) => {
      if (owner !== 'mouse' || event.pointerType !== 'mouse') return;
      last = { x: event.clientX, y: event.clientY };
      tryAct(last);
    };

    const onMouseUp = (event: PointerEvent) => {
      if (owner !== 'mouse') return;
      finish({ x: event.clientX, y: event.clientY });
    };

    const onTouchStart = (event: TouchEvent) => {
      if (desktopRef.current || owner) return;
      if (event.touches.length !== 1) return;
      if (!isBottomSwipeGestureStart(event.target, openRef.current)) return;
      const t = event.touches[0];
      start = last = { x: t.clientX, y: t.clientY };
      acted = false;
      owner = 'touch';
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (desktopRef.current || owner) return;
      if (event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0) return;
      if (!isBottomSwipeGestureStart(event.target, openRef.current)) return;
      start = last = { x: event.clientX, y: event.clientY };
      acted = false;
      owner = 'mouse';
      window.addEventListener('pointermove', onMouseMove);
      window.addEventListener('pointerup', onMouseUp);
      window.addEventListener('pointercancel', onMouseUp);
    };

    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      finish(null);
    };
  }, []);

  return { open: BOTTOM_SWIPE_QUICK_NAV_ENABLED ? open : false, close, navRef };
}
