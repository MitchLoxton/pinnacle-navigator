(function(){
'use strict';
if(window.__PN_FOREMAN_FIT_ALL_V1__)return;
window.__PN_FOREMAN_FIT_ALL_V1__=true;
var observer=null;
function installStyle(){
  var old=document.getElementById('pnForemanFitAllStyle');if(old)old.remove();
  var s=document.createElement('style');s.id='pnForemanFitAllStyle';s.textContent='\
#pnForemanModal,#pnForemanModal .pnFmPanel{overflow:hidden!important}\
#pnForemanModal .pnFmPanel{height:100dvh!important;max-height:100dvh!important}\
#pnForemanModal .pnFmTop{padding:4px 8px!important;min-height:34px!important}\
#pnForemanModal .pnFmTitle{font-size:13px!important}#pnForemanModal .pnFmSub{font-size:9px!important;margin-top:0!important}\
#pnForemanModal .pnFmClose{padding:6px 9px!important;font-size:10px!important}\
#pnForemanModal .pnFmNoteBar{padding:3px 6px!important}#pnForemanModal .pnFmNoteLabel{font-size:8px!important}\
#pnForemanModal .pnFmTextarea{height:38px!important;min-height:38px!important;margin-top:2px!important;padding:4px 6px!important;font-size:10px!important}\
#pnForemanModal .pnFmReadNote{max-height:40px!important;padding:4px 6px!important;font-size:10px!important;margin-top:2px!important;overflow:hidden!important}\
#pnForemanModal .pnFmTools{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:3px!important;padding:4px!important;overflow:hidden!important;white-space:normal!important;flex:0 0 auto!important;background:#fff!important}\
#pnForemanModal .pnFmTool{min-width:0!important;width:100%!important;padding:7px 2px!important;font-size:9px!important;border-radius:7px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}\
#pnForemanModal [data-tool="pan"],#pnForemanModal #pnFmFit,#pnForemanModal #pnFmMinus,#pnForemanModal #pnFmPlus{display:none!important}\
#pnForemanModal .pnFmViewport{position:relative!important;flex:1 1 auto!important;min-height:0!important;overflow:hidden!important;background:#333!important;padding:0!important;touch-action:none!important}\
#pnForemanModal .pnFmStage{position:absolute!important;left:50%!important;top:50%!important;margin:0!important;transform-origin:center center!important}\
#pnForemanModal .pnFmHint{padding:2px 6px!important;font-size:8px!important;line-height:1.1!important}\
#pnForemanModal .pnFmActions{padding:4px!important;gap:4px!important}#pnForemanModal .pnFmActions button{padding:7px 4px!important;font-size:9px!important}\
#pnForemanModal .pnFmMode{font-size:8px!important;padding:4px 6px!important;left:5px!important;bottom:5px!important}\
@media(max-width:760px){#pnForemanModal .pnFmTools{grid-template-columns:repeat(4,minmax(0,1fr))!important}#pnForemanModal .pnFmTextarea{height:34px!important;min-height:34px!important}}\
';document.head.appendChild(s);
}
function fitNow(){
  var m=document.getElementById('pnForemanModal');if(!m)return;
  var fit=m.querySelector('#pnFmFit');try{if(fit)fit.click();}catch(e){}
  var pub=m.querySelector('.pnFmPublish'),arrow=m.querySelector('[data-tool="arrow"]'),pan=m.querySelector('[data-tool="pan"]');
  if(pub&&arrow){try{if(!arrow.classList.contains('active')||(pan&&pan.classList.contains('active')))arrow.click();}catch(e){}}
  var canvas=m.querySelector('#pnFmCanvas');if(canvas)canvas.style.pointerEvents=pub?'auto':'none';
  var mode=m.querySelector('#pnFmMode');if(mode)mode.textContent=pub?'FULL SHEET FITTED · DRAW DIRECTLY':'FULL SHEET FITTED';
  var hint=m.querySelector('.pnFmHint');if(hint)hint.textContent=pub?'The whole drawing is fitted on screen. Pick a markup tool and draw directly — no pan or zoom is needed.':'The whole marked-up drawing is fitted on screen.';
}
function prepare(){
  installStyle();var m=document.getElementById('pnForemanModal');if(!m)return;
  var img=m.querySelector('#pnFmImg');if(img&&img.getAttribute('data-pn-fit-listener')!=='1'){img.setAttribute('data-pn-fit-listener','1');img.addEventListener('load',function(){setTimeout(fitNow,0);setTimeout(fitNow,80);setTimeout(fitNow,250);});}
  [0,60,180,450].forEach(function(ms){setTimeout(fitNow,ms);});
}
function boot(){installStyle();observer=new MutationObserver(prepare);observer.observe(document.body,{childList:true,subtree:true});prepare();window.addEventListener('resize',function(){setTimeout(fitNow,50);},{passive:true});window.addEventListener('pageshow',prepare);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
