(function(){
'use strict';
if(document.documentElement.dataset.yt220Sync==='1')return;
document.documentElement.dataset.yt220Sync='1';
const $=s=>document.querySelector(s);
function rewritePublicCopy(){
  const launch=$('#v21PublicLaunch');if(!launch)return;
  const eye=launch.querySelector('.eyebrow');if(eye)eye.textContent='CREATOR INTELLIGENCE · START IN SECONDS';
  const h=launch.querySelector('h2');if(h)h.textContent='Start with one video or one topic.';
  const p=launch.querySelector('.v21-public-top p');if(p)p.textContent='Paste a YouTube video to break it down, or type a niche/topic and YTIntel will build the research path toward a production-ready decision.';
  const trust=launch.querySelectorAll('.v21-trust>span');
  if(trust[0])trust[0].innerHTML='<b>Start instantly</b><small>No setup friction before you see value.</small>';
  if(trust[1])trust[1].innerHTML='<b>No user credit wall</b><small>Core analysis does not stop behind credits.</small>';
}
let last='';
function signature(){return ['#radarRoot','#packageRoot','#sprintRoot','#loopRoot'].map(s=>{const n=$(s);return `${s}:${(n?.innerText||'').length}:${n?.querySelector('h1,h2,h3')?.textContent||''}`}).join('|')}
function sync(){rewritePublicCopy();const s=signature();if(s&&s!==last){last=s;window.dispatchEvent(new Event('storage'))}}
function init(){rewritePublicCopy();last=signature();const roots=['#radarRoot','#packageRoot','#sprintRoot','#loopRoot'].map($).filter(Boolean);let timer=null;const o=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(sync,180)});roots.forEach(r=>o.observe(r,{childList:true,subtree:true,characterData:true}));setTimeout(sync,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
