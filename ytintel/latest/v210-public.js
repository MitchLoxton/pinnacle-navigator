(function(){
'use strict';
if(document.documentElement.dataset.yt210Public==='1')return;
document.documentElement.dataset.yt210Public='1';
document.body.classList.add('yt-ui-v21');
const MODE='ytintel-v210-advanced', PROFILE='ytintel-v200-profile';
const STORES=['ytintel-v120-radar-history','ytintel-v121-package-history','ytintel-v170-sprints','ytintel-v150-experiments'];
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f='')=>{try{return localStorage.getItem(k)||f}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}};
const readJson=(k,f=[])=>{try{const x=JSON.parse(localStorage.getItem(k)||'null');return x==null?f:x}catch{return f}};
const hasHistory=()=>STORES.some(k=>{const x=readJson(k,[]);return Array.isArray(x)?x.length>0:!!(x&&typeof x==='object'&&Object.keys(x).length)});
function toast(s){if(typeof window.YTIntelToast==='function')window.YTIntelToast(s);else console.info('[YTIntel]',s)}
function go(tab,focus){document.querySelector(`.tabs [data-tab="${tab}"]`)?.click();setTimeout(()=>focus&&$(focus)?.focus(),80)}
function setInput(sel,val){const el=$(sel);if(!el)return false;el.value=val;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));return true}
function isYouTube(s){return /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(String(s||''))}
function safeFile(s){return String(s||'ytintel-report').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'ytintel-report'}
function currentTab(){return $('.tabs [data-tab].on')?.dataset.tab||$('.view.active')?.id||'os'}
function contextFor(tab=currentTab()){
  if(tab==='analyse')return {label:'Video analysis',value:$('#videoUrl')?.value?.trim()||''};
  if(tab==='radar')return {label:'Opportunity Radar',value:$('#radarQuery')?.value?.trim()||readJson('ytintel-v120-radar-history',[])[0]?.query||''};
  if(tab==='packaging')return {label:'Packaging Lab',value:$('#packageAngle')?.value?.trim()||readJson('ytintel-v121-package-history',[])[0]?.query||''};
  if(tab==='sprint')return {label:'Research Sprint',value:$('#sprintTopic')?.value?.trim()||readJson('ytintel-v170-sprints',[])[0]?.topic||''};
  if(tab==='batch')return {label:'Pattern Mine',value:'competitor pattern'};
  return {label:'YTIntel research',value:''};
}
function routeUrl(tab=currentTab()){
  const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('tab',tab);const c=contextFor(tab);
  if(tab==='analyse'&&c.value)u.searchParams.set('video',c.value);
  else if(['radar','sprint','packaging'].includes(tab)&&c.value)u.searchParams.set('topic',c.value);
  u.searchParams.set('ref','share');return u.toString()
}
function mdFrom(root,tab){
  const c=contextFor(tab),title=`YTIntel — ${c.label}${c.value?` — ${c.value}`:''}`;
  const text=(root?.innerText||'').split('\n').map(x=>x.trim()).filter(Boolean).filter(x=>!['Share','Copy report','Download .md','Next step'].includes(x)).join('\n\n');
  return `# ${title}\n\n${text}\n\n---\nResearch link: ${routeUrl(tab)}\n\nYTIntel uses public evidence to improve decisions; scores and patterns are not guarantees of views, CTR or causation.\n`
}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch{}t.remove();return ok}}
function download(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}
async function share(root,tab){const c=contextFor(tab),text=mdFrom(root,tab);const data={title:`YTIntel — ${c.label}`,text:text.slice(0,4500),url:routeUrl(tab)};if(navigator.share){try{await navigator.share(data);return}catch(e){if(e?.name==='AbortError')return}}const ok=await copyText(`${data.title}\n${data.url}`);toast(ok?'Share link copied.':'Could not copy the share link.')}
function nextStep(tab){
  if(tab==='analyse'){go('radar','#radarQuery');setTimeout(()=>$('#radarUseCurrent')?.click(),120);return}
  if(tab==='radar'){go('packaging','#packageAngle');return}
  if(tab==='packaging'||tab==='sprint'){go('loop');return}
  if(tab==='batch'){if(readJson('ytintel-v120-radar-history',[]).length)go('packaging','#packageAngle');else go('sprint','#sprintTopic');return}
  go('os','#v21PublicInput')
}
function resultReady(root,tab){
  if(!root)return false;
  if(tab==='analyse')return !!root.querySelector('.card,#solIntelligence')&&(root.innerText||'').trim().length>180;
  if(tab==='radar')return !!root.querySelector('.radar-video,.opportunity-card,.radar-results,.card')&&(root.innerText||'').trim().length>180;
  if(tab==='packaging')return !!root.querySelector('.package-option');
  if(tab==='sprint')return !!root.querySelector('.sprint-ready');
  if(tab==='batch')return (root.innerText||'').trim().length>220&&!/loading|working|mining/i.test(root.innerText||'');
  return false
}
const RESULT_ROOTS={analyse:'#report',radar:'#radarRoot',packaging:'#packageRoot',sprint:'#sprintRoot',batch:'#batchRoot'};
function addResultActions(){
  for(const [tab,sel] of Object.entries(RESULT_ROOTS)){
    const root=$(sel);if(!resultReady(root,tab))continue;
    let bar=root.querySelector(':scope > .v21-result-actions');
    if(bar)continue;
    bar=document.createElement('div');bar.className='v21-result-actions no-print';bar.innerHTML=`<div><b>Useful result ready.</b><span>Take it with you, share it, or keep moving through the workflow.</span></div><div class="v21-result-buttons"><button type="button" class="btn small" data-v21-share>Share</button><button type="button" class="btn small" data-v21-copy>Copy report</button><button type="button" class="btn small" data-v21-download>Download .md</button><button type="button" class="btn small primary" data-v21-next>Next step →</button></div>`;
    root.appendChild(bar);
    bar.querySelector('[data-v21-share]').onclick=()=>share(root,tab);
    bar.querySelector('[data-v21-copy]').onclick=async e=>{const ok=await copyText(mdFrom(root,tab));const b=e.currentTarget,old=b.textContent;b.textContent=ok?'Copied ✓':'Copy failed';setTimeout(()=>b.textContent=old,1200)};
    bar.querySelector('[data-v21-download]').onclick=()=>{const c=contextFor(tab);download(`${safeFile(`ytintel-${tab}-${c.value||Date.now()}`)}.md`,mdFrom(root,tab))};
    bar.querySelector('[data-v21-next]').onclick=()=>nextStep(tab)
  }
}
function publicLauncher(){
  const os=$('#os'),hero=$('#os .hero');if(!os||!hero||$('#v21PublicLaunch'))return;
  const sec=document.createElement('section');sec.id='v21PublicLaunch';sec.className='v21-public-launch';
  sec.innerHTML=`<div class="v21-public-top"><div><div class="eyebrow">FREE PUBLIC CREATOR RESEARCH · NO ACCOUNT · NO USER CREDITS</div><h2>Get a useful YouTube answer in one box.</h2><p>Paste a YouTube video to break it down, or type a niche/topic and YTIntel will run the research path toward an evidence-backed video brief.</p></div><div class="v21-live"><span></span><b>Always-On</b><small>Public analyser</small></div></div><div class="v21-public-form"><input id="v21PublicInput" autocomplete="off" enterkeyhint="go" placeholder="Paste a YouTube URL or type a topic — e.g. AI tools for tradies"><button class="btn primary" id="v21PublicGo">Get useful answer →</button></div><div class="v21-public-hints"><button data-v21-example="AI tools for small business">AI tools</button><button data-v21-example="home workout transformation">Fitness</button><button data-v21-example="Roblox horror games">Gaming</button><button data-v21-example="beginner makeup tutorial">Beauty</button><button data-v21-example="small business case studies">Business</button></div><div class="v21-trust"><span><b>No signup wall</b><small>Open it and use it.</small></span><span><b>No credit prompt</b><small>The public analyser stays available.</small></span><span><b>Evidence first</b><small>Winners, controls and source receipts.</small></span><span><b>Production output</b><small>Idea → title → thumbnail brief → hook.</small></span></div><div class="v21-privacy">YTIntel researches public YouTube evidence. Your workspace history is stored locally in this browser unless you choose to export or share it.</div>`;
  hero.after(sec);
  const input=$('#v21PublicInput'),goBtn=$('#v21PublicGo');
  const run=()=>{const q=input.value.trim();if(!q){input.focus();return}if(isYouTube(q)){go('analyse','#videoUrl');setTimeout(()=>{setInput('#videoUrl',q);$('#analyseForm')?.requestSubmit?.()},120)}else{go('sprint','#sprintTopic');setTimeout(()=>{setInput('#sprintTopic',q);$('#sprintGo')?.click()},160)}};
  goBtn.onclick=run;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});
  sec.querySelectorAll('[data-v21-example]').forEach(b=>b.onclick=()=>{input.value=b.dataset.v21Example;input.focus()})
}
function publicValue(){
  const launch=$('#v21PublicLaunch');if(!launch||$('#v21PublicValue'))return;
  const sec=document.createElement('section');sec.id='v21PublicValue';sec.className='v21-public-value';sec.innerHTML=`<div class="v21-value-head"><div class="eyebrow">WHY PEOPLE WOULD ACTUALLY KEEP USING IT</div><h2>One workflow from “what should I make?” to “this is what I’m producing.”</h2></div><div class="v21-value-grid"><article><span>01</span><b>Find signal, not just big view counts</b><p>Rank channel-relative breakouts, recent velocity and cross-channel repetition.</p></article><article><span>02</span><b>See the receipts</b><p>Separate winners from controls and keep source evidence visible before trusting a pattern.</p></article><article><span>03</span><b>Turn research into packaging</b><p>Leave with an original title, thumbnail brief, opening hook, promise and test plan.</p></article><article><span>04</span><b>Learn what fits your own channel</b><p>Creator Loop turns published outcomes into personal evidence instead of generic advice.</p></article></div><div class="v21-guardrail"><b>What YTIntel does not pretend:</b> public metrics cannot prove private retention, CTR or causation. The product is built to improve creator decisions without manufacturing certainty.</div>`;launch.after(sec)
}
const ADVANCED=['radar','packaging','history','similar','batch','visuals'];
function shouldStartAdvanced(){const saved=read(MODE,'');if(saved)return saved==='1';const p=read(PROFILE,'growing');return hasHistory()||['established','team','researcher'].includes(p)}
function setAdvanced(on,persist=true){document.body.classList.toggle('v21-advanced-open',!!on);document.body.classList.toggle('v21-simple-nav',!on);if(persist)write(MODE,on?'1':'0');const b=$('#v21ToolsBtn');if(b){b.setAttribute('aria-expanded',on?'true':'false');b.innerHTML=on?'Hide advanced <span>−</span>':'Advanced tools <span>＋</span>'}}
function navMode(){
  const split=$('.top .split');if(!split||$('#v21ToolsBtn'))return;
  const b=document.createElement('button');b.id='v21ToolsBtn';b.type='button';b.className='v20-top-action v21-tools-btn no-print';b.setAttribute('aria-expanded','false');b.onclick=()=>setAdvanced(!document.body.classList.contains('v21-advanced-open'));
  split.insertBefore(b,$('#whatsNewBtn')||split.firstChild);setAdvanced(shouldStartAdvanced(),false)
}
function markAdvanced(){ADVANCED.forEach(t=>document.querySelector(`.tabs [data-tab="${t}"]`)?.classList.add('v21-advanced-tab'))}
function handleDeepLink(){
  const p=new URLSearchParams(location.search),share=p.get('share')||p.get('url')||'',text=p.get('text')||'';
  if(share&&isYouTube(share)){go('analyse','#videoUrl');setTimeout(()=>{setInput('#videoUrl',share);if(p.get('source')==='share')$('#analyseForm')?.requestSubmit?.()},180);return}
  const tab=p.get('tab'),topic=p.get('topic'),video=p.get('video');if(tab)go(tab);
  if(video&&isYouTube(video))setTimeout(()=>setInput('#videoUrl',video),180);
  if(topic){setTimeout(()=>{if(tab==='radar')setInput('#radarQuery',topic);else if(tab==='packaging')setInput('#packageAngle',topic);else setInput('#sprintTopic',topic)},180)}
  if(!tab&&!share&&text&&isYouTube(text)){go('analyse','#videoUrl');setTimeout(()=>setInput('#videoUrl',text),180)}
}
function publicRelease(){
  const g=$('#updates .grid');if(!g||g.querySelector('[data-v210-release]'))return;
  g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const a=document.createElement('article');a.className='card c12 release current';a.dataset.v210Release='1';a.innerHTML='<div class="eyebrow">V0.21.0 · 6 SEP 2026 · CURRENT</div><h3>Public Launch — useful in one box, powerful when you go deeper</h3><ul class="list"><li><b>One-box public start:</b> paste a video or type a topic and YTIntel routes directly into the useful workflow.</li><li><b>Simpler default navigation:</b> new users see the core jobs first; advanced research tools are one click away instead of competing for attention.</li><li><b>Shareable outputs:</b> completed Analyse, Radar, Packaging, Sprint and Pattern Mine results can be shared, copied or downloaded as Markdown.</li><li><b>Deep links + PWA sharing:</b> shared YouTube links can open straight into Analyse, and research topics can be shared as reusable YTIntel routes.</li><li><b>Public trust layer:</b> clear no-account/no-user-credit positioning, local-workspace privacy language and evidence limitations are visible before research starts.</li></ul>';
  g.prepend(a)
}
let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;addResultActions();publicRelease()})}
function init(){publicLauncher();publicValue();markAdvanced();navMode();handleDeepLink();publicRelease();addResultActions();const o=new MutationObserver(refresh);o.observe(document.body,{childList:true,subtree:true});window.addEventListener('popstate',handleDeepLink);setTimeout(refresh,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
