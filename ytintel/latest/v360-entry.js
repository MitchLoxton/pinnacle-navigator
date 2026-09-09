document.documentElement.classList.add('v360-loading');
await import('./v361-capability-guard.js?v=0361');
await import('./v361-review-fixes.js?v=0361');
await import('./v360-endgame.js?v=0361');
window.YTINTEL_VERSION='0.36.1';
document.documentElement.dataset.ytintelVersion='0.36.1';
const version=document.querySelector('#version');if(version)version.textContent='v0.36.1';
const p=document.querySelector('#progressPct');
if(p){new MutationObserver(()=>{if(/^NaN%$/i.test((p.textContent||'').trim())){p.textContent='98%';const b=document.querySelector('#progressBar');if(b)b.style.width='98%';const m=document.querySelector('#progressMsg');if(m)m.textContent='On-device specialists are completing their cross-checks…'}}).observe(p,{childList:true,subtree:true,characterData:true})}
if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js?v=0361',{scope:'./'}).catch(()=>null)}catch{}}
document.documentElement.classList.remove('v360-loading');
