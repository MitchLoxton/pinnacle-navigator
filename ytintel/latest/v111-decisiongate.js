(function(){
const VERSION='0.11.1', RELEASE='ytintel-whats-new-0.11.1-decision-gate';
const E=x=>typeof esc==='function'?esc(x):String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a=0,b=100)=>Math.max(a,Math.min(b,n));
const arr=x=>Array.isArray(x)?x:[];
function getAI(r){return r?.ai_intelligence?.intelligence||r?.ai_intelligence||null}
function uploadAgeDays(v){const raw=v?.upload_date;if(!raw)return null;let d;if(/^\d{8}$/.test(String(raw)))d=new Date(`${String(raw).slice(0,4)}-${String(raw).slice(4,6)}-${String(raw).slice(6,8)}T00:00:00Z`);else d=new Date(raw);if(Number.isNaN(d.valueOf()))return null;return Math.max(0,(Date.now()-d.valueOf())/86400000)}
function evaluate(r){
  const v=r?.video||{},o=v?.outlier||{},a=getAI(r),q=r?.research_intelligence||{},ce=r?.content_extraction||{},hf=r?.hook_framework||{};
  const transcript=!!r?.transcript?.available;
  const segments=arr(r?.transcript?.segments).length;
  const heatmap=!!r?.heatmap?.available;
  const peaks=arr(r?.heatmap?.top_peaks).length;
  const outlier=Number(o?.multiple), sample=Number(o?.sample_size);
  const receipts=arr(r?.why_it_worked_specific).length;
  const takeaways=arr(ce?.items).length;
  const rehooks=arr(a?.rehooks||r?.rehook_examples).length;
  const mechanics=arr(a?.transferable_mechanics||q?.actionable_summary?.transferable_mechanics).length;
  const hasHook=!!(hf?.exact_line||a?.hook?.exact_quote||a?.hook?.exact_line);
  const age=uploadAgeDays(v);
  let score=0;
  if(transcript)score+=15;
  if(segments>=40)score+=4;else if(segments>=12)score+=2;
  if(heatmap)score+=12;
  if(peaks>=3)score+=4;else if(peaks)score+=2;
  if(Number.isFinite(outlier))score+=6;
  if(sample>=10)score+=16;else if(sample>=6)score+=13;else if(sample>=3)score+=9;else if(Number.isFinite(sample)&&sample>0)score+=4;
  score+=Math.min(15,receipts*4);
  if(hasHook)score+=8;
  score+=Math.min(10,takeaways*2);
  if(a)score+=6;
  if(mechanics>=2)score+=4;
  score=clamp(Math.round(score));

  const strongBaseline=Number.isFinite(outlier)&&outlier>=1.5;
  const breakout=Number.isFinite(outlier)&&outlier>=3;
  const weakBaseline=Number.isFinite(outlier)&&outlier<1.15;
  const thinSample=!Number.isFinite(sample)||sample<3;
  const hardLimit=!transcript;
  let verdict='TEST', label='TEST BEFORE COMMITTING', tone='warn';
  if(hardLimit||score<45||weakBaseline){verdict='HOLD';label='HOLD · EVIDENCE TOO WEAK';tone='hot'}
  else if(score>=76&&strongBaseline&&!thinSample&&receipts>=2){verdict='GO';label='GO · STRONG ENOUGH TO BUILD FROM';tone='good'}
  else if(score>=62&&(strongBaseline||!Number.isFinite(outlier))){verdict='TEST';label='TEST · PROMISING, NOT PROVEN';tone='warn'}
  else {verdict='HOLD';label='HOLD · GET MORE EVIDENCE';tone='hot'}

  let confidence='LOW';
  if(score>=78&&transcript&&!thinSample&&receipts>=3)confidence='HIGH';
  else if(score>=58&&transcript)confidence='MEDIUM';

  const positives=[];
  if(breakout)positives.push(`${outlier.toFixed(1)}× channel outlier — materially above the creator baseline.`);
  else if(strongBaseline)positives.push(`${outlier.toFixed(1)}× channel baseline — above normal.`);
  if(sample>=6)positives.push(`Channel baseline uses ${sample} videos, so the outlier comparison is less fragile.`);
  if(transcript)positives.push(`Transcript evidence is available${segments?` (${segments} segments)`:''}.`);
  if(heatmap)positives.push(`Public Most Replayed evidence is available${peaks?` with ${peaks} detected peaks`:''}.`);
  if(receipts>=2)positives.push(`${receipts} “why it worked” claims have source receipts beside them.`);
  if(a)positives.push('GPT-5.6 Sol intelligence is present on top of the extracted evidence.');

  const cautions=[];
  if(!transcript)cautions.push('Transcript is missing, so script/hook conclusions are too weak to act on confidently.');
  if(!heatmap)cautions.push('Most Replayed is unavailable, so YTIntel cannot verify where replay/seek interest concentrated.');
  if(thinSample)cautions.push('Channel baseline sample is too small; the outlier multiple can be unstable.');
  if(Number.isFinite(outlier)&&outlier<1.5)cautions.push('This video is not a clear channel-relative breakout. Treat it as a control, not proof of a winning idea.');
  if(receipts<2)cautions.push('Too few evidence-backed “why it worked” receipts passed the current rules.');
  if(mechanics>0&&receipts===0)cautions.push('Transferable mechanics exist, but they are not yet backed by enough direct source receipts.');
  if(age!=null&&age>730)cautions.push(`This upload is roughly ${Math.round(age/365)} years old; validate that the topic/packaging still works in the current market.`);
  if(!a)cautions.push('No live Sol synthesis was attached to this analysis; the verdict is relying on deterministic evidence only.');

  const next=[];
  if(!transcript)next.push('Re-run on a video with usable captions/transcript.');
  if(!heatmap)next.push('Add 2–3 comparable videos that expose Most Replayed so replay patterns can be cross-checked.');
  if(thinSample)next.push('Scan more uploads from the same channel before trusting the outlier multiple.');
  if(Number.isFinite(outlier)&&outlier<1.5)next.push('Find a stronger outlier using the same topic/format before copying the mechanism.');
  if(receipts<2)next.push('Look for another competitor video where the same mechanism has clear transcript receipts.');
  if(age!=null&&age>730)next.push('Validate the concept against a recent upload before committing production time.');
  if(!next.length)next.push('Move to the Creator Action Board, then test your title/thumbnail angle before full production.');

  return {score,verdict,label,tone,confidence,positives:positives.slice(0,5),cautions:cautions.slice(0,6),next:next.slice(0,5),outlier:Number.isFinite(outlier)?outlier:null,sample:Number.isFinite(sample)?sample:null};
}
function list(xs,empty){return xs.length?`<ul class="list">${xs.map(x=>`<li>${E(x)}</li>`).join('')}</ul>`:`<p class="muted">${E(empty)}</p>`}
function build(r){const d=evaluate(r);const width=Math.max(4,d.score);return `<article class="card c12" id="decisionGate"><div class="split"><div class="grow"><div class="eyebrow">DECISION GATE · V0.11.1</div><h2 style="margin:5px 0">Should you actually build from this video?</h2><p class="muted">YTIntel now separates an interesting analysis from evidence strong enough to spend production time on.</p></div><span class="pill ${d.tone}">${E(d.label)}</span></div><div class="grid" style="margin-top:12px"><div class="card c4"><div class="eyebrow">EVIDENCE SCORE</div><div style="font-size:46px;font-weight:900;letter-spacing:-2px;margin-top:4px">${d.score}<span style="font-size:16px;color:#7f899b">/100</span></div><div class="bar" style="margin-top:10px"><i style="width:${width}%"></i></div><div class="source-note" style="margin-top:8px">Confidence: ${E(d.confidence)} · This is evidence sufficiency, not a view prediction.</div></div><div class="card c4"><div class="eyebrow">WHY IT PASSES</div>${list(d.positives,'No major positive evidence flags passed yet.')}</div><div class="card c4"><div class="eyebrow">WHAT COULD FOOL YOU</div>${list(d.cautions,'No major evidence weaknesses detected.')}</div><div class="card c12"><div class="split"><div><div class="eyebrow">NEXT BEST MOVE</div><h3 style="margin:4px 0">${d.verdict==='GO'?'Build — but keep the test discipline.':d.verdict==='TEST'?'Validate before full production.':'Do not commit production time yet.'}</h3></div><span class="pill">${E(d.confidence)} CONFIDENCE</span></div>${list(d.next,'No additional validation step required.')}</div></div><div class="split" style="margin-top:10px"><button class="btn small no-print" id="copyDecisionGate">Copy decision brief</button><span class="source-note">Guardrail: GO means the research is strong enough to act on — never that the next video is guaranteed to perform.</span></div></article>`}
function markdown(r){const d=evaluate(r),v=r?.video||{};return `# YTIntel Decision Gate — ${v.title||'Video'}\n\nVerdict: ${d.label}\nEvidence score: ${d.score}/100\nConfidence: ${d.confidence}\n\n## Why it passes\n${d.positives.map(x=>`- ${x}`).join('\n')||'- No strong positives'}\n\n## What could fool you\n${d.cautions.map(x=>`- ${x}`).join('\n')||'- No major cautions'}\n\n## Next best move\n${d.next.map(x=>`- ${x}`).join('\n')}\n\nGuardrail: this score measures evidence sufficiency, not predicted views or guaranteed performance.\n`}
function inject(r){const report=document.querySelector('#report');if(!report||!r)return;report.querySelector('#decisionGate')?.remove();const t=document.createElement('div');t.innerHTML=build(r);const node=t.firstElementChild;const board=report.querySelector('#creatorActionBoard');if(board)board.before(node);else{const transcript=[...report.querySelectorAll('.card .eyebrow')].find(x=>(x.textContent||'').toUpperCase().includes('CLEAN TRANSCRIPT'))?.closest('.card');if(transcript)transcript.before(node);else report.appendChild(node)}node.querySelector('#copyDecisionGate')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(markdown(r));const b=node.querySelector('#copyDecisionGate');if(b){const old=b.textContent;b.textContent='Copied ✓';setTimeout(()=>b.textContent=old,1400)}}catch{}})}
function install(){if(typeof renderReport==='function'){const old=renderReport;renderReport=function(r){old(r);setTimeout(()=>inject(r),120)}}setTimeout(()=>{if(typeof lastReport!=='undefined'&&lastReport)inject(lastReport)},1600)}
function release(){const g=document.querySelector('#updates .grid');if(!g)return;g.querySelector('[data-v111-release]')?.remove();g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));const a=document.createElement('article');a.className='card c12 release current';a.dataset.v111Release='1';a.innerHTML=`<div class="eyebrow">V0.11.1 · 5 SEP 2026 · CURRENT</div><h3>Decision Gate — know when the evidence is strong enough to act</h3><ul class="list"><li><b>GO / TEST / HOLD verdict:</b> every analysis now ends with a production decision instead of treating every competitor video like a winner.</li><li><b>Evidence score:</b> transcript, Most Replayed, channel-baseline sample size, source receipts, hook evidence, extracted takeaways and live Sol intelligence are scored together.</li><li><b>Weak-evidence caps:</b> missing transcript, tiny channel samples and non-outliers stop a flashy report from receiving a false high-confidence GO.</li><li><b>Counter-bias warnings:</b> old uploads, missing replay data, weak receipts and control-like performance are surfaced before you copy a format.</li><li><b>Next-best-move guidance:</b> YTIntel tells you exactly what evidence to collect next when the answer is TEST or HOLD.</li><li><b>Decision brief export:</b> copy the verdict, reasons, cautions and next move in one click.</li></ul>`;g.prepend(a)}
function popup(){const m=document.querySelector('#updateModal');if(!m)return;m.innerHTML=`<div class="update-panel"><div class="update-top"><div class="grow"><span class="update-version">YTIntel v0.11.1 · DECISION GATE</span><h2>Not every good-looking competitor video deserves your time.</h2><p class="muted">YTIntel now tells you whether the evidence is strong enough to build from — or whether you should test, gather more proof, or walk away.</p></div><button class="update-close" data-v111-close>×</button></div><div class="update-items"><div class="update-item"><div class="tick">✓</div><div><b>GO / TEST / HOLD</b><span class="muted">One decisive verdict after the evidence is scored.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Evidence sufficiency score</b><span class="muted">Transcript, replay data, channel baseline, receipts and Sol intelligence are weighted together.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Bias checks</b><span class="muted">Tiny samples, stale uploads, non-outliers and missing evidence can no longer quietly look “proven”.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>What to do next</b><span class="muted">If confidence is weak, YTIntel tells you the exact research step needed to upgrade it.</span></div></div></div><div class="update-actions"><button class="primary" data-v111-close>Continue</button><button data-v111-log>Full update log</button></div></div>`;const close=()=>{m.classList.remove('show');try{localStorage.setItem(RELEASE,'seen')}catch{}};m.querySelectorAll('[data-v111-close]').forEach(x=>x.addEventListener('click',close));m.querySelector('[data-v111-log]')?.addEventListener('click',()=>{close();if(typeof tab==='function')tab('updates');else document.querySelector('[data-tab="updates"]')?.click()});let b=document.querySelector('#whatsNewBtn');if(b){const n=b.cloneNode(true);b.replaceWith(n);n.addEventListener('click',()=>{popup();m.classList.add('show')})}let seen=false;try{seen=localStorage.getItem(RELEASE)==='seen'}catch{}if(!seen)setTimeout(()=>m.classList.add('show'),350)}
function init(){install();release();popup();const s=document.querySelector('#status');if(s&&/GPT-5\.6 Sol/i.test(s.textContent||''))s.textContent='v0.11.1 · GPT-5.6 Sol intelligence LIVE';else if(s)s.textContent='v0.11.1 · decision intelligence ready'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();setTimeout(release,7000);
})();
