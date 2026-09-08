(function(){
'use strict';
if(window.YTIntelDeepResearch)return;
const ENDPOINT='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v093';
const contexts=new WeakMap(),modelTasks={};
let contract,stopped=false,started=0,ticker=null,lastBase={};
const ready=import('./v310-contract.mjs?v=0310').then(m=>contract=m);
const $=s=>document.querySelector(s),E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const A=x=>Array.isArray(x)?x:[];
const WORKERS={plan:'Lead researcher',summary:'Summary specialist',takeaways:'Takeaway specialist',mechanics:'Structure specialist',claims:'Claims researcher',remake:'Remake specialist',review:'Independent editor',final_review:'Final reviewer'};
const ERRORS={CREDIT_BALANCE_EXHAUSTED:'The OpenAI API project has exhausted its credit balance. Add API credit before running deep analysis; no transcript filler has been substituted.',INSUFFICIENT_QUOTA:'The OpenAI API has no usable credit or quota. No model-backed analysis was produced.',API_KEY_MISSING:'No server-side OpenAI API key is available.',RESEARCH_DAILY_LIMIT:'The protected daily deep-research allowance has been reached.',MODEL_TIMEOUT:'The model did not finish this stage within its request budget.',MODEL_OUTPUT_INCOMPLETE:'The provider stopped before completing the required output.',SESSION_EXPIRED:'Your session expired. Sign in again for deep research.',BUDGET_EXCEEDED:'The research budget was reached before all required checks passed.'};
function errorText(e){return ERRORS[e?.code]||e?.message||String(e||'Research unavailable');}
function status(stage,value,note){modelTasks[stage]={status:value,note:note||''};progress(lastBase);}
function reset(){stopped=false;lastBase={};started=Date.now();for(const k of Object.keys(modelTasks))delete modelTasks[k];for(const k of Object.keys(WORKERS))modelTasks[k]={status:'wait',note:'Waiting for source evidence'};clearInterval(ticker);ticker=setInterval(()=>{const e=$('#yt310Elapsed');if(e)e.textContent=`${Math.floor((Date.now()-started)/1000)}s elapsed`;},1000);}
function progress(base){
 lastBase=base||lastBase;const root=$('#yt300Progress');if(!root)return;
 if(!$('#yt310Workers')){const d=document.createElement('div');d.id='yt310Workers';d.className='yt310-workers';root.appendChild(d);}
 for(const [id,name] of Object.entries(WORKERS)){
  let row=$(`#yt310Worker-${id}`);if(!row){row=document.createElement('div');row.id=`yt310Worker-${id}`;row.className='yt310-worker';row.innerHTML=`<b>${E(name)}</b><span></span>`;$('#yt310Workers').appendChild(row);}
  const s=modelTasks[id]||{status:'wait',note:'Waiting'};row.dataset.status=s.status;const span=row.querySelector('span');if(span.textContent!==s.note)span.textContent=s.note;
 }
 const states=[...Object.values(lastBase),...Object.values(modelTasks).map(x=>x.status)],complete=states.filter(x=>x==='done').length;
 const pct=Math.round(complete/Math.max(1,states.length)*100);
 const bar=$('#yt300Bar'),label=$('#yt300Pct');if(bar)bar.style.width=`${pct}%`;if(label)label.textContent=`${pct}%`;
 root.dataset.phase=stopped?'stopped':'running';root.setAttribute('role','progressbar');root.setAttribute('aria-valuenow',String(pct));root.setAttribute('aria-valuemin','0');root.setAttribute('aria-valuemax','100');
 const p=root.querySelector('.yt300-room-head p');if(p&&!p.dataset.v310){p.dataset.v310='1';p.innerHTML='A lead researcher delegates separate model calls. Findings are checked against the source before release. <span id="yt310Elapsed">0s elapsed</span> <b>10-minute research budget; no artificial waiting.</b>';}
}
async function api(action,body,ctx){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),140000);
 const headers={'content-type':'application/json'};if(ctx?.token)headers['x-ytintel-run-token']=ctx.token;
 if(action==='begin')try{const s=await window.YTIntelAuth?.client?.auth?.getSession();if(s?.data?.session?.access_token)headers.authorization='Bearer '+s.data.session.access_token;}catch{}
 try{const r=await fetch(`${ENDPOINT}?action=research-${action}`,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal}),d=await r.json();if(!r.ok||d.ok===false)throw Object.assign(new Error(d.code||d.error||`HTTP ${r.status}`),{code:d.code||d.error});return d;}finally{clearTimeout(timeout);}
}
async function stage(ctx,name,attempt=0){
 if(Date.now()-ctx.started>600000)throw Object.assign(new Error('BUDGET_EXCEEDED'),{code:'BUDGET_EXCEEDED'});
 status(name,'run',attempt?'Revising against the editor findings':'Model call running');
 try{
  let d=await api('stage',{run_id:ctx.run_id,stage:name,attempt},ctx);
  const until=Date.now()+135000;
  while(d.pending&&Date.now()<until){await new Promise(r=>setTimeout(r,1800));d=await api('stage',{run_id:ctx.run_id,stage:name,attempt},ctx);}
  if(d.pending)throw Object.assign(new Error('MODEL_TIMEOUT'),{code:'MODEL_TIMEOUT'});
  ctx.calls++;ctx.results[name]=d;
  status(name,A(d.checks).length?'warn':'done',A(d.checks).length?`${d.checks.length} quality issue(s) require correction`:'Model returned; source checks complete');
  return d;
 }catch(e){status(name,'warn',errorText(e));throw e;}
}
function requireValid(d,name){if(!d?.data||A(d.checks).length)throw Object.assign(new Error(`${name} did not pass its synthesis/evidence checks`),{code:'QUALITY_REJECTED'});}
function merge(ctx,r){
 const s=ctx.results.summary.data,t=ctx.results.takeaways.data,m=ctx.results.mechanics.data,ev=ctx.evidence;
 const ref=x=>contract.evidenceRef(x,ev);
 const intel={summary:s.summary,benchmark_summary:s,benchmark_takeaways:t,benchmark_claims:ctx.results.claims.data,benchmark_mechanics:m,quality_pass:true,model:ctx.model,niche:{label:r?.content_niche||'Unclassified'}};
 intel.key_takeaways=t.items.map(x=>{const p=ref(x.evidence[0]);return {title:x.title,explanation:x.explanation+' '+x.application,timestamp:p.timestamp,quote:p.quote};});
 const h=ref(m.hook.opening);intel.hook={primary_type:m.hook.primary_type,why:m.hook.why,exact_quote:h.quote,timestamp:h.timestamp};
 intel.rehooks=m.rehooks.map(x=>{const p=ref(x.evidence);return {timestamp:p.timestamp,quote:p.quote,why:x.why,type:x.type};}).sort((a,b)=>a.timestamp.localeCompare(b.timestamp,undefined,{numeric:true}));
 intel.promise_fulfillment=m.payoffs.map(x=>{const p=ref(x.evidence);return {timestamp:p.timestamp,quote:p.quote,why:x.why,promise:x.promise};});
 intel.transferable_mechanics=m.transferable_mechanics.map(x=>{const p=ref(x.evidence);return {...x,timestamp:p.timestamp,quote:p.quote};});
 intel.format_engine={name:ctx.results.plan.data.video_kind,explanation:m.funnel.interpretation,stages:s.beats.map(x=>x.meaning)};
 intel.uncertainties=[...s.limitations,...m.uncertainties,...ctx.results.claims.data.limits];return intel;
}
async function synthesize(r,profile){
 await ready;const ctx={started:Date.now(),calls:0,results:{},profile:profile||{},evidence:contract.buildEvidence(r)};contexts.set(r,ctx);
 try{
  Object.assign(ctx,await api('begin',{report:r,profile}));
  requireValid(await stage(ctx,'plan'),'Lead plan');
  const names=['summary','takeaways','mechanics','claims'];
  const settled=await Promise.allSettled(names.map(n=>stage(ctx,n)));const failed=settled.find(x=>x.status==='rejected');if(failed)throw failed.reason;
  let review=await stage(ctx,'review');
  const bad=names.filter(n=>A(ctx.results[n].checks).length);
  for(const i of A(review.data?.issues))if(i.severity==='blocker'&&names.includes(i.section)&&!bad.includes(i.section))bad.push(i.section);
  if(bad.length||!review.data?.pass){
   const revise=bad.length?bad:['summary','takeaways'];
   await Promise.all(revise.map(n=>stage(ctx,n,1)));
   review=await stage(ctx,'review',1);
  }
  names.forEach(n=>requireValid(ctx.results[n],n));requireValid(review,'Independent review');
  const intelligence=merge(ctx,r);ctx.intelligence=intelligence;
  r.deep_research={version:'0.31.0',status:'synthesis_reviewed',model:ctx.model,model_calls:ctx.calls,checks:review.data};
  return {ok:true,intelligence,provider:'openai',fallback:false,review:review.data};
 }catch(e){
  ctx.error=errorText(e);ctx.code=e.code||'RESEARCH_UNAVAILABLE';
  for(const k of Object.keys(WORKERS))if(modelTasks[k]?.status==='wait')status(k,'warn','Blocked by an upstream research stage');
  r.deep_research={version:'0.31.0',status:'source_only',error:ctx.error,error_code:ctx.code,model_calls:ctx.calls};
  return {ok:false,intelligence:{quality_pass:false,research_error:ctx.error},provider:'unavailable',fallback:false,error:ctx.error};
 }
}
async function remake(r,profile,thumb){
 const ctx=contexts.get(r);if(!ctx?.intelligence?.quality_pass)return {ok:false,error:ctx?.error||'Reviewed synthesis is required before a remake.',intelligence:null};
 try{const d=await stage(ctx,'remake');requireValid(d,'Remake');ctx.remake=d.data;
  const packages=d.data.directions.map((x,i)=>({rank:i+1,title:x.title,alternate_titles:x.alternate_titles,concept:x.steal,opening_hook:x.opening_hook,thumbnail:{...x.thumbnail,visual:x.thumbnail.focal_subject},beat_sheet:x.beat_sheet,originality_delta:x.avoid,test_plan:x.measurement_plan.join(' '),source_evidence:x.evidence.map(e=>({source_title:r.video.title,channel:r.video.channel,observed_signal:contract.evidenceRef(e,ctx.evidence)?.timestamp,why_relevant:e.quote}))}));
  return {ok:true,intelligence:{packages,model:d.model},provider:'openai'};
 }catch(e){ctx.error=errorText(e);return {ok:false,intelligence:null,error:ctx.error};}
}
async function finalReview(r,intel,visual,remakeResult){
 const ctx=contexts.get(r);if(!ctx?.intelligence?.quality_pass||!remakeResult?.ok){status('final_review','warn','Not passed: required model output is missing');return {pass:false};}
 try{const d=await stage(ctx,'final_review');requireValid(d,'Final review');ctx.final=d.data;r.deep_research={...r.deep_research,status:'model_reviewed',final_review:d.data,model_calls:ctx.calls,media_limitations:visual?.error||null};return d.data;}
 catch(e){ctx.error=errorText(e);r.deep_research={...r.deep_research,status:'review_blocked',error:ctx.error};return {pass:false,error:ctx.error};}
}
function section(n,k,title,body){return `<section class="yt300-section" data-research-section="${n}"><div class="yt300-section-head"><div><div class="yt300-kicker">${E(k)}</div><h2>${E(title)}</h2></div><div class="yt300-stepno">${n}</div></div>${body}</section>`;}
function missing(n,k,r){const msg=contexts.get(r)?.error||r?.deep_research?.error||'Model-backed synthesis has not passed the quality gate.';return section(n,k,'Analysis unavailable - source evidence is preserved',`<div class="yt300-errorbox" role="status">${E(msg)}<p>Transcript excerpts are not being substituted for analysis. The transcript remains in section 17. Resolve the indicated problem, then run the research again.</p></div>`);}
function receipt(x,r){const p=contract.evidenceRef(x,contract.buildEvidence(r));return p?`<details class="yt310-receipt"><summary>Source evidence at ${E(p.timestamp)} (caption timing)</summary><blockquote>${E(p.quote)}</blockquote></details>`:'';}
function summaryHtml(r,intel){
 if(!intel?.quality_pass||!intel.benchmark_summary)return missing(2,'THE SUMMARY',r);
 const s=intel.benchmark_summary,e=contract.buildEvidence(r),m=intel.benchmark_mechanics;
 return section(2,'THE SUMMARY','What the video actually argues, shows and delivers',`<div class="yt300-callout"><p>${E(s.summary)}</p></div><div class="yt300-beats">${s.beats.map(b=>`<div class="yt300-beat"><time>${contract.stamp(e.segments.find(s=>s.id===b.start_segment)?.start)}</time><p>${E(b.meaning)}</p></div>`).join('')}</div><div class="yt300-callout"><b>Performance verdict - ${E(s.verdict_basis.replaceAll('_',' '))}</b><p>${E(s.verdict)}</p></div><details><summary>Commercial intent and evidence limits</summary><p>${E(m?.funnel?.interpretation||'Not established.')}</p>${A(s.limitations).map(x=>`<p>${E(x)}</p>`).join('')}</details>`);
}
function takeawaysHtml(r,intel){
 if(!intel?.quality_pass||!intel.benchmark_takeaways)return missing(3,'KEY TAKEAWAYS',r);
 const t=intel.benchmark_takeaways;
 return section(3,'KEY TAKEAWAYS',t.kind==='facts'?'The key facts and why they matter':'What to do with what you learned',`<div class="yt300-list">${t.items.map((x,i)=>`<div class="yt300-item"><div class="yt300-item-no">${i+1}</div><div><h3>${E(x.title)}</h3><p>${E(x.explanation)}</p><p><b>${t.kind==='facts'?'Significance':'Apply it'}:</b> ${E(x.application)}</p>${x.evidence.map(q=>receipt(q,r)).join('')}</div></div>`).join('')}</div>`);
}
function hooksHtml(r,intel){if(!intel?.quality_pass)return missing(4,'HOOK BREAKDOWN',r);const m=intel.benchmark_mechanics,h=m.hook,e=contract.buildEvidence(r),p=e.segments.find(s=>s.id===h.first_promise.segment_id);return section(4,'HOOK BREAKDOWN','The first 60 seconds: source lines and their jobs',`<h3>${E(h.primary_type)}</h3><p>${E(h.why)}</p>${receipt(h.opening,r)}<p>${p?`${contract.stamp(p.start)}: first explicit promise (caption-start timing).`:'No explicit first promise established.'}</p>${m.hook_lines.map(x=>`<article class="yt300-callout"><p>${E(x.job)}</p>${receipt(x.evidence,r)}</article>`).join('')}`);}
function payoffsHtml(r,intel){if(!intel?.quality_pass)return missing(6,'THE PAYOFFS',r);const m=intel.benchmark_mechanics,e=contract.buildEvidence(r),xs=m.payoffs.map(x=>({...x,ref:contract.evidenceRef(x.evidence,e)})).filter(x=>x.ref).sort((a,b)=>a.ref.start-b.ref.start);return section(6,'THE PAYOFFS','What pays the promise, and what remains a claim',`<div class="yt300-callout"><p>${E(m.title_promise_verdict)}</p><p>First identified payoff: ${xs.length?xs[0].ref.timestamp:'not established'}. Identified payoffs per minute: ${e.video.duration?(xs.length/(e.video.duration/60)).toFixed(2):'unavailable'}. This counts model-identified transcript moments, not measured viewer retention.</p></div>${xs.map(x=>`<article class="yt300-callout"><h3>${E(x.promise)}</h3><p>${E(x.why)}</p>${receipt(x.evidence,r)}</article>`).join('')}`);}
function brandBox(r){const p=contexts.get(r)?.profile||{};return `<div class="yt300-brandbox no-print"><textarea id="yt300BrandRules" placeholder="Your creator brand rules">${E(p.brand_rules||'')}</textarea><button class="btn" id="yt300SaveBrand">Save creator profile</button></div>`;}
function remakeHtml(r){const ctx=contexts.get(r);if(!ctx?.remake)return missing(14,'MAKE IT YOURS',r).replace('</section>',brandBox(r)+'</section>');return section(14,'MAKE IT YOURS','Original directions inside your creator brief',brandBox(r)+ctx.remake.directions.map((x,i)=>`<article class="yt300-callout"><h3>${i+1}. ${E(x.title)}</h3><p><b>Title variants:</b> ${x.alternate_titles.map(E).join(' / ')}</p><blockquote>${E(x.opening_hook)}</blockquote><ol>${x.beat_sheet.map(b=>`<li><b>${E(b.beat)}</b> - ${E(b.purpose)}<p>Show: ${E(b.evidence_to_show)}</p></li>`).join('')}</ol><p><b>Thumbnail:</b> ${E(x.thumbnail.focal_subject)}. ${E(x.thumbnail.composition)}. Text: ${E(x.thumbnail.text)}</p><p><b>Reuse:</b> ${E(x.steal)}</p><p><b>Do not copy:</b> ${E(x.avoid)}</p><p><b>Measure after publishing:</b> ${x.measurement_plan.map(E).join(' ')}</p>${x.evidence.map(q=>receipt(q,r)).join('')}</article>`).join(''));}
function exportHtml(r){const ctx=contexts.get(r),pass=ctx?.final?.pass===true;return section(16,'CROSS-CHECK / EXPORT',pass?'Model review passed for the supplied evidence':'Report incomplete - no model-review pass',`<div class="${pass?'yt300-callout':'yt300-errorbox'}"><p>${E(pass?ctx.final.summary:ctx?.error||'Required model stages have not passed.')}</p><p>${ctx?.calls||0} returned model calls. Media coverage and data limitations remain explicit; this is not a guarantee of factual accuracy.</p></div><div class="yt300-transcript-actions no-print"><button id="yt300CopyMd" class="btn">Copy report Markdown</button><button id="yt300DownloadMd" class="btn">Download report .md</button><button id="yt300Print" class="btn">Print / Save PDF</button></div>`);}
function decorate(r,intel){
 const root=$('#yt300Report');if(!root)return;
 const section=root.children[7];if(section&&intel?.benchmark_claims){let box=$('#yt310Claims');if(!box){box=document.createElement('details');box.id='yt310Claims';section.appendChild(box);}box.innerHTML='<summary>Claims ledger - what is supported versus asserted</summary>'+intel.benchmark_claims.claims.map(c=>`<article class="yt300-callout"><h3>${E(c.claim)}</h3><b>${E(c.assessment.replaceAll('_',' '))}</b><p>${E(c.reason)}</p>${receipt(c.evidence,r)}${c.sources.filter(s=>/^https?:\/\//.test(s.url)).map(s=>`<p><a href="${E(s.url)}" target="_blank" rel="noopener noreferrer">${E(s.title||s.url)}</a></p>`).join('')}</article>`).join('');}
}
function reportMarkdown(root){
 const text=node=>{
  if(node.nodeType===3)return node.textContent;
  if(node.nodeType!==1||node.matches('button,input,textarea,script,style,.no-print'))return '';
  const tag=node.tagName.toLowerCase(),body=Array.from(node.childNodes).map(text).join('');
  if(/^h[1-6]$/.test(tag))return `\n${'#'.repeat(Number(tag[1]))} ${body.trim()}\n`;
  if(tag==='a')return `[${body}](${node.getAttribute('href')||''})`;
  if(tag==='li')return '\n- '+body.trim();if(tag==='blockquote')return '\n> '+body.trim()+'\n';
  if(tag==='time')return body+' - ';if(tag==='br')return '\n';if(tag==='td'||tag==='th')return body+' | ';
  if(['p','div','section','article','details','summary','tr','ul','ol'].includes(tag))return '\n'+body.trim()+'\n';return body;
 };return '# YTIntel - Monday Brief\n'+text(root).replace(/\n{3,}/g,'\n\n');
}
function finish(synthesis={ok:false},remakeResult={ok:false}){stopped=true;clearInterval(ticker);progress(lastBase);const root=$('#yt300Progress');if(root){const h=root.querySelector('h2');if(h)h.textContent=synthesis.ok&&remakeResult.ok&&modelTasks.final_review?.status==='done'?'Research finished - review and limitations below':'Research incomplete - see the blocked stages';}}
function css(){if($('#yt310Style'))return;const s=document.createElement('style');s.id='yt310Style';s.textContent=`.yt300-progressbar{position:relative;overflow:hidden}.yt300-progressbar i{position:relative;transition:width .6s ease}.yt300-room[data-phase=running] .yt300-progressbar:after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.28),transparent);animation:yt310-sweep 1.7s linear infinite;pointer-events:none}@keyframes yt310-sweep{to{transform:translateX(100%)}}.yt310-workers{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;margin-top:12px}.yt310-worker{border:1px solid #303743;border-radius:10px;padding:12px}.yt310-worker b,.yt310-worker span{display:block}.yt310-worker span{font-size:12px;line-height:1.5;margin-top:5px}.yt310-worker[data-status=run]{border-color:#8da9ff}.yt310-worker[data-status=done]{border-color:#55e29d}.yt310-worker[data-status=warn]{border-color:#f5b96c}.yt310-receipt{margin-top:10px}.yt310-receipt summary{cursor:pointer;color:#9fb5d4;font-size:12px}#yt300Report p,#yt300Report li{line-height:1.65}#yt300Report .yt300-strip b{white-space:normal;overflow:visible}#yt310Elapsed{white-space:nowrap}@media(prefers-reduced-motion:reduce){.yt300-room .yt300-progressbar:after{animation:none}.yt300-progressbar i{transition:none}}`;document.head.appendChild(s);}
window.YTIntelDeepResearch={ready,synthesize,remake,finalReview,summaryHtml,takeawaysHtml,hooksHtml,payoffsHtml,remakeHtml,exportHtml,decorate,reportMarkdown,reset,progress,finish,canBank:r=>contexts.get(r)?.final?.pass===true};
css();
})();
