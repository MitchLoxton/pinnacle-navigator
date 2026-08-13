(function(){
'use strict';
if(window.__PN_COLIN_FLOW_V2__)return;
window.__PN_COLIN_FLOW_V2__=true;

var API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/navigator-foreman';
var KEY='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
var PROJECT='mundi-pos1';
var FLOW=[
 {id:'T14',n:'01',title:'CONFIRM SLIDE-TO-TRUCK CONNECTION',crew:[],foreman:[]},
 {id:'T02',n:'02',title:'CHECK NET-SIDE CONNECTION SPACE',crew:['T01'],foreman:[]},
 {id:'T03',n:'03',title:'VERIFY SETOUT + REAL HOLES',crew:['T01'],foreman:['T02']},
 {id:'T13',n:'04',title:'CHECK JOIST ARRANGEMENT',crew:['T05'],foreman:['T03']},
 {id:'T06',n:'05',title:'APPROVE UPRIGHT JOINT PREP TEST',crew:['T05'],foreman:['T03']},
 {id:'T07',n:'06',title:'APPROVE TOP RAIL FIT + 850 mm',crew:['T06'],foreman:['T06']},
 {id:'T08',n:'07',title:'CONFIRM REMOVABLE GALVANISING SPLITS',crew:['T07'],foreman:['T07']},
 {id:'T09',n:'08',title:'RESOLVE BOTTOM SS GUIDE-WIRE ENDS',crew:['T06'],foreman:['T06']},
 {id:'T12',n:'09',title:'CONFIRM GALVANISER VENT / DRAIN + SEND',crew:['T11'],foreman:['T08','T09']},
 {id:'T16',n:'10',title:'CONFIRM DECK BUILD-UP + MODWOOD METHOD',crew:['T13','T15','T11'],foreman:['T12','T13','T14']},
 {id:'T17',n:'11',title:'APPROVE MODWOOD INSTALLATION',crew:['T16'],foreman:['T16']},
 {id:'T19',n:'12',title:'CONFIRM SS MESH SUPPORT / SYSTEM',crew:['T18'],foreman:['T17']},
 {id:'T20',n:'13',title:'CONFIRM GUIDE WIRE / LACING / TENSION',crew:['T19','T09'],foreman:['T19','T09']},
 {id:'T23',n:'14',title:'CONFIRM CAB ACCESS LADDER / STEP',crew:['T22'],foreman:[]},
 {id:'T28',n:'15',title:'PLAY-SAFETY INSPECTION + RECTIFICATIONS',crew:['T20','T21','T23','T24','T27','T15'],foreman:['T20','T23']},
 {id:'T29',n:'16',title:'FINAL PLAN / REVISION / HANDOVER CHECK',crew:['T28'],foreman:['T28']}
];
var completed=[];var busy=false;var expanded=false;

function person(){try{return state&&state.currentUser?String(state.currentUser):'';}catch(e){return '';}}
function pin(){try{if(typeof livePin!=='undefined'&&/^\d{6}$/.test(String(livePin)))return String(livePin);}catch(e){}try{return localStorage.getItem('pn_live_pin')||'';}catch(e){return '';}}
function closed(id){try{return !!(state&&(((state.done||[]).indexOf(id)>=0)||((state.skipped||[]).indexOf(id)>=0));}catch(e){return false;}}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function isDone(id){return completed.indexOf(id)>=0;}
function waiting(step){var miss=[];step.foreman.forEach(function(id){if(!isDone(id))miss.push('Colin '+id);});step.crew.forEach(function(id){if(!closed(id))miss.push('crew '+id);});return miss;}
function ready(step){return !isDone(step.id)&&waiting(step).length===0;}
function nextStep(){return FLOW.find(ready)||FLOW.find(function(x){return !isDone(x.id);})||null;}
function doneCount(){return FLOW.filter(function(x){return isDone(x.id);}).length;}

async function req(operation,extra){
  var p=pin();if(!/^\d{6}$/.test(p))throw new Error('Crew PIN is required');
  var r=await fetch(API,{method:'POST',headers:{'content-type':'application/json','apikey':KEY},body:JSON.stringify(Object.assign({projectId:PROJECT,pin:p,actor:person(),operation:operation},extra||{}))});
  var d=await r.json().catch(function(){return {};});if(!r.ok){var e=new Error(d.error||'Foreman workflow request failed');e.status=r.status;throw e;}return d;
}

function installStyle(){
  if(document.getElementById('pnColinFlowStyle'))document.getElementById('pnColinFlowStyle').remove();
  var s=document.createElement('style');s.id='pnColinFlowStyle';s.textContent='\
#pnColinFlow{position:sticky;top:6px;z-index:9000;margin:8px 0 10px;background:#101820;color:#fff;border:2px solid #fff;border-radius:14px;box-shadow:0 5px 18px rgba(0,0,0,.28);font-family:Arial,sans-serif;overflow:hidden}#pnColinFlow .pcfHead{display:flex;align-items:center;gap:8px;padding:8px 9px}.pcfMain{min-width:0;flex:1}.pcfK{font-size:9px;font-weight:900;letter-spacing:.08em;opacity:.72}.pcfNext{font-size:13px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pcfProg{font-size:10px;opacity:.78;margin-top:2px}.pcfBtn{border:0;border-radius:9px;padding:9px 10px;font-size:11px;font-weight:900;background:#fff;color:#111}.pcfBtn.primary{background:#f2c14e}.pcfBody{border-top:1px solid #4b5560;background:#f4f4f0;color:#111;padding:6px;max-height:58vh;overflow:auto}.pcfRow{display:grid;grid-template-columns:30px 1fr auto;gap:7px;align-items:center;border:1px solid #ccc;background:#fff;border-radius:9px;padding:6px 7px;margin:4px 0;min-height:43px}.pcfRow.done{opacity:.58}.pcfRow.ready{border:2px solid #26734d}.pcfNum{font-size:11px;font-weight:900}.pcfTitle{font-size:11px;font-weight:900;line-height:1.2}.pcfState{font-size:9px;font-weight:900;margin-top:2px}.pcfState.ready{color:#26734d}.pcfState.wait{color:#805b00}.pcfOpen{border:0;background:#e7e7e2;border-radius:7px;padding:7px 8px;font-size:10px;font-weight:900}.pcfFoot{display:flex;gap:6px;padding:6px}.pcfFoot button{flex:1;border:0;border-radius:8px;padding:8px;font-size:10px;font-weight:900}.pcfComplete{background:#26734d;color:#fff}.pcfReset{background:#fee;color:#8d2020}.pcfMsg{font-size:10px;font-weight:900;padding:0 7px 6px;color:#8d2020}\
#pnForemanModal .pnFmTools{display:grid!important;grid-template-columns:repeat(11,minmax(0,1fr))!important;gap:3px!important;padding:4px!important;overflow:visible!important;white-space:normal!important}#pnForemanModal .pnFmTool{min-width:0!important;width:100%!important;padding:7px 2px!important;font-size:9px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#pnForemanModal #pnFmFit,#pnForemanModal #pnFmMinus,#pnForemanModal #pnFmPlus{display:block!important}\
@media(max-width:760px){#pnForemanModal .pnFmTools{grid-template-columns:repeat(4,minmax(0,1fr))!important}}\
';document.head.appendChild(s);
}

function clearColinAssignment(persist){
  try{if(!state||state.startedByPerson&&state.startedByPerson.colin)return false;if(state.assignments&&state.assignments.colin){state.assignments.colin=null;if(persist&&typeof save==='function')setTimeout(function(){try{save();}catch(e){}},0);return true;}}catch(e){}return false;
}
function wrapAuto(){
  try{if(typeof autoFillTeam!=='function'||autoFillTeam.__pnColinFlow)return;var base=autoFillTeam;var w=function(){var out=base.apply(this,arguments);clearColinAssignment(true);return out;};w.__pnColinFlow=true;autoFillTeam=w;window.autoFillTeam=w;}catch(e){}
}
function openTask(id){try{if(typeof previewTaskId!=='undefined')previewTaskId=id;if(typeof renderTask==='function')renderTask();if(typeof hideAllPrimaryViews==='function')hideAllPrimaryViews();var mv=document.getElementById('mainView');if(mv)mv.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}catch(e){}}

function ensure(){
  installStyle();
  if(person()!=='colin'){var old=document.getElementById('pnColinFlow');if(old)old.remove();return;}
  clearColinAssignment(false);
  var host=document.querySelector('.app')||document.body,box=document.getElementById('pnColinFlow');
  if(!box){box=document.createElement('div');box.id='pnColinFlow';host.insertBefore(box,host.firstChild);}
  render();
}
function render(){
  var box=document.getElementById('pnColinFlow');if(!box||person()!=='colin')return;
  var nx=nextStep(),cnt=doneCount(),wait=nx?waiting(nx):[];
  box.innerHTML='<div class="pcfHead"><div class="pcfMain"><div class="pcfK">COLIN · FOREMAN ORDER OF WORKS</div><div class="pcfNext">'+(nx?esc(nx.n+' · '+nx.title):'ALL FOREMAN STEPS COMPLETE')+'</div><div class="pcfProg">'+cnt+' / '+FLOW.length+' complete'+(nx&&wait.length?' · waiting: '+esc(wait.join(', ')):'')+'</div></div>'+(nx?'<button class="pcfBtn primary" id="pcfNext">OPEN NEXT</button>':'')+'<button class="pcfBtn" id="pcfToggle">'+(expanded?'HIDE':'LIST')+'</button></div>'+(expanded?bodyHtml():'');
  var t=box.querySelector('#pcfToggle');if(t)t.onclick=function(){expanded=!expanded;render();};var n=box.querySelector('#pcfNext');if(n&&nx)n.onclick=function(){openTask(nx.id);};box.querySelectorAll('[data-open]').forEach(function(b){b.onclick=function(){openTask(b.getAttribute('data-open'));};});var c=box.querySelector('#pcfComplete');if(c&&nx)c.onclick=function(){complete(nx.id);};var r=box.querySelector('#pcfReset');if(r)r.onclick=resetFlow;
}
function bodyHtml(){
  var nx=nextStep(),rows=FLOW.map(function(s){var d=isDone(s.id),r=ready(s),miss=waiting(s),st=d?'DONE':r?'READY':'WAITING · '+miss.join(', ');return '<div class="pcfRow '+(d?'done':r?'ready':'')+'"><div class="pcfNum">'+esc(s.n)+'</div><div><div class="pcfTitle">'+esc(s.id+' · '+s.title)+'</div><div class="pcfState '+(r?'ready':'wait')+'">'+esc(st)+'</div></div><button class="pcfOpen" data-open="'+esc(s.id)+'">OPEN</button></div>';}).join('');
  return '<div class="pcfBody">'+rows+'<div class="pcfFoot">'+(nx&&ready(nx)?'<button id="pcfComplete" class="pcfComplete">COMPLETE CURRENT FOREMAN STEP</button>':'')+'<button id="pcfReset" class="pcfReset">RESET COLIN TO START</button></div><div id="pcfMsg" class="pcfMsg"></div></div>';
}
function msg(v){var e=document.getElementById('pcfMsg');if(e)e.textContent=v||'';}
async function complete(id){if(busy)return;busy=true;msg('');try{var d=await req('flow_complete',{stepId:id});completed=d.flow&&Array.isArray(d.flow.completed)?d.flow.completed:completed;render();}catch(e){msg(e.message||'Could not complete this foreman step.');if(e&&e.status===409)openTask(id);}finally{busy=false;}}
async function resetFlow(){if(busy||!confirm('Reset Colin\'s FOREMAN checklist to Step 1? This will NOT undo Mitchell / Ronan work and will NOT delete Colin\'s published notes.'))return;busy=true;try{var d=await req('flow_reset');completed=d.flow&&Array.isArray(d.flow.completed)?d.flow.completed:[];expanded=true;render();}catch(e){msg(e.message||'Could not reset Colin.');}finally{busy=false;}}
async function loadFlow(){if(person()!=='colin')return;try{var d=await req('flow_get');completed=d.flow&&Array.isArray(d.flow.completed)?d.flow.completed:[];}catch(e){}ensure();}

function restoreMarkupLabels(){
  var m=document.getElementById('pnForemanModal');if(!m)return;
  var labels={pan:'PAN / MOVE',arrow:'ARROW',circle:'CIRCLE',pen:'DRAW',text:'TEXT',eraser:'ERASER'};
  Object.keys(labels).forEach(function(k){var b=m.querySelector('[data-tool="'+k+'"]');if(b&&b.textContent!==labels[k])b.textContent=labels[k];});
  var undo=m.querySelector('#pnFmUndo');if(undo&&undo.textContent!=='UNDO')undo.textContent='UNDO';var fit=m.querySelector('#pnFmFit');if(fit&&fit.textContent!=='FIT')fit.textContent='FIT';var clear=m.querySelector('#pnFmClear');if(clear&&clear.textContent!=='CLEAR ALL')clear.textContent='CLEAR ALL';
}

function boot(){
  installStyle();wrapAuto();ensure();setTimeout(loadFlow,250);
  var mo=new MutationObserver(function(){restoreMarkupLabels();});mo.observe(document.body,{childList:true,subtree:true});restoreMarkupLabels();
  setInterval(function(){wrapAuto();if(person()==='colin')loadFlow();else ensure();},5000);
  document.addEventListener('visibilitychange',function(){if(!document.hidden){loadFlow();restoreMarkupLabels();}});window.addEventListener('pageshow',function(){loadFlow();restoreMarkupLabels();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
