(function(){
'use strict';
if(window.__PN_FOREMAN_UX_V3__)return;
window.__PN_FOREMAN_UX_V3__=true;

var API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-foreman';
var KEY='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
var PROJECT='mundi-pos1';
var SNAP_KEY='pn_foreman_feed_snapshot_v2';
var feedBusy=false;
var modalObserver=null;

function person(){try{return state&&state.currentUser?String(state.currentUser):'';}catch(e){return '';}}
function pin(){try{if(typeof livePin!=='undefined'&&/^\d{6}$/.test(String(livePin)))return String(livePin);}catch(e){}try{return localStorage.getItem('pn_live_pin')||'';}catch(e){return '';}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c];});}
function taskTitle(id){try{if(typeof TASKS!=='undefined'&&Array.isArray(TASKS)){var t=TASKS.find(function(x){return x&&x.id===id;});return t&&t.title?String(t.title):'';}}catch(e){}return '';}

function installStyle(){
  if(document.getElementById('pnForemanUxStyle'))document.getElementById('pnForemanUxStyle').remove();
  var s=document.createElement('style');s.id='pnForemanUxStyle';s.textContent='\
#pnForemanAlert{position:fixed;z-index:99998;left:10px;right:10px;top:10px;max-width:720px;margin:auto;background:#123e63;color:#fff;border:2px solid #fff;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.38);padding:11px 12px;font-family:Arial,sans-serif}\
#pnForemanAlert .pnFuK{font-size:10px;font-weight:900;letter-spacing:.08em;opacity:.85}#pnForemanAlert .pnFuT{font-size:16px;font-weight:900;line-height:1.2;margin-top:2px}#pnForemanAlert .pnFuB{font-size:12px;line-height:1.35;margin-top:5px;opacity:.96;white-space:pre-wrap}#pnForemanAlert .pnFuBtns{display:flex;gap:7px;margin-top:9px}#pnForemanAlert button{border:0;border-radius:9px;padding:9px 11px;font-weight:900}#pnForemanAlert .pnFuOpen{background:#fff;color:#123e63}#pnForemanAlert .pnFuDismiss{background:#d8e2ea;color:#111}\
#pnForemanModal{overflow:hidden!important}\
#pnForemanModal .pnFmPanel{height:100dvh!important;max-height:100dvh!important;overflow:hidden!important;display:flex!important;flex-direction:column!important}\
#pnForemanModal .pnFmTop{padding:4px 8px!important;min-height:34px!important}\
#pnForemanModal .pnFmTitle{font-size:13px!important}#pnForemanModal .pnFmSub{font-size:9px!important;margin-top:0!important}\
#pnForemanModal .pnFmClose{padding:6px 9px!important;font-size:10px!important}\
#pnForemanModal .pnFmNoteBar{padding:3px 6px!important}\
#pnForemanModal .pnFmNoteLabel{font-size:8px!important}\
#pnForemanModal .pnFmTextarea{height:42px!important;min-height:42px!important;margin-top:2px!important;padding:5px 7px!important;font-size:11px!important}\
#pnForemanModal .pnFmReadNote{max-height:44px!important;padding:5px 7px!important;font-size:10px!important;margin-top:2px!important}\
#pnForemanModal .pnFmTools{display:grid!important;grid-template-columns:repeat(11,minmax(0,1fr))!important;gap:3px!important;padding:4px!important;overflow:visible!important;white-space:normal!important;flex:0 0 auto!important;background:#fff!important}\
#pnForemanModal .pnFmTool{min-width:0!important;width:100%!important;padding:7px 2px!important;font-size:9px!important;border-radius:7px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}\
#pnForemanModal #pnFmFit,#pnForemanModal #pnFmMinus,#pnForemanModal #pnFmPlus{display:block!important}\
#pnForemanModal .pnFmViewport{position:relative!important;flex:1 1 auto!important;min-height:0!important;overflow:hidden!important;background:#333!important;touch-action:none!important;overscroll-behavior:none!important;padding:0!important;display:block!important}\
#pnForemanModal .pnFmStage{position:absolute!important;left:50%!important;top:50%!important;margin:0!important;transform-origin:center center!important;will-change:transform!important}\
#pnForemanModal .pnFmMode{position:absolute!important;left:6px!important;bottom:6px!important;margin:0!important}\
#pnForemanModal .pnFmHint{padding:2px 6px!important;font-size:8px!important;line-height:1.15!important}\
#pnForemanModal .pnFmError{font-size:9px!important;padding:0 6px!important}\
#pnForemanModal .pnFmActions{padding:4px!important;gap:4px!important}\
#pnForemanModal .pnFmActions button{padding:7px 5px!important;font-size:10px!important}\
@media(max-width:760px){#pnForemanModal .pnFmTools{grid-template-columns:repeat(4,minmax(0,1fr))!important}#pnForemanModal .pnFmTool{font-size:9px!important;padding:6px 2px!important}#pnForemanModal .pnFmTextarea{height:36px!important;min-height:36px!important}}\
';document.head.appendChild(s);
}

function readSnapshot(){try{var raw=localStorage.getItem(SNAP_KEY);if(!raw)return null;var x=JSON.parse(raw);return x&&x.ready&&x.rows&&typeof x.rows==='object'?x:null;}catch(e){return null;}}
function writeSnapshot(rows){try{localStorage.setItem(SNAP_KEY,JSON.stringify({ready:true,rows:rows,at:new Date().toISOString()}));}catch(e){}}

async function listInstructions(){
  var p=pin();if(!/^\d{6}$/.test(p))return null;
  var r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','apikey':KEY},body:JSON.stringify({projectId:PROJECT,pin:p,actor:person(),operation:'list'})});
  if(!r.ok)return null;var d=await r.json().catch(function(){return null;});return d&&Array.isArray(d.instructions)?d.instructions:null;
}

function openTask(id){
  try{if(typeof previewTaskId!=='undefined')previewTaskId=id;}catch(e){}
  try{if(typeof renderTask==='function')renderTask();}catch(e){}
  setTimeout(function(){var box=document.getElementById('pnForemanBox');if(box&&box.scrollIntoView)box.scrollIntoView({behavior:'smooth',block:'start'});},120);
}

function showAlert(changes){
  if(!changes||!changes.length||person()==='colin')return;
  installStyle();var old=document.getElementById('pnForemanAlert');if(old)old.remove();
  var first=changes[0],more=changes.length-1,removed=first.kind==='removed',title=removed?'Colin removed a foreman instruction':'Colin changed a foreman instruction';
  var detail=(first.taskId||'')+(taskTitle(first.taskId)?' · '+taskTitle(first.taskId):'');
  var body=removed?'The previous instruction for '+first.taskId+' is no longer published.':String(first.note||'').trim();if(body.length>180)body=body.slice(0,177)+'...';if(more>0)body+=(body?'\n':'')+'+'+more+' other foreman change'+(more===1?'':'s')+'.';
  var a=document.createElement('div');a.id='pnForemanAlert';a.innerHTML='<div class="pnFuK">NEW FOREMAN UPDATE</div><div class="pnFuT">'+esc(title)+'</div><div class="pnFuB"><b>'+esc(detail)+'</b>'+(body?'\n'+esc(body):'')+'</div><div class="pnFuBtns">'+(!removed?'<button type="button" class="pnFuOpen">OPEN '+esc(first.taskId)+'</button>':'')+'<button type="button" class="pnFuDismiss">OK</button></div>';
  document.body.appendChild(a);var dis=a.querySelector('.pnFuDismiss');if(dis)dis.onclick=function(){a.remove();};var op=a.querySelector('.pnFuOpen');if(op)op.onclick=function(){a.remove();openTask(first.taskId);};
  try{if(document.hidden&&'Notification' in window&&Notification.permission==='granted'){new Notification('Colin updated '+first.taskId,{body:body||'New foreman instruction available'});}}catch(e){}
}

async function pollFeed(){
  if(feedBusy)return;feedBusy=true;
  try{
    var rows=await listInstructions();if(!rows)return;
    var current={};var byId={};rows.forEach(function(r){if(!r||!r.task_id)return;current[String(r.task_id)]=String(r.updated_at||'');byId[String(r.task_id)]=r;});
    var prev=readSnapshot();if(!prev){writeSnapshot(current);return;}
    var changes=[];
    Object.keys(current).forEach(function(id){if(prev.rows[id]!==current[id]){var r=byId[id]||{};changes.push({kind:prev.rows[id]?'updated':'new',taskId:id,note:r.note_text||'',updatedAt:r.updated_at||''});}});
    Object.keys(prev.rows).forEach(function(id){if(!Object.prototype.hasOwnProperty.call(current,id))changes.push({kind:'removed',taskId:id,note:'',updatedAt:''});});
    writeSnapshot(current);
    if(changes.length){changes.sort(function(a,b){return String(b.updatedAt||'').localeCompare(String(a.updatedAt||''));});showAlert(changes);}
  }catch(e){}finally{feedBusy=false;}
}

function syncMarkupMode(){
  var m=document.getElementById('pnForemanModal');if(!m)return;
  var pan=m.querySelector('[data-tool="pan"]'),mode=m.querySelector('#pnFmMode'),hint=m.querySelector('.pnFmHint');
  if(pan)pan.textContent='PAN / MOVE';
  if(mode&&pan&&pan.classList.contains('active'))mode.textContent='PAN MODE · only needed after zoom';
  if(hint){var readonly=!m.querySelector('.pnFmPublish');hint.textContent=readonly?'The complete marked-up sheet is fitted on screen. Zoom or pan only if you deliberately want a closer look.':'The complete sheet is fitted on screen. Choose ARROW, CIRCLE, DRAW, TEXT or ERASER. PAN / MOVE is only needed after you zoom in.';}
}

function requestFit(){
  try{window.dispatchEvent(new Event('resize'));}catch(e){}
}

function prepareModal(){
  var m=document.getElementById('pnForemanModal');if(!m)return;
  syncMarkupMode();
  if(m.getAttribute('data-pn-fitall')==='1')return;
  m.setAttribute('data-pn-fitall','1');
  var img=m.querySelector('#pnFmImg');if(img)img.addEventListener('load',function(){setTimeout(requestFit,0);setTimeout(requestFit,80);});
  m.addEventListener('click',function(){setTimeout(syncMarkupMode,0);},true);
  setTimeout(requestFit,0);setTimeout(requestFit,120);setTimeout(requestFit,420);
}

function observeModals(){
  if(modalObserver)return;
  modalObserver=new MutationObserver(function(){prepareModal();});
  modalObserver.observe(document.body,{childList:true,subtree:true});
  prepareModal();
  window.addEventListener('resize',function(){setTimeout(syncMarkupMode,0);},{passive:true});
}

function boot(){installStyle();observeModals();setTimeout(pollFeed,700);setInterval(pollFeed,5000);document.addEventListener('visibilitychange',function(){if(!document.hidden){pollFeed();prepareModal();}});window.addEventListener('pageshow',function(){pollFeed();prepareModal();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
