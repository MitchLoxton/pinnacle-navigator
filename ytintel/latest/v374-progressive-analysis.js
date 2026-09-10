(()=>{'use strict';
let firedFor='';
function tryRender(){
  const r=window.__YTINTEL_NORMALIZED_REPORT||window.__YTINTEL_REPORT;
  const root=document.querySelector('#report');
  const api=window.YTIntelAnalysisRedesign;
  const id=r?.video?.id||'';
  if(!id||!root?.querySelector('[data-section="17"]')||root.dataset.v372Canonical==='1'||firedFor===id||!api?.render)return;
  firedFor=id;
  const state=document.querySelector('#progressState');
  const before=state?.textContent||'';
  if(state)state.textContent='EVIDENCE COMPLETE · MEDIA CONTINUES';
  Promise.resolve(api.render()).catch(()=>{firedFor=''});
  if(state)state.textContent=before||'DEEP ANALYSIS';
}
function reset(){const r=window.__YTINTEL_NORMALIZED_REPORT||window.__YTINTEL_REPORT;if(r?.video?.id!==firedFor)return;const root=document.querySelector('#report');if(root?.dataset.v372Canonical!=='1')firedFor=''}
function start(){
  new MutationObserver(()=>queueMicrotask(tryRender)).observe(document.body,{childList:true,subtree:true,characterData:true});
  document.querySelector('#analyseForm')?.addEventListener('submit',()=>{firedFor=''},true);
  for(const ev of ['ytintel:v363-premium-ready','ytintel:v364-facts-ready','ytintel:v370-transcript-ready'])window.addEventListener(ev,tryRender);
  setInterval(()=>{reset();tryRender()},1200);
  tryRender();
  window.YTIntelProgressiveAnalysis={version:'0.38.0',tryRender};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
