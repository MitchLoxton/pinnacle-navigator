(function(){
const RELEASE_KEY='ytintel-ai-intelligence-milestone-2026-09-05';
const AI_HEALTH='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
function card(status){
  const g=document.querySelector('#updates .grid');
  if(!g||g.querySelector('[data-release="ai-intelligence"]'))return;
  const el=document.createElement('article');
  el.className='card c12 release current';
  el.dataset.release='ai-intelligence';
  el.innerHTML=`<div class="eyebrow">🎉 5 SEP 2026 · AI INTELLIGENCE MILESTONE</div><h3>YTIntel now has a real AI intelligence layer</h3><ul class="list"><li><b>GPT-5.6 Sol reasoning layer implemented</b> on top of YTIntel's evidence pipeline.</li><li>AI can judge hooks, re-hooks, promise fulfillment, key takeaways, format engines and transferable mechanics from attached evidence.</li><li>Pattern Mine can be re-judged semantically instead of relying only on deterministic clustering.</li><li>Strict evidence rules remain: no invented timestamps, quotes, retention percentages or causal claims.</li><li><b>Status:</b> ${status}</li></ul>`;
  g.prepend(el);
}
function popup(status){
  const modal=document.querySelector('#updateModal');
  if(!modal)return;
  modal.innerHTML=`<div class="update-panel"><div class="update-top"><div class="grow"><span class="update-version">🎉 YTIntel AI INTELLIGENCE · 5 SEP 2026</span><h2>We just crossed a major line.</h2><p class="muted">YTIntel is no longer only an evidence dashboard. The GPT-5.6 Sol intelligence layer is now implemented and wired into the product.</p></div><button class="update-close" aria-label="Close">×</button></div><div class="update-items"><div class="update-item"><span class="tick">✓</span><div><b>Evidence → intelligence</b><span class="muted">Transcript, replay, outlier and media evidence can now feed a dedicated reasoning pass.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Creator-strategy judgment</b><span class="muted">Hooks, re-hooks, fulfillment, takeaways, format engines and reusable mechanics get judged together.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Pattern Mine reasoning</b><span class="muted">Competitor patterns can be semantically re-checked rather than blindly merged.</span></div></div><div class="update-item"><span class="tick">✓</span><div><b>Evidence guardrails stay on</b><span class="muted">The model is explicitly blocked from inventing timestamps, quotes, private retention or unsupported causal claims.</span></div></div></div><div class="v10-note ${status.includes('ACTIVE')?'':'v10-warn'}"><strong>Current AI status:</strong> ${status}</div><div class="update-actions"><button class="primary" data-close>LET'S GO 🚀</button><button data-open-updates>View update log</button></div></div>`;
  const close=()=>{modal.classList.remove('show');try{localStorage.setItem(RELEASE_KEY,'1')}catch{}};
  modal.querySelector('.update-close')?.addEventListener('click',close);
  modal.querySelector('[data-close]')?.addEventListener('click',close);
  modal.querySelector('[data-open-updates]')?.addEventListener('click',()=>{close();document.querySelector('[data-tab="updates"]')?.click()});
  document.querySelector('#whatsNewBtn')?.addEventListener('click',()=>modal.classList.add('show'));
  let seen=false;try{seen=localStorage.getItem(RELEASE_KEY)==='1'}catch{}
  if(!seen)modal.classList.add('show');
}
async function init(){
  let status='AI intelligence layer implemented; OpenAI activation still pending.';
  try{const r=await fetch(AI_HEALTH),d=await r.json();status=d.configured?'ACTIVE — GPT-5.6 Sol is connected and ready to reason.':'IMPLEMENTED — GPT-5.6 Sol is wired in, but the OpenAI API key still needs activation.'}catch{}
  card(status);popup(status);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
