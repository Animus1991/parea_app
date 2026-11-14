import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bindCopilotNavigation } from '../../ai/copilot';
import { useCopilotStore } from '../../store/copilotStore';
import { DESKTOP_DOCK_QUERY } from '../../hooks/useMediaQuery';

/**
 * Connects the copilot orchestrator to the router (so AI actions navigate with
 * client-side routing) and owns the global Ctrl/⌘+J shortcut.
 */
export function CopilotBridge() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    bindCopilotNavigation((path) => {
      navigate(path);
      // On phones the panel covers the page — reveal the destination.
      if (typeof window !== 'undefined' && !window.matchMedia(DESKTOP_DOCK_QUERY).matches) {
        useCopilotStore.getState().setOpen(false);
      }
    }, pathname);
  }, [navigate, pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        useCopilotStore.getState().toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
