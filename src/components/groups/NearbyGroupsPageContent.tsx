import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from 'sonner';
import { MapPin, Search, Navigation, Crosshair, Map as MapIcon, SlidersHorizontal, ShieldAlert, Maximize, Minimize, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isToday, parseISO } from "date-fns";
import { useStore } from "../../store";
import { TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { EmptyState } from "../common/EmptyState";
import { EventCardSkeleton } from "../common/Skeleton";
import { ResourceStateGate } from "../common/ResourceStateGate";
import { LeafletMapHost, LeafletMapReady } from "../common/LeafletMapHost";
import { useEventsResource } from "../../hooks/useEventsQuery";
import { useLanguage } from "../../lib/i18n";
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { APP_TYPO } from '../../lib/typographyTokens';
import { pressable, redundantClick } from '../../lib/a11y';
import { Button } from "../common/Button";
import { haversineKm, ATHENS_CENTER } from "../../lib/haversine";
import { applyBundledLeafletPins } from '../../lib/leafletDefaultIcon';
import { useCategoryLabel } from '../../hooks/useCategoryLabel';
import { DEFAULT_EVENT_COVER } from '../../lib/eventCover';
import { formatLocationArea } from '../../lib/eventDisplay';

applyBundledLeafletPins();

/**
 * Markers whose point lies under the list panel are covered, yet stayed in the
 * Tab order (focus landed on invisible markers, WCAG 2.4.11). Hide those and
 * take them out of the Tab order; visible markers stay fully usable.
 */
function HideMarkersUnderPanel({
  panelRef,
  overlayRef,
  markerCount,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Floating search and filter controls over the map: markers under them are covered too. */
  overlayRef: React.RefObject<HTMLDivElement | null>;
  markerCount: number;
}) {
  const map = useMap();
  useEffect(() => {
    const pane = map.getPane('markerPane');
    const panel = panelRef.current;
    if (!pane || !panel) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const covers = [panel.getBoundingClientRect()];
        overlayRef.current
          ?.querySelectorAll<HTMLElement>('button, input, select, a[href]')
          .forEach((control) => covers.push(control.getBoundingClientRect()));
        const shown = covers.filter((c) => c.width > 0 && c.height > 0);
        pane.querySelectorAll<HTMLElement>('.leaflet-marker-icon').forEach((icon) => {
          const r = icon.getBoundingClientRect();
          const overlaps = (c: DOMRect) => r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top;
          const tipX = r.left + r.width / 2;
          const tipY = r.bottom;
          const under =
            (shown[0] === covers[0] && tipX >= covers[0].left && tipX <= covers[0].right && tipY >= covers[0].top && tipY <= covers[0].bottom) ||
            shown.slice(shown[0] === covers[0] ? 1 : 0).some(overlaps);
          icon.style.visibility = under ? 'hidden' : '';
          if (under) icon.setAttribute('tabindex', '-1');
          else if (icon.getAttribute('tabindex') === '-1') icon.setAttribute('tabindex', '0');
        });
      });
    };
    update();
    map.on('move zoom resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(panel);
    panel.addEventListener('transitionend', update);
    return () => {
      cancelAnimationFrame(frame);
      map.off('move zoom resize', update);
      ro.disconnect();
      panel.removeEventListener('transitionend', update);
    };
  }, [map, panelRef, overlayRef, markerCount]);
  return null;
}

type ClusterPoint = { id: string; lat: number; lng: number };

/** Enter / Space on a focused map pin (Leaflet gives pins focus but no keyboard activation). */
function isActivationKey(e: L.LeafletKeyboardEvent): boolean {
  const key = e.originalEvent.key;
  if (key !== 'Enter' && key !== ' ') return false;
  e.originalEvent.preventDefault();
  return true;
}

/** Greedy pixel clustering at the current zoom: points closer than `radius` px share a pin. */
function clusterByPixels<T extends ClusterPoint>(map: L.Map, points: T[], zoom: number, radius: number): T[][] {
  const clusters: { center: L.Point; members: T[] }[] = [];
  for (const point of points) {
    const px = map.project([point.lat, point.lng], zoom);
    const hit = clusters.find((c) => c.center.distanceTo(px) < radius);
    if (hit) hit.members.push(point);
    else clusters.push({ center: px, members: [point] });
  }
  return clusters.map((c) => c.members);
}

const clusterIconCache = new Map<number, L.DivIcon>();
function clusterIcon(count: number): L.DivIcon {
  let icon = clusterIconCache.get(count);
  if (!icon) {
    const size = count >= 10 ? 44 : 40;
    icon = L.divIcon({
      className: 'nakamas-cluster',
      html: `<span class="nakamas-cluster-count">${count}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
    clusterIconCache.set(count, icon);
  }
  return icon;
}

/**
 * Pins that would overlap at the current zoom become one numbered pin
 * (tapping it zooms to them), so every target is large and separate.
 */
function ClusteredMarkers<T extends ClusterPoint>({
  points,
  renderSingle,
  label,
  panelRef,
}: {
  points: T[];
  renderSingle: (point: T) => React.ReactNode;
  label: (count: number) => string;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);
  const clusters = useMemo(
    () => (zoom >= map.getMaxZoom() ? points.map((p) => [p]) : clusterByPixels(map, points, zoom, 44)),
    [map, points, zoom],
  );
  const zoomTo = (members: T[]) => {
    const box = map.getContainer().getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    let topLeft = L.point(48, 48);
    let bottomRight = L.point(48, 48);
    if (panel && panel.width >= box.width * 0.9 && panel.top > box.top) bottomRight = L.point(48, box.bottom - panel.top + 24);
    else if (panel && panel.height >= box.height * 0.9 && panel.right > box.left) topLeft = L.point(panel.right - box.left + 24, 48);
    map.fitBounds(L.latLngBounds(members.map((m) => [m.lat, m.lng] as [number, number])), {
      paddingTopLeft: topLeft,
      paddingBottomRight: bottomRight,
      maxZoom: map.getMaxZoom(),
    });
  };
  return (
    <>
      {clusters.map((members) => {
        if (members.length === 1) return renderSingle(members[0]);
        const lat = members.reduce((s, m) => s + m.lat, 0) / members.length;
        const lng = members.reduce((s, m) => s + m.lng, 0) / members.length;
        return (
          <Marker
            key={`cluster-${members.map((m) => m.id).join('-')}`}
            position={[lat, lng]}
            icon={clusterIcon(members.length)}
            alt={label(members.length)}
            title={label(members.length)}
            eventHandlers={{
              click: () => zoomTo(members),
              keydown: (e) => {
                if (isActivationKey(e)) zoomTo(members);
              },
            }}
          />
        );
      })}
    </>
  );
}

/**
 * Centers the map in its visible part: above the phone sheet, or right of the
 * desktop sidebar. It used to center behind the sheet, hiding every marker.
 */
function MapController({ center, panelRef }: { center: { lat: number; lng: number }; panelRef: React.RefObject<HTMLDivElement | null> }) {
  const map = useMap();
  useEffect(() => {
    const zoom = map.getZoom();
    const box = map.getContainer().getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    let offset = L.point(0, 0);
    if (panel && panel.width > 0 && panel.height > 0) {
      const coversBottom = panel.width >= box.width * 0.9 && panel.top > box.top && panel.top < box.bottom;
      const coversLeft = panel.height >= box.height * 0.9 && panel.right > box.left && panel.right < box.right;
      if (coversBottom) offset = L.point(0, (box.bottom - panel.top) / 2);
      else if (coversLeft) offset = L.point(-(panel.right - box.left) / 2, 0);
    }
    const target = map.unproject(map.project([center.lat, center.lng], zoom).add(offset), zoom);
    map.setView(target, zoom, { animate: true });
  }, [center, map, panelRef]);
  return null;
}

const GroupImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  // Remote photo → the app's own cover → a map icon, so a row never shows a blank tile.
  const [failed, setFailed] = useState<string[]>([]);
  // An empty src would make the browser re-request the page itself.
  const current = [src.trim(), DEFAULT_EVENT_COVER].find((u) => u && !failed.includes(u));
  return !current ? (
    <div className={cn("flex items-center justify-center bg-cyan-900/10 text-cyan-500", className)}>
      <MapIcon className="w-8 h-8 opacity-50" />
    </div>
  ) : (
    <img referrerPolicy="no-referrer" src={current} alt={alt} onError={() => setFailed((f) => [...f, current])} className={className} />
  );
};

export default function NearbyGroupsPageContent() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const categoryLabel = useCategoryLabel();
  const p = usePageContrast();
  const { events, isLoading, isError, refetch } = useEventsResource();
  const savedEvents = useStore((state) => state.savedEvents);
  const groups = useStore((state) => state.groups);
  const currentUser = useStore((state) => state.currentUser);
  const [radius, setRadius] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "today" | "friends">("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: ATHENS_CENTER.lat, lng: ATHENS_CENTER.lng });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => window.innerWidth < 1024 ? 320 : 384);
  const [isDragging, setIsDragging] = useState(false);
  const [mapFilter, setMapFilter] = useState<"All" | "Available" | "Full" | "My Events">("All");
  const [mapLayer, setMapLayer] = useState<"standard" | "satellite">("standard");
  const [isMapInView, setIsMapInView] = useState(false);
  const [mapEpoch, setMapEpoch] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsMapInView(true);
      },
      { threshold: 0.1 }
    );
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      let newWidth = e.clientX;
      const minBound = window.innerWidth < 1024 ? 280 : 300;
      if (newWidth < minBound) newWidth = minBound;
      if (newWidth > window.innerWidth - 100) newWidth = window.innerWidth - 100;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "default";
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(loc);
          setUserLocation(loc);
        },
        (error) => console.warn("Geolocation permission denied:", error)
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(loc);
          setUserLocation(loc);
        },
        () => {
          toast.error(t("Δεν ήταν δυνατή η εύρεση της τοποθεσίας σου.", "Couldn't get your location."));
        }
      );
    } else {
      toast.error(t("Η γεωτοποθεσία δεν υποστηρίζεται.", "Geolocation is not supported."));
    }
  };

  const origin = userLocation ?? ATHENS_CENTER;

  const localGroups = useMemo(() => {
    const connections = new Set(currentUser?.connections ?? []);
    return events
      .filter((e) => e.maxParticipants && e.maxParticipants > 0)
      .map((e) => {
        const lat = e.lat ?? ATHENS_CENTER.lat;
        const lng = e.lng ?? ATHENS_CENTER.lng;
        return {
          ...e,
          lat,
          lng,
          distanceKm: haversineKm(origin.lat, origin.lng, lat, lng),
        };
      })
      .filter((e) => e.distanceKm <= radius)
      .filter((e) => {
        if (searchQuery.trim()) {
          return e.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
        }
        return true;
      })
      .filter((e) => {
        if (sidebarFilter === "today") {
          try {
            return isToday(parseISO(e.date));
          } catch {
            return false;
          }
        }
        if (sidebarFilter === "friends") {
          if (connections.has(e.organizerId)) return true;
          return groups.some(
            (g) => g.eventId === e.id && g.members.some((m) => connections.has(m)),
          );
        }
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [events, origin.lat, origin.lng, radius, searchQuery, sidebarFilter, groups, currentUser?.connections]);

  const filteredLocalGroups = localGroups.filter((group) => {
    if (mapFilter === "All") return true;
    const isFull = (group.currentParticipants || 0) >= (group.maxParticipants || 1);
    if (mapFilter === "Full") return isFull;
    if (mapFilter === "Available") return !isFull;
    if (mapFilter === "My Events") return savedEvents.includes(group.id);
    return true;
  });

  const tile =
    mapLayer === "satellite"
      ? {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        }
      : p.isDark
        ? {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          }
        : {
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          };

  return (
    <div
      className={cn("overflow-hidden rounded-none md:rounded-2xl lg:rounded-none z-0", isMapFullscreen ? "fixed !inset-0 !z-fullscreen" : "absolute inset-0 animate-in fade-in duration-500")}
      style={{ "--sidebar-width": isMapFullscreen ? "0px" : `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* Page title for screen readers (the visible title lives in the side panel as h2). */}
      <h1 className="sr-only text-lg md:text-xl">{t("Τοπικές ομάδες", "Local Groups")}</h1>
      {/* Map Area */}
      <div className="absolute inset-0 z-0 bg-[#e5e3df] dark:bg-gray-900 map-container" id="map-container" ref={mapContainerRef}>
        <ErrorBoundary
          key={mapEpoch}
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-[#e5e3df] dark:bg-gray-900 p-5 text-center">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft max-w-sm border border-red-100 dark:border-red-900">
                <ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('Σφάλμα χάρτη', 'Map Error')}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  {t('Πρόβλημα κατά τη φόρτωση του χάρτη.', 'There was a problem loading the map.')}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setMapEpoch((n) => n + 1)}
                >
                  {t('Δοκιμή ξανά', 'Try again')}
                </Button>
              </div>
            </div>
          }
        >
          {isMapInView ? (
            <LeafletMapHost
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={13}
              zoomControl={false}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
            >
              <LeafletMapReady>
                <TileLayer key={tile.url} url={tile.url} attribution={tile.attribution} />
                <MapController center={mapCenter} panelRef={panelRef} />
                <HideMarkersUnderPanel panelRef={panelRef} overlayRef={overlayRef} markerCount={filteredLocalGroups.length + (userLocation ? 1 : 0)} />

                <ClusteredMarkers
                  points={filteredLocalGroups}
                  panelRef={panelRef}
                  label={(n) => t(`${n} ομάδες εδώ: μεγέθυνση`, `${n} groups here: zoom in`)}
                  renderSingle={(group) => (
                  <Marker
                    key={group.id}
                    position={[group.lat, group.lng]}
                    alt={group.title}
                    title={group.title}
                    eventHandlers={{
                      click: () => setSelectedEventId(group.id),
                      mouseover: (e) => e.target.openPopup(),
                      keydown: (e) => {
                        if (!isActivationKey(e)) return;
                        setSelectedEventId(group.id);
                        const marker = e.target as L.Marker;
                        // Keyboard users land on the popup's action, not back on the map.
                        // react-leaflet renders the popup body a moment after it opens: retry briefly.
                        const focusAction = (tries = 30) => {
                          const button = marker.getPopup()?.getElement()?.querySelector<HTMLElement>('button');
                          button?.focus();
                          if (button && document.activeElement === button) return;
                          if (tries > 0) window.requestAnimationFrame(() => focusAction(tries - 1));
                        };
                        if (marker.isPopupOpen()) focusAction();
                        else {
                          marker.once('popupopen', () => focusAction());
                          marker.openPopup();
                        }
                      },
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="font-bold text-2xs tracking-widest text-cyan-600 dark:text-cyan-400 mb-1">
                        {categoryLabel(group.category)}
                      </div>
                      <div
                        className="max-w-[200px] cursor-pointer group rounded-2xl"
                        {...redundantClick<HTMLDivElement>(() => navigate(`/events/${group.id}`))}
                      >
                        <div className="overflow-hidden rounded-2xl mb-2">
                          <GroupImage
                            src={group.imageUrl ?? ""}
                            alt={group.title}
                            className="w-full h-24 object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {group.title}
                        </h3>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 truncate flex items-center">
                          <MapPin className="w-3 h-3 mr-1" /> {formatLocationArea(group.locationArea, language)}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${group.id}`);
                          }}
                          className="w-full bg-cyan-600 text-white text-xs font-bold py-2 rounded-2xl hover:bg-cyan-700 transition-colors shadow-soft"
                        >
                          {t('Δες εκδήλωση', 'View Event')}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                  )}
                />

                {userLocation && (
                  <Marker position={[userLocation.lat, userLocation.lng]}>
                    <Popup>{t("Η τοποθεσία σου", "Your Location")}</Popup>
                  </Marker>
                )}
              </LeafletMapReady>
            </LeafletMapHost>
          ) : (
            <div className="h-full w-full bg-[#e5e3df] dark:bg-gray-900" aria-hidden />
          )}
        </ErrorBoundary>

        {/* Floating Action Button for Map Layer Toggle */}
        <button
          type="button"
          onClick={() => setMapLayer(prev => prev === "standard" ? "satellite" : "standard")}
          className="absolute bottom-6 right-6 md:right-[calc(var(--sidebar-width)+24px)] z-[1000] h-10 w-10 rounded-full shadow-soft bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex items-center justify-center hover:scale-105 transition-transform"
          title={t("Εναλλαγή προβολής δικτύου", "Toggle Layer")}
          aria-label={t("Εναλλαγή προβολής δικτύου", "Toggle Layer")}
        >
          <MapIcon className="h-6 w-6" aria-hidden />
        </button>
      </div>

      {/* Floating HUD */}
      <div ref={overlayRef} className={cn("absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none transition-all duration-300 md:left-[calc(var(--sidebar-width)+16px)]")}>
        <div className="flex gap-2 w-full">
          {!isMapFullscreen && (
            <div className="relative flex-1 max-w-sm pointer-events-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Αναζήτηση ομάδων...', 'Search groups...')}
                className={cn("search-control w-full h-9 pl-9 pr-3 rounded-xl border-0 shadow-soft focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all", p.isDark ? "bg-gray-800/95 backdrop-blur text-white" : "bg-white/95 backdrop-blur text-gray-900")}
              />
            </div>
          )}
          {!isMapFullscreen && (
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={cn("h-10 w-10 rounded-2xl shadow-soft-lg flex items-center justify-center transition-all duration-200 pointer-events-auto shrink-0", filtersOpen ? (p.isDark ? "bg-cyan-900/80 text-cyan-400" : "bg-cyan-600 text-white") : (p.isDark ? "bg-gray-800/95 text-gray-300 hover:text-cyan-400" : "bg-white/95 text-gray-600 hover:text-cyan-600"))}
              aria-label={t('Φίλτρα', 'Filters')}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleLocateMe}
            className={cn("h-10 w-10 rounded-2xl shadow-soft-lg flex items-center justify-center transition-all duration-200 pointer-events-auto shrink-0 ml-auto", p.isDark ? "bg-cyan-900/80 text-cyan-400 hover:bg-cyan-900" : "bg-white/95 text-cyan-600 hover:bg-cyan-50")}
            title={t('Εντοπισμός', 'Locate')}
            aria-label={t('Εντοπισμός', 'Locate')}
          >
            <Crosshair className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setIsMapFullscreen(!isMapFullscreen)}
            className={cn("h-10 w-10 rounded-2xl shadow-soft-lg flex items-center justify-center transition-all duration-200 pointer-events-auto shrink-0", p.isDark ? "bg-gray-800/95 text-white hover:bg-gray-700" : "bg-gray-900 text-white hover:bg-black")}
            title={isMapFullscreen ? t('Έξοδος', 'Exit') : t('Πλήρης οθόνη', 'Fullscreen')}
            aria-label={isMapFullscreen ? t('Έξοδος', 'Exit') : t('Πλήρης οθόνη', 'Fullscreen')}
          >
            {isMapFullscreen ? <Minimize className="h-5 w-5" aria-hidden /> : <Maximize className="h-5 w-5" aria-hidden />}
          </button>
        </div>

        {/* Filters Section Chips */}
        {!isMapFullscreen && filtersOpen && (
           <div className="filters-section pointer-events-auto flex items-center gap-2 mt-2 overflow-x-auto noscrollbar pb-2">
             {(["All", "Available", "Full", "My Events"] as const).map(f => (
               <button 
                 key={f}
                 onClick={() => setMapFilter(f)}
                 className={cn("filter-chip px-4 rounded-full text-xs font-bold whitespace-nowrap shadow-soft transition-all border shrink-0", mapFilter === f ? (p.isDark ? "bg-cyan-600 border-cyan-500 text-white" : "bg-cyan-600 border-cyan-600 text-white") : (p.isDark ? "bg-gray-800/95 border-gray-700 text-gray-300" : "bg-white/95 border-gray-200 text-gray-700 hover:bg-gray-50"))}
               >
                 {t(
                   f === "All" ? "Όλα" : f === "Available" ? "Διαθέσιμα" : f === "Full" ? "Γεμάτα" : "Επιλογές μου", 
                   f
                 )}
               </button>
             ))}
           </div>
        )}
      </div>

      {/* Slide-up Panel / Sidebar */}
      <div
        ref={panelRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:right-auto z-20 flex flex-col rounded-t-3xl md:rounded-none transition-transform duration-300 transform translate-y-0 dynamic-sidebar-width border-r shadow-soft-lg",
          isMapFullscreen ? "translate-y-full md:-translate-x-full" : isPanelExpanded ? "top-0 md:h-full" : "max-h-[60vh] md:max-h-full",
          isDragging ? "transition-none" : "",
          p.isDark ? "bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]" : "bg-white border-transparent md:border-gray-100"
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: `@media (min-width: 768px) { .dynamic-sidebar-width { width: var(--sidebar-width) !important; } } .leaflet-popup-content-wrapper { border-radius: 1rem !important; overflow: hidden; }` }} />
        {/* Resize handle: drag with the mouse, or focus it and use the arrow keys.
            WAI-ARIA window-splitter pattern: a focusable separator is a widget, which the lint rules do not model. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={t("Αλλαγή πλάτους λίστας", "Resize list")}
          aria-valuenow={sidebarWidth}
          aria-valuemin={280}
          aria-valuemax={600}
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          className="absolute top-0 bottom-0 -right-2 w-4 cursor-ew-resize hover:bg-cyan-500/10 focus-visible:bg-cyan-500/20 outline-none transition-all hidden md:block z-fab pointer-events-auto"
          onMouseDown={() => setIsDragging(true)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const step = e.shiftKey ? 64 : 16;
            const minBound = window.innerWidth < 1024 ? 280 : 300;
            const maxBound = Math.min(600, window.innerWidth - 100);
            setSidebarWidth((w) => Math.max(minBound, Math.min(maxBound, w + (e.key === "ArrowRight" ? step : -step))));
          }}
        />

        {/* Mobile handle */}
        <div className="w-full py-4 cursor-pointer flex justify-center items-center md:hidden shrink-0" {...pressable<HTMLDivElement>(() => setIsPanelExpanded(!isPanelExpanded))} aria-expanded={isPanelExpanded} aria-label={isPanelExpanded ? t("Σύμπτυξη λίστας", "Collapse list") : t("Ανάπτυξη λίστας", "Expand list")}>
          <div className={cn("w-11 h-1.5 rounded-full flex items-center justify-center relative transition-colors", p.isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-400")}>
             <span className="absolute -top-3.5"><ChevronUp className={cn("w-4 h-4", p.muted)} /></span>
          </div>
        </div>

        <div className={cn("p-5 md:p-5 border-b shrink-0", p.borderB)}>
          <h2 className={cn(APP_TYPO.pageTitle, p.head)}>{t("Τοπικές ομάδες", "Local Groups")}</h2>
          <p className={cn(APP_TYPO.pageSub, "mt-1.5 flex items-center gap-1.5", p.muted)}>
            <Navigation className="h-3.5 w-3.5" aria-hidden /> {t("Εντός", "Within")} <span className={cn("font-bold", p.iconAccent)}>{radius}km</span>
          </p>
          <div className="mt-4 flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="25"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              aria-label={t("Ακτίνα αναζήτησης (χλμ)", "Search radius (km)")}
              aria-valuetext={`${radius} km`}
              className="flex-1 h-6 -my-1 accent-cyan-500"
            />
          </div>

          <div className="flex gap-2.5 mt-4 overflow-x-auto noscrollbar pb-1">
            <button
              type="button"
              onClick={() => setSidebarFilter("all")}
              className={cn(
                "filter-chip px-4 rounded-full text-xs font-bold whitespace-nowrap shadow-soft transition-all",
                sidebarFilter === "all"
                  ? p.isAB ? "bg-[hsl(220_14%_12%)] text-white" : "bg-cyan-600 text-white shadow-cyan-600/20"
                  : cn("border", p.isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"),
              )}
            >
              {t("Όλα", "All Matches")}
            </button>
            <button
              type="button"
              onClick={() => setSidebarFilter("today")}
              className={cn(
                "filter-chip px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                sidebarFilter === "today"
                  ? p.isAB ? "bg-[hsl(220_14%_12%)] text-white border-transparent" : "bg-cyan-600 text-white border-cyan-600"
                  : p.isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
              )}
            >
              {t("Σήμερα", "Today")}
            </button>
            <button
              type="button"
              onClick={() => setSidebarFilter("friends")}
              className={cn(
                "filter-chip px-4 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                sidebarFilter === "friends"
                  ? p.isAB ? "bg-[hsl(220_14%_12%)] text-white border-transparent" : "bg-cyan-600 text-white border-cyan-600"
                  : p.isDark ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
              )}
            >
              {t("Nakamas", "Nakamas")}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4 text-left">
          <ResourceStateGate
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            loading={
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <EventCardSkeleton key={`nearby-sk-${i}`} />
                ))}
              </div>
            }
            errorTitle={t("Αδυναμία φόρτωσης κοντινών", "Could not load nearby events")}
          >
          {filteredLocalGroups.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title={t("Καμία εκδήλωση στην ακτίνα", "No events in this radius")}
              description={t(
                "Δοκίμασε μεγαλύτερη ακτίνα ή διαφορετικά φίλτρα.",
                "Try a larger radius or different filters.",
              )}
              actionLabel={
                radius < 15
                  ? t("Ορισμός ακτίνας στα 15km", "Set radius to 15km")
                  : radius < 25
                    ? t("Ορισμός ακτίνας στα 25km", "Set radius to 25km")
                    : t("Αναζήτηση εκδηλώσεων", "Browse Events")
              }
              onAction={
                radius < 15
                  ? () => setRadius(15)
                  : radius < 25
                    ? () => setRadius(25)
                    : () => navigate('/')
              }
              secondaryLabel={radius >= 25 ? t('Βρες Nakamas', 'Find Nakamas') : undefined}
              onSecondary={radius >= 25 ? () => navigate('/buddy-seek') : undefined}
            />
          ) : (
            filteredLocalGroups.map((group) => (
            <div
              key={group.id}
              className={cn(`p-4 border rounded-2xl transition-all duration-300 cursor-pointer group flex gap-4 ${selectedEventId === group.id ? (p.isDark ? 'border-cyan-500 bg-cyan-900/10' : 'border-cyan-500 shadow-soft-md bg-cyan-50/30') : p.cardSurface}`, p.borderB, !selectedEventId && p.cardHover)}
              aria-pressed={selectedEventId === group.id}
              {...pressable<HTMLDivElement>(() => {
                setSelectedEventId(group.id);
                setMapCenter({ lat: group.lat, lng: group.lng });
                if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: "smooth" });
              })}
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-soft relative">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                <GroupImage src={group.imageUrl ?? ""} alt={group.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <h3 className={cn("card-heading font-bold leading-tight line-clamp-2 transition-colors", p.head, p.hoverText)}>{group.title}</h3>
                  <p className={cn("card-meta mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5", p.sub)}>
                    <span>{categoryLabel(group.category)}</span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span className="truncate">{formatLocationArea(group.locationArea, language)}</span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span className={cn("inline-flex items-center gap-1 font-semibold", p.isDark ? "text-cyan-400" : "text-cyan-700")}>
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {group.distanceKm.toFixed(1)}km
                    </span>
                  </p>
                </div>
              </div>
            </div>
            ))
          )}

          {filteredLocalGroups.length > 0 && (
          <div className={cn("p-5 text-center border border-dashed rounded-2xl mt-4 relative overflow-hidden shadow-soft", p.isDark ? "bg-black/20 border-gray-800" : "bg-gray-50/50 border-gray-200")}>
            <div className={cn("w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4 border", p.isDark ? "bg-cyan-900/20 text-cyan-400 border-cyan-800/50" : "bg-cyan-100 text-cyan-600 border-cyan-200")}>
              <MapIcon className="h-6 w-6" />
            </div>
            <h3 className={cn("text-sm md:text-base font-bold", p.head)}>{t("Επέκταση ακτίνας", "Expand your radius")}</h3>
            <Button
              onClick={() => setRadius(radius < 15 ? 15 : 25)}
              variant={p.isAB ? "primary" : "outline"}
              size="sm"
              className="font-bold text-xs"
              disabled={radius >= 25}
            >
              {radius < 15
                ? t("Ορισμός ακτίνας στα 15km", "Set radius to 15km")
                : radius < 25
                  ? t("Ορισμός ακτίνας στα 25km", "Set radius to 25km")
                  : t("Μέγιστη ακτίνα", "Max radius")}
            </Button>
          </div>
          )}
          </ResourceStateGate>
        </div>
      </div>
    </div>
  );
}
