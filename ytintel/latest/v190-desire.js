(function(){
'use strict';
if(document.documentElement.dataset.yt190Desire==='1')return;
document.documentElement.dataset.yt190Desire='1';
document.body.classList.add('yt-ui-v19');
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function go(tab,focus){document.querySelector(`.tabs [data-tab="${tab}"]`)?.click();setTimeout(()=>focus&&$(focus)?.focus(),70)}

function smartStartUpgrade(){
  const start=$('#smartStart');
  if(!start)return;
  const eye=start.querySelector('.ss-copy .eyebrow');
  const h=start.querySelector('.ss-copy h1');
  const p=start.querySelector('.ss-copy p');
  const btn=start.querySelector('#smartGo');
  if(eye)eye.textContent='YTINTEL · CREATOR RESEARCH OS';
  if(h)h.textContent='Find the signal. Prove it. Ship the video.';
  if(p)p.textContent='Start with any topic, video, channel or competitor set. YTIntel routes the research, checks whether the pattern survives controls, and turns the evidence into an original production brief.';
  if(btn)btn.textContent='Find my next video →';
  if(!start.querySelector('.v19-value-strip')){
    const strip=document.createElement('div');
    strip.className='v19-value-strip';
    strip.innerHTML=''
      +'<div class="v19-value-item"><span>01 · Discover</span><b>Find the breakout</b><small>Separate real channel-relative opportunity from raw popularity.</small></div>'
      +'<div class="v19-value-item"><span>02 · Validate</span><b>Pressure-test the pattern</b><small>Use independent creators, controls and repeated evidence before trusting it.</small></div>'
      +'<div class="v19-value-item"><span>03 · Package</span><b>Make it yours</b><small>Turn the mechanism into an original title, thumbnail, hook and execution plan.</small></div>'
      +'<div class="v19-value-item"><span>04 · Learn</span><b>Build creator fit</b><small>Track what you publish so future decisions compound around your own channel.</small></div>';
    const recent=start.querySelector('#smartStartRecent');
    (recent||start.querySelector('.ss-proof'))?.before(strip);
  }
  if(!start.querySelector('.v19-proof-rail')){
    const rail=document.createElement('div');
    rail.className='v19-proof-rail';
    rail.innerHTML='<span class="strong">Channel-relative baselines</span><span>Winner vs control</span><span>Cross-channel validation</span><span>Originality guardrails</span><span>No guaranteed-view claims</span>';
    start.querySelector('.ss-proof')?.after(rail);
  }
}

const RAILS={
  sprint:{label:'One guided research run',steps:[['01','Discover','Current opportunities'],['02','Validate','Independent evidence'],['03','Ready','Production brief']]},
  radar:{label:'Opportunity intelligence',steps:[['01','Discover','Find candidates'],['02','Verify','Check breakout strength'],['03','Select','Build validation set']]},
  packaging:{label:'Creative conversion',steps:[['01','Evidence','Use verified winners'],['02','Originalise','Change the execution'],['03','Ship','Title + thumb + hook']]},
  loop:{label:'Creator calibration',steps:[['01','Publish','Track the idea'],['02','Measure','Capture outcomes'],['03','Learn','Build personal fit']]}
};
function addScreenRails(){
  Object.entries(RAILS).forEach(([id,cfg])=>{
    const view=$(`#${id}`),hero=view?.querySelector(':scope > .hero');
    if(!view||!hero||view.querySelector(':scope > .v19-screen-rail'))return;
    const rail=document.createElement('div');
    rail.className='v19-screen-rail no-print';
    rail.innerHTML=`<div class="v19-rail-label"><i></i><span>${E(cfg.label)}</span></div>${cfg.steps.map(([n,b,s])=>`<div class="v19-rail-step"><em>${n}</em><div><b>${E(b)}</b><small>${E(s)}</small></div></div>`).join('')}`;
    hero.after(rail);
  });
}

function scoreColour(n){return n>=78?'#66e0ad':n>=62?'#91a9ff':'#ff8b74'}
function upgradeRadar(){
  $$('.radar-score').forEach(score=>{
    if(score.dataset.v19==='1')return;
    score.dataset.v19='1';
    const n=parseInt(score.querySelector('b')?.textContent||score.textContent,10);
    if(Number.isFinite(n)){
      score.style.setProperty('--v19-score',String(Math.max(0,Math.min(100,n))));
      score.style.setProperty('--v19-score-color',scoreColour(n));
    }
  });
  $$('.radar182-card,.radar-video').forEach(card=>{
    const text=(card.textContent||'').toUpperCase();
    if(text.includes('PRIORITY'))card.dataset.v19Tier='priority';
    else if(text.includes('WATCH'))card.dataset.v19Tier='watch';
  });
  const root=$('#radarRoot');
  if(root&&root.children.length&&!root.querySelector('.v19-next-action')){
    const cards=root.querySelectorAll('.radar182-card,.radar-video');
    if(cards.length){
      const bar=document.createElement('div');
      bar.className='v19-next-action';
      bar.innerHTML='<div><div class="eyebrow">NEXT BEST ACTION</div><b>Do not stop at the ranking.</b><span>Use a channel-diverse validation set, then send it into Pattern Mine before treating a mechanism as repeatable.</span></div><button class="btn primary" type="button" data-v19-pattern>Validate the pattern →</button>';
      root.prepend(bar);
      bar.querySelector('[data-v19-pattern]')?.addEventListener('click',()=>{
        const existing=$('#radarToPattern');
        if(existing){existing.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>existing.focus(),300)}else go('batch','#batchUrls');
      });
    }
  }
}

function upgradePackaging(){
  const cards=$$('.package-option');
  cards.forEach((card,i)=>{
    if(i===0)card.dataset.v19Recommend='top';
    if(card.dataset.v19Score==='1')return;
    const split=card.querySelector(':scope > .split');
    const right=split?.lastElementChild;
    const raw=right?.firstElementChild;
    const n=parseInt(raw?.textContent||'',10);
    if(right&&raw&&Number.isFinite(n)){
      card.dataset.v19Score='1';
      right.classList.add('v19-package-score');
      right.innerHTML=`<b>${Math.max(0,Math.min(100,n))}</b><small>package score</small>`;
    }
  });
  const root=$('#packageRoot');
  if(root&&cards.length&&!root.querySelector('.v19-next-action')){
    const bar=document.createElement('div');
    bar.className='v19-next-action';
    bar.innerHTML='<div><div class="eyebrow">DECISION LAYER</div><b>Choose the package with the strongest evidence/originality balance.</b><span>The highest score is a test priority, not a promise of views. Copy the brief, produce it, then track the result in Creator Loop.</span></div><button class="btn primary" type="button" data-v19-loop>Track the winner →</button>';
    root.prepend(bar);
    bar.querySelector('[data-v19-loop]')?.addEventListener('click',()=>go('loop'));
  }
}

function richEmpty(root,kind){
  if(!root||root.dataset.v19Empty==='1')return;
  const txt=(root.textContent||'').trim().toLowerCase();
  if(kind==='radar'&&/last radar scans|appear here/.test(txt)){
    root.dataset.v19Empty='1';root.classList.add('v19-empty');root.innerHTML='<div class="eyebrow">YOUR MARKET MEMORY STARTS HERE</div><h3>No Radar scan yet.</h3><p>Run one niche search and this area becomes your recent opportunity memory: candidates, verified breakouts, replication and the validation set.</p><button class="btn primary" type="button" data-v19-empty="radar">Run my first Radar →</button>';
  }
  if(kind==='package'&&/recent package labs|appear here/.test(txt)){
    root.dataset.v19Empty='1';root.classList.add('v19-empty');root.innerHTML='<div class="eyebrow">TURN PROOF INTO CREATIVE</div><h3>No package built yet.</h3><p>Packaging Lab becomes useful after Radar has a verified winner set across more than one creator. Then YTIntel can build an original title, thumbnail and opening hook from evidence.</p><button class="btn primary" type="button" data-v19-empty="packaging">Find the evidence first →</button>';
  }
}
function bindEmptyButtons(){
  $$('[data-v19-empty="radar"]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>{$('#radarQuery')?.focus();window.scrollTo({top:0,behavior:'smooth'})}});
  $$('[data-v19-empty="packaging"]').forEach(b=>{if(b.dataset.bound)return;b.dataset.bound='1';b.onclick=()=>go('radar','#radarQuery')});
}

function sprintPolish(){
  const root=$('#sprintRoot');
  if(!root)return;
  const start=root.querySelector('.sprint-start');
  if(start&&!start.querySelector('.v19-product-signal')){
    const eye=start.querySelector('.eyebrow');
    const signal=document.createElement('span');signal.className='v19-product-signal';signal.textContent='Best starting point';
    eye?.after(signal);
  }
  const ready=root.querySelector('.sprint-ready');
  if(ready&&!root.querySelector('.v19-next-action')){
    const bar=document.createElement('div');
    bar.className='v19-next-action';
    bar.innerHTML='<div><div class="eyebrow">YOU HAVE A PRODUCTION DECISION</div><b>Move this brief out of research and into a real upload.</b><span>Track it before production so the original evidence stays attached to the result.</span></div><button class="btn primary" type="button" data-v19-track>Track in Creator Loop →</button>';
    ready.before(bar);
    bar.querySelector('[data-v19-track]')?.addEventListener('click',()=>{
      const native=root.querySelector('#sprintAddLoop,[data-sprint-loop]');
      if(native)native.click();else go('loop');
    });
  }
}

function loopPolish(){
  const root=$('#loopRoot');
  if(!root)return;
  const onboard=root.querySelector('.yt-loop-onboard');
  if(onboard&&!onboard.querySelector('.v19-product-signal')){
    const eye=onboard.querySelector('.eyebrow');
    const signal=document.createElement('span');signal.className='v19-product-signal';signal.textContent='Compounding advantage';
    eye?.after(signal);
  }
  const summary=root.querySelector('.loop-summary');
  if(summary&&!root.querySelector('.v19-next-action')&&root.querySelector('.experiment')){
    const bar=document.createElement('div');
    bar.className='v19-next-action';
    bar.innerHTML='<div><div class="eyebrow">CREATOR MEMORY</div><b>Every measured upload makes the next recommendation more personal.</b><span>Refresh outcomes after publishing. Do not overfit until you have enough repeated results.</span></div><button class="btn" type="button" data-v19-refresh-first>Review active tests</button>';
    summary.after(bar);
    bar.querySelector('[data-v19-refresh-first]')?.addEventListener('click',()=>root.querySelector('.experiment')?.scrollIntoView({behavior:'smooth',block:'center'}));
  }
}

function updates(){
  const grid=$('#updates .grid');
  if(!grid||grid.querySelector('[data-v190-release]'))return;
  grid.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const a=document.createElement('article');
  a.className='card c12 release current';
  a.dataset.v190Release='1';
  a.innerHTML='<div class="eyebrow">V0.19.0 · 6 SEP 2026 · CURRENT</div><h3>Desire Layer — premium hierarchy, clearer value and stronger action states</h3><ul class="list"><li><b>Smart Start is now the real hero:</b> one outcome-led entry point instead of duplicate introductory blocks.</li><li><b>Major workflows now explain their job:</b> Radar, Research Sprint, Packaging Lab and Creator Loop each show a compact progress/value rail.</li><li><b>Scores became decision instruments:</b> opportunity and package scores are visually prioritised without implying guaranteed performance.</li><li><b>Empty states now sell the next step:</b> zero-data screens explain what unlocks and provide the relevant action.</li><li><b>Premium brand polish:</b> stronger contrast, cleaner spacing, subtle motion, better active states and a restrained YTIntel signal-red accent.</li></ul>';
  grid.prepend(a);
}

function status(){
  const s=$('#status');
  if(s)s.textContent='v0.19.0 · creator intelligence live';
}

function refresh(){
  smartStartUpgrade();
  addScreenRails();
  upgradeRadar();
  upgradePackaging();
  richEmpty($('#radarRecent'),'radar');
  richEmpty($('#packageRecent'),'package');
  bindEmptyButtons();
  sprintPolish();
  loopPolish();
  updates();
  status();
}
let queued=false;
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}
function init(){
  refresh();
  const obs=new MutationObserver(queue);
  ['#osRoot','#radarRoot','#radarRecent','#packageRoot','#packageRecent','#sprintRoot','#loopRoot','#updates'].forEach(sel=>{const n=$(sel);if(n)obs.observe(n,{childList:true,subtree:true})});
  setTimeout(refresh,400);setTimeout(refresh,1300);setTimeout(refresh,3200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
