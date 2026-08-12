const CACHE='pn-shell-v51';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./v51.css','./v51.js'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  // Only retire old PUBLIC shell caches here. Private authenticated bundles are
  // removed transactionally by the launcher *after* a replacement is verified.
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pn-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  // Authenticated Navigator bundles are private launcher-cache entries, never public routes.
  if(url.pathname.includes('/.private-navigator-v')) return;
  // Always ask the network for the version marker so an already-open app can notice a newer build.
  if(url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(req,{cache:'no-store'}));
    return;
  }
  // v51 support code is network-first so a same-version hotfix is not trapped behind an old cache.
  if(url.pathname.endsWith('/v51.js')||url.pathname.endsWith('/v51.css')){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;}).catch(()=>caches.match(req)));
    return;
  }
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return res;}).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res;})));
});
