(function(){
'use strict';
if(window.__PN_RUNTIME_LATE_5367__)return;
window.__PN_RUNTIME_LATE_5367__=true;
var started=false;
var ROOT='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/';
var BUILD='5367';
function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function chooserVisible(){try{return norm(document.body&&document.body.innerText).indexOf('WHO IS USING THIS PHONE')!==-1;}catch(e){return false;}}
function hasSrc(fragment){try{var ss=document.scripts;for(var i=0;i<ss.length;i++)if(String(ss[i].src||'').indexOf(fragment)!==-1)return true;}catch(e){}return false;}
function load(src,key){return new Promise(function(resolve){try{if((key&&window[key])||hasSrc(src.split('?')[0]))return resolve();var s=document.createElement('script');s.src=src;s.async=false;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=resolve;document.body.appendChild(s);}catch(e){resolve();}});}
async function start(){if(started||chooserVisible())return;started=true;await load('./fabrication.js?v='+BUILD,'__PN_FABRICATION_STABLE_5352__');await load(ROOT+'navigator-v5349-anyone-done?b='+BUILD,'__PN_ANYONE_DONE_5349__');await load('./morning-pack.js?v='+BUILD,'__PN_MORNING_PACK_5357__');await load('./stability-core.js?v='+BUILD,'__PN_STABILITY_CORE_5366__');}
setTimeout(start,0);setTimeout(start,900);window.addEventListener('pageshow',function(){setTimeout(start,40);});document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(start,40);});
})();
