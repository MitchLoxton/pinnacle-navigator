(function(){
'use strict';
if(window.__PN_FOREMAN_UX_V2__)return;
window.__PN_FOREMAN_UX_V2__=true;

var API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-foreman';
var KEY='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
var PROJECT='mundi-pos1';
var SNAP_KEY='pn_foreman_feed_snapshot_v2';
var feedBusy=false;
var modalObserver=null;

function person(){try{return state&&state.currentUser?String(state.currentUser):'';}catch(e){return '';}}
function pin(){try{if(typeof livePin!=='undefined'&&/^\d{6}$/.test(String(livePin)))return String(livePin);}catch(e){}try{return localStorage.getItem('pn_live_pin')||'';}catch(e){return '';}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function taskTitle(id){try{if(typeof TASKS!=='undefined'&&Array.isArray(TASKS)){var t=TASKS.find(function(x){return x&&x.id===id;});return t&&t.title?String(t.title):'';}}catch(e){}return '';}

function installStyle(){
  if(document.getElementById('pnForemanUxStyle'))return;
  var s=document.createElement('style');s.id='pnForemanUxStyle';s.textContent='\
#pnForemanAlert{position:fixed;z-index:99998;left:10px;right:10px;top:10px;max-width:720px;margin:auto;background:#123e63;color:#fff;border:2px solid #fff;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.38);padding:11px 12px;font-family:Arial,sans-serif}\
#pnForemanAlert .pnFuK{font-size:10px;font-weight:900;letter-spacing:.08em;opacity:.85}#pnForemanAlert .pnFuT{font-size:16px;font-weight:900;line-height:1.2;margin-top:2px}#pnForemanAlert .pnFuB{font-size:12px;line-height:1.35;margin-top:5px;opacity:.96;white-space:pre-wrap}#pnForemanAlert .pnFuBtns{display:flex;gap:7px;margin-top:9px}#pnForemanAlert button{border:0;border-radius:9px;padding:9px 11px;font-weight:900}#pnForemanAlert .pnFuOpen{background:#fff;color:#123e63}#pnForemanAlert .pnFuDismiss{background:#d8e2ea;color:#111}\
#pnForemanModal .pnFmViewport{overflow:auto!important;touch-action:pan-x pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding:10px!important;display:block!important;user-select:none!important;-webkit-user-select:none!important}\
#pnForemanModal .pnFmStage{position:relative!important;left:auto!important;top:auto!important;transform:none!important;transform-origin:top center!important;will-change:auto!important;margin:0 auto 24px!important}\
#pnForemanModal .pnFmMode{position:sticky!important;left:8px!important;bottom:8px!important;display:inline-block!important;width:max-content!important;margin:8px!important}\
#pnForemanModal #pnFmFit,#pnForemanModal #pnFmMinus,#pnForemanModal #pnFmPlus{display:none!important}\
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
  var m=document.getElementById('pnForemanModal');if(!m)return;var pan=m.querySelector('[data-tool="pan"]'),canvas=m.querySelector('#pnFmCanvas'),mode=m.querySelector('#pnFmMode'),hint=m.querySelector('.pnFmHint');
  if(pan)pan.textContent='SCROLL';var scrolling=!!(pan&&pan.classList.contains('active'));
  if(canvas){canvas.style.pointerEvents=scrolling?'none':'auto';}
  if(mode&&scrolling)mode.textContent='SCROLL MODE · swipe up/down';
  if(hint){var readonly=!m.querySelector('.pnFmPublish');hint.textContent=readonly?'Swipe or scroll normally to move through the plan. Colin\'s red markup is frozen to the drawing and moves with it.':'The plan and markup are locked together. Tap SCROLL to swipe up/down through the sheet; choose ARROW, CIRCLE, DRAW, TEXT or ERASER when you want to mark it.';}
}

function reflowMarkup(){
  var m=document.getElementById('pnForemanModal');if(!m)return;var viewport=m.querySelector('#pnFmViewport'),stage=m.querySelector('#pnFmStage'),img=m.querySelector('#pnFmImg');if(!viewport||!stage||!img)return;
  if(img.naturalWidth&&img.naturalHeight){var w=Math.max(240,Math.min(1160,viewport.clientWidth-20)),h=w*(img.naturalHeight/img.naturalWidth);stage.style.setProperty('width',w+'px','important');stage.style.setProperty('height',h+'px','important');}
  syncMarkupMode();
}

function prepareModal(){
  var m=document.getElementById('pnForemanModal');if(!m||m.getAttribute('data-pn-ux')==='1')return;m.setAttribute('data-pn-ux','1');
  var img=m.querySelector('#pnFmImg');if(img)img.addEventListener('load',function(){setTimeout(reflowMarkup,0);});
  m.addEventListener('click',function(){setTimeout(function(){reflowMarkup();syncMarkupMode();},0);},true);
  setTimeout(reflowMarkup,0);setTimeout(reflowMarkup,120);setTimeout(reflowMarkup,450);
}

function observeModals(){
  if(modalObserver)return;modalObserver=new MutationObserver(function(){prepareModal();});modalObserver.observe(document.body,{childList:true,subtree:true});prepareModal();
  window.addEventListener('resize',function(){setTimeout(reflowMarkup,80);},{passive:true});
}

function boot(){installStyle();observeModals();setTimeout(pollFeed,700);setInterval(pollFeed,5000);document.addEventListener('visibilitychange',function(){if(!document.hidden){pollFeed();prepareModal();}});window.addEventListener('pageshow',function(){pollFeed();prepareModal();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
