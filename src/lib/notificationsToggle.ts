export type NotificationsLocationState = {
  from?: string;
  notificationsToggle?: boolean;
};

export function isNotificationsPath(pathname: string): boolean {
  return pathname === '/notifications' || pathname.startsWith('/notifications/');
}

export function locationKey(loc: { pathname: string; search?: string; hash?: string }): string {
  return `${loc.pathname}${loc.search ?? ''}${loc.hash ?? ''}`;
}

/** Close the notifications screen: history.back when the bell opened it, else a saved path. */
export function notificationsCloseAction(
  state: NotificationsLocationState | null | undefined,
): { type: 'back' } | { type: 'to'; path: string } {
  if (state?.notificationsToggle) return { type: 'back' };
  const from = state?.from;
  if (from && !isNotificationsPath(from.split(/[?#]/, 1)[0] ?? from)) {
    return { type: 'to', path: from };
  }
  return { type: 'to', path: '/' };
}
