(function(){
const VERSION='0.10.9';
const API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
let last=null;
async function health(){
  try{
    const r=await fetch(API+'&t='+Date.now(),{cache:'no-store'}),d=await r.json();
    if(r.ok&&d&&d.ok!==false){last=d;return d}
  }catch{}
  return last||{configured:false,model:'gpt-5.6-sol'};
}
function updateTop(d){
  const s=document.querySelector('#status');if(!s)return;
  if(d.configured){
    s.textContent=`v${VERSION} · GPT-5.6 Sol intelligence LIVE`;
    s.style.borderColor='rgba(85,226,157,.48)';
    s.style.color='#9af1c2';
    s.title='The YTIntel backend can see the server-side OpenAI API key. Deep Analyse and Pattern Mine can now use GPT-5.6 Sol.';
  }else{
    s.textContent=`v${VERSION} · Sol AI key needed`;
    s.style.borderColor='rgba(255,196,92,.45)';
    s.style.color='';
  }
}
function updateRelease(d){
  const g=document.querySelector('#updates .grid');if(!g)return;
  g.querySelector('[data-v109-release]')?.remove();
  g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const a=document.createElement('article');a.className='card c12 release current';a.dataset.v109Release='1';
  a.innerHTML=d.configured?`<div class="eyebrow">V0.10.9 · 5 SEP 2026 · CURRENT</div><h3>GPT-5.6 Sol intelligence is now live</h3><ul class="list"><li><b>Server-side OpenAI key detected:</b> the public app never receives or exposes the key.</li><li><b>Deep Analyse now has a real model pass:</b> hook, re-hooks, promise fulfillment, key takeaways, why it worked, format engine and transferable mechanics are model-judged from the evidence YTIntel collected first.</li><li><b>Pattern Mine gets a second intelligence pass:</b> Sol re-checks whether competitor patterns are genuinely the same instead of trusting surface keyword overlap.</li><li><b>Max reasoning stays enabled</b> with strict evidence guardrails against invented timestamps, quotes, private retention data or causal claims.</li><li><b>v0.10.8 reliability, v0.10.7 analyser fixes and the v0.10.6 AI implementation milestone remain active underneath this release.</b></li></ul>`:`<div class="eyebrow">V0.10.9 · AI ACTIVATION CHECK</div><h3>GPT-5.6 Sol connection still pending</h3><p class="muted">YTIntel is checking the backend for the server-side OpenAI key. Refresh once after saving the secret.</p>`;
  g.prepend(a);
  const old=[g.querySelector('[data-v108-release]'),g.querySelector('[data-v107-release]'),g.querySelector('[data-release="ai-intelligence"]')].filter(Boolean);
  let after=a;for(const x of old){after.insertAdjacentElement('afterend',x);after=x}
}
function updateMilestone(d){
  const c=document.querySelector('[data-release="ai-intelligence"]');if(!c)return;
  let n=c.querySelector('[data-ai-live-note]');if(!n){n=document.createElement('div');n.dataset.aiLiveNote='1';n.className='v10-note';c.appendChild(n)}
  n.innerHTML=d.configured?'<strong>Current status:</strong> LIVE — GPT-5.6 Sol can now run server-side on YTIntel analyses.':'<strong>Current status:</strong> waiting for the backend OpenAI key.';
}
async function sync(){const d=await health();updateTop(d);updateRelease(d);updateMilestone(d)}
function init(){sync();setTimeout(sync,3500);setTimeout(sync,8000);setInterval(sync,60000);window.addEventListener('online',sync);window.addEventListener('focus',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
