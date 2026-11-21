import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHAT_HAT_DRAG_THRESHOLD_PX,
  CHAT_HAT_NUDGE_PX,
  CHAT_HAT_NUDGE_SHIFT_PX,
  chatHatAnchorFromPixels,
  chatHatChromeInsets,
  chatHatPixelsFromAnchor,
  chatHatSizePx,
  clampChatHatPixels,
  type ChatHatAnchor,
  type ChatHatChromeVariant,
} from '../lib/chatHatPosition';

type Pixels = { left: number; top: number };

function readViewport() {
  return {
    w: window.innerWidth,
    h: window.innerHeight,
  };
}

/**
 * Pointer-drag (and arrow-key nudge) for the floated chat hat.
 * A tap under the movement threshold still counts as a click.
 */
export function useDraggableChatHat(
  saved: ChatHatAnchor | null,
  setSaved: (pos: ChatHatAnchor | null) => void,
  variant: ChatHatChromeVariant = 'default',
) {
  const [viewport, setViewport] = useState(readViewport);
  const [dragPixels, setDragPixels] = useState<Pixels | null>(null);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    moved: boolean;
  } | null>(null);
  const liveRef = useRef<Pixels | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const sync = () => setViewport(readViewport());
    sync();
    window.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('resize', sync);
    };
  }, []);

  const size = chatHatSizePx(viewport.w);
  const insets = chatHatChromeInsets(viewport.w, variant);
  const placed =
    dragPixels ??
    (saved ? chatHatPixelsFromAnchor(saved, size, viewport.w, viewport.h, insets) : null);

  const persistPixels = useCallback(
    (pixels: Pixels) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextSize = chatHatSizePx(vw);
      const nextInsets = chatHatChromeInsets(vw, variant);
      const next = clampChatHatPixels(pixels.left, pixels.top, nextSize, vw, vh, nextInsets);
      setSaved(chatHatAnchorFromPixels(next.left, next.top, nextSize, vw, vh, nextInsets));
      setDragPixels(null);
      setViewport({ w: vw, h: vh });
    },
    [setSaved, variant],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: box.left,
      origTop: box.top,
      moved: false,
    };
    liveRef.current = { left: box.left, top: box.top };
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      const dx = event.clientX - g.startX;
      const dy = event.clientY - g.startY;
      if (!g.moved && dx * dx + dy * dy >= CHAT_HAT_DRAG_THRESHOLD_PX ** 2) {
        g.moved = true;
        suppressClickRef.current = true;
        setDragging(true);
      }
      if (!g.moved) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const next = clampChatHatPixels(
        g.origLeft + dx,
        g.origTop + dy,
        chatHatSizePx(vw),
        vw,
        vh,
        chatHatChromeInsets(vw, variant),
      );
      liveRef.current = next;
      setDragPixels(next);
    },
    [variant],
  );

  const endGesture = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const g = gesture.current;
      if (!g || g.pointerId !== event.pointerId) return;
      gesture.current = null;
      setDragging(false);
      if (g.moved && liveRef.current) {
        persistPixels(liveRef.current);
      } else {
        setDragPixels(null);
      }
      liveRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [persistPixels],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const;
      if (!keys.includes(event.key as (typeof keys)[number])) return;
      event.preventDefault();
      const step = event.shiftKey ? CHAT_HAT_NUDGE_SHIFT_PX : CHAT_HAT_NUDGE_PX;
      const box = event.currentTarget.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      persistPixels(
        clampChatHatPixels(
          box.left + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0),
          box.top + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0),
          chatHatSizePx(vw),
          vw,
          vh,
          chatHatChromeInsets(vw, variant),
        ),
      );
    },
    [persistPixels, variant],
  );

  const shouldIgnoreClick = useCallback(() => suppressClickRef.current, []);

  return {
    placed,
    dragging,
    onPointerDown,
    onPointerMove,
    onPointerUp: endGesture,
    onPointerCancel: endGesture,
    onKeyDown,
    shouldIgnoreClick,
  };
}
