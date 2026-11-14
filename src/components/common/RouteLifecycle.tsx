import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPage } from '../../lib/analytics';
import { useLanguage } from '../../lib/i18n';
import { pageTitleForPath } from '../../lib/pageTitle';

const APP_NAME = 'Nakamas';

export function RouteLifecycle() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const names = pageTitleForPath(pathname);
    const pageTitle = language === 'el' ? names.el : names.en;
    document.title =
      pathname === '/' ? `${APP_NAME} — ${pageTitle}` : pageTitle === APP_NAME ? APP_NAME : `${pageTitle} · ${APP_NAME}`;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    trackPage(pathname, { title: pageTitle });
    setAnnouncement(pageTitle);
  }, [pathname, language]);

  return (
    <div aria-live="polite" role="status" className="sr-only">
      {announcement}
    </div>
  );
}
