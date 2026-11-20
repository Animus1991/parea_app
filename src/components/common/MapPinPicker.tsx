import React from "react";
import { TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { LeafletMapHost, LeafletMapReady } from "./LeafletMapHost";
import { applyBundledLeafletPins } from '../../lib/leafletDefaultIcon';

applyBundledLeafletPins();

interface MapPinPickerProps {
  location: { lat: number; lng: number };
  onChange: (location: { lat: number; lng: number }) => void;
  height?: string;
}

function LocationMarker({ location, onChange }: MapPinPickerProps) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return location.lat !== 0 ? (
    <Marker position={[location.lat, location.lng]} />
  ) : null;
}

export function MapPinPicker({
  location,
  onChange,
  height = "200px",
}: MapPinPickerProps) {
  // Default to Athens if 0,0
  const defaultPosition: [number, number] = [37.9838, 23.7275];
  const centerPosition: [number, number] =
    location.lat === 0 && location.lng === 0
      ? defaultPosition
      : [location.lat, location.lng];

  return (
    <div
      className="rounded-lg overflow-hidden border border-gray-200"
      style={{ height }}
    >
      <LeafletMapHost
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <LeafletMapReady>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker location={location} onChange={onChange} />
        </LeafletMapReady>
      </LeafletMapHost>
    </div>
  );
}
