import { useState, useCallback, useEffect } from 'react';
import { Maximize, Minimize, AlertTriangle, MapPin } from 'lucide-react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useLanguage } from '../../lib/i18n';
import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '../../lib/maps';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';
import { useStore } from '../../store';

export type EventDetailMapAccent = 'classic' | 'vibrant' | 'neon' | 'bento';

const PIN: Record<EventDetailMapAccent, { bg: string; border: string }> = {
  classic: { bg: '#0E8B8D', border: '#0b6d6f' },
  vibrant: { bg: '#c026d3', border: '#86198f' },
  neon: { bg: '#059669', border: '#047857' },
  bento: { bg: '#4f46e5', border: '#312e81' },
};

const TOKENS = {
  light: {
    frame: 'border-gray-200',
    toggle: 'bg-white/90 text-gray-700',
    toggleHover: 'hover:text-current',
    pulse: 'bg-cyan-100',
    badge: 'text-gray-500',
    focusRing: 'ring-cyan-500/50',
    popup: 'bg-white text-gray-900',
  },
  dark: {
    frame: 'border-gray-700',
    toggle: 'bg-gray-800/90 text-white',
    toggleHover: 'hover:opacity-90',
    pulse: 'bg-white/10',
    badge: 'text-gray-300',
    focusRing: 'ring-cyan-400/40',
    popup: 'bg-gray-900 text-white',
  },
};

const FOCUS_ZOOM = 16;

export interface EventMapProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

function InteractiveEventMarker({
  lat,
  lng,
  pin,
  title,
  locationLine,
  meetingPoint,
  onCentered,
}: {
  lat: number;
  lng: number;
  pin: { bg: string; border: string };
  title: string;
  locationLine: string;
  meetingPoint?: string;
  onCentered: () => void;
}) {
  const map = useMap();
  const { t } = useLanguage();
  const [infoOpen, setInfoOpen] = useState(false);

  const centerOnEvent = useCallback(() => {
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(FOCUS_ZOOM);
    setInfoOpen(true);
    onCentered();
  }, [map, lat, lng, onCentered]);

  return (
    <>
      <AdvancedMarker position={{ lat, lng }} zIndex={100} onClick={centerOnEvent}>
        <Pin background={pin.bg} borderColor={pin.border} glyphColor="#fff" />
      </AdvancedMarker>
      {infoOpen && (
        <InfoWindow position={{ lat, lng }} onCloseClick={() => setInfoOpen(false)}>
          <div className="max-w-[220px] p-1">
            <p className="text-sm font-bold text-gray-900 leading-tight">{title}</p>
            {locationLine && (
              <p className="text-xs text-gray-600 mt-1 font-medium">{locationLine}</p>
            )}
            {meetingPoint && (
              <p className="text-xs text-cyan-800 mt-1 font-bold">
                {t('Σημείο συνάντησης', 'Meeting point')}: {meetingPoint}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function EventMap({ event, accent, darkSurface = false, className }: EventMapProps) {
  const { t } = useLanguage();
  const groups = useStore((s) => s.groups);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [markerFocused, setMarkerFocused] = useState(false);
  const apiKey = getGoogleMapsApiKey();
  const mapsReady = isGoogleMapsConfigured();
  const pin = PIN[accent];
  const tok = darkSurface ? TOKENS.dark : TOKENS.light;
  const accentText =
    accent === 'classic'
      ? 'text-cyan-600'
      : accent === 'vibrant'
        ? 'text-fuchsia-600'
        : accent === 'neon'
          ? 'text-emerald-600'
          : 'text-indigo-600';

  const hasCoords =
    typeof event.lat === 'number' &&
    !Number.isNaN(event.lat) &&
    typeof event.lng === 'number' &&
    !Number.isNaN(event.lng);

  const lat = hasCoords ? event.lat! : 37.9838;
  const lng = hasCoords ? event.lng! : 23.7275;
  const meetingPoint = groups.find((g) => g.eventId === event.id && g.meetingPoint)?.meetingPoint;
  const locationLine =
    event.exactLocation || event.locationArea || meetingPoint || '';

  useEffect(() => {
    if (!markerFocused) return;
    const id = window.setTimeout(() => setMarkerFocused(false), 2400);
    return () => window.clearTimeout(id);
  }, [markerFocused]);

  if (!hasCoords) {
    return (
      <div className={cn('mt-6 space-y-2', className)}>
        <p className={cn('text-xs font-bold tracking-wide', tok.badge)}>
          {t('Τοποθεσία', 'Location')}
        </p>
        <div
          className={cn(
            'w-full rounded-2xl border p-6 text-center shadow-soft',
            tok.frame,
            darkSurface ? 'bg-gray-800/50' : 'bg-gray-50',
          )}
        >
          <MapPin className={cn('w-8 h-8 mx-auto mb-2 opacity-50', accentText)} />
          <p className={cn('text-sm font-bold', darkSurface ? 'text-white' : 'text-gray-800')}>
            {event.exactLocation || event.locationArea
              ? t('Ο χάρτης δεν είναι διαθέσιμος για αυτή την εκδήλωση', 'Map unavailable for this event')
              : t(
                  'Η τοποθεσία θα είναι διαθέσιμη μετά την επιβεβαίωση',
                  'Location will be available after confirmation',
                )}
          </p>
          {event.locationArea && (
            <p className={cn('text-sm font-medium mt-2', tok.badge)}>{event.locationArea}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mt-6 space-y-2', className)}>
      <p className={cn('text-xs font-bold tracking-wide', tok.badge)}>
        {t('Τοποθεσία', 'Location')} — {t('Πατήστε τον δείκτη για εστίαση', 'Tap marker to focus')}
      </p>
      <div
        className={cn(
          isMapFullscreen
            ? 'fixed !inset-0 !z-[9999] bg-black !m-0 rounded-none !h-[100dvh]'
            : 'w-full h-64 sm:h-80 rounded-2xl',
          'bg-gray-100 overflow-hidden relative border transition-all duration-300 shadow-soft',
          tok.frame,
          markerFocused && `ring-2 ${tok.focusRing}`,
        )}
      >
        <button
          type="button"
          onClick={() => setIsMapFullscreen((v) => !v)}
          className={cn(
            'absolute top-4 right-4 z-10 p-2 backdrop-blur rounded-2xl shadow-sm transition-colors min-h-11 min-w-11 flex items-center justify-center',
            tok.toggle,
            accentText,
            tok.toggleHover,
          )}
          aria-label={
            isMapFullscreen
              ? t('Έξοδος πλήρους οθόνης', 'Exit fullscreen')
              : t('Πλήρης οθόνη χάρτη', 'Fullscreen map')
          }
        >
          {isMapFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>

        {mapsReady && apiKey ? (
          <ErrorBoundary
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-[#e5e3df] p-4 text-center">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">
                    {t(
                      'Ο χάρτης δεν είναι διαθέσιμος. Παρακαλώ ελέγξτε το API key.',
                      'Map unavailable. Please check API key.',
                    )}
                  </p>
                </div>
              </div>
            }
          >
            <APIProvider apiKey={apiKey} version="weekly">
              <Map
                defaultCenter={{ lat, lng }}
                defaultZoom={15}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%' }}
                disableDefaultUI
              >
                <InteractiveEventMarker
                  lat={lat}
                  lng={lng}
                  pin={pin}
                  title={event.title}
                  locationLine={locationLine}
                  meetingPoint={meetingPoint}
                  onCentered={() => setMarkerFocused(true)}
                />
              </Map>
            </APIProvider>
          </ErrorBoundary>
        ) : (
          <div className="w-full h-full bg-[#e5e3df] relative flex flex-col items-center justify-center overflow-hidden p-4">
            <button
              type="button"
              onClick={() => setMarkerFocused(true)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl p-4 transition-all min-h-11',
                tok.pulse,
                markerFocused && 'ring-4 ring-cyan-500/40 scale-105',
              )}
            >
              <MapPin className={cn('w-8 h-8', accentText)} />
              <p className={cn('text-sm font-bold text-center', tok.badge)}>{event.title}</p>
              {locationLine && (
                <p className={cn('text-xs font-medium text-center max-w-xs', tok.badge)}>
                  {locationLine}
                </p>
              )}
              {meetingPoint && (
                <p className="text-xs font-bold text-cyan-800 text-center">
                  {t('Σημείο συνάντησης', 'Meeting point')}: {meetingPoint}
                </p>
              )}
            </button>
            <p className={cn('text-xs mt-3 font-medium', tok.badge)}>
              {t('Προεπισκόπηση χάρτη (χωρίς API key)', 'Map preview (no API key)')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use EventMap — kept for existing imports */
export const EventDetailMapSection = EventMap;
