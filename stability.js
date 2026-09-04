(function(){
'use strict';
if(window.__PN_STABILITY_5354__)return;
window.__PN_STABILITY_5354__=true;

var QUEUE_KEY='pn_pending_done_stable_v1';
var FORCE_DONE='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-force-done';
var realFetch=window.fetch.bind(window);
var flushing=false;

function readQueue(){
  try{var q=JSON.parse(localStorage.getItem(QUEUE_KEY)||'[]');return Array.isArray(q)?q:[];}catch(e){return [];}
}
function writeQueue(q){try{localStorage.setItem(QUEUE_KEY,JSON.stringify((q||[]).slice(-80)));}catch(e){}}
function person(){try{if(typeof state!=='undefined'&&state&&state.currentUser)return String(state.currentUser);}catch(e){}try{return localStorage.getItem('pn_live_person')||'me';}catch(e){return 'me';}}
function pin(){try{return localStorage.getItem('pn_live_pin')||'';}catch(e){return '';}}
function isTaskId(id){return /^T(?:0[1-9]|1[0-9]|2[0-9])$/.test(String(id||''));}
function queueDone(taskId,actor){if(!isTaskId(taskId))return;var q=readQueue();if(!q.some(function(x){return x&&x.taskId===taskId;}))q.push({taskId:taskId,person:actor||person(),at:new Date().toISOString()});writeQueue(q);paintPending();}
function nextOpen(s,after,who){try{var closed=new Set([].concat(s.done||[],s.skipped||[])),holds=s.holds||{},start=Number(String(after).slice(1))||0,order=[],n;for(n=start+1;n<=29;n++)order.push(n);for(n=1;n<=start;n++)order.push(n);for(var i=0;i<order.length;i++){var id='T'+String(order[i]).padStart(2,'0');if(closed.has(id)||holds[id])continue;if((who==='me'||who==='ronan')&&s.assignments&&s.assignments.colin===id)continue;return id;}}catch(e){}return null;}
function applyLocalDone(taskId,actor){
  try{
    if(typeof state==='undefined'||!state||!isTaskId(taskId))return;
    state.done=Array.isArray(state.done)?state.done:[];
    state.skipped=Array.isArray(state.skipped)?state.skipped:[];
    state.holds=state.holds&&typeof state.holds==='object'?state.holds:{};
    state.assignments=state.assignments||{};
    state.startedByPerson=state.startedByPerson||{};
    state.lastTaskByPerson=state.lastTaskByPerson||{};
    var people=['me','ronan','colin'],displaced=[];
    people.forEach(function(p){if(state.assignments[p]===taskId||state.startedByPerson[p]===taskId)displaced.push(p);});
    state.done=state.done.filter(function(x){return x!==taskId;});state.done.push(taskId);
    state.skipped=state.skipped.filter(function(x){return x!==taskId;});
    if(state.holds[taskId])delete state.holds[taskId];
    people.forEach(function(p){if(state.assignments[p]===taskId)state.assignments[p]=null;if(state.startedByPerson[p]===taskId)state.startedByPerson[p]=null;});
    if(state.activeTaskId===taskId)state.activeTaskId=null;
    displaced.forEach(function(p){state.lastTaskByPerson[p]=taskId;if((p==='me'||p==='ronan')&&!state.assignments[p])state.assignments[p]=nextOpen(state,taskId,p);});
    if(!displaced.length&&(actor==='me'||actor==='ronan')&&!state.assignments[actor])state.assignments[actor]=nextOpen(state,taskId,actor);
    try{if(typeof previewTaskId!=='undefined'&&previewTaskId===taskId)previewTaskId=null;}catch(e){}
  }catch(e){}
}
function applyQueued(){var q=readQueue();for(var i=0;i<q.length;i++)if(q[i]&&isTaskId(q[i].taskId))applyLocalDone(q[i].taskId,q[i].person||person());try{if(typeof renderTask==='function')renderTask();}catch(e){}paintPending();}
function paintPending(){
  var n=readQueue().length,b=document.getElementById('pnStablePending');
  if(!n){if(b)b.remove();return;}
  if(!b){b=document.createElement('div');b.id='pnStablePending';b.style.cssText='position:fixed;right:8px;top:8px;z-index:22000;background:#111;color:#fff;border-radius:999px;padding:7px 9px;font:900 9px Arial;box-shadow:0 3px 12px rgba(0,0,0,.18)';document.body.appendChild(b);}
  b.textContent=n+' CHANGE'+(n===1?'':'S')+' SAVED · AUTO-SYNC';
}
async function postDone(item){
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},6000);
  try{return await realFetch(FORCE_DONE,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({projectId:'mundi-pos1',pin:pin(),taskId:item.taskId,person:item.person||person()}),cache:'no-store',signal:controller.signal});}finally{clearTimeout(timer);}
}
async function flushQueue(){
  if(flushing||!navigator.onLine||!/^\d{6}$/.test(pin()))return;
  var q=readQueue();if(!q.length){paintPending();return;}
  flushing=true;var keep=[];
  for(var i=0;i<q.length;i++){
    var item=q[i];
    try{
      var r=await postDone(item),data={};try{data=await r.json();}catch(e){}
      if(r.status===401){keep=keep.concat(q.slice(i));break;}
      if(!r.ok||!data.ok){keep=keep.concat(q.slice(i));break;}
      try{if(data.state&&typeof state!=='undefined')state=data.state;}catch(e){}
    }catch(e){keep=keep.concat(q.slice(i));break;}
  }
  writeQueue(keep);flushing=false;paintPending();
  try{if(!keep.length&&typeof renderTask==='function')renderTask();}catch(e){}
}
function bodyOf(init){try{return init&&typeof init.body==='string'?JSON.parse(init.body):null;}catch(e){return null;}}
window.fetch=async function(input,init){
  var url='';try{url=typeof input==='string'?input:String(input&&input.url||'');}catch(e){}
  if(url.indexOf('/navigator-force-done')===-1)return realFetch(input,init);
  var payload=bodyOf(init)||{},taskId=String(payload.taskId||''),actor=String(payload.person||person());
  try{
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},6500),opts=Object.assign({},init||{},{signal:controller.signal});
    var response;
    try{response=await realFetch(input,opts);}finally{clearTimeout(timer);}
    if(response.ok||response.status===400||response.status===401)return response;
    throw new Error('temporary_server_error');
  }catch(e){
    if(!isTaskId(taskId))throw e;
    queueDone(taskId,actor);applyLocalDone(taskId,actor);
    return new Response(JSON.stringify({ok:true,offlineQueued:true,taskId:taskId,state:(typeof state!=='undefined'?state:null)}),{status:200,headers:{'content-type':'application/json'}});
  }
};
function boot(){
  setTimeout(applyQueued,100);setTimeout(applyQueued,500);setTimeout(applyQueued,1200);
  window.addEventListener('online',flushQueue);
  window.addEventListener('pageshow',function(){applyQueued();flushQueue();});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){applyQueued();flushQueue();}});
  setInterval(function(){if(!document.hidden)flushQueue();},10000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
