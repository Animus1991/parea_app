/**
 * Registers /sw.js in production builds so the installed app opens instantly
 * and works offline. VITE_DISABLE_SW=true removes any existing worker
 * (a kill switch for a bad deploy).
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (import.meta.env.VITE_DISABLE_SW === 'true') {
    void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Offline support is an enhancement; the app works without it. */
    });
  });
}
