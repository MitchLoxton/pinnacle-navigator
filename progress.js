(function(){
'use strict';
if(window.__PN_PHONE_PROGRESS__)return;
window.__PN_PHONE_PROGRESS__=true;

var progressTimer=null;
var navObserver=null;
var NAMES={me:'Mitchell',ronan:'Ronan',colin:'Colin'};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function arr(v){return Array.isArray(v)?v:[];}
function taskById(id){try{return typeof TASKS!=='undefined'&&Array.isArray(TASKS)?TASKS.find(function(t){return t&&t.id===id;}):null;}catch(e){return null;}}
function stateSafe(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null;}catch(e){return null;}}
function taskCount(){try{return typeof TASKS!=='undefined'&&Array.isArray(TASKS)?TASKS.length:29;}catch(e){return 29;}}
function taskName(id){var t=taskById(id);return t?(String(t.id||id)+' · '+String(t.title||'')):String(id||'');}
function fmtTime(v){try{return v?new Date(v).toLocaleString():'';}catch(e){return '';}}
function normalizeButtonText(b){return String((b&&b.textContent)||'').toUpperCase().replace(/\s+/g,' ').trim();}
function findButton(re){var bs=Array.prototype.slice.call(document.querySelectorAll('button'));for(var i=0;i<bs.length;i++){if(re.test(normalizeButtonText(bs[i])))return bs[i];}return null;}
function commonNav(){
  var my=findButton(/(^| )MY JOB($| )/),crew=findButton(/(^| )CREW($| )/),tasks=findButton(/(^| )(ALL )?TASKS($| )/);
  if(!my||!crew||!tasks)return null;
  if(my.parentElement&&my.parentElement===crew.parentElement&&my.parentElement===tasks.parentElement)return {nav:my.parentElement,tasks:tasks};
  var p=my.parentElement,depth=0;
  while(p&&p!==document.body&&depth<6){if(p.contains(crew)&&p.contains(tasks))return {nav:p,tasks:tasks};p=p.parentElement;depth++;}
  return null;
}
function cleanButtonClass(s){return String(s||'').split(/\s+/).filter(function(x){return x&&!/^(active|selected|current|on)$/i.test(x);}).join(' ');}

function loadFabricationGuide(){
  try{
    if(window.__PN_BALUSTRADE_FAB_GUIDANCE__||document.getElementById('pnFabricationGuideScript'))return;
    var s=document.createElement('script');s.id='pnFabricationGuideScript';s.src='./fabrication.js?v=1';s.async=false;
    s.onerror=function(){try{if(window.__pnDiagLog)window.__pnDiagLog('fabrication_guidance_load_error','Could not load workshop fabrication guidance',{phase:'support_load'});}catch(e){}};
    document.head.appendChild(s);
  }catch(e){}
}

function installStyle(){
  if(document.getElementById('pnProgressStyle'))return;
  var s=document.createElement('style');s.id='pnProgressStyle';s.textContent='\
#pnProgressOverlay{position:fixed;inset:0;z-index:98000;background:#f4f4f1;color:#111;overflow:auto;-webkit-overflow-scrolling:touch}\
.pnPrTop{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #ccc;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px}.pnPrTitle{font-size:20px;font-weight:900}.pnPrSub{font-size:11px;color:#666;margin-top:2px}.pnPrClose{border:0;border-radius:10px;background:#ddd;color:#111;padding:10px 12px;font-weight:900}.pnPrBody{max-width:680px;margin:auto;padding:12px 12px 90px}.pnPrHero{background:#111;color:#fff;border-radius:16px;padding:16px}.pnPrPct{font-size:44px;line-height:1;font-weight:900}.pnPrHeroText{font-size:13px;margin-top:5px}.pnPrBar{height:12px;background:rgba(255,255,255,.25);border-radius:999px;overflow:hidden;margin-top:12px}.pnPrBar>div{height:100%;background:#fff}.pnPrGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}.pnPrStat{background:#fff;border:1px solid #ddd;border-radius:13px;padding:11px;text-align:center}.pnPrNum{font-size:24px;font-weight:900}.pnPrLab{font-size:9px;font-weight:900;color:#666;letter-spacing:.06em;margin-top:2px}.pnPrSection{background:#fff;border:1px solid #ddd;border-radius:15px;padding:13px;margin-top:10px}.pnPrHead{font-size:12px;font-weight:900;letter-spacing:.06em;color:#555;margin-bottom:7px}.pnPrRow{border-top:1px solid #e4e4e0;padding:9px 0;font-size:13px;line-height:1.35}.pnPrRow:first-of-type{border-top:0}.pnPrWho{font-weight:900}.pnPrMeta{font-size:10px;color:#666;margin-top:2px}.pnPrBlock{border-left:4px solid #9f2626;padding-left:9px}.pnPrEmpty{font-size:12px;color:#777;padding:5px 0}.pnPrLive{display:inline-block;background:#e5f5e9;color:#176b3b;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900;margin-left:5px}.pnPrNavButton{min-width:0}\
@media(max-width:420px){.pnPrBody{padding:9px 9px 88px}.pnPrPct{font-size:38px}.pnPrGrid{gap:6px}.pnPrStat{padding:9px 5px}.pnPrNum{font-size:21px}}';document.head.appendChild(s);
}

function installNav(){
  installStyle();
  var found=commonNav();if(!found)return false;
  var nav=found.nav,tasks=found.tasks,existing=document.getElementById('pnProgressNav');
  if(existing&&existing.parentElement===nav)return true;
  if(existing)existing.remove();
  var b=document.createElement('button');b.type='button';b.id='pnProgressNav';b.className=cleanButtonClass(tasks.className)+' pnPrNavButton';
  var taskStyle=tasks.getAttribute('style');if(taskStyle)b.setAttribute('style',taskStyle);
  b.textContent='PROGRESS';b.setAttribute('aria-label','Progress');
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();openProgress();},true);
  nav.insertBefore(b,tasks);
  try{var cs=getComputedStyle(nav);if(cs.display==='grid')nav.style.gridTemplateColumns='repeat(4,minmax(0,1fr))';else if(cs.display==='flex'){Array.prototype.forEach.call(nav.children,function(x){if(x&&x.tagName==='BUTTON')x.style.flex='1 1 0';});}}catch(e){}
  return true;
}

function renderProgress(){
  var host=document.getElementById('pnProgressContent');if(!host)return;
  var s=stateSafe();if(!s){host.innerHTML='<div class="pnPrSection"><div class="pnPrEmpty">Loading shared progress…</div></div>';return;}
  var total=taskCount(),done=arr(s.done),skipped=arr(s.skipped),closedSet=new Set(done.concat(skipped));
  var holds=s.holds&&typeof s.holds==='object'?s.holds:{};
  var blocked=Object.keys(holds).filter(function(id){return !closedSet.has(id);});
  var closed=closedSet.size,pct=total?Math.round(closed/total*100):0,remaining=Math.max(0,total-closed);
  var assignments=s.assignments&&typeof s.assignments==='object'?s.assignments:{};
  var started=s.startedByPerson&&typeof s.startedByPerson==='object'?s.startedByPerson:{};
  var crew=['me','ronan','colin'].map(function(p){var id=assignments[p]||null;return '<div class="pnPrRow"><span class="pnPrWho">'+esc(NAMES[p])+'</span>'+(id&&started[p]===id?'<span class="pnPrLive">STARTED</span>':'')+'<div>'+esc(id?taskName(id):'FREE')+'</div><div class="pnPrMeta">'+esc(id?(started[p]===id?'Working now':'Recommended'):'No current task')+'</div></div>';}).join('');
  var blocks=blocked.length?blocked.map(function(id){var h=holds[id]||{};return '<div class="pnPrRow pnPrBlock"><div class="pnPrWho">'+esc(taskName(id))+'</div><div>'+esc(h.reason||'Waiting / blocked')+'</div><div class="pnPrMeta">'+esc(h.person?('Blocked by '+h.person):'Needs resolution')+'</div></div>';}).join(''):'<div class="pnPrEmpty">No blocked tasks right now.</div>';
  var acts=arr(s.activity).slice().reverse().slice(0,12);var recent=acts.length?acts.map(function(a){var type=String(a&&a.type||'update').toUpperCase();return '<div class="pnPrRow"><span class="pnPrWho">'+esc(a&&a.person||'Crew')+'</span> · '+esc(type)+' '+esc(a&&a.taskId||'')+(a&&a.reason?'<div>'+esc(a.reason)+'</div>':'')+'<div class="pnPrMeta">'+esc(fmtTime(a&&a.at))+'</div></div>';}).join(''):'<div class="pnPrEmpty">No activity recorded yet.</div>';
  host.innerHTML='<div class="pnPrHero"><div class="pnPrPct">'+pct+'%</div><div class="pnPrHeroText"><b>'+closed+' of '+total+'</b> workflow tasks closed</div><div class="pnPrBar"><div style="width:'+pct+'%"></div></div></div><div class="pnPrGrid"><div class="pnPrStat"><div class="pnPrNum">'+done.length+'</div><div class="pnPrLab">DONE</div></div><div class="pnPrStat"><div class="pnPrNum">'+blocked.length+'</div><div class="pnPrLab">BLOCKED</div></div><div class="pnPrStat"><div class="pnPrNum">'+remaining+'</div><div class="pnPrLab">REMAINING</div></div></div><div class="pnPrSection"><div class="pnPrHead">CREW RIGHT NOW</div>'+crew+'</div><div class="pnPrSection"><div class="pnPrHead">BLOCKED / WAITING</div>'+blocks+'</div><div class="pnPrSection"><div class="pnPrHead">RECENT ACTIVITY</div>'+recent+'</div>';
}

function closeProgress(){var o=document.getElementById('pnProgressOverlay');if(o)o.remove();if(progressTimer){clearInterval(progressTimer);progressTimer=null;}document.documentElement.style.overflow='';document.body.style.overflow='';}
function openProgress(){
  closeProgress();installStyle();
  var o=document.createElement('div');o.id='pnProgressOverlay';o.innerHTML='<div class="pnPrTop"><div><div class="pnPrTitle">PROGRESS</div><div class="pnPrSub">Mundi POS 1 · live shared job</div></div><button type="button" class="pnPrClose">CLOSE</button></div><div class="pnPrBody" id="pnProgressContent"></div>';
  document.body.appendChild(o);document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';o.querySelector('.pnPrClose').onclick=closeProgress;renderProgress();progressTimer=setInterval(renderProgress,1500);
  try{if(window.__pnDiagLog)window.__pnDiagLog('progress_open','Phone progress screen opened',{phase:'progress'});}catch(e){}
}

function boot(){
  loadFabricationGuide();installStyle();installNav();setTimeout(installNav,250);setTimeout(installNav,1000);
  navObserver=new MutationObserver(function(){installNav();});navObserver.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pageshow',function(){loadFabricationGuide();installNav();});document.addEventListener('visibilitychange',function(){if(!document.hidden){loadFabricationGuide();installNav();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
