(function(){
'use strict';
if(window.__PN_BALUSTRADE_FAB_GUIDANCE__)return;
window.__PN_BALUSTRADE_FAB_GUIDANCE__=true;

function taskById(id){try{return typeof TASKS!=='undefined'&&Array.isArray(TASKS)?TASKS.find(function(t){return t&&t.id===id;}):null;}catch(e){return null;}}

function apply(){
  try{
    var t06=taskById('T06'),t07=taskById('T07');
    if(!t06||!t07)return false;

    t06.title='PREP + SET THE 65NB UPRIGHTS';
    t06.action='Before batch-cutting the uprights, confirm the upright-to-top-rail joint preparation. Sheet 908 identifies the uprights and top horizontal rail as 65NB CHS welded frame but does not give the end-cut detail. If Colin confirms the actual members are the SAME outside diameter and meet square at 90 degrees, make the top of ONE test upright as a two-cut saddle / fishmouth: two mirror-image 45 degree cuts, then lightly dress and deburr it only as needed for an even fit. Fit that test piece to the real top rail before repeating the cut on the remaining uprights.';
    t06.right='The test upright is plumb and the 65NB top rail sits naturally in the saddle with even contact on both sides, no rocking, no forced gap and the saddle oriented in the direction of the rail. Only after that test fit is accepted should the cut be repeated.';
    t06.stop='STOP if the two members are not the same outside diameter, the joint is not a true 90 degree T-joint, the saw cannot securely clamp the round steel, or the first test saddle does not sit evenly. A simple single miter is not the required round-tube fit. Do not guess another angle — BLOCK / WAIT and get Colin to confirm the joint preparation.';
    t06.explain='For equal-diameter round tubes meeting at exactly 90 degrees, the exact saddle surface is formed by two mirror 45 degree cut planes. That rule stops being exact as soon as the tube diameters or intersection angle change, so verify the real steel and make one test piece before production cutting.';

    t07.title='FIT THE SADDLED UPRIGHTS + TACK THE 65NB TOP RAIL';
    t07.action='After the first saddle / fishmouth has been test-fitted and accepted, use that approved piece or a clear marked template as the reference for the remaining uprights. Mark the direction of the top rail on every upright so the saddle cannot be rotated 90 degrees by mistake. Secure each piece in the metal-cutting saw, make the same two mirror 45 degree cuts only if the confirmed geometry is still equal-diameter at 90 degrees, deburr / lightly dress the edges, then fit the top rail and tack it. Re-check the finished rail height before final welding.';
    t07.right='All uprights are plumb and aligned, every saddle supports the top rail consistently without rocking, and the top of the 65NB rail finishes 850 mm above the TOP of the finished ModWood level.';
    t07.stop='STOP if one saddle needs heavy grinding to fit, the rail rocks from post to post, an upright has been cut with the saddle facing the wrong direction, or the 850 mm height is being checked from the bare tray. Do not batch-copy a bad first cut.';
    t07.explain='The drawing gives the member size, welded-frame intent and finished guardrail height, but it does not spell out the workshop coping procedure. The safe workflow is one confirmed test saddle, then a repeatable template / jig, then tack and verify before final welding.';

    if(!window.__PN_BALUSTRADE_PLAN_CHECK_WRAP__&&typeof navigatorPlanCheck==='function'){
      var base=navigatorPlanCheck;
      navigatorPlanCheck=function(t){
        if(t&&/^(T06|T07)$/.test(String(t.id||''))){
          return {level:'warn',detail:'PLAN GAP: Sheet 908 shows the uprights and top horizontal rail as 65NB CHS welded frame, but it does not detail the upright end preparation. Confirm with Colin that the real joint is same-OD CHS at 90 degrees before using the two-cut 45 degree saddle method. Test one piece before batch cutting.'};
        }
        return base(t);
      };
      window.__PN_BALUSTRADE_PLAN_CHECK_WRAP__=true;
    }

    try{
      var cur=typeof currentPersonTask==='function'?currentPersonTask():null;
      if(cur&&/^(T06|T07)$/.test(String(cur.id||''))&&typeof renderTask==='function')renderTask();
    }catch(e){}
    return true;
  }catch(e){
    try{if(window.__pnDiagLog)window.__pnDiagLog('fabrication_guidance_error',e&&e.message?e.message:'Could not apply balustrade fabrication guidance',{phase:'task_patch'});}catch(_){}
    return false;
  }
}

if(!apply())setTimeout(apply,100);
setTimeout(apply,400);
window.addEventListener('pageshow',apply);
document.addEventListener('visibilitychange',function(){if(!document.hidden)apply();});
})();
