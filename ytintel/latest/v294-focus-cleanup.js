(function(){
'use strict';
if(document.documentElement.dataset.yt294FocusCleanup==='1')return;
document.documentElement.dataset.yt294FocusCleanup='1';
window.YTINTEL_VERSION='0.29.4';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let routed=false,queued=false;

function hideTopNoise(){
  ['#ytCommandBtn','#v20CommandBtn','#whatsNewBtn','#ytTrustChip'].forEach(sel=>$(sel)?.remove());
  $$('.top button,.top [role="button"],.top .yt-trust-chip').forEach(el=>{
    const t=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(t==='quick switch'||t.startsWith('quick switch ')||t==='jump to'||t.startsWith('jump to ')||t==="what's new"||t==='whats new'||t==='evidence-first'||t==='evidence first')el.remove();
  });
  $('#ytCommandOverlay')?.remove();
  $('#v20Command')?.remove();
}

function simplifyNav(){
  const sprintBtn=$('.tabs [data-tab="sprint"]');
  if(sprintBtn)sprintBtn.remove();
  const osBtn=$('.tabs [data-tab="os"]');
  if(osBtn){
    osBtn.setAttribute('aria-label','Competitors');
    const label=osBtn.querySelector('.nav-label');
    if(label)label.textContent='Competitors';
    else osBtn.textContent='Competitors';
    osBtn.querySelector('.beta')?.remove();
  }
  const core=$('.yt-nav-core');
  const analyse=$('.tabs [data-tab="analyse"]'),loop=$('.tabs [data-tab="loop"]');
  if(core){
    if(analyse)core.appendChild(analyse);
    if(osBtn)core.appendChild(osBtn);
    if(loop)core.appendChild(loop);
  }
  const sprint=$('#sprint');if(sprint)sprint.style.display='none';
  if(!routed){
    routed=true;
    const active=$('.view.active')?.id;
    if(active==='os'||active==='sprint')setTimeout(()=>$('.tabs [data-tab="analyse"]')?.click(),0);
  }else if($('.view.active')?.id==='sprint')$('.tabs [data-tab="analyse"]')?.click();
}

function findMovement(){
  const inside=$$('#v24Dashboard .v24-panel').find(x=>/competitor movement/i.test(x.querySelector('h2')?.textContent||''));
  if(inside)return inside;
  return $$('.v24-panel').find(x=>/competitor movement/i.test(x.querySelector('h2')?.textContent||''))||null;
}

function competitorPage(){
  const os=$('#os');if(!os)return;
  const hero=os.querySelector(':scope > .hero');
  if(hero){
    const eye=hero.querySelector('.eyebrow'),h=hero.querySelector('h1'),p=hero.querySelector('p');
    if(eye)eye.textContent='COMPETITOR INTELLIGENCE';
    if(h)h.textContent='Track the people you actually compete with.';
    if(p)p.textContent='Keep a tight list of direct competitors, refresh them together, and see recent uploads, breakout videos and movement between scans.';
  }
  let root=$('#yt294Competitors');
  if(!root){
    root=document.createElement('div');root.id='yt294Competitors';root.className='yt294-competitors';
    root.innerHTML='<section class="yt294-competitor-intro"><div><div class="eyebrow">COMPETE WITH CONTEXT</div><h2>Your competitor board.</h2><p>Add 3–10 channels you genuinely compete with. YTIntel keeps the list, scans their recent uploads and compares later refreshes against the previous snapshot.</p></div><span>Focused view</span></section><div id="yt294WatchSlot"></div><div id="yt294MoveSlot"></div>';
    hero?.insertAdjacentElement('afterend',root);
  }
  const watch=$('#v22CommandCenter .v22-watchtower')||$('.v22-watchtower');
  const watchSlot=$('#yt294WatchSlot');
  if(watch&&watchSlot&&watch.parentElement!==watchSlot){watchSlot.replaceChildren(watch)}
  if(watch){
    const h=watch.querySelector('.v22-panel-head h2'),p=watch.querySelector('.v22-panel-head p'),input=watch.querySelector('#v22CompetitorInput'),scan=watch.querySelector('[data-v22-scan]');
    if(h)h.textContent='Your top competitors';
    if(p)p.textContent='Add direct competitor channels once. Refresh them together to see recent postings, standout videos and changes over time.';
    if(input)input.placeholder='Paste competitor channel URL or @handle';
    if(scan)scan.textContent='Refresh competitors';
  }
  const movement=findMovement(),moveSlot=$('#yt294MoveSlot');
  if(movement&&moveSlot&&movement.parentElement!==moveSlot)moveSlot.replaceChildren(movement);
  if(moveSlot&&!movement&&!moveSlot.children.length)moveSlot.innerHTML='<section class="v24-panel"><div class="v24-panel-head"><div><div class="eyebrow">WHAT CHANGED</div><h2>Competitor movement</h2><p>Your first competitor refresh creates the baseline. The next refresh shows what changed.</p></div></div><div class="v24-empty">No competitor comparison exists yet.</div></section>';
}

function hideRetiredSurfaces(){
  ['#smartStart','#v20Universal','#ytIntelPulse','#ytPowerGrid','#ytFeaturedBrief','.yt-trust-strip'].forEach(sel=>$$(sel).forEach(x=>x.style.display='none'));
  const os=$('#os');if(os)Array.from(os.children).forEach(ch=>{if(!ch.classList.contains('hero')&&ch.id!=='yt294Competitors')ch.style.display='none'});
  const sprint=$('#sprint');if(sprint)sprint.style.display='none';
}

function releaseCard(){
  const g=$('#updates .grid');if(!g||g.querySelector('[data-v294-release]'))return;
  g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const a=document.createElement('article');a.className='card c12 release current';a.dataset.v294Release='1';
  a.innerHTML='<div class="eyebrow">V0.29.4 · 6 SEP 2026 · CURRENT</div><h3>Focus Cleanup + Competitor Board</h3><ul class="list"><li><b>Competitors kept:</b> the useful Watchtower + movement workflow now has its own focused Competitors screen.</li><li><b>Smart Start removed for now:</b> Analyse is the default starting point instead of another routing layer.</li><li><b>Research Sprint removed for now:</b> the broken guided flow is out of the visible product until it earns its way back.</li><li><b>Header simplified:</b> Quick switch, Jump to, What\'s New and Evidence-first have been removed.</li><li><b>Less noise:</b> competitor tracking stays; duplicated navigation and dead-end surfaces do not.</li></ul>';
  g.prepend(a);
}

function injectCss(){
  if($('#yt294Style'))return;
  const s=document.createElement('style');s.id='yt294Style';s.textContent=`
.tabs [data-tab="sprint"],#sprint,#ytCommandBtn,#v20CommandBtn,#whatsNewBtn,#ytTrustChip,#ytCommandOverlay,#v20Command{display:none!important}
#os>#osRoot,#os>#smartStart,#os>#v20Universal,#os>#ytIntelPulse,#os>#ytPowerGrid,#os>#ytFeaturedBrief,#os>.yt-trust-strip,#v22CommandCenter,#v24Dashboard{display:none!important}
#yt294Competitors{display:grid!important;gap:16px;margin-top:16px}
#yt294Competitors .v22-watchtower,#yt294Competitors .v24-panel{display:block!important}
.yt294-competitor-intro{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:22px 24px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(145deg,rgba(13,18,25,.98),rgba(8,11,16,.98))}
.yt294-competitor-intro h2{margin:5px 0 7px;font-size:26px}.yt294-competitor-intro p{margin:0;max-width:850px;color:#aeb8c7;line-height:1.55}.yt294-competitor-intro>span{flex:0 0 auto;border:1px solid rgba(102,224,173,.18);background:rgba(102,224,173,.05);color:#8de6be;border-radius:999px;padding:7px 10px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
#yt294WatchSlot,#yt294MoveSlot{display:block!important}
@media(max-width:760px){.yt294-competitor-intro{display:block;padding:18px}.yt294-competitor-intro>span{display:inline-flex;margin-top:12px}.yt294-competitor-intro h2{font-size:22px}}
`;
  document.head.appendChild(s);
}

function refresh(){injectCss();hideTopNoise();simplifyNav();competitorPage();hideRetiredSurfaces();releaseCard()}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}
function init(){refresh();const o=new MutationObserver(queue);o.observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',queue);window.addEventListener('focus',queue);setTimeout(refresh,400);setTimeout(refresh,1400);setTimeout(refresh,3200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
