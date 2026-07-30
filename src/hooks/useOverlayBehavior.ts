import { RefObject, useEffect, useRef } from 'react';
import { isTopOverlay, pushOverlay, removeOverlay } from '../lib/overlayStack';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared behavior for overlay primitives (Modal / BottomSheet):
 * - registers on the global overlay stack (top-only Escape & Tab handling)
 * - reference-counted body scroll lock
 * - Escape closes (top overlay only)
 * - initial focus into the panel, Tab/Shift+Tab focus trap, focus restore
 *
 * The panel element must be focusable (tabIndex={-1}) so focus can move into
 * the overlay even when it contains no initially-focusable control.
 */
export function useOverlayBehavior(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
): void {
  const idRef = useRef<symbol | null>(null);
  if (idRef.current === null) idRef.current = Symbol('overlay');

  useEffect(() => {
    if (!open) return;
    const id = idRef.current as symbol;
    pushOverlay(id);
    return () => removeOverlay(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = idRef.current as symbol;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTopOverlay(id)) {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === 'Tab' && isTopOverlay(id)) {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);
        if (focusables.length === 0) {
          event.preventDefault();
          panel.focus({ preventScroll: true });
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (event.shiftKey) {
          if (active === first || active === panel || !panel.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !panel.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, panelRef]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const autofocus = panel?.querySelector<HTMLElement>('[data-autofocus]');
    (autofocus ?? panel)?.focus({ preventScroll: true });
    return () => {
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, panelRef]);
}
