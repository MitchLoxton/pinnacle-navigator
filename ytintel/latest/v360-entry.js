const RELEASE='0.37.9';
const root=document.documentElement;
const app=document.querySelector('#app');
const boot=document.querySelector('#boot');
root.classList.add('v360-loading');

let releaseValue=RELEASE;
try{Object.defineProperty(window,'YTINTEL_VERSION',{configurable:true,enumerable:true,get:()=>releaseValue,set:v=>{if(String(v)===RELEASE)releaseValue=RELEASE}})}catch{window.YTINTEL_VERSION=RELEASE}
root.dataset.ytintelVersion=RELEASE;

function ensureActiveView(tab){
  const views=[...document.querySelectorAll('.view')];
  if(!views.length)return;
  const requested=tab||document.querySelector('[data-tab].on')?.dataset.tab||document.querySelector('[data-dock].on')?.dataset.dock||'analyse';
  const next=document.getElementById(requested)||document.getElementById('analyse')||views[0];
  for(const v of views)v.classList.toggle('active',v===next);
  for(const b of document.querySelectorAll('[data-tab],[data-dock]')){
    const key=b.dataset.tab||b.dataset.dock;
    b.classList.toggle('on',key===next.id);
  }
}

function revealShell(reason='bootstrap'){
  if(app){app.hidden=false;app.removeAttribute('hidden');app.classList.remove('v360-prehide')}
  document.body?.classList.remove('v360-prehide');
  root.classList.remove('v360-loading');
  ensureActiveView();
  boot?.remove();
  root.dataset.ytintelShellReady=reason;
  if(window.__YTINTEL_SHELL_VISIBLE_MS==null)window.__YTINTEL_SHELL_VISIBLE_MS=Math.round(performance.now());
}

document.addEventListener('click',e=>{
  const b=e.target?.closest?.('[data-tab],[data-dock]');
  if(!b)return;
  const tab=b.dataset.tab||b.dataset.dock;
  if(!tab||!document.getElementById(tab))return;
  e.preventDefault();
  ensureActiveView(tab);
},{capture:true});

document.querySelector('#analyseForm')?.addEventListener('submit',e=>e.preventDefault(),{capture:true});
revealShell('entry-start');

const modules=[
  './v378-navigation-resilience.js?v=0379',
  './v366-local-ai-shield.js?v=0375',
  './v361-capability-guard.js?v=0375',
  './v361-review-fixes.js?v=0375',
  './v360-endgame.js?v=0375',
  './v366-local-ai-optin.js?v=0375',
  './v362-source-polish.js?v=0375',
  './v363-premium-brief.js?v=0375',
  './v364-fact-surfaces.js?v=0375',
  './v369-packaging-depth.js?v=0375',
  './v365-canonical-shell.js?v=0375',
  './v367-premium-lock.js?v=0375',
  './v370-transcript-receipt.js?v=0375',
  './v371-feedback-overhaul.js?v=0375',
  './v372-endgame-closer.js?v=0375',
  './v373-analyse-focus.js?v=0375',
  './v374-creator-assets.js?v=0375',
  './v375-creator-assets-cloud.js?v=0375',
  './v376-resumable-creator-assets.js?v=0376',
  './v377-scene-indexer.js?v=0377',
  './v379-usability-guard.js?v=0379u1'
];
const failures=[];
for(const src of modules){
  try{await import(src)}catch(error){
    const message=String(error?.message||error||'module import failed');
    failures.push({src,message});
    console.error('[YTIntel bootstrap] optional module failed:',src,error);
  }
}
window.__YTINTEL_BOOTSTRAP={version:RELEASE,failures,ok:failures.length===0};
root.dataset.ytintelBootstrapFailures=String(failures.length);

const version=document.querySelector('#version');
const ownVisibleVersion=()=>{if(version&&version.textContent!==`v${RELEASE}`)version.textContent=`v${RELEASE}`};
ownVisibleVersion();
if(version)new MutationObserver(ownVisibleVersion).observe(version,{childList:true,subtree:true,characterData:true});

const p=document.querySelector('#progressPct');
if(p){new MutationObserver(()=>{if(/^NaN%$/i.test((p.textContent||'').trim())){p.textContent='98%';const b=document.querySelector('#progressBar');if(b)b.style.width='98%';const m=document.querySelector('#progressMsg');if(m)m.textContent='Source and benchmark-depth specialists are completing their cross-checks…'}}).observe(p,{childList:true,subtree:true,characterData:true})}

revealShell(failures.length?'entry-recovered-with-module-failures':'entry-complete');
window.YTIntelNavigationResilience?.restore?.('entry-complete');
window.YTIntelUsabilityGuard?.repair?.();

if('serviceWorker'in navigator){try{navigator.serviceWorker.register('./sw.js?v=0379',{scope:'./'}).catch(()=>null)}catch{}}
window.dispatchEvent(new CustomEvent('ytintel:v379-ready',{detail:{version:RELEASE,failures:failures.length}}));
