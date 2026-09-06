(function(){
'use strict';
if(document.documentElement.dataset.yt282ProductFix==='1')return;
document.documentElement.dataset.yt282ProductFix='1';
window.YTINTEL_VERSION='0.28.2';

const PACKAGE_STORE='ytintel-v121-package-history';
const RADAR_STORE='ytintel-v120-radar-history';
const ANALYSIS_STORE='ytintel-v09-history';
const PACKAGE_API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=package';
const SUPA='https://dkmacktcfhubsumwrydw.supabase.co';
const PUB='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
const A=x=>Array.isArray(x)?x:[];
const N=x=>Number(x);
const F=x=>x!==null&&x!==undefined&&x!==''&&Number.isFinite(Number(x));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,f=null){try{const v=localStorage.getItem(k);return v==null?f:JSON.parse(v)}catch{return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
function toast(s){if(typeof window.YTIntelToast==='function')window.YTIntelToast(s);else console.info('[YTIntel]',s)}
function fmtDate(ts){try{return new Date(ts).toLocaleString(undefined,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}catch{return''}}
function clean(s){return String(s||'').replace(/\s+/g,' ').trim()}
function keyOf(x){return clean(x?.url||x?.title||x?.id).toLowerCase()}
function outlierOf(x){const v=x?.outlier?.multiple??x?.outlier_multiple??x?.outlier;return F(v)?N(v):null}
function packageHistory(){return A(read(PACKAGE_STORE,[]))}
function latestRadar(){return A(read(RADAR_STORE,[]))[0]||null}
function latestSavedAnalysis(){return A(read(ANALYSIS_STORE,[]))[0]||null}
function currentFullReport(){try{return typeof lastReport!=='undefined'&&lastReport?lastReport:null}catch{return null}}
function currentAnalysis(){return currentFullReport()||latestSavedAnalysis()||null}
function analysisTitle(r){return clean(r?.video?.title||r?.title||'')}
function analysisChannel(r){return clean(r?.video?.channel||r?.channel||'')}
function analysisUrl(r){const v=r?.video||{};return clean(v.webpage_url||v.original_url||v.url||r?.url||(v.id?`https://www.youtube.com/watch?v=${v.id}`:''))}
function analysisThumb(r){return clean(r?.video?.thumbnail||r?.thumbnail||'')}
function analysisOutlier(r){return outlierOf(r?.video||r)}
function analysisNiche(r){return clean(r?.content_niche||r?.niche||r?.research_intelligence?.niche?.label||r?.research_intelligence?.niche||'')}
function analysisHook(r){return clean(r?.hook_framework?.exact_line||r?.hook_framework?.primary_type||r?.hook||r?.research_intelligence?.hook_analysis?.hook_type||'')}
function analysisMechanics(r){return A(r?.research_intelligence?.actionable_summary?.transferable_mechanics||r?.mechanics).map(x=>clean(x?.mechanic||x?.statement||x)).filter(Boolean).slice(0,8)}
function analysisSummary(r){return clean(r?.summary_intelligence?.takeaway||r?.research_intelligence?.format_engine?.one_sentence_engine||r?.research_intelligence?.actionable_summary?.one_sentence||'')}
function replayPeaks(r){return A(r?.heatmap?.top_peaks).slice(0,5).map(x=>({seconds:F(x?.time)?N(x.time):null,intensity:F(x?.value)?N(x.value):null}))}
function visualTargets(r){return A(r?.visual_intelligence?.hotzone_targets).slice(0,8).map(x=>({time:x?.timestamp||x?.time||null,driver:clean(x?.likely_driver||x?.reason||'')}))}

function normalizeRadar(v){return{title:clean(v?.title||'Untitled'),channel:clean(v?.channel||v?.source_seed||''),url:clean(v?.url||v?.webpage_url||''),thumbnail:clean(v?.thumbnail||''),outlier:outlierOf(v),score:F(v?.score)?N(v.score):null,verdict:clean(v?.verdict||''),confidence:clean(v?.confidence||'')}}
function buildResearch(report,scan,angle){
  const title=analysisTitle(report),channel=analysisChannel(report),url=analysisUrl(report),thumb=analysisThumb(report),outlier=analysisOutlier(report);
  const current=title?{title,channel,url,thumbnail:thumb,outlier,score:100,verdict:'CURRENT ANALYSIS',confidence:'DIRECT ANALYSIS'}:null;
  const radarVideos=A(scan?.videos).map(normalizeRadar);
  const ranked=radarVideos.slice().sort((a,b)=>(N(b.score)||0)-(N(a.score)||0)||(N(b.outlier)||0)-(N(a.outlier)||0));
  const winners=[];
  if(current)winners.push(current);
  for(const v of ranked){
    if(winners.length>=6)break;
    if((F(v.outlier)&&v.outlier>=1.5)||(F(v.score)&&v.score>=62)){
      if(!winners.some(x=>keyOf(x)===keyOf(v)))winners.push(v);
    }
  }
  if(winners.length<3){for(const v of ranked){if(winners.length>=5)break;if(!winners.some(x=>keyOf(x)===keyOf(v)))winners.push(v)}}
  const winnerKeys=new Set(winners.map(keyOf));
  const controls=ranked.filter(v=>!winnerKeys.has(keyOf(v))&&((F(v.outlier)&&v.outlier<1.5)||String(v.verdict).toUpperCase().includes('CONTROL'))).slice(0,4);
  const query=clean(scan?.query||analysisNiche(report)||title||angle||'current YouTube analysis');
  return{
    query,
    creator_angle:clean(angle),
    source_mode:current?'CURRENT_ANALYSIS':'LATEST_RADAR',
    source_title:title||query,
    current_analysis:current?{
      title,channel,url,outlier,
      summary:analysisSummary(report),
      opening_hook:analysisHook(report),
      transferable_mechanics:analysisMechanics(report),
      replay_peaks:replayPeaks(report),
      visual_hotzones:visualTargets(report)
    }:null,
    winners,
    controls,
    clusters:A(scan?.clusters).slice(0,10),
    guardrails:{rule:'Create an original thumbnail, title and opening-hook package from the current analysis. Use other saved research only as supporting context. Do not copy competitor wording or layouts and do not predict views or CTR.'}
  }
}
function sourceImages(research){const xs=[];const add=u=>{u=clean(u);if(/^https:\/\//i.test(u)&&!xs.includes(u))xs.push(u)};add(analysisThumb(currentAnalysis()));for(const x of [...A(research.winners),...A(research.controls)])add(x.thumbnail);return xs.slice(0,12)}
function mdPackage(p){const t=p.thumbnail||{};return[`# ${p.title||'YTIntel package'}`,'',p.concept||p.viewer_promise||'','',`## Thumbnail`,`Visual: ${t.visual||'-'}`,`Focal subject: ${t.focal_subject||'-'}`,`Composition: ${t.composition||'-'}`,`Text: ${t.text||'-'}`,`Curiosity gap: ${t.curiosity_gap||'-'}`,'',`## Opening hook`,`${p.opening_hook||'-'}`,'',`## Viewer promise`,`${p.viewer_promise||'-'}`,'',`## Test plan`,`${p.test_plan||'-'}`].join('\n')}
async function copyText(s){try{await navigator.clipboard.writeText(s);toast('Package copied.')}catch{toast('Could not copy the package.')}}
function saveRecord(record){const xs=packageHistory().filter(x=>x.id!==record.id);xs.unshift(record);write(PACKAGE_STORE,xs.slice(0,50));window.dispatchEvent(new Event('storage'))}

function renderPackageResult(intel,research,angle,meta={}){
  const root=$('#packageRoot');if(!root)return;
  const packs=A(intel?.packages);
  if(!packs.length){root.innerHTML='<div class="card empty">No package options came back. Try a clearer angle or run the analysis again.</div>';return}
  const thesis=intel?.research_thesis||{};
  root.innerHTML=`<section class="yt282-result-head"><div><div class="eyebrow">PACKAGE READY - ${meta.fallback?'ALWAYS-ON ENGINE':'CLOUD ENHANCED'}</div><h2>${E(research.source_title||research.query)}</h2><p>${E(thesis.opportunity||'Original title, thumbnail and hook directions built from the current analysis.')}</p></div><span>${packs.length} options</span></section><div class="yt282-package-grid">${packs.map((p,i)=>{const t=p.thumbnail||{};return`<article class="package-option yt282-package-option"><div class="split"><div><div class="eyebrow">OPTION ${p.rank||i+1} - ${E(String(p.recommendation||'TEST').toUpperCase())}</div><h2>${E(p.title||'Untitled package')}</h2></div><div class="yt282-score"><b>${F(p.package_score)?Math.round(N(p.package_score)):'-'}</b><small>package</small></div></div><p class="yt282-promise">${E(p.concept||p.viewer_promise||'')}</p><div class="yt282-package-core"><div><small>THUMBNAIL DIRECTION</small><h3>${E(t.visual||'Build one dominant visual idea')}</h3><p>${E([t.focal_subject,t.composition,t.text?`Text: ${t.text}`:''].filter(Boolean).join(' - '))}</p>${t.curiosity_gap?`<span>${E(t.curiosity_gap)}</span>`:''}</div><div><small>OPENING HOOK</small><blockquote>"${E(p.opening_hook||'')}"</blockquote><span>${E(p.viewer_promise||'')}</span></div></div><div class="yt282-package-actions"><button class="btn primary small" data-yt282-copy-result="${i}">Copy package</button><details><summary>Why this direction</summary><div class="yt282-detail"><p><b>Originality:</b> ${E(p.originality_delta||'Built as an original execution from the supplied analysis.')}</p><p><b>Risk:</b> ${E(p.risk||'Treat this as a test, not a prediction.')}</p>${A(p.alternate_titles).length?`<p><b>Alternate titles:</b> ${E(A(p.alternate_titles).join(' | '))}</p>`:''}</div></details></div></article>`}).join('')}</div>`;
  root.querySelectorAll('[data-yt282-copy-result]').forEach(b=>b.onclick=()=>copyText(mdPackage(packs[N(b.dataset.yt282CopyResult)])));
  const record={id:`pkg-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,saved:Date.now(),query:research.query,angle:clean(angle),source_title:research.source_title,source_mode:research.source_mode,source_url:analysisUrl(currentAnalysis()),thesis,packages:packs};
  saveRecord(record);renderFolders();
}
async function runPackaging(){
  const report=currentAnalysis(),scan=latestRadar(),angle=$('#packageAngle')?.value.trim()||'';
  const err=$('#packageError'),load=$('#packageLoad'),root=$('#packageRoot'),btn=$('#packageBtn');
  if(err){err.classList.remove('show');err.textContent=''}
  if(!report&&!scan){if(err){err.textContent='Analyse a video first, then build the package from that analysis.';err.classList.add('show')}return}
  const research=buildResearch(report,scan,angle);
  if(root)root.innerHTML='';if(load){load.textContent=report?'Building thumbnail, title and opening-hook packages from your current analysis...':'Building packages from your latest saved research...';load.classList.add('show')}if(btn){btn.disabled=true;btn.textContent='Building packages...'}
  try{
    const r=await fetch(PACKAGE_API,{method:'POST',headers:{'content-type':'application/json','x-ytintel-client':'web-v0282'},body:JSON.stringify({research,images:sourceImages(research)})});
    const d=await r.json().catch(()=>({}));if(!r.ok||d?.ok===false)throw Error(d?.error||`Packaging engine ${r.status}`);
    const intel=d?.intelligence||d?.data||d;if(!A(intel?.packages).length)throw Error('The packaging engine returned no package options.');
    renderPackageResult(intel,research,angle,{fallback:!!d.fallback});
    toast('Package built and saved to your Package Library.');
  }catch(e){if(err){err.textContent=e?.message||String(e);err.classList.add('show')}else toast(e?.message||'Packaging failed.')}
  finally{if(load)load.classList.remove('show');if(btn){btn.disabled=false;btn.textContent='Build packages'}}
}

function folderPackage(p,i){const t=p.thumbnail||{};return`<article class="yt282-folder-package"><div class="yt282-folder-rank">${i+1}</div><div class="grow"><div class="yt282-folder-title"><b>${E(p.title||'Untitled package')}</b><span>${F(p.package_score)?Math.round(N(p.package_score)):'-'} score</span></div><div class="yt282-folder-cols"><div><small>THUMBNAIL</small><p>${E(t.visual||t.focal_subject||'No thumbnail direction saved.')}</p></div><div><small>OPENING HOOK</small><p>"${E(p.opening_hook||'')}"</p></div></div><button class="btn small" data-yt282-copy-history="${i}">Copy this package</button></div></article>`}
function renderFolders(){
  const root=$('#packageRecent');if(!root)return;
  const xs=packageHistory();const sig=xs.map(x=>`${x.id}:${x.saved}:${A(x.packages).length}`).join('|');
  if(root.dataset.yt282Sig===sig&&root.querySelector('[data-yt282-library]'))return;
  root.dataset.yt282Sig=sig;
  if(!xs.length){root.innerHTML='<div data-yt282-library><div class="eyebrow">PACKAGE LIBRARY</div><h3>Your packages will stack here.</h3><p class="muted">Analyse a video, build a package, and every run will be saved here as an expandable folder.</p></div>';return}
  root.innerHTML=`<div data-yt282-library><div class="yt282-library-head"><div><div class="eyebrow">PACKAGE LIBRARY</div><h2>Every package you have built</h2><p>Each run is saved as a folder. Click one to reopen all of its thumbnail, title and hook options.</p></div><span>${xs.length} folder${xs.length===1?'':'s'}</span></div><div class="yt282-folders">${xs.map((r,ri)=>`<details class="yt282-folder" ${ri===0?'open':''}><summary><div><small>${E((r.source_mode||'PACKAGE').replace(/_/g,' '))} - ${E(fmtDate(r.saved))}</small><b>${E(r.source_title||r.query||'Packaging session')}</b><span>${E(r.angle||'No extra angle')} - ${A(r.packages).length} option${A(r.packages).length===1?'':'s'}</span></div><i>+</i></summary><div class="yt282-folder-body">${A(r.packages).map(folderPackage).join('')}</div></details>`).join('')}</div></div>`;
  root.querySelectorAll('.yt282-folder').forEach((d,ri)=>{const icon=d.querySelector('summary i');if(icon)icon.textContent=d.open?'-':'+';d.addEventListener('toggle',()=>{const i=d.querySelector('summary i');if(i)i.textContent=d.open?'-':'+'});const packs=A(xs[ri]?.packages);d.querySelectorAll('[data-yt282-copy-history]').forEach(b=>b.onclick=()=>copyText(mdPackage(packs[N(b.dataset.yt282CopyHistory)])))});
}

function patchPackagingCopy(){
  const view=$('#packaging');if(!view)return;
  const hero=view.querySelector(':scope > .hero');if(hero){
    const eye=hero.querySelector('.eyebrow'),p=hero.querySelector('p');
    if(eye)eye.textContent='CURRENT ANALYSIS -> THUMBNAIL -> TITLE -> OPENING HOOK';
    if(p)p.textContent='Draft up a thumbnail, title and opening-hook package based off your current analysis. YTIntel turns the evidence you already pulled from the video into original package directions you can test.';
  }
  const use=$('#packageUseRadar');if(use)use.textContent='Use current analysis';
  const input=$('#packageAngle');if(input)input.placeholder='Optional angle or twist - e.g. beginner version, 7-day test, no-budget version';
  const load=$('#packageLoad');if(load&&!load.classList.contains('show'))load.textContent='Building thumbnail, title and opening-hook packages from your current analysis...';
  let source=$('#yt282PackageSource');const report=currentAnalysis();
  if(hero&&!source){source=document.createElement('div');source.id='yt282PackageSource';source.className='yt282-source';const form=hero.querySelector('.formrow');form?.insertAdjacentElement('afterend',source)}
  if(source)source.innerHTML=report?`<span></span><b>Current analysis:</b> ${E(analysisTitle(report)||'Analysed video')}`:'<span class="idle"></span><b>No analysis loaded yet.</b> Analyse a video first, then come back here.';
  const rail=view.querySelector('.v19-screen-rail');if(rail){const label=rail.querySelector('.v19-rail-label span');if(label)label.textContent='Creative packaging from your current analysis';const steps=rail.querySelectorAll('.v19-rail-step');const data=[['01','Analysis','Use the video evidence'],['02','Package','Draft thumbnail + title + hook'],['03','Library','Save every version']];steps.forEach((s,i)=>{const d=data[i];if(!d)return;const em=s.querySelector('em'),b=s.querySelector('b'),sm=s.querySelector('small');if(em)em.textContent=d[0];if(b)b.textContent=d[1];if(sm)sm.textContent=d[2]})}
  const goal=document.querySelector('[data-goal="package"]');if(goal){const span=goal.querySelector('span:not(.v20-goal-icon)');if(span)span.textContent='Draft an original thumbnail, title and opening hook from the video analysis you already have.'}
}
function useCurrentAnalysis(){const r=currentAnalysis();if(!r){toast('Analyse a video first, then Packaging Lab can use that analysis.');document.querySelector('.tabs [data-tab="analyse"]')?.click();setTimeout(()=>$('#videoUrl')?.focus(),80);return}patchPackagingCopy();toast(`Current analysis loaded: ${analysisTitle(r)||'analysed video'}`)}

function replaceLabelText(label,newText){if(!label)return;const node=Array.from(label.childNodes).find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(node)node.textContent=newText;else label.insertBefore(document.createTextNode(newText),label.firstChild)}
function patchWorkspace(){
  const card=$('#v24Setup .v24-modal-card')||Array.from(document.querySelectorAll('.v24-modal-card,.v22-modal-card')).find(x=>(x.textContent||'').includes('Workspace / channel name'));
  if(!card)return;
  const h=card.querySelector('h2'),p=card.querySelector('.muted,.v24-modal-top p,p');
  if(h)h.textContent='Set your creator context.';
  if(p)p.textContent='Tell YTIntel what channel you are building, who the videos are for, and which creators you want it to compare against. Save it once; you can edit it anytime.';
  const inputs=Array.from(card.querySelectorAll('label'));
  for(const l of inputs){const t=l.textContent.trim();if(t.startsWith('Workspace / channel name'))replaceLabelText(l,'Channel / workspace name');else if(t.startsWith('Your channel or @handle'))replaceLabelText(l,'Your YouTube channel or @handle');else if(t.startsWith('Niche / audience'))replaceLabelText(l,'What your channel is about');else if(t.startsWith('Direct competitors'))replaceLabelText(l,'Competitors to track (optional)')}
  const ta=card.querySelector('textarea');if(ta)ta.placeholder='One YouTube channel per line. Add the creators you actually want YTIntel to compare against.';
  card.querySelectorAll('button').forEach(b=>{const t=b.textContent.trim();if(t==='Find competitors for me')b.textContent='Suggest competitors';if(t==='Save workspace')b.textContent='Save creator context'});
  const note=Array.from(card.querySelectorAll('.source-note,small,p')).find(x=>(x.textContent||'').includes('Competitors are for research only'));
  if(note)note.textContent='Used to personalise searches and comparisons. This does not change YTIntel scoring thresholds.';
}

let cloudHealing=false;
async function tryRefreshCloudSession(){
  if(cloudHealing||sessionStorage.getItem('ytintel-v282-cloud-refresh')==='1')return;
  if(!window.supabase?.createClient)return;
  cloudHealing=true;sessionStorage.setItem('ytintel-v282-cloud-refresh','1');
  try{const c=window.supabase.createClient(SUPA,PUB,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});const r=await c.auth.refreshSession();if(!r.error&&r.data?.session){toast('Cloud session refreshed. Reconnecting...');setTimeout(()=>location.reload(),350)}}catch{}finally{cloudHealing=false}
}
function patchCloudError(){
  const host=$('#v26CloudHost');if(!host)return;
  const text=(host.textContent||'').toLowerCase();if(!/jwt issued at future|database 401/.test(text))return;
  const h=host.querySelector('h2'),p=host.querySelector('p'),b=host.querySelector('[data-v26-account],button');
  if(h)h.textContent='Cloud sync needs a quick reconnect.';
  if(p)p.textContent='Your local research is safe. The saved login session was rejected, so cloud sync is paused. Reconnect your account once to refresh the session.';
  if(b)b.textContent='Reconnect account';
  tryRefreshCloudSession();
}
function patchSignedInAnalysisError(){
  const err=$('#error');if(!err)return;const t=(err.textContent||'').trim().toLowerCase();
  const signed=!!$('#ytAuthWelcome')||/synced|welcome back/i.test($('.top')?.textContent||'');
  if(signed&&t==='sign in required.'){err.textContent='';err.classList.remove('show')}
}

function injectCss(){if($('#yt282Style'))return;const s=document.createElement('style');s.id='yt282Style';s.textContent=`
#packaging .yt282-source{display:flex;align-items:center;gap:7px;margin-top:10px;color:#9aa6b8;font-size:11px}.yt282-source span{width:7px;height:7px;border-radius:50%;background:#64dda2;box-shadow:0 0 0 3px rgba(100,221,162,.08)}.yt282-source span.idle{background:#697386}.yt282-source b{color:#dce3ec}.yt282-result-head,.yt282-library-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin:6px 0 14px}.yt282-result-head h2,.yt282-library-head h2{margin:4px 0 5px}.yt282-result-head p,.yt282-library-head p{margin:0;color:#8e99aa}.yt282-result-head>span,.yt282-library-head>span{border:1px solid #303744;border-radius:999px;padding:6px 9px;color:#aab4c4;white-space:nowrap}.yt282-package-grid{display:grid;gap:12px}.yt282-package-option{padding:18px}.yt282-score{text-align:center;min-width:58px}.yt282-score b{display:block;font-size:25px}.yt282-score small,.yt282-package-core small,.yt282-folder-cols small{color:#778397;font-size:9px;font-weight:900;letter-spacing:.12em}.yt282-promise{color:#aab4c4}.yt282-package-core{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.yt282-package-core>div{padding:14px;border:1px solid #28303c;border-radius:13px;background:#0b0f15}.yt282-package-core h3{margin:6px 0}.yt282-package-core p,.yt282-package-core blockquote{margin:7px 0;color:#d7dde7}.yt282-package-core blockquote{padding:10px 12px;border-left:3px solid #ff5b69;background:#080b10;border-radius:0 10px 10px 0}.yt282-package-core span{color:#7f8b9d;font-size:10px;line-height:1.45}.yt282-package-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:12px}.yt282-package-actions details{flex:1;min-width:200px}.yt282-package-actions summary{cursor:pointer;color:#9ca8b9;font-size:10px}.yt282-detail{padding:10px 0;color:#8d98aa;font-size:10px}.yt282-folders{display:grid;gap:9px}.yt282-folder{border:1px solid #29313d;border-radius:15px;background:#0b0e13;overflow:hidden}.yt282-folder[open]{border-color:#3b4655;background:#0d1117}.yt282-folder summary{list-style:none;display:flex;justify-content:space-between;gap:14px;align-items:center;padding:14px 16px;cursor:pointer}.yt282-folder summary::-webkit-details-marker{display:none}.yt282-folder summary div{display:grid;gap:3px}.yt282-folder summary small{color:#6f7b8e;font-size:8px;font-weight:900;letter-spacing:.11em}.yt282-folder summary b{color:#eef2f7}.yt282-folder summary span{color:#8894a5;font-size:10px}.yt282-folder summary i{font-style:normal;width:28px;height:28px;border:1px solid #303846;border-radius:9px;display:grid;place-items:center;color:#c7d0dc}.yt282-folder-body{border-top:1px solid #252c37;padding:10px;display:grid;gap:8px}.yt282-folder-package{display:flex;gap:10px;padding:12px;border:1px solid #252c37;border-radius:12px;background:#090c11}.yt282-folder-rank{width:25px;height:25px;border-radius:8px;background:#191f29;display:grid;place-items:center;color:#8f9bad;font-size:10px;font-weight:900}.yt282-folder-title{display:flex;justify-content:space-between;gap:12px}.yt282-folder-title span{color:#7e8a9a;font-size:9px}.yt282-folder-cols{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}.yt282-folder-cols p{margin:3px 0;color:#aeb7c4;font-size:10px;line-height:1.4}@media(max-width:760px){.yt282-package-core,.yt282-folder-cols{grid-template-columns:1fr}.yt282-result-head,.yt282-library-head{display:block}.yt282-result-head>span,.yt282-library-head>span{display:inline-block;margin-top:8px}}
`;document.head.appendChild(s)}

function patchStatus(){const s=$('#status');if(s){s.textContent='v0.28.2 - Always-On intelligence live';s.style.borderColor='rgba(85,226,157,.48)';s.style.color='#9af1c2'}}
function patchAll(){patchStatus();patchPackagingCopy();renderFolders();patchWorkspace();patchCloudError();patchSignedInAnalysisError()}
function bindCapture(){
  document.addEventListener('click',e=>{const build=e.target.closest?.('#packageBtn');if(build){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();runPackaging();return}const use=e.target.closest?.('#packageUseRadar');if(use){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();useCurrentAnalysis()}},true)
}
function init(){injectCss();bindCapture();patchAll();const recent=$('#packageRecent');if(recent)new MutationObserver(()=>renderFolders()).observe(recent,{childList:true,subtree:true});let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(patchAll,80)}).observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('storage',patchAll);window.addEventListener('focus',patchAll);setTimeout(patchAll,500);setTimeout(patchAll,1600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
