const VERSION='0.37.8';
const YOUTUBE_HOST=/(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;
const $=s=>document.querySelector(s);

function youtubeUrl(a){
  try{
    const u=new URL(a?.getAttribute?.('href')||'',location.href);
    return /^https?:$/.test(u.protocol)&&YOUTUBE_HOST.test(u.hostname)?u:null;
  }catch{return null}
}

function hardenYoutubeLinks(root=document){
  const links=root?.matches?.('a[href]')?[root]:[...(root?.querySelectorAll?.('a[href]')||[])];
  for(const a of links){
    if(!youtubeUrl(a))continue;
    a.target='_blank';
    const rel=new Set(String(a.rel||'').split(/\s+/).filter(Boolean));
    rel.add('noopener');rel.add('noreferrer');
    a.rel=[...rel].join(' ');
    a.dataset.ytintelExternal='youtube-new-tab';
  }
}

function ensureActiveView(){
  const views=[...document.querySelectorAll('.view')];
  if(!views.length||views.some(v=>v.classList.contains('active')))return;
  const requested=$('[data-tab].on')?.dataset.tab||$('[data-dock].on')?.dataset.dock||'analyse';
  const next=document.getElementById(requested)||document.getElementById('analyse')||views[0];
  next?.classList.add('active');
}

function shellLooksBlank(){
  const app=$('#app');
  if(!app)return false;
  let display='';
  try{display=getComputedStyle(app).display}catch{}
  return app.hidden||app.hasAttribute('hidden')||app.classList.contains('v360-prehide')||display==='none';
}

function coreReady(){
  return !!(window.YTIntelSingleAnalyse||window.YTIntelCreatorAssets||window.YTINTEL_VERSION||window.__YTINTEL_SINGLE_ANALYSE);
}

function restoreShell(reason='lifecycle'){
  hardenYoutubeLinks();
  const app=$('#app');
  if(!app||!coreReady())return false;
  const wasBlank=shellLooksBlank();
  app.hidden=false;
  app.removeAttribute('hidden');
  app.classList.remove('v360-prehide');
  document.body?.classList.remove('v360-prehide');
  document.documentElement.classList.remove('v360-loading');
  ensureActiveView();
  const boot=$('#boot');
  if(boot)boot.remove();
  if(wasBlank){
    document.documentElement.dataset.ytintelRecoveredFrom=reason;
    window.dispatchEvent(new CustomEvent('ytintel:v378-recovered',{detail:{reason,at:new Date().toISOString()}}));
  }
  return true;
}

function install(){
  hardenYoutubeLinks();
  const observer=new MutationObserver(mutations=>{
    for(const m of mutations)for(const n of m.addedNodes||[])if(n?.nodeType===1)hardenYoutubeLinks(n);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('pageshow',e=>{
    queueMicrotask(()=>restoreShell(e.persisted?'pageshow-bfcache':'pageshow-history'));
    setTimeout(()=>restoreShell(e.persisted?'pageshow-bfcache-delayed':'pageshow-history-delayed'),120);
  });
  window.addEventListener('popstate',()=>setTimeout(()=>restoreShell('popstate'),0));
  window.addEventListener('focus',()=>setTimeout(()=>restoreShell('window-focus'),0));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>restoreShell('visibility-return'),0)});

  // Imported after the main app graph: repair a stale shell immediately too.
  restoreShell('module-load');
  window.YTIntelNavigationResilience={version:VERSION,restore:restoreShell,harden:hardenYoutubeLinks};
  window.__YTINTEL_NAV_RESILIENCE={version:VERSION};
  window.dispatchEvent(new CustomEvent('ytintel:v378-ready',{detail:{version:VERSION}}));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
