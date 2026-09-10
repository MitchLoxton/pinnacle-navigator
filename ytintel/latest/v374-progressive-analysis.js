(()=>{'use strict';
const STEPS=['The strip','Summary — so you never watch it','Key takeaways','Hook breakdown','Re-hooks','Payoffs','Most Replayed','Source mechanics','Visual key frames','Motion graphics','Audio + WPM','Packaging','Channel context','Make it yours','Vault save','AI-ready Markdown','Full transcript'];
const PUBLIC='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v093';
let firedFor='',factFor='',stepIndex=0,lastPct=0;
function report(){return window.__YTINTEL_NORMALIZED_REPORT||window.__YTINTEL_REPORT}
async function ownerFacts(r){
  const id=r?.video?.id||'',query=r?.video?.channel_url||r?.video?.channel_id||'';
  if(!id||!query||factFor===id||Number(r?.video?.channel_follower_count)>0)return;
  factFor=id;
  try{
    const res=await fetch(`${PUBLIC}?action=channel-public`,{method:'POST',headers:{'content-type':'application/json','x-ytintel-client':'web-v380'},body:JSON.stringify({query,video_id:id}),cache:'no-store'});
    const d=await res.json().catch(()=>({})),n=Number(d?.channel?.statistics?.subscriberCount);
    if(res.ok&&Number.isFinite(n)&&n>0){r.video.channel_follower_count=n;window.dispatchEvent(new CustomEvent('ytintel:v364-facts-ready',{detail:{video_id:id,source:'progressive-owner-fact'}}))}
  }catch{factFor=''}
}
async function tryRender(){
  const r=report(),root=document.querySelector('#report'),api=window.YTIntelAnalysisRedesign,id=r?.video?.id||'';
  if(id)ownerFacts(r);
  if(!id||!root||root.dataset.v372Canonical==='1'||firedFor===id||!api?.render)return;
  firedFor=id;
  const state=document.querySelector('#progressState'),before=state?.textContent||'';
  let placeholder=null;
  if(!root.querySelector('[data-section="17"]')){placeholder=document.createElement('section');placeholder.dataset.section='17';placeholder.hidden=true;placeholder.setAttribute('aria-hidden','true');root.append(placeholder)}
  if(state)state.textContent='EVIDENCE COMPLETE · MEDIA CONTINUES';
  try{await api.render();if(root.dataset.v372Canonical!=='1')firedFor=''}catch{firedFor='';if(placeholder?.isConnected)placeholder.remove()}finally{if(state&&root.dataset.v372Canonical!=='1')state.textContent=before||'DEEP ANALYSIS'}
}
function cycleProgress(){
  const card=document.querySelector('#progressCard'),msg=document.querySelector('#progressMsg'),pct=Math.max(0,Math.min(100,parseInt(document.querySelector('#progressPct')?.textContent||'0',10)||0));
  if(!card||!msg||card.classList.contains('hidden'))return;
  if(pct<lastPct){stepIndex=0;factFor='';firedFor=''}
  lastPct=pct;
  if(pct>=100){stepIndex=16;msg.dataset.ownerStep='17/17 · Analysis ready';return}
  msg.dataset.ownerStep=`${String(stepIndex+1).padStart(2,'0')}/17 · ${STEPS[stepIndex]}`;
  if(pct>0&&stepIndex<16)stepIndex++;
}
function reset(){const r=report();if(r?.video?.id===firedFor){const root=document.querySelector('#report');if(root?.dataset.v372Canonical!=='1')firedFor=''}}
function start(){
  if(!document.querySelector('#v374-progress-style')){const s=document.createElement('style');s.id='v374-progress-style';s.textContent='#progressCard.v372-compact #progressMsg[data-owner-step]{font-size:0!important}#progressCard.v372-compact #progressMsg[data-owner-step]::after{content:attr(data-owner-step);font-size:13px;line-height:1.3}';document.head.append(s)}
  new MutationObserver(()=>queueMicrotask(tryRender)).observe(document.body,{childList:true,subtree:true,characterData:true});
  document.querySelector('#analyseForm')?.addEventListener('submit',()=>{firedFor='';factFor='';stepIndex=0;lastPct=0;const m=document.querySelector('#progressMsg');if(m)delete m.dataset.ownerStep},true);
  for(const ev of ['ytintel:v363-premium-ready','ytintel:v364-facts-ready','ytintel:v370-transcript-ready'])window.addEventListener(ev,tryRender);
  setInterval(()=>{reset();tryRender();cycleProgress()},850);
  tryRender();cycleProgress();
  window.YTIntelProgressiveAnalysis={version:'0.38.0',tryRender,cycleProgress};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
