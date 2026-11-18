import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { MapContainer, useMap } from 'react-leaflet';

type MapContainerProps = ComponentProps<typeof MapContainer>;

export type LeafletMapHostProps = Omit<MapContainerProps, 'key'> & {
  /** Shown until the map is safe to mount (SSR / Strict Mode cleanup). */
  placeholder?: ReactNode;
};

function scrubLeafletContainer(root: HTMLElement | null) {
  if (!root) return;
  root.querySelectorAll('.leaflet-container').forEach((node) => {
    const el = node as HTMLElement & { _leaflet_id?: number };
    // Leaflet stamps the DOM node; leftover ids cause "Map container is being reused".
    delete el._leaflet_id;
    el.innerHTML = '';
  });
}

/**
 * MapContainer that survives React Strict Mode remounts and client-side route changes.
 * Leaflet attaches `_leaflet_id` to the container DOM node; a second instance on
 * the same node throws "Map container is being reused by another instance".
 *
 * Strategy: keep a stable wrapper, only mount MapContainer after a macrotask,
 * tear down MapContainer first, then scrub the DOM *after* Leaflet's own remove()
 * has run (never scrub in the same synchronous cleanup as setHostKey(null)).
 */
export function LeafletMapHost({
  placeholder,
  children,
  style,
  className,
  ...mapProps
}: LeafletMapHostProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hostKey, setHostKey] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // The wrapper div is rendered for the component's whole life (only its
    // children change), so reading it here is the same node cleanup will scrub.
    const node = wrapRef.current;
    // Macrotask: runs after React finishes Strict Mode cleanup + DOM commit.
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      scrubLeafletContainer(wrapRef.current);
      setHostKey((k) => (k ?? 0) + 1);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setHostKey(null);
      // Defer scrub until after MapContainer's effect cleanup calls map.remove().
      // Synchronous scrub here races remove() and crashes the ErrorBoundary on
      // every client navigation away from /nearby (and other map pages).
      window.setTimeout(() => scrubLeafletContainer(node), 0);
    };
  }, []);

  const wrapStyle: CSSProperties = {
    height: '100%',
    width: '100%',
    position: 'relative',
    ...(typeof style === 'object' && style ? style : null),
  };

  return (
    <div ref={wrapRef} className={className} style={wrapStyle}>
      {hostKey == null ? (
        (placeholder ?? (
          <div className="h-full w-full bg-[#e5e3df] dark:bg-gray-900" aria-hidden />
        ))
      ) : (
        <MapContainer
          key={hostKey}
          {...mapProps}
          style={{ height: '100%', width: '100%' }}
        >
          {children}
        </MapContainer>
      )}
    </div>
  );
}

/**
 * Delay Marker/TileLayer children until Leaflet panes exist and the map
 * container is still attached. Prevents `appendChild` on undefined during
 * Strict Mode teardown / ErrorBoundary retries.
 */
export function LeafletMapReady({ children }: { children: ReactNode }) {
  const map = useMap();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    const markReady = () => {
      if (cancelled) return;
      try {
        const container = map.getContainer();
        if (!container?.isConnected) return;
        if (map.getPane('markerPane') && map.getPane('tilePane')) {
          setReady(true);
        }
      } catch {
        /* map already disposed */
      }
    };

    map.whenReady(() => {
      // One frame after whenReady so pane DOM is fully attached.
      raf = requestAnimationFrame(markReady);
    });
    markReady();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      setReady(false);
    };
  }, [map]);

  if (!ready) return null;
  return <>{children}</>;
}
