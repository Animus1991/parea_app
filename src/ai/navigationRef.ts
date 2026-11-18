/**
 * Shared navigation bridge for Nakamas AI so <CopilotBridge/> and page
 * launchers do not pull the full copilot engine into the initial bundle.
 */
let navigateImpl: (path: string) => void = (path) => {
  if (typeof window !== 'undefined') window.location.assign(path);
};
let currentPath = '/';

export function bindCopilotNavigation(navigate: (path: string) => void, pathname: string): void {
  navigateImpl = navigate;
  currentPath = pathname;
}

export function getCopilotNavigation(): {
  navigate: (path: string) => void;
  pathname: string;
} {
  return { navigate: navigateImpl, pathname: currentPath };
}
