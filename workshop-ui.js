(function(){
'use strict';
if(window.__PN_WORKSHOP_UI_5356__)return;
window.__PN_WORKSHOP_UI_5356__=true;

var STYLE_ID='pnWorkshopUiStyle';
var OVERVIEW_ID='pnWorkshopOverview';
var refreshTimer=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function stateSafe(){try{return typeof state!=='undefined'&&state?state:null;}catch(e){return null;}}
function personKey(){var s=stateSafe();try{if(s&&s.currentUser)return String(s.currentUser);}catch(e){}try{return localStorage.getItem('pn_live_person')||'';}catch(e){return '';}}
function personName(){var p=personKey();return p==='me'?'MITCHELL':p==='ronan'?'RONAN':p==='colin'?'COLIN':(p?String(p).toUpperCase():'CREW');}
function currentTask(){
  try{
    if(typeof previewTaskId!=='undefined'&&previewTaskId&&typeof TASKS!=='undefined'&&Array.isArray(TASKS))return TASKS.find(function(x){return x&&x.id===previewTaskId;})||null;
    if(typeof currentPersonTask==='function')return currentPersonTask()||null;
    var s=stateSafe(),p=personKey(),id=s&&s.assignments&&s.assignments[p];
    if(id&&typeof TASKS!=='undefined'&&Array.isArray(TASKS))return TASKS.find(function(x){return x&&x.id===id;})||null;
  }catch(e){}
  return null;
}
function counts(){
  var s=stateSafe(),total=29;
  try{if(typeof TASKS!=='undefined'&&Array.isArray(TASKS)&&TASKS.length)total=TASKS.length;}catch(e){}
  var done=s&&Array.isArray(s.done)?s.done.length:0,skip=s&&Array.isArray(s.skipped)?s.skipped.length:0,holds=s&&s.holds&&typeof s.holds==='object'?Object.keys(s.holds).filter(function(id){return !(s.done||[]).includes(id)&&!(s.skipped||[]).includes(id);}).length:0;
  return {done:done,closed:done+skip,total:total,holds:holds,pct:Math.max(0,Math.min(100,Math.round((done+skip)/Math.max(1,total)*100)))};
}
function pending(){try{var q=JSON.parse(localStorage.getItem('pn_pending_done_stable_v1')||'[]');return Array.isArray(q)?q.length:0;}catch(e){return 0;}}
function findButton(label){var bs=document.querySelectorAll('button');for(var i=0;i<bs.length;i++){var b=bs[i];if(!b||b.closest&&b.closest('#'+OVERVIEW_ID))continue;var t=norm(b.textContent);if(t===label||t.indexOf(label+' ')===0)return b;}return null;}
function clickOriginal(label){var b=findButton(label);if(b){b.click();return true;}return false;}
function openProject(){try{if(typeof window.__pnOpenWorkRegister==='function'){window.__pnOpenWorkRegister();return true;}}catch(e){}return false;}
function openTemplate(){try{if(typeof window.__pnOpenMiter425Template==='function'){window.__pnOpenMiter425Template();return true;}}catch(e){}return false;}
function openToday(){var b=document.getElementById('pn5335TodayBtn')||findButton('TODAY');if(b){b.click();return true;}var m=document.getElementById('pn5335Today');if(m){m.classList.add('open');return true;}return false;}

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
:root{--pn-bg:#efeee8;--pn-surface:#ffffff;--pn-ink:#101214;--pn-muted:#6f706c;--pn-line:#d8d7d0;--pn-steel:#1b2025;--pn-steel2:#2a3137;--pn-amber:#f0b429;--pn-amber-soft:#fff4d7;--pn-green:#237449;--pn-green-soft:#e8f6ed;--pn-red:#9f2d2d;--pn-red-soft:#fff0ef;--pn-blue:#315d78;--pn-blue-soft:#edf5fa;--pn-shadow:0 14px 38px rgba(27,32,37,.10);--pn-radius:18px}
*{box-sizing:border-box}html{background:var(--pn-bg)!important;-webkit-text-size-adjust:100%}body{background:linear-gradient(180deg,#f5f4ef 0,#efeee8 220px,#efeee8 100%)!important;color:var(--pn-ink)!important;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;text-rendering:optimizeLegibility}button,input,textarea,select{font:inherit}button{-webkit-tap-highlight-color:transparent}button:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid rgba(240,180,41,.55)!important;outline-offset:2px!important}.app{width:min(1180px,100%)!important;max-width:1180px!important;margin:0 auto!important;padding:12px clamp(10px,2vw,22px) calc(34px + env(safe-area-inset-bottom))!important}
#pnWorkshopOverview{position:relative;overflow:hidden;background:var(--pn-surface);border:1px solid var(--pn-line);border-radius:22px;box-shadow:var(--pn-shadow);margin:10px 0 14px;padding:15px}#pnWorkshopOverview:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--pn-amber)}.pnUiTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pnUiEyebrow{font-size:9px;font-weight:900;letter-spacing:.13em;color:var(--pn-muted)}.pnUiTask{font-size:clamp(20px,2.6vw,31px);font-weight:950;letter-spacing:-.03em;line-height:1.06;margin-top:4px;max-width:780px}.pnUiMeta{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.pnUiChip{display:inline-flex;align-items:center;gap:5px;min-height:26px;padding:5px 8px;border-radius:999px;background:#f0efea;color:#363a3d;font-size:8px;font-weight:900;letter-spacing:.05em}.pnUiChip.ready{background:var(--pn-green-soft);color:#185d39}.pnUiChip.local{background:var(--pn-amber-soft);color:#71510a}.pnUiChip.hold{background:var(--pn-red-soft);color:#842525}.pnUiProgressWrap{min-width:180px;text-align:right}.pnUiPct{font-size:30px;font-weight:950;letter-spacing:-.05em}.pnUiProgress{height:7px;background:#e6e5de;border-radius:99px;overflow:hidden;margin-top:5px}.pnUiProgress>i{display:block;height:100%;background:var(--pn-green);border-radius:99px}.pnUiProgressText{font-size:8px;font-weight:900;color:var(--pn-muted);margin-top:5px}.pnUiQuick{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;border-top:1px solid #ecebe5;margin-top:12px;padding-top:11px}.pnUiQuick button{min-height:46px;border:1px solid #d7d6cf;border-radius:12px;background:#f8f8f5;color:#202427;font-size:9px;font-weight:900;letter-spacing:.02em;cursor:pointer}.pnUiQuick button:hover{background:#fff;border-color:#aaa}.pnUiQuick .project{background:var(--pn-steel);color:#fff;border-color:var(--pn-steel)}.pnUiQuick .tool{background:var(--pn-amber-soft);border-color:#e8cf8e;color:#5d4207}
#taskCard{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}#pn5323OneStep{background:var(--pn-surface)!important;border:1px solid var(--pn-line)!important;border-radius:22px!important;box-shadow:var(--pn-shadow)!important;overflow:hidden!important;margin:0 0 14px!important}.pn5323Head{position:relative;background:linear-gradient(135deg,var(--pn-steel) 0%,#252c32 100%)!important;color:#fff!important;padding:18px 18px 17px!important}.pn5323Head:before{content:"";position:absolute;left:0;top:0;right:0;height:4px;background:var(--pn-amber)}.pn5323K{font-size:9px!important;letter-spacing:.11em!important;color:#cfd3d5!important;opacity:1!important}.pn5323Title{font-size:clamp(23px,3vw,34px)!important;letter-spacing:-.025em!important;line-height:1.05!important;margin-top:5px!important}.pn5323Progress{font-size:9px!important;color:#aeb4b8!important;letter-spacing:.03em!important}.pn5323Block{border:1px solid #e0dfd9!important;border-left-width:5px!important;border-radius:13px!important;margin:10px 12px 0!important;padding:12px 13px!important;background:#fafaf7!important}.pn5323Block .pn5323Label{font-size:8px!important;letter-spacing:.11em!important;color:#777873!important}.pn5323Block .pn5323Text{font-size:15px!important;font-weight:850!important;line-height:1.4!important;color:#181b1d!important}.pn5323Block:not(.check):not(.done):not(.stop){border-left-color:var(--pn-blue)!important;background:var(--pn-blue-soft)!important}.pn5323Block.check{border-left-color:var(--pn-amber)!important;background:var(--pn-amber-soft)!important}.pn5323Block.check.ok{border-left-color:var(--pn-green)!important;background:var(--pn-green-soft)!important}.pn5323Block.check.hold,.pn5323Block.stop{border-left-color:var(--pn-red)!important;background:var(--pn-red-soft)!important}.pn5323Block.done{border-left-color:var(--pn-green)!important;background:var(--pn-green-soft)!important}.pn5323Actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:12px!important}.pn5323Actions button{min-height:48px!important;border:1px solid #d4d3cd!important;border-radius:12px!important;background:#f4f4f0!important;color:#202326!important;font-size:10px!important;font-weight:900!important;box-shadow:none!important}.pn5323Actions .primary,#pn5323Primary{grid-column:1/-1!important;min-height:60px!important;font-size:13px!important;border:0!important;background:var(--pn-steel)!important;color:#fff!important}.pn5323Actions .primary.pnUiDone,#pn5323Primary.pnUiDone{background:var(--pn-green)!important}.pn5323Actions .primary.pnUiStart,#pn5323Primary.pnUiStart{background:var(--pn-amber)!important;color:#19160c!important}.pn5323Actions .primary.pnUiCheck,#pn5323Primary.pnUiCheck{background:var(--pn-blue)!important}.pn5323Actions .plan{background:#eaf1f5!important;color:#264a60!important;border-color:#c8d6df!important}.pn5323Actions .danger{background:var(--pn-red)!important;color:#fff!important;border-color:var(--pn-red)!important}.pn5323Learn{margin:0 12px 12px!important;border:1px solid #dddcd5!important;border-radius:13px!important;background:#fafaf7!important;padding:12px!important}
#pnAnyDoneBox{margin:12px 0!important;border:1px solid #b8dac6!important;border-radius:16px!important;background:var(--pn-green-soft)!important;padding:11px!important;box-shadow:none!important}#pnAnyDoneTitle{color:#235f3d!important;font-size:8px!important;letter-spacing:.12em!important}#pnAnyDoneBtn{min-height:54px!important;border-radius:12px!important;background:var(--pn-green)!important;font-size:12px!important}#pnAnyDoneSub{font-size:8px!important;color:#587061!important}
#pnBigJobsHome,#pnBigJobsToday{background:var(--pn-surface)!important;border:1px solid var(--pn-line)!important;border-radius:20px!important;box-shadow:0 8px 28px rgba(27,32,37,.07)!important;padding:14px!important}.pnBigHead{align-items:center!important}.pnBigTitle{font-size:20px!important;letter-spacing:-.02em}.pnBigSub{font-size:8px!important}.pnBigRow{padding:9px 0!important}.pnBigNum{background:var(--pn-steel)!important}.pnBigTag{background:#efeee9!important}.pnBigRow.now .pnBigTag{background:var(--pn-green-soft)!important;color:#185d39!important}.pnBigHolds{background:#fbfaf6!important;border:1px solid #e4dfd2!important}.pnToolBtn{min-height:58px!important;border-radius:13px!important;background:var(--pn-steel)!important}.pn5345Open{min-height:54px!important;border-radius:12px!important;background:var(--pn-amber)!important;color:#17150e!important;font-size:10px!important}
#pn5335Today,#pn5345Modal{background:var(--pn-bg)!important}.pn5335Top,.pn5345Top{background:rgba(255,255,255,.96)!important;backdrop-filter:blur(10px);border-bottom:1px solid var(--pn-line)!important;box-shadow:0 5px 18px rgba(27,32,37,.05)!important}.pn5335Body,.pn5345Body{max-width:960px!important;padding:14px 10px calc(32px + env(safe-area-inset-bottom))!important}.pn5335Hero,.pn5345Hero{background:linear-gradient(135deg,var(--pn-steel) 0,#2a3137 100%)!important;border-radius:18px!important;box-shadow:var(--pn-shadow)!important}.pn5335Paid{background:var(--pn-green-soft)!important;color:#195d39!important}.pn5335Open{background:var(--pn-amber)!important;color:#17150e!important;min-height:52px!important}.pn5335Gate{background:var(--pn-red-soft)!important;border-color:#c77d79!important}.pn5335Why,.pn5335Later,.pn5345Job,.pn5345ByOthers{border-color:var(--pn-line)!important;border-radius:14px!important;box-shadow:0 5px 16px rgba(27,32,37,.04)!important}.pn5345Job summary{padding:12px!important}.pn5345Num{background:var(--pn-steel)!important}.pn5345Rule{background:var(--pn-amber-soft)!important;border-color:#e3c468!important}
#pn536Nav{background:rgba(248,248,245,.96)!important;backdrop-filter:blur(14px)!important;border:1px solid #cfcec7!important;border-radius:20px!important;padding:6px!important;box-shadow:0 12px 34px rgba(20,24,27,.18)!important}#pn536Nav button{min-height:56px!important;border-radius:13px!important;background:transparent!important;color:#60615d!important;font-size:8px!important;letter-spacing:.03em!important}#pn536Nav button.active{background:var(--pn-steel)!important;color:#fff!important}#pn536Nav #pn5335TodayBtn{background:var(--pn-amber-soft)!important;color:#5e4308!important}#pn536Nav #pn5335TodayBtn.active{background:var(--pn-amber)!important;color:#17150e!important}#pn536Updates.unread{background:var(--pn-red)!important;color:#fff!important}
#pnPlanOverlay{background:#111416!important}.pnPlanTop{background:#161b1f!important;border-bottom-color:#343b40!important}.pnPlanBody{background:#c9c9c3!important}.pnPlanControls button{border-radius:10px!important}.pnPlanHint{background:#161b1f!important}
#pnStablePending{background:var(--pn-amber)!important;color:#1a170d!important;border:1px solid #d59d13!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}
#pn522Version,#pnUpdateBanner{display:none!important}
summary{cursor:pointer}details[open]>summary{margin-bottom:2px}
@media(min-width:701px){body{padding-bottom:0!important}.pn536HideOldNav{display:revert!important}#pn536Nav{display:none!important}#mainView,#crewView,#tasksView{max-width:1050px!important;margin-left:auto!important;margin-right:auto!important}.pn5323Actions{grid-template-columns:repeat(4,minmax(0,1fr))!important}.pn5323Actions .primary{grid-column:1/-1!important}}
@media(max-width:700px){body{padding-bottom:calc(92px + env(safe-area-inset-bottom))!important}.app{padding:8px 8px calc(28px + env(safe-area-inset-bottom))!important}#pnWorkshopOverview{margin:7px 0 10px;padding:12px 11px 11px;border-radius:17px}.pnUiTop{display:block}.pnUiProgressWrap{margin-top:10px;min-width:0;text-align:left}.pnUiPct{font-size:22px}.pnUiQuick{display:none}.pnUiTask{font-size:21px}.pnUiProgressText{text-align:left}.pn5323Head{padding:15px 13px 14px!important}.pn5323Title{font-size:23px!important}.pn5323Block{margin:8px 8px 0!important;padding:11px!important}.pn5323Block .pn5323Text{font-size:14px!important}.pn5323Actions{padding:8px!important}.pn5323Actions button{min-height:52px!important}.pn5335Top,.pn5345Top{padding-left:10px!important;padding-right:10px!important}.pn5345HeroTitle{font-size:21px!important}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation-duration:.01ms!important}}
`;
  document.head.appendChild(s);
}

function overviewHtml(){
  var t=currentTask(),c=counts(),p=pending(),ready=navigator.onLine,taskLabel=t?(String(t.id||'')+' · '+String(t.title||'CURRENT TASK')):'OPEN MY JOB';
  var status=ready?'READY':'LOCAL READY';
  return '<div class="pnUiTop"><div><div class="pnUiEyebrow">PINNACLE NAVIGATOR · MUNDI POS 1</div><div class="pnUiTask">'+esc(taskLabel)+'</div><div class="pnUiMeta"><span class="pnUiChip '+(ready?'ready':'local')+'">'+status+'</span><span class="pnUiChip">'+esc(personName())+'</span>'+(c.holds?'<span class="pnUiChip hold">'+c.holds+' HOLD'+(c.holds===1?'':'S')+'</span>':'')+(p?'<span class="pnUiChip local">'+p+' SAVED CHANGE'+(p===1?'':'S')+'</span>':'')+'</div></div><div class="pnUiProgressWrap"><div class="pnUiPct">'+c.pct+'%</div><div class="pnUiProgress"><i style="width:'+c.pct+'%"></i></div><div class="pnUiProgressText">'+c.closed+' OF '+c.total+' TASKS CLOSED</div></div></div><div class="pnUiQuick"><button type="button" data-pnui="my">MY JOB</button><button type="button" data-pnui="crew">CREW</button><button type="button" data-pnui="tasks">TASKS</button><button type="button" class="project" data-pnui="project">FULL PROJECT</button><button type="button" class="tool" data-pnui="tool">42.5 TEMPLATE</button></div>';
}
function bindOverview(box){
  if(!box||box.__pnUiBound)return;box.__pnUiBound=true;
  box.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-pnui]'):null;if(!b)return;var k=b.getAttribute('data-pnui');if(k==='my')clickOriginal('MY JOB');else if(k==='crew')clickOriginal('CREW');else if(k==='tasks')clickOriginal('TASKS');else if(k==='project')openProject();else if(k==='tool')openTemplate();setTimeout(schedule,80);});
}
function ensureOverview(){
  var host=document.getElementById('taskCard')||document.querySelector('.taskCard');
  if(!host||!host.parentNode)return null;
  var box=document.getElementById(OVERVIEW_ID);
  if(!box){box=document.createElement('section');box.id=OVERVIEW_ID;host.parentNode.insertBefore(box,host);}
  var html=overviewHtml();if(box.__pnUiHtml!==html){box.__pnUiHtml=html;box.innerHTML=html;box.__pnUiBound=false;bindOverview(box);}else bindOverview(box);
  return box;
}
function paintPrimary(){
  var b=document.getElementById('pn5323Primary');if(!b)return;var t=norm(b.textContent);b.classList.remove('pnUiDone','pnUiStart','pnUiCheck');if(t.indexOf('DONE')>=0||t.indexOf('FINISH')>=0)b.classList.add('pnUiDone');else if(t.indexOf('START')>=0)b.classList.add('pnUiStart');else if(t.indexOf('CHECK')>=0)b.classList.add('pnUiCheck');
}
function polishMobileLabels(){
  var map={pn5335TodayBtn:'TODAY',pn536My:'MY JOB',pn536Crew:'CREW',pn536Tasks:'TASKS',pn536Updates:'UPDATES'};Object.keys(map).forEach(function(id){var b=document.getElementById(id);if(b)b.setAttribute('aria-label',map[id]);});
}
function sync(){
  installStyle();ensureOverview();paintPrimary();polishMobileLabels();
  document.documentElement.classList.toggle('pnUiOffline',!navigator.onLine);
}
function schedule(){if(refreshTimer)clearTimeout(refreshTimer);refreshTimer=setTimeout(function(){refreshTimer=0;sync();},90);}
function boot(){
  sync();[250,800,1800,3500].forEach(function(ms){setTimeout(sync,ms);});
  window.addEventListener('pageshow',sync);window.addEventListener('focus',schedule);window.addEventListener('online',sync);window.addEventListener('offline',sync);window.addEventListener('resize',schedule);
  window.addEventListener('pn-state-changed',sync);window.addEventListener('pn-preflight-changed',sync);window.addEventListener('pn-one-step-rendered',sync);window.addEventListener('pn-stability-status',sync);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)sync();});
  document.addEventListener('click',function(){schedule();},true);
  setInterval(function(){if(!document.hidden)sync();},6000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
