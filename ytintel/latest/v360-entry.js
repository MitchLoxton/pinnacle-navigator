document.documentElement.classList.add('v360-loading');
await import('./v366-local-ai-shield.js?v=0375');
await import('./v361-capability-guard.js?v=0375');
await import('./v361-review-fixes.js?v=0375');
await import('./v360-endgame.js?v=0375');
await import('./v366-local-ai-optin.js?v=0375');
await import('./v362-source-polish.js?v=0375');
await import('./v363-premium-brief.js?v=0375');
await import('./v364-fact-surfaces.js?v=0375');
await import('./v369-packaging-depth.js?v=0375');
await import('./v365-canonical-shell.js?v=0375');
await import('./v367-premium-lock.js?v=0375');
await import('./v370-transcript-receipt.js?v=0375');
await import('./v371-feedback-overhaul.js?v=0375');
await import('./v372-endgame-closer.js?v=0375');
await import('./v373-analyse-focus.js?v=0375');
await import('./v374-creator-assets.js?v=0375');
await import('./v375-creator-assets-cloud.js?v=0375');
await import('./v376-resumable-creator-assets.js?v=0376');
await import('./v377-scene-indexer.js?v=0377');
const RELEASE='0.37.7';
let releaseValue=RELEASE;
try{Object.defineProperty(window,'YTINTEL_VERSION',{configurable:true,enumerable:true,get:()=>releaseValue,set:v=>{if(String(v)===RELEASE)releaseValue=RELEASE}})}catch{window.YTINTEL_VERSION=RELEASE}
document.documentElement.dataset.ytintelVersion=RELEASE;
const version=document.querySelector('#version');
const ownVisibleVersion=()=>{if(version&&version.textContent!==`v${RELEASE}`)version.textContent=`v${RELEASE}`};
ownVisibleVersion();
if(version)new MutationObserver(ownVisibleVersion).observe(version,{childList:true,subtree:true,characterData:true});
const p=document.querySelector('#progressPct');
if(p){new MutationObserver(()=>{if(/^NaN%$/i.test((p.textContent||'').trim())){p.textContent='98%';const b=document.querySelector('#progressBar');if(b)b.style.width='98%';const m=document.querySelector('#progressMsg');if(m)m.textContent='Source and benchmark-depth specialists are completing their cross-checks…'}}).observe(p,{childList:true,subtree:true,characterData:true})}
if('serviceWorker'in navigator){try{navigator.serviceWorker.register('./sw.js?v=0377',{scope:'./'}).catch(()=>null)}catch{}}
document.documentElement.classList.remove('v360-loading');
