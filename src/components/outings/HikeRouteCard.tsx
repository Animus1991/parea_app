import { Mountain, Route as RouteIcon, Timer, TrendingUp, MapPin, Lock } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import type { HikeRoute } from '../../types/outings';

const DIFFICULTY = {
  easy: { el: 'Εύκολη', en: 'Easy' },
  moderate: { el: 'Μέτρια', en: 'Moderate' },
  hard: { el: 'Απαιτητική', en: 'Hard' },
} as const;

/** Elevation profile as a tiny inline chart (no library). */
function ProfileChart({ points, label }: { points: number[]; label: string }) {
  if (points.length < 2) return null;
  const w = 240;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const xy = points.map((p, i) => [(i / (points.length - 1)) * w, h - 4 - ((p - min) / span) * (h - 12)] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full text-accent" role="img" aria-label={label} preserveAspectRatio="none">
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="currentColor" opacity="0.15" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Hiking route (Meetup × komoot, adapted): distance, climb, time and
 * difficulty for everyone; the exact start point only for confirmed members.
 */
export function HikeRouteCard({ route, revealStart, className }: { route: HikeRoute; revealStart: boolean; className?: string }) {
  const { t } = useLanguage();
  const d = DIFFICULTY[route.difficulty];
  const stats = [
    { icon: RouteIcon, label: t('Απόσταση', 'Distance'), value: `${route.distanceKm.toLocaleString('el-GR')} km` },
    { icon: TrendingUp, label: t('Ανάβαση', 'Climb'), value: `${route.elevationGainM} m` },
    { icon: Timer, label: t('Διάρκεια', 'Time'), value: `~${route.durationH.toLocaleString('el-GR')} ${t('ώρ.', 'h')}` },
    { icon: Mountain, label: t('Δυσκολία', 'Difficulty'), value: t(d.el, d.en) },
  ];
  const peak = route.profileM?.length ? Math.max(...route.profileM) : null;
  return (
    <section className={cn('rounded-2xl border border-border bg-surface-raised p-4', className)} aria-labelledby="hike-route-title">
      <h3 id="hike-route-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <Mountain className="h-4 w-4" aria-hidden /> {t('Η διαδρομή', 'The route')}
      </h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface px-3 py-2">
            <dt className="flex items-center gap-1 text-2xs font-bold text-ink-muted">
              <Icon className="h-3 w-3" aria-hidden /> {label}
            </dt>
            <dd className="text-sm font-black text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {route.profileM && (
        <div className="mt-3">
          <ProfileChart
            points={route.profileM}
            label={t(`Υψομετρικό προφίλ, κορυφή ${peak} μ.`, `Elevation profile, highest point ${peak} m`)}
          />
          <p className="text-2xs font-medium text-ink-muted">
            {t(`Υψομετρικό · ψηλότερο σημείο ${peak} μ.`, `Elevation · highest point ${peak} m`)}
          </p>
        </div>
      )}
      <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-ink">
        {revealStart ? <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
        <span>
          {revealStart ? (
            <>
              <span className="font-bold">{t('Σημείο εκκίνησης: ', 'Start point: ')}</span>
              {route.startPoint}
            </>
          ) : (
            <>
              <span className="font-bold">{route.startArea}</span>
              {t(' — το ακριβές σημείο εκκίνησης φαίνεται όταν επιβεβαιωθεί η ομάδα σου.', ' — the exact start point shows once your group is confirmed.')}
            </>
          )}
        </span>
      </p>
      <p className="mt-2 text-2xs font-medium text-ink-muted">
        {t('Πάρε νερό, καπέλο και κλειστά παπούτσια. Ο/η οικοδεσπότης κρατά τον ρυθμό του πιο αργού.', 'Bring water, a hat and closed shoes. The host keeps the pace of the slowest person.')}
      </p>
    </section>
  );
}
