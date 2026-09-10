(()=>{'use strict';
const STEPS=['The strip','The summary — so you never watch it','Key takeaways','The hook','The re-hooks','The payoffs','Most Replayed','The structure map','Visuals — key frame by key frame','Motion graphics','Audio','Packaging','The numbers table','The claims ledger','Channel context','Make it yours','The vault entry','Export'];
const $=s=>document.querySelector(s),clean=s=>String(s??'').replace(/\s+/g,' ').trim();let queued=false;
const EYE='YTINTEL ENDGAME · PREMIUM VIDEO ANALYSIS';
const COPY='One winning video in. An 18-section premium source-backed analysis out: watch-replacement summary, exact receipts, hooks, re-hooks, payoffs, Most Replayed, structure, visual/audio evidence, packaging, numbers, claims ledger, channel context, Creator-DNA remake, Vault entry and export.';
const BANNER_TITLE='Benchmark-depth Endgame engine';
const BANNER_COPY='Source evidence always runs. The visible brief follows the 09/09 premium structure. On compatible desktop Chrome, optional on-device text + image + audio intelligence can deepen the model/media sections without paid API credits.';
function setText(el,value){if(el&&el.textContent!==value)el.textContent=value}
function patchHero(){const h=$('#analyse .hero');if(!h)return;setText(h.querySelector('.eyebrow'),EYE);setText(h.querySelector('p'),COPY);const b=h.querySelector('.v360-media-banner');if(b){setText(b.querySelector('strong'),BANNER_TITLE);setText(b.querySelector('p'),BANNER_COPY);const badges=b.querySelectorAll('.v360-badge');setText(badges[0],'18 sections')}}
function patchRoadmap(){const root=$('#v350-console .roadmap-grid');if(!root)return;const pct=parseInt($('#progressPct')?.textContent||'0',10)||0;const at=[6,15,22,29,35,41,47,54,60,65,70,75,80,85,90,94,97,100];if(root.dataset.v365Pct===String(pct)&&root.dataset.v365Count==='18')return;root.innerHTML=STEPS.map((title,i)=>{const done=pct>=at[i],running=!done&&(i===0||pct>=at[i-1]);return`<div class="roadstep ${done?'done':running?'running':'idle'}"><strong>${i+1}</strong><span>${title}</span><i>${done?'done':running?'working':'queued'}</i></div>`}).join('');root.dataset.v365Pct=String(pct);root.dataset.v365Count='18'}
function patch(){queued=false;patchHero();patchRoadmap();const state=$('#progressState');if(state&&clean(state.textContent)==='EVIDENCE COMPLETE'&&$('#report')?.dataset.v363Premium==='1')setText(state,'COMPLETE')}
function queue(){if(queued)return;queued=true;queueMicrotask(patch)}
function start(){new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});patch();window.YTIntelCanonicalShell={version:'0.37.0',steps:STEPS}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
