(function(){
'use strict';
if(window.__PN_TASK_GUIDES_5379__)return;window.__PN_TASK_GUIDES_5379__=true;
var PASSES=[0,180,700,1800];
function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
function findExactish(q){var n=norm(q),els=document.querySelectorAll('h1,h2,h3,h4,strong,b,div,span,p');for(var i=0;i<els.length;i++){var t=norm(els[i].textContent);if(t===n||t.indexOf(n)===0)return els[i]}return null;}
function addStyle(){if(document.getElementById('pnTaskGuideCss5379'))return;var s=document.createElement('style');s.id='pnTaskGuideCss5379';s.textContent='\
#pnTaskGuideT17{margin:14px 0 18px;border:1px solid #dbe4df;border-radius:22px;background:#fff;overflow:hidden;box-shadow:0 12px 34px rgba(16,37,52,.07);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:#10202a}\
#pnTaskGuideT17 .tgHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:18px 20px;background:#102534;color:#fff;border-top:3px solid #d2a63d}\
#pnTaskGuideT17 .tgK{font-size:7px;font-weight:950;letter-spacing:.14em;color:#b9c9d1;margin-bottom:5px}#pnTaskGuideT17 .tgHead h3{margin:0;font-size:20px;line-height:1.05;letter-spacing:-.03em}#pnTaskGuideT17 .tgBadge{flex:0 0 auto;padding:7px 9px;border-radius:999px;background:#fff;color:#102534;font-size:7px;font-weight:950}\
#pnTaskGuideT17 .tgBody{padding:18px 20px}#pnTaskGuideT17 .tgPlain{margin:0 0 14px;font-size:13px;line-height:1.5;font-weight:800;color:#27343c}\
#pnTaskGuideT17 .tgDiagram{border:1px solid #dbe4df;border-radius:18px;background:#f7f9f7;padding:14px}#pnTaskGuideT17 svg{display:block;width:100%;height:auto;max-height:360px}\
#pnTaskGuideT17 .tgChecks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}#pnTaskGuideT17 .tgCheck{padding:11px;border-radius:12px;background:#f4f7f5;border:1px solid #e1e7e4;font-size:9px;line-height:1.4;font-weight:800;color:#43515a}#pnTaskGuideT17 .tgCheck b{display:block;margin-bottom:4px;color:#102534;font-size:8px;letter-spacing:.05em}\
#pnTaskGuideT17 .tgHold{margin-top:12px;padding:11px 12px;border-radius:12px;background:#fff8e8;border:1px solid #eadcb4;color:#6f571d;font-size:9px;line-height:1.45;font-weight:800}\
#pnTaskGuideT17 .tgSource{margin-top:10px;color:#7b868d;font-size:7.5px;line-height:1.45;font-weight:750}\
@media(max-width:700px){#pnTaskGuideT17{border-radius:17px}#pnTaskGuideT17 .tgHead{padding:15px}#pnTaskGuideT17 .tgHead h3{font-size:18px}#pnTaskGuideT17 .tgBody{padding:14px}#pnTaskGuideT17 .tgPlain{font-size:12px}#pnTaskGuideT17 .tgChecks{grid-template-columns:1fr}#pnTaskGuideT17 .tgBadge{display:none}}';document.head.appendChild(s);}
function isT17(){var all=norm(document.body&&document.body.innerText);return all.indexOf('INSTALL THE MODWOOD DECKING')!==-1||all.indexOf('WHOLE TRAY DECK AREA')!==-1||all.indexOf('137×23 MM MODWOOD')!==-1||all.indexOf('137X23 MM MODWOOD')!==-1;}
function host(){var title=findExactish('INSTALL THE MODWOOD DECKING');if(!title)return null;var p=title;for(var i=0;i<7&&p;i++,p=p.parentElement){var t=norm(p.textContent);if(t.indexOf('WHERE')!==-1&&t.indexOf('3 QUICK STEPS')!==-1&&t.length<14000)return p;}return title.parentElement;}
function hideOldDrawing(root){var els=document.querySelectorAll('div,section,h3,h4');for(var i=0;i<els.length;i++){var t=norm(els[i].textContent);if(t==='1 · SIMPLE DRAWING'||t==='1 - SIMPLE DRAWING'){var p=els[i].parentElement;if(p&&p!==root){p.style.display='none';var n=p.nextElementSibling;if(n&&norm(n.textContent).indexOf('DECK BUILD-UP')!==-1)n.style.display='none';}else els[i].style.display='none';}}}
function markup(){return '<section id="pnTaskGuideT17" aria-label="ModWood location guide">'+
'<div class="tgHead"><div><div class="tgK">TASK 17 · LOCATION FIRST</div><h3>Where does the ModWood go?</h3></div><div class="tgBadge">TOP VIEW OF TRUCK</div></div>'+
'<div class="tgBody"><p class="tgPlain">For this task, the ModWood is the <b>flat tray deck surface behind the cab</b> — across the whole tray deck area. The separate ModWood step / stepping-box is a different task.</p>'+
'<div class="tgDiagram"><svg viewBox="0 0 900 430" role="img" aria-label="Top view of truck showing ModWood across the whole tray deck behind the cab">'+
'<defs><pattern id="tgBoards" width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="#d7a957"/><path d="M0 0V34M17 0V34" stroke="#b5883e" stroke-width="2"/></pattern></defs>'+
'<text x="400" y="32" text-anchor="middle" font-size="18" font-weight="900" fill="#5a6972">PASSENGER SIDE · FAR</text>'+
'<text x="400" y="416" text-anchor="middle" font-size="18" font-weight="900" fill="#5a6972">DRIVER SIDE · NEAR</text>'+
'<rect x="110" y="72" width="560" height="290" rx="22" fill="url(#tgBoards)" stroke="#102534" stroke-width="5"/>'+
'<rect x="670" y="112" width="145" height="210" rx="28" fill="#102534"/>'+
'<rect x="692" y="142" width="96" height="56" rx="10" fill="#d9e4e8" opacity=".9"/>'+
'<circle cx="205" cy="370" r="25" fill="#263945"/><circle cx="575" cy="370" r="25" fill="#263945"/><circle cx="205" cy="64" r="25" fill="#263945"/><circle cx="575" cy="64" r="25" fill="#263945"/>'+
'<text x="390" y="182" text-anchor="middle" font-size="25" font-weight="950" fill="#102534">MODWOOD GOES HERE</text>'+
'<text x="390" y="216" text-anchor="middle" font-size="17" font-weight="850" fill="#29404e">WHOLE HORIZONTAL TRAY DECK</text>'+
'<text x="390" y="247" text-anchor="middle" font-size="15" font-weight="800" fill="#4f5d64">behind the cab · across the tray surface</text>'+
'<text x="742" y="238" text-anchor="middle" font-size="18" font-weight="950" fill="#fff">CAB</text><text x="742" y="262" text-anchor="middle" font-size="12" font-weight="850" fill="#bed0d8">FRONT / RIGHT</text>'+
'<path d="M100 217H40" stroke="#102534" stroke-width="5"/><path d="M40 217l18-12v24z" fill="#102534"/><text x="38" y="193" text-anchor="start" font-size="15" font-weight="950" fill="#102534">REAR / SLIDE</text>'+
'</svg></div>'+
'<div class="tgChecks"><div class="tgCheck"><b>1 · BEFORE COVERING</b>Support layout and any hidden work underneath must already be finished / released.</div><div class="tgCheck"><b>2 · KEEP WORKING</b>Do not block drainage or access needed for later balustrade / mesh work.</div><div class="tgCheck"><b>3 · THIS GUIDE IS LOCATION ONLY</b>Board direction, fixing method, gaps and exact setout still come from the current approved detail.</div></div>'+
'<div class="tgHold"><b>Simple rule:</b> if you are unsure whether a piece is part of the tray deck or the separate step / box, stop and check the current approved drawing before cutting or fixing it.</div>'+
'<div class="tgSource">SOURCE BASIS: current Navigator T17 wording shown in the task — “Whole tray deck area — finished ModWood surface”; orientation shown in the task as CAB / FRONT = RIGHT, REAR / SLIDE = LEFT, DRIVER SIDE = NEAR, PASSENGER SIDE = FAR. This diagram does not create new dimensions or connection details.</div></div></section>';}
function apply(){try{addStyle();if(!isT17())return;var h=host();if(!h||document.getElementById('pnTaskGuideT17'))return;h.insertAdjacentHTML('afterend',markup());hideOldDrawing(h);}catch(e){try{console.warn('task guide',e)}catch(_){}}}
for(var i=0;i<PASSES.length;i++)setTimeout(apply,PASSES[i]);document.addEventListener('click',function(){setTimeout(apply,100)},{passive:true});window.addEventListener('pageshow',function(){setTimeout(apply,80)});document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(apply,80)});
})();