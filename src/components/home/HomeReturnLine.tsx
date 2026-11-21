import { Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useReturnSummary } from '../../hooks/useReturnSummary';
import { describeReturnPart, returnPartPath } from '../../lib/returnVisit';
import { prefetchPath } from '../../lib/routeLoaders';

/**
 * The hero's second line. When there is something to act on (the next plan
 * within two days, news since the last visit) it says so, each part one tap
 * away; otherwise it keeps the time-of-day line. Same text style either way.
 */
export function HomeReturnLine({ className, fallback }: { className?: string; fallback?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const parts = useReturnSummary();

  if (parts.length === 0) return fallback ? <p className={className}>{fallback}</p> : null;

  const lead = parts[0].kind === 'next' ? '' : t('Από την τελευταία σου επίσκεψη: ', 'Since your last visit: ');
  return (
    <p className={className}>
      {lead}
      {parts.map((part, i) => {
        const path = returnPartPath(part);
        const separator = i === 0 ? '' : i === 1 && parts[0].kind === 'next' ? ' · ' : ', ';
        return (
          <Fragment key={part.kind}>
            {separator}
            {i === 1 && parts[0].kind === 'next' ? t('Νέα: ', 'New: ') : null}
            <button
              type="button"
              onClick={() => navigate(path)}
              onMouseEnter={() => prefetchPath(path)}
              onFocus={() => prefetchPath(path)}
              className="inline underline decoration-current/40 underline-offset-2 hover:decoration-current focus-visible:decoration-current rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {describeReturnPart(part, t)}
            </button>
          </Fragment>
        );
      })}
    </p>
  );
}
