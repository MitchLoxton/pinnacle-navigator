(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)) : '—';
  const n0 = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{maximumFractionDigits:0}).format(Number(v)) : '—';
  const n1 = v => Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—';
  const pct = v => Number.isFinite(Number(v)) ? `${Number(v).toFixed(1)}%` : '—';
  const pctF = v => Number.isFinite(Number(v)) ? `${(Number(v) * 100).toFixed(1)}%` : '—';

  async function getJson(path) {
    const response = await fetch(path, { cache:'no-cache' });
    if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
    return response.json();
  }

  function metric(label, value, note='', tone='') {
    return `<div class="metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function section(title, subtitle, body, id='') {
    return `<section class="stats-section"${id ? ` id="${esc(id)}"` : ''}><div class="section-head"><div><span>MITCHELL RACING</span><h2>${esc(title)}</h2></div>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>${body}</section>`;
  }

  function compare(stats, hk) {
    const au = stats?.historical || {};
    const h = hk?.historical || {};
    const f = hk?.frequency || {};
    const r = hk?.risk || {};
    const seq = hk?.sequenceStress || {};
    const v3 = hk?.baselineV3 || {};
    return section('AU V11 vs HK OPTIMAL V4', 'V4 keeps the V3 selection model but adds a strict race-day risk guard.', `
      <div class="table-wrap compare-table"><table><thead><tr><th>Metric</th><th>Australia V11</th><th>Hong Kong OPTIMAL V4</th></tr></thead><tbody>
        <tr><td>Bets / year</td><td><b>${n1(au.betsPerYear)}</b></td><td><b>${n1(f.betsPerYear)}</b> · busiest year ${n0(f.maxBetsAnyCompletedYear)} · cap ${n0(f.calendarYearBetCap)}</td></tr>
        <tr><td>Historical sample</td><td>${n0(au.completedFys)} FY · ${n0(au.bets)} bets</td><td>${n0(f.completedYears)} years · ${n0(f.completedBets)} bets</td></tr>
        <tr><td>Historical annual P/L</td><td>${money(au.avgCompletedFyAud)}</td><td class="good-text">${money(h.annualHistoricalProfitAud)}</td></tr>
        <tr><td>Historical ROI</td><td>${pct(au.roiPct)}</td><td class="good-text">${pctF(h.historicalRoi)}</td></tr>
        <tr><td>Stored historical DD</td><td>${money(au.recordedMaxDrawdownAud)} recorded</td><td class="good-text">${money(h.raceLevelMaxDrawdownAud)}</td></tr>
        <tr><td>Sequence stress</td><td>${money(au.reorderStressMaxDrawdownAud)} AU reorder stress</td><td>${money(seq.p95MaxDrawdownAud)} HK P95 race-day-block stress</td></tr>
        <tr><td>Max per race day</td><td>AU system-specific</td><td><b>${n0(f.maxBetsPerRaceDay)} bets</b></td></tr>
        <tr><td>Daily realised loss stop</td><td>—</td><td><b>−${money(r.dailyRealizedLossStopAud)}</b></td></tr>
        <tr><td>Max stake</td><td>A$10,000</td><td>${money(r.hardMaxStakeAud)}</td></tr>
        <tr><td>Status</td><td><span class="pill good-pill">V11 PRODUCTION FRAMEWORK</span></td><td><span class="pill warn-pill">V4 SHADOW CANDIDATE</span></td></tr>
      </tbody></table></div>
      <div class="truth-box"><strong>V3 → V4 improvement on stored history</strong><p>Annual historical P/L ${money(v3.annualHistoricalProfitAud)} → ${money(h.annualHistoricalProfitAud)}; stored drawdown ${money(v3.storedHistoricalMaxDrawdownAud)} → ${money(h.raceLevelMaxDrawdownAud)}; ROI ${pctF(v3.historicalRoi)} → ${pctF(h.historicalRoi)}; busiest-year bets ${n0(v3.maxBetsAnyCompletedYear)} → ${n0(f.maxBetsAnyCompletedYear)}.</p></div>
    `, 'compare');
  }

  function auHistory(stats) {
    const h = stats?.historical || {};
    const e = stats?.execution || {};
    const sf = stats?.safeFloor || {};
    return section('AUSTRALIA V11 · HISTORICAL PERFORMANCE', 'Frozen V11 research history. Historical replay is not guaranteed future cash.', `
      <div class="metric-grid">
        ${metric('Completed FYs', n0(h.completedFys))}
        ${metric('Historical bets', n0(h.bets), `${n1(h.betsPerYear)} / year`, 'good')}
        ${metric('Total turnover', money(h.turnoverAud))}
        ${metric('Total historical profit', money(h.totalProfitAud), 'Model-equivalent research P/L', 'good')}
        ${metric('Historical ROI', pct(h.roiPct), 'Profit / turnover', 'good')}
        ${metric('Average completed FY', money(h.avgCompletedFyAud), 'Historical mean', 'good')}
        ${metric('Recorded max DD', money(h.recordedMaxDrawdownAud), 'Observed path', 'warn')}
        ${metric('Reorder-stress DD', money(h.reorderStressMaxDrawdownAud), 'Stress test', 'warn')}
      </div>
      <div class="subcards">
        <div class="subcard"><h3>Execution sensitivity</h3><div class="rows"><div><span>Start-Aug historical avg</span><strong>${money(h.startAug10AvgAud)}</strong></div><div><span>5% worse winning prices</span><strong>${money(e.fivePctWorseStartAvgAud)}</strong></div><div><span>Annual execution damage</span><strong class="bad">−${money(Math.abs(Number(e.executionSensitivityAud || 0)))}</strong></div></div></div>
        <div class="subcard"><h3>A$100k safe-floor replay</h3><div class="rows"><div><span>Target hits</span><strong>${n0(sf.targetHits)} / ${n0(sf.targetYears)}</strong></div><div><span>Positive years</span><strong>${n0(sf.positiveYears)} / ${n0(sf.targetYears)}</strong></div><div><span>Mean</span><strong>${money(sf.meanAud)}</strong></div><div><span>Median</span><strong>${money(sf.medianAud)}</strong></div></div></div>
      </div>
    `, 'au-history');
  }

  function auCurrent(current) {
    const s = current?.season || {};
    const lw = current?.lastWeek || {};
    const watch = Array.isArray(current?.watchlist) ? current.watchlist : [];
    return section('AUSTRALIA V11 · CURRENT FORWARD RECORD', 'Confirmed cash remains separate from model/history.', `
      <div class="metric-grid">
        ${metric('Current FY', s.fy || '—')}
        ${metric('Model P/L', money(s.modelProfitAud), 'Not complete actual cash', Number(s.modelProfitAud) >= 0 ? 'good' : 'bad')}
        ${metric('Model turnover', money(s.modelTurnoverAud))}
        ${metric('Model bets', n0(s.modelBets), `${n0(s.modelWins)} W / ${n0(s.modelLosses)} L`)}
        ${metric('Model ROI', pct(s.modelRoiPct), '', Number(s.modelRoiPct) >= 0 ? 'good' : 'bad')}
        ${metric('Actual cash', s.actualCashProfitAud == null ? 'INCOMPLETE' : money(s.actualCashProfitAud), s.actualCashStatus || '', s.actualCashProfitAud == null ? 'warn' : '')}
        ${metric('Last week system bets', n0(lw.confirmedSystemBets), lw.date || '')}
        ${metric('Last week cash P/L', money(lw.systemCashPlAud))}
      </div>
      <h3 class="mini-title">CURRENT V11 CORE POTENTIALS — NOT AUTOMATIC BETS</h3>
      <div class="candidate-grid">${watch.length ? watch.map(w => `<article class="candidate"><div><span>${esc(w.region || '')}</span><strong>${esc(w.race || '')} · STATE ${esc(w.state)}</strong></div><div class="candidate-metrics"><b>${n0(w.histN)} samples</b><b>${pct(w.histWinRatePct)} WR</b><b class="good-text">${pct(w.histRoiPct)} ROI</b><b>${money(w.coreBaseReferenceAud)} ref</b></div><p>${esc(w.why || '')}</p></article>`).join('') : '<div class="empty">No current V11 CORE potentials.</div>'}</div>
    `, 'au-current');
  }

  function auStates(current) {
    const states = Array.isArray(current?.stateTracklist) ? current.stateTracklist : [];
    return section('AUSTRALIA · ALL 21 CURRENT STATES', 'Favourite result state tracking; only frozen CORE matches become candidates.', `
      <div class="table-wrap"><table><thead><tr><th>Race</th><th>Region</th><th>State</th><th>Core?</th><th>N</th><th>ROI</th></tr></thead><tbody>
        ${states.map(x => `<tr class="${x.corePotential ? 'core-row' : ''}"><td><b>${esc(x.race)}</b></td><td>${esc(x.region)}</td><td>${esc(x.state)}</td><td>${x.corePotential ? '<span class="pill good-pill">V11 CORE</span>' : '<span class="pill">TRACK ONLY</span>'}</td><td>${x.histN != null ? n0(x.histN) : '—'}</td><td>${x.histRoiPct != null ? pct(x.histRoiPct) : '—'}</td></tr>`).join('')}
      </tbody></table></div>
    `, 'au-states');
  }

  function hkStats(hk) {
    const f = hk?.frequency || {};
    const h = hk?.historical || {};
    const r = hk?.risk || {};
    const m = hk?.model || {};
    const rules = hk?.selectionRules || {};
    const seq = hk?.sequenceStress || {};
    const dev = hk?.developmentCheck || {};
    const later = hk?.laterCheck || {};
    const guard = hk?.dailyRiskGuard || {};
    const v3 = hk?.baselineV3 || {};

    return section('HONG KONG · HK OPTIMAL V4', 'Same V3 horse-selection rules and stakes; new risk overlay limits race-day exposure.', `
      <div class="evidence-banner proxy"><strong>${esc(hk?.evidenceStatus || 'SHADOW')}</strong><span>${esc(hk?.decision?.reason || '')}</span></div>
      <div class="metric-grid">
        ${metric('Completed bets', n0(f.completedBets), `${n0(f.completedYears)} completed years`)}
        ${metric('Average bets / year', n1(f.betsPerYear), `Busiest ${n0(f.maxBetsAnyCompletedYear)} · annual cap ${n0(f.calendarYearBetCap)}`, 'good')}
        ${metric('Annual historical P/L', money(h.annualHistoricalProfitAud), 'Optimized history, not forecast', 'good')}
        ${metric('Historical ROI', pctF(h.historicalRoi), 'No rebate + 3% price stress', 'good')}
        ${metric('Stored historical DD', money(h.raceLevelMaxDrawdownAud), `AU recorded DD ${money(r.australiaRecordedMaxDrawdownAud)}`, 'good')}
        ${metric('P95 day-block stress', money(seq.p95MaxDrawdownAud), 'Race-day-block permutation stress', 'warn')}
        ${metric('Worst completed year', money(h.worstCompletedYearAud), String(h.worstCompletedYear || ''))}
        ${metric('2026 partial', money(h.partial2026PlAud), `${n0(f.partial2026Bets)} bets through ${f.partial2026SourceCutoff || 'source cutoff'}`, Number(h.partial2026PlAud) >= 0 ? 'good' : 'bad')}
        ${metric('Calibrated model EV / yr', money(m.calibratedModelEvAudPerYear), 'More conservative anchor', 'warn')}
        ${metric('Max bets / race day', n0(guard.maxConfirmedBetsPerRaceDay), 'Hard stop after second confirmed HK bet')}
        ${metric('Daily realised loss stop', `−${money(guard.dailyRealizedLossStopAud)}`, 'No more HK bets that day once triggered')}
        ${metric('Max stake', money(r.hardMaxStakeAud), 'EXTRA EV SAT')}
      </div>

      <div class="truth-box"><strong>Important overfit check</strong><p>${esc(guard.historicalRemovedBetObservation || '')} This is why V4 is still SHADOW and should now be frozen for real forward validation rather than improved again from the same historical outcomes.</p></div>

      <div class="subcards">
        <div class="subcard"><h3>V4 daily guard</h3><div class="rows"><div><span>Maximum HK bets / race day</span><strong>${n0(guard.maxConfirmedBetsPerRaceDay)}</strong></div><div><span>Daily realised loss stop</span><strong>−${money(guard.dailyRealizedLossStopAud)}</strong></div><div><span>Completed-history bets removed vs V3</span><strong>${n0(guard.completedHistoryBetsRemovedVsV3)}</strong></div><div><span>2026 partial bets removed vs V3</span><strong>${n0(guard.partial2026BetsRemovedVsV3)}</strong></div><div><span>V3 annual hist P/L</span><strong>${money(v3.annualHistoricalProfitAud)}</strong></div><div><span>V4 annual hist P/L</span><strong class="good-text">${money(h.annualHistoricalProfitAud)}</strong></div></div></div>
        <div class="subcard"><h3>Frozen horse-selection rule</h3><div class="rows"><div><span>LOW CORE</span><strong>R2 · $${Number(rules?.coreLow?.minOddsInclusive ?? 4).toFixed(2)}–&lt;$${Number(rules?.coreLow?.maxOddsExclusive ?? 7).toFixed(2)} · ${money(rules?.coreLow?.stakeAud)}</strong></div><div><span>LONG CORE</span><strong>R2 · $${Number(rules?.coreLong?.minOddsInclusive ?? 18).toFixed(2)}–&lt;$${Number(rules?.coreLong?.maxOddsExclusive ?? 30).toFixed(2)} · ${money(rules?.coreLong?.stakeAud)}</strong></div><div><span>MAIN SAT</span><strong>$${Number(rules?.mainSatellite?.minOddsInclusive ?? 3).toFixed(2)}–&lt;$${Number(rules?.mainSatellite?.maxOddsExclusive ?? 7).toFixed(2)} · rank ≤${n0(rules?.mainSatellite?.maxMarketRank)} · ${money(rules?.mainSatellite?.stakeAud)}</strong></div><div><span>EXTRA EV SAT</span><strong>raw EV ≥${pctF(rules?.extraSatellite?.minimumOriginalRawModelEv)} · ${money(rules?.extraSatellite?.stakeAud)}</strong></div><div><span>Within a race</span><strong>Highest verified calibrated model EV only</strong></div><div><span>Market</span><strong>WIN · BACK only</strong></div></div></div>
      </div>

      <div class="subcards">
        <div class="subcard"><h3>2015–2021 development segment</h3><div class="rows"><div><span>Bets</span><strong>${n0(dev.bets)}</strong></div><div><span>Annual historical P/L</span><strong>${money(dev.annualHistoricalProfitAud)}</strong></div><div><span>ROI</span><strong>${pctF(dev.historicalRoi)}</strong></div><div><span>Max DD</span><strong>${money(dev.maxDrawdownAud)}</strong></div></div></div>
        <div class="subcard"><h3>2022–2025 later segment</h3><div class="rows"><div><span>Bets</span><strong>${n0(later.bets)}</strong></div><div><span>Annual historical P/L</span><strong>${money(later.annualHistoricalProfitAud)}</strong></div><div><span>ROI</span><strong>${pctF(later.historicalRoi)}</strong></div><div><span>Max DD</span><strong>${money(later.maxDrawdownAud)}</strong></div></div></div>
      </div>
    `, 'hk-research');
  }

  function hkFrontier(hk) {
    const profiles = Array.isArray(hk?.optimizationFrontier) ? hk.optimizationFrontier : [];
    return section('HONG KONG · PROFIT / DRAWDOWN FRONTIER', 'Historical research trade-offs. V4 improves the stored V3 max-profit profile, but that improvement itself needs fresh validation.', `
      <div class="table-wrap"><table><thead><tr><th>Profile</th><th>Hist avg / yr</th><th>Stored max DD</th><th>Status</th></tr></thead><tbody>
        ${profiles.map(x => `<tr class="${String(x.status || '').includes('ACTIVE') ? 'core-row' : ''}"><td><b>${esc(x.profile)}</b></td><td class="good-text">${money(x.annualHistoricalProfitAud)}</td><td>${money(x.storedHistoricalMaxDrawdownAud)}</td><td>${String(x.status || '').includes('ACTIVE') ? '<span class="pill good-pill">ACTIVE SHADOW</span>' : esc(x.status)}</td></tr>`).join('')}
      </tbody></table></div>
    `, 'hk-frontier');
  }

  function hkYears(hk) {
    const years = Array.isArray(hk?.yearByYear) ? hk.yearByYear : [];
    return section('HONG KONG OPTIMAL V4 · YEAR BY YEAR', 'At most one bet/race, two HK bets/race day and 100/year. 2026 is partial.', `
      <div class="table-wrap"><table><thead><tr><th>Year</th><th>Bets</th><th>Wins</th><th>Turnover</th><th>P/L</th><th>ROI</th><th>Status</th></tr></thead><tbody>
        ${years.map(y => `<tr><td><b>${esc(y.year)}</b></td><td>${n0(y.bets)}</td><td>${n0(y.wins)}</td><td>${money(y.turnoverAud)}</td><td class="${Number(y.plAud) >= 0 ? 'good-text' : 'bad'}">${money(y.plAud)}</td><td>${pctF(y.roi)}</td><td>${esc(y.status || 'COMPLETED')}</td></tr>`).join('')}
      </tbody></table></div>
    `, 'hk-years');
  }

  function hkRaces(live) {
    const races = Array.isArray(live?.races) ? live.races : [];
    const meeting = live?.meeting || {};
    return section('HONG KONG · SHA TIN 6 SEP', 'V4 remains fail-closed until model, price, capacity, yearly count and today’s risk state are verified.', `
      <div class="race-grid">${races.map(r => `<article class="race-card"><div><span>HK R${esc(r.race)} · ${esc(r.timeHkt || '')}</span><strong>${esc(r.name || '')}</strong></div><p>${esc(r.class || '')} · ${esc(r.distanceM)}m</p><b class="pill wait-pill">${esc(r.strategyStatus || 'WAIT')}</b></article>`).join('')}</div>
      <p class="source-note">${esc(meeting.venue || 'Sha Tin')} · ${esc(meeting.track || 'Turf')} ${esc(meeting.course || 'A')} Course · ${esc(meeting.status || '')}</p>
    `, 'hk-races');
  }

  function caveats(stats, hk) {
    const evidence = stats?.evidence || {};
    const notes = Array.isArray(hk?.caveats) ? hk.caveats : [];
    return section('AUDIT NOTES', '', `
      <div class="caveat-list"><div><b>AU V11</b><p>${esc(evidence.planningNotPromise || 'Historical results are not guaranteed future returns.')}</p></div>${notes.map(x => `<div><b>HK OPTIMAL V4</b><p>${esc(x)}</p></div>`).join('')}</div>
    `, 'caveats');
  }

  function render(stats, current, hk, live) {
    const root = $('statsRoot');
    const au = stats?.historical || {};
    const f = hk?.frequency || {};
    const h = hk?.historical || {};
    root.innerHTML = `
      <section class="hero"><div><span>FULL SYSTEM AUDIT</span><h1>RACING STATS</h1><p>AU V11 + HK OPTIMAL V4 · historical performance, current record, drawdowns, race-day risk controls and evidence quality.</p></div><div class="hero-kpis"><div><span>AU BETS/YR</span><strong>${n1(au.betsPerYear)}</strong></div><div><span>HK BETS/YR</span><strong>${n1(f.betsPerYear)}</strong></div><div><span>HK HIST AVG/YR</span><strong>${money(h.annualHistoricalProfitAud)}</strong></div></div></section>
      ${compare(stats, hk)}
      ${auHistory(stats)}
      ${auCurrent(current)}
      ${auStates(current)}
      ${hkStats(hk)}
      ${hkFrontier(hk)}
      ${hkYears(hk)}
      ${hkRaces(live)}
      ${caveats(stats, hk)}
    `;
    $('updatedLine').textContent = `Loaded AU stats ${stats?.updatedAt || '—'} · AU live ${current?.updatedAt || '—'} · HK V4 stats ${hk?.updatedAt || '—'}`;
  }

  async function start() {
    try {
      const [stats, current, hk, live] = await Promise.all([
        getJson('./stats.json'),
        getJson('./current.json'),
        getJson('./hong-kong-stats.json?v=optimal-v4'),
        getJson('./hong-kong.json?v=optimal-v4')
      ]);
      render(stats, current, hk, live);
    } catch (error) {
      console.error(error);
      $('statsRoot').innerHTML = `<div class="load-error"><strong>STATS COULD NOT BE VERIFIED</strong><p>${esc(error instanceof Error ? error.message : 'Unknown error')}</p><p>Do not infer missing numbers. Return to the live page and retry later.</p></div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
