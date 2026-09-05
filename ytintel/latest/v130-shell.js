(function(){
const VERSION='0.13.0';
const RELEASE='ytintel-whats-new-0.13.0-interface-rebuild';
const app=document.querySelector('.app');
if(!app||document.documentElement.dataset.ytUi13==='1')return;
document.documentElement.dataset.ytUi13='1';
document.body.classList.add('yt-ui-v13');
window.YTINTEL_VERSION=VERSION;
document.title=`YTIntel v${VERSION} — Research Workspace`;

const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=(name)=>{
 const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
 const paths={
  analyse:'<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/><path d="M8.5 11h5M11 8.5v5"/>',
  radar:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12 18 6M12 4v2M4 12h2"/>',
  packaging:'<path d="m12 3 8 4-8 4-8-4 8-4Z"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>',
  history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  similar:'<circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/><path d="M9.5 8.5 14.5 15.5M17 4v6M14 7h6"/>',
  batch:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  visuals:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4 17 5-5 3 3 2-2 6 5"/>',
  updates:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
  spark:'<path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8L12 3Z"/><path d="m5 15 .7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7L5 15Z"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'
 };
 return `<svg ${common}>${paths[name]||paths.spark}</svg>`;
};

// Accessibility anchor.
if(!document.querySelector('.yt-skip-link')){
 const skip=document.createElement('a');
 skip.className='yt-skip-link';skip.href='#analyse';skip.textContent='Skip to workspace';
 document.body.insertBefore(skip,document.body.firstChild);
}

// Brand + top controls.
const brand=document.querySelector('.brand');
if(brand){brand.innerHTML='<span class="logo" aria-hidden="true">YT</span><span class="brand-copy"><strong>YTIntel</strong><small>Creator Intelligence</small></span>';}
const topSplit=document.querySelector('.top > .split');
if(topSplit){
 topSplit.classList.add('top-actions');
 if(!document.querySelector('#ytCommandBtn')){
  const b=document.createElement('button');b.type='button';b.className='btn small yt-command-btn no-print';b.id='ytCommandBtn';
  b.innerHTML=`${icon('search')}<span>Quick switch</span><kbd>⌘K</kbd>`;b.setAttribute('aria-label','Open quick switch');
  topSplit.insertBefore(b,topSplit.firstChild);
 }
}

const NAV={
 analyse:{label:'Analyse',icon:'analyse'},radar:{label:'Opportunity Radar',icon:'radar'},packaging:{label:'Packaging Lab',icon:'packaging'},
 history:{label:'History',icon:'history'},similar:{label:'Similar Videos',icon:'similar'},batch:{label:'Pattern Mine',icon:'batch'},
 visuals:{label:'Visuals + Audio',icon:'visuals'},updates:{label:'Updates',icon:'updates'}
};
const nav=document.querySelector('.tabs');
if(nav){
 nav.setAttribute('aria-label','YTIntel workspace');
 const buttons=[...nav.querySelectorAll('button[data-tab]')];
 buttons.forEach(btn=>{
  const key=btn.dataset.tab,cfg=NAV[key]||{label:btn.textContent.trim(),icon:'spark'};
  const beta=btn.querySelector('.beta')?.outerHTML||'';
  btn.innerHTML=`<span class="nav-ico">${icon(cfg.icon)}</span><span class="nav-label">${escHtml(cfg.label)}</span>${beta}`;
  btn.setAttribute('aria-label',cfg.label);
 });
 const addGroup=(beforeKey,label)=>{if(nav.querySelector(`[data-nav-group="${beforeKey}"]`))return;const before=nav.querySelector(`[data-tab="${beforeKey}"]`);if(!before)return;const s=document.createElement('span');s.className='nav-group';s.dataset.navGroup=beforeKey;s.textContent=label;nav.insertBefore(s,before);};
 addGroup('analyse','Research');addGroup('history','Library');addGroup('updates','System');
}

// Workflow rail — shows the core path without forcing users through it.
let rail=document.querySelector('#ytWorkflowRail');
if(!rail&&nav){
 rail=document.createElement('div');rail.id='ytWorkflowRail';rail.className='workflow-rail no-print';rail.setAttribute('aria-label','Core research workflow');
 nav.insertAdjacentElement('afterend',rail);
}
const flow=[
 {tab:'radar',n:'01',title:'Discover',sub:'Find opportunity'},
 {tab:'analyse',n:'02',title:'Investigate',sub:'Deep evidence'},
 {tab:'batch',n:'03',title:'Validate',sub:'Cross-video proof'},
 {tab:'packaging',n:'04',title:'Package',sub:'Build execution'}
];
function localHas(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x.length>0:!!x}catch{return false}}
function goTab(key,focusId){const b=document.querySelector(`.tabs [data-tab="${key}"]`);if(b)b.click();setTimeout(()=>{syncUI();if(focusId)document.querySelector(focusId)?.focus({preventScroll:false});},40)}
function syncRail(){
 if(!rail)return;const active=document.querySelector('.view.active')?.id||'analyse';const core=flow.some(x=>x.tab===active);rail.classList.toggle('show',core);if(!core)return;
 const done={radar:localHas('ytintel-v120-radar-history'),analyse:localHas('ytintel-v09-history'),batch:localHas('ytintel-v10-pattern-history'),packaging:localHas('ytintel-v121-package-history')};
 rail.innerHTML=flow.map(x=>`<button type="button" class="flow-step ${x.tab===active?'current':''} ${done[x.tab]?'done':''}" data-flow-tab="${x.tab}" ${x.tab===active?'aria-current="step"':''}><span class="flow-no">${done[x.tab]?'✓':x.n}</span><span><strong>${x.title}</strong><small>${x.sub}</small></span></button>`).join('');
 rail.querySelectorAll('[data-flow-tab]').forEach(b=>b.addEventListener('click',()=>goTab(b.dataset.flowTab)));
}
function syncNav(){
 const active=document.querySelector('.view.active')?.id;
 document.querySelectorAll('.tabs [data-tab]').forEach(b=>{const on=b.dataset.tab===active;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
}
function syncStatus(){const s=document.querySelector('#status');if(!s)return;const txt=s.textContent||'';s.classList.toggle('is-live',/\bLIVE\b/i.test(txt));if(!txt.startsWith(`v${VERSION}`)){const tail=txt.replace(/^v?\d+(?:\.\d+){1,3}\s*·?\s*/i,'');s.textContent=`v${VERSION}${tail?` · ${tail}`:''}`}}
function syncUI(){syncNav();syncRail();syncStatus()}

// Command palette.
const commands=[
 {label:'Analyse a video',desc:'Open Deep Analyse and paste a YouTube URL',tab:'analyse',focus:'#videoUrl',key:'A',icon:'analyse'},
 {label:'Run Opportunity Radar',desc:'Discover and rank what is worth analysing',tab:'radar',focus:'#radarQuery',key:'R',icon:'radar'},
 {label:'Open Packaging Lab',desc:'Turn verified research into titles, thumbnails and hooks',tab:'packaging',focus:'#packageAngle',key:'P',icon:'packaging'},
 {label:'Open Pattern Mine',desc:'Validate recurring patterns across competitors',tab:'batch',focus:'#batchUrls',key:'M',icon:'batch'},
 {label:'Research history',desc:'Return to saved niche intelligence',tab:'history',key:'H',icon:'history'},
 {label:'Find similar videos',desc:'Explore adjacent videos and channel outliers',tab:'similar',focus:'#similarQuery',key:'S',icon:'similar'},
 {label:'Visuals + Audio',desc:'Inspect media evidence and replay hotzones',tab:'visuals',key:'V',icon:'visuals'},
 {label:"What's new",desc:'See the latest YTIntel release',tab:'updates',key:'U',icon:'updates'}
];
let overlay=document.querySelector('#ytCommandOverlay');
if(!overlay){
 overlay=document.createElement('div');overlay.id='ytCommandOverlay';overlay.className='yt-command-overlay no-print';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Quick switch');
 overlay.innerHTML=`<div class="yt-command-panel"><div class="yt-command-search">${icon('search')}<input id="ytCommandInput" type="search" autocomplete="off" placeholder="Jump anywhere in YTIntel…" aria-label="Search YTIntel commands"></div><div class="yt-command-list" id="ytCommandList"></div></div>`;
 document.body.appendChild(overlay);
}
const cmdInput=overlay.querySelector('#ytCommandInput'),cmdList=overlay.querySelector('#ytCommandList');
let filtered=commands.slice(),selected=0,lastFocus=null;
function drawCommands(q=''){
 const query=String(q||'').trim().toLowerCase();filtered=commands.filter(c=>!query||`${c.label} ${c.desc}`.toLowerCase().includes(query));selected=Math.min(selected,Math.max(0,filtered.length-1));
 cmdList.innerHTML=filtered.length?filtered.map((c,i)=>`<button type="button" class="yt-command-item" data-cmd-index="${i}" aria-selected="${i===selected}"><span class="ci">${icon(c.icon)}</span><span><b>${escHtml(c.label)}</b><small>${escHtml(c.desc)}</small></span><kbd>${c.key}</kbd></button>`).join(''):'<div class="yt-command-empty">No matching workspace action.</div>';
 cmdList.querySelectorAll('[data-cmd-index]').forEach(b=>b.addEventListener('click',()=>runCommand(Number(b.dataset.cmdIndex))));
}
function openCommands(){lastFocus=document.activeElement;overlay.classList.add('show');document.body.style.overflow='hidden';selected=0;drawCommands('');setTimeout(()=>cmdInput?.focus(),20)}
function closeCommands(){overlay.classList.remove('show');document.body.style.overflow='';cmdInput.value='';lastFocus?.focus?.()}
function runCommand(i){const c=filtered[i];if(!c)return;closeCommands();goTab(c.tab,c.focus)}
document.querySelector('#ytCommandBtn')?.addEventListener('click',openCommands);
overlay.addEventListener('mousedown',e=>{if(e.target===overlay)closeCommands()});
cmdInput?.addEventListener('input',()=>{selected=0;drawCommands(cmdInput.value)});
cmdInput?.addEventListener('keydown',e=>{
 if(e.key==='ArrowDown'){e.preventDefault();selected=Math.min(selected+1,filtered.length-1);drawCommands(cmdInput.value)}
 else if(e.key==='ArrowUp'){e.preventDefault();selected=Math.max(selected-1,0);drawCommands(cmdInput.value)}
 else if(e.key==='Enter'){e.preventDefault();runCommand(selected)}
 else if(e.key==='Escape'){e.preventDefault();closeCommands()}
});
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();overlay.classList.contains('show')?closeCommands():openCommands()}
 else if(e.key==='Escape'&&overlay.classList.contains('show'))closeCommands();
});

// Current release card + modal.
function addRelease(){
 const g=document.querySelector('#updates .grid');if(!g)return;
 g.querySelector('[data-v130-release]')?.remove();g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
 const a=document.createElement('article');a.className='card c12 release current';a.dataset.v130Release='1';
 a.innerHTML='<div class="eyebrow">V0.13.0 · 5 SEP 2026 · CURRENT</div><h3>Interface Rebuild — YTIntel is now a research workspace</h3><ul class="list"><li><b>New desktop workspace:</b> persistent research navigation replaces the old strip of tabs.</li><li><b>New mobile navigation:</b> compact touch-first controls, cleaner page rhythm and less horizontal clutter.</li><li><b>Core workflow rail:</b> Discover → Investigate → Validate → Package stays visible where it helps.</li><li><b>Quick Switch:</b> Cmd/Ctrl + K jumps directly to any research tool.</li><li><b>Premium evidence system:</b> calmer surfaces, stronger hierarchy, denser data readability and clearer loading/error states.</li><li><b>Accessibility pass:</b> keyboard focus, semantic navigation, reduced-motion support and larger touch targets.</li></ul>';
 g.prepend(a);
}
function releaseHtml(){return `<div class="update-panel"><div class="update-top"><div class="grow"><span class="update-version">YTIntel v${VERSION} · INTERFACE REBUILD</span><h2>A serious research workspace.</h2><p class="muted">The intelligence was getting stronger while the interface was still behaving like an early prototype. v0.13 rebuilds the shell around the way YTIntel is actually used now.</p></div><button class="update-close" data-v130-close aria-label="Close">×</button></div><div class="update-items"><div class="update-item"><div class="tick">✓</div><div><b>Workspace navigation</b><span class="muted">Desktop sidebar + cleaner touch navigation on smaller screens.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Faster research flow</b><span class="muted">Radar → Analyse → Pattern Mine → Packaging is visible without forcing a rigid wizard.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Quick Switch</b><span class="muted">Cmd/Ctrl + K jumps anywhere without hunting through the interface.</span></div></div><div class="update-item"><div class="tick">✓</div><div><b>Visual hierarchy reset</b><span class="muted">Less border noise, better density, stronger typography and clearer evidence states.</span></div></div></div><div class="update-actions"><button class="primary" data-v130-close>Continue</button><button data-v130-log>Full update log</button></div></div>`}
function showRelease(){const m=document.querySelector('#updateModal');if(!m)return;m.innerHTML=releaseHtml();m.classList.add('show');const close=()=>{m.classList.remove('show');try{localStorage.setItem(RELEASE,'seen')}catch{}};m.querySelectorAll('[data-v130-close]').forEach(x=>x.addEventListener('click',close));m.querySelector('[data-v130-log]')?.addEventListener('click',()=>{close();goTab('updates')})}
function bindWhatsNew(){const b=document.querySelector('#whatsNewBtn');if(!b||b.dataset.v130Bound==='1')return;b.dataset.v130Bound='1';b.setAttribute('aria-label',"What's new in YTIntel");b.addEventListener('click',()=>setTimeout(showRelease,0))}

// Mark older popups seen so a fresh install gets only the current release announcement.
try{
 ['ytintel-whats-new-0.11.1-decision-gate','ytintel-whats-new-0.11.2-replication','ytintel-whats-new-0.12.0-opportunity-radar','ytintel-whats-new-0.12.1-packaging-lab'].forEach(k=>localStorage.setItem(k,'seen'));
}catch{}

// Improve empty placeholders without touching live result renderers.
['#radarRecent','#packageRecent'].forEach(sel=>{const x=document.querySelector(sel);if(x&&x.children.length===1&&x.querySelector(':scope > p.muted'))x.classList.add('empty')});

// Keep shell state correct when older async modules mutate the top bar or active view.
if(nav)nav.querySelectorAll('button[data-tab]').forEach(b=>b.addEventListener('click',()=>setTimeout(syncUI,25)));
const viewObserver=new MutationObserver(()=>syncUI());document.querySelectorAll('.view').forEach(v=>viewObserver.observe(v,{attributes:true,attributeFilter:['class']}));
const top=document.querySelector('.top');if(top)new MutationObserver(()=>{bindWhatsNew();syncStatus()}).observe(top,{childList:true,subtree:true,characterData:true});
addRelease();bindWhatsNew();syncUI();
setTimeout(()=>{addRelease();bindWhatsNew();syncUI()},1800);
setTimeout(()=>{addRelease();bindWhatsNew();syncUI()},7000);
let seen=false;try{seen=localStorage.getItem(RELEASE)==='seen'}catch{}
if(!seen)setTimeout(showRelease,900);
})();
