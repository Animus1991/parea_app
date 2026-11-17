import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { trackPage } from '../../lib/analytics';
import { useLanguage } from '../../lib/i18n';
import { pageTitleForPath } from '../../lib/pageTitle';
import { isResumeWorthyPath } from '../../lib/resumePath';
import { useStore } from '../../store';

const APP_NAME = 'Nakamas';
/**
 * How long a back/forward restore waits for lazy content to grow tall enough.
 * Generous for slow phones; the restore still stops the moment the user
 * scrolls, presses a key or leaves the page.
 */
const MAX_RESTORE_MS = 4000;

/**
 * Positions are keyed by the history entry's index, not the router key.
 * A page may rewrite its own URL (replaceState) while it loads; under load
 * React can drop those pending renders, so the key this component saw is not
 * the key Back returns to. The index of the entry never changes on replace.
 */
function entryId(fallbackKey: string): string {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx;
  return typeof idx === 'number' ? `i${idx}` : `k${fallbackKey}`;
}

/**
 * Per-page housekeeping: document title, the screen-reader announcement and
 * scroll position. New pages start at the top; Back and Forward return the
 * user to where they were (the feed used to jump to the top after every
 * event visit). Changing the language no longer scrolls anywhere.
 */
export function RouteLifecycle() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const { language } = useLanguage();
  const setLastResumePath = useStore((s) => s.setLastResumePath);
  const [announcement, setAnnouncement] = useState('');
  const positions = useRef(new Map<string, number>());

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    const names = pageTitleForPath(pathname);
    const pageTitle = language === 'el' ? names.el : names.en;
    document.title =
      pathname === '/' ? `${APP_NAME} — ${pageTitle}` : pageTitle === APP_NAME ? APP_NAME : `${pageTitle} · ${APP_NAME}`;
    trackPage(pathname, { title: pageTitle });
    setAnnouncement(pageTitle);
    if (isResumeWorthyPath(pathname)) {
      setLastResumePath(pathname);
    }
  }, [pathname, language, setLastResumePath]);

  // Remember the scroll position of every history entry. The listener sits on
  // the document (capture phase): the #main-content node can be replaced after
  // a lazy chunk resolves, and a listener bound to the old node would miss every
  // later scroll, so Back would restore 0.
  useEffect(() => {
    const onScroll = (e: Event) => {
      const el = e.target;
      if (el instanceof HTMLElement && el.id === 'main-content') positions.current.set(entryId(key), el.scrollTop);
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true });
  }, [key]);

  // Where to put the page: top for a new page; the remembered spot after Back
  // or Forward; unchanged when the same page only rewrites its URL (filters).
  const previous = useRef<{ pathname: string } | null>(null);
  const pendingRestore = useRef(0);
  useEffect(() => {
    const first = document.getElementById('main-content');
    const samePage = previous.current?.pathname === pathname;
    previous.current = { pathname };
    if (!first) return;
    let main: HTMLElement = first;
    const id = entryId(key);
    let target: number;
    if (navigationType === 'POP') target = positions.current.get(id) ?? 0;
    else if (navigationType === 'REPLACE' && samePage) target = pendingRestore.current || main.scrollTop;
    else target = 0;
    // The new history entry starts where the page is shown (a later Back needs it).
    positions.current.set(id, target);

    if (target <= 0) {
      pendingRestore.current = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      main.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    pendingRestore.current = target;
    // The page may still be loading: retry until it is tall enough, and stop
    // as soon as the user scrolls on their own.
    const started = performance.now();
    let frame = 0;
    let cancelled = false;
    const stop = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
    const userTookOver = () => {
      stop();
      pendingRestore.current = 0;
    };
    const attempt = () => {
      if (cancelled) return;
      const live = document.getElementById('main-content');
      if (live && live !== main) {
        // The node was swapped while loading: move the restore (and its listeners) to it.
        main.removeEventListener('wheel', userTookOver);
        main.removeEventListener('touchstart', userTookOver);
        main = live;
        main.addEventListener('wheel', userTookOver, { passive: true });
        main.addEventListener('touchstart', userTookOver, { passive: true });
      }
      const tallEnough = main.scrollHeight - main.clientHeight >= target - 2;
      // While the page grows, keep the reader as close to their spot as it allows.
      if (!tallEnough && main.scrollTop < main.scrollHeight - main.clientHeight) {
        main.scrollTop = target;
      }
      if (tallEnough || performance.now() - started > MAX_RESTORE_MS) {
        main.scrollTop = target;
        pendingRestore.current = 0;
        return;
      }
      frame = requestAnimationFrame(attempt);
    };
    attempt();
    const passive = { passive: true } as const;
    main.addEventListener('wheel', userTookOver, passive);
    main.addEventListener('touchstart', userTookOver, passive);
    window.addEventListener('keydown', userTookOver);
    return () => {
      stop();
      main.removeEventListener('wheel', userTookOver);
      main.removeEventListener('touchstart', userTookOver);
      window.removeEventListener('keydown', userTookOver);
    };
  }, [key, pathname, navigationType]);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement}
    </div>
  );
}
