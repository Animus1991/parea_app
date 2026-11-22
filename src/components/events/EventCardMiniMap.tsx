import { useEffect, useRef, useState } from 'react';
import { TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletMapHost, LeafletMapReady } from '../common/LeafletMapHost';
import { applyBundledLeafletPins } from '../../lib/leafletDefaultIcon';
import { cn } from '../../lib/utils';
import { stopBubbling } from '../../lib/a11y';

applyBundledLeafletPins();

export default function EventCardMiniMap({ lat, lng, isDark, className }: { lat: number; lng: number; isDark: boolean; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px', threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn(
        'h-24 w-full rounded-lg overflow-hidden border mt-1 relative z-0 pointer-events-none',
        isDark ? 'border-gray-700/40' : 'border-gray-200', className,
      )}
      {...stopBubbling}
    >
      {inView ? (
        <LeafletMapHost center={[lat, lng]} zoom={14} zoomControl={false} attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          placeholder={<div className="h-full w-full bg-gray-100 dark:bg-gray-800" aria-hidden />}>
          <LeafletMapReady>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]} />
          </LeafletMapReady>
        </LeafletMapHost>
      ) : <div className="h-full w-full bg-gray-100 dark:bg-gray-800" aria-hidden />}
    </div>
  );
}
