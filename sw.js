const SHELL='pn-shell-stable-v5355';
const REMOTE='pn-remote-modules-stable-v5354';
const PRIVATE='pn-private-bundle-stable-v1';
const PRIVATE_URL=new URL('./.private-navigator-stable',self.registration.scope).href;
const BUNDLE_ENDPOINT='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-bundle-v52?shell=5354';
const SUPABASE_ORIGIN='https://dkmacktcfhubsumwrydw.supabase.co';
const LOCAL=['./','./index.html','./manifest.webmanifest','./icon.svg','./v51.css','./v51.js','./fabrication.js','./stability.js','./miter-48-template.html'];
const REMOTE_SLUGS=['navigator-v536-mobile-stable','navigator-v5335-today','navigator-v5338-colin-method','navigator-v5345-work-register','navigator-v5349-anyone-done'];
const REMOTE_URLS=REMOTE_SLUGS.map(s=>SUPABASE_ORIGIN+'/functions/v1/'+s+'?b=5354');
const SCOPE_PATH=new URL(self.registration.scope).pathname.replace(/\/?$/,'/');

function canonicalLocal(url){return new Request(new URL(url.pathname,self.location.origin).href);}
function isNavigatorShellPath(pathname){return pathname===SCOPE_PATH||pathname===SCOPE_PATH+'index.html';}
async function updateLocal(req){try{const res=await fetch(req,{cache:'no-store'});if(res&&res.ok){const c=await caches.open(SHELL);await c.put(canonicalLocal(new URL(req.url)),res.clone());}return res;}catch(e){return null;}}
async function localCachedFirst(req){const c=await caches.open(SHELL),key=canonicalLocal(new URL(req.url)),cached=await c.match(key);const fresh=updateLocal(req);return cached||(await fresh)||Response.error();}
async function remoteCachedFirst(req){const c=await caches.open(REMOTE),cached=await c.match(req,{ignoreSearch:true});const refresh=fetch(req,{cache:'no-store'}).then(async res=>{if(res&&res.ok)await c.put(req,res.clone());return res;}).catch(()=>null);return cached||(await refresh)||Response.error();}
async function refreshPrivateBundle(pin){
  if(!/^\d{6}$/.test(String(pin||'')))return false;
  try{
    const res=await fetch(BUNDLE_ENDPOINT,{method:'POST',headers:{'content-type':'application/json','x-navigator-shell':'sw-5354'},body:JSON.stringify({projectId:'mundi-pos1',pin:String(pin)}),cache:'no-store'});
    if(!res.ok||(res.headers.get('x-navigator-integrity')||'')!=='ok')return false;
    const html=await res.text();if(!html.includes('Pinnacle Navigator')||!html.includes('</body>'))return false;
    const c=await caches.open(PRIVATE);await c.put(PRIVATE_URL,new Response(html,{headers:{'content-type':'text/html;charset=utf-8','x-pn-version':res.headers.get('x-navigator-version')||'v53.50','x-pn-cached-at':new Date().toISOString()}}));return true;
  }catch(e){return false;}
}

self.addEventListener('message',event=>{
  const d=event.data||{};
  if(d==='SKIP_WAITING'||d.type==='SKIP_WAITING'){self.skipWaiting();return;}
  if(d.type==='REFRESH_BUNDLE')event.waitUntil(refreshPrivateBundle(d.pin));
});

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const shell=await caches.open(SHELL);await shell.addAll(LOCAL);
    const remote=await caches.open(REMOTE);
    await Promise.allSettled(REMOTE_URLS.map(async u=>{try{const r=await fetch(u,{cache:'no-store'});if(r.ok)await remote.put(u,r.clone());}catch(e){}}));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(n=>n.startsWith('pn-shell-stable-')&&n!==SHELL).map(n=>caches.delete(n)));
  await self.clients.claim();
})());});

self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.href===PRIVATE_URL||url.pathname.includes('/.private-navigator'))return;
  if(url.origin===SUPABASE_ORIGIN&&REMOTE_SLUGS.some(s=>url.pathname.endsWith('/'+s))){event.respondWith(remoteCachedFirst(req));return;}
  if(url.origin!==self.location.origin)return;

  // IMPORTANT: Pinnacle Navigator owns only its root document. Nested apps such as
  // /ytintel/, /racing/ and /goal-os/ must be allowed to load their own HTML.
  if(req.mode==='navigate'){
    if(!isNavigatorShellPath(url.pathname))return;
    event.respondWith(localCachedFirst(new Request(new URL('./index.html',self.registration.scope).href,{headers:req.headers})));
    return;
  }
  if(isNavigatorShellPath(url.pathname)){
    event.respondWith(localCachedFirst(new Request(new URL('./index.html',self.registration.scope).href,{headers:req.headers})));
    return;
  }
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.open(SHELL).then(c=>c.match(canonicalLocal(url)))));return;}
  if(LOCAL.some(p=>p!=='./'&&url.pathname===SCOPE_PATH+p.replace('./',''))){event.respondWith(localCachedFirst(req));return;}
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(cached=>cached||fetch(req)));
});
