(function(){
'use strict';

/*
  26 Aug 2026 workshop helper:
  - retire the temporary yellow 76.1 mm template UI;
  - show Mitchell's current big-picture work priorities without changing
    technical task completion or inventing construction details.
*/

var BIG_JOBS=[
  ['SUPPORT TRUCK + TRACTOR','BIGGEST PRIORITY','now'],
  ['2 LADDERS','BIG JOB','next'],
  ['FINISH BIG STEPS','BIG JOB','next'],
  ['DO TRUCK SEAT','BIG JOB','next'],
  ['GET GEAR + BALUSTRADE TO GALVANISING','GRIND / FINISH WELDS / PREP / SEND','galv'],
  ['TIDY UP TRACTOR','BIG JOB','next'],
  ['RUB TRUCK DOWN + PAINT','BIG JOB','next'],
  ['MODWOOD EVERYWHERE','LAST BIG JOB','last']
];

function removeTemplateUI(){
  ['pn5339PipeBtn','pn5339PipeTop','pn5339PipeStyle','pnPipeTemplateFixed','pnPipeTemplateTop','pnPipeTemplateStyle','pnMiterTemplateBox'].forEach(function(id){
    try{var el=document.getElementById(id);if(el)el.remove();}catch(e){}
  });
}

function addBigJobStyle(){
  if(document.getElementById('pnBigJobsStyle'))return;
  var s=document.createElement('style');
  s.id='pnBigJobsStyle';
  s.textContent='\
#pnBigJobsHome,#pnBigJobsToday{background:#fff;border:2px solid #111;border-radius:15px;padding:11px;font-family:Arial,Helvetica,sans-serif;color:#111}\
#pnBigJobsHome{margin:10px 0}\
#pnBigJobsToday{margin:0 0 10px}\
.pnBigHead{display:flex;justify-content:space-between;align-items:end;gap:8px;margin-bottom:6px}\
.pnBigTitle{font-size:17px;font-weight:900;line-height:1.05}.pnBigSub{font-size:8px;font-weight:900;color:#666;letter-spacing:.04em;line-height:1.25;text-align:right}\
.pnBigRow{display:grid;grid-template-columns:25px 1fr auto;gap:7px;align-items:center;border-top:1px solid #e5e5e0;padding:7px 0}\
.pnBigRow:first-of-type{border-top:0}.pnBigNum{width:24px;height:24px;border-radius:50%;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900}.pnBigName{font-size:11px;font-weight:900;line-height:1.15}.pnBigTag{font-size:7px;font-weight:900;border-radius:99px;background:#ecece8;padding:5px 6px;white-space:nowrap}.pnBigRow.now .pnBigTag{background:#dff4e5;color:#173f2a}.pnBigRow.galv .pnBigTag{background:#fff0c7;color:#704d00}.pnBigRow.last .pnBigTag{background:#111;color:#fff}.pnBigNote{border-top:1px solid #e5e5e0;padding-top:7px;margin-top:2px;color:#666;font-size:8px;font-weight:700;line-height:1.35}\
@media(max-width:700px){.pnBigRow{grid-template-columns:24px 1fr}.pnBigTag{grid-column:2;justify-self:start;margin-top:-3px}.pnBigTitle{font-size:16px}}';
  document.head.appendChild(s);
}

function bigJobsMarkup(){
  var h='<div class="pnBigHead"><div class="pnBigTitle">BIG JOBS RIGHT NOW</div><div class="pnBigSub">SITE PRIORITY · 26 AUG 2026<br>MODWOOD LAST</div></div>';
  BIG_JOBS.forEach(function(x,i){
    h+='<div class="pnBigRow '+x[2]+'"><div class="pnBigNum">'+(i+1)+'</div><div class="pnBigName">'+x[0]+'</div><div class="pnBigTag">'+x[1]+'</div></div>';
  });
  h+='<div class="pnBigNote">Big-picture backlog only. These priorities do not mark anything DONE and do not replace the source-backed task cards, drawings, hold points or Colin decisions.</div>';
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
