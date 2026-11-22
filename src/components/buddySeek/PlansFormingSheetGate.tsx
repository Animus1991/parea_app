import { lazy, Suspense, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { hidesFindCompanyShortcut } from '../../lib/plansFormingRail';

const PlansFormingBottomSheet = lazy(() => import('./PlansFormingBottomSheet').then((m) => ({ default: m.PlansFormingBottomSheet })));

export function PlansFormingSheetGate() {
  const open = useStore((s) => s.plansFormingSheetOpen);
  const setOpen = useStore((s) => s.setPlansFormingSheetOpen);
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (hidesFindCompanyShortcut(pathname)) setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    if (searchParams.get('reconnect') && !hidesFindCompanyShortcut(pathname)) setOpen(true);
  }, [searchParams, pathname, setOpen]);

  if (!open || hidesFindCompanyShortcut(pathname)) return null;
  return <Suspense fallback={null}><PlansFormingBottomSheet /></Suspense>;
}
