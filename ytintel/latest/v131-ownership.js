(function(){
const VERSION='0.13.1';
const TITLE=`YTIntel v${VERSION} — Research Workspace`;
const RELEASE='ytintel-whats-new-0.13.1-ui-stability';
const HEALTH='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
const OLD_RELEASE_KEYS=[
 'ytintel-whats-new-0.10.1','ytintel-whats-new-0.10.2','ytintel-whats-new-0.10.4','ytintel-whats-new-0.10.5',
 'ytintel-whats-new-0.10.7-actual','ytintel-whats-new-0.10.8','ytintel-whats-new-0.10.9','ytintel-whats-new-0.10.9-ai-live',
 'ytintel-whats-new-0.11.0-actionboard','ytintel-whats-new-0.11.1-decision-gate','ytintel-whats-new-0.11.2-replication',
 'ytintel-whats-new-0.12.0-opportunity-radar','ytintel-whats-new-0.12.1-packaging-lab','ytintel-whats-new-0.13.0-interface-rebuild'
];
window.YTINTEL_VERSION=VERSION;
window.YTINTEL_UPDATE_OWNER=RELEASE;
try{OLD_RELEASE_KEYS.forEach(k=>localStorage.setItem(k,'seen'))}catch{}

let explicitModalOpen=false;
let enforcing=false;
let aiLive=null;
const modal=()=>document.querySelector('#updateModal');
const status=()=>document.querySelector('#status');

function lockTitle(){
 if(document.title!==TITLE)document.title=TITLE;
}
lockTitle();
const titleNode=document.querySelector('title');
if(titleNode)new MutationObserver(()=>{if(!enforcing)lockTitle()}).observe(titleNode,{childList:true,subtree:true,characterData:true});

function statusText(){
 if(aiLive===true)return `v${VERSION} · GPT-5.6 Sol intelligence LIVE`;
 if(aiLive===false)return `v${VERSION} · intelligence ready`;
 return `v${VERSION} · checking intelligence…`;
}
function lockStatus(){
 const s=status();if(!s)return;
 const wanted=statusText();
 if(s.textContent!==wanted){enforcing=true;s.textContent=wanted;enforcing=false}
 s.classList.toggle('is-live',aiLive===true);
 if(aiLive===true){s.style.borderColor='rgba(85,226,157,.28)';s.style.color='#bfead3'}
}
async function refreshHealth(){
 try{const r=await fetch(`${HEALTH}&t=${Date.now()}`,{cache:'no-store'}),d=await r.json();aiLive=!!(r.ok&&d&&d.configured)}catch{aiLive=null}
 lockStatus();
}

function currentModalHtml(){return `<div class="update-panel"><div class="update-top"><div class="grow"><span class="update-version">YTIntel v${VERSION} · UI STABILITY</span><h2>One app. One current update.</h2><p class="muted">Legacy feature modules can no longer change the browser title or cycle old release popups after the current workspace loads.</p></div><button class="update-close" data-v131-close aria-label="Close">×</button></div><div class="update-items"><div class="update-item"><div class="tick">✓</div><div><b>Old popup loop removed</b><span class="muted">Update screens no longer flicker through v0.10.x, v0.11.x and v0.12.x on launch.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Current title locked</b><span class="muted">The browser tab stays on YTIntel v${VERSION} instead of being overwritten by the old Sol module.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>What’s New has one owner</b><span class="muted">Older feature scripts keep their functionality but cannot hijack the current update button.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Fresh PWA cache</b><span class="muted">The latest shell replaces stale installed-app caches while keeping the app installable.</span></div></div></div><div class="update-actions"><button class="primary" data-v131-close>Continue</button><button data-v131-log>Full update log</button></div></div>`}
function closeModal(){const m=modal();if(!m)return;explicitModalOpen=false;m.classList.remove('show');try{localStorage.setItem(RELEASE,'seen')}catch{}}
function openCurrentModal(){
 const m=modal();if(!m)return;
 explicitModalOpen=true;
 enforcing=true;
 m.innerHTML=currentModalHtml();
 m.classList.add('show');
 enforcing=false;
 m.querySelectorAll('[data-v131-close]').forEach(x=>x.addEventListener('click',closeModal));
 m.querySelector('[data-v131-log]')?.addEventListener('click',()=>{closeModal();if(typeof tab==='function')tab('updates');else document.querySelector('[data-tab="updates"]')?.click()});
}
function protectModal(){
 const m=modal();if(!m||enforcing)return;
 const tag=(m.querySelector('.update-version')?.textContent||'');
 if(m.classList.contains('show')&&!explicitModalOpen){enforcing=true;m.classList.remove('show');enforcing=false}
 if(explicitModalOpen&&!tag.includes(`v${VERSION}`))openCurrentModal();
}
function bindWhatsNew(){
 const b=document.querySelector('#whatsNewBtn');if(!b||b.dataset.v131Owner==='1')return;
 b.dataset.v131Owner='1';
 b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openCurrentModal()},true);
}
function ensureReleaseCard(){
 const g=document.querySelector('#updates .grid');if(!g||enforcing)return;
 enforcing=true;
 g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
 let a=g.querySelector('[data-v131-release]');
 if(!a){a=document.createElement('article');a.className='card c12 release current';a.dataset.v131Release='1';a.innerHTML=`<div class="eyebrow">V${VERSION} · 5 SEP 2026 · CURRENT</div><h3>UI Stability — one current shell, one update owner</h3><ul class="list"><li><b>Browser-title lock:</b> legacy v0.10.5 code can no longer overwrite the current app title.</li><li><b>Popup ownership:</b> old delayed update modals are suppressed before they can paint.</li><li><b>What’s New ownership:</b> the current shell owns the button even when older modules clone it.</li><li><b>Status ownership:</b> old patches can no longer downgrade the visible app version.</li><li><b>PWA refresh:</b> stale YTIntel shell caches are removed when the current service worker takes over.</li></ul>`;g.prepend(a)}else{a.classList.add('current');if(g.firstElementChild!==a)g.prepend(a)}
 enforcing=false;
}

const shellObserver=new MutationObserver(()=>{
 if(enforcing)return;
 lockTitle();lockStatus();bindWhatsNew();protectModal();ensureReleaseCard();
});
shellObserver.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class'],characterData:true});

async function refreshServiceWorker(){
 if(!('serviceWorker'in navigator))return;
 try{
  const reg=await navigator.serviceWorker.register('./sw.js?v=0131',{updateViaCache:'none'});
  await reg.update();
  if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('ytintel-shell-')&&k!=='ytintel-shell-v0131').map(k=>caches.delete(k)))}
 }catch{}
}

function init(){
 lockTitle();lockStatus();bindWhatsNew();protectModal();ensureReleaseCard();
 // No update modal auto-opens anymore. Users open What's New deliberately.
 const m=modal();if(m)m.classList.remove('show');
 refreshHealth();setTimeout(refreshHealth,2500);setInterval(refreshHealth,60000);
 window.addEventListener('focus',refreshHealth);
 window.addEventListener('load',refreshServiceWorker,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
