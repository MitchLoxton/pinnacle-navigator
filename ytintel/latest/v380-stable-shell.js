(()=>{'use strict';
const RELEASE='0.38.0';
const root=document.documentElement;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
let coreReady=false;
let current='analyse';
let releaseValue=RELEASE;

try{Object.defineProperty(window,'YTINTEL_VERSION',{configurable:true,enumerable:true,get:()=>releaseValue,set:v=>{if(String(v)===RELEASE)releaseValue=RELEASE}})}catch{window.YTINTEL_VERSION=RELEASE}

function showShell(){
  const app=$('#app');
  if(app){app.hidden=false;app.removeAttribute('hidden');app.style.pointerEvents='auto'}
  document.body?.classList.remove('v360-prehide');
  root.classList.remove('v360-loading');
  $('#boot')?.remove();
}

function removeBlockers(){
  for(const sel of ['#v350-profile-overlay','#v20Tour','.profile-overlay','.yt-authfix-modal.show']){
    const n=$(sel);if(n)n.remove();
  }
  document.body?.querySelectorAll('[aria-modal="true"]').forEach(n=>{if(!n.closest('#v380-modal'))n.remove()});
}

function switchTab(name){
  const target=document.getElementById(name)||$('#analyse');
  if(!target)return;
  current=target.id;
  $$('.view').forEach(v=>{v.classList.toggle('active',v===target);v.hidden=v!==target});
  $$('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===current));
  $$('[data-dock]').forEach(b=>b.classList.toggle('on',b.dataset.dock===current));
  try{history.replaceState({},'',`#${current}`)}catch{}
  if(current==='vault')window.dispatchEvent(new CustomEvent('ytintel:stable-vault-open'));
  if(current==='competitors')window.dispatchEvent(new CustomEvent('ytintel:stable-competitors-open'));
}

function installNavigation(){
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-tab],[data-dock]');
    if(!b)return;
    const name=b.dataset.tab||b.dataset.dock;
    if(!document.getElementById(name))return;
    e.preventDefault();
    switchTab(name);
  },true);
  const requested=location.hash.replace('#','');
  switchTab(document.getElementById(requested)?requested:'analyse');
}

function setVersion(){
  releaseValue=RELEASE;
  root.dataset.ytintelVersion=RELEASE;
  const v=$('#version');if(v&&v.textContent!==`v${RELEASE}`)v.textContent=`v${RELEASE}`;
}

function failCore(error){
  coreReady=false;
  root.dataset.ytintelCore='failed';
  const status=$('#localMode');if(status)status.textContent='Navigation ready · analysis core needs retry';
  const box=$('#analyseError');if(box){box.textContent=`Analysis core failed to load: ${String(error?.message||error)}. Navigation is still available.`;box.classList.remove('hidden')}
}

function guardAnalyse(){
  const form=$('#analyseForm');if(!form)return;
  form.addEventListener('submit',e=>{
    if(coreReady)return;
    e.preventDefault();
    const box=$('#analyseError');if(box){box.textContent='The analysis engine is still loading. Try again in a moment.';box.classList.remove('hidden')}
  },true);
}

function hardenButtons(){
  $$('button').forEach(b=>{if(!b.hasAttribute('type')&&!b.closest('form'))b.type='button';b.style.pointerEvents='auto'});
  const dock=$('.mobile-dock');if(dock)dock.style.pointerEvents='auto';
  const nav=$('.nav');if(nav)nav.style.pointerEvents='auto';
}

async function loadCore(){
  const status=$('#localMode');if(status)status.textContent='Loading analysis core…';
  try{
    await import('./v340-zero-credit.js?v=0380');
    coreReady=true;
    root.dataset.ytintelCore='ready';
    if(status)status.textContent='Evidence-first core ready';
    setVersion();removeBlockers();hardenButtons();switchTab(current);
    window.dispatchEvent(new CustomEvent('ytintel:v380-core-ready'));
  }catch(error){
    console.error('[YTIntel v0.38] core load failed',error);
    failCore(error);
  }
}

function health(){
  showShell();setVersion();removeBlockers();hardenButtons();
  if(!document.querySelector('.view.active'))switchTab(current||'analyse');
}

setVersion();
const versionNode=$('#version');if(versionNode)new MutationObserver(setVersion).observe(versionNode,{childList:true,subtree:true,characterData:true});
showShell();
removeBlockers();
installNavigation();
guardAnalyse();
hardenButtons();
window.YTIntelStableShell={version:RELEASE,switchTab,repair:health,get coreReady(){return coreReady}};
root.dataset.ytintelShell='stable';
loadCore();
setTimeout(health,250);
setTimeout(health,1200);
window.addEventListener('pageshow',health);
window.addEventListener('focus',health);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)health()});
if('serviceWorker'in navigator){try{navigator.serviceWorker.register('./sw.js?v=0380',{scope:'./'}).catch(()=>null)}catch{}}
})();