(() => {
  'use strict';

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)):'—';
  const n0=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('en-AU',{maximumFractionDigits:0}).format(Number(v)):'—';
  const n1=v=>Number.isFinite(Number(v))?Number(v).toFixed(1):'—';
  const pct=v=>Number.isFinite(Number(v))?`${Number(v).toFixed(1)}%`:'—';
  const pctF=v=>Number.isFinite(Number(v))?`${(Number(v)*100).toFixed(1)}%`:'—';
  async function getJson(path){const r=await fetch(path,{cache:'no-cache'});if(!r.ok)throw new Error(`${path} HTTP ${r.status}`);return r.json();}
  function metric(label,value,note='',tone=''){return `<div class="metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note?`<small>${esc(note)}</small>`:''}</div>`;}
  function section(title,subtitle,body,id=''){return `<section class="stats-section"${id?` id="${esc(id)}"`:''}><div class="section-head"><div><span>MITCHELL RACING</span><h2>${esc(title)}</h2></div>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>${body}</section>`;}

  function compare(stats,hk){
    const au=stats?.historical||{},h=hk?.historical||{},f=hk?.frequency||{},r=hk?.risk||{},seq=hk?.sequenceStress||{};
    return section('AU V11 vs HK OPTIMAL V3','The active Hong Kong profile was selected to maximise historical annual P/L inside the AU recorded-drawdown ceiling, with a hard 100-bet/year cap.',`
      <div class="table-wrap compare-table"><table><thead><tr><th>Metric</th><th>Australia V11</th><th>Hong Kong OPTIMAL V3</th></tr></thead><tbody>
        <tr><td>Bets / year</td><td><b>${n1(au.betsPerYear)}</b></td><td><b>${n1(f.betsPerYear)}</b> · busiest year ${n0(f.maxBetsAnyCompletedYear)} / cap ${n0(f.calendarYearBetCap)}</td></tr>
        <tr><td>Historical sample</td><td>${n0(au.completedFys)} FY · ${n0(au.bets)} bets</td><td>${n0(f.completedYears)} years · ${n0(f.completedBets)} bets</td></tr>
        <tr><td>Historical annual P/L</td><td>${money(au.avgCompletedFyAud)}</td><td class="good-text">${money(h.annualHistoricalProfitAud)}</td></tr>
        <tr><td>Historical ROI</td><td>${pct(au.roiPct)}</td><td class="good-text">${pctF(h.historicalRoi)}</td></tr>
        <tr><td>Stored historical DD</td><td>${money(au.recordedMaxDrawdownAud)} recorded</td><td class="good-text">${money(h.raceLevelMaxDrawdownAud)}</td></tr>
        <tr><td>Sequence stress</td><td>${money(au.reorderStressMaxDrawdownAud)} AU reorder stress</td><td>${money(seq.p95MaxDrawdownAud)} HK P95 permutation stress</td></tr>
        <tr><td>Max stake</td><td>A$10,000</td><td>${money(r.hardMaxStakeAud)}</td></tr>
        <tr><td>One bet max / race</td><td>AU system-specific</td><td><b>YES</b></td></tr>
        <tr><td>Status</td><td><span class="pill good-pill">V11 PRODUCTION FRAMEWORK</span></td><td><span class="pill warn-pill">NEW SHADOW CANDIDATE</span></td></tr>
      </tbody></table></div>
      <div class="truth-box"><strong>What was actually optimized</strong><p>OPTIMAL V3 is the best point found in the tested rule/stake grid under two explicit constraints: no completed calendar year above 100 bets, and the stored completed-history drawdown no higher than AU V11's A$79,850 recorded path. Its stored HK drawdown is ${money(h.raceLevelMaxDrawdownAud)}, but the P95 sequence stress is ${money(seq.p95MaxDrawdownAud)}, so the stored path is not a guaranteed maximum loss.</p></div>
    `,'compare');
  }

  function auHistory(stats){
    const h=stats?.historical||{},e=stats?.execution||{},sf=stats?.safeFloor||{};
    return section('AUSTRALIA V11 · HISTORICAL PERFORMANCE','Frozen V11 research history. Historical replay is not guaranteed future cash.',`
      <div class="metric-grid">${metric('Completed FYs',n0(h.completedFys))}${metric('Historical bets',n0(h.bets),`${n1(h.betsPerYear)} / year`,'good')}${metric('Total turnover',money(h.turnoverAud))}${metric('Total historical profit',money(h.totalProfitAud),'Model-equivalent research P/L','good')}${metric('Historical ROI',pct(h.roiPct),'Profit / turnover','good')}${metric('Average completed FY',money(h.avgCompletedFyAud),'Historical mean','good')}${metric('Recorded max DD',money(h.recordedMaxDrawdownAud),'Observed path','warn')}${metric('Reorder-stress DD',money(h.reorderStressMaxDrawdownAud),'Stress test','warn')}</div>
      <div class="subcards"><div class="subcard"><h3>Execution sensitivity</h3><div class="rows"><div><span>Start-Aug historical avg</span><strong>${money(h.startAug10AvgAud)}</strong></div><div><span>5% worse winning prices</span><strong>${money(e.fivePctWorseStartAvgAud)}</strong></div><div><span>Annual execution damage</span><strong class="bad">−${money(Math.abs(Number(e.executionSensitivityAud||0)))}</strong></div></div></div><div class="subcard"><h3>A$100k safe-floor replay</h3><div class="rows"><div><span>Target hits</span><strong>${n0(sf.targetHits)} / ${n0(sf.targetYears)}</strong></div><div><span>Positive years</span><strong>${n0(sf.positiveYears)} / ${n0(sf.targetYears)}</strong></div><div><span>Mean</span><strong>${money(sf.meanAud)}</strong></div><div><span>Median</span><strong>${money(sf.medianAud)}</strong></div></div></div></div>
    `,'au-history');
  }

  function auCurrent(current){
    const s=current?.season||{},lw=current?.lastWeek||{},watch=Array.isArray(current?.watchlist)?current.watchlist:[];
    return section('AUSTRALIA V11 · CURRENT FORWARD RECORD','Confirmed cash remains separate from model/history.',`
      <div class="metric-grid">${metric('Current FY',s.fy||'—')}${metric('Model P/L',money(s.modelProfitAud),'Not complete actual cash',Number(s.modelProfitAud)>=0?'good':'bad')}${metric('Model turnover',money(s.modelTurnoverAud))}${metric('Model bets',n0(s.modelBets),`${n0(s.modelWins)} W / ${n0(s.modelLosses)} L`)}${metric('Model ROI',pct(s.modelRoiPct),'',Number(s.modelRoiPct)>=0?'good':'bad')}${metric('Actual cash',s.actualCashProfitAud==null?'INCOMPLETE':money(s.actualCashProfitAud),s.actualCashStatus||'',s.actualCashProfitAud==null?'warn':'')}${metric('Last week system bets',n0(lw.confirmedSystemBets),lw.date||'')}${metric('Last week cash P/L',money(lw.systemCashPlAud))}</div>
      <h3 class="mini-title">CURRENT V11 CORE POTENTIALS — NOT AUTOMATIC BETS</h3><div class="candidate-grid">${watch.length?watch.map(w=>`<article class="candidate"><div><span>${esc(w.region||'')}</span><strong>${esc(w.race||'')} · STATE ${esc(w.state)}</strong></div><div class="candidate-metrics"><b>${n0(w.histN)} samples</b><b>${pct(w.histWinRatePct)} WR</b><b class="good-text">${pct(w.histRoiPct)} ROI</b><b>${money(w.coreBaseReferenceAud)} ref</b></div><p>${esc(w.why||'')}</p></article>`).join(''):'<div class="empty">No current V11 CORE potentials.</div>'}</div>
    `,'au-current');
  }

  function auStates(current){
    const states=Array.isArray(current?.stateTracklist)?current.stateTracklist:[];
    return section('AUSTRALIA · ALL 21 CURRENT STATES','Favourite result state tracking; only frozen CORE matches become candidates.',`<div class="table-wrap"><table><thead><tr><th>Race</th><th>Region</th><th>State</th><th>Core?</th><th>N</th><th>ROI</th></tr></thead><tbody>${states.map(x=>`<tr class="${x.corePotential?'core-row':''}"><td><b>${esc(x.race)}</b></td><td>${esc(x.region)}</td><td>${esc(x.state)}</td><td>${x.corePotential?'<span class="pill good-pill">V11 CORE</span>':'<span class="pill">TRACK ONLY</span>'}</td><td>${x.histN!=null?n0(x.histN):'—'}</td><td>${x.histRoiPct!=null?pct(x.histRoiPct):'—'}</td></tr>`).join('')}</tbody></table></div>`,'au-states');
  }

  function hkStats(hk){
    const f=hk?.frequency||{},h=hk?.historical||{},r=hk?.risk||{},m=hk?.model||{},rules=hk?.selectionRules||{},seq=hk?.sequenceStress||{},dev=hk?.developmentCheck||{},later=hk?.laterCheck||{};
    return section('HONG KONG · HK OPTIMAL V3','One selection maximum per race. Maximum 100 bets/calendar year. Active profile maximises historical profit while staying just below AU V11 recorded historical DD.',`
      <div class="evidence-banner proxy"><strong>${esc(hk?.evidenceStatus||'SHADOW')}</strong><span>${esc(hk?.decision?.reason||'')}</span></div>
      <div class="metric-grid">
        ${metric('Completed bets',n0(f.completedBets),`${n0(f.completedYears)} completed years`)}${metric('Average bets / year',n1(f.betsPerYear),`Busiest year ${n0(f.maxBetsAnyCompletedYear)} · cap ${n0(f.calendarYearBetCap)}`,'good')}${metric('Annual historical P/L',money(h.annualHistoricalProfitAud),'Optimized history, not forecast','good')}${metric('Historical ROI',pctF(h.historicalRoi),'No rebate + 3% price stress','good')}
        ${metric('Stored historical DD',money(h.raceLevelMaxDrawdownAud),`AU recorded DD ${money(r.australiaRecordedMaxDrawdownAud)}`,'good')}${metric('P95 sequence stress',money(seq.p95MaxDrawdownAud),'Not a probability forecast','warn')}${metric('Worst completed year',money(h.worstCompletedYearAud),String(h.worstCompletedYear||''))}${metric('2026 partial',money(h.partial2026PlAud),`${n0(f.partial2026Bets)} bets through ${f.partial2026SourceCutoff||'source cutoff'}`,Number(h.partial2026PlAud)>=0?'good':'bad')}
        ${metric('Calibrated model EV / yr',money(m.calibratedModelEvAudPerYear),'More conservative anchor','warn')}${metric('LOW CORE stake',money(r.lowCoreStakeAud))}${metric('LONG CORE stake',money(r.longCoreStakeAud))}${metric('MAIN / EXTRA max',`${money(r.mainSatelliteStakeAud)} / ${money(r.extraSatelliteStakeAud)}`)}
      </div>
      <div class="subcards"><div class="subcard"><h3>Rule</h3><div class="rows"><div><span>LOW CORE</span><strong>R2 · $${Number(rules?.coreLow?.minOddsInclusive??4).toFixed(2)}–&lt;$${Number(rules?.coreLow?.maxOddsExclusive??7).toFixed(2)}</strong></div><div><span>LONG CORE</span><strong>R2 · $${Number(rules?.coreLong?.minOddsInclusive??18).toFixed(2)}–&lt;$${Number(rules?.coreLong?.maxOddsExclusive??30).toFixed(2)}</strong></div><div><span>MAIN SAT</span><strong>$${Number(rules?.mainSatellite?.minOddsInclusive??3).toFixed(2)}–&lt;$${Number(rules?.mainSatellite?.maxOddsExclusive??7).toFixed(2)} · rank ≤${n0(rules?.mainSatellite?.maxMarketRank)}</strong></div><div><span>EXTRA EV SAT</span><strong>raw EV ≥${pctF(rules?.extraSatellite?.minimumOriginalRawModelEv)}</strong></div><div><span>Within a race</span><strong>Highest verified calibrated model EV only</strong></div><div><span>Market</span><strong>WIN · BACK only</strong></div></div></div>
      <div class="subcard"><h3>Stability split</h3><div class="rows"><div><span>2015–2021 annual hist P/L</span><strong>${money(dev.annualHistoricalProfitAud)}</strong></div><div><span>2015–2021 ROI</span><strong>${pctF(dev.historicalRoi)}</strong></div><div><span>2022–2025 annual hist P/L</span><strong>${money(later.annualHistoricalProfitAud)}</strong></div><div><span>2022–2025 ROI</span><strong>${pctF(later.historicalRoi)}</strong></div><div><span>2022–2025 max DD</span><strong>${money(later.maxDrawdownAud)}</strong></div><div><span>Losing completed years</span><strong>${n0(h.losingCompletedYears)}</strong></div></div></div></div>
      <div class="truth-box"><strong>Risk truth</strong><p>The A$78,914 drawdown is deliberately just below the AU recorded A$79,850 research ceiling. It is not a guaranteed future maximum. The optimizer used historical outcomes to choose this profile, so the next meaningful test is frozen forward performance after the source cutoff — not more retrospective retuning.</p></div>
    `,'hk-research');
  }

  function hkFrontier(hk){
    const f=Array.isArray(hk?.optimizationFrontier)?hk.optimizationFrontier:[];
    return section('HONG KONG · PROFIT / DRAWDOWN FRONTIER','These are the cleaner trade-offs from the same one-bet-per-race rule family. The active profile maximises historical P/L under the AU recorded-DD ceiling.',`<div class="table-wrap"><table><thead><tr><th>Profile</th><th>Hist avg / yr</th><th>Stored max DD</th><th>LOW</th><th>LONG</th><th>MAIN</th><th>EXTRA</th><th>2026 partial</th><th>Status</th></tr></thead><tbody>${f.map(x=>`<tr class="${x.status==='ACTIVE'?'core-row':''}"><td><b>${esc(x.profile)}</b></td><td class="good-text">${money(x.annualHistoricalProfitAud)}</td><td>${money(x.storedHistoricalMaxDrawdownAud)}</td><td>${money(x.stakesAud?.lowCore)}</td><td>${money(x.stakesAud?.longCore)}</td><td>${money(x.stakesAud?.mainSatellite)}</td><td>${money(x.stakesAud?.extraSatellite)}</td><td class="${Number(x.partial2026PlAud)>=0?'good-text':'bad'}">${money(x.partial2026PlAud)}</td><td>${x.status==='ACTIVE'?'<span class="pill good-pill">ACTIVE</span>':esc(x.status)}</td></tr>`).join('')}</tbody></table></div>`,'hk-frontier');
  }

  function hkYears(hk){
    const ys=Array.isArray(hk?.yearByYear)?hk.yearByYear:[];
    return section('HONG KONG OPTIMAL V3 · YEAR BY YEAR','At most one bet per race. The hard operational ceiling is 100 confirmed Hong Kong bets per calendar year; the busiest completed historical year had 61.',`<div class="table-wrap"><table><thead><tr><th>Year</th><th>Bets</th><th>Wins</th><th>Win rate</th><th>Turnover</th><th>P/L</th><th>ROI</th><th>Status</th></tr></thead><tbody>${ys.map(y=>`<tr><td><b>${esc(y.year)}</b></td><td>${n0(y.bets)}</td><td>${n0(y.wins)}</td><td>${y.bets?pctF(Number(y.wins)/Number(y.bets)):'—'}</td><td>${money(y.turnoverAud)}</td><td class="${Number(y.plAud)>=0?'good-text':'bad'}">${money(y.plAud)}</td><td>${pctF(y.roi)}</td><td>${esc(y.status||'COMPLETED')}</td></tr>`).join('')}</tbody></table></div>`,'hk-years');
  }

  function hkRaces(live){
    const races=Array.isArray(live?.races)?live.races:[],m=live?.meeting||{};
    return section('HONG KONG · SHA TIN 6 SEP','A listed race is not a bet. OPTIMAL V3 stays fail-closed until model classification, within-race ranking, live price, annual bet count and capacity are verified.',`<div class="race-grid">${races.map(r=>`<article class="race-card"><div><span>HK R${esc(r.race)} · ${esc(r.timeHkt||'')}</span><strong>${esc(r.name||'')}</strong></div><p>${esc(r.class||'')} · ${esc(r.distanceM)}m</p><b class="pill wait-pill">${esc(r.strategyStatus||'WAIT')}</b></article>`).join('')}</div><p class="source-note">${esc(m.venue||'Sha Tin')} · ${esc(m.track||'Turf')} ${esc(m.course||'A')} Course · ${esc(m.status||'')}</p>`,'hk-races');
  }

  function caveats(stats,hk){const e=stats?.evidence||{},cs=Array.isArray(hk?.caveats)?hk.caveats:[];return section('AUDIT NOTES · READ BEFORE USING THE NUMBERS','',`<div class="caveat-list"><div><b>AU V11</b><p>${esc(e.planningNotPromise||'Historical results are not guaranteed future returns.')}</p></div>${cs.map(x=>`<div><b>HK OPTIMAL V3</b><p>${esc(x)}</p></div>`).join('')}</div>`,'caveats');}

  function render(stats,current,hk,live){
    const root=$('statsRoot'),au=stats?.historical||{},f=hk?.frequency||{},h=hk?.historical||{};
    root.innerHTML=`<section class="hero"><div><span>FULL SYSTEM AUDIT</span><h1>RACING STATS</h1><p>AU V11 + HK OPTIMAL V3 · frequency, historical return, drawdown, frontier, year-by-year results and evidence quality.</p></div><div class="hero-kpis"><div><span>HK HIST AVG/YR</span><strong>${money(h.annualHistoricalProfitAud)}</strong></div><div><span>HK STORED DD</span><strong>${money(h.raceLevelMaxDrawdownAud)}</strong></div><div><span>HK BETS/YR</span><strong>${n1(f.betsPerYear)}</strong></div></div></section>${compare(stats,hk)}${hkStats(hk)}${hkFrontier(hk)}${hkYears(hk)}${auHistory(stats)}${auCurrent(current)}${auStates(current)}${hkRaces(live)}${caveats(stats,hk)}`;
    $('updatedLine').textContent=`Loaded AU stats ${stats?.updatedAt||'—'} · AU live ${current?.updatedAt||'—'} · HK Optimal ${hk?.updatedAt||'—'}`;
  }

  async function start(){try{const [stats,current,hk,live]=await Promise.all([getJson('./stats.json'),getJson('./current.json'),getJson('./hong-kong-stats.json?v=optimal-v3'),getJson('./hong-kong.json?v=optimal-v3')]);render(stats,current,hk,live);}catch(e){console.error(e);$('statsRoot').innerHTML=`<div class="load-error"><strong>STATS COULD NOT BE VERIFIED</strong><p>${esc(e instanceof Error?e.message:'Unknown error')}</p><p>Do not infer missing numbers. Return to the live page and retry later.</p></div>`;}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
