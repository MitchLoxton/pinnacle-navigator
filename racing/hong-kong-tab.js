(() => {
  'use strict';

  const DATA_URL = './hong-kong.json?v=20260904-optimal-v3';
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const money = v => num(v) === null ? '—' : new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v));
  const price = v => num(v) === null ? '—' : '$' + Number(v).toFixed(2);
  const pct = v => num(v) === null ? '—' : (Number(v)*100).toFixed(1) + '%';
  const n1 = v => num(v) === null ? '—' : Number(v).toFixed(1);

  function addStyles(){
    if(document.getElementById('hk-tab-styles')) return;
    const s=document.createElement('style'); s.id='hk-tab-styles'; s.textContent=`
      .hk-switcher{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}.hk-tab-btn{border:1px solid #334961;background:#111e2f;color:#aebed0;padding:9px 13px;border-radius:10px;font-weight:900;font-size:11px;cursor:pointer;text-decoration:none}.hk-tab-btn.active{background:#173455;color:#fff;border-color:#4a79a8}.hk-panel{display:none}.hk-panel.active{display:block}
      .hk-action,.hk-note,.hk-good,.hk-strategy,.hk-card{border-radius:12px;margin-bottom:10px;padding:12px}.hk-action{padding:16px;border:1px solid #765f2a;background:#2a2413}.hk-action.bet{border-color:#2a8058;background:#0d3525}.hk-action.no{border-color:#74323e;background:#35151d}.hk-action-label{font-size:9px;color:#aebed0;font-weight:950}.hk-action-title{font-size:26px;font-weight:1000;color:#ffc34f;margin-top:3px}.hk-action.bet .hk-action-title{color:#78f2b5}.hk-action.no .hk-action-title{color:#ff9eaa}.hk-action-text{font-size:11px;line-height:1.45;margin-top:5px}.hk-note{border:1px solid #765f2a;background:#2a2413;color:#ffe29a;font-size:10px;line-height:1.5}.hk-good{border:1px solid #2a8058;background:#0d2b20;color:#b9f6d8;font-size:10px;line-height:1.5}
      .hk-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}.hk-kpi{padding:10px;border:1px solid #2e435c;border-radius:10px;background:#0f1d2d}.hk-kpi span,.hk-rule span{display:block;color:#8198af;font-size:8px;font-weight:950}.hk-kpi strong{display:block;font-size:15px;margin-top:4px}.hk-strategy{border:1px solid #2e435c;background:#0d1725}.hk-strategy h3{margin:0 0 9px;font-size:13px}.hk-rules{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hk-rule{padding:9px;border-radius:9px;background:#111f30}.hk-rule strong{display:block;font-size:10px;margin-top:3px;line-height:1.35}.hk-card{border:1px solid #2e435c;background:#0e1928}.hk-card.bet{border-color:#2a8058;background:#0b261c}.hk-card.no{border-color:#64313b}.hk-race{font-size:13px;font-weight:950}.hk-meta,.hk-small{margin-top:5px;color:#9eb3ca;font-size:9px;line-height:1.45}.hk-status{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:8px;background:#2a2413;color:#ffc34f;font-size:9px;font-weight:950}.hk-status.bet{background:#0d3525;color:#78f2b5}.hk-status.no{background:#35151d;color:#ff9eaa}.hk-signal{margin-top:8px;padding:8px;border:1px solid #31506d;border-radius:8px;font-size:10px;line-height:1.4}.hk-signal.bet{border-color:#2a8058;background:#0d2c20}.hk-signal.no{border-color:#63313b;background:#2a151b}.hk-source{display:inline-block;margin-top:8px;color:#8dc8ff;font-size:10px;font-weight:900;text-decoration:none}@media(max-width:600px){.hk-kpis,.hk-rules{grid-template-columns:1fr 1fr}}`;
    document.head.appendChild(s);
  }

  function buildShell(){
    if(document.getElementById('hkRacingPanel')) return;
    addStyles(); const host=document.querySelector('main')||document.body; const original=[...host.children];
    const nav=document.createElement('div'); nav.className='hk-switcher'; nav.innerHTML='<button class="hk-tab-btn active" data-tab="au">AUSTRALIA · V11</button><button class="hk-tab-btn" data-tab="hk">HONG KONG · OPTIMAL V3</button>';
    const au=document.createElement('div'); au.id='auRacingPanel'; au.className='hk-panel active'; original.forEach(x=>au.appendChild(x));
    const hk=document.createElement('div'); hk.id='hkRacingPanel'; hk.className='hk-panel'; hk.innerHTML='<section style="margin-bottom:12px"><div style="font-size:10px;color:#7f96ae;font-weight:950">HONG KONG · ONE BET MAX PER RACE · 100/YEAR HARD CAP</div><h2 style="margin:5px 0 3px;font-size:20px">SHA TIN · SUN 6 SEP</h2><div style="font-size:11px;color:#9eb3ca">HK OPTIMAL V3 · AU-risk max-profit research profile</div></section><div id="hkRacingContent"><div class="hk-note">Loading Hong Kong OPTIMAL V3…</div></div>';
    host.append(nav,au,hk);
    const switchTab=t=>{nav.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));au.classList.toggle('active',t==='au');hk.classList.toggle('active',t==='hk');const bottom=document.getElementById('bottomCommand');if(bottom)bottom.style.display=t==='hk'?'none':'';history.replaceState(null,'',location.pathname+location.search+(t==='hk'?'#hong-kong':''));};
    nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)switchTab(b.dataset.tab);}); if(location.hash==='#hong-kong') switchTab('hk');
  }

  function classify(s,strategy){
    const o=num(s.odds??s.executableOdds), rank=num(s.marketRank), raw=num(s.rawModelEv), r=strategy?.rules||{};
    if(s.r2Core===true){
      const low=r.coreLow||{}; if(o!==null&&o>=Number(low.minOddsInclusive??4)&&o<Number(low.maxOddsExclusive??7)) return {sleeve:'LOW CORE',stake:Number(low.stakeAud??3000)};
      const lng=r.coreLong||{}; if(o!==null&&o>=Number(lng.minOddsInclusive??18)&&o<Number(lng.maxOddsExclusive??30)) return {sleeve:'LONG CORE',stake:Number(lng.stakeAud??5000)};
      return {no:true,reason:'R2 CORE runner is outside the frozen $4–<7 and $18–<30 bands.'};
    }
    if(s.satelliteOnly===true){
      const main=r.mainSatellite||{}, extra=r.extraSatellite||{}; const inMain=o!==null&&o>=Number(main.minOddsInclusive??3)&&o<Number(main.maxOddsExclusive??7);
      if(inMain&&rank===null) return {wait:true,reason:'Market rank is required for MAIN SAT.'};
      if(inMain&&rank<=Number(main.maxMarketRank??2)) return {sleeve:'MAIN SAT',stake:Number(main.stakeAud??7000)};
      if(raw===null) return {wait:true,reason:'Original raw model EV is required for EXTRA EV SAT.'};
      if(raw>=Number(extra.minimumOriginalRawModelEv??0.18)) return {sleeve:'EXTRA EV SAT',stake:Number(extra.stakeAud??10000)};
      return {no:true,reason:'Satellite runner does not pass MAIN SAT or +18% EXTRA EV SAT.'};
    }
    return {wait:true,reason:'R2 CORE / satellite-only model classification is not verified.'};
  }

  function calibratedEv(s){
    const direct=num(s.calibratedModelEv??s.calibratedEv); if(direct!==null) return direct;
    const p=num(s.calibratedProbability??s.calibratedP), o=num(s.odds??s.executableOdds); if(p===null||o===null) return null;
    const stressed=1+(o-1)*0.97; return p*stressed-1;
  }

  function precheck(s,strategy){
    if(!s?.horse) return {status:'WAIT',reason:'Horse identity is not verified.',signal:s};
    if(s.modelVerified!==true&&s.modelClassificationVerified!==true) return {status:'WAIT',reason:'Frozen model classification is not verified.',signal:s};
    if(s.quoteVerified!==true) return {status:'WAIT',reason:'Executable WIN price is not verified.',signal:s};
    const o=num(s.odds??s.executableOdds); if(o===null||o<=1) return {status:'WAIT',reason:'Executable decimal odds are missing or invalid.',signal:s};
    const c=classify(s,strategy); if(c.wait) return {status:'WAIT',reason:c.reason,signal:s}; if(c.no) return {status:'NO_BET',reason:c.reason,signal:s};
    const cev=calibratedEv(s); if(cev===null) return {status:'WAIT',reason:'Verified calibrated model EV is required for the one-bet-per-race ranking.',signal:s};
    return {status:'QUALIFIES',signal:s,sleeve:c.sleeve,stakeAud:c.stake,calibratedEv:cev,odds:o,rawEv:num(s.rawModelEv)??-999};
  }

  function executeTop(x,strategy){
    const s=x.signal||{}, hard=Number(strategy?.risk?.hardMaxStakeAud??10000), yearCap=Number(strategy?.risk?.maxBetsPerCalendarYear??100);
    if(!(x.stakeAud>0)||x.stakeAud>hard) return {...x,status:'NO_BET',reason:`Stake ${money(x.stakeAud)} breaches the ${money(hard)} hard cap.`};
    const feed=strategy?.liveFeed||{}; if(feed.yearBetCountVerified!==true) return {...x,status:'WAIT',reason:'Calendar-year confirmed bet count is not verified, so the 100-bet hard cap cannot be enforced.'};
    const used=num(feed.confirmedBetsThisCalendarYear); if(used===null) return {...x,status:'WAIT',reason:'Confirmed Hong Kong bets this calendar year are missing.'};
    if(used>=yearCap) return {...x,status:'NO_BET',reason:`Calendar-year cap reached (${used}/${yearCap}).`};
    if(s.capacityVerified!==true) return {...x,status:'WAIT',reason:`Need verified capacity for ${money(x.stakeAud)}.`};
    const cap=num(s.capacityAud); if(cap===null) return {...x,status:'WAIT',reason:`Capacity amount is missing; need at least ${money(x.stakeAud)}.`};
    if(cap<x.stakeAud) return {...x,status:'NO_BET',reason:`Available capacity ${money(cap)} is below ${money(x.stakeAud)}.`};
    return {...x,status:'BET_NOW',reason:`All OPTIMAL V3 gates passed · ${x.sleeve} · highest calibrated model EV in this race.`};
  }

  function evaluateRace(rawSignals,strategy){
    const checked=rawSignals.map(s=>precheck(s,strategy));
    if(checked.some(x=>x.status==='WAIT')) return checked.map(x=>x.status==='QUALIFIES'?{...x,status:'WAIT',reason:'Race ranking is incomplete because another potentially relevant signal is not fully verified.'}:x);
    const q=checked.filter(x=>x.status==='QUALIFIES'); if(!q.length) return checked;
    q.sort((a,b)=>(b.calibratedEv-a.calibratedEv)||(a.odds-b.odds)||(b.rawEv-a.rawEv)); const top=q[0];
    const chosen=executeTop(top,strategy);
    return checked.map(x=>{
      if(x!==top&&x.status==='QUALIFIES') return {...x,status:'NO_BET',reason:`Qualifies, but OPTIMAL V3 allows one bet per race and another runner has higher calibrated model EV.`};
      if(x===top) return chosen;
      return x;
    });
  }

  function raceSignals(data,r){const local=Array.isArray(r.signals)?r.signals:[],global=Array.isArray(data.signals)?data.signals.filter(x=>Number(x.race)===Number(r.race)):[];return [...local,...global];}
  function signalHtml(x){const s=x.signal||{},cls=x.status==='BET_NOW'?'bet':x.status==='NO_BET'?'no':'',title=x.status==='BET_NOW'?'BET NOW':x.status==='NO_BET'?'NO BET':'WAIT',score=x.calibratedEv!=null?` · model EV ${pct(x.calibratedEv)}`:'';return `<div class="hk-signal ${cls}"><b>${title}</b> · ${s.horse?`<strong>${esc(String(s.horse).toUpperCase())}</strong> · BACK WIN · ${price(s.odds??s.executableOdds)}${x.sleeve?` · ${esc(x.sleeve)}`:''}${x.status==='BET_NOW'?` · stake ${money(x.stakeAud)}`:''}${score}`:'Signal incomplete.'}<br><span style="color:#9eb3ca">${esc(x.reason||'')}</span></div>`;}

  function render(data){
    const root=document.getElementById('hkRacingContent'); if(!root)return; const st=data.strategy||{},h=st.historicalHeadline||{},c=st.historicalCadence||{},feed=st.liveFeed||{},rules=st.rules||{},risk=st.risk||{},races=Array.isArray(data.races)?data.races:[];
    const byRace=races.map(r=>({race:r,results:evaluateRace(raceSignals(data,r),st)})); const bets=byRace.flatMap(x=>x.results).filter(x=>x.status==='BET_NOW');
    const fullyScored=races.length&&races.every(r=>!String(r.strategyStatus||'').includes('NOT SCORED')); const feedReady=feed.modelClassificationVerified===true&&feed.calibratedModelEvVerified===true&&feed.executableQuotesVerified===true&&feed.capacityVerified===true&&feed.yearBetCountVerified===true;
    let action={cls:'',title:'WAIT',text:feed.message||'Do not bet until every OPTIMAL V3 live gate is verified.'};
    if(bets.length) action={cls:'bet',title:'BET NOW',text:`${bets.length} race${bets.length===1?'':'s'} currently has one verified OPTIMAL V3 selection. Place only the exact horse and stake shown.`}; else if(feedReady&&fullyScored) action={cls:'no',title:'NO BET',text:'Meeting scored; no horse passed every OPTIMAL V3 selection and execution gate.'};
    const low=rules.coreLow||{},lng=rules.coreLong||{},main=rules.mainSatellite||{},extra=rules.extraSatellite||{};
    root.innerHTML=`
      <div class="hk-action ${action.cls}"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">${esc(action.title)}</div><div class="hk-action-text">${esc(action.text)}</div></div>
      <div class="hk-good"><b>OPTIMAL V3 ACTIVE:</b> historical average ${n1(c.betsPerYear)} bets/year, busiest completed year ${esc(c.maxBetsAnyCompletedYear)}, hard cap ${esc(c.calendarYearBetCap)} per calendar year, and maximum one selected horse per race.</div>
      <div class="hk-kpis"><div class="hk-kpi"><span>HIST BETS/YR</span><strong>${n1(c.betsPerYear)}</strong></div><div class="hk-kpi"><span>HIST ROI</span><strong>${pct(h.roi)}</strong></div><div class="hk-kpi"><span>HIST AVG/YR</span><strong>${money(h.annualProfitAud)}</strong></div><div class="hk-kpi"><span>STORED HIST DD</span><strong>${money(h.maxDrawdownAud)}</strong></div></div>
      <div class="hk-note"><b>RISK WARNING:</b> ${money(h.maxDrawdownAud)} is only the stored historical sequence. The same completed race P/L values reordered produced P95 drawdown around ${money(risk.sequenceStressP95MaxDrawdownAud)}. Historical optimization and closing/research prices do not guarantee live results.</div>
      <section class="hk-strategy"><h3>${esc(st.name||'HK OPTIMAL V3')}</h3><div class="hk-rules">
        <div class="hk-rule"><span>LOW CORE</span><strong>R2 CORE · ${price(low.minOddsInclusive)}–&lt;${price(low.maxOddsExclusive)} · ${money(low.stakeAud)}</strong></div>
        <div class="hk-rule"><span>LONG CORE</span><strong>R2 CORE · ${price(lng.minOddsInclusive)}–&lt;${price(lng.maxOddsExclusive)} · ${money(lng.stakeAud)}</strong></div>
        <div class="hk-rule"><span>MAIN SAT</span><strong>Satellite-only · ${price(main.minOddsInclusive)}–&lt;${price(main.maxOddsExclusive)} · rank 1–${esc(main.maxMarketRank)} · ${money(main.stakeAud)}</strong></div>
        <div class="hk-rule"><span>EXTRA EV SAT</span><strong>Satellite-only · raw EV ≥ ${pct(extra.minimumOriginalRawModelEv)} · ${money(extra.stakeAud)}</strong></div>
      </div><div class="hk-small">WIN only · BACK only · max one bet/race · choose highest calibrated model EV among verified qualifiers · max stake ${money(risk.hardMaxStakeAud)} · max ${esc(risk.maxBetsPerCalendarYear)} confirmed HK bets/calendar year.</div></section>
      ${byRace.map(({race:r,results})=>{const bet=results.some(x=>x.status==='BET_NOW'),nob=!bet&&results.length&&results.every(x=>x.status==='NO_BET'),cls=bet?'bet':nob?'no':'',status=bet?'BET NOW':nob?'NO BET':(r.strategyStatus||'WAIT — OPTIMAL V3 NOT SCORED');return `<div class="hk-card ${cls}"><div class="hk-race">HK R${esc(r.race)} · ${esc(r.timeHkt||'TBC')} · ${esc(r.name||'Race')}</div><div class="hk-meta">${esc(r.class||'')} · ${esc(r.distanceM)}m</div><div class="hk-status ${cls}">${esc(status)}</div>${results.length?results.map(signalHtml).join(''):'<div class="hk-small">No verified OPTIMAL V3 horse-level signals loaded yet. Do not choose a horse manually.</div>'}</div>`;}).join('')}
      <a class="hk-source" href="${esc(data?.meeting?.officialSourceUrl||'#')}" target="_blank" rel="noopener">OPEN OFFICIAL HKJC RACE CARD ↗</a>`;
  }

  async function load(){const root=document.getElementById('hkRacingContent');if(!root)return;try{const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);render(await r.json());}catch(e){root.innerHTML='<div class="hk-action"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">WAIT</div><div class="hk-action-text">OPTIMAL V3 data could not be verified. Do not place a Hong Kong bet.</div></div>';}}
  window.MITCHELL_HK_OPTIMAL_V3_REFRESH=load; window.MITCHELL_HK_OPTIMAL_V3_EVALUATE_RACE=evaluateRace;
  function start(){buildShell();load();window.addEventListener('online',()=>setTimeout(load,100));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(load,100);});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
