import { useEffect, useCallback } from 'react';
import { useGeolocation, haversineDistance } from './useGeolocation';
import { HOME_MOCK_DISTANCES, type HomeRadiusFilter } from '../lib/homeFeedConstants';

export function useHomeGeoDistance(radiusFilter: HomeRadiusFilter) {
  const geo = useGeolocation();

  useEffect(() => {
    if (radiusFilter !== 'Any' && !geo.granted && !geo.loading) {
      geo.request();
    }
  }, [radiusFilter, geo.granted, geo.loading, geo.request]);

  const getDistance = useCallback(
    (eventId: string, eventLat?: number, eventLng?: number): number | null => {
      if (!geo.granted || geo.lat == null || geo.lng == null) return null;
      if (eventLat != null && eventLng != null) {
        return haversineDistance(geo.lat, geo.lng, eventLat, eventLng);
      }
      return HOME_MOCK_DISTANCES[eventId] ?? null;
    },
    [geo.granted, geo.lat, geo.lng],
  );

  return { geo, getDistance };
}
