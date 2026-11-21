import { useEffect, useRef, type RefObject } from 'react';
import { isDownwardCloseSwipe, suppressClickOnce } from '../lib/bottomSwipeQuickNav';

type Point = { x: number; y: number };

/**
 * Swipe down on `handleRef` dismisses a sheet. The panel follows the finger
 * unless the user prefers reduced motion. Only the handle starts the gesture,
 * so a scrollable list below it still scrolls.
 */
export function useSwipeDownDismiss(
  handleRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handle = handleRef.current;
    const panel = panelRef.current;
    if (!handle || !panel) return;

    let start: Point | null = null;
    let last: Point | null = null;
    let owner: 'touch' | 'pointer' | null = null;
    let closed = false;

    const reduced = () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const offset = (dy: number) => {
      if (reduced()) return;
      const y = Math.max(0, dy);
      panel.style.transition = 'none';
      panel.style.transform = y ? `translateY(${y}px)` : '';
    };

    const snapBack = () => {
      if (reduced()) {
        panel.style.transform = '';
        panel.style.transition = '';
        return;
      }
      panel.style.transition = 'transform 200ms ease-out';
      panel.style.transform = '';
    };

    const finish = (point: Point | null) => {
      const at = point ?? last;
      if (start && at && !closed) {
        const delta = { dx: at.x - start.x, dy: at.y - start.y };
        if (isDownwardCloseSwipe(delta)) {
          closed = true;
          suppressClickOnce(undefined, 400);
          panel.style.transform = '';
          panel.style.transition = '';
          onCloseRef.current();
        } else {
          snapBack();
        }
      } else {
        snapBack();
      }
      start = null;
      last = null;
      owner = null;
      closed = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (owner !== 'touch' || !start) return;
      const t = event.touches[0] ?? event.changedTouches[0];
      if (!t) return;
      last = { x: t.clientX, y: t.clientY };
      offset(last.y - start.y);
      if (event.cancelable) event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (owner !== 'touch') return;
      const t = event.changedTouches[0];
      finish(t ? { x: t.clientX, y: t.clientY } : last);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (owner !== 'pointer' || !start) return;
      last = { x: event.clientX, y: event.clientY };
      offset(last.y - start.y);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (owner !== 'pointer') return;
      finish({ x: event.clientX, y: event.clientY });
    };

    const onTouchStart = (event: TouchEvent) => {
      if (owner) return;
      if (event.touches.length !== 1) return;
      if (!(event.target instanceof Node) || !handle.contains(event.target)) return;
      if (event.target instanceof Element && event.target.closest('button')) return;
      const t = event.touches[0];
      start = last = { x: t.clientX, y: t.clientY };
      owner = 'touch';
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (owner) return;
      if (event.pointerType === 'touch') return;
      if (!event.isPrimary || event.button !== 0) return;
      if (!(event.target instanceof Node) || !handle.contains(event.target)) return;
      if (event.target instanceof Element && event.target.closest('button')) return;
      start = last = { x: event.clientX, y: event.clientY };
      owner = 'pointer';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: true });
    handle.addEventListener('pointerdown', onPointerDown);
    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('pointerdown', onPointerDown);
      finish(null);
    };
  }, [handleRef, panelRef]);
}
