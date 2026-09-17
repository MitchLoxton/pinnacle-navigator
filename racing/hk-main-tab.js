(() => {
  'use strict';

  const DATA_URL='./hong-kong.json?v=20260917-stable';
  let hkOpen=location.hash==='#hong-kong';
  let hkData=null;
  let loading=null;
  let rootObserver=null;
  let opening=false;

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)):'—';
  const pct=v=>Number.isFinite(Number(v))?(Number(v)*100).toFixed(1)+'%':'—';

  function styles(){
    if(document.getElementById('hk-main-nav-style')) return;
    const s=document.createElement('style');
    s.id='hk-main-nav-style';
    s.textContent=`
      body.premium-racing-ui #premiumApp .premium-nav{grid-template-columns:repeat(6,minmax(0,1fr))!important}
      .premium-nav [data-hk-main-tab]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      .hk-stable-page{display:grid;gap:12px;padding-bottom:8px}
      .hk-stable-hero,.hk-stable-card{border:1px solid #2d435b;border-radius:18px;background:linear-gradient(145deg,#0d1a29,#0a1420);padding:16px}
      .hk-stable-kicker{font-size:8px;font-weight:1000;letter-spacing:.13em;color:#84a8c9;text-transform:uppercase}
      .hk-stable-hero h2{margin:6px 0 4px;font-size:25px}.hk-stable-sub{font-size:10px;line-height:1.5;color:#98adc2}
      .hk-stable-status{margin-top:12px;padding:12px;border:1px solid #775f29;border-radius:12px;background:#282211}.hk-stable-status strong{display:block;color:#ffd36d;font-size:20px}.hk-stable-status span{display:block;margin-top:4px;color:#e6d39c;font-size:9px;line-height:1.45}
      .hk-explain{padding:12px;border:1px solid #31506c;border-radius:12px;background:#0d2032;color:#b9cee2;font-size:10px;line-height:1.5}.hk-explain b{color:#fff}
      .hk-stable-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hk-stable-stat{padding:10px;border:1px solid #263b51;border-radius:11px;background:#0b1725}.hk-stable-stat span{display:block;font-size:7px;color:#7890a8;font-weight:950}.hk-stable-stat strong{display:block;margin-top:4px;font-size:13px}
      .hk-poss-head{display:flex;justify-content:space-between;gap:10px;align-items:end}.hk-poss-head span{font-size:8px;color:#7890a8;font-weight:950;letter-spacing:.1em}.hk-poss-head strong{font-size:13px}
      .hk-poss-list{display:grid;gap:8px;margin-top:10px}.hk-poss{padding:12px;border:1px solid #2b4058;border-radius:12px;background:#0d1a29}.hk-poss.potential{border-color:#80672e;background:#2a2414}.hk-poss.no{border-color:#4b3540;background:#1c151c}.hk-poss-top{display:flex;justify-content:space-between;gap:8px}.hk-poss h3{margin:0;font-size:14px}.hk-poss-badge{white-space:nowrap;padding:4px 7px;border-radius:999px;background:#17283a;color:#a9bdd0;font-size:7px;font-weight:1000}.hk-poss.potential .hk-poss-badge{background:#4a3b16;color:#ffd36d}.hk-poss.no .hk-poss-badge{background:#311820;color:#ffabb5}.hk-poss p{margin:6px 0 0;font-size:9px;line-height:1.45;color:#92a7bb}
      .hk-roadmap-mini{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.hk-roadmap-mini div{padding:10px;border:1px solid #2a4058;border-radius:10px;background:#0c1826}.hk-roadmap-mini span{display:block;font-size:7px;color:#7890a8;font-weight:950}.hk-roadmap-mini strong{display:block;margin-top:4px;font-size:12px}
      @media(max-width:600px){body.premium-racing-ui #premiumApp .premium-nav{gap:1px!important}.premium-nav button{padding:7px 1px!important}.premium-nav button span{font-size:6.5px!important;letter-spacing:0!important}.hk-stable-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hk-roadmap-mini{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function icon(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M6 5h11l-2 3 2 3H6"/></svg>';}

  function allSignals(race,data){
    const local=Array.isArray(race?.signals)?race.signals:[];
    const global=Array.isArray(data?.signals)?data.signals.filter(x=>Number(x?.race)===Number(race?.race)):[];
    return [...local,...global];
  }

  function raceState(race,data){
    const sig=allSignals(race,data);
    const flagged=sig.some(s=>s?.modelVerified===true||s?.modelClassificationVerified===true||s?.r2Core===true||s?.satelliteOnly===true);
    if(flagged) return {kind:'potential',label:'POTENTIAL ONLY',signals:sig};
    const status=String(race?.strategyStatus||'').toUpperCase();
    const pending=!sig.length&&(status.includes('NOT SCORED')||status.includes('PENDING')||status.includes('SCAN'));
    if(pending) return {kind:'pending',label:'PENDING SCORE',signals:sig};
    return {kind:'no',label:'NO MODEL POSSIBILITY',signals:sig};
  }

  function pageHtml(data){
    const meeting=data?.meeting||{};
    const strategy=data?.strategy||{};
    const approval=strategy?.productionApproval||{};
    const cadence=strategy?.historicalCadence||{};
    const headline=strategy?.historicalHeadline||{};
    const races=Array.isArray(data?.races)?data.races:[];
    const states=races.map(r=>({race:r,state:raceState(r,data)}));
    const possibilities=states.filter(x=>x.state.kind==='potential');
    const pending=states.filter(x=>x.state.kind==='pending');
    const action=approval.approved===true?'LIVE GATES REQUIRED':'SHADOW / WAIT';
    const actionText=approval.approved===true?'Production approval is on, but a bet still requires every live quote, model, capacity and risk gate.':'Hong Kong remains fail-closed while forward/execution evidence is incomplete. Possibilities below are for monitoring only.';
    return `<div class="hk-stable-page">
      <section class="hk-stable-hero">
        <div class="hk-stable-kicker">HONG KONG · 60 TARGET</div>
        <h2>${esc(meeting.venue||'Hong Kong')} · ${esc(meeting.date||'Next meeting TBC')}</h2>
        <div class="hk-stable-sub">${esc(meeting.status||'Meeting scan')} · ${esc(strategy.name||'HK research system')}</div>
        <div class="hk-stable-status"><strong>${esc(action)}</strong><span>${esc(actionText)}</span></div>
      </section>
      <div class="hk-explain"><b>How Hong Kong possibilities work:</b> same basic idea as Australia — the app tells you whether a race has a system possibility — but the trigger is different. Australia uses the frozen V11 race/state CORE map. Hong Kong uses verified horse-level frozen-model scoring. <b>POTENTIAL ONLY is never a bet.</b> PENDING SCORE means we do not yet know; NO MODEL POSSIBILITY means the race was scored and did not qualify.</div>
      <section class="hk-stable-grid">
        <div class="hk-stable-stat"><span>FROZEN CORE CADENCE</span><strong>${Number.isFinite(Number(cadence.betsPerYear))?Number(cadence.betsPerYear).toFixed(1):'—'}/YR</strong></div>
        <div class="hk-stable-stat"><span>RESEARCH TARGET</span><strong>55–65/YR</strong></div>
        <div class="hk-stable-stat"><span>HISTORICAL ROI</span><strong>${pct(headline.roi)}</strong></div>
        <div class="hk-stable-stat"><span>STORED HIST DD</span><strong>${money(headline.maxDrawdownAud)}</strong></div>
        <div class="hk-stable-stat"><span>MODEL POSSIBILITIES</span><strong>${possibilities.length}</strong></div>
        <div class="hk-stable-stat"><span>PENDING SCORE</span><strong>${pending.length}</strong></div>
      </section>
      <section class="hk-stable-card">
        <div class="hk-poss-head"><div><span>HONG KONG POSSIBILITIES</span><strong>Every race gets a clear status</strong></div><strong>${possibilities.length} POTENTIAL · ${pending.length} PENDING</strong></div>
        <div class="hk-poss-list">${states.map(({race:r,state})=>{
          const horse=state.signals.find(s=>s?.horse)?.horse||null;
          const meta=[r?.timeHkt&&r.timeHkt!=='TBC'?r.timeHkt:null,Number.isFinite(Number(r?.distanceM))?`${r.distanceM}m`:null,r?.class&&r.class!=='TBC'?r.class:null].filter(Boolean).join(' · ');
          const text=state.kind==='potential'?'Frozen model has flagged this race/horse as a possibility. Wait for all later execution gates.':state.kind==='pending'?'Model scoring is not complete yet, so the app is deliberately not calling this a yes or a no.':'Frozen model scoring is complete and this race did not qualify as a possibility.';
          return `<article class="hk-poss ${state.kind}"><div class="hk-poss-top"><h3>HK R${esc(r?.race??'—')} · ${esc(r?.name||'Race')}</h3><span class="hk-poss-badge">${esc(state.label)}</span></div><p>${horse?`Current shadow horse: ${esc(horse)}. `:''}${meta?esc(meta)+' · ':''}${esc(text)}</p></article>`;
        }).join('')||'<div class="hk-poss"><p>No Hong Kong races are loaded yet.</p></div>'}</div>
      </section>
      <section class="hk-stable-card"><div class="hk-stable-kicker">60 TARGET ROADMAP</div><div class="hk-roadmap-mini"><div><span>WIN CORE</span><strong>Frozen · quality first</strong></div><div><span>SECOND SLEEVE</span><strong>PLACE validation required</strong></div></div><p class="hk-stable-sub" style="margin:10px 0 0">The rejected ~57.6/year WIN-only shortcut stays excluded. The target is reached only by adding independently validated selections, not by loosening the frozen core.</p></section>
    </div>`;
  }

  async function getData(){
    if(hkData) return hkData;
    if(loading) return loading;
    loading=fetch(DATA_URL,{cache:'no-store'}).then(async r=>{if(!r.ok) throw new Error(`HTTP ${r.status}`);hkData=await r.json();return hkData;}).finally(()=>{loading=null;});
    return loading;
  }

  function setActiveNav(){
    const nav=document.querySelector('.premium-nav');
    if(!nav) return;
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.hasAttribute('data-hk-main-tab')));
  }

  function renderLoading(resetScroll){
    const page=document.getElementById('premiumPage');
    if(!page) return;
    const y=window.scrollY;
    page.dataset.hkMain='1';
    page.innerHTML='<section class="hk-stable-card"><div class="hk-stable-kicker">HONG KONG</div><h2 style="margin:6px 0">Loading current Hong Kong meeting…</h2></section>';
    setActiveNav();
    if(resetScroll) requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'auto'}));
    else requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'auto'}));
  }

  async function show({resetScroll=false}={}){
    const page=document.getElementById('premiumPage');
    if(!page) return;
    const y=window.scrollY;
    page.dataset.hkMain='1';
    if(!hkData) renderLoading(resetScroll);
    try{
      const data=await getData();
      if(!hkOpen) return;
      const current=document.getElementById('premiumPage');
      if(!current) return;
      current.dataset.hkMain='1';
      current.innerHTML=pageHtml(data);
      setActiveNav();
      if(location.hash!=='#hong-kong'&&history.replaceState) history.replaceState(null,'',location.pathname+location.search+'#hong-kong');
      requestAnimationFrame(()=>window.scrollTo({top:resetScroll?0:y,behavior:'auto'}));
    }catch(error){
      const current=document.getElementById('premiumPage');
      if(current){current.dataset.hkMain='1';current.innerHTML=`<section class="hk-stable-card"><h2>Hong Kong unavailable</h2><p class="hk-stable-sub">Could not verify the Hong Kong data. ${esc(error instanceof Error?error.message:'Unknown error')}</p></section>`;}
      setActiveNav();
    }finally{
      opening=false;
    }
  }

  function open(){
    if(opening&&hkOpen) return;
    opening=true;
    hkOpen=true;
    const page=document.getElementById('premiumPage');
    if(page) page.dataset.hkMain='1';
    ensure();
    show({resetScroll:true});
  }

  function ensure(){
    styles();
    const nav=document.querySelector('.premium-nav');
    if(!nav) return false;
    let btn=nav.querySelector('[data-hk-main-tab]');
    if(!btn){
      btn=document.createElement('button');
      btn.type='button';
      btn.setAttribute('data-hk-main-tab','1');
      btn.innerHTML=`${icon()}<span>Hong Kong</span>`;
      const settings=nav.querySelector('[data-premium-tab="settings"]');
      settings?nav.insertBefore(btn,settings):nav.appendChild(btn);
    }
    if(hkOpen) setActiveNav();
    return true;
  }

  // Use pointerdown in capture phase so an iPhone tap is handled before any live
  // background render has a chance to replace the navigation DOM underneath it.
  document.addEventListener('pointerdown',e=>{
    const hk=e.target.closest('[data-hk-main-tab]');
    if(hk){
      e.preventDefault();
      e.stopPropagation();
      open();
      return;
    }
    if(e.target.closest('[data-premium-tab]')||e.target.closest('[data-odds-compare-tab]')){
      hkOpen=false;
      opening=false;
      if(location.hash==='#hong-kong'&&history.replaceState) history.replaceState(null,'',location.pathname+location.search);
    }
  },true);

  // Keyboard / accessibility fallback.
  document.addEventListener('click',e=>{
    const hk=e.target.closest('[data-hk-main-tab]');
    if(hk){e.preventDefault();open();}
  },true);

  function mount(){
    const root=document.getElementById('premiumApp');
    if(!root) return setTimeout(mount,120);
    ensure();
    rootObserver=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.target===root)) ensure();
    });
    rootObserver.observe(root,{childList:true});
    if(hkOpen){opening=true;show({resetScroll:false});}
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();