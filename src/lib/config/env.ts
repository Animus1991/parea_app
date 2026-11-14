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
  /** When true (default in dev with server.ts), Gemini calls go through /api/ai/generate. */
  aiUseProxy: import.meta.env.VITE_AI_USE_PROXY !== 'false',
  wsUrl: (import.meta.env.VITE_WS_URL as string | undefined) ?? '',
  firebase: {
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) ?? '',
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined) ?? '',
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) ?? '',
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ?? '',
    firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID as string | undefined) ?? '',
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ?? '',
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined) ?? '',
    measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined) ?? '',
  },
  /** Google Identity Services client id — OAuth without full Firebase project. */
  googleOAuthClientId: (import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined) ?? '',
  /** Stripe publishable key (sandbox/live) — enables non-demo payment CTAs when set. */
  stripePublishableKey: (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? '',
  /** Stripe Checkout / Payment Link URL for withdrawals & ticket holds. */
  stripeCheckoutUrl: (import.meta.env.VITE_STRIPE_CHECKOUT_URL as string | undefined) ?? '',
  /** Live support: mailto or https helpdesk URL (Crisp/Intercom/Zendesk…). */
  supportUrl: (import.meta.env.VITE_SUPPORT_URL as string | undefined) ?? '',
  supportEmail: (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) ?? '',
  /**
   * Demo accounts and "Explore as guest" on the login page. Default: on, except in a
   * production build with Firebase configured (real sign-in only). VITE_DEMO_LOGIN overrides.
   */
  demoLogin:
    import.meta.env.VITE_DEMO_LOGIN === 'true' ||
    (import.meta.env.VITE_DEMO_LOGIN !== 'false' &&
      !(
        import.meta.env.MODE === 'production' &&
        Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID) &&
        Boolean(import.meta.env.VITE_FIREBASE_API_KEY)
      )),
} as const;

export function validateEnv(): string[] {
  const warnings: string[] = [];
  if (appEnv.mode === 'production' && appEnv.aiUseProxy && !appEnv.apiBaseUrl) {
    warnings.push('Production AI proxy enabled but VITE_API_BASE_URL is empty — using same-origin.');
  }
  if (appEnv.mode === 'production' && !appEnv.aiUseProxy && !appEnv.geminiApiKey) {
    warnings.push('VITE_GEMINI_API_KEY is not set — AI features will be disabled.');
  }
  if (appEnv.mode === 'production' && !appEnv.googleMapsKey) {
    warnings.push('VITE_GOOGLE_MAPS_API_KEY is not set — maps may fail.');
  }
  return warnings;
}
