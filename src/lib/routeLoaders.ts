/**
 * One loader per lazy page. App.tsx builds React.lazy() from these and the
 * prefetcher reuses them, so a prefetched page opens without waiting.
 */
export const routeLoaders = {
  home: () => import('../pages/Home'),
  notFound: () => import('../pages/not-found'),
  eventDetail: () => import('../pages/EventDetail'),
  plans: () => import('../pages/Plans'),
  trustCenter: () => import('../pages/TrustCenter'),
  profile: () => import('../pages/Profile'),
  adminDashboard: () => import('../pages/AdminDashboard'),
  organizerDashboard: () => import('../pages/OrganizerDashboard'),
  joinGroupFlow: () => import('../components/groups/JoinGroupFlow'),
  groupChat: () => import('../pages/GroupChat'),
  organizerProfile: () => import('../pages/OrganizerProfile'),
  notifications: () => import('../pages/Notifications'),
  categories: () => import('../pages/Categories'),
  nearbyGroups: () => import('../pages/NearbyGroups'),
  history: () => import('../pages/History'),
  savedEvents: () => import('../pages/SavedEvents'),
  reportIssue: () => import('../pages/ReportIssue'),
  postEventFeedback: () => import('../pages/PostEventFeedback'),
  login: () => import('../pages/Login'),
  myCalendar: () => import('../pages/MyCalendar'),
  myConnections: () => import('../pages/MyConnections'),
  inbox: () => import('../pages/Inbox'),
  createEventFlow: () => import('../pages/CreateEventFlow'),
  wallet: () => import('../pages/Wallet'),
  verificationCenter: () => import('../pages/VerificationCenter'),
  settingsAndPrivacy: () => import('../pages/SettingsAndPrivacy'),
  helpCenter: () => import('../pages/HelpCenter'),
  achievements: () => import('../pages/Achievements'),
  leaderboard: () => import('../pages/Leaderboard'),
  challenges: () => import('../pages/Challenges'),
  onboarding: () => import('../pages/Onboarding'),
  buddySeek: () => import('../pages/BuddySeek'),
  wall: () => import('../pages/Wall'),
  personProfile: () => import('../pages/PersonProfile'),
  // Φ27 — outings
  ourNight: () => import('../pages/OurNight'),
  collections: () => import('../pages/Collections'),
  tags: () => import('../pages/Tags'),
  invitePublic: () => import('../pages/InvitePublic'),
  organizerEmbed: () => import('../pages/OrganizerEmbed'),
} as const;

export type RouteKey = keyof typeof routeLoaders;

/** Which page a path opens (same matching order as the router). */
const PATH_KEYS: Array<[RegExp, RouteKey]> = [
  [/^\/$/, 'home'],
  [/^\/events\/[^/]+\/join$/, 'joinGroupFlow'],
  [/^\/events\/[^/]+$/, 'eventDetail'],
  [/^\/categories$/, 'categories'],
  [/^\/nearby$/, 'nearbyGroups'],
  [/^\/(agenda|calendar)$/, 'myCalendar'],
  [/^\/plans$/, 'plans'],
  [/^\/buddy-seek$/, 'buddySeek'],
  [/^\/history\/feedback\//, 'postEventFeedback'],
  [/^\/history$/, 'history'],
  [/^\/saved$/, 'savedEvents'],
  [/^\/connections$/, 'myConnections'],
  [/^\/chats$/, 'inbox'],
  [/^\/chat\//, 'groupChat'],
  [/^\/leaderboard$/, 'leaderboard'],
  [/^\/challenges$/, 'challenges'],
  [/^\/achievements$/, 'achievements'],
  [/^\/manage$/, 'organizerDashboard'],
  [/^\/create$/, 'createEventFlow'],
  [/^\/wallet$/, 'wallet'],
  [/^\/verification$/, 'verificationCenter'],
  [/^\/trust$/, 'trustCenter'],
  [/^\/report$/, 'reportIssue'],
  [/^\/profile$/, 'profile'],
  [/^\/notifications$/, 'notifications'],
  [/^\/settings$/, 'settingsAndPrivacy'],
  [/^\/help$/, 'helpCenter'],
  [/^\/organizer\//, 'organizerProfile'],
  [/^\/wall$/, 'wall'],
  [/^\/u\//, 'personProfile'],
  [/^\/night\//, 'ourNight'],
  [/^\/collections(\/|$)/, 'collections'],
  [/^\/tags(\/|$)/, 'tags'],
  [/^\/i\//, 'invitePublic'],
  [/^\/embed\/organizer\//, 'organizerEmbed'],
  [/^\/admin$/, 'adminDashboard'],
  [/^\/onboarding$/, 'onboarding'],
  [/^\/login$/, 'login'],
];

export function routeKeyForPath(path: string): RouteKey | null {
  const clean = path.split(/[?#]/)[0];
  return PATH_KEYS.find(([re]) => re.test(clean))?.[1] ?? null;
}

const started = new Map<RouteKey, Promise<unknown>>();

/** Start downloading a page's code (once). Safe to call on hover, focus or idle. */
export function prefetchPath(path: string): Promise<unknown> {
  const key = routeKeyForPath(path);
  if (!key) return Promise.resolve();
  const existing = started.get(key);
  if (existing) return existing;
  const pending = routeLoaders[key]().catch(() => { started.delete(key); });
  started.set(key, pending);
  return pending;
}

/** Prefetch when the browser is idle; skipped on data-saver and very slow links. */
export function prefetchWhenIdle(paths: string[]): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return () => undefined;
  const queue = [...paths];
  let cancelled = false;
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (delay: number) => {
    if (cancelled || !queue.length) return;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: 4000 });
    } else {
      timer = globalThis.setTimeout(run, delay);
    }
  };
  const run = () => {
    if (cancelled) return;
    void Promise.all(queue.splice(0, 2).map(prefetchPath)).then(() => schedule(250));
  };
  schedule(1500);
  return () => {
    cancelled = true;
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timer !== undefined) globalThis.clearTimeout(timer);
  };
}
