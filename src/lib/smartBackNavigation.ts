import type { NavigateFunction } from 'react-router-dom';

/** ZIP pattern: go back when history exists, otherwise safe fallback. */
export function navigateBack(navigate: NavigateFunction, fallback = '/') {
  const state = window.history.state as { idx?: number } | null;
  if (state && typeof state.idx === 'number' && state.idx > 0) {
    navigate(-1);
  } else {
    navigate(fallback);
  }
}
