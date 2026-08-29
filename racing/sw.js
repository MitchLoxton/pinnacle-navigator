const BUILD = '1.6.2';
const CACHE = 'mitchell-racing-v19-exec-price-guard';
const STATIC_SHELL = [
  './styles.css?v=12',
  './manifest.webmanifest',
  './icon.svg',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windows.forEach(client => client.postMessage({ type: 'MITCHELL_APP_UPDATE', build: BUILD }));
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const criticalPath = /\/racing\/(?:index\.html|app\.js|live-tab\.js|execution-guard\.js|version\.json|current\.json|stats\.json)$/.test(url.pathname);
  const critical = event.request.mode === 'navigate' || criticalPath;

  if (critical) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        if (event.request.mode === 'navigate') {
          return new Response(
            '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#07111f;color:#fff;font-family:system-ui;padding:28px"><h1>MITCHELL Racing</h1><h2 style="color:#ff8c9b">OFFLINE - DO NOT BET</h2><p>The current race-day decision cannot be verified. Reconnect to the internet and reopen the app.</p></body>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
          );
        }
        return new Response('', { status: 503, statusText: 'Live race-day file unavailable' });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
