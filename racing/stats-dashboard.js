(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const money0 = new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 });
  const num0 = new Intl.NumberFormat('en-AU', { maximumFractionDigits:0 });
  const num1 = new Intl.NumberFormat('en-AU', { minimumFractionDigits:1, maximumFractionDigits:1 });
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = v => Number.isFinite(Number(v)) ? money0.format(Number(v)) : '—';
  const n0 = v => Number.isFinite(Number(v)) ? num0.format(Number(v)) : '—';
  const n1 = v => Number.isFinite(Number(v)) ? num1.format(Number(v)) : '—';
  const pct = v => Number.isFinite(Number(v)) ? `${Number(v).toFixed(1)}%` : '—';
  const pctFrac = v => Number.isFinite(Number(v)) ? `${(Number(v) * 100).toFixed(1)}%` : '—';

  async function getJson(path) {
    const r = await fetch(path, { cache:'no-cache' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  function metric(label, value, note='', tone='') {
    return `<div class="metric ${tone}"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function section(title, subtitle, body, id='') {
    return `<section class="stats-section"${id ? ` id="${esc(id)}"` : ''}><div class="section-head"><div><span>MITCHELL RACING</span><h2>${esc(title)}</h2></div>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>${body}</section>`;
  }

  function auHistorical(stats) {
    const h = stats?.historical || {};
    const e = stats?.execution || {};
    const sf = stats?.safeFloor || {};
    const ch = stats?.challenger || {};
    return section('AUSTRALIA V11 · HISTORICAL PERFORMANCE', 'Frozen V11 CORE research history. Historical model replay is not guaranteed future bookmaker cash.', `
      <div class="metric-grid">
        ${metric('Completed financial years', n0(h.completedFys), 'Historical sample')}
        ${metric('Historical bets', n0(h.bets), `${n1(h.betsPerYear)} bets/year`, 'good')}
        ${metric('Total turnover', money(h.turnoverAud))}
        ${metric('Total historical profit', money(h.totalProfitAud), 'Model-equivalent research P/L', 'good')}
        ${metric('Historical ROI', pct(h.roiPct), 'Profit / turnover', 'good')}
        ${metric('Average completed FY', money(h.avgCompletedFyAud), 'Historical mean', 'good')}
        ${metric('Recorded max drawdown', money(h.recordedMaxDrawdownAud), 'Observed historical path', 'warn')}
        ${metric('Reorder-stress max drawdown', money(h.reorderStressMaxDrawdownAud), 'Stress test', 'warn')}
      </div>
      <div class="subcards">
        <div class="subcard"><h3>Execution sensitivity</h3><div class="rows">
          <div><span>Start-around-10-Aug historical avg</span><strong>${money(h.startAug10AvgAud)}</strong></div>
          <div><span>Same replay with winning prices 5% worse</span><strong>${money(e.fivePctWorseStartAvgAud)}</strong></div>
          <div><span>Average annual damage from 5% worse prices</span><strong class="bad">−${money(Math.abs(Number(e.executionSensitivityAud || 0)))}</strong></div>
        </div><p>${esc(e.message || '')}</p></div>
        <div class="subcard"><h3>Fixed A$100k safe-floor stress replay</h3><div class="rows">
          <div><span>Target-hit years</span><strong>${n0(sf.targetHits)} / ${n0(sf.targetYears)}</strong></div>
          <div><span>Positive years</span><strong>${n0(sf.positiveYears)} / ${n0(sf.targetYears)}</strong></div>
          <div><span>Mean</span><strong>${money(sf.meanAud)}</strong></div>
          <div><span>Median</span><strong>${money(sf.medianAud)}</strong></div>
          <div><span>Annual SD</span><strong>${money(sf.annualSdAud)}</strong></div>
          <div><span>Next-12m planning mean</span><strong>${money(sf.next12mPlanningMeanAud)}</strong></div>
        </div><p>${esc(sf.note || '')}</p></div>
      </div>
      <details class="audit-details"><summary>Rejected 30% AU expansion · why it is NOT live</summary><div class="audit-body"><div class="metric-grid compact">
        ${metric('Approx bets/year', n1(ch.approxBetsPerYear))}
        ${metric('Hindsight ROI', pct(ch.hindsightRoiPct))}
        ${metric('Hindsight avg FY', money(ch.hindsightAvgFyAud))}
        ${metric('Status', ch.status || 'SHADOW ONLY', '', 'bad')}
      </div><p>${esc(ch.warning || '')}</p></div></details>
    `, 'au-history');
  }

  function auCurrent(current) {
    const s = current?.season || {};
    const lw = current?.lastWeek || {};
    const watches = Array.isArray(current?.watchlist) ? current.watchlist : [];
    return section('AUSTRALIA V11 · CURRENT LIVE / FORWARD RECORD', 'Kept separate from historical backtest figures. Actual cash only counts confirmed accepted executions.', `
      <div class="metric-grid">
        ${metric('Current FY', s.fy || '—')}
        ${metric('Model P/L shown', money(s.modelProfitAud), 'Not complete actual cash', Number(s.modelProfitAud) >= 0 ? 'good' : 'bad')}
        ${metric('Model turnover', money(s.modelTurnoverAud))}
        ${metric('Model bets', n0(s.modelBets), `${n0(s.modelWins)} wins / ${n0(s.modelLosses)} losses`)}
        ${metric('Model ROI', pct(s.modelRoiPct), 'Historical/model segment shown', Number(s.modelRoiPct) >= 0 ? 'good' : 'bad')}
        ${metric('Actual cash reconciliation', s.actualCashProfitAud == null ? 'INCOMPLETE' : money(s.actualCashProfitAud), s.actualCashStatus || '', s.actualCashProfitAud == null ? 'warn' : '')}
        ${metric('Last week system bets', n0(lw.confirmedSystemBets), lw.date || '')}
        ${metric('Last week confirmed cash P/L', money(lw.systemCashPlAud), `${n0(lw.favouriteWins)} favourite wins / ${n0(lw.favouriteLosses)} losses`)}
      </div>
      <h3 class="mini-title">CURRENT V11 CORE POTENTIALS — NOT AUTOMATIC BETS</h3>
      <div class="candidate-grid">${watches.length ? watches.map(w => `<article class="candidate"><div><span>${esc(w.region || '')}</span><strong>${esc(w.race || '')} · STATE ${esc(w.state)}</strong></div><div class="candidate-metrics"><b>${n0(w.histN)} historical samples</b><b>${pct(w.histWinRatePct)} win rate</b><b class="good-text">${pct(w.histRoiPct)} historical ROI</b><b>${money(w.coreBaseReferenceAud)} core reference</b></div><p>${esc(w.why || '')}</p></article>`).join('') : '<div class="empty">No V11 CORE potentials currently.</div>'}</div>
    `, 'au-current');
  }

  function auStates(current) {
    const states = Array.isArray(current?.stateTracklist) ? current.stateTracklist : [];
    return section('AUSTRALIA · ALL 21 CURRENT STATES', 'Every favourite result updates the state sequence. Only frozen V11 CORE state matches become live candidates.', `
      <div class="table-wrap"><table><thead><tr><th>Race</th><th>Region</th><th>State</th><th>Core?</th><th>Historical N</th><th>Historical ROI</th></tr></thead><tbody>
        ${states.map(x => `<tr class="${x.corePotential ? 'core-row' : ''}"><td><b>${esc(x.race)}</b></td><td>${esc(x.region)}</td><td>${esc(x.state)}</td><td>${x.corePotential ? '<span class="pill good-pill">V11 CORE</span>' : '<span class="pill">TRACK ONLY</span>'}</td><td>${x.histN != null ? n0(x.histN) : '—'}</td><td class="${Number(x.histRoiPct) > 0 ? 'good-text' : ''}">${x.histRoiPct != null ? pct(x.histRoiPct) : '—'}</td></tr>`).join('')}
      </tbody></table></div>
    `, 'au-states');
  }

  function hkResearch(hkStats, hkLive) {
    const f = hkStats?.frequency || {};
    const h = hkStats?.historical || {};
    const m = hkStats?.model || {};
    const r = hkStats?.risk || {};
    const rules = hkStats?.selectionRules || {};
    const decision = hkStats?.decision || {};
    const rejected = hkStats?.rejectedFrequencySearch || {};
    return section('HONG KONG · HK PARITY V2 LOW-FREQUENCY STATS', 'This replaces R15 as the active Hong Kong research rule because its cadence is almost identical to Australia V11.', `
      <div class="evidence-banner proxy"><strong>${esc(hkStats?.evidenceStatus || 'SHADOW')}</strong><span>${esc(decision.reason || '')}</span></div>
      <div class="metric-grid">
        ${metric('Completed historical bets', n0(f.completedBets), `${n0(f.completedYears)} completed years · ${f.completedPeriod || ''}`)}
        ${metric('HK bets / year', n1(f.betsPerYear), `Australia V11 = ${n1(f.australiaV11BetsPerYear)}/year`, 'good')}
        ${metric('Historical annual turnover', money(h.annualTurnoverAud), 'Matched to Australia-like turnover')}
        ${metric('Historical annual P/L', money(h.annualHistoricalProfitAud), 'Stressed history, NOT forward forecast', 'good')}
        ${metric('Historical ROI', pctFrac(h.historicalRoi), 'No rebate + 3% winner-price damage', 'good')}
        ${metric('Losing completed years', n0(h.losingCompletedYears), `${n0(h.positiveCompletedYears)} / ${n0(f.completedYears)} completed years positive`, Number(h.losingCompletedYears) === 0 ? 'good' : 'bad')}
        ${metric('Worst completed year', money(h.worstCompletedYearAud), `${h.worstCompletedYear || ''}`)}
        ${metric('Race-level max drawdown', money(h.raceLevelMaxDrawdownAud), 'Major blocker vs Australia', 'warn')}
        ${metric('Calibrated model EV / year', money(m.calibratedModelEvAudPerYear), `${pctFrac(m.calibratedModelRoi)} model ROI anchor`, 'warn')}
        ${metric('2026 partial P/L', money(h.partial2026PlAud), `${n0(f.partial2026Bets)} bets · ${n0(f.partial2026IndependentRaces)} races · incomplete year`, Number(h.partial2026PlAud) >= 0 ? 'good' : 'bad')}
        ${metric('LONG CORE stake', money(r.longCoreStakeAud), 'Frozen')}
        ${metric('Other sleeve stake', money(r.otherSleeveStakeAud), 'Frozen turnover-matching stake')}
      </div>

      <div class="truth-box"><strong>The number that matters</strong><p>Australia V11 is about ${n1(f.australiaV11BetsPerYear)} bets/year, not 50. HK PARITY V2 is ${n1(f.betsPerYear)} bets/year, a difference of only ${n1(Math.abs(Number(f.differenceBetsPerYear || 0)))} bet/year. Forcing Hong Kong up to a literal 50 created weaker recent evidence, so the cleaner ${n1(f.betsPerYear)}-bet rule is the active candidate.</p></div>

      <div class="subcards">
        <div class="subcard"><h3>Frozen V2 selection rule</h3><div class="rows">
          <div><span>LOW CORE</span><strong>R2 CORE · $${Number(rules?.coreLow?.minOddsInclusive ?? 5).toFixed(2)}–&lt;$${Number(rules?.coreLow?.maxOddsExclusive ?? 8).toFixed(2)}</strong></div>
          <div><span>LONG CORE</span><strong>R2 CORE · $${Number(rules?.coreLong?.minOddsInclusive ?? 20).toFixed(2)}–&lt;$${Number(rules?.coreLong?.maxOddsExclusive ?? 30).toFixed(2)}</strong></div>
          <div><span>MAIN SAT</span><strong>Satellite-only · $${Number(rules?.mainSatellite?.minOddsInclusive ?? 4).toFixed(2)}–&lt;$${Number(rules?.mainSatellite?.maxOddsExclusive ?? 7).toFixed(2)} · rank ≤${n0(rules?.mainSatellite?.maxMarketRank)}</strong></div>
          <div><span>EXTRA EV SAT</span><strong>Satellite-only · original raw model EV ≥${pctFrac(rules?.extraSatellite?.minimumOriginalRawModelEv)}</strong></div>
          <div><span>Market</span><strong>WIN · BACK only</strong></div>
          <div><span>Historical scoring</span><strong>No rebate · 3% adverse winner-price stress</strong></div>
        </div></div>
        <div class="subcard"><h3>Why it is still SHADOW</h3><div class="rows">
          <div><span>Production approved?</span><strong class="bad">NO</strong></div>
          <div><span>Risk parity vs AU</span><strong class="bad">${esc(r.riskParityStatus || 'FAIL / CAUTION')}</strong></div>
          <div><span>AU recorded max DD</span><strong>${money(r.australiaRecordedMaxDrawdownAud)}</strong></div>
          <div><span>AU reorder-stress DD</span><strong>${money(r.australiaReorderStressMaxDrawdownAud)}</strong></div>
          <div><span>HK completed-history DD</span><strong class="bad">${money(h.raceLevelMaxDrawdownAud)}</strong></div>
          <div><span>Live accepted-price record</span><strong class="bad">NOT VERIFIED</strong></div>
        </div><p>${esc(r.riskParityReason || '')}</p></div>
      </div>

      <details class="audit-details"><summary>Why I rejected the literal ~50-bet retune</summary><div class="audit-body"><p><b>${esc(rejected.decision || 'REJECTED')}</b></p><p>${esc(rejected.reason || '')}</p></div></details>
      <details class="audit-details"><summary>Archived R15 high-frequency research</summary><div class="audit-body"><div class="metric-grid compact">${metric('Old R15 proxy positions/year', n0(hkStats?.archivedR15?.approxPositionsPerYear), 'Research reference only', 'warn')}${metric('Status', hkStats?.archivedR15?.status || 'ARCHIVED')}</div><p>${esc(hkStats?.archivedR15?.reasonArchived || '')}</p></div></details>
    `, 'hk-research');
  }

  function hkRaces(hkLive) {
    const races = Array.isArray(hkLive?.races) ? hkLive.races : [];
    const meeting = hkLive?.meeting || {};
    return section('HONG KONG · SHA TIN 6 SEP', 'Current HK PARITY V2 race status. A listed race is not automatically a bet.', `
      <div class="race-grid">${races.map(r => `<article class="race-card"><div><span>HK R${esc(r.race)} · ${esc(r.timeHkt || '')}</span><strong>${esc(r.name || '')}</strong></div><p>${esc(r.class || '')} · ${esc(r.distanceM)}m</p><b class="pill wait-pill">${esc(r.strategyStatus || 'WAIT')}</b></article>`).join('')}</div>
      <p class="source-note">Meeting: ${esc(meeting.venue || 'Sha Tin')} · ${esc(meeting.track || 'Turf')} ${esc(meeting.course || 'A')} Course · ${esc(meeting.status || '')}</p>
    `, 'hk-races');
  }

  function compare(stats, hkStats) {
    const au = stats?.historical || {};
    const f = hkStats?.frequency || {};
    const h = hkStats?.historical || {};
    const m = hkStats?.model || {};
    const r = hkStats?.risk || {};
    return section('AU V11 vs HK PARITY V2 · LOW-FREQUENCY COMPARISON', 'The historical headline numbers are close; the risk and evidence quality are not.', `
      <div class="table-wrap compare-table"><table><thead><tr><th>Metric</th><th>Australia V11</th><th>Hong Kong Parity V2</th></tr></thead><tbody>
        <tr><td>Completed historical sample</td><td>${n0(au.completedFys)} FY · ${n0(au.bets)} bets</td><td>${n0(f.completedYears)} years · ${n0(f.completedBets)} bets</td></tr>
        <tr><td>Bets / year</td><td><b>${n1(au.betsPerYear)}</b></td><td><b class="good-text">${n1(f.betsPerYear)}</b></td></tr>
        <tr><td>Historical annual P/L</td><td>${money(au.avgCompletedFyAud)}</td><td class="good-text">${money(h.annualHistoricalProfitAud)}</td></tr>
        <tr><td>Historical ROI</td><td>${pct(au.roiPct)}</td><td class="good-text">${pctFrac(h.historicalRoi)}</td></tr>
        <tr><td>Max stake</td><td>A$10,000</td><td>${money(r.hardMaxStakeAud)}</td></tr>
        <tr><td>Losing completed years</td><td>0</td><td>${n0(h.losingCompletedYears)}</td></tr>
        <tr><td>Historical drawdown</td><td>${money(au.recordedMaxDrawdownAud)} recorded · ${money(au.reorderStressMaxDrawdownAud)} reorder stress</td><td class="bad">${money(h.raceLevelMaxDrawdownAud)} race-level</td></tr>
        <tr><td>Forward/model anchor</td><td>V11 production research framework</td><td>${money(m.calibratedModelEvAudPerYear)}/yr calibrated model EV · SHADOW</td></tr>
        <tr><td>Live status</td><td><span class="pill good-pill">PRODUCTION V11</span></td><td><span class="pill warn-pill">SHADOW / FAIL-CLOSED</span></td></tr>
      </tbody></table></div>
      <div class="truth-box"><strong>Bottom line</strong><p>Frequency parity is solved: ${n1(f.betsPerYear)} HK bets/year is effectively the same cadence as ${n1(au.betsPerYear)} for AU. Profit/ROI also look strong historically. The blocker is not frequency anymore — it is Hong Kong's much deeper drawdown and the absence of a verified live accepted-price record.</p></div>
    `, 'compare');
  }

  function caveats(stats, hkStats) {
    const evidence = stats?.evidence || {};
    const hkCaveats = Array.isArray(hkStats?.caveats) ? hkStats.caveats : [];
    return section('AUDIT NOTES · READ BEFORE USING THE NUMBERS', '', `
      <div class="caveat-list">
        <div><b>AU V11</b><p>${esc(evidence.planningNotPromise || 'Historical results are research, not guaranteed income.')}</p></div>
        <div><b>AU cash accounting</b><p>${esc(evidence.cashRule || '')}</p></div>
        ${hkCaveats.map(x => `<div><b>HK PARITY V2</b><p>${esc(x)}</p></div>`).join('')}
      </div>
    `, 'caveats');
  }

  function render(stats, current, hkStats, hkLive) {
    const root = $('statsRoot');
    const au = stats?.historical || {};
    const f = hkStats?.frequency || {};
    const h = hkStats?.historical || {};
    root.innerHTML = `
      <section class="hero">
        <div><span>FULL SYSTEM AUDIT</span><h1>RACING STATS</h1><p>AU V11 + HK PARITY V2 · low-frequency historical performance, current forward record, drawdowns, risk and evidence quality.</p></div>
        <div class="hero-kpis"><div><span>AU BETS/YR</span><strong>${n1(au.betsPerYear)}</strong></div><div><span>HK BETS/YR</span><strong>${n1(f.betsPerYear)}</strong></div><div><span>HK HIST ROI</span><strong>${pctFrac(h.historicalRoi)}</strong></div></div>
      </section>
      ${compare(stats, hkStats)}
      ${auHistorical(stats)}
      ${auCurrent(current)}
      ${auStates(current)}
      ${hkResearch(hkStats, hkLive)}
      ${hkRaces(hkLive)}
      ${caveats(stats, hkStats)}
    `;
    $('updatedLine').textContent = `Loaded AU stats ${stats?.updatedAt || '—'} · AU live ${current?.updatedAt || '—'} · HK Parity stats ${hkStats?.updatedAt || '—'}`;
  }

  async function start() {
    try {
      const [stats, current, hkStats, hkLive] = await Promise.all([
        getJson('./stats.json'),
        getJson('./current.json'),
        getJson('./hong-kong-stats.json?v=parity-v2'),
        getJson('./hong-kong.json?v=parity-v2')
      ]);
      render(stats, current, hkStats, hkLive);
    } catch (e) {
      console.error(e);
      $('statsRoot').innerHTML = `<div class="load-error"><strong>STATS COULD NOT BE VERIFIED</strong><p>${esc(e instanceof Error ? e.message : 'Unknown error')}</p><p>Do not infer missing numbers. Return to the live page and retry later.</p></div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
