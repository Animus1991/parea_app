import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

let applied = false;

/**
 * Leaflet guesses its pin image path from its stylesheet, which bundling
 * breaks. Point it at the copies bundled with the installed Leaflet instead of
 * a CDN, so pins also load offline, under a strict CSP, and with no third party.
 */
export function applyBundledLeafletPins(): void {
  if (applied) return;
  applied = true;
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });
}
