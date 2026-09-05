(function(){
const AI_HEALTH='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
function card(status){
  const g=document.querySelector('#updates .grid');
  if(!g)return;
  g.querySelector('[data-release="ai-intelligence"]')?.remove();
  const el=document.createElement('article');
  el.className='card c12 release';
  el.dataset.release='ai-intelligence';
  el.innerHTML=`<div class="eyebrow">🎉 V0.10.6 · 5 SEP 2026 · AI INTELLIGENCE MILESTONE</div><h3>AI Intelligence implemented in YTIntel</h3><ul class="list"><li><b>GPT-5.6 Sol intelligence layer implemented</b> on top of the evidence pipeline.</li><li>Transcript, replay, outlier and media evidence can feed a dedicated reasoning layer.</li><li>AI reasoning covers hooks, re-hooks, promise fulfillment, key takeaways, format engines and transferable mechanics.</li><li>Pattern Mine has a model-review path for semantically checking competitor patterns.</li><li>Evidence guardrails remain strict: no invented timestamps, quotes, private retention data or unsupported causal claims.</li><li><b>Connection status:</b> ${status}</li></ul>`;
  const latest=g.querySelector('[data-v107-release]');
  if(latest)latest.insertAdjacentElement('afterend',el);else g.prepend(el);
}
async function init(){
  let status='AI layer implemented; live model connection status unavailable.';
  try{const r=await fetch(AI_HEALTH),d=await r.json();status=d.configured?'GPT-5.6 Sol connected and ready for live reasoning.':'AI layer implemented; OpenAI API activation still required for live Sol calls.'}catch{}
  card(status);
}
setTimeout(init,1200);
})();
