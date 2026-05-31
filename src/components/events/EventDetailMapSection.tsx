import { useState } from 'react';
import { Maximize, Minimize, AlertTriangle } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useLanguage } from '../../lib/i18n';
import { getGoogleMapsApiKey, isGoogleMapsConfigured } from '../../lib/maps';
import { cn } from '../../lib/utils';
import type { Event } from '../../types';

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
    pulse: 'bg-current/10',
    dot: 'bg-current',
    badge: 'text-gray-500',
  },
  dark: {
    frame: 'border-gray-700',
    toggle: 'bg-gray-800/90 text-white',
    toggleHover: 'hover:opacity-90',
    pulse: 'bg-white/10',
    dot: 'bg-white',
    badge: 'text-gray-300',
  },
};

export interface EventDetailMapSectionProps {
  event: Event;
  accent: EventDetailMapAccent;
  darkSurface?: boolean;
  className?: string;
}

export function EventDetailMapSection({
  event,
  accent,
  darkSurface = false,
  className,
}: EventDetailMapSectionProps) {
  const { t } = useLanguage();
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
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

  const lat = event.lat ?? 37.9838;
  const lng = event.lng ?? 23.7275;

  return (
    <div
      className={cn(
        isMapFullscreen
          ? 'fixed !inset-0 !z-[9999] bg-black !m-0 rounded-none !h-[100dvh]'
          : 'mt-6 w-full h-64 sm:h-80 rounded-lg',
        'bg-gray-100 overflow-hidden relative border transition-all duration-300',
        tok.frame,
        className,
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
                <p className="text-[10px] text-gray-600">
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
              <AdvancedMarker position={{ lat, lng }} zIndex={100}>
                <Pin background={pin.bg} borderColor={pin.border} glyphColor="#fff" />
              </AdvancedMarker>
            </Map>
          </APIProvider>
        </ErrorBoundary>
      ) : (
        <div className="w-full h-full bg-[#e5e3df] relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10h80v80h-80z' stroke='%23000' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px',
            }}
          />
          <div
            className={cn(
              'w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center animate-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
              tok.pulse,
            )}
          >
            <div
              className={cn('w-4 h-4 rounded-full border-2 border-white shadow-md', tok.dot)}
            />
          </div>
          <div
            className={cn(
              'absolute bottom-2 right-2 bg-white/90 backdrop-blur text-[10px] px-2 py-1 rounded-full shadow-sm',
              tok.badge,
            )}
          >
            {t('Ενεργή Προεπισκόπηση Χάρτη', 'Map Preview Active')}
          </div>
        </div>
      )}
    </div>
  );
}
