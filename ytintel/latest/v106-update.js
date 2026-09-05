(function(){
const RELEASE_KEY='ytintel-ai-intelligence-milestone-2026-09-05-v2';
const AI_HEALTH='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
function card(status){
  const g=document.querySelector('#updates .grid');
  if(!g)return;
  g.querySelector('[data-release="ai-intelligence"]')?.remove();
  g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const el=document.createElement('article');
  el.className='card c12 release current';
  el.dataset.release='ai-intelligence';
  el.innerHTML=`<div class="eyebrow">🎉 V0.10.6 · 5 SEP 2026 · MAJOR MILESTONE</div><h3>AI Intelligence is now implemented in YTIntel</h3><ul class="list"><li><b>GPT-5.6 Sol intelligence layer implemented</b> on top of the evidence pipeline.</li><li>YTIntel can pass transcript, replay, outlier and media evidence into a dedicated reasoning layer.</li><li>AI intelligence is designed to judge hooks, re-hooks, promise fulfillment, key takeaways, format engines and transferable mechanics.</li><li>Pattern Mine now has a model-review path for semantically checking repeated competitor patterns.</li><li>Evidence guardrails remain strict: no invented timestamps, quotes, private retention data or unsupported causal claims.</li><li><b>Current state:</b> ${status}</li></ul>`;
  g.prepend(el);
}
function makePopup(status){
  const modal=document.querySelector('#updateModal');
  if(!modal)return;
  modal.innerHTML=`<div class="update-panel"><div class="update-top"><div class="grow"><span class="update-version">🎉 YTIntel v0.10.6 · AI INTELLIGENCE</span><h2>AI Intelligence is now implemented.</h2><p class="muted">This is one of the biggest YTIntel upgrades so far. The product has moved from collecting evidence to having a dedicated GPT-5.6 Sol reasoning layer built into the workflow.</p></div><button class="update-close" aria-label="Close">×</button></div><div class="update-items"><div class="update-item"><span class="tick">✓</span><div><b>GPT-5.6 Sol intelligence layer</b><span class="muted">A dedicated AI reasoning pass is now implemented in the product architecture.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Evidence → judgment</b><span class="muted">Transcript, replay, outlier and media evidence can feed one joined intelligence pass.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Creator-strategy reasoning</b><span class="muted">Hooks, re-hooks, fulfillment, takeaways, format engines and reusable mechanics are designed to be judged together.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Pattern Mine intelligence</b><span class="muted">Competitor patterns can be semantically reviewed instead of relying only on deterministic clustering.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Evidence guardrails</b><span class="muted">No invented timestamps, quotes, private retention percentages or unsupported causal claims.</span></div></div></div><div class="v10-note ${status.startsWith('ACTIVE')?'':'v10-warn'}"><strong>Current AI status:</strong> ${status}</div><div class="update-actions"><button class="primary" data-close>LET'S GO 🚀</button><button data-open-updates>Full update log</button></div></div>`;
  const close=()=>{modal.classList.remove('show');try{localStorage.setItem(RELEASE_KEY,'1')}catch{}};
  modal.querySelector('.update-close')?.addEventListener('click',close);
  modal.querySelector('[data-close]')?.addEventListener('click',close);
  modal.querySelector('[data-open-updates]')?.addEventListener('click',()=>{close();document.querySelector('[data-tab="updates"]')?.click()});
  let btn=document.querySelector('#whatsNewBtn');
  if(btn){const clean=btn.cloneNode(true);btn.replaceWith(clean);btn=clean;btn.addEventListener('click',()=>{makePopup(status);document.querySelector('#updateModal')?.classList.add('show')})}
  let seen=false;try{seen=localStorage.getItem(RELEASE_KEY)==='1'}catch{}
  if(!seen)modal.classList.add('show');
}
async function init(){
  let status='IMPLEMENTED — live OpenAI activation still pending.';
  try{const r=await fetch(AI_HEALTH),d=await r.json();status=d.configured?'ACTIVE — GPT-5.6 Sol is connected and ready to reason.':'IMPLEMENTED — GPT-5.6 Sol is built and wired in; the OpenAI API key still needs activation for live model calls.'}catch{}
  const top=document.querySelector('#status');if(top)top.textContent='v0.10.6 · AI intelligence implemented';
  card(status);
  makePopup(status);
}
setTimeout(init,1200);
})();
