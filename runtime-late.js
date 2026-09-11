(function(){
'use strict';
if(window.__PN_RUNTIME_LATE_5377__)return;
window.__PN_RUNTIME_LATE_5377__=true;
var coreStarted=false,extrasStarted=false;
var ROOT='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/';
var BUILD='5377';
function hasSrc(fragment){try{var ss=document.scripts;for(var i=0;i<ss.length;i++)if(String(ss[i].src||'').indexOf(fragment)!==-1)return true;}catch(e){}return false;}
function load(src,key){return new Promise(function(resolve){try{if((key&&window[key])||hasSrc(src.split('?')[0]))return resolve();var s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=resolve;(document.body||document.documentElement).appendChild(s);}catch(e){resolve();}});}
function idle(fn){try{if('requestIdleCallback'in window)return requestIdleCallback(fn,{timeout:900});}catch(e){}return setTimeout(fn,280);}
async function startExtras(){if(extrasStarted)return;extrasStarted=true;await Promise.all([
  load(ROOT+'navigator-v5349-anyone-done?b='+BUILD,'__PN_ANYONE_DONE_5349__'),
  load('./morning-pack.js?v='+BUILD,'__PN_MORNING_PACK_5357__')
]);}
async function startCore(){
  if(coreStarted)return;
  coreStarted=true;
  await Promise.all([
    load('./stability-core.js?v='+BUILD,'__PN_STABILITY_CORE_5366__'),
    load('./fabrication.js?v='+BUILD,'__PN_FABRICATION_STABLE_5352__')
  ]);
  await load('./email-audit.js?v='+BUILD,'__PN_EMAIL_AUDIT_5377__');
  idle(startExtras);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCore,{once:true});else startCore();
window.addEventListener('pageshow',function(){if(!coreStarted)startCore();});
})();
