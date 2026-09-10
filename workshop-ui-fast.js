(function(){
'use strict';
if(window.__PN_WORKSHOP_UI_FAST_5370__)return;
window.__PN_WORKSHOP_UI_FAST_5370__=true;

var STYLE_ID='pnWorkshopFastStyle5370';
var currentKey='my';
var cachedNav=null;
var settleTimer=0;
var rafId=0;

function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function connected(el){return !!(el&&el.isConnected);}
function keyFor(el){
  if(!el)return'';
  var t=norm(el.textContent);
  if(t==='MY JOB')return'my';
  if(t==='CREW')return'crew';
  if(t==='PROGRESS')return'progress';
  if(t==='TASKS')return'tasks';
  return'';
}
function commonParent(items){
  if(!items||!items.length)return null;
  var p=items[0];
  while(p&&p!==document.body){
    var ok=true;
    for(var i=1;i<items.length;i++){if(!p.contains(items[i])){ok=false;break;}}
    if(ok)return p;
    p=p.parentElement;
  }
  return null;
}
function getNav(){
  if(connected(cachedNav))return cachedNav;
  cachedNav=document.getElementById('pn536Nav');
  if(cachedNav){cachedNav.classList.add('pnFastNav');return cachedNav;}
  var all=document.querySelectorAll('button,a,[role="button"]');
  var found={};
  for(var i=0;i<all.length;i++){
    var k=keyFor(all[i]);
    if(k&&!found[k])found[k]=all[i];
    if(found.my&&found.crew&&found.progress&&found.tasks)break;
  }
  if(found.my&&found.crew&&found.progress&&found.tasks){
    cachedNav=commonParent([found.my,found.crew,found.progress,found.tasks]);
    if(cachedNav)cachedNav.classList.add('pnFastNav');
  }
  return cachedNav;
}
function navButtons(){
  var n=getNav();
  return n?n.querySelectorAll('button,a,[role="button"]'):[];
}
function nativeKey(){
  var bs=navButtons();
  for(var i=0;i<bs.length;i++){
    var k=keyFor(bs[i]);
    if(k&&(bs[i].classList.contains('active')||bs[i].getAttribute('aria-current')==='page'))return k;
  }
  return'';
}
function setActive(key){
  if(!key)return;
  currentKey=key;
  var bs=navButtons();
  for(var i=0;i<bs.length;i++){
    var k=keyFor(bs[i]);
    if(!k)continue;
    var on=k===key;
    bs[i].classList.toggle('pnFastActive',on);
    if(on)bs[i].setAttribute('data-pn-active','1');else bs[i].removeAttribute('data-pn-active');
  }
}
function appRoot(){
  var app=document.querySelector('.app');
  if(app){app.classList.add('pnFastApp');return app;}
  var card=document.getElementById('taskCard');
  if(!card)return null;
  var p=card.parentElement,last=card;
  while(p&&p!==document.body){last=p;p=p.parentElement;}
  if(last&&last!==document.body){last.classList.add('pnFastApp');return last;}
  return card;
}
function findAction(label,root){
  var want=norm(label),scope=root||document;
  var all=scope.querySelectorAll('button,a,[role="button"],summary');
  for(var i=0;i<all.length;i++){
    var t=norm(all[i].textContent);
    if(t===want||t.indexOf(want+' ')===0)return all[i];
  }
  return null;
}
function polishActions(){
  var root=document.getElementById('taskCard')||document;
  var open=findAction('OPEN JOB',root);
  var block=findAction('BLOCK / WAIT',root);
  if(open)open.classList.add('pnFastPrimary');
  if(block)block.classList.add('pnFastSecondary');
  var plan=findAction('PLAN',root)||findAction('PLAN · TASK AREA',root);
  if(plan)plan.classList.add('pnFastUtility');
  var done=findAction('DONE',root)||findAction('MARK DONE',root)||document.getElementById('pnAnyDoneBtn');
  if(done)done.classList.add('pnFastDone');
}
function virtualizeLongLists(){
  if(currentKey!=='crew')return;
  var root=document.getElementById('taskCard');
  if(!root)return;
  var candidates=root.querySelectorAll('[id*="history" i],[class*="history" i],[id*="activity" i],[class*="activity" i],[id*="log" i],[class*="log" i]');
  var marked=0;
  for(var i=0;i<candidates.length&&marked<4;i++){
    var c=candidates[i];
    if(c.children&&c.children.length>=8){
      c.classList.add('pnFastLongList');
      for(var j=0;j<c.children.length;j++)c.children[j].classList.add('pnFastVirtualRow');
      marked++;
    }
  }
  if(marked)return;
  var queue=[{el:root,depth:0}],seen=0;
  while(queue.length&&seen<180&&marked<3){
    var item=queue.shift(),el=item.el,depth=item.depth;seen++;
    if(!el||!el.children)continue;
    if(el.children.length>=14){
      el.classList.add('pnFastLongList');
      for(var n=0;n<el.children.length;n++)el.children[n].classList.add('pnFastVirtualRow');
      marked++;
      continue;
    }
    if(depth<4){
      for(var q=0;q<el.children.length;q++)queue.push({el:el.children[q],depth:depth+1});
    }
  }
}
function polish(){
  try{
    if(!document.body)return;
    document.body.classList.add('pnFastBody');
    appRoot();
    getNav();
    var nk=nativeKey();
    if(nk&&currentKey==='my')currentKey=nk;
    setActive(currentKey||nk||'my');
    document.body.classList.toggle('pnFastDetail',!!document.getElementById('pn5323OneStep'));
    polishActions();
    virtualizeLongLists();
  }catch(e){}
}
function schedulePolish(delay){
  if(rafId){cancelAnimationFrame(rafId);rafId=0;}
  if(settleTimer){clearTimeout(settleTimer);settleTimer=0;}
  rafId=requestAnimationFrame(function(){rafId=0;polish();});
  if(delay){settleTimer=setTimeout(function(){settleTimer=0;polish();},delay);}
}
function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
:root{--pnf-bg:#eef2f3;--pnf-card:#fff;--pnf-ink:#101820;--pnf-muted:#69747d;--pnf-line:#dfe5e7;--pnf-navy:#142534;--pnf-navy2:#203747;--pnf-green:#18704a;--pnf-green-soft:#edf8f1;--pnf-gold:#c79b38;--pnf-gold-soft:#fff8e8;--pnf-shadow:0 18px 48px rgba(20,37,52,.09);--pnf-soft-shadow:0 7px 22px rgba(20,37,52,.055)}
*{box-sizing:border-box}html{background:var(--pnf-bg)!important;-webkit-text-size-adjust:100%;scrollbar-gutter:stable}body.pnFastBody{margin:0!important;min-height:100dvh!important;padding-bottom:96px!important;background:linear-gradient(180deg,#fbfcfb 0,#f2f5f5 260px,#eef2f3 100%)!important;color:var(--pnf-ink)!important;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;text-rendering:optimizeLegibility!important}body.pnFastBody:before{content:""!important;position:fixed!important;left:0!important;right:0!important;top:0!important;height:4px!important;background:linear-gradient(90deg,var(--pnf-navy) 0 86%,var(--pnf-gold) 86%)!important;z-index:99999!important;pointer-events:none!important}
.app,.pnFastApp{width:min(1120px,calc(100vw - 36px))!important;max-width:1120px!important;margin-left:auto!important;margin-right:auto!important;padding-left:0!important;padding-right:0!important}.app>* ,.pnFastApp>*{max-width:none!important}#taskCard{width:100%!important;max-width:none!important;margin:14px auto 22px!important;padding:clamp(15px,2vw,24px)!important;border:1px solid var(--pnf-line)!important;border-radius:24px!important;background:rgba(255,255,255,.97)!important;box-shadow:var(--pnf-shadow)!important;transition:none!important}body.pnFastDetail #taskCard{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
#taskCard h1,#taskCard h2,#taskCard h3{color:var(--pnf-ink)!important;letter-spacing:-.035em!important}#taskCard h1{font-size:clamp(27px,3vw,40px)!important;line-height:1.02!important}#taskCard h2{font-size:clamp(20px,2.1vw,30px)!important;line-height:1.08!important}#taskCard p{line-height:1.5!important}
.pnFastPrimary{min-height:56px!important;border:0!important;border-radius:13px!important;background:var(--pnf-navy)!important;color:#fff!important;font-size:11px!important;font-weight:900!important;letter-spacing:.025em!important;box-shadow:none!important;transition:background .08s linear!important}.pnFastPrimary:hover{background:var(--pnf-navy2)!important}.pnFastSecondary{min-height:56px!important;border:1px solid #e2cd91!important;border-radius:13px!important;background:#fffdf8!important;color:#7a5b15!important;font-size:10px!important;font-weight:900!important;box-shadow:none!important;transition:background .08s linear!important}.pnFastUtility{border-radius:11px!important;box-shadow:none!important}.pnFastDone,#pnAnyDoneBtn{border-radius:12px!important;background:var(--pnf-green)!important;color:#fff!important;box-shadow:none!important}
#pn5323OneStep{overflow:hidden!important;border:1px solid var(--pnf-line)!important;border-radius:22px!important;background:#fff!important;box-shadow:var(--pnf-shadow)!important}.pn5323Head{padding:21px 23px!important;background:var(--pnf-navy)!important;color:#fff!important}.pn5323Title{font-size:clamp(24px,2.7vw,36px)!important;line-height:1.04!important;letter-spacing:-.04em!important}.pn5323Block{margin:10px 14px 0!important;border-radius:13px!important;box-shadow:none!important}.pn5323Actions{gap:9px!important;padding:14px!important}.pn5323Actions button{min-height:48px!important;border-radius:11px!important;box-shadow:none!important;transition:none!important}#pn5323Primary{min-height:56px!important;background:var(--pnf-navy)!important;color:#fff!important}
#pnBigJobsHome,#pnBigJobsToday{margin:14px 0!important;padding:16px!important;border:1px solid var(--pnf-line)!important;border-radius:18px!important;background:#fff!important;box-shadow:var(--pnf-soft-shadow)!important}.pnBigNum{background:var(--pnf-navy)!important;color:#fff!important}.pnBigRow.now .pnBigTag{background:var(--pnf-green-soft)!important;color:#155f3e!important}.pnToolBtn{background:var(--pnf-navy)!important;color:#fff!important;border:0!important;border-radius:11px!important;box-shadow:none!important}#pnAnyDoneBox{border:1px solid #cde6d6!important;border-radius:14px!important;background:var(--pnf-green-soft)!important;box-shadow:none!important}
.pnFastNav,#pn536Nav{position:fixed!important;z-index:9000!important;left:50%!important;right:auto!important;bottom:18px!important;transform:translate3d(-50%,0,0)!important;width:min(560px,calc(100vw - 24px))!important;max-width:560px!important;margin:0!important;padding:6px!important;border:1px solid #d7dfe2!important;border-radius:17px!important;background:#fff!important;box-shadow:0 13px 34px rgba(20,37,52,.14)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;will-change:auto!important}.pnFastNav button,.pnFastNav a,.pnFastNav [role="button"],#pn536Nav button,#pn536Nav a,#pn536Nav [role="button"]{min-height:44px!important;border:0!important;border-radius:11px!important;background:transparent!important;color:#68747d!important;font-size:8.5px!important;font-weight:900!important;letter-spacing:.04em!important;box-shadow:none!important;transform:none!important;transition:background .06s linear,color .06s linear!important}.pnFastNav .active,#pn536Nav .active{background:transparent!important;color:#68747d!important}.pnFastNav .pnFastActive,#pn536Nav .pnFastActive{background:var(--pnf-navy)!important;color:#fff!important}.pnFastNav .pnFastActive:hover,#pn536Nav .pnFastActive:hover{background:var(--pnf-navy2)!important}
.pnFastLongList{contain:layout style!important}.pnFastVirtualRow{content-visibility:auto!important;contain-intrinsic-size:auto 76px!important}
#pn5335Today,#pn5345Modal{font-family:inherit!important}.pn5335Top,.pn5345Top{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.pn5335Hero,.pn5345Hero{border-radius:18px!important;box-shadow:var(--pnf-soft-shadow)!important}.pn5345Job,.pn5345ByOthers,.pn5335Why,.pn5335Later{border-radius:13px!important;box-shadow:none!important}
button,a,[role="button"],summary{touch-action:manipulation;-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid rgba(199,155,56,.28)!important;outline-offset:2px!important}
@media(max-width:760px){html{scrollbar-gutter:auto}body.pnFastBody{padding-bottom:82px!important}.app,.pnFastApp{width:calc(100vw - 12px)!important}.pnFastNav,#pn536Nav{bottom:max(6px,env(safe-area-inset-bottom))!important;width:calc(100vw - 12px)!important;border-radius:14px!important}.pnFastNav button,.pnFastNav a,.pnFastNav [role="button"],#pn536Nav button,#pn536Nav a,#pn536Nav [role="button"]{min-height:43px!important;font-size:7.5px!important}#taskCard{margin-top:8px!important;padding:13px!important;border-radius:18px!important}#taskCard h1{font-size:28px!important}.pn5323Head{padding:17px!important}.pn5323Title{font-size:25px!important}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important}}
`;
  (document.head||document.documentElement).appendChild(s);
}

installStyle();
var initial=function(){
  var nk=nativeKey();
  if(nk)currentKey=nk;
  setActive(currentKey||'my');
  polish();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){schedulePolish(180);},{once:true});
else schedulePolish(180);

document.addEventListener('click',function(e){
  try{
    var b=e.target&&e.target.closest?e.target.closest('button,a,[role="button"]'):null;
    if(!b)return;
    var n=getNav();
    if(!n||!n.contains(b))return;
    var k=keyFor(b);
    if(!k)return;
    setActive(k);
    schedulePolish(110);
  }catch(x){}
},true);
window.addEventListener('pageshow',function(){schedulePolish(120);});
initial();
})();
