(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let queued=false;
function lock(){
 const root=$('#report');if(!root||root.dataset.v363Premium!=='1')return;
 root.dataset.v367PremiumLock='1';
 for(const n of [2,3,6]){const s=root.querySelector(`[data-section="${n}"]`);if(s)s.dataset.v361='1'}
 for(const s of root.querySelectorAll('.v363-section')){
  const n=Number(s.dataset.section),eye=s.querySelector('.section-head .eyebrow'),want=`PREMIUM ANALYSIS · ${String(n).padStart(2,'0')}`;
  if(eye&&eye.textContent!==want)eye.textContent=want;
 }
 const pct=$('#progressPct'),bar=$('#progressBar'),state=$('#progressState');
 if(pct&&pct.textContent!=='100%')pct.textContent='100%';
 if(bar&&bar.style.width!=='100%')bar.style.width='100%';
 if(state&&state.textContent!=='COMPLETE')state.textContent='COMPLETE';
}
function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;lock()})}
function start(){window.addEventListener('ytintel:v363-premium-ready',lock);const root=$('#report');if(root)new MutationObserver(queue).observe(root,{childList:true,subtree:true,characterData:true});lock();window.YTIntelPremiumLock={version:'0.37.0',lock}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
