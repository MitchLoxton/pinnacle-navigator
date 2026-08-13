(function(){
'use strict';
if(window.__PN_BALUSTRADE_FAB_GUIDANCE__)return;
window.__PN_BALUSTRADE_FAB_GUIDANCE__=true;

function taskById(id){try{return typeof TASKS!=='undefined'&&Array.isArray(TASKS)?TASKS.find(function(t){return t&&t.id===id;}):null;}catch(e){return null;}}
function currentTask(){try{if(typeof previewTaskId!=='undefined'&&previewTaskId&&typeof TASKS!=='undefined')return TASKS.find(function(t){return t&&t.id===previewTaskId;})||null;if(typeof currentPersonTask==='function')return currentPersonTask()||null;}catch(e){}return null;}
function installStyle(){if(document.getElementById('pnMiterStyle'))return;var s=document.createElement('style');s.id='pnMiterStyle';s.textContent='\
#pnMiterTemplateBox{margin:10px 0;border:2px solid #111;background:#fff8d9;border-radius:14px;padding:12px}.pnMiterKicker{font-size:10px;font-weight:900;letter-spacing:.07em;color:#6e5500}.pnMiterTitle{font-size:16px;font-weight:900;line-height:1.25;margin-top:2px}.pnMiterText{font-size:12px;line-height:1.4;margin-top:6px;color:#333}.pnMiterWarn{font-size:11px;font-weight:900;color:#8d2020;line-height:1.35;margin-top:7px}.pnMiterBtn{width:100%;border:0;border-radius:11px;background:#111;color:#fff;padding:13px 12px;font-size:14px;font-weight:900;margin-top:10px;min-height:48px}.pnMiterBtn.colin{background:#8d2020}.pnMiterExperiment{background:#fff1f1;border:1px solid #d7a0a0;border-radius:10px;padding:9px;margin-top:9px}.pnMiterExperiment .pnMiterTitle{color:#8d2020;font-size:14px}\
';document.head.appendChild(s);}
function openTemplate(path){try{var w=window.open(path,'_blank','noopener');if(!w)location.href=path;}catch(e){location.href=path;}}
function ensureTemplateButton(){
  try{
    installStyle();var t=currentTask(),host=document.getElementById('taskCard'),old=document.getElementById('pnMiterTemplateBox');
    if(!host||!t||!/^(T06|T07)$/.test(String(t.id||''))){if(old)old.remove();return false;}
    if(old&&host.contains(old))return true;if(old)old.remove();
    var box=document.createElement('div');box.id='pnMiterTemplateBox';box.innerHTML='<div class="pnMiterKicker">WORKSHOP TEMPLATES · 65NB CHS</div><div class="pnMiterTitle">STANDARD UPRIGHT FISHMOUTH TEMPLATE</div><div class="pnMiterText">True-size wrap template for a <b>76.1 mm OD upright</b> meeting a <b>76.1 mm OD top rail at 90°</b>. Print it, wrap it around one test upright and transfer the cut line.</div><div class="pnMiterWarn">CHECK FIRST: measure BOTH real pipes. Only use the standard template if both outside diameters are 76.1 mm and Colin confirms the joint is 90°. Test one before batch cutting.</div><button type="button" class="pnMiterBtn" id="pnMiterPrint">PRINT STANDARD 65NB MITER TEMPLATE</button><div class="pnMiterExperiment"><div class="pnMiterKicker">COLIN VERSION · EXPERIMENT 1</div><div class="pnMiterTitle">33° TWO-CUT TEST TEMPLATE</div><div class="pnMiterText">Colin\'s 33° mirrored two-cut experiment for the same 76.1 mm OD pipe.</div><div class="pnMiterWarn">TEST PIECE ONLY: this is NOT the exact equal-diameter 90° fishmouth geometry. Print at 100%, verify the scale and cut only ONE test piece until Colin physically accepts the fit.</div><button type="button" class="pnMiterBtn colin" id="pnMiterColin33">PRINT COLIN 33° EXPERIMENT</button></div><div class="pnMiterExperiment"><div class="pnMiterKicker">COLIN VERSION · SECOND IDEA</div><div class="pnMiterTitle">30° TWO-CUT TEST TEMPLATE</div><div class="pnMiterText">Colin\'s second requested experiment: a 30° mirrored two-cut profile for the same 76.1 mm OD pipe.</div><div class="pnMiterWarn">TEST PIECE ONLY: keep this separate from production uprights. Print at 100%, verify the 100 mm scale and cut ONE test piece so Colin can compare the physical fit with the 33° and standard versions.</div><button type="button" class="pnMiterBtn colin" id="pnMiterColin30">PRINT COLIN 30° SECOND IDEA</button></div><div class="pnMiterExperiment"><div class="pnMiterKicker">COLIN VERSION · THIRD IDEA</div><div class="pnMiterTitle">36° TWO-CUT TEST TEMPLATE</div><div class="pnMiterText">Colin\'s third requested experiment: a 36° mirrored two-cut profile for the same 76.1 mm OD pipe.</div><div class="pnMiterWarn">TEST PIECE ONLY: keep this separate from production uprights. Print at 100%, verify the 100 mm scale and cut ONE test piece so Colin can compare the physical fit with the standard, 33° and 30° versions.</div><button type="button" class="pnMiterBtn colin" id="pnMiterColin36">PRINT COLIN 36° THIRD IDEA</button></div>';
    var anchor=document.getElementById('planCheck')||document.getElementById('quickSteps')||document.getElementById('clarityWhere');
    if(anchor&&anchor.parentNode===host)anchor.insertAdjacentElement('afterend',box);else host.appendChild(box);
    box.querySelector('#pnMiterPrint').onclick=function(){openTemplate('./miter-template.html');};
    box.querySelector('#pnMiterColin33').onclick=function(){openTemplate('./miter-template-colin-33.html');};
    box.querySelector('#pnMiterColin30').onclick=function(){openTemplate('./miter-template-colin-30.html');};
    box.querySelector('#pnMiterColin36').onclick=function(){openTemplate('./miter-template-colin-36.html');};
    return true;
  }catch(e){return false;}
}

function apply(){
  try{
    var t06=taskById('T06'),t07=taskById('T07');
    if(!t06||!t07)return false;

    t06.title='PREP + SET THE 65NB UPRIGHTS';
    t06.action='Before batch-cutting the uprights, confirm the upright-to-top-rail joint preparation. Sheet 908 identifies the uprights and top horizontal rail as 65NB CHS welded frame but does not give the end-cut detail. Navigator provides the STANDARD 65NB MITER TEMPLATE for the confirmed 76.1 mm OD / 90 degree case, plus three clearly separated Colin experiments: 33°, 30° and his third idea at 36°. For any option, print at Actual Size / 100%, verify the 100 mm scale bar and make ONE test upright first. The Colin versions are comparison experiments only and must not be batch-copied until Colin physically accepts a test fit.';
    t06.right='For the standard method, the printed 100 mm scale check measures exactly 100 mm, the real upright and rail both measure 76.1 mm OD, the test upright is plumb, and the 65NB top rail sits naturally in the saddle with even contact on both sides, no rocking and no forced gap. Colin\'s 33°, 30° and 36° experiments remain clearly identified test pieces until accepted.';
    t06.stop='STOP if either real pipe is not 76.1 mm OD, the print scale check is wrong, the saw cannot securely clamp the round steel, or a test saddle does not sit evenly. Never batch-copy any Colin experiment until he has physically inspected and accepted that test fit.';
    t06.explain='The drawing tells us the members are 65NB CHS but does not provide the workshop coping template. Navigator therefore keeps the standard template separate from Colin\'s 33°, 30° and 36° experiments so the crew can compare one test piece of each without confusing an experiment with the production method.';

    t07.title='FIT THE SADDLED UPRIGHTS + TACK THE 65NB TOP RAIL';
    t07.action='After a STANDARD printed-template saddle / fishmouth has been test-fitted and accepted, use that accepted reference for production uprights. If Colin is comparing the separate 33°, 30° or 36° experiments, keep each one to a single clearly identified test piece until he accepts or rejects the fit. Mark the direction of the top rail on every upright, deburr / lightly dress the edges, then fit the top rail and tack it. Re-check the finished rail height before final welding.';
    t07.right='All production uprights are plumb and aligned, every accepted saddle supports the top rail consistently without rocking, and the top of the 65NB rail finishes 850 mm above the TOP of the finished ModWood level. Colin experimental pieces remain separate until explicitly accepted.';
    t07.stop='STOP if one saddle needs heavy grinding to fit, the rail rocks from post to post, an upright is cut with the saddle facing the wrong direction, or the 850 mm height is being checked from the bare tray. Do not batch-copy a bad first cut or an unapproved 33° / 30° / 36° experiment.';
    t07.explain='The repeatable production workflow is to verify the real geometry, print and scale-check the chosen template, test one upright, then copy only an accepted physical fit. Colin\'s 33°, 30° and 36° versions are stored separately for comparison tests only.';

    if(!window.__PN_BALUSTRADE_PLAN_CHECK_WRAP__&&typeof navigatorPlanCheck==='function'){
      var base=navigatorPlanCheck;
      navigatorPlanCheck=function(t){
        if(t&&/^(T06|T07)$/.test(String(t.id||''))){
          return {level:'warn',detail:'PLAN GAP: Sheet 908 shows the uprights and top horizontal rail as 65NB CHS welded frame, but it does not detail the upright end preparation. Navigator keeps the STANDARD template separate from COLIN 33°, COLIN 30° and COLIN 36° experiments. Each experimental version must remain a single test piece until Colin accepts the physical fit.'};
        }
        return base(t);
      };
      window.__PN_BALUSTRADE_PLAN_CHECK_WRAP__=true;
    }

    ensureTemplateButton();
    try{var cur=currentTask();if(cur&&/^(T06|T07)$/.test(String(cur.id||''))&&typeof renderTask==='function'){renderTask();setTimeout(ensureTemplateButton,0);}}catch(e){}
    return true;
  }catch(e){
    try{if(window.__pnDiagLog)window.__pnDiagLog('fabrication_guidance_error',e&&e.message?e.message:'Could not apply balustrade fabrication guidance',{phase:'task_patch'});}catch(_){}
    return false;
  }
}

if(!apply())setTimeout(apply,100);
setTimeout(function(){apply();ensureTemplateButton();},400);
setInterval(ensureTemplateButton,1200);
window.addEventListener('pageshow',function(){apply();ensureTemplateButton();});
document.addEventListener('visibilitychange',function(){if(!document.hidden){apply();ensureTemplateButton();}});
})();
