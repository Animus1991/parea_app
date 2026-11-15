/*
 * Nakamas service worker: the installed app opens instantly and keeps
 * working without a connection.
 *
 * - Page loads (navigations): network first, so content is always fresh;
 *   the cached app shell answers only when the network fails.
 * - Hashed build files (/assets/*): cache first. They never change, and the
 *   list from /sw-assets.json is cached on install for full offline use.
 * - Everything else (API, sockets, other origins, non-GET): not touched.
 *
 * Old build files are deleted when a new version installs.
 */
// Replaced at build time (vite.config.ts) so every deploy installs a fresh worker,
// which caches the new files and deletes the old ones.
const BUILD_ID = '__BUILD_ID__';
const SHELL_CACHE = 'nakamas-shell-v1';
const ASSET_CACHE = 'nakamas-assets-v1';
const SHELL_URLS = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

async function precache() {
  const shell = await caches.open(SHELL_CACHE);
  await shell.addAll(SHELL_URLS);
  // Respect data saver and very slow links: then files are cached only as they are used.
  const connection = self.navigator && self.navigator.connection;
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return;
  try {
    const res = await fetch('/sw-assets.json', { cache: 'no-store' });
    if (!res.ok) return;
    const list = await res.json();
    if (!Array.isArray(list)) return;
    const assets = await caches.open(ASSET_CACHE);
    const wanted = new Set(list.map((p) => new URL(p, self.location.origin).href));
    // Drop files from previous builds, then fetch what is missing.
    for (const req of await assets.keys()) {
      if (!wanted.has(req.url)) await assets.delete(req);
    }
    const have = new Set((await assets.keys()).map((r) => r.url));
    await Promise.all(
      [...wanted].filter((u) => !have.has(u)).map((u) => assets.add(u).catch(() => undefined)),
    );
  } catch {
    /* Precaching is best effort: files are also cached as they are used. */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('nakamas-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/', { ignoreVary: true }).then((hit) => hit || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      // Match on the URL alone: module scripts carry an Origin header and the
      // server may answer with Vary, which would otherwise miss the cached copy.
      caches.match(req.url, { ignoreVary: true }).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
