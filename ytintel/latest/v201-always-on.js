(function(){
'use strict';
if(document.documentElement.dataset.yt201AlwaysOn==='1')return;
document.documentElement.dataset.yt201AlwaysOn='1';
const API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let state={always_on:true,enhancement_configured:false};
function loadLatest(){
  if(!document.querySelector('link[data-v250]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v250-intelligence.css?v=0280';l.dataset.v250='1';document.head.appendChild(l)}
  if(!document.querySelector('link[data-v260]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v260-cloud.css?v=0280';l.dataset.v260='1';document.head.appendChild(l)}
  if(!document.querySelector('link[data-v270]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v270-forensics.css?v=0280';l.dataset.v270='1';document.head.appendChild(l)}
  if(!document.querySelector('link[data-v280]')){const l=document.createElement('link');l.rel='stylesheet';l.href='v280-production.css?v=0280';l.dataset.v280='1';document.head.appendChild(l)}
  const load=(src,key)=>{if(document.querySelector(`script[data-load-key="${key}"]`))return;const s=document.createElement('script');s.src=src;s.async=false;s.dataset.loadKey=key;document.head.appendChild(s)};
  load('v250-radar-persistence.js?v=0280','v250-radar');
  load('v250-app.js?v=0280','v250-app');
  load('v260-cloud.js?v=0280','v260-cloud');
  load('v260-release.js?v=0280','v260-release');
  load('v270-forensics.js?v=0280','v270-forensics');
  load('v270-route.js?v=0280','v270-route');
  load('v280-production.js?v=0280','v280-production');
}
function setStatus(){const s=$('#status');if(!s)return;s.textContent=`v${window.YTINTEL_VERSION||'0.28.0'} · Always-On intelligence live`;s.style.borderColor='rgba(85,226,157,.48)';s.style.color='#9af1c2';s.title=state.enhancement_configured?'YTIntel always-on analysis is active. GPT-5.6 Sol is available as a cloud enhancement when the provider is available.':'YTIntel always-on analysis is active. Cloud model access is optional; the analyser does not stop when it is unavailable.'}
function relabel(){$$('.sol-badge').forEach(b=>{const card=b.closest('#solIntelligence,#solPattern,.sol-card'),text=(card?.textContent||'').toLowerCase();if(/failed|credit|quota|billing|api key|activate/.test(text))return;b.textContent=state.enhancement_configured?'YTINTEL · ALWAYS-ON + CLOUD ENHANCED':'YTINTEL · ALWAYS-ON INTELLIGENCE'});$$('.sol-title').forEach(h=>{const t=(h.textContent||'').toLowerCase();if(t.includes('max reasoning')||t.includes('activate'))h.textContent='Reading the full evidence set…'});const updates=$('#updates .grid');if(updates&&!updates.querySelector('[data-v201-release]')){const a=document.createElement('article');a.className='card c12 release';a.dataset.v201Release='1';a.innerHTML='<div class="eyebrow">V0.20.1 · 6 SEP 2026</div><h3>Always-On AI analyser</h3><ul class="list"><li><b>No YTIntel daily AI cap:</b> the previous per-IP and global daily limits are removed from the analyser backend.</li><li><b>No credit wall:</b> provider billing, quota or key problems no longer shut analysis down or ask the user to add credits.</li><li><b>Automatic fallback:</b> YTIntel continues with its own evidence-grounded analysis engine whenever the cloud model is unavailable.</li><li><b>Cloud AI is now an enhancement:</b> GPT-5.6 Sol can deepen the result when available, but it is no longer required for the analyser to work.</li></ul>';updates.append(a)}}
function sanitizeErrors(){$$('.error,.sol-offline').forEach(n=>{const t=(n.textContent||'').toLowerCase();if(/credit|quota|billing|insufficient|api key|spend limit|usage limit/.test(t)){if(n.classList.contains('error'))n.textContent='Cloud enhancement is unavailable right now. YTIntel will continue with Always-On intelligence.';else{const p=n.querySelector('p.muted');if(p)p.textContent='Cloud enhancement is unavailable right now. YTIntel will continue with Always-On intelligence.'}}})}
async function health(){try{const r=await fetch(API+'&t='+Date.now(),{cache:'no-store'}),d=await r.json();if(r.ok&&d)state={...state,...d}}catch{}setStatus();relabel();sanitizeErrors()}
let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;setStatus();relabel();sanitizeErrors()})}
function init(){loadLatest();health();const o=new MutationObserver(refresh);o.observe(document.body,{childList:true,subtree:true,characterData:true});setInterval(health,60000);window.addEventListener('focus',health);window.addEventListener('online',health)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
