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
        ${metric('Historical bets', n0(h.bets), `${n1(h.betsPerYear)} bets/year`)}
        ${metric('Total turnover', money(h.turnoverAud))}
        ${metric('Total historical profit', money(h.totalProfitAud), 'Model-equivalent research P/L', 'good')}
        ${metric('Historical ROI', pct(h.roiPct), 'Profit / turnover', 'good')}
        ${metric('Average completed FY', money(h.avgCompletedFyAud), 'Historical mean', 'good')}
        ${metric('Recorded max drawdown', money(h.recordedMaxDrawdownAud), 'Observed historical path', 'warn')}
        ${metric('Reorder-stress max drawdown', money(h.reorderStressMaxDrawdownAud), 'Stress test', 'warn')}
      </div>

      <div class="subcards">
        <div class="subcard">
          <h3>Execution sensitivity</h3>
          <div class="rows">
            <div><span>Start-around-10-Aug historical avg</span><strong>${money(h.startAug10AvgAud)}</strong></div>
            <div><span>Same replay with winning prices 5% worse</span><strong>${money(e.fivePctWorseStartAvgAud)}</strong></div>
            <div><span>Average annual damage from 5% worse prices</span><strong class="bad">−${money(Math.abs(Number(e.executionSensitivityAud || 0)))}</strong></div>
          </div>
          <p>${esc(e.message || '')}</p>
        </div>
        <div class="subcard">
          <h3>Fixed A$100k safe-floor stress replay</h3>
          <div class="rows">
            <div><span>Target-hit years</span><strong>${n0(sf.targetHits)} / ${n0(sf.targetYears)}</strong></div>
            <div><span>Positive years under stored stress replay</span><strong>${n0(sf.positiveYears)} / ${n0(sf.targetYears)}</strong></div>
            <div><span>Mean</span><strong>${money(sf.meanAud)}</strong></div>
            <div><span>Median</span><strong>${money(sf.medianAud)}</strong></div>
            <div><span>Annual standard deviation</span><strong>${money(sf.annualSdAud)}</strong></div>
            <div><span>Next-12m planning mean</span><strong>${money(sf.next12mPlanningMeanAud)}</strong></div>
          </div>
          <p>${esc(sf.note || '')}</p>
        </div>
      </div>

      <details class="audit-details">
        <summary>Rejected 30% expansion · why it is NOT live</summary>
        <div class="audit-body">
          <div class="metric-grid compact">
            ${metric('Approx bets/year', n1(ch.approxBetsPerYear))}
            ${metric('Hindsight ROI', pct(ch.hindsightRoiPct))}
            ${metric('Hindsight avg FY', money(ch.hindsightAvgFyAud))}
            ${metric('Status', ch.status || 'SHADOW ONLY', '', 'bad')}
          </div>
          <p>${esc(ch.warning || '')}</p>
        </div>
      </details>
    `, 'au-history');
  }

  function auCurrent(current) {
    const s = current?.season || {};
    const lw = current?.lastWeek || {};
    const watches = Array.isArray(current?.watchlist) ? current.watchlist : [];
    return section('AUSTRALIA V11 · CURRENT LIVE / FORWARD RECORD', 'This is kept separate from historical backtest figures. Actual cash is only counted from confirmed accepted executions.', `
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
      <div class="candidate-grid">
        ${watches.length ? watches.map(w => `<article class="candidate">
          <div><span>${esc(w.region || '')}</span><strong>${esc(w.race || '')} · STATE ${esc(w.state)}</strong></div>
          <div class="candidate-metrics">
            <b>${n0(w.histN)} historical samples</b>
            <b>${pct(w.histWinRatePct)} win rate</b>
            <b class="good-text">${pct(w.histRoiPct)} historical ROI</b>
            <b>${money(w.coreBaseReferenceAud)} core reference</b>
          </div>
          <p>${esc(w.why || '')}</p>
        </article>`).join('') : '<div class="empty">No V11 CORE potentials currently.</div>'}
      </div>
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
    const r = hkStats?.risk || {};
    const m = hkStats?.model || {};
    const p = hkStats?.validationProxy || {};
    const ex = hkStats?.execution || {};
    const strategy = hkLive?.strategy || {};
    return section('HONG KONG R15 BALANCED · RESEARCH STATS', 'R15 uses separate Hong Kong models. Its later historical execution tests are proxy/synthetic and are not equivalent to verified live fills.', `
      <div class="evidence-banner proxy"><strong>${esc(hkStats?.evidenceStatus || 'PROXY')}</strong><span>Do not read the proxy P/L as guaranteed income.</span></div>
      <div class="metric-grid">
        ${metric('Active risk cap / position', money(r.riskCapPerPositionAud), 'Total risk, not per bookmaker')}
        ${metric('Absolute hard maximum', money(r.absoluteHardMaximumAud))}
        ${metric('Expected units / year', n1(m.expectedUnitsPerYear), 'Central model estimate', 'good')}
        ${metric('Model-implied annual profit @ A$5k', money(m.modelImpliedProfitAudAtRiskCap), 'Central expectation before real-price validation', 'good')}
        ${metric('Validation-proxy avg / year', `${n1(p.averageUnitsPerYear)} units`, `${money(p.equivalentAverageAudAtRiskCap)} equivalent at A$5k — proxy only`, 'warn')}
        ${metric('Validation-proxy worst year', `${n1(p.worstYearUnits)} units`, `${money(p.equivalentWorstYearAudAtRiskCap)} equivalent — proxy only`)}
        ${metric('Bootstrap losing-year proxy', pctFrac(p.bootstrapLosingYearProbability), 'Research proxy, not a guarantee')}
        ${metric('Full proxy max drawdown', `${n1(p.maxDrawdownUnits)} units`, `${money(p.equivalentMaxDrawdownAudAtRiskCap)} at A$5k`, 'warn')}
      </div>

      <div class="subcards">
        <div class="subcard">
          <h3>R15 Balanced rules</h3>
          <div class="rows">
            <div><span>WIN model</span><strong>${esc(strategy?.prediction?.winModel || m.winModel || 'R4C')}</strong></div>
            <div><span>PLACE model</span><strong>${esc(strategy?.prediction?.placeModel || m.placeModel || 'R8')}</strong></div>
            <div><span>WIN odds</span><strong>$${Number(ex.winOddsMin || 1.5).toFixed(2)} → $${Number(ex.winOddsMaxInclusive || 6).toFixed(2)}</strong></div>
            <div><span>PLACE odds</span><strong>$${Number(ex.placeOddsMin || 1.1).toFixed(2)} → under $${Number(ex.placeOddsMaxExclusive || 10).toFixed(2)}</strong></div>
            <div><span>Minimum incremental EV gate</span><strong>+${pctFrac(ex.minimumIncrementalExpectedProfitUnits)}</strong></div>
            <div><span>Exchange base commission assumption</span><strong>${pctFrac(ex.exchangeMarketBaseRate)}</strong></div>
            <div><span>BACK route</span><strong>${esc(ex.backRouting || '')}</strong></div>
            <div><span>LAY route</span><strong>${esc(ex.layRouting || '')}</strong></div>
          </div>
        </div>
        <div class="subcard">
          <h3>Evidence quality</h3>
          <div class="rows">
            <div><span>Completed proxy years</span><strong>${n0(p.positiveCompletedProxyYears)} / ${n0(p.completedProxyYears)} positive</strong></div>
            <div><span>2026 partial proxy</span><strong>${p.partial2026Positive ? 'POSITIVE' : 'NEGATIVE'}</strong></div>
            <div><span>Raw R13 proxy max DD</span><strong>~${n1(p.rawR13MaxDrawdownUnitsApprox)} units</strong></div>
            <div><span>Balanced proxy max DD</span><strong>~${n1(p.maxDrawdownUnits)} units</strong></div>
          </div>
          <p>${esc(p.periodNote || '')}</p>
        </div>
      </div>
    `, 'hk-research');
  }

  function hkRaces(hkLive) {
    const races = Array.isArray(hkLive?.races) ? hkLive.races : [];
    const meeting = hkLive?.meeting || {};
    return section('HONG KONG · SHA TIN 6 SEP', 'Current R15 race status. A race being listed here is not a bet.', `
      <div class="race-grid">
        ${races.map(r => `<article class="race-card"><div><span>HK R${esc(r.race)} · ${esc(r.timeHkt || '')}</span><strong>${esc(r.name || '')}</strong></div><p>${esc(r.class || '')} · ${esc(r.distanceM)}m</p><b class="pill wait-pill">${esc(r.strategyStatus || 'WAIT')}</b></article>`).join('')}
      </div>
      <p class="source-note">Meeting: ${esc(meeting.venue || 'Sha Tin')} · ${esc(meeting.track || 'Turf')} ${esc(meeting.course || 'A')} Course · ${esc(meeting.status || '')}</p>
    `, 'hk-races');
  }

  function compare(stats, hkStats) {
    const h = stats?.historical || {};
    const hkM = hkStats?.model || {};
    const hkP = hkStats?.validationProxy || {};
    const hkR = hkStats?.risk || {};
    return section('AU V11 vs HK R15 · WHAT IS ACTUALLY COMPARABLE', 'The headline dollars are from different evidence types. The table keeps that distinction visible.', `
      <div class="table-wrap compare-table"><table><thead><tr><th>Metric</th><th>Australia V11</th><th>Hong Kong R15 Balanced</th></tr></thead><tbody>
        <tr><td>Evidence type</td><td><b>18 completed FY historical model-replay</b></td><td><b>Model + synthetic execution proxy</b></td></tr>
        <tr><td>Primary annual figure</td><td>${money(h.avgCompletedFyAud)} historical avg FY</td><td>${money(hkM.modelImpliedProfitAudAtRiskCap)} central model-implied @ A$5k</td></tr>
        <tr><td>Historical / proxy sample</td><td>${n0(h.completedFys)} FY · ${n0(h.bets)} bets</td><td>${n0(hkP.completedProxyYears)} completed proxy years</td></tr>
        <tr><td>ROI</td><td class="good-text">${pct(h.roiPct)} historical</td><td>Not promoted as a live ROI figure</td></tr>
        <tr><td>Drawdown</td><td>${money(h.recordedMaxDrawdownAud)} recorded · ${money(h.reorderStressMaxDrawdownAud)} reorder stress</td><td>${n1(hkP.maxDrawdownUnits)} proxy units · ${money(hkP.equivalentMaxDrawdownAudAtRiskCap)} @ A$5k</td></tr>
        <tr><td>Active position/stake cap</td><td>A$10,000 hard model stake cap</td><td>${money(hkR.riskCapPerPositionAud)} active · ${money(hkR.absoluteHardMaximumAud)} absolute</td></tr>
        <tr><td>Live confidence</td><td><span class="pill good-pill">PRODUCTION V11</span></td><td><span class="pill warn-pill">PROXY / FAIL-CLOSED</span></td></tr>
      </tbody></table></div>
      <div class="truth-box"><strong>Bottom line</strong><p>AU V11 currently has the stronger evidence base. HK R15 is promising research, but its historical PLACE execution/liquidity assumptions still need real timestamped market data and accepted fills before the proxy returns should be trusted as live performance.</p></div>
    `, 'compare');
  }

  function caveats(stats, hkStats) {
    const evidence = stats?.evidence || {};
    const hkCaveats = Array.isArray(hkStats?.caveats) ? hkStats.caveats : [];
    return section('AUDIT NOTES · READ BEFORE USING THE NUMBERS', '', `
      <div class="caveat-list">
        <div><b>AU V11</b><p>${esc(evidence.planningNotPromise || 'Historical results are research, not guaranteed income.')}</p></div>
        <div><b>AU cash accounting</b><p>${esc(evidence.cashRule || '')}</p></div>
        ${hkCaveats.map(x => `<div><b>HK R15</b><p>${esc(x)}</p></div>`).join('')}
      </div>
    `, 'caveats');
  }

  function render(stats, current, hkStats, hkLive) {
    const root = $('statsRoot');
    const h = stats?.historical || {};
    const hkM = hkStats?.model || {};
    root.innerHTML = `
      <section class="hero">
        <div><span>FULL SYSTEM AUDIT</span><h1>RACING STATS</h1><p>AU V11 + HK R15 · historical performance, current forward record, state map, drawdowns, risk and evidence quality.</p></div>
        <div class="hero-kpis"><div><span>AU HIST ROI</span><strong>${pct(h.roiPct)}</strong></div><div><span>AU AVG FY</span><strong>${money(h.avgCompletedFyAud)}</strong></div><div><span>HK MODEL-IMPLIED</span><strong>${money(hkM.modelImpliedProfitAudAtRiskCap)}</strong></div></div>
      </section>
      ${compare(stats, hkStats)}
      ${auHistorical(stats)}
      ${auCurrent(current)}
      ${auStates(current)}
      ${hkResearch(hkStats, hkLive)}
      ${hkRaces(hkLive)}
      ${caveats(stats, hkStats)}
    `;
    $('updatedLine').textContent = `Loaded AU stats ${stats?.updatedAt || '—'} · AU live ${current?.updatedAt || '—'} · HK stats ${hkStats?.updatedAt || '—'}`;
  }

  async function start() {
    try {
      const [stats, current, hkStats, hkLive] = await Promise.all([
        getJson('./stats.json'),
        getJson('./current.json'),
        getJson('./hong-kong-stats.json'),
        getJson('./hong-kong.json')
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
