/**
 * Typed runtime configuration (inspired by CoFounderBay production shell).
 */
export const appEnv = {
  mode: import.meta.env.MODE as string,
  appName: 'Nakamas',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '',
  geminiApiKey: (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '',
  googleMapsKey:
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ??
    (import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY as string | undefined) ??
    '',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
} as const;

export function validateEnv(): string[] {
  const warnings: string[] = [];
  if (appEnv.mode === 'production' && !appEnv.geminiApiKey) {
    warnings.push('VITE_GEMINI_API_KEY is not set — AI features will be disabled.');
  }
  if (appEnv.mode === 'production' && !appEnv.googleMapsKey) {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY is not set — maps may fail.');
  }
  return warnings;
}
