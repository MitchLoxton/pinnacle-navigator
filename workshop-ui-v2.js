(function(){
'use strict';
if(window.__PN_WORKSHOP_UI_LUX_5369__)return;
window.__PN_WORKSHOP_UI_LUX_5369__=true;

var STYLE_ID='pnWorkshopLux5369';
var PAGE_CLASSES=['pnV3JobPage','pnV3CrewPage','pnV3ProgressPage','pnV3TasksPage'];

function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function visible(el){
  if(!el||!document.documentElement.contains(el))return false;
  try{
    var cs=getComputedStyle(el);
    if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;
    var r=el.getClientRects();
    return !!(r&&r.length);
  }catch(e){return false;}
}
function nodes(root){try{return (root||document).querySelectorAll('*');}catch(e){return [];}}
function bestText(text,root,starts){
  var want=norm(text), all=nodes(root||document), best=null, score=1e9;
  for(var i=0;i<all.length;i++){
    var el=all[i]; if(!visible(el))continue;
    var t=norm(el.textContent); if(starts?t.indexOf(want)!==0:t!==want)continue;
    var s=(el.children?el.children.length:0)*100 + Math.abs(t.length-want.length);
    if(s<score){best=el;score=s;}
  }
  return best;
}
function exact(text,root){return bestText(text,root,false);}
function starts(text,root){return bestText(text,root,true);}
function action(text,root){
  var want=norm(text), all=(root||document).querySelectorAll('button,a,[role="button"],summary'), best=null,score=1e9;
  for(var i=0;i<all.length;i++){
    var el=all[i];if(!visible(el))continue;
    var t=norm(el.textContent);if(t!==want&&t.indexOf(want+' ')!==0)continue;
    var s=Math.abs(t.length-want.length);if(s<score){best=el;score=s;}
  }
  return best;
}
function add(el,cls){if(el&&!el.classList.contains(cls))el.classList.add(cls);return el;}
function climb(el,test,max){var p=el;for(var i=0;i<(max||10)&&p&&p!==document.body;i++,p=p.parentElement){try{if(test(p,norm(p.textContent)))return p;}catch(e){}}return null;}
function common(a,b){if(!a||!b)return null;for(var p=a;p&&p!==document.body;p=p.parentElement){if(p.contains(b))return p;}return null;}
function bodyChild(el){if(!el)return null;var p=el;while(p.parentElement&&p.parentElement!==document.body)p=p.parentElement;return p&&p!==document.body?p:null;}
function clearPage(){for(var i=0;i<PAGE_CLASSES.length;i++)document.body.classList.remove(PAGE_CLASSES[i]);}
function stretchAbove(surface){
  if(!surface)return;
  for(var p=surface.parentElement;p&&p!==document.body;p=p.parentElement){
    if(p.classList.contains('pnV3Canvas'))break;
    add(p,'pnV3Stretch');
  }
}
function markCanvas(anchor){var top=bodyChild(anchor);if(top)add(top,'pnV3Canvas');return top;}

function findNav(){
  var my=action('MY JOB'), crew=action('CREW'), progress=action('PROGRESS'), tasks=action('TASKS');
  var nav=common(common(my,crew),common(progress,tasks));
  if(nav){add(nav,'pnV3Nav');}
  return {my:my,crew:crew,progress:progress,tasks:tasks,nav:nav};
}
function setActive(nav,key){
  ['my','crew','progress','tasks'].forEach(function(k){
    var b=nav&&nav[k]; if(!b)return;
    b.classList.remove('pnNavActive','active','selected');
    b.classList.toggle('pnV3Active',k===key);
    if(k===key)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
}

function tagChrome(nav,pageAnchor){
  if(!document.body)return;
  document.body.classList.add('pnV3Body');
  var brand=exact('PINNACLE NAVIGATOR');
  if(brand){add(brand,'pnV3Brand');markCanvas(brand);}
  if(pageAnchor)markCanvas(pageAnchor);
  var live=exact('LIVE'); if(live){add(live,'pnV3Live');add(live.parentElement,'pnV3LivePill');}
  var sync=starts('LAST:')||starts('SAVED BY');if(sync)add(sync,'pnV3Sync');
  var source=starts('BUILT FROM:');
  if(source){add(source,'pnV3Source');var sw=climb(source,function(p,t){return t.indexOf('BUILT FROM:')!==-1&&t.length<900;},4)||source.parentElement;add(sw,'pnV3SourceWrap');markCanvas(sw);}
  if(brand){
    var mast=climb(brand,function(p,t){return t.indexOf('LIVE')!==-1&&(t.indexOf('LAST:')!==-1||t.indexOf('SAVED BY')!==-1)&&t.length<900;},7);
    if(mast)add(mast,'pnV3Mast');
  }
  if(nav&&nav.nav)add(nav.nav,'pnV3Nav');
}

function chooseTaskTitle(area){
  if(!area)return null;
  var all=nodes(area),best=null,bestScore=-1;
  for(var i=0;i<all.length;i++){
    var el=all[i];if(!visible(el))continue;
    var t=String(el.textContent||'').replace(/\s+/g,' ').trim(),u=norm(t);
    if(t.length<12||t.length>130)continue;
    if(u.indexOf('TASK ')===0||u==='OPEN JOB'||u.indexOf('BLOCK / WAIT')===0||u.indexOf('RECOMMENDED')===0||u==='READY')continue;
    if(el.children&&el.children.length>2)continue;
    var bold=/^(H1|H2|H3|H4|STRONG|B)$/i.test(el.tagName)||parseInt(getComputedStyle(el).fontWeight,10)>=700;
    var score=t.length+(bold?90:0)+(u===t.toUpperCase()?25:0);
    if(score>bestScore){best=el;bestScore=score;}
  }
  return best;
}
function chooseDescription(area,title){
  if(!area)return null;var all=nodes(area),best=null,bestLen=0;
  for(var i=0;i<all.length;i++){
    var el=all[i];if(el===title||!visible(el)||(el.children&&el.children.length))continue;
    var t=String(el.textContent||'').replace(/\s+/g,' ').trim(),u=norm(t);
    if(t.length<38||t.length>360)continue;
    if(u.indexOf('TASK ')===0||u.indexOf('RECOMMENDED')===0||u.indexOf('OPEN JOB')===0||u.indexOf('BLOCK / WAIT')===0)continue;
    if(t.length>bestLen){best=el;bestLen=t.length;}
  }
  return best;
}

function tagJob(nav,heading){
  clearPage();document.body.classList.add('pnV3JobPage');setActive(nav,'my');
  add(heading,'pnV3PageTitle');
  var open=action('OPEN JOB'), block=action('BLOCK / WAIT');
  var outer=climb(heading,function(p,t){return t.indexOf('OPEN JOB')!==-1&&t.indexOf('BLOCK / WAIT')!==-1&&t.length<6500;},10)||common(heading,open)||heading.parentElement;
  add(outer,'pnV3JobSurface');stretchAbove(outer);markCanvas(outer);
  var area=common(open,block);
  if(area&&outer&&area===outer){area=climb(open,function(p,t){return p!==outer&&t.indexOf('OPEN JOB')!==-1&&t.indexOf('BLOCK / WAIT')!==-1&&t.length<3000;},6);}
  if(!area)area=open?open.parentElement:null;
  add(area,'pnV3JobHero');
  var kicker=starts('TASK ',area);if(kicker)add(kicker,'pnV3Kicker');
  var title=chooseTaskTitle(area);if(title)add(title,'pnV3TaskTitle');
  var desc=chooseDescription(area,title);if(desc)add(desc,'pnV3TaskDesc');
  var status=starts('RECOMMENDED',area)||exact('READY',area)||starts('READY ',area);if(status)add(status,'pnV3Status');
  if(open)add(open,'pnV3Primary');if(block)add(block,'pnV3Secondary');
  var buttons=common(open,block);if(buttons)add(buttons,'pnV3Actions');
  var why=starts('WHY DID NAVIGATOR GIVE ME THIS JOB');
  if(why){var w=climb(why,function(p,t){return t.indexOf('WHY DID NAVIGATOR')!==-1&&t.length<850;},4)||why.parentElement;add(w,'pnV3Disclosure');}
  var crew=starts('CREW RIGHT NOW');
  if(crew){var c=climb(crew,function(p,t){return t.indexOf('CREW RIGHT NOW')!==-1&&t.length<1300;},4)||crew.parentElement;add(c,'pnV3Disclosure');}
}

function crewCard(name,page){
  var n=exact(name,page);if(!n)return null;
  var card=climb(n,function(p,t){return t.indexOf(name)!==-1&&(t.indexOf('CURRENT')!==-1||t.indexOf('FOREMAN / CONFIRMATIONS')!==-1||t.indexOf('NEXT LIKELY')!==-1)&&t.length<2600;},8)||n.parentElement;
  add(card,'pnV3CrewCard');add(card,'pnV3Crew'+name.charAt(0)+name.slice(1).toLowerCase());
  add(n,'pnV3CrewName');n.setAttribute('data-initial',name.charAt(0));
  var current=starts('CURRENT',card);if(current)add(current,'pnV3CrewLabel');
  var next=starts('NEXT LIKELY',card);if(next){var nx=next.parentElement||next;add(nx,'pnV3CrewNext');}
  var ready=exact('READY',card)||starts('RECOMMENDED',card);if(ready)add(ready,'pnV3CrewReady');
  var open=action('OPEN MY TASK',card)||action('VIEW TASK',card)||action('OPEN TASK',card);if(open)add(open,'pnV3CrewOpen');
  var block=action('BLOCK / WAIT',card);if(block)add(block,'pnV3CrewBlock');
  return card;
}
function stat(label,page){
  var x=exact(label,page);if(!x)return null;
  var p=climb(x,function(el,t){return t.indexOf(label)!==-1&&/\d/.test(t)&&t.length<120;},5)||x.parentElement;
  add(p,'pnV3Stat');return p;
}
function tagCrew(nav,heading){
  clearPage();document.body.classList.add('pnV3CrewPage');setActive(nav,'crew');
  add(heading,'pnV3CrewTitle');
  var eye=starts('CREW DASHBOARD');if(eye)add(eye,'pnV3Eyebrow');
  var page=climb(heading,function(p,t){return t.indexOf('MITCHELL')!==-1&&t.indexOf('RONAN')!==-1&&t.indexOf('COLIN')!==-1&&t.length<11000;},11)||heading.parentElement;
  add(page,'pnV3CrewSurface');stretchAbove(page);markCanvas(page);
  var help=starts('SMART CREW FLOW:',page);if(help){var hb=climb(help,function(p,t){return t.indexOf('START LOCK')!==-1&&t.length<800;},4)||help.parentElement;add(hb,'pnV3CrewHelp');}
  var s1=stat('DONE',page),s2=stat('READY NOW',page),s3=stat('WAITING',page);var sr=common(common(s1,s2),s3);if(sr)add(sr,'pnV3Stats');
  crewCard('MITCHELL',page);crewCard('RONAN',page);crewCard('COLIN',page);
  var settings=starts('CREW SETTINGS / OVERRIDE',page);if(settings)add(settings.parentElement||settings,'pnV3CrewSettings');
  var waiting=starts('WAITING / BLOCKED',page);if(waiting){var wb=climb(waiting,function(p,t){return t.indexOf('WAITING / BLOCKED')!==-1&&t.length<2400;},6)||waiting.parentElement;add(wb,'pnV3Waiting');}
}

function tagOther(nav,key,heading){
  clearPage();
  if(key==='progress'){document.body.classList.add('pnV3ProgressPage');setActive(nav,'progress');}
  else{document.body.classList.add('pnV3TasksPage');setActive(nav,'tasks');}
  add(heading,'pnV3PageTitle');var surface=climb(heading,function(p,t){return t.length<15000;},5)||heading.parentElement;add(surface,'pnV3GenericSurface');stretchAbove(surface);markCanvas(surface);
}

function tagDetails(){
  var ids=['pn5323OneStep','pnAnyDoneBox','pnBigJobsHome','pnBigJobsToday','pnMorningPack','pnMorningPackModal'];
  for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el)add(el,'pnV3PremiumModule');}
  var util=['OPEN FULL PROJECT WORK REGISTER','MORNING PACK','42.5 TEMPLATE','42.5 MM DEFAULT MITER TEMPLATE','48 MM DEFAULT MITER TEMPLATE'];
  for(var j=0;j<util.length;j++){var b=action(util[j]);if(b)add(b,'pnV3Utility');}
}

function run(){
  if(!document.body)return;
  try{
    var nav=findNav();
    var job=exact('YOUR JOB NOW');
    var crew=exact("WHO'S DOING WHAT?")||exact('WHO’S DOING WHAT?');
    var progress=exact('PROJECT PROGRESS')||exact('PROGRESS OVERVIEW');
    var tasks=exact('ALL TASKS')||exact('TASK LIST');
    var anchor=job||crew||progress||tasks||exact('PINNACLE NAVIGATOR');
    tagChrome(nav,anchor);
    if(job)tagJob(nav,job);
    else if(crew)tagCrew(nav,crew);
    else if(progress)tagOther(nav,'progress',progress);
    else if(tasks)tagOther(nav,'tasks',tasks);
    tagDetails();
    document.documentElement.classList.add('pnV3Ready');
  }catch(e){}
}

function installStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
:root{--pn3-bg:#eef2f4;--pn3-card:#fff;--pn3-ink:#0f1720;--pn3-muted:#66727c;--pn3-line:#dfe5e8;--pn3-navy:#142534;--pn3-navy2:#1d3344;--pn3-green:#19704a;--pn3-green2:#0f5f3d;--pn3-green-soft:#eef8f2;--pn3-gold:#c79b38;--pn3-gold-soft:#fff8e8;--pn3-red:#a54642;--pn3-shadow:0 22px 60px rgba(20,37,52,.10);--pn3-shadow-soft:0 10px 30px rgba(20,37,52,.07)}
*{box-sizing:border-box}html{background:var(--pn3-bg)!important;-webkit-text-size-adjust:100%;scrollbar-gutter:stable}body.pnV3Body{margin:0!important;min-height:100dvh!important;padding-bottom:108px!important;background:radial-gradient(circle at 18% -10%,rgba(255,255,255,.98) 0,rgba(255,255,255,.6) 24%,transparent 44%),linear-gradient(180deg,#f8faf9 0,#eef2f4 58%,#edf0f2 100%)!important;color:var(--pn3-ink)!important;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;text-rendering:optimizeLegibility!important}body.pnV3Body:before{content:""!important;position:fixed!important;z-index:99999!important;top:0!important;left:0!important;right:0!important;height:5px!important;background:linear-gradient(90deg,var(--pn3-navy) 0 84%,var(--pn3-gold) 84% 100%)!important;pointer-events:none!important}body.pnV3Body:after{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background-image:linear-gradient(rgba(20,37,52,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(20,37,52,.018) 1px,transparent 1px);background-size:32px 32px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.35),transparent 45%)}
.pnV3Canvas{width:min(1120px,calc(100vw - 48px))!important;max-width:1120px!important;margin-left:auto!important;margin-right:auto!important}.pnV3Stretch{width:100%!important;max-width:none!important}.pnV3Canvas>*{max-width:none!important}button,a,[role="button"],summary{touch-action:manipulation;-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid rgba(199,155,56,.28)!important;outline-offset:2px!important}
.pnV3Mast{margin-top:24px!important;margin-bottom:12px!important;padding:18px 20px!important;border:1px solid rgba(223,229,232,.92)!important;border-radius:22px!important;background:rgba(255,255,255,.88)!important;box-shadow:0 8px 28px rgba(20,37,52,.055)!important;backdrop-filter:blur(12px)!important;-webkit-backdrop-filter:blur(12px)!important}.pnV3Brand{display:flex!important;align-items:center!important;gap:12px!important;margin:0!important;color:var(--pn3-ink)!important;font-size:clamp(27px,2.35vw,36px)!important;line-height:1!important;font-weight:950!important;letter-spacing:-.055em!important}.pnV3Brand:before{content:"PN";flex:0 0 42px;width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,var(--pn3-navy),#223c50);color:#fff;font-size:10px;letter-spacing:.06em;box-shadow:inset 0 -3px 0 var(--pn3-gold),0 8px 18px rgba(20,37,52,.16)}.pnV3LivePill{display:inline-flex!important;align-items:center!important;gap:7px!important;width:auto!important;padding:5px 9px!important;border:1px solid #cfe7d8!important;border-radius:999px!important;background:#eff8f3!important;color:var(--pn3-green2)!important;box-shadow:none!important}.pnV3Live:before{content:"";display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:#27a368;box-shadow:0 0 0 4px rgba(39,163,104,.10)}.pnV3Live{font-size:9px!important;font-weight:900!important;letter-spacing:.04em!important}.pnV3Sync{color:#7d878f!important;font-size:9px!important;font-weight:750!important}.pnV3SourceWrap{margin:0 auto 18px!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.pnV3Source{display:block!important;width:100%!important;padding:9px 12px!important;border:1px solid rgba(223,229,232,.88)!important;border-radius:12px!important;background:rgba(255,255,255,.64)!important;color:#7c858c!important;font-size:8.5px!important;line-height:1.35!important;font-weight:650!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.pnV3JobSurface,.pnV3CrewSurface,.pnV3GenericSurface{position:relative!important;width:100%!important;max-width:none!important;margin:0 0 22px!important;padding:26px!important;border:1px solid rgba(218,225,229,.96)!important;border-radius:28px!important;background:rgba(255,255,255,.94)!important;box-shadow:var(--pn3-shadow)!important;overflow:hidden!important}.pnV3JobSurface:after,.pnV3CrewSurface:after,.pnV3GenericSurface:after{content:"";position:absolute;left:26px;right:26px;top:0;height:3px;border-radius:0 0 8px 8px;background:linear-gradient(90deg,var(--pn3-navy) 0 72%,var(--pn3-gold) 72%)}.pnV3PageTitle,.pnV3CrewTitle{display:block!important;margin:3px 0 18px!important;color:var(--pn3-ink)!important;font-size:clamp(30px,3vw,42px)!important;line-height:1!important;font-weight:950!important;letter-spacing:-.05em!important}.pnV3Eyebrow{display:block!important;margin:2px 0 5px!important;color:#89939b!important;font-size:9px!important;font-weight:900!important;letter-spacing:.12em!important}
.pnV3JobHero{position:relative!important;margin:0!important;padding:24px!important;border:1px solid #bcdac8!important;border-radius:22px!important;background:linear-gradient(135deg,#f0f8f3 0,#f8fbf9 60%,#f3f7f5 100%)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important;overflow:hidden!important}.pnV3JobHero:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,#19704a,#45a978)}.pnV3Kicker{display:block!important;margin:0 0 8px!important;color:#1b6846!important;font-size:9px!important;line-height:1.2!important;font-weight:900!important;letter-spacing:.11em!important}.pnV3TaskTitle{display:block!important;margin:0 0 10px!important;color:#0d171f!important;font-size:clamp(23px,2.15vw,31px)!important;line-height:1.05!important;font-weight:950!important;letter-spacing:-.035em!important}.pnV3TaskDesc{display:block!important;max-width:850px!important;margin:0 0 14px!important;color:#46525b!important;font-size:14px!important;line-height:1.55!important;font-weight:650!important}.pnV3Status{display:inline-flex!important;align-items:center!important;width:auto!important;margin:0 0 17px!important;padding:6px 9px!important;border:1px solid #c8e2d2!important;border-radius:999px!important;background:#e8f6ee!important;color:#155e3d!important;font-size:8px!important;line-height:1!important;font-weight:900!important;letter-spacing:.035em!important}.pnV3Actions{display:grid!important;grid-template-columns:minmax(220px,1fr) minmax(150px,.38fr)!important;gap:10px!important;width:100%!important;margin-top:4px!important}.pnV3Primary,.pnV3Secondary{min-height:58px!important;border-radius:14px!important;font-size:11px!important;font-weight:900!important;letter-spacing:.025em!important;box-shadow:none!important;transition:transform .13s ease,box-shadow .13s ease,background .13s ease!important}.pnV3Primary{position:relative!important;border:1px solid var(--pn3-navy)!important;background:linear-gradient(145deg,var(--pn3-navy),var(--pn3-navy2))!important;color:#fff!important;box-shadow:0 10px 24px rgba(20,37,52,.15)!important}.pnV3Primary:after{content:"→";position:absolute;right:18px;font-size:17px;line-height:1}.pnV3Primary:hover{transform:translateY(-1px)!important;box-shadow:0 13px 28px rgba(20,37,52,.19)!important}.pnV3Secondary{border:1px solid #e4cf96!important;background:rgba(255,255,255,.72)!important;color:#805e18!important}.pnV3Secondary:hover{background:#fff9eb!important}.pnV3Disclosure{margin-top:10px!important;border:1px solid var(--pn3-line)!important;border-radius:14px!important;background:#f8faf9!important;box-shadow:none!important;overflow:hidden!important}.pnV3Disclosure button,.pnV3Disclosure summary{min-height:48px!important;padding:0 15px!important;color:#49555e!important;font-size:9px!important;font-weight:850!important;letter-spacing:.02em!important}
.pnV3CrewHelp{display:none!important}.pnV3Stats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:0 0 16px!important}.pnV3Stat{min-height:82px!important;padding:15px 17px!important;border:1px solid var(--pn3-line)!important;border-radius:17px!important;background:linear-gradient(180deg,#fff,#fafcfb)!important;color:#6f7a82!important;box-shadow:var(--pn3-shadow-soft)!important}.pnV3Stat strong,.pnV3Stat b{display:block!important;margin-bottom:5px!important;color:var(--pn3-ink)!important;font-size:24px!important;line-height:1!important;font-weight:950!important}.pnV3CrewCard{position:relative!important;margin:0 0 12px!important;padding:20px 20px 18px!important;border:1px solid var(--pn3-line)!important;border-radius:19px!important;background:linear-gradient(180deg,#fff,#fcfdfc)!important;box-shadow:var(--pn3-shadow-soft)!important;overflow:hidden!important}.pnV3CrewCard:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#aab6bd}.pnV3CrewMitchell:before{background:var(--pn3-green)}.pnV3CrewRonan:before{background:#6c879a}.pnV3CrewColin:before{background:var(--pn3-gold)}.pnV3CrewName{display:flex!important;align-items:center!important;gap:11px!important;margin:0 0 6px!important;color:var(--pn3-ink)!important;font-size:20px!important;line-height:1!important;font-weight:950!important;letter-spacing:-.03em!important}.pnV3CrewName:before{content:attr(data-initial);flex:0 0 36px;width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:#edf1f3;color:#394a55;font-size:11px;font-weight:950}.pnV3CrewMitchell .pnV3CrewName:before{background:#e7f5ed;color:#176140}.pnV3CrewColin .pnV3CrewName:before{background:#fff3d5;color:#7a5913}.pnV3CrewLabel{display:block!important;margin:9px 0 5px!important;color:#79838b!important;font-size:8px!important;font-weight:900!important;letter-spacing:.09em!important}.pnV3CrewReady{display:inline-flex!important;width:auto!important;margin-top:7px!important;padding:5px 8px!important;border-radius:999px!important;background:#eaf6ef!important;color:#176140!important;font-size:8px!important;font-weight:900!important}.pnV3CrewNext{margin-top:12px!important;padding-top:11px!important;border-top:1px solid #e9edef!important;color:#6b757d!important;font-size:9.5px!important;line-height:1.45!important}.pnV3CrewOpen,.pnV3CrewBlock{min-height:48px!important;border-radius:12px!important;font-size:9px!important;font-weight:900!important;box-shadow:none!important}.pnV3CrewOpen{border:1px solid var(--pn3-navy)!important;background:var(--pn3-navy)!important;color:#fff!important}.pnV3CrewBlock{border:1px solid transparent!important;background:transparent!important;color:#80651f!important}.pnV3CrewSettings{margin:14px 0!important;border:1px solid var(--pn3-line)!important;border-radius:13px!important;background:#f8faf9!important;box-shadow:none!important}.pnV3Waiting{margin-top:15px!important;padding:16px!important;border:1px solid #ead9a7!important;border-left:4px solid var(--pn3-gold)!important;border-radius:16px!important;background:var(--pn3-gold-soft)!important;box-shadow:none!important}
.pnV3Nav{position:fixed!important;z-index:800!important;left:50%!important;right:auto!important;bottom:22px!important;transform:translateX(-50%)!important;width:min(560px,calc(100vw - 32px))!important;max-width:560px!important;margin:0!important;padding:6px!important;border:1px solid rgba(214,221,225,.9)!important;border-radius:18px!important;background:rgba(255,255,255,.92)!important;box-shadow:0 18px 44px rgba(20,37,52,.17)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important}.pnV3Nav button,.pnV3Nav a,.pnV3Nav [role="button"]{min-height:46px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#64717a!important;font-size:8.5px!important;font-weight:900!important;letter-spacing:.045em!important;box-shadow:none!important}.pnV3Nav .pnV3Active{background:linear-gradient(145deg,var(--pn3-navy),var(--pn3-navy2))!important;color:#fff!important;box-shadow:0 6px 16px rgba(20,37,52,.16)!important}
#taskCard{width:100%!important;max-width:none!important;margin-left:auto!important;margin-right:auto!important}.pnV3PremiumModule{border-radius:20px!important;box-shadow:var(--pn3-shadow-soft)!important}.pnV3Utility{min-height:46px!important;border-radius:12px!important;box-shadow:none!important;font-weight:850!important}
#pn5323OneStep{border:1px solid var(--pn3-line)!important;border-radius:22px!important;background:#fff!important;box-shadow:var(--pn3-shadow)!important;overflow:hidden!important}.pn5323Head{background:linear-gradient(145deg,var(--pn3-navy),#1c3345)!important;color:#fff!important;padding:23px 24px!important}.pn5323Title{font-size:clamp(25px,2.5vw,36px)!important;letter-spacing:-.04em!important}.pn5323Block{border-radius:14px!important;box-shadow:none!important}.pn5323Actions button{border-radius:12px!important;box-shadow:none!important}#pn5323Primary{background:var(--pn3-navy)!important;color:#fff!important}
#pnBigJobsHome,#pnBigJobsToday{border:1px solid var(--pn3-line)!important;border-radius:20px!important;background:#fff!important;box-shadow:var(--pn3-shadow-soft)!important}.pnBigNum{background:var(--pn3-navy)!important;color:#fff!important;border-radius:9px!important}.pnBigRow.now .pnBigTag{background:#e8f6ee!important;color:#155e3d!important}
@media(min-width:1180px){.pnV3JobSurface{padding:30px!important}.pnV3JobHero{padding:28px 30px!important}.pnV3CrewSurface{padding:30px!important}.pnV3TaskDesc{font-size:15px!important}.pnV3Primary,.pnV3Secondary{min-height:62px!important;font-size:11.5px!important}}
@media(max-width:760px){html{scrollbar-gutter:auto}body.pnV3Body{padding-bottom:90px!important}.pnV3Canvas{width:calc(100vw - 12px)!important;max-width:none!important}.pnV3Mast{margin-top:10px!important;padding:13px 14px!important;border-radius:17px!important}.pnV3Brand{font-size:24px!important;gap:9px!important}.pnV3Brand:before{width:34px;height:34px;flex-basis:34px;border-radius:10px;font-size:8px}.pnV3Source{font-size:7.5px!important;padding:7px 9px!important}.pnV3JobSurface,.pnV3CrewSurface,.pnV3GenericSurface{padding:14px!important;border-radius:20px!important}.pnV3JobSurface:after,.pnV3CrewSurface:after,.pnV3GenericSurface:after{left:14px;right:14px}.pnV3PageTitle,.pnV3CrewTitle{font-size:28px!important;margin-bottom:13px!important}.pnV3JobHero{padding:17px!important;border-radius:17px!important}.pnV3TaskTitle{font-size:22px!important}.pnV3TaskDesc{font-size:12.5px!important;line-height:1.5!important}.pnV3Actions{grid-template-columns:1fr!important}.pnV3Primary,.pnV3Secondary{min-height:52px!important}.pnV3Stats{gap:6px!important}.pnV3Stat{min-height:66px!important;padding:10px!important;border-radius:13px!important}.pnV3CrewCard{padding:15px!important;border-radius:15px!important}.pnV3CrewName{font-size:18px!important}.pnV3Nav{bottom:max(7px,env(safe-area-inset-bottom))!important;width:calc(100vw - 14px)!important;border-radius:15px!important}.pnV3Nav button,.pnV3Nav a,.pnV3Nav [role="button"]{min-height:44px!important;font-size:7.5px!important}}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important;animation-duration:.001ms!important;animation-iteration-count:1!important}}
`;
  (document.head||document.documentElement).appendChild(s);
}

installStyle();
[0,100,260,620,1300,2600,4800].forEach(function(ms){setTimeout(run,ms);});
document.addEventListener('click',function(e){
  try{
    var b=e.target&&e.target.closest?e.target.closest('button,a,[role="button"],summary'):null;
    if(!b)return;var t=norm(b.textContent);
    if(t==='MY JOB'||t==='CREW'||t==='PROGRESS'||t==='TASKS'||t.indexOf('OPEN JOB')===0||t.indexOf('VIEW TASK')===0||t.indexOf('OPEN TASK')===0){
      setTimeout(run,40);setTimeout(run,180);setTimeout(run,520);
    }
  }catch(x){}
},false);
window.addEventListener('pageshow',function(){setTimeout(run,60);});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(run,80);});
})();