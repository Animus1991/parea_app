import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const HOME_FILTERS_ANCHOR = 'home-filters';

/** Smooth-scroll to category filters on Home; deep-link via `/#home-filters`. */
export function useHomeScrollToFilters() {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToFilters = useCallback(() => {
    const el = document.getElementById(HOME_FILTERS_ANCHOR);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(`/#${HOME_FILTERS_ANCHOR}`);
  }, [navigate]);

  useEffect(() => {
    if (location.pathname !== '/' || location.hash !== `#${HOME_FILTERS_ANCHOR}`) {
      return;
    }
    const id = requestAnimationFrame(() => {
      document.getElementById(HOME_FILTERS_ANCHOR)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.hash]);

  return scrollToFilters;
}
