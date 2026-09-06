(function(){
'use strict';
if(document.documentElement.dataset.yt295CoreHardening==='1')return;
document.documentElement.dataset.yt295CoreHardening='1';
window.YTINTEL_VERSION='0.29.5';

const API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=package';
const STORE='ytintel-v121-package-history';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),A=x=>Array.isArray(x)?x:[];
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const STOP=new Set('the a an and or but if then than to of in on at for from with as is are was were be been being it its this that these those you your we our they their video videos youtube creator creators channel channels what when where why how who which into about over under up down out new best top full official use using used make makes made get gets got just really very also now here there thing things people'.split(/\s+/));
const words=s=>clean(s).toLowerCase().replace(/[^a-z0-9%$'’-]+/g,' ').split(/\s+/).filter(x=>x.length>=3&&!STOP.has(x));
const norm=s=>clean(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function report(){try{return typeof lastReport!=='undefined'&&lastReport?lastReport:null}catch{return null}}
function read(k,f=[]){try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
function toast(s){try{window.YTIntelToast?.(s)}catch{}}

/* ---------- AUTH: one visible state, always derived from the canonical v291 client ---------- */
function auth(){return window.YTIntelAuth||null}
function signedIn(){return !!auth()?.signedIn}
function clearAuthError(el){if(!el)return;el.textContent='';el.classList.remove('show')}
function isAuthError(t){return /sign\s*in\s*(?:is\s*)?(?:required|to\s+use)|authentication required|must be signed in/i.test(String(t||''))}
function repairAuthSurface(){
  const on=signedIn();document.documentElement.dataset.ytintelAuth=on?'signed-in':'signed-out';
  ['#videoUrl','#analyseForm button','#packageAngle','#packageBtn'].forEach(sel=>$$(sel).forEach(n=>{n.disabled=false;n.removeAttribute('aria-disabled')}));
  const analyseErr=$('#error');if(isAuthError(analyseErr?.textContent))clearAuthError(analyseErr);
  const pkgErr=$('#packageError');if(isAuthError(pkgErr?.textContent)){
    if(on)clearAuthError(pkgErr);else{pkgErr.textContent=report()?'':'Analyse a video first. Sign-in is optional for Analyse and Packaging.';pkgErr.classList.toggle('show',!report())}
  }
  if(!on){$('#ytAuthWelcome')?.remove();$('#ytAuthHeroWelcome')?.remove()}
  const b=$('#v26AccountBtn');if(b){const t=clean(b.textContent).toLowerCase();if(on&&/sign in/.test(t))b.innerHTML='<span class="v26-cloud-dot"></span> Synced';if(!on&&/synced|welcome back/.test(t))b.textContent='Sign in / Sync'}
  const old=$('#v26Auth');if(old?.classList.contains('show')&&$('#ytAuthFix'))old.classList.remove('show');
}
async function refreshAuth(){try{await window.YTIntelAuthReady;await auth()?.refresh?.()}catch{}repairAuthSurface()}
window.YTIntelAuthDiagnostic=async()=>{await refreshAuth();const a=auth();return{canonical_client:!!a?.client,signed_in:!!a?.signedIn,user_id:a?.user?.id||null,analyse_enabled:!$('#analyseForm button')?.disabled,package_enabled:!$('#packageBtn')?.disabled,stale_auth_error:[...$$('#error,#packageError')].some(x=>isAuthError(x.textContent))}}

/* ---------- PACKAGING: client-side specificity contract + rejection gate ---------- */
function transcript(r){return A(r?.transcript?.segments).map(x=>({start:x.start??x.start_time??null,end:x.end??x.end_time??null,text:clean(x.text||x.content)})).filter(x=>x.text).slice(0,1200)}
function evidence(r){return{video:r?.video||{},hook_framework:r?.hook_framework||{},hook_story:r?.hook_story||{},summary_intelligence:r?.summary_intelligence||{},research_intelligence:r?.research_intelligence||{},why_it_worked_specific:A(r?.why_it_worked_specific).slice(0,40),content_extraction:{kind:r?.content_extraction?.kind,target_count:r?.content_extraction?.target_count,items:A(r?.content_extraction?.items).slice(0,100)},pacing:r?.pacing||{},heatmap:{available:!!r?.heatmap?.available,top_peaks:A(r?.heatmap?.top_peaks).slice(0,12)},visual_intelligence:r?.visual_intelligence||{},transcript:transcript(r)}}
function sourceAnchors(r){const all=[r?.video?.title,r?.video?.channel,...transcript(r).map(x=>x.text)].join(' '),m=new Map;for(const w of words(all))m.set(w,(m.get(w)||0)+1);return [...m.entries()].filter(([w,n])=>w.length>=4&&n<=18).sort((a,b)=>b[0].length-a[0].length||a[1]-b[1]).slice(0,80).map(x=>x[0])}
function titleOverlap(a,b){const A1=new Set(words(a)),B1=new Set(words(b));if(!A1.size||!B1.size)return 0;let n=0;for(const x of A1)if(B1.has(x))n++;return n/Math.min(A1.size,B1.size)}
const BANNED=/\b(what the winners do differently|playbook i would use from scratch|i tested .{0,50} to find what actually works|the truth about|everything you need to know|ultimate guide)\b/i;
function validatePackage(p,r,anchors){
  const src=A(p?.source_evidence),title=clean(r?.video?.title||''),channel=clean(r?.video?.channel||'');
  if(!clean(p?.title)||!clean(p?.opening_hook)||words(p.opening_hook).length<14)return'opening/title too thin';
  if(BANNED.test(clean(p.title)))return'generic title template';
  if(src.length<2)return'not enough source evidence';
  if(src.some(x=>clean(x?.why_relevant||x?.observed_signal).length<18))return'evidence explanation too vague';
  const citesCurrent=src.some(x=>titleOverlap(x?.source_title||'',title)>=.35||norm(x?.channel||'')===norm(channel));
  if(!citesCurrent)return'does not cite the current analysed source';
  const body=[p.title,p.concept,p.viewer_promise,p.opening_hook,p.originality_delta,...src.flatMap(x=>[x.source_title,x.observed_signal,x.why_relevant])].join(' ').toLowerCase();
  const hits=[...new Set(anchors.filter(a=>body.includes(a)))];
  if(hits.length<5)return'not enough transcript/source anchors';
  return''
}
function validateRun(packs,r){
  if(packs.length<3||packs.length>5)return'expected 3–5 genuinely different packages';
  const anchors=sourceAnchors(r);for(let i=0;i<packs.length;i++){const bad=validatePackage(packs[i],r,anchors);if(bad)return`Option ${i+1}: ${bad}`}
  for(let i=0;i<packs.length;i++)for(let j=i+1;j<packs.length;j++){const a=`${packs[i].title} ${packs[i].concept}`,b=`${packs[j].title} ${packs[j].concept}`;if(titleOverlap(a,b)>.72)return`Options ${i+1} and ${j+1} are too similar`}
  return''
}
function saveRecord(rec){const xs=A(read(STORE,[]));xs.unshift(rec);write(STORE,xs.slice(0,50));window.dispatchEvent(new Event('storage'))}
function md(p){const t=p.thumbnail||{};return[`# ${p.title||'Package'}`,'',p.concept||'','',`## Thumbnail`,`Visual: ${t.visual||'-'}`,`Focal subject: ${t.focal_subject||'-'}`,`Composition: ${t.composition||'-'}`,`Text: ${t.text||'-'}`,'',`## Opening hook`,p.opening_hook||'-','',`## Source evidence`,...A(p.source_evidence).map(x=>`- ${x.source_title||'Source'}: ${x.why_relevant||x.observed_signal||''}`),'',`## Originality`,p.originality_delta||'-'].join('\n')}
async function copyText(s){try{await navigator.clipboard.writeText(s);toast('Package copied.')}catch{}}
function renderPackages(intel,r,angle){
  const root=$('#packageRoot');if(!root)return;const packs=A(intel?.packages),source=clean(r?.video?.title||'Current analysis');
  root.innerHTML=`<section class="yt282-result-head"><div><div class="eyebrow">SOURCE GATE PASSED · DEEP PACKAGE</div><h2>${E(source)}</h2><p>${E(intel?.research_thesis?.opportunity||'Every option passed YTIntel’s source-specificity gate before being shown.')}</p></div><span>${packs.length} options</span></section><div class="yt282-package-grid">${packs.map((p,i)=>{const t=p.thumbnail||{};return`<article class="package-option yt282-package-option"><div class="split"><div><div class="eyebrow">OPTION ${i+1} · ${E(String(p.recommendation||'TEST').toUpperCase())}</div><h2>${E(p.title)}</h2></div><div class="yt282-score"><b>${Math.round(Number(p.package_score)||0)}</b><small>package</small></div></div><p class="yt282-promise">${E(p.concept||p.viewer_promise||'')}</p><div class="yt282-package-core"><div><small>THUMBNAIL DIRECTION</small><h3>${E(t.visual||'')}</h3><p>${E([t.focal_subject,t.composition,t.text?`Text: ${t.text}`:''].filter(Boolean).join(' · '))}</p></div><div><small>OPENING HOOK</small><blockquote>“${E(p.opening_hook||'')}”</blockquote><span>${E(p.viewer_promise||'')}</span></div></div><details><summary>Source receipts</summary><div class="yt282-detail">${A(p.source_evidence).map(x=>`<p><b>${E(x.source_title||'Evidence')}:</b> ${E(x.why_relevant||x.observed_signal||'')}</p>`).join('')}<p><b>Originality:</b> ${E(p.originality_delta||'')}</p></div></details><div class="yt282-package-actions"><button class="btn primary small" data-y295-copy="${i}">Copy package</button></div></article>`}).join('')}</div><div class="card" style="margin-top:14px"><div class="eyebrow">SPECIFICITY CONTRACT · PASS</div><p class="muted">Generic fallback is disabled. Each visible option cites the current analysed source, carries multiple source receipts, uses concrete source anchors and must differ materially from the other options.</p></div>`;
  root.querySelectorAll('[data-y295-copy]').forEach(b=>b.onclick=()=>copyText(md(packs[Number(b.dataset.y295Copy)])));
  saveRecord({id:`pkg-v295-${Date.now()}`,saved:Date.now(),query:source,angle,source_title:source,source_mode:'CURRENT_ANALYSIS_DEEP_VALIDATED',packages:packs,thesis:intel?.research_thesis||{},deep:true,specificity_gate:'passed',version:'0.29.5'});
}
async function runPackage(e){
  e?.preventDefault?.();e?.stopImmediatePropagation?.();const r=report(),angle=$('#packageAngle')?.value.trim()||'',err=$('#packageError'),load=$('#packageLoad'),btn=$('#packageBtn');
  if(err){err.textContent='';err.classList.remove('show')}
  if(!r){if(err){err.textContent='Analyse a video first. Packaging is built only from the current full analysis.';err.classList.add('show')}return}
  const tx=transcript(r);if(tx.length<8){if(err){err.textContent='YTIntel refused Packaging because this analysis does not contain enough transcript evidence.';err.classList.add('show')}return}
  const anchors=sourceAnchors(r),payload={research:{query:clean(r?.video?.title||'current analysis'),creator_angle:angle,require_deep_specificity:true,current_analysis_full:evidence(r),supporting_radar:null,specificity_contract:{source_title:clean(r?.video?.title||''),source_channel:clean(r?.video?.channel||''),transcript_segments:tx.length,required_source_receipts:2,required_anchor_hits:5,source_anchor_tokens:anchors.slice(0,45),reject_generic_templates:true,require_distinct_creative_territories:true},guardrails:{primary_rule:'Every package must be transcript/example/analysis specific. Reject generic reusable templates. The client will reject outputs that fail the source contract.'}},images:[r?.video?.thumbnail].filter(Boolean)};
  if(load){load.textContent='Deep-reading the actual transcript, examples, replay evidence and visuals…';load.classList.add('show')}if(btn){btn.disabled=true;btn.textContent='Checking source evidence…'}
  try{const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json','x-ytintel-client':'web-v0295'},body:JSON.stringify(payload)}),d=await res.json().catch(()=>({}));if(!res.ok||d?.ok===false)throw Error(d?.error||`Packaging engine ${res.status}`);if(d.fallback)throw Error('YTIntel rejected generic fallback. Nothing was shown or saved.');const intel=d.intelligence||d.data||d,packs=A(intel?.packages);const bad=validateRun(packs,r);if(bad)throw Error(`YTIntel rejected this package run: ${bad}. Nothing was shown or saved.`);renderPackages(intel,r,angle);toast('Deep packages passed the source-specificity gate.')}catch(x){if(err){err.textContent=x?.message||String(x);err.classList.add('show')}}finally{if(load)load.classList.remove('show');if(btn){btn.disabled=false;btn.textContent='Build deep packages →'}}
}
function bindPackaging(){const old=$('#packageBtn');if(!old||old.dataset.yt295==='1')return;const b=old.cloneNode(true);b.id='packageBtn';b.dataset.yt283='1';b.dataset.yt295='1';b.textContent='Build deep packages →';old.replaceWith(b);b.addEventListener('click',runPackage,true)}

function releaseCard(){const g=$('#updates .grid');if(!g||g.querySelector('[data-v295-release]'))return;g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));const a=document.createElement('article');a.className='card c12 release current';a.dataset.v295Release='1';a.innerHTML='<div class="eyebrow">V0.29.5 · 6 SEP 2026 · CURRENT</div><h3>Core Reliability Hardening</h3><ul class="list"><li><b>Auth state hardened:</b> visible signed-in/signed-out state is continuously reconciled against the one canonical Supabase session.</li><li><b>Core access stays open:</b> Analyse and source-specific Packaging no longer inherit stale sign-in-required UI states.</li><li><b>Packaging now has a client rejection gate:</b> generic templates, thin hooks, weak source receipts and near-duplicate options are rejected before anything is shown or saved.</li><li><b>No fake completion:</b> browser auth proof and real deep Packaging outputs are still required before the Founder Weekly checkpoints can close.</li></ul>';g.prepend(a)}
let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repairAuthSurface();bindPackaging();releaseCard()})}
async function init(){await refreshAuth();bindPackaging();releaseCard();window.addEventListener('ytintel:auth',refreshAuth);window.addEventListener('focus',refreshAuth);const o=new MutationObserver(refresh);o.observe(document.body,{childList:true,subtree:true,characterData:true});setTimeout(refresh,500);setTimeout(refresh,1600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init().catch(e=>console.warn('[YTIntel v295]',e))},{once:true});else init().catch(e=>console.warn('[YTIntel v295]',e));
})();
