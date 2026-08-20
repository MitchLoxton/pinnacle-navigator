(function(){
'use strict';
if(window.__PN_BALUSTRADE_FAB_GUIDANCE__)return;
window.__PN_BALUSTRADE_FAB_GUIDANCE__=true;

/*
  Production safety change (v53.18+):
  Legacy balustrade miter experiments stay disabled. The current issued IFC +
  Navigator's source-backed SHOW ME / CURRENT IFC flow still control production
  geometry and dimensions.

  The 76.1 mm wrap template surfaced below is a workshop fit-up aid for the
  specific same-diameter 90-degree handrail corner being tested. It is not a
  replacement for the issued design or required structural/weld checks.
*/
var PIPE_TEMPLATE_URL='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-761-template';

function removeLegacyExperimentUI(){
  try{
    var box=document.getElementById('pnMiterTemplateBox');
    if(box)box.remove();
  }catch(e){}
}

function addStyle(){
  if(document.getElementById('pnPipeTemplateStyle'))return;
  var s=document.createElement('style');
  s.id='pnPipeTemplateStyle';
  s.textContent='\
html,body{min-height:100%!important}\
@media(max-width:700px){\
  body{padding-bottom:calc(154px + env(safe-area-inset-bottom))!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}\
  #pnPipeTemplateFixed{position:fixed!important;left:10px!important;right:10px!important;bottom:calc(82px + env(safe-area-inset-bottom))!important;z-index:24000!important;min-height:54px!important;margin:0!important;border:2px solid #111!important;border-radius:14px!important;background:#f2c14e!important;color:#111!important;box-shadow:0 6px 18px rgba(0,0,0,.24)!important;font:900 14px/1.05 Arial,sans-serif!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:7px 12px!important;text-align:center!important}\
  #pnPipeTemplateFixed .pnPipeSub{display:block;font-size:9px;font-weight:900;letter-spacing:.05em;margin-top:3px}\
  #pnPipeTemplateTop{display:block!important;margin:10px 0 12px!important;border:2px solid #111!important;border-radius:14px!important;background:#f2c14e!important;color:#111!important;padding:12px 14px!important;box-shadow:0 3px 10px rgba(0,0,0,.10)!important;font-family:Arial,sans-serif!important}\
  #pnPipeTemplateTop .pnPipeTitle{font-size:16px;font-weight:900}\
  #pnPipeTemplateTop .pnPipeDesc{font-size:10px;font-weight:800;line-height:1.35;margin-top:4px}\
  #pnPipeTemplateTop button{width:100%!important;min-height:48px!important;margin:8px 0 0!important;border:0!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:900 13px Arial,sans-serif!important}\
}\
@media(min-width:701px){\
  #pnPipeTemplateTop{display:none!important}\
  #pnPipeTemplateFixed{position:fixed;right:18px;bottom:18px;z-index:24000;border:2px solid #111;border-radius:13px;background:#f2c14e;color:#111;font:900 12px Arial,sans-serif;padding:11px 14px;box-shadow:0 5px 16px rgba(0,0,0,.16)}\
}\
';
  document.head.appendChild(s);
}

function openPipeTemplate(){
  try{
    var w=window.open(PIPE_TEMPLATE_URL,'_blank','noopener');
    if(!w)window.location.href=PIPE_TEMPLATE_URL;
  }catch(e){window.location.href=PIPE_TEMPLATE_URL;}
}

function ensureFixedButton(){
  var b=document.getElementById('pnPipeTemplateFixed');
  if(b)return b;
  b=document.createElement('button');
  b.id='pnPipeTemplateFixed';
  b.type='button';
  b.setAttribute('aria-label','Open 76.1 millimetre one-to-one wrap cutting template');
  b.innerHTML='<span style="font-size:20px">✂</span><span>76.1 PIPE CUT TEMPLATE<span class="pnPipeSub">TAP HERE · PRINT 100% / ACTUAL SIZE</span></span>';
  b.onclick=function(e){if(e){e.preventDefault();e.stopPropagation();}openPipeTemplate();};
  document.body.appendChild(b);
  return b;
}

function topAnchor(){
  return document.querySelector('.liveBar')||document.querySelector('.head')||document.querySelector('.app');
}

function ensureTopButton(){
  if(window.innerWidth>700)return null;
  var x=document.getElementById('pnPipeTemplateTop');
  if(x)return x;
  var a=topAnchor();
  if(!a)return null;
  x=document.createElement('section');
  x.id='pnPipeTemplateTop';
  x.innerHTML='<div class="pnPipeTitle">✂ 76.1 PIPE CUT TEMPLATE</div><div class="pnPipeDesc">1:1 WRAP-AROUND PRINT SHEET FOR THE SAME-DIAMETER 90° CORNER. TAP BELOW.</div><button type="button">OPEN 1:1 TEMPLATE</button>';
  x.querySelector('button').onclick=function(e){if(e){e.preventDefault();e.stopPropagation();}openPipeTemplate();};
  if(a.classList&&a.classList.contains('app'))a.insertBefore(x,a.firstChild);
  else a.insertAdjacentElement('afterend',x);
  return x;
}

function overlayOpen(){
  var ids=['pn522Comms','pn5317CurrentPlan','pn5317Map','pn525Panel','pn528Panel','pn530WhatsNew','pn531Preview','pn539Today','pn5310Guide','pn5335Today'];
  for(var i=0;i<ids.length;i++){
    var el=document.getElementById(ids[i]);
    if(el&&(el.classList.contains('open')||el.getAttribute('aria-hidden')==='false'))return true;
  }
  return false;
}

function repairPhoneScroll(){
  if(window.innerWidth>700||overlayOpen())return;
  try{
    document.documentElement.style.overflowY='auto';
    document.body.style.overflowY='auto';
    document.documentElement.style.touchAction='pan-y';
    document.body.style.touchAction='pan-y';
    if(getComputedStyle(document.body).position==='fixed')document.body.style.position='static';
  }catch(e){}
}

function apply(){
  removeLegacyExperimentUI();
  addStyle();
  ensureFixedButton();
  ensureTopButton();
  repairPhoneScroll();
}

function boot(){
  apply();
  setTimeout(apply,120);
  setTimeout(apply,500);
  setTimeout(apply,1200);
  setTimeout(apply,2600);
  setInterval(function(){if(!document.hidden)apply();},1400);
  try{
    if(window.__pnDiagLog)window.__pnDiagLog(
      'fabrication_helper_pipe_template_live',
      '76.1 pipe template launcher visible; legacy experimental overrides remain disabled.',
      {phase:'fabrication_template'}
    );
  }catch(e){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('pageshow',apply);
window.addEventListener('focus',apply);
document.addEventListener('visibilitychange',function(){if(!document.hidden)apply();});
})();
