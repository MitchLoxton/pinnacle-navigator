const CACHE='pn-shell-live-v5345';
const PRIVATE='pn-private-bundle-live-v5345';
const REFRESH='5345';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./v51.css','./v51.js','./fabrication.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>(k.startsWith('pn-shell-')||k.startsWith('pn-private-bundle-'))&&k!==CACHE&&k!==PRIVATE).map(k=>caches.delete(k)));
  await self.clients.claim();
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  await Promise.all(clients.map(async client=>{
    try{const u=new URL(client.url);if(u.searchParams.get('pn-refresh')!==REFRESH){u.searchParams.set('pn-refresh',REFRESH);await client.navigate(u.href);}}catch(e){}
  }));
})());});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;if(url.pathname.includes('/.private-navigator'))return;if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/manifest.webmanifest')||url.pathname.endsWith('/index.html')){event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{if(res&&res.ok&&url.pathname.endsWith('/index.html')){const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}return res;}).catch(()=>caches.match(req)));return;}if(url.pathname.endsWith('/v51.js')||url.pathname.endsWith('/v51.css')||url.pathname.endsWith('/fabrication.js')){event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;}).catch(()=>caches.match(req)));return;}if(req.mode==='navigate'){event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}return res;}).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./'))));return;}event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return res;})));});