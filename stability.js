(function(){
'use strict';
if(window.__PN_STABILITY_5361__)return;
window.__PN_STABILITY_5361__=true;

var QUEUE_KEY='pn_pending_done_stable_v1';
var READ_CACHE_KEY='pn_read_cache_stable_v2';
var FORCE_DONE='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-force-done';
var realFetch=window.fetch.bind(window);
var flushing=false;

function emit(detail){try{window.dispatchEvent(new CustomEvent('pn-stability-status',{detail:detail||{}}));}catch(e){}}
function readQueue(){try{var q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');return Array.isArray(q)?q:[];}catch(e){return [];}}
function writeQueue(q){try{localStorage.setItem(QUEUE_KEY,JSON.stringify((q||[]).slice(-80)));}catch(e){}emit({pending:(q||[]).length});}
function readCache(){try{var x=JSON.parse(localStorage.getItem(READ_CACHE_KEY)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch(e){return {};}}
function writeCache(x){try{var keys=Object.keys(x||{}).sort(function(a,b){return Number((x[b]||{}).at||0)-Number((x[a]||{}).at||0);}).slice(0,24),out={};keys.forEach(function(k){out[k]=x[k];});localStorage.setItem(READ_CACHE_KEY,JSON.stringify(out));}catch(e){}}
function person(){try{if(typeof state!=='undefined'&&state&&state.currentUser)return String(state.currentUser);}catch(e){}try{return localStorage.getItem('pn_live_person')||'me';}catch(e){return 'me';}}
function pin(){try{return localStorage.getItem('pn_live_pin')||'';}catch(e){return '';}}
function isTaskId(id){return /^T(?:0[1-9]|1[0-9]|2[0-9])$/.test(String(id||''));}
function bodyOf(init){try{return init&&typeof init.body==='string'?JSON.parse(init.body):null;}catch(e){return null;}}
function queueDone(taskId,actor){if(!isTaskId(taskId))return;var q=readQueue();if(!q.some(function(x){return x&&x.taskId===taskId;}))q.push({taskId:taskId,person:actor||person(),at:new Date().toISOString()});writeQueue(q);paintPending();}
function nextOpen(s,after,who){try{var closed=new Set([].concat(s.done||[],s.skipped||[])),holds=s.holds||{},start=Number(String(after).slice(1))||0,order=[],n;for(n=start+1;n<=29;n++)order.push(n);for(n=1;n<=start;n++)order.push(n);for(var i=0;i<order.length;i++){var id='T'+String(order[i]).padStart(2,'0');if(closed.has(id)||holds[id])continue;if((who==='me'||who==='ronan')&&s.assignments&&s.assignments.colin===id)continue;return id;}}catch(e){}return null;}
function applyLocalDone(taskId,actor){
  try{
    if(typeof state==='undefined'||!state||!isTaskId(taskId))return;
    state.done=Array.isArray(state.done)?state.done:[];state.skipped=Array.isArray(state.skipped)?state.skipped:[];state.holds=state.holds&&typeof state.holds==='object'?state.holds:{};state.assignments=state.assignments||{};state.startedByPerson=state.startedByPerson||{};state.lastTaskByPerson=state.lastTaskByPerson||{};
    var people=['me','ronan','colin'],displaced=[];people.forEach(function(p){if(state.assignments[p]===taskId||state.startedByPerson[p]===taskId)displaced.push(p);});
    state.done=state.done.filter(function(x){return x!==taskId;});state.done.push(taskId);state.skipped=state.skipped.filter(function(x){return x!==taskId;});if(state.holds[taskId])delete state.holds[taskId];
    people.forEach(function(p){if(state.assignments[p]===taskId)state.assignments[p]=null;if(state.startedByPerson[p]===taskId)state.startedByPerson[p]=null;});if(state.activeTaskId===taskId)state.activeTaskId=null;
    displaced.forEach(function(p){state.lastTaskByPerson[p]=taskId;if((p==='me'||p==='ronan')&&!state.assignments[p])state.assignments[p]=nextOpen(state,taskId,p);});if(!displaced.length&&(actor==='me'||actor==='ronan')&&!state.assignments[actor])state.assignments[actor]=nextOpen(state,taskId,actor);
    try{if(typeof previewTaskId!=='undefined'&&previewTaskId===taskId)previewTaskId=null;}catch(e){}
  }catch(e){}
}
function applyQueued(){var q=readQueue();for(var i=0;i<q.length;i++)if(q[i]&&isTaskId(q[i].taskId))applyLocalDone(q[i].taskId,q[i].person||person());try{if(typeof renderTask==='function')renderTask();}catch(e){}paintPending();emit({pending:q.length});}
function paintPending(){
  var n=readQueue().length,b=document.getElementById('pnStablePending');if(!n){if(b)b.remove();return;}
  if(!b){b=document.createElement('div');b.id='pnStablePending';b.style.cssText='position:fixed;right:8px;top:8px;z-index:22000;background:#111;color:#fff;border-radius:999px;padding:7px 9px;font:900 9px Arial;box-shadow:0 3px 12px rgba(0,0,0,.18)';document.body.appendChild(b);}b.textContent=n+' CHANGE'+(n===1?'':'S')+' SAVED · AUTO-SYNC';
}
async function postDone(item){var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},6000);try{return await realFetch(FORCE_DONE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectId:'mundi-pos1',pin:pin(),taskId:item.taskId,person:item.person||person()}),cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}}
async function flushQueue(){
  if(flushing||!navigator.onLine||!/^\d{6}$/.test(pin()))return;var q=readQueue();if(!q.length){paintPending();emit({pending:0});return;}flushing=true;var keep=[];
  for(var i=0;i<q.length;i++){var item=q[i];try{var r=await postDone(item),data={};try{data=await r.json();}catch(e){}if(r.status===401){keep=keep.concat(q.slice(i));break;}if(!r.ok||!data.ok){keep=keep.concat(q.slice(i));break;}try{if(data.state&&typeof state!=='undefined')state=data.state;}catch(e){}}catch(e){keep=keep.concat(q.slice(i));break;}}
  writeQueue(keep);flushing=false;paintPending();try{if(!keep.length&&typeof renderTask==='function')renderTask();}catch(e){}emit({pending:keep.length,synced:!keep.length});
}

function readKind(url,payload){
  if(url.indexOf('/navigator-work-register')!==-1)return 'work-register';
  if(url.indexOf('/navigator-daily-plan')!==-1&&payload&&payload.operation==='suggest')return 'today|'+String(payload.workDate||'')+'|'+String(payload.actor||person());
  if(url.indexOf('/navigator-preflight')!==-1&&payload&&payload.operation==='get')return 'preflight|'+String(payload.taskId||'')+'|'+String(payload.actor||person());
  if(url.indexOf('/navigator-sync')!==-1&&payload&&payload.operation==='get')return 'shared-state';
  return '';
}
function cacheRead(key,text,contentType){if(!key||!text||text.length>280000)return;var x=readCache();x[key]={at:Date.now(),body:text,contentType:contentType||'application/json'};writeCache(x);}
function cachedRead(key){var x=readCache(),v=x[key];return v&&typeof v.body==='string'?v:null;}
async function resilientRead(input,init,url,payload,key){
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},7000),opts=Object.assign({},init||{},{signal:controller.signal});
  try{
    var r;try{r=await realFetch(input,opts);}finally{clearTimeout(timer);}
    if(r.ok){try{var clone=r.clone(),text=await clone.text();cacheRead(key,text,r.headers.get('content-type')||'application/json');}catch(e){}emit({fresh:key});return r;}
    if(r.status===400||r.status===401||r.status===403||r.status===404)return r;
    throw new Error('temporary_read_error');
  }catch(e){
    clearTimeout(timer);var c=cachedRead(key);if(!c)throw e;emit({cached:key});return new Response(c.body,{status:200,headers:{'content-type':c.contentType||'application/json','x-pn-local-copy':'1','x-pn-cached-at':String(c.at||'')}});
  }
}

window.fetch=async function(input,init){
  var url='';try{url=typeof input==='string'?input:String(input&&input.url||'');}catch(e){}var payload=bodyOf(init)||{};
  if(url.indexOf('/navigator-force-done')!==-1){
    var taskId=String(payload.taskId||''),actor=String(payload.person||person());
    try{
      var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},6500),opts=Object.assign({},init||{},{signal:controller.signal}),response;try{response=await realFetch(input,opts);}finally{clearTimeout(timer);}if(response.ok||response.status===400||response.status===401)return response;throw new Error('temporary_server_error');
    }catch(e){if(!isTaskId(taskId))throw e;queueDone(taskId,actor);applyLocalDone(taskId,actor);emit({queued:taskId});return new Response(JSON.stringify({ok:true,offlineQueued:true,taskId:taskId,state:(typeof state!=='undefined'?state:null)}),{status:200,headers:{'content-type':'application/json'}});}
  }
  var key=readKind(url,payload);if(key)return resilientRead(input,init,url,payload,key);
  return realFetch(input,init);
};

function normText(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function crewChooserVisible(){try{return normText(document.body&&document.body.innerText).indexOf('WHO IS USING THIS PHONE')!==-1;}catch(e){return false;}}
function crewPinFromPage(){
  try{
    var inputs=document.querySelectorAll('input');
    for(var i=0;i<inputs.length;i++){
      var d=String(inputs[i].value||'').replace(/[^0-9]/g,'').slice(0,6);
      if(/^\d{6}$/.test(d))return d;
    }
  }catch(e){}
  return pin();
}
function showCrewEntryMessage(text,bad){
  var id='pnCrewEntryRescueMsg',m=document.getElementById(id);
  if(!m){m=document.createElement('div');m.id=id;m.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:50000;padding:11px 15px;border-radius:999px;font:900 11px Arial;box-shadow:0 8px 26px rgba(0,0,0,.18);pointer-events:none';document.body.appendChild(m);}
  m.style.background=bad?'#9b3030':'#181d21';m.style.color='#fff';m.textContent=text;
  clearTimeout(m.__hide);m.__hide=setTimeout(function(){try{m.remove();}catch(e){}},2200);
}
function enterCrewFromRescue(key,event){
  if(event){try{event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();}catch(e){}}
  var p=crewPinFromPage();
  if(!/^\d{6}$/.test(p)){
    showCrewEntryMessage('ENTER THE 6-DIGIT CREW PIN FIRST',true);
    try{var inputs=document.querySelectorAll('input');if(inputs[0])inputs[0].focus();}catch(e){}
    return false;
  }
  try{localStorage.setItem('pn_live_pin',p);localStorage.setItem('pn_live_person',key);localStorage.setItem('pn_live_version','v53.54');}catch(e){}
  try{if(typeof state!=='undefined'&&state)state.currentUser=key;}catch(e){}
  showCrewEntryMessage('OPENING '+(key==='me'?'MITCHELL':key==='ronan'?'RONAN':'COLIN')+'…',false);
  var rendered=false;
  try{if(typeof renderTask==='function'){renderTask();rendered=!crewChooserVisible();}}catch(e){}
  try{if(!rendered&&typeof render==='function'){render();rendered=!crewChooserVisible();}}catch(e){}
  if(!rendered)setTimeout(function(){try{location.replace('./?crew='+encodeURIComponent(key)+'&force=5361&t='+Date.now());}catch(e){location.reload();}},120);
  return false;
}
function bindCrewChooser(){
  if(!crewChooserVisible())return false;
  var map={MITCHELL:'me',RONAN:'ronan',COLIN:'colin'},els=document.querySelectorAll('button,[role="button"],[onclick]'),bound=0;
  for(var i=0;i<els.length;i++){
    var el=els[i],t=normText(el.textContent),key='';
    Object.keys(map).some(function(name){if(t===name||t.indexOf(name+' ')===0||t.indexOf(name+'\n')===0){key=map[name];return true;}return false;});
    if(!key||el.__pnCrewRescue)continue;
    el.__pnCrewRescue=true;el.style.cursor='pointer';el.style.pointerEvents='auto';
    (function(node,k){node.addEventListener('click',function(e){enterCrewFromRescue(k,e);},true);node.addEventListener('touchend',function(e){enterCrewFromRescue(k,e);},{capture:true,passive:false});})(el,key);bound++;
  }
  if(bound){
    try{var cards=document.querySelectorAll('button,[role="button"]');for(var j=0;j<cards.length;j++)cards[j].style.pointerEvents='auto';}catch(e){}
    return true;
  }
  return false;
}

function boot(){
  setTimeout(applyQueued,100);setTimeout(applyQueued,500);setTimeout(applyQueued,1200);
  setTimeout(bindCrewChooser,0);setTimeout(bindCrewChooser,120);setTimeout(bindCrewChooser,500);setTimeout(bindCrewChooser,1400);
  document.addEventListener('click',function(){if(crewChooserVisible())setTimeout(bindCrewChooser,0);},true);
  window.addEventListener('online',function(){emit({online:true});flushQueue();});window.addEventListener('offline',function(){emit({online:false});});window.addEventListener('pageshow',function(){applyQueued();flushQueue();bindCrewChooser();});document.addEventListener('visibilitychange',function(){if(!document.hidden){applyQueued();flushQueue();bindCrewChooser();}});setInterval(function(){if(!document.hidden){flushQueue();if(crewChooserVisible())bindCrewChooser();}},12000);emit({online:navigator.onLine,pending:readQueue().length});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();