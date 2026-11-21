import { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSun, Moon, Snowflake, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

interface WeatherReading {
  tempC: number;
  code: number;
  isDay: boolean;
  fetchedAt: number;
  live: boolean;
}

const CACHE_KEY = 'nakamas.weather.v1';
const CACHE_TTL_MS = 20 * 60 * 1000;
const ATHENS_LAT = 37.9838;
const ATHENS_LNG = 23.7275;

function fallbackReading(): WeatherReading {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 20;
  const tempC = isDay ? (hour >= 11 && hour <= 17 ? 21 : 18) : 15;
  return { tempC, code: 0, isDay, fetchedAt: 0, live: false };
}

function readCached(): WeatherReading | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherReading;
    if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS && typeof parsed.tempC === 'number') {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function describeWeather(code: number, isDay: boolean) {
  if (code === 0) return { Icon: isDay ? Sun : Moon, el: 'Αίθριος', en: 'Clear' };
  if (code <= 3) return { Icon: isDay ? CloudSun : Cloud, el: 'Αραιή συννεφιά', en: 'Partly cloudy' };
  if (code <= 48) return { Icon: Cloud, el: 'Νεφελώδης', en: 'Cloudy' };
  if (code <= 57) return { Icon: CloudDrizzle, el: 'Ψιλόβροχο', en: 'Drizzle' };
  if (code <= 67 || (code >= 80 && code <= 82)) return { Icon: CloudRain, el: 'Βροχή', en: 'Rain' };
  if (code <= 77) return { Icon: Snowflake, el: 'Χιόνι', en: 'Snow' };
  if (code >= 95) return { Icon: CloudLightning, el: 'Καταιγίδα', en: 'Thunderstorm' };
  return { Icon: isDay ? CloudSun : Cloud, el: 'Ήπιος καιρός', en: 'Mild' };
}

/**
 * Compact circular live weather widget for the Home hero — matches the exact
 * dimensions of the previous score circle (44–48px) with zero clutter.
 */
export function HomeWeatherBadge({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherReading>(() => readCached() ?? fallbackReading());

  useEffect(() => {
    const cached = readCached();
    if (cached) {
      setWeather(cached);
      return;
    }
    const ctrl = new AbortController();
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ATHENS_LAT}&longitude=${ATHENS_LNG}&current=temperature_2m,weather_code,is_day&timezone=auto`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { current?: { temperature_2m?: number; weather_code?: number; is_day?: number } } | null) => {
        const cur = data?.current;
        if (!cur || typeof cur.temperature_2m !== 'number') return;
        const next: WeatherReading = {
          tempC: Math.round(cur.temperature_2m),
          code: typeof cur.weather_code === 'number' ? cur.weather_code : 0,
          isDay: cur.is_day !== 0,
          fetchedAt: Date.now(),
          live: true,
        };
        setWeather(next);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* keep clean fallback */
      });
    return () => ctrl.abort();
  }, []);

  const { Icon, el, en } = describeWeather(weather.code, weather.isDay);
  const label = `${t('Αθήνα', 'Athens')} · ${weather.tempC}°C · ${t(el, en)}`;

  return (
    <button
      type="button"
      onClick={() => toast.info(label)}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-full border border-white/25 bg-white/15 backdrop-blur-sm text-white flex flex-col items-center justify-center shadow-round shrink-0 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
        size === 'sm' ? 'w-11 h-11' : 'w-12 h-12',
        className,
      )}
    >
      <Icon
        className={cn(
          size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
          weather.isDay && weather.code <= 3 ? 'text-amber-300' : 'text-cyan-200',
        )}
        aria-hidden
      />
      <span className="text-2xs font-extrabold tabular-nums leading-none mt-0.5">
        {weather.tempC}°
      </span>
    </button>
  );
}
