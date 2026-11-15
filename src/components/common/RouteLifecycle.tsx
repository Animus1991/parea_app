import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { trackPage } from '../../lib/analytics';
import { useLanguage } from '../../lib/i18n';
import { pageTitleForPath } from '../../lib/pageTitle';

const APP_NAME = 'Nakamas';
/** How long a back/forward restore waits for lazy content to grow tall enough. */
const MAX_RESTORE_MS = 1500;

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
  }, [pathname, language]);

  // Remember the scroll position of every history entry.
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const onScroll = () => positions.current.set(key, main.scrollTop);
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [key]);

  // Where to put the page: top for a new page; the remembered spot after Back
  // or Forward; unchanged when the same page only rewrites its URL (filters).
  const previous = useRef<{ pathname: string } | null>(null);
  const pendingRestore = useRef(0);
  useEffect(() => {
    const main = document.getElementById('main-content');
    const samePage = previous.current?.pathname === pathname;
    previous.current = { pathname };
    if (!main) return;
    let target: number;
    if (navigationType === 'POP') target = positions.current.get(key) ?? 0;
    else if (navigationType === 'REPLACE' && samePage) target = pendingRestore.current || main.scrollTop;
    else target = 0;
    // The new history entry starts where the page is shown (a later Back needs it).
    positions.current.set(key, target);

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
      if (main.scrollHeight - main.clientHeight >= target - 2 || performance.now() - started > MAX_RESTORE_MS) {
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
