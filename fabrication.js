(function(){
'use strict';

/*
  26 Aug 2026 workshop helper:
  - retire temporary 76.1 mm template UI;
  - show Mitchell's current big-picture work priorities;
  - keep the board compact on phones;
  - surface a few high-value release hold points without inventing geometry.
*/

var BIG_JOBS=[
  ['SUPPORT TRUCK + TRACTOR','BIGGEST PRIORITY','now'],
  ['2 LADDERS','BIG JOB','next'],
  ['FINISH BIG STEPS','BIG JOB','next'],
  ['DO TRUCK SEAT','BIG JOB','next'],
  ['GET GEAR + BALUSTRADE TO GALVANISING','PREP + SEND','galv'],
  ['TIDY UP TRACTOR','BIG JOB','next'],
  ['RUB TRUCK DOWN + PAINT','BIG JOB','next'],
  ['MODWOOD EVERYWHERE','LAST BIG JOB','last']
];

function removeTemplateUI(){
  ['pn5339PipeBtn','pn5339PipeTop','pn5339PipeStyle','pnPipeTemplateFixed','pnPipeTemplateTop','pnPipeTemplateStyle','pnMiterTemplateBox','pn5339PipeLoader','pn536PipeLoader'].forEach(function(id){
    try{var el=document.getElementById(id);if(el)el.remove();}catch(e){}
  });
}

function addBigJobStyle(){
  if(document.getElementById('pnBigJobsStyle'))return;
  var s=document.createElement('style');
  s.id='pnBigJobsStyle';
  s.textContent='\
#pnBigJobsHome,#pnBigJobsToday{background:#fff;border:2px solid #111;border-radius:15px;padding:11px;font-family:Arial,Helvetica,sans-serif;color:#111}\
#pnBigJobsHome{margin:10px 0}#pnBigJobsToday{margin:0 0 10px}\
.pnBigHead{display:flex;justify-content:space-between;align-items:flex-end;gap:8px;margin-bottom:6px}.pnBigTitle{font-size:17px;font-weight:900;line-height:1.05}.pnBigSub{font-size:8px;font-weight:900;color:#666;letter-spacing:.04em;line-height:1.25;text-align:right}\
.pnBigRow{display:grid;grid-template-columns:25px 1fr auto;gap:7px;align-items:center;border-top:1px solid #e5e5e0;padding:7px 0}.pnBigRow.first{border-top:0}.pnBigNum{width:24px;height:24px;border-radius:50%;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}.pnBigName{font-size:11px;font-weight:900;line-height:1.15}.pnBigTag{font-size:7px;font-weight:900;border-radius:99px;background:#ecece8;padding:5px 6px;white-space:nowrap}.pnBigRow.now .pnBigTag{background:#dff4e5;color:#173f2a}.pnBigRow.galv .pnBigTag{background:#fff0c7;color:#704d00}.pnBigRow.last .pnBigTag{background:#111;color:#fff}\
.pnBigMore,.pnBigHolds{border-top:1px solid #e5e5e0;padding-top:7px;margin-top:3px}.pnBigMore summary,.pnBigHolds summary{cursor:pointer;font-size:9px;font-weight:900;letter-spacing:.03em}.pnBigHolds{background:#fafaf7;border:1px solid #e1e1dc;border-radius:9px;padding:8px;margin-top:8px}.pnBigHoldItem{font-size:9px;line-height:1.35;padding:5px 0;border-top:1px solid #e6e6e1}.pnBigHoldItem:first-of-type{border-top:0}.pnBigHoldItem b{font-weight:900}.pnBigNote{border-top:1px solid #e5e5e0;padding-top:7px;margin-top:7px;color:#666;font-size:8px;font-weight:700;line-height:1.35}\
@media(max-width:700px){.pnBigRow{grid-template-columns:24px 1fr}.pnBigTag{grid-column:2;justify-self:start;margin-top:-3px}.pnBigTitle{font-size:16px}}';
  document.head.appendChild(s);
}

function rowMarkup(x,i,first){
  return '<div class="pnBigRow '+x[2]+(first?' first':'')+'"><div class="pnBigNum">'+(i+1)+'</div><div class="pnBigName">'+x[0]+'</div><div class="pnBigTag">'+x[1]+'</div></div>';
}

function bigJobsMarkup(){
  var h='<div class="pnBigHead"><div class="pnBigTitle">BIG JOBS RIGHT NOW</div><div class="pnBigSub">SITE PRIORITY · 26 AUG 2026<br>MODWOOD LAST</div></div>';
  BIG_JOBS.slice(0,3).forEach(function(x,i){h+=rowMarkup(x,i,i===0);});
  h+='<details class="pnBigMore"><summary>SHOW ALL 8 BIG JOBS</summary>';
  BIG_JOBS.slice(3).forEach(function(x,j){h+=rowMarkup(x,j+3,false);});
  h+='</details>';
  h+='<details class="pnBigHolds"><summary>CRITICAL HOLD POINTS</summary>'+
    '<div class="pnBigHoldItem"><b>TRUCK + TRACTOR SUPPORTS:</b> priority does not mean guess the supports. Confirm controlling engineering, approved finished level and site set-out before permanent support geometry is committed.</div>'+
    '<div class="pnBigHoldItem"><b>BEFORE GALVANISING:</b> finish only verified required welds, keep intended splits removable, confirm vent/drain and usable galvaniser envelope, and label matching pieces before dispatch.</div>'+
    '<div class="pnBigHoldItem"><b>WELD CLEANUP:</b> remove spatter/sharp unwanted projections as appropriate, but do not grind a structural weld flush or reduce its effective size unless the approved detail/procedure allows it.</div>'+
    '<div class="pnBigHoldItem"><b>PAINT:</b> avoid final coating while known cutting/welding/modification work is still outstanding.</div>'+
    '<div class="pnBigHoldItem"><b>MODWOOD:</b> stays last big job; joists/support level and the approved fixing method must be settled before boards are installed.</div>'+
    '</details>';
  h+='<div class="pnBigNote">Big-picture backlog only. The current task card still controls what the crew is doing now. This board does not mark anything DONE or replace drawings, engineering, hold points or Colin decisions.</div>';
  return h;
}

function ensureHomeBigJobs(){
  var existing=document.getElementById('pnBigJobsHome');
  if(existing)return existing;
  var host=document.getElementById('taskCard')||document.querySelector('.taskCard')||document.getElementById('mainView');
  if(!host||!host.parentNode)return null;
  var box=document.createElement('section');box.id='pnBigJobsHome';box.innerHTML=bigJobsMarkup();
  host.parentNode.insertBefore(box,host);
  return box;
}

function ensureTodayBigJobs(){
  var body=document.getElementById('pn5335Body');
  if(!body)return null;
  var existing=document.getElementById('pnBigJobsToday');
  if(existing&&existing.parentNode===body)return existing;
  if(existing)existing.remove();
  var box=document.createElement('section');box.id='pnBigJobsToday';box.innerHTML=bigJobsMarkup();
  body.insertBefore(box,body.firstChild);
  return box;
}

function apply(){
  removeTemplateUI();
  addBigJobStyle();
  ensureHomeBigJobs();
  ensureTodayBigJobs();
}

function boot(){
  apply();
  setTimeout(apply,120);setTimeout(apply,500);setTimeout(apply,1200);setTimeout(apply,2600);
  try{var observer=new MutationObserver(apply);observer.observe(document.documentElement||document.body,{childList:true,subtree:true});}catch(e){}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('pageshow',apply);
window.addEventListener('focus',apply);
document.addEventListener('visibilitychange',function(){if(!document.hidden)apply();});
})();
