(function(){
'use strict';
if(window.__PN_V51_CORE__) return;
window.__PN_V51_CORE__=true;
var VERSION='v51';
var VERSION_NUMBER=51;
var PROJECT='mundi-pos1';
var DIAG_ENDPOINT='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-client-log';
var PUBLIC_KEY='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
var DIAG_QUEUE_KEY='pn_diag_queue_v51';
var DEVICE_ID_KEY='pn_device_id_v51';
var planZoom=1;
function storageGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function storageSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function deviceId(){var id=storageGet(DEVICE_ID_KEY);if(id)return id;try{id=(crypto&&crypto.randomUUID)?crypto.randomUUID():'dev-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);}catch(e){id='dev-'+Date.now();}storageSet(DEVICE_ID_KEY,id);return id;}
function currentTaskSafe(){try{if(typeof previewTaskId!=='undefined'&&previewTaskId&&typeof TASKS!=='undefined')return TASKS.find(function(x){return x.id===previewTaskId;})||null;return typeof currentPersonTask==='function'?currentPersonTask():null;}catch(e){return null;}}
function personSafe(){try{if(typeof state!=='undefined'&&state&&state.currentUser)return state.currentUser;}catch(e){}return storageGet('pn_live_person')||null;}
function taskIdSafe(){var t=currentTaskSafe();return t&&t.id?t.id:null;}
function cleanMessage(v,max){return String(v==null?'':v).replace(/[\u0000-\u001f]/g,' ').slice(0,max||800);}
function diagDetail(extra){var d={online:navigator.onLine,visibility:document.visibilityState,viewport:String(window.innerWidth)+'x'+String(window.innerHeight),platform:navigator.platform||'',userAgent:(navigator.userAgent||'').slice(0,300),bundle:VERSION};if(extra&&typeof extra==='object')Object.keys(extra).forEach(function(k){var v=extra[k];if(typeof v==='string')d[k]=v.slice(0,300);else if(typeof v==='number'||typeof v==='boolean'||v===null)d[k]=v;});return d;}
function readDiagQueue(){try{var x=JSON.parse(storageGet(DIAG_QUEUE_KEY)||'[]');return Array.isArray(x)?x.slice(-20):[];}catch(e){return [];}}
function writeDiagQueue(q){try{storageSet(DIAG_QUEUE_KEY,JSON.stringify((q||[]).slice(-20)));}catch(e){}}
function makeDiag(eventType,message,detail){return {deviceId:deviceId(),person:personSafe(),eventType:cleanMessage(eventType,40),taskId:taskIdSafe(),appVersion:VERSION,message:cleanMessage(message,1000),detail:diagDetail(detail)};}
async function sendDiag(events){var pin=storageGet('pn_live_pin')||'';if(!/^\d{6}$/.test(pin)||!events||!events.length)return false;var r=await fetch(DIAG_ENDPOINT,{method:'POST',headers:{'content-type':'application/json','apikey':PUBLIC_KEY},body:JSON.stringify({projectId:PROJECT,pin:pin,events:events})});return r.ok;}
function queueDiag(ev){var q=readDiagQueue();q.push(ev);writeDiagQueue(q);}
function logDiag(eventType,message,detail){var ev=makeDiag(eventType,message,detail);if(!navigator.onLine){queueDiag(ev);return;}sendDiag([ev]).then(function(ok){if(!ok)queueDiag(ev);}).catch(function(){queueDiag(ev);});}
async function flushDiag(){var q=readDiagQueue();if(!q.length||!navigator.onLine)return;try{var batch=q.slice(0,10);if(await sendDiag(batch)){q=q.slice(batch.length);writeDiagQueue(q);if(q.length)setTimeout(flushDiag,250);}}catch(e){}}
window.__pnDiagLog=logDiag;
function showUpdateBanner(latest){if(document.getElementById('pnUpdateBanner'))return;var b=document.createElement('div');b.id='pnUpdateBanner';b.innerHTML='<b>NAVIGATOR UPDATE AVAILABLE</b><span>A newer workshop build ('+String(latest)+') is ready. Reopen Navigator when convenient — do not interrupt a task just to update.</span><button type="button">×</button>';b.querySelector('button').onclick=function(){b.remove();};document.body.appendChild(b);logDiag('update_available','New Navigator version available',{reason:String(latest)});}
function checkUpdate(){try{fetch('./version.json?ts='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(v){if(v&&Number(v.version)>VERSION_NUMBER)showUpdateBanner('v'+String(v.version));}).catch(function(){});}catch(e){}}
function installStatusObserver(){var lastStatus='';function bind(){var s=document.getElementById('liveStatus');if(!s||s.__pnV51Observed)return;s.__pnV51Observed=true;lastStatus=(s.textContent||'').trim();new MutationObserver(function(){var now=(s.textContent||'').trim();if(now===lastStatus)return;lastStatus=now;if(/OFFLINE|RECOVERED|PIN NEEDED|MERGING/.test(now))logDiag('sync_status',now,{phase:'live_status'});}).observe(s,{childList:true,subtree:true,characterData:true});}bind();setTimeout(bind,500);new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){for(var j=0;j<ms[i].addedNodes.length;j++){var n=ms[i].addedNodes[j];if(n&&n.nodeType===1&&((n.id==='pnRecovery')||(n.querySelector&&n.querySelector('#pnRecovery')))){var r=document.getElementById('pnRecovery');logDiag('ui_recovery',r?(r.textContent||'Navigator recovered').slice(0,500):'Navigator recovered',{phase:'ui_recovery'});}}}}).observe(document.body,{childList:true,subtree:true});}
function wrapSyncRequest(){try{if(typeof liveRequest!=='function'||liveRequest.__pnV51Wrapped)return;var base=liveRequest;var wrapped=async function(body){try{return await base(body);}catch(e){logDiag('sync_error',e&&e.message?e.message:'Shared-state request failed',{status:e&&e.status?Number(e.status):0,phase:body&&body.operation?String(body.operation):'request'});throw e;}};wrapped.__pnV51Wrapped=true;liveRequest=wrapped;}catch(e){}}
function ensurePlanOverlay(){var existing=document.getElementById('pnPlanOverlay');if(existing)return existing;var o=document.createElement('div');o.id='pnPlanOverlay';o.setAttribute('aria-hidden','true');o.innerHTML='<div class="pnPlanTop"><div><div class="pnPlanTitle">PLAN</div><div id="pnPlanMeta" class="pnPlanMeta">Current issued drawing</div></div><div class="pnPlanControls"><button id="pnPlanMinus" type="button" aria-label="Zoom out">−</button><button id="pnPlanFit" type="button">FIT</button><button id="pnPlanPlus" type="button" aria-label="Zoom in">+</button><button id="pnPlanClose" class="pnPlanClose" type="button">CLOSE ✕</button></div></div><div id="pnPlanBody" class="pnPlanBody"><div id="pnPlanLoading" class="pnPlanLoading">Loading plan…</div><img id="pnPlanImage" alt="Current task plan drawing" draggable="false"></div><div class="pnPlanHint">Drag to move · use + / − to zoom · dimensions still come from the current issued drawing.</div>';document.body.appendChild(o);document.getElementById('pnPlanClose').onclick=closePlan;document.getElementById('pnPlanFit').onclick=function(){planZoom=1;applyPlanZoom();};document.getElementById('pnPlanPlus').onclick=function(){planZoom=Math.min(4,Math.round((planZoom+0.25)*100)/100);applyPlanZoom();};document.getElementById('pnPlanMinus').onclick=function(){planZoom=Math.max(0.5,Math.round((planZoom-0.25)*100)/100);applyPlanZoom();};o.addEventListener('click',function(e){if(e.target===o)closePlan();});return o;}
function applyPlanZoom(){var img=document.getElementById('pnPlanImage');if(img)img.style.width=(planZoom*100)+'%';}
function openPlan(){var o=ensurePlanOverlay();var img=document.getElementById('pnPlanImage');var loading=document.getElementById('pnPlanLoading');var meta=document.getElementById('pnPlanMeta');var t=currentTaskSafe();if(!t){loading.textContent='No current task is available.';loading.className='pnPlanLoading pnPlanError';img.removeAttribute('src');o.classList.add('open');o.setAttribute('aria-hidden','false');logDiag('plan_no_task','PLAN opened without a current task');return;}var src=null;try{src=(typeof IMAGES==='object'&&IMAGES)?(t.plan==='909'?IMAGES['909']:IMAGES['908']):null;}catch(e){src=null;}var rev='';try{rev=(typeof META==='object'&&META)?(' · '+(META.drawing_revision||'')+' · '+(META.drawing_date||'')):'';}catch(e){}meta.textContent='Sheet '+String(t.plan||'908')+rev;planZoom=1;applyPlanZoom();loading.textContent='Loading plan…';loading.className='pnPlanLoading';loading.style.display='block';img.style.display='none';img.onload=function(){loading.style.display='none';img.style.display='block';applyPlanZoom();};img.onerror=function(){loading.style.display='block';loading.textContent='Plan image could not load. Navigator kept your task state safe.';loading.className='pnPlanLoading pnPlanError';img.style.display='none';logDiag('plan_image_error','Plan image failed to load',{phase:'plan_load'});};if(src)img.src=src;else img.onerror();o.classList.add('open');o.setAttribute('aria-hidden','false');document.documentElement.classList.add('pnPlanOpen');logDiag('plan_open','Opened task plan',{phase:'plan_open'});}
function closePlan(){var o=document.getElementById('pnPlanOverlay');if(o){o.classList.remove('open');o.setAttribute('aria-hidden','true');}document.documentElement.classList.remove('pnPlanOpen');}
function installPlanButton(){var b=document.getElementById('planBtn');if(!b||b.__pnV51Bound)return;b.__pnV51Bound=true;b.textContent='PLAN';b.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();openPlan();},true);}
function updateDiagPanel(){var p=document.getElementById('pnDiagPanel');if(!p)return;var t=taskIdSafe()||'—';var who=personSafe()||'—';p.querySelector('.pnDiagText').textContent='v51 · '+(navigator.onLine?'ONLINE':'OFFLINE')+' · '+String(who).toUpperCase()+' · '+t+' · '+window.innerWidth+'×'+window.innerHeight;}
function maybeInstallDiagPanel(){try{var sp=new URLSearchParams(location.search);if(sp.get('diag')!=='1')return;}catch(e){return;}if(document.getElementById('pnDiagPanel'))return;var p=document.createElement('div');p.id='pnDiagPanel';p.innerHTML='<span class="pnDiagText"></span><button type="button">×</button>';p.querySelector('button').onclick=function(){p.remove();};document.body.appendChild(p);updateDiagPanel();setInterval(updateDiagPanel,2000);}
window.addEventListener('error',function(e){logDiag('js_error',e.message||'Browser JavaScript error',{source:e.filename||'',line:e.lineno||0,column:e.colno||0,phase:'window_error'});});
window.addEventListener('unhandledrejection',function(e){var r=e.reason;logDiag('promise_error',r&&r.message?r.message:String(r||'Unhandled promise rejection'),{phase:'unhandled_rejection'});});
window.addEventListener('online',function(){logDiag('online','Device came online');flushDiag();});
window.addEventListener('offline',function(){logDiag('offline','Device went offline');});
window.addEventListener('pageshow',function(){installPlanButton();flushDiag();});
document.addEventListener('visibilitychange',function(){if(!document.hidden){installPlanButton();flushDiag();}});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closePlan();});
function boot(){document.title='Pinnacle Navigator · v51';ensurePlanOverlay();installPlanButton();maybeInstallDiagPanel();installStatusObserver();wrapSyncRequest();flushDiag();checkUpdate();setTimeout(function(){installPlanButton();wrapSyncRequest();logDiag('boot_ok','Navigator v51 opened',{phase:'boot'});},500);setInterval(checkUpdate,300000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(installPlanButton,1000);
})();

/* ===== Deck workflow hotfix: joists must be complete before ModWood ===== */
(function(){
'use strict';
function applyDeckWorkflowFix(){
  try{
    if(window.__PN_DECK_WORKFLOW_FIX__)return true;
    if(typeof TASKS==='undefined'||!Array.isArray(TASKS))return false;
    var byId=function(id){return TASKS.find(function(x){return x&&x.id===id;});};
    var t13=byId('T13'),t16=byId('T16'),t17=byId('T17');
    if(!t13||!t16||!t17)return false;
    t13.title='SET, LEVEL + FIX THE DECK JOISTS';
    t13.action='Set the deck joists in their final positions around the posts, plates and bolts. Establish the correct deck support level from the current issued drawing or a confirmed site dimension, then level and securely fix the joists before moving on.';
    t13.right='Every joist is in its final position, securely fixed, level to the approved deck height, and clear of posts, plates and bolts. Nothing is left loose for the ModWood stage.';
    t13.stop='STOP if the joist height or finished ModWood height relative to the truck is not clearly confirmed, or if a joist clashes with steel or fixings. Do not choose a height by eye — BLOCK / WAIT and confirm it from the issued drawing or with Colin.';
    t13.explain='The ModWood must not be used to set or pull the joists into position. The joists are the support structure, so their final height, level and fixing have to be settled first.';
    t16.title='CHECK JOISTS + DECK LEVEL BEFORE MODWOOD';
    t16.action='Before any ModWood is installed, check that T13 is genuinely complete: every joist is fixed, level, correctly supported and at the approved height. Confirm the support edges, clearances and board fixing conditions from the issued information.';
    t16.right='No loose joists remain. The full support surface is fixed, level and ready to receive ModWood without using the boards to pull the frame into line.';
    t16.stop='STOP if any joist is loose, the finished deck height is unknown, or the ModWood-to-truck height / clearance is not confirmed. Return to T13 and confirm the missing information before continuing.';
    t16.explain='This is the hold point between steelwork and decking. Passing it means the joist structure is actually finished, not just sitting in place.';
    t17.action='Install the ModWood only after the joists are fully fixed and the deck height has been confirmed. Follow the current issued information for board layout, support, gaps and fixings.';
    t17.right='The ModWood is installed onto a fixed, level and verified joist structure at the approved finished deck height.';
    t17.stop='STOP if a board would need to force a loose joist into position, if support is missing, or if finished height or clearance to the truck is uncertain.';
    t17.explain='Decking comes after the steel support is complete. If the joists are still loose or their height is uncertain, the decking task is not ready.';
    window.__PN_DECK_WORKFLOW_FIX__=true;
    try{if(window.__pnDiagLog)window.__pnDiagLog('deck_workflow_fix','Applied joist-before-ModWood workflow correction',{phase:'task_patch'});}catch(_){ }
    return true;
  }catch(e){
    try{if(window.__pnDiagLog)window.__pnDiagLog('deck_workflow_fix_error',e&&e.message?e.message:'Deck workflow patch failed',{phase:'task_patch'});}catch(_){ }
    return false;
  }
}
function refreshDeckWorkflow(){
  if(!applyDeckWorkflowFix())return;
  try{
    var t=typeof currentPersonTask==='function'?currentPersonTask():null;
    if(t&&/^(T13|T16|T17)$/.test(String(t.id||''))&&typeof renderTask==='function')renderTask();
  }catch(e){}
}
refreshDeckWorkflow();
setTimeout(refreshDeckWorkflow,250);
window.addEventListener('pageshow',refreshDeckWorkflow);
document.addEventListener('visibilitychange',function(){if(!document.hidden)refreshDeckWorkflow();});
})();
