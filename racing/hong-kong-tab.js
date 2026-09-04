(() => {
  'use strict';

  const DATA_URL = './hong-kong.json?v=20260904-safe-v2';
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const money = v => num(v) === null ? '—' : new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v));
  const price = v => num(v) === null ? '—' : '$' + Number(v).toFixed(2);
  const pct = v => num(v) === null ? '—' : (Number(v) * 100).toFixed(1) + '%';
  const n1 = v => num(v) === null ? '—' : Number(v).toFixed(1);

  function addStyles(){
    if(document.getElementById('hk-tab-styles')) return;
    const s=document.createElement('style');
    s.id='hk-tab-styles';
    s.textContent=`
      .hk-switcher{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}.hk-tab-btn{border:1px solid #334961;background:#111e2f;color:#aebed0;padding:9px 13px;border-radius:10px;font-weight:900;font-size:11px;cursor:pointer}.hk-tab-btn.active{background:#173455;color:#fff;border-color:#4a79a8}.hk-panel{display:none}.hk-panel.active{display:block}
      .hk-action,.hk-note,.hk-good,.hk-strategy,.hk-card{border-radius:12px;margin-bottom:10px;padding:12px}.hk-action{padding:16px;border:1px solid #765f2a;background:#2a2413}.hk-action.bet{border-color:#2a8058;background:#0d3525}.hk-action.no{border-color:#74323e;background:#35151d}.hk-action-label{font-size:9px;color:#aebed0;font-weight:950}.hk-action-title{font-size:26px;font-weight:1000;color:#ffc34f;margin-top:3px}.hk-action.bet .hk-action-title{color:#78f2b5}.hk-action.no .hk-action-title{color:#ff9eaa}.hk-action-text{font-size:11px;line-height:1.45;margin-top:5px}.hk-note{border:1px solid #765f2a;background:#2a2413;color:#ffe29a;font-size:10px;line-height:1.5}.hk-good{border:1px solid #2a8058;background:#0d2b20;color:#b9f6d8;font-size:10px;line-height:1.5}
      .hk-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}.hk-kpi{padding:10px;border:1px solid #2e435c;border-radius:10px;background:#0f1d2d}.hk-kpi span,.hk-rule span{display:block;color:#8198af;font-size:8px;font-weight:950}.hk-kpi strong{display:block;font-size:15px;margin-top:4px}.hk-strategy{border:1px solid #2e435c;background:#0d1725}.hk-strategy h3{margin:0 0 9px;font-size:13px}.hk-rules{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hk-rule{padding:9px;border-radius:9px;background:#111f30}.hk-rule strong{display:block;font-size:10px;margin-top:3px;line-height:1.35}
      .hk-card{border:1px solid #2e435c;background:#0e1928}.hk-card.bet{border-color:#2a8058;background:#0b261c}.hk-card.no{border-color:#64313b}.hk-race{font-size:13px;font-weight:950}.hk-meta,.hk-small{margin-top:5px;color:#9eb3ca;font-size:9px;line-height:1.45}.hk-status{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:8px;background:#2a2413;color:#ffc34f;font-size:9px;font-weight:950}.hk-status.bet{background:#0d3525;color:#78f2b5}.hk-status.no{background:#35151d;color:#ff9eaa}.hk-signal{margin-top:8px;padding:8px;border:1px solid #31506d;border-radius:8px;font-size:10px;line-height:1.4}.hk-signal.bet{border-color:#2a8058;background:#0d2c20}.hk-signal.no{border-color:#63313b;background:#2a151b}.hk-source{display:inline-block;margin-top:8px;color:#8dc8ff;font-size:10px;font-weight:900;text-decoration:none}
      @media(max-width:600px){.hk-kpis,.hk-rules{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(s);
  }

  function buildShell(){
    if(document.getElementById('hkRacingPanel')) return;
    addStyles();
    const host=document.querySelector('main')||document.body;
    const original=[...host.children];
    const nav=document.createElement('div');
    nav.className='hk-switcher';
    nav.innerHTML='<button class="hk-tab-btn active" data-tab="au">AUSTRALIA · V11</button><button class="hk-tab-btn" data-tab="hk">HONG KONG · SAFE V2</button>';

    const au=document.createElement('div');
    au.id='auRacingPanel'; au.className='hk-panel active';
    original.forEach(x=>au.appendChild(x));

    const hk=document.createElement('div');
    hk.id='hkRacingPanel'; hk.className='hk-panel';
    hk.innerHTML='<section style="margin-bottom:12px"><div style="font-size:10px;color:#7f96ae;font-weight:950">HONG KONG · LOW FREQUENCY · LOWER DRAWDOWN</div><h2 style="margin:5px 0 3px;font-size:20px">SHA TIN · SUN 6 SEP</h2><div style="font-size:11px;color:#9eb3ca">HK PARITY V2 selections + SAFE STAKING V2</div></section><div id="hkRacingContent"><div class="hk-note">Loading Hong Kong SAFE V2 strategy…</div></div>';
    host.append(nav,au,hk);

    const switchTab=t=>{
      nav.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));
      au.classList.toggle('active',t==='au');
      hk.classList.toggle('active',t==='hk');
      const bottom=document.getElementById('bottomCommand');
      if(bottom) bottom.style.display=t==='hk'?'none':'';
      history.replaceState(null,'',location.pathname+location.search+(t==='hk'?'#hong-kong':''));
    };
    nav.addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)switchTab(b.dataset.tab);});
    if(location.hash==='#hong-kong') switchTab('hk');
  }

  function classify(s,strategy){
    const o=num(s.odds??s.executableOdds), rank=num(s.marketRank), ev=num(s.rawModelEv), r=strategy?.rules||{};
    if(s.r2Core===true){
      const low=r.coreLow||{};
      if(o!==null&&o>=Number(low.minOddsInclusive??5)&&o<Number(low.maxOddsExclusive??8)) return {sleeve:'LOW CORE',stake:Number(low.stakeAud??1500)};
      const lng=r.coreLong||{};
      if(o!==null&&o>=Number(lng.minOddsInclusive??20)&&o<Number(lng.maxOddsExclusive??30)) return {sleeve:'LONG CORE',stake:Number(lng.stakeAud??3000)};
      return {no:true,reason:'R2 CORE runner is outside the frozen $5–<8 and $20–<30 bands.'};
    }
    if(s.satelliteOnly===true){
      const main=r.mainSatellite||{}, extra=r.extraSatellite||{};
      const mainPrice=o!==null&&o>=Number(main.minOddsInclusive??4)&&o<Number(main.maxOddsExclusive??7);
      if(mainPrice&&rank===null) return {wait:true,reason:'Market rank is required for MAIN SAT.'};
      if(mainPrice&&rank<=Number(main.maxMarketRank??2)) return {sleeve:'MAIN SAT',stake:Number(main.stakeAud??6000)};
      if(ev===null) return {wait:true,reason:'Original raw model EV is required for EXTRA EV SAT.'};
      if(ev>=Number(extra.minimumOriginalRawModelEv??0.12)) return {sleeve:'EXTRA EV SAT',stake:Number(extra.stakeAud??1500)};
      return {no:true,reason:'Satellite runner does not pass MAIN SAT or EXTRA EV SAT.'};
    }
    return {wait:true,reason:'R2 CORE / satellite-only model classification is not verified.'};
  }

  function evaluate(s,strategy){
    const wait=r=>({status:'WAIT',reason:r,signal:s}), no=r=>({status:'NO_BET',reason:r,signal:s});
    if(!s?.horse) return wait('Horse identity is not verified.');
    if(s.modelVerified!==true&&s.modelClassificationVerified!==true) return wait('Frozen model classification is not verified.');
    if(s.quoteVerified!==true) return wait('Executable WIN price is not verified.');
    const o=num(s.odds??s.executableOdds);
    if(o===null||o<=1) return wait('Executable odds are missing or invalid.');
    const c=classify(s,strategy);
    if(c.wait) return wait(c.reason);
    if(c.no) return no(c.reason);
    const hard=Number(strategy?.risk?.hardMaxStakeAud??6000);
    if(!(c.stake>0)||c.stake>hard) return no('SAFE V2 stake breaches the hard cap.');
    if(s.capacityVerified!==true) return wait(`Need verified capacity for ${money(c.stake)}.`);
    const cap=num(s.capacityAud);
    if(cap===null) return wait(`Capacity amount is missing; need at least ${money(c.stake)}.`);
    if(cap<c.stake) return no(`Available capacity ${money(cap)} is below ${money(c.stake)}.`);
    return {status:'BET_NOW',reason:`All SAFE V2 gates passed · ${c.sleeve}.`,signal:s,sleeve:c.sleeve,stakeAud:c.stake};
  }

  function raceSignals(data,r){
    const local=Array.isArray(r.signals)?r.signals:[];
    const global=Array.isArray(data.signals)?data.signals.filter(x=>Number(x.race)===Number(r.race)):[];
    return [...local,...global];
  }

  function signalHtml(x){
    const s=x.signal||{}, cls=x.status==='BET_NOW'?'bet':x.status==='NO_BET'?'no':'', title=x.status==='BET_NOW'?'BET NOW':x.status==='NO_BET'?'NO BET':'WAIT';
    const detail=s.horse?`<strong>${esc(String(s.horse).toUpperCase())}</strong> · BACK WIN · ${price(s.odds??s.executableOdds)}${x.status==='BET_NOW'?` · ${esc(x.sleeve)} · ${money(x.stakeAud)}`:''}`:'Signal incomplete.';
    return `<div class="hk-signal ${cls}"><b>${title}</b> · ${detail}<br><span style="color:#9eb3ca">${esc(x.reason)}</span></div>`;
  }

  function render(data){
    const root=document.getElementById('hkRacingContent'); if(!root) return;
    const st=data.strategy||{}, h=st.historicalHeadline||{}, cadence=st.historicalCadence||{}, feed=st.liveFeed||{}, rules=st.rules||{}, races=Array.isArray(data.races)?data.races:[];
    const results=races.flatMap(r=>raceSignals(data,r).map(s=>evaluate(s,st)));
    const bets=results.filter(x=>x.status==='BET_NOW');
    const ready=feed.modelClassificationVerified===true&&feed.executableQuotesVerified===true&&feed.capacityVerified===true;
    const scored=races.length&&races.every(r=>!String(r.strategyStatus||'').includes('NOT SCORED'));
    let action={cls:'',title:'WAIT',text:feed.message||'Do not bet until live model and price/capacity checks are verified.'};
    if(bets.length) action={cls:'bet',title:'BET NOW',text:`${bets.length} SAFE V2 selection${bets.length===1?'':'s'} passed every gate. Place only the exact horse and stake shown.`};
    else if(ready&&scored) action={cls:'no',title:'NO BET',text:'Meeting scored; no horse passed every SAFE V2 gate.'};

    const low=rules.coreLow||{},lng=rules.coreLong||{},main=rules.mainSatellite||{},extra=rules.extraSatellite||{},safe1=st.safeV1Baseline||{},aggr=st.aggressiveBaseline||{};
    root.innerHTML=`
      <div class="hk-action ${action.cls}"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">${action.title}</div><div class="hk-action-text">${esc(action.text)}</div></div>
      <div class="hk-good"><b>DRAWNDOWN FIX ACTIVE:</b> same frozen ~${n1(cadence.betsPerYear)} bets/year. Stored historical DD has gone from ${money(aggr.maxDrawdownAud)} aggressive → ${money(safe1.maxDrawdownAud)} SAFE V1 → <b>${money(h.maxDrawdownAud)} SAFE V2</b>.</div>
      <div class="hk-kpis"><div class="hk-kpi"><span>HIST BETS/YR</span><strong>${n1(cadence.betsPerYear)}</strong></div><div class="hk-kpi"><span>HIST ROI</span><strong>${pct(h.roi)}</strong></div><div class="hk-kpi"><span>HIST AVG/YR</span><strong>${money(h.annualProfitAud)}</strong></div><div class="hk-kpi"><span>HIST MAX DD</span><strong>${money(h.maxDrawdownAud)}</strong></div></div>
      <div class="hk-note"><b>IMPORTANT:</b> ${money(h.maxDrawdownAud)} is the actual stored historical path, not a guaranteed maximum. The same race results in a different order can produce a materially larger drawdown. Calibrated model EV is about ${money(st?.prediction?.calibratedModelEvAudPerYear)}/year.</div>
      <section class="hk-strategy"><h3>${esc(st.name||'HK PARITY V2 · SAFE STAKING V2')}</h3><div class="hk-rules">
        <div class="hk-rule"><span>LOW CORE</span><strong>R2 CORE · ${price(low.minOddsInclusive)}–&lt;${price(low.maxOddsExclusive)} · ${money(low.stakeAud)}</strong></div>
        <div class="hk-rule"><span>LONG CORE</span><strong>R2 CORE · ${price(lng.minOddsInclusive)}–&lt;${price(lng.maxOddsExclusive)} · ${money(lng.stakeAud)}</strong></div>
        <div class="hk-rule"><span>MAIN SAT</span><strong>Satellite-only · ${price(main.minOddsInclusive)}–&lt;${price(main.maxOddsExclusive)} · rank 1–${esc(main.maxMarketRank)} · ${money(main.stakeAud)}</strong></div>
        <div class="hk-rule"><span>EXTRA EV SAT</span><strong>Satellite-only · raw EV ≥ ${pct(extra.minimumOriginalRawModelEv)} · ${money(extra.stakeAud)}</strong></div>
      </div><div class="hk-small">WIN only · BACK only · max SAFE V2 stake ${money(st?.risk?.hardMaxStakeAud)} · horse-selection thresholds are unchanged.</div></section>
      ${races.map(r=>{const rr=raceSignals(data,r).map(s=>evaluate(s,st)),bet=rr.some(x=>x.status==='BET_NOW'),nob=!bet&&rr.length&&rr.every(x=>x.status==='NO_BET'),cls=bet?'bet':nob?'no':'',status=bet?'BET NOW':nob?'NO BET':(r.strategyStatus||'WAIT — SAFE V2 NOT SCORED');return `<div class="hk-card ${cls}"><div class="hk-race">HK R${esc(r.race)} · ${esc(r.timeHkt||'TBC')} · ${esc(r.name||'Race')}</div><div class="hk-meta">${esc(r.class||'')} · ${esc(r.distanceM)}m</div><div class="hk-status ${cls}">${esc(status)}</div>${rr.length?rr.map(signalHtml).join(''):'<div class="hk-small">No verified SAFE V2 horse-level signal loaded yet. Do not choose a horse manually.</div>'}</div>`;}).join('')}
      <a class="hk-source" href="${esc(data?.meeting?.officialSourceUrl||'#')}" target="_blank" rel="noopener">OPEN OFFICIAL HKJC RACE CARD ↗</a>`;
  }

  async function load(){
    const root=document.getElementById('hkRacingContent'); if(!root) return;
    try{
      const r=await fetch(DATA_URL,{cache:'no-store'});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      render(await r.json());
    }catch(e){
      root.innerHTML='<div class="hk-action"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">WAIT</div><div class="hk-action-text">SAFE V2 Hong Kong data could not be verified. Do not bet.</div></div>';
    }
  }

  window.MITCHELL_HK_PARITY_V2_EVALUATE=evaluate;
  window.MITCHELL_HK_PARITY_V2_REFRESH=load;

  function start(){
    buildShell();
    load();
    window.addEventListener('online',()=>setTimeout(load,100));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(load,100);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
