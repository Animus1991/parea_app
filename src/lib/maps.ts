/** Unified Google Maps API key — supports both env var names from .env.example and legacy code. */
export function getGoogleMapsApiKey(): string {
  const env = import.meta.env;
  return (
    env.VITE_GOOGLE_MAPS_API_KEY ||
    env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    ''
  );
}

export function isGoogleMapsConfigured(): boolean {
  return getGoogleMapsApiKey().length > 10;
}
