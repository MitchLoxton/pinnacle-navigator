const BUILD = '1.8.1';
const CACHE = 'mitchell-racing-v37-preflight';
const STATIC_SHELL = [
  './styles.css?v=12',
  './simple.css?v=1',
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

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    const existing = clientsList.find(client => client.url.includes('/racing/'));
    if (existing) {
      await existing.focus();
      return;
    }
    if (self.clients.openWindow) await self.clients.openWindow('./');
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const criticalPath = /\/racing\/(?:index\.html|stats\.html|automation\.html|app\.js|preflight-guard\.js|live-tab\.js|execution-truth\.js|result-truth-simple\.js|weekly-history\.js|simple-ui\.js|hong-kong-tab\.js|health-ui\.js|race-day-assist\.js|easy-mode\.js|stats-link\.js|stats-dashboard\.js|automation\.js|state-tracker-status\.js|simple\.css|version\.json|automation-config\.json|current\.json|stats\.json|hong-kong\.json|hong-kong-stats\.json|history\/[^/]+\.json)$/.test(url.pathname);
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
