(function(){
'use strict';
if(window.__PN_WORKSHOP_UI_POLISHED_5368__)return;
window.__PN_WORKSHOP_UI_POLISHED_5368__=true;

var STYLE_ID='pnPolishedWorkshopStyle5368';
var VIEW_CLASSES=['pnViewCrew','pnViewJob','pnViewProgress','pnViewTasks'];

function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function leaves(){return document.querySelectorAll('body *');}
function leafExact(text){var want=norm(text),all=leaves();for(var i=0;i<all.length;i++){var el=all[i];if(el.children.length===0&&norm(el.textContent)===want)return el;}return null;}
function leafStarts(text){var want=norm(text),all=leaves();for(var i=0;i<all.length;i++){var el=all[i],t=norm(el.textContent);if(el.children.length===0&&t.indexOf(want)===0)return el;}return null;}
function findButton(text){var want=norm(text),all=document.querySelectorAll('button,a,[role="button"]');for(var i=0;i<all.length;i++){var t=norm(all[i].textContent);if(t===want||t.indexOf(want+' ')===0)return all[i];}return null;}
function add(el,cls){if(el&&!el.classList.contains(cls))el.classList.add(cls);return el;}
function common(a,b){if(!a||!b)return null;for(var p=a;p&&p!==document.body;p=p.parentElement)if(p.contains(b))return p;return null;}
function topRoot(el){if(!el)return null;var n=el;while(n.parentElement&&n.parentElement!==document.body)n=n.parentElement;return n===document.body?null:n;}
function climb(el,test,max){var p=el;for(var i=0;i<(max||9)&&p&&p!==document.body;i++,p=p.parentElement){try{if(test(p,norm(p.textContent)))return p;}catch(e){}}return null;}
function clearView(){for(var i=0;i<VIEW_CLASSES.length;i++)document.body.classList.remove(VIEW_CLASSES[i]);}

function tagChrome(){
  var brand=leafExact('PINNACLE NAVIGATOR');
  add(brand,'pnBrand');
  var root=topRoot(brand)||topRoot(document.getElementById('taskCard'));
  add(root,'pnAppRoot');
  var source=leafStarts('BUILT FROM:');
  add(source,'pnSource');
  if(source&&source.parentElement)add(source.parentElement,'pnSourceWrap');
  var live=leafExact('LIVE');
  if(live){add(live,'pnLiveText');add(live.parentElement,'pnLivePill');}
  var saved=leafStarts('SAVED BY');if(!saved)saved=leafStarts('LAST:');add(saved,'pnSyncText');
  var my=findButton('MY JOB'),crew=findButton('CREW'),progress=findButton('PROGRESS'),tasks=findButton('TASKS');
  var nav=common(common(my,crew),common(progress,tasks));add(nav,'pnBottomNav');
  return {my:my,crew:crew,progress:progress,tasks:tasks,nav:nav};
}

function setNavActive(nav,name){
  if(!nav)return;
  ['my','crew','progress','tasks'].forEach(function(k){var b=nav[k];if(b)b.classList.toggle('pnNavActive',k===name);});
}

function currentPanel(){
  var h=leafExact('YOUR JOB NOW');if(!h)return null;
  return climb(h,function(p,t){return t.indexOf('OPEN JOB')!==-1&&t.indexOf('BLOCK / WAIT')!==-1;},8)||h.parentElement;
}

function tagMyJob(nav){
  var panel=currentPanel();
  if(!panel)return false;
  clearView();document.body.classList.add('pnViewJob');setNavActive(nav,'my');add(panel,'pnCurrentJob');
  add(leafExact('YOUR JOB NOW'),'pnSectionTitle');
  var open=findButton('OPEN JOB'),block=findButton('BLOCK / WAIT');add(open,'pnPrimaryAction');add(block,'pnSecondaryAction');
  var action=common(open,block);if(action)add(action,'pnActionRow');
  var why=leafStarts('WHY DID NAVIGATOR GIVE ME THIS JOB');if(why)add(why.parentElement||why,'pnDisclosure');
  var crew=leafStarts('CREW RIGHT NOW');if(crew)add(crew.parentElement||crew,'pnDisclosure');
  return true;
}

function findCrewCard(name){
  var all=leaves(),want=norm(name),best=null,bestLen=999999;
  for(var i=0;i<all.length;i++){
    var el=all[i];if(el.children.length!==0||norm(el.textContent)!==want)continue;
    var card=climb(el,function(p,t){return t.indexOf(want)!==-1&&(t.indexOf('CURRENT')!==-1||t.indexOf('FOREMAN / CONFIRMATIONS')!==-1||t.indexOf('NEXT LIKELY')!==-1)&&t.length<2400;},8);
    if(card){var len=norm(card.textContent).length;if(len<bestLen){best=card;bestLen=len;}}
  }
  return best;
}

function statBox(label){
  var x=leafExact(label);if(!x)return null;
  return climb(x,function(p,t){return t.indexOf(label)!==-1&&/\d/.test(t)&&t.length<90;},5)||x.parentElement;
}

function tagCrewCard(card,name){
  if(!card)return;
  add(card,'pnCrewCard');add(card,'pnCrew'+name);
  var nodes=card.querySelectorAll('*');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i],t=norm(el.textContent);if(el.children.length!==0)continue;
    if(t===name){add(el,'pnCrewName');el.setAttribute('data-initial',name.charAt(0));}
    if(t.indexOf('CURRENT')===0)add(el,'pnCrewCurrent');
    if(t==='READY'||t.indexOf('RECOMMENDED')===0)add(el,'pnStateGood');
    if(t.indexOf('NEXT LIKELY')===0)add(el.parentElement||el,'pnCrewNext');
  }
  var buttons=card.querySelectorAll('button,a,[role="button"]');
  for(var j=0;j<buttons.length;j++){
    var bt=norm(buttons[j].textContent);
    if(bt.indexOf('OPEN MY TASK')===0||bt.indexOf('VIEW TASK')===0||bt.indexOf('OPEN TASK')===0)add(buttons[j],'pnCrewOpen');
    if(bt.indexOf('BLOCK / WAIT')===0)add(buttons[j],'pnCrewBlock');
  }
}

function tagCrew(nav){
  var heading=leafExact("WHO'S DOING WHAT?")||leafExact('WHO’S DOING WHAT?');
  if(!heading)return false;
  clearView();document.body.classList.add('pnViewCrew');setNavActive(nav,'crew');
  add(heading,'pnCrewHeading');
  var label=leafStarts('CREW DASHBOARD');add(label,'pnCrewEyebrow');
  var page=climb(heading,function(p,t){return t.indexOf('MITCHELL')!==-1&&t.indexOf('RONAN')!==-1&&t.indexOf('COLIN')!==-1&&t.length<9000;},10);add(page,'pnCrewPage');
  var smart=leafStarts('SMART CREW FLOW:');if(smart){var help=climb(smart,function(p,t){return t.indexOf('START LOCK')!==-1&&t.length<700;},4)||smart.parentElement;add(help,'pnCrewHelp');}
  var s1=statBox('DONE'),s2=statBox('READY NOW'),s3=statBox('WAITING');add(s1,'pnCrewStat');add(s2,'pnCrewStat');add(s3,'pnCrewStat');
  var row=common(common(s1,s2),s3);if(row&&norm(row.textContent).length<260)add(row,'pnCrewStats');
  tagCrewCard(findCrewCard('MITCHELL'),'Mitchell');
  tagCrewCard(findCrewCard('RONAN'),'Ronan');
  tagCrewCard(findCrewCard('COLIN'),'Colin');
  var settings=leafStarts('CREW SETTINGS / OVERRIDE');if(settings)add(settings.parentElement||settings,'pnCrewSettings');
  var waiting=leafStarts('WAITING / BLOCKED');if(waiting){var box=climb(waiting,function(p,t){return t.indexOf('CARGO NET')!==-1&&t.length<1700;},6)||waiting.parentElement;add(box,'pnCrewWaiting');}
  return true;
}

function tagDetail(){
  var one=document.getElementById('pn5323OneStep');if(one)add(one,'pnTaskDetail');
  var any=document.getElementById('pnAnyDoneBox');if(any)add(any,'pnDoneBox');
  var big=document.getElementById('pnBigJobsHome');if(big)add(big,'pnBigJobs');
  big=document.getElementById('pnBigJobsToday');if(big)add(big,'pnBigJobs');
  var util=['OPEN FULL PROJECT WORK REGISTER','MORNING PACK','42.5 TEMPLATE','42.5 MM DEFAULT MITER TEMPLATE'];
  for(var i=0;i<util.length;i++)add(findButton(util[i]),'pnUtility');
}

function detectOther(nav){
  if(document.body.classList.contains('pnViewCrew')||document.body.classList.contains('pnViewJob'))return;
  var text=norm(document.body.innerText);
  if(text.indexOf('PROJECT PROGRESS')!==-1||text.indexOf('PROGRESS OVERVIEW')!==-1){clearView();document.body.classList.add('pnViewProgress');setNavActive(nav,'progress');}
  else if(text.indexOf('ALL TASKS')!==-1||text.indexOf('TASK LIST')!==-1){clearView();document.body.classList.add('pnViewTasks');setNavActive(nav,'tasks');}
}

function tag(){
  try{
    var nav=tagChrome();
    var crew=tagCrew(nav);
    if(!crew)tagMyJob(nav);
    tagDetail();
    detectOther(nav);
    document.documentElement.classList.add('pnPolishedReady');
  }catch(e){}
}

function style(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
:root{--pn-bg:#f4f5f2;--pn-card:#ffffff;--pn-soft:#f8f8f6;--pn-ink:#111820;--pn-muted:#69727a;--pn-line:#e4e6e2;--pn-navy:#182633;--pn-navy2:#223746;--pn-green:#23764a;--pn-green-soft:#edf7f0;--pn-gold:#c99a2e;--pn-gold-soft:#fff8e8;--pn-red:#a44740;--pn-red-soft:#fff4f2;--pn-shadow:0 14px 38px rgba(22,31,38,.07);--pn-shadow2:0 5px 18px rgba(22,31,38,.045)}
*{box-sizing:border-box}html{background:var(--pn-bg)!important;scrollbar-gutter:stable;-webkit-text-size-adjust:100%}body{margin:0!important;min-height:100dvh!important;background:linear-gradient(180deg,#fbfcfa 0,#f4f5f2 48%,#f2f3f0 100%)!important;color:var(--pn-ink)!important;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;text-rendering:optimizeLegibility!important}body:before{content:"";position:fixed;top:0;left:0;right:0;height:4px;background:var(--pn-navy);z-index:99999;pointer-events:none}button,a,[role="button"]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}button:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid rgba(201,154,46,.28)!important;outline-offset:2px!important}
.pnAppRoot{width:min(1180px,calc(100% - 44px))!important;max-width:1180px!important;margin:0 auto!important;padding:24px 0 108px!important}.pnAppRoot>*{max-width:none!important}.pnBrand{font-size:clamp(27px,2.2vw,34px)!important;line-height:1!important;letter-spacing:-.05em!important;font-weight:900!important;color:var(--pn-ink)!important}.pnLivePill{display:inline-flex!important;align-items:center!important;gap:7px!important;min-height:25px!important;padding:4px 9px!important;border-radius:999px!important;background:#edf7f0!important;color:#1e6a42!important;border:1px solid #d5eadc!important;font-size:9px!important;font-weight:850!important}.pnLiveText{font-weight:900!important;letter-spacing:.035em!important}.pnSyncText{font-size:9px!important;color:#858b90!important;font-weight:700!important}.pnSourceWrap{margin:10px 0 18px!important}.pnSource{display:block!important;padding:8px 0!important;border:0!important;border-top:1px solid var(--pn-line)!important;border-bottom:1px solid var(--pn-line)!important;border-radius:0!important;background:transparent!important;color:#81878c!important;font-size:8.5px!important;font-weight:650!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
.pnBottomNav{position:sticky!important;bottom:18px!important;z-index:600!important;width:min(620px,calc(100% - 22px))!important;margin:22px auto 0!important;padding:6px!important;border:1px solid rgba(218,221,217,.95)!important;border-radius:18px!important;background:rgba(255,255,255,.94)!important;box-shadow:0 14px 36px rgba(22,31,38,.11)!important;backdrop-filter:blur(16px)!important;-webkit-backdrop-filter:blur(16px)!important}.pnBottomNav button{min-height:44px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#667078!important;font-size:9px!important;font-weight:850!important;box-shadow:none!important}.pnBottomNav .pnNavActive{background:var(--pn-navy)!important;color:#fff!important}.pnBottomNav button:hover:not(.pnNavActive){background:#f2f4f1!important;color:var(--pn-ink)!important}
.pnCurrentJob{background:var(--pn-card)!important;border:1px solid var(--pn-line)!important;border-radius:24px!important;padding:22px!important;box-shadow:var(--pn-shadow)!important;margin:0 0 18px!important}.pnSectionTitle{font-size:12px!important;font-weight:900!important;letter-spacing:.08em!important;color:#303940!important}.pnActionRow{background:linear-gradient(135deg,#f1f8f3 0,#f8fbf9 100%)!important;border:1px solid #cfe5d6!important;border-radius:18px!important;padding:18px!important}.pnPrimaryAction,.pnSecondaryAction{min-height:56px!important;border-radius:13px!important;font-size:13px!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,box-shadow .12s ease!important}.pnPrimaryAction{background:var(--pn-navy)!important;border-color:var(--pn-navy)!important;color:#fff!important}.pnPrimaryAction:hover{background:var(--pn-navy2)!important;transform:translateY(-1px)!important;box-shadow:0 8px 20px rgba(24,38,51,.14)!important}.pnSecondaryAction{background:#fff!important;border:1px solid #dbc173!important;color:#85620b!important}.pnDisclosure{margin-top:9px!important;border:1px solid var(--pn-line)!important;border-radius:13px!important;background:var(--pn-soft)!important;box-shadow:none!important}.pnDisclosure button,.pnDisclosure summary{min-height:44px!important;padding:0 14px!important;font-size:9px!important;font-weight:800!important;color:#414a51!important}
body.pnViewCrew .pnCrewPage{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important}.pnCrewEyebrow{display:block!important;margin:0 0 3px!important;color:#8a9094!important;font-size:9px!important;font-weight:850!important;letter-spacing:.11em!important}.pnCrewHeading{display:block!important;margin:0 0 18px!important;font-size:clamp(28px,3vw,38px)!important;line-height:1!important;font-weight:900!important;letter-spacing:-.045em!important;color:var(--pn-ink)!important}.pnCrewHelp{display:none!important}.pnCrewStats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;margin:0 0 16px!important}.pnCrewStat{min-height:76px!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;padding:14px 16px!important;border:1px solid var(--pn-line)!important;border-radius:16px!important;background:var(--pn-card)!important;box-shadow:var(--pn-shadow2)!important;color:#59636b!important}.pnCrewStat *{margin:0!important}.pnCrewStat strong,.pnCrewStat b{font-size:22px!important;line-height:1!important;color:var(--pn-ink)!important}.pnCrewCard{position:relative!important;margin:0 0 12px!important;padding:18px 18px 16px!important;border:1px solid var(--pn-line)!important;border-radius:18px!important;background:var(--pn-card)!important;box-shadow:var(--pn-shadow2)!important;overflow:hidden!important}.pnCrewCard:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#cfd5d8}.pnCrewMitchell:before{background:var(--pn-green)}.pnCrewRonan:before{background:#6d8292}.pnCrewColin:before{background:var(--pn-gold)}.pnCrewName{display:flex!important;align-items:center!important;gap:10px!important;margin:0 0 4px!important;font-size:19px!important;line-height:1!important;font-weight:900!important;letter-spacing:-.025em!important;color:var(--pn-ink)!important}.pnCrewName:before{content:attr(data-initial);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#eef1f1;color:#36444e;font-size:12px;font-weight:900}.pnCrewMitchell .pnCrewName:before{background:#e8f5ed;color:#1f6a42}.pnCrewColin .pnCrewName:before{background:#fff4d8;color:#805e11}.pnCrewCurrent{display:block!important;margin:8px 0 5px!important;color:#6f7880!important;font-size:8px!important;letter-spacing:.08em!important;font-weight:850!important}.pnCrewCard h1,.pnCrewCard h2,.pnCrewCard h3,.pnCrewCard strong,.pnCrewCard b{color:var(--pn-ink)!important}.pnCrewCard .pnStateGood{display:inline-flex!important;width:auto!important;padding:4px 7px!important;border-radius:999px!important;background:var(--pn-green-soft)!important;color:#1f6b43!important;font-size:7.5px!important;font-weight:850!important}.pnCrewNext{margin-top:11px!important;padding-top:10px!important;border-top:1px solid #eceeea!important;color:#6f777d!important;font-size:9px!important;line-height:1.35!important}.pnCrewOpen,.pnCrewBlock{min-height:46px!important;border-radius:11px!important;font-size:9px!important;font-weight:900!important;box-shadow:none!important}.pnCrewOpen{background:var(--pn-navy)!important;border:1px solid var(--pn-navy)!important;color:#fff!important}.pnCrewBlock{background:transparent!important;border:1px solid transparent!important;color:#7b6b3c!important}.pnCrewOpen:hover{background:var(--pn-navy2)!important}.pnCrewSettings{margin:13px 0!important;border:1px solid var(--pn-line)!important;border-radius:12px!important;background:#fafbf9!important;color:#687078!important;box-shadow:none!important}.pnCrewSettings button,.pnCrewSettings summary{min-height:42px!important;font-size:8.5px!important;font-weight:800!important}.pnCrewWaiting{margin-top:14px!important;padding:15px!important;border:1px solid #ead9aa!important;border-left:4px solid var(--pn-gold)!important;border-radius:15px!important;background:var(--pn-gold-soft)!important;box-shadow:none!important}.pnCrewWaiting button{min-height:44px!important;border-radius:10px!important;box-shadow:none!important}
#taskCard{width:100%!important;max-width:none!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}#pn5323OneStep,.pnTaskDetail{background:var(--pn-card)!important;border:1px solid var(--pn-line)!important;border-radius:22px!important;overflow:hidden!important;box-shadow:var(--pn-shadow)!important;margin:18px 0!important}.pn5323Head{background:var(--pn-navy)!important;color:#fff!important;padding:21px 23px!important;position:relative!important}.pn5323Head:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--pn-gold)}.pn5323K{color:#bdc8d0!important;font-size:8px!important;font-weight:800!important;letter-spacing:.1em!important}.pn5323Title{font-size:clamp(25px,3vw,38px)!important;line-height:1.04!important;letter-spacing:-.045em!important;font-weight:900!important}.pn5323Block{margin:11px 15px 0!important;padding:14px 15px!important;border:1px solid var(--pn-line)!important;border-left:3px solid #bec7cc!important;border-radius:13px!important;background:#fff!important;box-shadow:none!important}.pn5323Block .pn5323Label{font-size:8px!important;font-weight:850!important;letter-spacing:.08em!important;color:#7b8388!important}.pn5323Block .pn5323Text{font-size:14px!important;line-height:1.5!important;color:#252d33!important;font-weight:700!important}.pn5323Block.check{border-left-color:var(--pn-gold)!important;background:#fffaf0!important}.pn5323Block.check.ok,.pn5323Block.done{border-left-color:var(--pn-green)!important;background:var(--pn-green-soft)!important}.pn5323Block.check.hold,.pn5323Block.stop{border-left-color:var(--pn-red)!important;background:var(--pn-red-soft)!important}.pn5323Actions{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;padding:15px!important}.pn5323Actions button{min-height:49px!important;border-radius:11px!important;font-size:9px!important;font-weight:900!important;box-shadow:none!important}.pn5323Actions .primary,#pn5323Primary{grid-column:1/-1!important;min-height:57px!important;background:var(--pn-navy)!important;color:#fff!important;border:0!important;font-size:12px!important}.pn5323Learn{margin:0 15px 15px!important;padding:13px!important;border:1px solid var(--pn-line)!important;border-radius:13px!important;background:var(--pn-soft)!important;box-shadow:none!important}
#pnBigJobsHome,#pnBigJobsToday,.pnBigJobs{margin:18px 0!important;padding:18px!important;background:var(--pn-card)!important;border:1px solid var(--pn-line)!important;border-radius:20px!important;box-shadow:var(--pn-shadow2)!important}.pnBigTitle{font-size:21px!important;font-weight:900!important;letter-spacing:-.035em!important}.pnBigSub{font-size:8px!important;color:#8a9094!important;font-weight:700!important}.pnBigRow{min-height:50px!important;padding:7px 1px!important;border-top:1px solid #eceeea!important}.pnBigNum{width:29px!important;height:29px!important;border-radius:9px!important;background:var(--pn-navy)!important;color:#fff!important;font-size:10px!important}.pnBigName{font-size:12px!important;font-weight:800!important}.pnBigTag{padding:5px 8px!important;border-radius:999px!important;background:#f0f2f1!important;color:#667078!important;font-size:7.5px!important;font-weight:850!important}.pnBigRow.now .pnBigTag{background:var(--pn-green-soft)!important;color:#1f6b43!important}.pnBigNote{display:none!important}.pnToolBtn,.pnUtility{min-height:46px!important;border-radius:11px!important;box-shadow:none!important}.pnToolBtn{background:var(--pn-navy)!important;border:0!important;color:#fff!important}.pnUtility{font-size:8.5px!important;font-weight:850!important}#pnAnyDoneBox,.pnDoneBox{border:1px solid #d0e7d8!important;border-radius:14px!important;background:var(--pn-green-soft)!important;box-shadow:none!important;padding:11px!important}#pnAnyDoneBtn{min-height:49px!important;border:0!important;border-radius:11px!important;background:var(--pn-green)!important;color:#fff!important;font-size:10px!important;font-weight:900!important}
#pnMorningPack,#pnMorningPackModal,.pnMorningPanel,.pnMorningModal{font-family:inherit!important}#pnMorningPack button,#pnMorningPackModal button,.pnMorningPanel button,.pnMorningModal button{border-radius:11px!important;box-shadow:none!important}#pnPlanOverlay{font-family:inherit!important}.pnPlanTop{background:var(--pn-navy)!important}.pnPlanControls button{border-radius:9px!important}.pnPlanLoading{border-radius:14px!important}
@media(min-width:980px){body.pnViewCrew .pnCrewCard{padding:20px 22px 18px!important}.pnCrewStats{gap:12px!important}.pnCrewOpen{min-width:320px!important}}
@media(max-width:760px){html{scrollbar-gutter:auto}.pnAppRoot{width:calc(100% - 14px)!important;padding:14px 0 86px!important}.pnBrand{font-size:24px!important}.pnSource{font-size:7.5px!important}.pnBottomNav{position:fixed!important;left:7px!important;right:7px!important;bottom:max(7px,env(safe-area-inset-bottom))!important;width:auto!important;margin:0!important;border-radius:15px!important}.pnBottomNav button{min-height:43px!important;font-size:8px!important}.pnCurrentJob{padding:14px!important;border-radius:18px!important}.pnActionRow{padding:13px!important;border-radius:15px!important}.pnPrimaryAction,.pnSecondaryAction{min-height:52px!important;font-size:11px!important}.pnCrewHeading{font-size:29px!important;margin-bottom:14px!important}.pnCrewStats{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}.pnCrewStat{min-height:64px!important;padding:10px!important;border-radius:13px!important}.pnCrewCard{padding:15px!important;border-radius:15px!important}.pnCrewName{font-size:17px!important}.pnCrewName:before{width:30px;height:30px}.pnCrewOpen,.pnCrewBlock{min-height:44px!important}.pnBigJobs{padding:14px!important;border-radius:17px!important}.pnBigTitle{font-size:18px!important}.pnBigRow{grid-template-columns:30px 1fr!important}.pnBigTag{grid-column:2!important;justify-self:start!important;margin-top:-4px!important}.pn5323Actions{grid-template-columns:1fr!important}.pn5323Actions .primary,#pn5323Primary{grid-column:1!important}}
`;
  document.head.appendChild(s);
}

style();
[0,220,700,1600].forEach(function(ms){setTimeout(tag,ms);});
document.addEventListener('click',function(e){
  try{
    var b=e.target&&e.target.closest?e.target.closest('button,a,[role="button"]'):null;
    if(b){var t=norm(b.textContent);if(t==='MY JOB'||t==='CREW'||t==='PROGRESS'||t==='TASKS'){setTimeout(tag,80);setTimeout(tag,360);}}
  }catch(x){}
},false);
window.addEventListener('pageshow',function(){setTimeout(tag,80);});
})();
