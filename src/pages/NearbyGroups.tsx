import React, { useState, useEffect } from "react";
import {
  MapPin,
  Search,
  Compass,
  Navigation,
  Crosshair,
  Map as MapIcon,
  SlidersHorizontal,
  AlertTriangle,
  Info,
  Maximize,
  Minimize,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mockEvents } from "../data/mockEvents";
import { Badge } from "../components/common/Badge";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useAdvancedMarkerRef
} from "@vis.gl/react-google-maps";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import { MarkerClusterer, type Marker } from '@googlemaps/markerclusterer';
import { useLanguage } from "../lib/i18n";

const GroupImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
    const { t } = useLanguage();
  const [error, setError] = useState(false);
  return error ? (
    <div className={`flex items-center justify-center bg-cyan-50 text-cyan-300 ${className}`}>
      <MapIcon className="w-8 h-8 opacity-50" />
    </div>
  ) : (
    <img referrerPolicy="no-referrer" src={src} alt={alt} onError={() => setError(true)} className={className} />
  );
};

const getMarkerColor = (category: string) => {
  switch (category) {
    case "Stand-up":
      return "#4f46e5";
    case "Board games":
      return "#059669";
    case "Hiking":
      return "#ea580c";
    case "Nearby escapes":
      return "#0891b2";
    default:
      return "#e11d48";
  }
};

const GroupMarker = ({ group, idx, onClick, setMarkerRef }: { group: any, idx: number, onClick: (id: string) => void, setMarkerRef: (marker: Marker | null, key: string) => void }) => {
    
  const [markerRef, marker] = useAdvancedMarkerRef();
  const handleClick = React.useCallback(() => onClick(group.id), [onClick, group.id]);
  const ref = React.useCallback(
    (m: google.maps.marker.AdvancedMarkerElement | null) => {
      markerRef(m);
      setMarkerRef(m as any, group.id);
    },
    [setMarkerRef, group.id, markerRef]
  );

  return (
    <AdvancedMarker ref={ref} position={{ lat: group.lat, lng: group.lng }} onClick={handleClick}>
      <div className="flex flex-col items-center group cursor-pointer">
        <div className="bg-white text-gray-900 border border-gray-200 text-xs font-bold px-2 py-1 rounded shadow-md mb-1 group-hover:-translate-y-1 transition-transform whitespace-nowrap">
          {group.category} • {(1.2 + idx * 0.8).toFixed(1)}
</div>
</div>
</AdvancedMarker>
  );
}
