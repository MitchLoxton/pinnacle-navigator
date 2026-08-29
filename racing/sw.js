const CACHE = 'mitchell-racing-v14-live-tab';
const SHELL = ['./', './index.html', './styles.css?v=12', './app.js?v=13', './live-tab.js?v=1', './manifest.webmanifest', './icon.svg', './apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isData = url.pathname.endsWith('/racing/current.json') || url.pathname.endsWith('/racing/stats.json');
  if (isData) {
    const canonical = new Request(url.origin + url.pathname, { method: 'GET', credentials: event.request.credentials });
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) caches.open(CACHE).then(cache => cache.put(canonical, response.clone()));
          return response;
        })
        .catch(() => caches.match(canonical))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
        return response;
      })
      .catch(() => caches.match(event.request).then(match => match || caches.match('./index.html')))
  );
});
