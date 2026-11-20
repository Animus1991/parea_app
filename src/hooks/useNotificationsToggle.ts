import { useLocation, useNavigate } from 'react-router-dom';
import {
  isNotificationsPath,
  locationKey,
  notificationsCloseAction,
  type NotificationsLocationState,
} from '../lib/notificationsToggle';

/** Bell: first tap opens Notifications, second tap restores the page you were on. */
export function useNotificationsToggle() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOpen = isNotificationsPath(location.pathname);

  const toggle = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (isOpen) {
      const action = notificationsCloseAction(location.state as NotificationsLocationState | null);
      if (action.type === 'back') navigate(-1);
      else navigate(action.path);
      return;
    }
    navigate('/notifications', {
      state: { from: locationKey(location), notificationsToggle: true } satisfies NotificationsLocationState,
    });
  };

  return { isOpen, toggle };
}
