import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Navigation, Crosshair, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { mockEvents } from "../data/mockEvents";
import { Badge } from "../components/common/Badge";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { useLanguage } from "../lib/i18n";

export default function NearbyGroups() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [radius, setRadius] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const mockDistances: Record<string, number> = { 'e1': 1.2, 'e2': 18.0, 'e3': 2.8, 'e4': 3.6, 'e5': 150.0, 'e6': 0.5 };

  const mockCoords: Record<string, { lat: number; lng: number }> = {
    'e1': { lat: 37.9755, lng: 23.7348 },
    'e2': { lat: 37.9838, lng: 23.7275 },
    'e3': { lat: 37.9685, lng: 23.7295 },
    'e4': { lat: 37.9720, lng: 23.7420 },
    'e5': { lat: 38.0456, lng: 23.8000 },
    'e6': { lat: 37.9770, lng: 23.7260 },
  };

  const [userPos, setUserPos] = useState<{ lat: number; lng: number }>({ lat: 37.9755, lng: 23.7348 });
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocationStatus('granted'); setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        () => setLocationStatus('denied')
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setLocationStatus('loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocationStatus('granted'); setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        () => setLocationStatus('denied')
      );
    }
  };

  const nearbyEvents = mockEvents.filter(e => {
    const dist = mockDistances[e.id] || 5;
    if (dist > radius) return false;
    if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
    return true;
  });

  const categories = ['All', ...Array.from(new Set(mockEvents.map(e => e.category)))];

  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'Stand-up': return 'bg-yellow-500';
      case 'Board games': return 'bg-green-500';
      case 'Hiking': return 'bg-orange-500';
      case 'Nearby escapes': return 'bg-sky-500';
      default: return 'bg-cyan-600';
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-5 pb-20 md:pb-0">
      <div>
        <h1 className="text-[22.33807213275px] md:text-[26.7902365993px] font-bold text-[#111827]">{t(`Κοντά μου`, `Nearby`)}</h1>
        <p className="text-gray-500 font-medium text-[13.551608211075px] mt-0.5 flex items-center gap-1">
          <Navigation className="h-3 w-3" />
          {t(`Εκδηλώσεις εντός`, `Showing within`)} {radius}km
          {locationStatus === 'granted' && <span className="text-green-600"> • {t(`Τοποθεσία ενεργή`, `Location active`)}</span>}
        </p>
      </div>

      {/* Map */}
      <div className="rounded-2xl h-52 md:h-72 relative overflow-hidden border border-gray-200">
        {mapsApiKey ? (
          <APIProvider apiKey={mapsApiKey}>
            <Map
              defaultCenter={userPos}
              defaultZoom={13}
              gestureHandling="greedy"
              disableDefaultUI={true}
              mapId="nearby-groups-map"
              className="w-full h-full"
            >
              {/* User location marker */}
              <AdvancedMarker position={userPos}>
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-ping absolute -inset-2" />
                  <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md relative z-10" />
                </div>
              </AdvancedMarker>

              {/* Event markers */}
              {nearbyEvents.map(e => {
                const coord = mockCoords[e.id];
                if (!coord) return null;
                return (
                  <AdvancedMarker
                    key={e.id}
                    position={coord}
                    onClick={() => setSelectedId(selectedId === e.id ? null : e.id)}
                  >
                    <div className="relative">
                      {selectedId === e.id && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 w-44 z-20">
                          <h4 className="font-bold text-[12.42px] text-[#111827] line-clamp-1">{e.title}</h4>
                          <p className="text-[11.2px] text-gray-500 mt-0.5">{e.locationArea}</p>
                          <button className="w-full mt-1.5 bg-[#111827] text-white text-[11.2px] font-bold uppercase py-1 rounded-md" onClick={() => navigate(`/events/${e.id}`)}>
                            {t(`Προβολή`, `View`)}
                          </button>
                        </div>
                      )}
                      <div className={`w-6 h-6 ${getMarkerColor(e.category)} rounded-full border-2 border-white shadow-md flex items-center justify-center`}>
                        <MapPin className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </AdvancedMarker>
                );
              })}
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full bg-[#e8e5df] flex items-center justify-center">
            <p className="text-[13.5px] text-gray-500 font-medium">{t(`Χάρτης μη διαθέσιμος`, `Map unavailable`)}</p>
          </div>
        )}

        {/* Controls overlay */}
        <button onClick={handleLocateMe} className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white transition-colors z-10">
          <Crosshair className="w-4 h-4 text-gray-700" />
        </button>
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-[11.2px] text-gray-500 px-2 py-1 rounded shadow-sm z-10 font-medium">
          {t(`Αθήνα, Ελλάδα`, `Athens, Greece`)}
        </div>
      </div>

      {/* Radius slider */}
      <div className="flex items-center gap-3">
        <span className="text-[12.5px] font-bold text-gray-500 uppercase">{t(`Ακτίνα`, `Radius`)}:</span>
        <input
          type="range"
          min="1"
          max="25"
          value={radius}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="flex-1 accent-cyan-600 h-1.5"
        />
        <span className="text-[12.42px] font-bold text-cyan-600 w-8">{radius}km</span>
      </div>

      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-full text-[12.5px] font-bold whitespace-nowrap border transition-colors ${categoryFilter === cat ? 'bg-[#111827] text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {cat === 'All' ? t(`Όλα`, `All`) : cat}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-2.5">
        <h2 className="text-[12.5px] font-bold text-gray-400 uppercase tracking-widest">{nearbyEvents.length} {t(`αποτελέσματα`, `results`)}</h2>
        {nearbyEvents.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[12.42px] text-gray-500 font-medium">{t(`Δεν βρέθηκαν εκδηλώσεις. Αυξήστε την ακτίνα.`, `No events found. Increase radius.`)}</p>
          </div>
        ) : (
          nearbyEvents.map(event => (
            <Card
              key={event.id}
              className={`p-3 hover:border-cyan-200 transition-all cursor-pointer ${selectedId === event.id ? 'border-cyan-500 ring-1 ring-cyan-500 shadow-md' : ''}`}
              onClick={() => { setSelectedId(event.id); navigate(`/events/${event.id}`); }}
            >
              <div className="flex gap-3">
                <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[13.5px] text-[#111827] truncate">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="neutral" className="text-[11.2px]">{event.category}</Badge>
                    <span className="text-[11.2px] text-gray-400 font-medium flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" /> {(mockDistances[event.id] || 5).toFixed(1)} km
                    </span>
                    <span className="text-[11.2px] text-gray-400 font-medium flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" /> {(event.maxParticipants || 20) - 8} {t(`θέσεις`, `spots`)}
                    </span>
                  </div>
                  <p className="text-[11.2px] text-gray-500 font-medium mt-0.5 truncate">{event.locationArea}</p>
                  {parseInt(event.id) % 3 === 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5" />{t(`Σχηματίζεται τώρα`, `Forming now`)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
