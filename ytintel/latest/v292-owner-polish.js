(function(){
'use strict';
if(document.documentElement.dataset.yt292OwnerPolish==='1')return;
document.documentElement.dataset.yt292OwnerPolish='1';
window.YTINTEL_VERSION='0.29.2';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let commercial=null,checking=false,lastCheck=0;

function toast(msg){try{window.YTIntelToast?.(msg)}catch{}}

function polishPricing(){
  const m=$('#yt290Modal');
  if(!m)return;
  const kicker=m.querySelector('.yt290-kicker');
  const title=m.querySelector('.yt290-head h2');
  const sub=m.querySelector('.yt290-head p');
  if(kicker&&!commercial?.pro)kicker.textContent='YTINTEL PRO';
  if(title&&!commercial?.pro)title.textContent='More research. More packages. Less friction.';
  if(sub&&!commercial?.pro)sub.textContent='For creators using YTIntel every week: higher limits across deep analysis, source-specific Packaging and Opportunity Radar.';
  const cards=m.querySelectorAll('.yt290-plan');
  if(cards[0]){const h=cards[0].querySelector('h3');if(h)h.textContent='Free'}
  if(cards[1]){const h=cards[1].querySelector('h3');if(h)h.textContent='Pro'}
  const blocked=m.querySelector('.yt290-blocked');
  const cta=m.querySelector('[data-yt290-pro]');
  if(blocked&&!commercial?.pro){
    blocked.textContent='Pro checkout is not open yet. Keep using Free — your saved research and history stay yours.';
    if(cta){cta.textContent='Pro checkout coming soon';cta.disabled=true;cta.setAttribute('aria-disabled','true')}
  }
}

function paintDeveloper(){
  if(!commercial?.developer)return;
  document.body.classList.add('ytintel-developer');
  const usage=$('.yt290-usage');
  if(usage)usage.innerHTML='<b>DEV</b><span>Unlimited full access</span>';
  $$('.yt290-limit-card').forEach(x=>x.remove());
  const upgrade=$('.yt290-upgrade');
  if(upgrade){upgrade.hidden=true;upgrade.setAttribute('aria-hidden','true')}
  $('#yt290Modal')?.classList.remove('show');
}

function sync(){
  polishPricing();
  paintDeveloper();
}

async function readStatus(force=false){
  if(checking)return commercial;
  if(!force&&Date.now()-lastCheck<10000)return commercial;
  const api=window.YTIntelCommercial;
  if(!api?.getStatus)return commercial;
  checking=true;
  try{
    commercial=await api.getStatus();
    lastCheck=Date.now();
    sync();
    if(commercial?.developer)toast('Developer access active · limits disabled.');
  }catch{}
  finally{checking=false}
  return commercial;
}

function guardDeveloperPricing(e){
  if(!commercial?.developer)return;
  const hit=e.target.closest?.('.yt290-upgrade,[data-yt290-limit]');
  if(!hit)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  toast('Developer access is active — no upgrade required.');
}

let queued=false;
function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync()});
}

function init(){
  document.addEventListener('click',guardDeveloperPricing,true);
  const o=new MutationObserver(queue);o.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('ytintel:late-layers-ready',()=>readStatus(true));
  window.addEventListener('ytintel:auth',()=>setTimeout(()=>readStatus(true),60));
  window.addEventListener('focus',()=>readStatus(false));
  setTimeout(()=>readStatus(true),250);
  setTimeout(()=>readStatus(true),1200);
  sync();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
