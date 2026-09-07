(function(){
'use strict';
if(document.documentElement.dataset.yt201AlwaysOn==='1')return;
document.documentElement.dataset.yt201AlwaysOn='1';
const API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
let state={always_on:true,enhancement_configured:false};
function one(src,key){return new Promise(resolve=>{const old=document.querySelector(`script[data-load-key="${key}"]`);if(old){if(old.dataset.loaded==='1')return resolve();old.addEventListener('load',resolve,{once:true});old.addEventListener('error',resolve,{once:true});return}const s=document.createElement('script');s.src=src;s.async=false;s.dataset.loadKey=key;s.onload=()=>{s.dataset.loaded='1';resolve()};s.onerror=()=>{console.warn('[YTIntel loader] could not load',src);resolve()};document.head.appendChild(s)})}
async function loadLatest(){
  const css=(key,href)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)};
  css('v250','v250-intelligence.css?v=0300');css('v260','v260-cloud.css?v=0300');css('v270','v270-forensics.css?v=0300');css('v280','v280-production.css?v=0300');css('v281','v281-ideas.css?v=0300');css('v284','v284-luxe.css?v=0300');css('v290','v290-commercial.css?v=0300');css('v292','v292-owner-polish.css?v=0300');css('v300','v300-core-analysis.css?v=0300');
  await one('v291-auth-core.js?v=0300','v291-auth-core');
  try{await window.YTIntelAuthReady}catch{}
  const queue=[
    ['v104-media.js?v=0300','v104-media'],['v104-media-proxy.js?v=0300','v104-media-proxy'],
    ['v250-radar-persistence.js?v=0300','v250-radar'],['v250-app.js?v=0300','v250-app'],
    ['v260-cloud.js?v=0300','v260-cloud'],['v260-release.js?v=0300','v260-release'],
    ['v270-forensics.js?v=0300','v270-forensics'],['v270-route.js?v=0300','v270-route'],
    ['v280-production.js?v=0300','v280-production'],['v280-focus.js?v=0300','v280-focus'],
    ['v281-ideas.js?v=0300','v281-ideas'],['v281-auth-fix.js?v=0300','v281-auth-fix'],
    ['v282-product-fix.js?v=0300','v282-product-fix'],['v283-deep-packaging.js?v=0300','v283-deep-packaging'],
    ['v284-luxe.js?v=0300','v284-luxe'],['v290-commercial.js?v=0300','v290-commercial'],
    ['v292-owner-polish.js?v=0300','v292-owner-polish'],['v293-notes-focus.js?v=0300','v293-notes-focus'],
    ['v293-release-card.js?v=0300','v293-release-card'],['v294-focus-cleanup.js?v=0300','v294-focus-cleanup'],
    ['v295-core-hardening.js?v=0300','v295-core-hardening'],['v300-network-guard.js?v=0300','v300-network-guard'],
    ['v300-core-analysis.js?v=0300','v300-core-analysis'],['v300-vault-ui.js?v=0300','v300-vault-ui'],
    ['v300-visual-pass.js?v=0300','v300-visual-pass'],['v300-focus.js?v=0300','v300-focus']
  ];
  for(const [src,key] of queue)await one(src,key);
  try{window.dispatchEvent(new CustomEvent('ytintel:late-layers-ready'))}catch{}
}
function setStatus(){const s=$('#status');if(!s)return;s.textContent='v0.30.0 · Core analysis live';s.style.borderColor='rgba(85,226,157,.48)';s.style.color='#9af1c2';s.title=state.enhancement_configured?'The full evidence-first analysis brief is live. GPT-5.6 Sol deepens model-backed stages when the provider is available.':'The full evidence-first analysis brief is live. Cloud model access is optional; unavailable model stages are labelled instead of faked.'}
function relabel(){$$('.sol-badge').forEach(b=>{const card=b.closest('#solIntelligence,#solPattern,.sol-card'),text=(card?.textContent||'').toLowerCase();if(/failed|credit|quota|billing|api key|activate/.test(text))return;b.textContent=state.enhancement_configured?'YTINTEL · ALWAYS-ON + CLOUD ENHANCED':'YTINTEL · ALWAYS-ON INTELLIGENCE'});$$('.sol-title').forEach(h=>{const t=(h.textContent||'').toLowerCase();if(t.includes('max reasoning')||t.includes('activate'))h.textContent='Reading the full evidence set…'})}
function sanitizeErrors(){$$('.error,.sol-offline').forEach(n=>{const t=(n.textContent||'').toLowerCase();if(/credit|quota|billing|insufficient|api key|spend limit|usage limit/.test(t)){if(n.classList.contains('error'))n.textContent='Cloud enhancement is unavailable right now. YTIntel will continue with evidence it can verify.';else{const p=n.querySelector('p.muted');if(p)p.textContent='Cloud enhancement is unavailable right now. YTIntel will continue with evidence it can verify.'}}})}
async function health(){try{const r=await fetch(API+'&t='+Date.now(),{cache:'no-store'}),d=await r.json();if(r.ok&&d)state={...state,...d}}catch{}setStatus();relabel();sanitizeErrors()}
let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;setStatus();relabel();sanitizeErrors()})}
async function init(){await loadLatest();await health();const o=new MutationObserver(refresh);o.observe(document.body,{childList:true,subtree:true,characterData:true});setInterval(health,60000);window.addEventListener('focus',health);window.addEventListener('online',health)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init().catch(e=>console.warn('[YTIntel loader]',e))},{once:true});else init().catch(e=>console.warn('[YTIntel loader]',e));
})();
