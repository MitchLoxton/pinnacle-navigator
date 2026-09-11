(function(){
'use strict';
if(window.__PN_EMAIL_AUDIT_5377__)return;
window.__PN_EMAIL_AUDIT_5377__=true;

var BUILD='5377';
var RELEASE='v53.70';
var APPLY_TIMES=[0,180,700,1800,3500];

function text(el){return String(el&&el.textContent||'').replace(/\s+/g,' ').trim();}
function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toUpperCase();}
function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function addStyle(){
  if(document.getElementById('pnEmailAuditStyle5377'))return;
  var s=document.createElement('style');
  s.id='pnEmailAuditStyle5377';
  s.textContent='\
#pnEmailAudit5377{margin:12px 0 0;border:1px solid #dfe6e2;border-radius:16px;background:#fff;overflow:hidden;color:#10202a;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;box-shadow:0 8px 24px rgba(16,37,52,.05)}\
#pnEmailAudit5377 .peaHead{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 15px;background:#102534;color:#fff;border-top:3px solid #d2a63d}\
#pnEmailAudit5377 .peaHead b{font-size:12px;letter-spacing:.04em}#pnEmailAudit5377 .peaHead span{font-size:7px;font-weight:900;color:#bed0d8;letter-spacing:.12em}\
#pnEmailAudit5377 .peaRule{margin:0;padding:10px 14px;background:#fff8e8;border-bottom:1px solid #eadfbf;color:#70551d;font-size:8px;font-weight:850;line-height:1.4}\
#pnEmailAudit5377 .peaGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px}\
#pnEmailAudit5377 .peaCard{min-height:82px;padding:12px;border:1px solid #e2e8e4;border-radius:12px;background:#f8faf8}\
#pnEmailAudit5377 .peaCard.hold{background:#fff6eb;border-color:#ead7ae}#pnEmailAudit5377 .peaCard.supplier{background:#f2f7f8;border-color:#d7e3e6}\
#pnEmailAudit5377 .peaK{font-size:6.5px;font-weight:950;letter-spacing:.12em;color:#708087;margin-bottom:5px}#pnEmailAudit5377 .peaCard.hold .peaK{color:#875f13}\
#pnEmailAudit5377 .peaT{font-size:11px;font-weight:950;line-height:1.22;margin-bottom:4px}#pnEmailAudit5377 .peaS{font-size:8px;font-weight:700;line-height:1.4;color:#53616a}\
#pnEmailAudit5377 details{border-top:1px solid #e4e9e6}#pnEmailAudit5377 summary{cursor:pointer;padding:11px 14px;font-size:8px;font-weight:950;letter-spacing:.06em;color:#102534;list-style:none}#pnEmailAudit5377 summary::-webkit-details-marker{display:none}\
#pnEmailAudit5377 .peaBody{padding:0 12px 12px;display:grid;gap:8px}#pnEmailAudit5377 .peaGroup{border:1px solid #e4e9e6;border-radius:12px;padding:11px 12px;background:#fff}#pnEmailAudit5377 .peaGroup h4{margin:0 0 7px;font-size:9px;letter-spacing:.05em}#pnEmailAudit5377 .peaGroup ul{margin:0;padding-left:17px}#pnEmailAudit5377 .peaGroup li{margin:5px 0;color:#40505a;font-size:8px;line-height:1.45;font-weight:650}\
#pnEmailAudit5377 .peaFoot{padding:9px 12px;border-top:1px solid #e4e9e6;background:#fafbf9;color:#6c777e;font-size:7px;font-weight:800;line-height:1.45}\
.pnEmailRegisterAdd5377{margin:14px 0;padding:14px;border:1px solid #dfe6e2;border-radius:14px;background:#f8faf8}.pnEmailRegisterAdd5377 h3{margin:0 0 8px;font-size:14px}.pnEmailRegisterAdd5377 p{margin:0 0 8px;font-size:9px;color:#55636b;line-height:1.45}.pnEmailRegisterAdd5377 ul{margin:0;padding-left:18px}.pnEmailRegisterAdd5377 li{margin:6px 0;font-size:9px;line-height:1.4}\
@media(max-width:700px){#pnEmailAudit5377 .peaGrid{grid-template-columns:1fr}#pnEmailAudit5377 .peaHead{align-items:flex-start;flex-direction:column;gap:4px}#pnEmailAudit5377 .peaCard{min-height:0}.pnEmailRegisterAdd5377{padding:11px}}';
  document.head.appendChild(s);
}

function patchLadderLabels(){
  var nodes=document.querySelectorAll('.pnBigName,button,a,div,span,strong');
  for(var i=0;i<nodes.length;i++){
    var el=nodes[i];
    if(el.closest&&el.closest('#pnEmailAudit5377,.pnEmailRegisterAdd5377'))continue;
    if(norm(text(el))==='2 LADDERS')el.textContent='1 LADDER + MODWOOD STEP';
  }
}

function auditMarkup(){
  return '<section id="pnEmailAudit5377" aria-label="Email audit project updates">'+
    '<div class="peaHead"><b>EMAIL AUDIT · VERIFIED PROJECT UPDATES</b><span>28 AUG · 1 SEP · 9 SEP 2026</span></div>'+
    '<p class="peaRule">EMAILS CONFIRM SCOPE / COORDINATION ONLY. CHECK THE ACCEPTED VO/PO + CURRENT APPROVED DRAWING BEFORE ANY DESIGN OR FABRICATION DETAIL.</p>'+
    '<div class="peaGrid">'+
      '<article class="peaCard hold"><div class="peaK">NEW HOLD · 9 SEP</div><div class="peaT">Arrange pre-site truck + tractor workshop inspection</div><div class="peaS">LD Total requested another workshop inspection before the truck and tractor leave for site. Book a suitable date before dispatch.</div></article>'+
      '<article class="peaCard hold"><div class="peaK">PROGRAMME · 2 SEP</div><div class="peaT">Final Playcheck first → target 5 Oct install</div><div class="peaS">Current email programme: if final Playcheck is satisfactory, aim for 5 Oct. Truck + framework first (2 days), then slab + big steps.</div></article>'+
      '<article class="peaCard supplier"><div class="peaK">WEBNET · 9 SEP</div><div class="peaT">Mesh ETA 2 Oct · supplier install following week</div><div class="peaS">Booking is still to be confirmed closer to arrival. Keep final inside dimensions / shop-drawing coordination open until supplier sign-off.</div></article>'+
      '<article class="peaCard"><div class="peaK">SCOPE CORRECTION · 1 SEP</div><div class="peaT">1 ladder + stepping-box / ModWood step</div><div class="peaS">Latest email says “all as per this email inc 1 ladder.” This replaces the old Navigator label “2 ladders”.</div></article>'+
    '</div>'+
    '<details><summary>SHOW EMAIL-SOURCED SUBTASKS</summary><div class="peaBody">'+
      '<div class="peaGroup"><h4>TRUCK SAFETY / FINISH · VERIFY CURRENT APPROVED DETAIL</h4><ul>'+
        '<li>Wheel-area non-climbable mesh / protection and removal of sharp spurs or protrusions.</li>'+
        '<li>Close the gap between climbing boxes / truck side where required by the reviewed safety comments.</li>'+
        '<li>Safe exposed tray-underside steel edges; arris exposed ModWood edges on the truck.</li>'+
        '<li>Plug exposed tray-side holes and provide rear chassis cover plates where approved.</li>'+
        '<li>Front-window mesh / sharp-edge treatment. The email review identifies this as one scope item, not two duplicates.</li>'+
        '<li>Engine-bay cavity protection, timber door panels, remove the mid-window strut, disengage steering wheel from wheels, remove indicator column; pedals may remain / move per the review note.</li>'+
      '</ul></div>'+
      '<div class="peaGroup"><h4>TRUCK SURFACE / PAINT / PROTECTION</h4><ul>'+
        '<li>Ply protection to three sides of the truck — use the corrected single item, not the earlier duplicate.</li>'+
        '<li>Paint tray four sides; cab paint was already treated separately in the email thread.</li>'+
        '<li>Paint front grille / headlight surrounds white and four dome headlights yellow, subject to accepted VO/PO scope.</li>'+
      '</ul></div>'+
      '<div class="peaGroup"><h4>RESTRAINT / INTERFACE · HOLD FOR APPROVED DETAIL</h4><ul>'+
        '<li>Tray hold-down bolts / plates — email-sourced scope only; use the approved connection detail before fabrication or installation.</li>'+
        '<li>Front / rear ModWood end-stop plates — email-sourced scope only; verify approved detail before fabrication.</li>'+
        '<li>Slide interface / handholds are in the email review. Do not fabricate from email dimensions alone; current approved drawing / shop detail controls.</li>'+
        '<li>Ladder-to-step connection wording in the email is ambiguous. HOLD until the current approved drawing / Colin clarifies the connection.</li>'+
      '</ul></div>'+
      '<div class="peaGroup"><h4>WEBNET SUPPLIER COORDINATION</h4><ul>'+
        '<li>Revised supplier scope records 9 panels; later email records all panels at 726 high.</li>'+
        '<li>Supplier notes individual lacing per panel and requires final inside dimensions / shop-drawing coordination before production.</li>'+
        '<li>Current ETA is 2 Oct with supplier installation planned for the following week; final booking pending.</li>'+
      '</ul></div>'+
      '<div class="peaGroup"><h4>BY OTHERS — DO NOT ASSIGN TO PINNACLE</h4><ul>'+
        '<li>Actual slide installation and its installer footings are by the LD installer. Pinnacle scope is the step / interface framework only.</li>'+
        '<li>Actual cargo-net installation and its installer footings are by others. Pinnacle scope is the support / interface steel only.</li>'+
      '</ul></div>'+
    '</div></details>'+
    '<div class="peaFoot">SOURCE STATUS: project email audit only. Email comments are not a substitute for current IFC / engineering / approved shop drawings. No existing DONE state is changed by this panel.</div>'+
  '</section>';
}

function installAuditCard(){
  var host=document.getElementById('pnBigJobsHome')||document.getElementById('pnBigJobsToday');
  if(!host||document.getElementById('pnEmailAudit5377'))return;
  host.insertAdjacentHTML('afterend',auditMarkup());
}

function installRegisterAdditions(){
  var modal=document.getElementById('pn5345Modal');
  if(!modal||modal.querySelector('.pnEmailRegisterAdd5377'))return;
  var body=modal.querySelector('.pn5345Body,.pn5345Content,[data-body]')||modal;
  var box=document.createElement('section');
  box.className='pnEmailRegisterAdd5377';
  box.innerHTML='<h3>EMAIL AUDIT ADDITIONS</h3><p>Verified Mundi correspondence reviewed through 9 Sep 2026. These are register additions / coordination holds; current approved drawings still control fabrication detail.</p><ul>'+
    '<li><b>NEW HOLD:</b> arrange pre-site truck + tractor workshop inspection before dispatch.</li>'+
    '<li><b>PROGRAMME:</b> final Playcheck gate → target 5 Oct; truck + framework first, slab + big steps after.</li>'+
    '<li><b>SCOPE CORRECTION:</b> 1 ladder + stepping-box / ModWood step; old “2 ladders” label superseded by the 1 Sep email.</li>'+
    '<li><b>WEBNET:</b> ETA 2 Oct, supplier install following week, final booking and shop-drawing / inside-dimension coordination still open.</li>'+
    '<li><b>TRUCK SAFETY / FINISH:</b> add the email-reviewed mesh, gap-infill, edge-safing, hole/cover, cab/interior, ply, paint and restraint/interface sub-items shown in the Email Audit panel; exact design detail remains HOLD until approved.</li>'+
    '<li><b>BY OTHERS:</b> actual slide and cargo-net installation / installer footings stay outside Pinnacle physical-install scope.</li>'+
  '</ul>';
  body.appendChild(box);
}

function apply(){
  try{addStyle();patchLadderLabels();installAuditCard();installRegisterAdditions();}catch(e){try{console.warn('Navigator email audit',e);}catch(_){}}
}

for(var i=0;i<APPLY_TIMES.length;i++)setTimeout(apply,APPLY_TIMES[i]);
document.addEventListener('click',function(){setTimeout(apply,120);},{passive:true});
window.addEventListener('pageshow',function(){setTimeout(apply,80);});
document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(apply,80);});
})();
