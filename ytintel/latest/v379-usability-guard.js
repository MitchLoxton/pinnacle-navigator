const VERSION='0.37.9-usability';
const root=document.documentElement;
const $=s=>document.querySelector(s);

function removeBlockingOnboarding(){
  const overlay=$('#v350-profile-overlay');
  if(overlay) overlay.remove();
  for(const el of document.querySelectorAll('.profile-overlay')){
    if(el.id==='v350-profile-overlay') el.remove();
  }
}

function ensureShellInteractive(){
  const app=$('#app');
  if(app){
    app.hidden=false;
    app.removeAttribute('hidden');
    app.classList.remove('v360-prehide');
    app.style.pointerEvents='auto';
  }
  document.body?.classList.remove('v360-prehide');
  root.classList.remove('v360-loading');
  removeBlockingOnboarding();
}

function addCreatorDnaHint(){
  const card=$('#creatorCard');
  if(!card||$('#v379-creator-dna-hint')) return;
  const hint=document.createElement('div');
  hint.id='v379-creator-dna-hint';
  hint.className='goodbox';
  hint.style.marginTop='12px';
  hint.innerHTML='<b>Optional setup.</b> Creator DNA improves Make It Yours, but it never blocks Analyse, Vault or Watchtower.';
  card.append(hint);
}

function installHealth(){
  const started=performance.now();
  const navSamples=[];
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('[data-tab],[data-dock]');
    if(!b) return;
    const t0=performance.now();
    requestAnimationFrame(()=>navSamples.push(performance.now()-t0));
  },true);
  requestAnimationFrame(()=>{
    window.__YTINTEL_USABILITY={
      version:VERSION,
      shell_visible_ms:Math.round(performance.now()),
      nav_samples_ms:navSamples,
      blocking_onboarding:false
    };
  });
}

ensureShellInteractive();
addCreatorDnaHint();
installHealth();

const observer=new MutationObserver(()=>{
  ensureShellInteractive();
  addCreatorDnaHint();
});
observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style']});

window.addEventListener('pageshow',ensureShellInteractive);
window.addEventListener('focus',ensureShellInteractive);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)ensureShellInteractive()});

window.YTIntelUsabilityGuard={version:VERSION,repair:ensureShellInteractive};
window.dispatchEvent(new CustomEvent('ytintel:v379-usability-ready',{detail:{version:VERSION}}));
