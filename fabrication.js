(function(){
'use strict';
if(window.__PN_BALUSTRADE_FAB_GUIDANCE__)return;
window.__PN_BALUSTRADE_FAB_GUIDANCE__=true;

/*
  Production safety change (v53.18+):
  This file used to override T06/T07 with workshop miter experiments and a
  hard-coded interpretation of an 850 mm dimension. That behaviour is now
  deliberately disabled. The current issued IFC + Navigator's source-backed
  SHOW ME / CURRENT IFC flow control geometry and dimensions.

  Colin's historical 30 / 33 / 36 degree test templates may remain as separate
  files for physical experiments, but they are not production instructions and
  are not automatically surfaced by Navigator.
*/
function removeLegacyExperimentUI(){
  try{
    var box=document.getElementById('pnMiterTemplateBox');
    if(box)box.remove();
  }catch(e){}
}

function boot(){
  removeLegacyExperimentUI();
  try{
    if(window.__pnDiagLog)window.__pnDiagLog(
      'fabrication_helper_source_safe',
      'Legacy balustrade template overrides disabled; current IFC controls production.',
      {phase:'source_safety'}
    );
  }catch(e){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('pageshow',removeLegacyExperimentUI);
document.addEventListener('visibilitychange',function(){if(!document.hidden)removeLegacyExperimentUI();});
new MutationObserver(function(){removeLegacyExperimentUI();}).observe(document.documentElement,{childList:true,subtree:true});
})();
