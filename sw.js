const BUILD='5376';
const VERSION='v53.69';
const SHELL='pn-shell-stable-v5376';
const LOCAL=['./','./index.html','./open.html','./manifest.webmanifest','./icon.svg','./v51.css','./v51.js','./fabrication.js','./stability-core.js','./runtime-late.js','./workshop-ui-fast.js','./navigator-nova.css','./morning-pack.js','./miter-48-template.html','./repair.html'];
const SCOPE_PATH=new URL(self.registration.scope).pathname.replace(/\/?$/,'/');
function canonical(url){return new Request(new URL(url.pathname,self.location.origin).href);}
function isShell(path){return path===SCOPE_PATH||path===SCOPE_PATH+'index.html'||path===SCOPE_PATH+'open.html';}
function shellKey(req){const u=new URL(req.url);return u.pathname===SCOPE_PATH?canonical(new URL('./index.html',self.registration.scope)):canonical(u);}
async function seed(cache,path){try{const u=new URL(path,self.registration.scope),r=await fetch(u,{cache:'no-store'});if(r&&r.ok)await cache.put(canonical(u),r.clone());}catch(e){}}
async function networkFirst(req){const key=shellKey(req);try{const r=await fetch(new Request(key.url,{headers:req.headers,cache:'no-store'}));if(r&&r.ok){const c=await caches.open(SHELL);await c.put(key,r.clone());return r;}}catch(e){}const c=await caches.open(SHELL),hit=await c.match(key);if(hit)return hit;return Response.error();}
async function asset(req){const c=await caches.open(SHELL),key=canonical(new URL(req.url)),hit=await c.match(key);if(hit)return hit;try{const r=await fetch(req,{cache:'no-store'});if(r&&r.ok)await c.put(key,r.clone());return r;}catch(e){return Response.error();}}
self.addEventListener('install',event=>{event.waitUntil((async()=>{const c=await caches.open(SHELL);await Promise.allSettled(LOCAL.map(p=>seed(c,p)));await self.skipWaiting();})());});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('pn-shell-stable-')&&n!==SHELL).map(n=>caches.delete(n)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin)return;if(isShell(url.pathname)){event.respondWith(networkFirst(req));return;}if(LOCAL.some(p=>p!=='./'&&url.pathname===SCOPE_PATH+p.replace('./',''))){event.respondWith(asset(req));return;}event.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req)));});