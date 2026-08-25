(function(){
'use strict';

/*
  26 Aug 2026: the temporary yellow 76.1 mm compound-cut template launchers
  have been retired from production Navigator. Keep this lightweight cleanup
  in place so any stale DOM left by an older cached build is removed as soon
  as the current helper loads.
*/

function removeTemplateUI(){
  ['pnPipeTemplateFixed','pnPipeTemplateTop','pnPipeTemplateStyle','pnMiterTemplateBox'].forEach(function(id){
    try{
      var el=document.getElementById(id);
      if(el)el.remove();
    }catch(e){}
  });
}

function boot(){
  removeTemplateUI();
  setTimeout(removeTemplateUI,120);
  setTimeout(removeTemplateUI,500);
  setTimeout(removeTemplateUI,1200);
  setTimeout(removeTemplateUI,2600);
  try{
    var observer=new MutationObserver(removeTemplateUI);
    observer.observe(document.documentElement||document.body,{childList:true,subtree:true});
  }catch(e){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('pageshow',removeTemplateUI);
window.addEventListener('focus',removeTemplateUI);
document.addEventListener('visibilitychange',function(){if(!document.hidden)removeTemplateUI();});
})();
