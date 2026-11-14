// Service worker: keeps the app's files so it opens with no connection (on a
// train, on a plane). Online, files come from the server (so a new build shows
// at once) and the cache is refreshed; offline, or when the server takes more
// than a few seconds, the cached copy is used. The sync API is never cached:
// progress saves locally and syncs when the server is reachable again.

interface FetchEventLike extends Event {
  request: Request;
  respondWith(r: Promise<Response>): void;
  waitUntil(p: Promise<unknown>): void;
}
interface ExtendableEventLike extends Event {
  waitUntil(p: Promise<unknown>): void;
}
const sw = self as unknown as {
  addEventListener(type: 'install' | 'activate', fn: (e: ExtendableEventLike) => void): void;
  addEventListener(type: 'fetch', fn: (e: FetchEventLike) => void): void;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  location: Location;
};

const CACHE = 'app-v4';
const TIMEOUT_MS = 3000;
const SHELL = [
  '/', '/main.js', '/styles.css', '/themes.css', '/dx7-processor.js', '/rack-processor.js',
  '/fonts/inter.woff2', '/fonts/music.woff2', '/fonts/fira-code-400.woff2', '/fonts/fira-code-600.woff2', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png',
];

sw.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== sw.location.origin || url.pathname.startsWith('/api/')) return;
  // the app is one page (routes live in the #hash), so every navigation is the shell
  const key = req.mode === 'navigate' ? '/' : url.pathname;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const fresh = fetch(req).then((res) => {
        if (res.ok) void cache.put(key, res.clone());
        return res;
      });
      e.waitUntil(fresh.catch(() => {}));
      // a slow hotel or train connection shouldn't hold the app hostage: fall back to the cache after a few seconds
      const slow = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS));
      try {
        const res = await Promise.race([fresh, slow]);
        if (res) return res;
      } catch {
        /* offline */
      }
      return (await cache.match(key)) ?? fresh.catch(() => Response.error());
    }),
  );
});
