import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BOTTOM_SWIPE_QUICK_NAV_ENABLED,
  isUpwardOpenSwipe,
  suppressClickOnce,
} from '../lib/bottomSwipeQuickNav';
import { hasOpenOverlay } from '../lib/overlayStack';
import { useMediaQuery } from './useMediaQuery';

const MD_UP = '(min-width: 768px)';
/** Capture the pointer once the finger has clearly left a tap. */
const LOCK_PX = 24;

/**
 * Swipe-up on the existing bottom tabs opens the hidden page grid.
 * When the kill switch is off this hook adds no listeners and no state.
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

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isDesktop) setOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!BOTTOM_SWIPE_QUICK_NAV_ENABLED) return;
    const nav = navRef.current;
    if (!nav || isDesktop) return;

    const blockDrag = (event: DragEvent) => event.preventDefault();
    nav.addEventListener('dragstart', blockDrag);

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const startX = event.clientX;
      const startY = event.clientY;
      const pointerId = event.pointerId;
      let locked = false;

      const stop = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        if (locked && nav.hasPointerCapture(pointerId)) {
          nav.releasePointerCapture(pointerId);
        }
      };

      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== pointerId) return;
        const dx = move.clientX - startX;
        const dy = move.clientY - startY;
        if (locked) return;
        if (dy > -LOCK_PX || Math.abs(dy) < Math.abs(dx)) return;
        locked = true;
        try {
          nav.setPointerCapture(pointerId);
        } catch {
          locked = false;
        }
      };

      const onCancel = (cancel: PointerEvent) => {
        if (cancel.pointerId !== pointerId) return;
        stop();
      };

      const onUp = (up: PointerEvent) => {
        if (up.pointerId !== pointerId) return;
        const dx = up.clientX - startX;
        const dy = up.clientY - startY;
        stop();
        if (openRef.current) {
          if (!isUpwardOpenSwipe({ dx, dy })) setOpen(false);
          return;
        }
        if (!isUpwardOpenSwipe({ dx, dy })) return;
        if (hasOpenOverlay()) return;
        suppressClickOnce(nav);
        setOpen(true);
      };

      // Window listeners keep tracking after the finger leaves the 75px tab bar.
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
    };

    nav.addEventListener('pointerdown', onPointerDown);
    return () => {
      nav.removeEventListener('pointerdown', onPointerDown);
      nav.removeEventListener('dragstart', blockDrag);
    };
  }, [isDesktop, pathname]);

  return { open: BOTTOM_SWIPE_QUICK_NAV_ENABLED ? open : false, close, navRef };
}
