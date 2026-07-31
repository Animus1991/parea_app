import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { MapContainer, useMap } from 'react-leaflet';

type MapContainerProps = ComponentProps<typeof MapContainer>;

export type LeafletMapHostProps = Omit<MapContainerProps, 'key'> & {
  /** Shown until the map is safe to mount (SSR / Strict Mode cleanup). */
  placeholder?: ReactNode;
};

/**
 * MapContainer that survives React Strict Mode remounts.
 * Leaflet attaches `_leaflet_id` to the container DOM node; a second instance on
 * the same node throws "Map container is being reused by another instance".
 * We fully unmount on cleanup, then remount with a fresh key after paint.
 */
export function LeafletMapHost({ placeholder, children, ...mapProps }: LeafletMapHostProps) {
  const [instanceKey, setInstanceKey] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let outer = 0;
    let inner = 0;

    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (cancelled) return;
        setInstanceKey((k) => k + 1);
        setActive(true);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      setActive(false);
    };
  }, []);

  if (!active || instanceKey === 0) {
    return (
      <>
        {placeholder ?? (
          <div className="h-full w-full bg-[#e5e3df] dark:bg-gray-900" aria-hidden />
        )}
      </>
    );
  }

  return (
    <MapContainer key={instanceKey} {...mapProps}>
      {children}
    </MapContainer>
  );
}

/**
 * Delay Marker/TileLayer children until Leaflet panes exist.
 * Prevents `appendChild` on undefined during early / torn-down map lifecycle.
 */
export function LeafletMapReady({ children }: { children: ReactNode }) {
  const map = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!map) return;
    let cancelled = false;

    const markReady = () => {
      if (!cancelled && map.getPane('markerPane') && map.getPane('tilePane')) {
        setReady(true);
      }
    };

    map.whenReady(markReady);
    markReady();

    return () => {
      cancelled = true;
      setReady(false);
    };
  }, [map]);

  if (!ready) return null;
  return <>{children}</>;
}
