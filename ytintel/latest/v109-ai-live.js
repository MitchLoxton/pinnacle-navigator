(function(){
const VERSION=window.YTINTEL_VERSION||'0.10.9';
const API='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/ytintel-v082?action=health';
const RELEASE='ytintel-whats-new-0.10.9-ai-live';
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
  a.innerHTML=d.configured?`<div class="eyebrow">V0.10.9 · 5 SEP 2026</div><h3>GPT-5.6 Sol intelligence is now live</h3><ul class="list"><li><b>Server-side OpenAI key detected:</b> the public app never receives or exposes the key.</li><li><b>Deep Analyse now has a real model pass:</b> hook, re-hooks, promise fulfillment, key takeaways, why it worked, format engine and transferable mechanics are model-judged from the evidence YTIntel collected first.</li><li><b>Pattern Mine gets a second intelligence pass:</b> Sol re-checks whether competitor patterns are genuinely the same instead of trusting surface keyword overlap.</li><li><b>Max reasoning stays enabled</b> with strict evidence guardrails against invented timestamps, quotes, private retention data or causal claims.</li></ul>`:`<div class="eyebrow">V0.10.9 · AI ACTIVATION CHECK</div><h3>GPT-5.6 Sol connection still pending</h3><p class="muted">YTIntel is checking the backend for the server-side OpenAI key. Refresh once after saving the secret.</p>`;
  g.prepend(a);
  const old=[g.querySelector('[data-v108-release]'),g.querySelector('[data-v107-release]'),g.querySelector('[data-release="ai-intelligence"]')].filter(Boolean);
  let after=a;for(const x of old){after.insertAdjacentElement('afterend',x);after=x}
}
function updateMilestone(d){
  const c=document.querySelector('[data-release="ai-intelligence"]');if(!c)return;
  let n=c.querySelector('[data-ai-live-note]');if(!n){n=document.createElement('div');n.dataset.aiLiveNote='1';n.className='v10-note';c.appendChild(n)}
  n.innerHTML=d.configured?'<strong>Current status:</strong> LIVE — GPT-5.6 Sol can now run server-side on YTIntel analyses.':'<strong>Current status:</strong> waiting for the backend OpenAI key.';
}
function popupHtml(d){
  const live=!!d.configured;
  return `<div class="update-panel"><div class="update-top"><div class="grow"><span class="update-version">YTIntel v0.10.9 · AI INTELLIGENCE ${live?'LIVE':'CHECKING'}</span><h2>${live?'GPT-5.6 Sol is now live inside YTIntel.':'Checking the Sol connection…'}</h2><p class="muted">${live?'YTIntel can now take the evidence it already collects and run a real GPT-5.6 Sol reasoning pass before showing the final creator intelligence.':'YTIntel is checking whether the backend can see the server-side OpenAI key.'}</p></div><button class="update-close" data-v109-close aria-label="Close">×</button></div><div class="update-items"><div class="update-item"><div class="tick">✓</div><div><b>Deep Analyse intelligence</b><span class="muted">Hooks, re-hooks, promise fulfillment, key takeaways, format engine and transferable mechanics can now be model-judged from evidence.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Pattern Mine intelligence</b><span class="muted">Competitor patterns receive a second semantic review instead of relying only on keyword similarity.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Server-side secret</b><span class="muted">The OpenAI key stays in Supabase and is never sent to friends opening the public app.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Evidence guardrails stay on</b><span class="muted">No invented timestamps, quotes, private retention percentages or unsupported causal claims.</span></div></div></div><div class="update-actions"><button class="primary" data-v109-close>Continue</button><button data-v109-log>Full update log</button></div></div>`;
}
function wirePopup(d){
  const m=document.querySelector('#updateModal');if(!m)return;
  m.innerHTML=popupHtml(d);
  const close=()=>{m.classList.remove('show');try{localStorage.setItem(RELEASE,'seen')}catch{}};
  m.querySelectorAll('[data-v109-close]').forEach(x=>x.addEventListener('click',close));
  m.querySelector('[data-v109-log]')?.addEventListener('click',()=>{close();if(typeof tab==='function')tab('updates');else document.querySelector('[data-tab="updates"]')?.click()});
  let b=document.querySelector('#whatsNewBtn');if(b){const n=b.cloneNode(true);b.replaceWith(n);n.addEventListener('click',()=>{m.innerHTML=popupHtml(last||d);wirePopup(last||d);m.classList.add('show')})}
}
function maybeShow(d){if(!d.configured)return;let seen=false;try{seen=localStorage.getItem(RELEASE)==='seen'}catch{}if(!seen)setTimeout(()=>document.querySelector('#updateModal')?.classList.add('show'),300)}
async function sync(show=false){const d=await health();updateTop(d);updateRelease(d);updateMilestone(d);wirePopup(d);if(show)maybeShow(d)}
function init(){sync(true);setTimeout(sync,3500);setTimeout(sync,8500);setInterval(sync,60000);window.addEventListener('online',sync);window.addEventListener('focus',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();