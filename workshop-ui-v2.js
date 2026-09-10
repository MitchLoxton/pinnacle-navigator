(function(){
'use strict';
if(window.__PN_WORKSHOP_UI_STABLE_5366__)return;
window.__PN_WORKSHOP_UI_STABLE_5366__=true;

/*
  v53.59 stability-first workshop skin.
  Important: this file deliberately does NOT poll, observe, resize, wrap,
  insert dashboards, or repeatedly rewrite the DOM. The previous visual
  layer re-applied layout classes after live task renders and could make the
  whole app jump between widths. This stylesheet is permanent once loaded,
  so newly rendered task content inherits the same geometry automatically.
*/

try{
  var old=document.getElementById('pnWorkshopUiStyleV2');
  if(old)old.remove();
  old=document.getElementById('pnWorkshopUiStyle');
  if(old)old.remove();
}catch(e){}

if(document.getElementById('pnWorkshopStableStyle5366'))return;
var s=document.createElement('style');
s.id='pnWorkshopStableStyle5366';
s.textContent=`
:root{
  --pn-bg:#eeede8;--pn-panel:#ffffff;--pn-panel2:#f8f7f3;--pn-ink:#111417;
  --pn-muted:#6b6e6a;--pn-line:#d8d6cf;--pn-steel:#181d21;--pn-steel2:#283035;
  --pn-amber:#f1b82d;--pn-green:#23764a;--pn-green-bg:#eaf7ef;
  --pn-red:#9b3030;--pn-blue:#315e78;--pn-shadow:0 16px 44px rgba(20,26,30,.10)
}
html{background:var(--pn-bg)!important;-webkit-text-size-adjust:100%!important;scrollbar-gutter:stable!important;overflow-y:scroll!important}
body{margin:0!important;min-height:100dvh!important;background:radial-gradient(circle at 50% -180px,#fff 0,#f7f6f1 36%,#eeede8 78%)!important;color:var(--pn-ink)!important;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important;text-rendering:optimizeLegibility!important}
body>div:first-of-type,.app{width:min(1180px,calc(100% - 32px))!important;max-width:1180px!important;min-width:0!important;margin-left:auto!important;margin-right:auto!important;padding-left:0!important;padding-right:0!important;transform:none!important;zoom:1!important}
body>div:first-of-type *, .app *{box-sizing:border-box!important}
body>div:first-of-type,body>div:first-of-type *, .app,.app *{transition-property:background-color,border-color,color,box-shadow,opacity!important;transition-duration:.12s!important}
.head{padding:14px 2px 12px!important;margin:0 0 10px!important;border-bottom:1px solid var(--pn-line)!important;align-items:center!important}
.brand{font-size:clamp(26px,2.15vw,34px)!important;line-height:1!important;letter-spacing:-.045em!important;font-weight:950!important}
.sub{font-size:10px!important;color:var(--pn-muted)!important;font-weight:850!important;letter-spacing:.055em!important;margin-top:5px!important}
.badge{background:var(--pn-steel)!important;color:#fff!important;border-radius:999px!important;padding:8px 11px!important;font-size:9px!important;font-weight:950!important}
.card,#taskCard{width:100%!important;max-width:none!important;min-width:0!important;border:1px solid var(--pn-line)!important;border-radius:23px!important;background:var(--pn-panel)!important;box-shadow:var(--pn-shadow)!important}
#taskCard{padding:18px!important;margin:0!important}
#taskCard h1,#taskCard h2,#taskCard h3{letter-spacing:-.035em!important}
#taskCard h1{font-size:clamp(30px,3vw,44px)!important;line-height:1!important;margin-top:4px!important;margin-bottom:14px!important}
#taskCard button,.card button{min-height:50px!important;border-radius:12px!important;font-weight:950!important;cursor:pointer!important;touch-action:manipulation!important}
#taskCard details,.card details{border-radius:13px!important}
#taskCard summary,.card summary{min-height:46px!important;display:flex!important;align-items:center!important;font-weight:900!important}
#taskCard .primary,#pn5323Primary{background:var(--pn-steel)!important;color:#fff!important;border-color:var(--pn-steel)!important}
#pnAnyDoneBox{border:1px solid #afd3bc!important;background:var(--pn-green-bg)!important;border-radius:16px!important;padding:12px!important}
#pnAnyDoneBtn{background:var(--pn-green)!important;color:#fff!important;border:0!important;min-height:56px!important;border-radius:12px!important}
#pn5323OneStep{width:100%!important;max-width:none!important;border:1px solid var(--pn-line)!important;border-radius:20px!important;background:#fff!important;box-shadow:var(--pn-shadow)!important;overflow:hidden!important}
.pn5323Head{background:linear-gradient(135deg,var(--pn-steel),var(--pn-steel2))!important;color:#fff!important;border-top:5px solid var(--pn-amber)!important;padding:18px!important}
.pn5323Title{font-size:clamp(25px,2.5vw,38px)!important;line-height:1.04!important;letter-spacing:-.04em!important}
.pn5323Block{border-radius:13px!important;margin:10px 12px 0!important;padding:13px!important}
.pn5323Actions{gap:8px!important;padding:12px!important}
.pn5323Actions button{min-height:52px!important;border-radius:12px!important;font-weight:950!important}
#pnBigJobsHome,#pnBigJobsToday{border:1px solid var(--pn-line)!important;border-radius:20px!important;background:#fff!important;box-shadow:var(--pn-shadow)!important;padding:14px!important}
.pnBigTitle{font-size:22px!important;letter-spacing:-.03em!important}.pnBigNum{background:var(--pn-steel)!important}.pnToolBtn{min-height:58px!important;border-radius:12px!important;background:var(--pn-steel)!important}
#pnMorningPack{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif!important}
button:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid rgba(241,184,45,.48)!important;outline-offset:2px!important}
@media(max-width:760px){
  html{overflow-y:auto!important;scrollbar-gutter:auto!important}
  body>div:first-of-type,.app{width:calc(100% - 14px)!important;padding-left:0!important;padding-right:0!important}
  .head{padding-top:8px!important}.brand{font-size:23px!important}.sub{font-size:8px!important}
  .card,#taskCard{border-radius:17px!important;padding:13px!important;box-shadow:0 8px 26px rgba(20,26,30,.08)!important}
  #taskCard h1{font-size:30px!important}.pn5323Title{font-size:28px!important}
}
@media(prefers-reduced-motion:reduce){body>div:first-of-type *, .app *{transition:none!important}}
`;
document.head.appendChild(s);

try{document.documentElement.setAttribute('data-pn-layout','stable-5366');}catch(e){}
})();
