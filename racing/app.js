(() => {
  'use strict';

  const UI_VERSION = '0.8.0';
  const MAX_STAKE = 10000;
  const MIN_PRICE = 3;
  const SAFE_FLOOR = 100000;
  const CACHE_DATA_KEY = 'mitchellRacingLastCurrent';
  const CACHE_STATS_KEY = 'mitchellRacingLastStats';
  const LOG_KEY = 'mitchellRacingExecutionLogV2';

  const $ = id => document.getElementById(id);
  const state = {
    data: null,
    stats: null,
    refreshing: false,
    feedSource: 'none',
    reviewFilter: 'all',
    feedHealth: { cls: 'wait', label: 'CHECKING', blockExecution: true, ageMinutes: null, raceDay: false }
  };

  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const pct = (value, d = 1) => num(value) === null ? '—' : `${Number(value).toFixed(d)}%`;

  function statusClass(value) {
    const s = String(value || '').toUpperCase();
    if (s.includes('RESEARCH') || s.includes('SHADOW')) return 'research';
    if (s.includes('NO CURRENT') || s.includes('NO BET') || s.includes('BLOCK') || s.includes('REJECT') || s.includes('STALE') || s.includes('ERROR') || s === 'RED') return 'red';
    if (s.includes('POTENTIAL') || s.includes('WATCH') || s.includes('WAIT') || s.includes('PENDING') || s.includes('CHECK') || s.includes('AMBER')) return 'wait';
    if (s.includes('LOCKED') || s.includes('BET NOW') || s.includes('READY TO BET') || s === 'GREEN') return 'green';
    if (s.includes('PREFERRED') || s.includes('CHAMPION') || s.includes('PRODUCTION') || s.includes('FRESH')) return 'blue';
    return 'neutral';
  }

  function perthDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Perth', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).reduce((a, p) => (a[p.type] = p.value, a), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function formatDateOnly(v) {
    if (!v) return '';
    const [y, m, d] = String(v).split('-').map(Number);
    if (!y || !m || !d) return String(v);
    return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  }

  function formatUpdated(v) {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return 'Update time unavailable';
    return 'Updated ' + new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth' }).format(d) + ' Perth';
  }

  function feedHealth(data) {
    const updated = new Date(data?.updatedAt || '');
    const ageMinutes = Number.isNaN(updated.getTime()) ? null : Math.max(0, (Date.now() - updated.getTime()) / 60000);
    const today = perthDateParts();
    const meetings = Array.isArray(data?.meetings) ? data.meetings : [];
    const raceDay = meetings.some(m => m.date === today && String(m.region).toLowerCase() !== 'hong kong');
    if (state.feedSource === 'cache' || !navigator.onLine) return { cls: 'red', label: 'CACHED / OFFLINE', blockExecution: true, ageMinutes, raceDay };
    if (ageMinutes === null) return { cls: 'red', label: 'NO TIMESTAMP', blockExecution: true, ageMinutes, raceDay };
    if (raceDay) {
      if (ageMinutes <= 3) return { cls: 'green', label: 'LIVE · FRESH', blockExecution: false, ageMinutes, raceDay };
      if (ageMinutes <= 10) return { cls: 'wait', label: `AGE ${Math.round(ageMinutes)}M`, blockExecution: false, ageMinutes, raceDay };
      return { cls: 'red', label: `STALE · ${Math.round(ageMinutes)}M`, blockExecution: true, ageMinutes, raceDay };
    }
    if (ageMinutes <= 24 * 60) return { cls: 'blue', label: `PLANNING · ${Math.max(1, Math.round(ageMinutes / 60))}H`, blockExecution: false, ageMinutes, raceDay };
    if (ageMinutes <= 48 * 60) return { cls: 'wait', label: `OLD · ${Math.round(ageMinutes / 60)}H`, blockExecution: true, ageMinutes, raceDay };
    return { cls: 'red', label: `STALE · ${Math.round(ageMinutes / 60)}H`, blockExecution: true, ageMinutes, raceDay };
  }

  function setNetworkUI() {
    const el = $('networkPill');
    if (!el) return;
    const online = navigator.onLine;
    el.textContent = online ? 'ONLINE' : 'OFFLINE';
    el.className = `pill ${online ? 'green' : 'red'}`;
  }

  function renderMeeting(m) {
    return `<div class="meeting-row"><div class="meeting-main"><strong>${esc(m.region)}</strong><div class="meta">${esc(m.venue)}${m.date ? ' · ' + esc(formatDateOnly(m.date)) : ''}</div></div><div class="meeting-side"><span class="code">${esc(m.code)}</span><span class="pill ${statusClass(m.status)}">${esc(m.status)}</span></div></div>`;
  }

  function renderLockedBet(b, index) {
    const stake = num(b.stakeAud) || 0;
    const min = num(b.minExec) || MIN_PRICE;
    return `<article class="locked-card"><div class="locked-banner">BET LOCKED</div><div class="locked-body"><div class="locked-title"><div><span>${esc(b.race || '')}</span><strong>${esc(b.horse || 'Horse TBC')}</strong></div><div class="locked-stake">${stake > 0 ? money.format(stake) : 'STAKE PENDING'}</div></div><div class="locked-meta">${esc(b.venue || b.region || '')}${b.jumpTime ? ' · ' + esc(b.jumpTime) : ''}</div><div class="locked-gates"><div><span>Minimum price</span><strong>${min.toFixed(2)}+</strong></div><div><span>Market</span><strong>FIXED WIN</strong></div><div><span>Max accepted</span><strong>${stake > 0 ? money.format(Math.min(stake, MAX_STAKE)) : money.format(MAX_STAKE)}</strong></div></div>${b.note ? `<div class="meta why-line">${esc(b.note)}</div>` : ''}<button class="primary-button log-lock-button" type="button" data-log-bet="${index}">Log execution for this bet</button></div></article>`;
  }

  function renderPotentialBet(i) {
    const st = num(i.state), gate = num(i.priceGate) || MIN_PRICE, core = num(i.coreBaseReferenceAud) || 0;
    const n = num(i.histN), wins = num(i.histWins), wr = num(i.histWinRatePct), pu = num(i.histProfitUnits), roi = num(i.histRoiPct), avg = num(i.averageOdds);
    const horseConfirmed = i.provisionalHorse && !String(i.provisionalHorse).toUpperCase().includes('TBC');
    return `<article class="potential-card"><div class="not-bet-ribbon">NOT A BET</div><div class="potential-head"><div class="bet-main"><strong>${esc(i.race)} · ${esc(i.provisionalHorse || 'Favourite TBC')}</strong><div class="meta">${esc(i.venue || i.region || '')} · state ${st ?? '—'} · ${esc(i.qualifyingKey || '')}</div></div><div class="bet-side"><span class="code">${core > 0 ? 'CORE REF ' + money.format(core) : 'V11 STATE'}</span><span class="pill wait">WATCH</span></div></div><div class="mini-gates"><div class="pass"><span>V11 core state</span><strong>YES</strong></div><div class="${horseConfirmed ? 'pass' : 'pending'}"><span>Horse confirmed</span><strong>${horseConfirmed ? 'YES' : 'TBC'}</strong></div><div class="pending"><span>Executable price</span><strong>${gate.toFixed(2)}+ NEEDED</strong></div><div class="fail"><span>BET LOCKED</span><strong>NO</strong></div></div><div class="state-stat-grid"><div><span>Hist bets</span><strong>${n ?? '—'}</strong></div><div><span>Wins</span><strong>${wins ?? '—'}</strong></div><div><span>Win rate</span><strong>${pct(wr)}</strong></div><div><span>Hist ROI</span><strong class="${roi !== null && roi >= 0 ? 'positive-text' : 'negative-text'}">${pct(roi)}</strong></div><div><span>Hist P/L</span><strong class="${pu !== null && pu >= 0 ? 'positive-text' : 'negative-text'}">${pu === null ? '—' : (pu >= 0 ? '+' : '') + pu.toFixed(1) + 'u'}</strong></div><div><span>Avg odds</span><strong>${avg && avg > 0 ? avg.toFixed(2) : '—'}</strong></div></div>${i.marketStatus ? `<div class="meta evidence-line">${esc(i.marketStatus)}</div>` : ''}${i.why ? `<div class="meta why-line">${esc(i.why)}</div>` : ''}</article>`;
  }

  function renderReviewRow(r) {
    const current = String(r.currentStatus || 'NO CURRENT POTENTIAL').toUpperCase();
    const isPotential = current.includes('POTENTIAL');
    const cls = isPotential ? 'wait' : 'red';
    const sroi = num(r.snapshotRoiPct), avg = num(r.snapshotAverageOdds), stake = num(r.currentReferenceStakeAud);
    const currentState = num(r.currentState), snapState = num(r.snapshotState), n = num(r.snapshotBets), wr = num(r.snapshotWinRatePct);
    const statusLabel = isPotential ? 'WATCH · POTENTIAL' : 'NO CURRENT POTENTIAL';
    const filter = isPotential ? 'potential' : 'none';
    return `<article class="review-card ${isPotential ? 'review-potential' : ''}" data-review-kind="${filter}"><div class="review-flat-head"><div class="review-summary-main"><strong>${esc(r.race)}</strong><span class="review-action">${currentState !== null ? `STATE ${currentState}` : 'STATE NOT RECONCILED'}</span></div><span class="pill ${cls}">${esc(statusLabel)}</span></div><div class="review-body-flat"><div class="review-current"><span>Current planning state</span><strong>${currentState !== null ? 'State ' + currentState : 'Not independently reconciled'}</strong>${stake ? `<small>Core reference ${money.format(stake)}</small>` : ''}</div><div class="state-stat-grid review-stats"><div><span>22 Aug state</span><strong>${snapState ?? '—'}</strong></div><div><span>Hist bets</span><strong>${n ?? '—'}</strong></div><div><span>Win rate</span><strong>${pct(wr)}</strong></div><div><span>Avg odds</span><strong>${avg !== null ? avg.toFixed(2) : '—'}</strong></div><div><span>Hist ROI</span><strong class="${sroi !== null && sroi >= 0 ? 'positive-text' : 'negative-text'}">${pct(sroi, 0)}</strong></div><div><span>22 Aug action</span><strong>${esc(r.snapshotAction || 'No Bet')}</strong></div></div><div class="review-why"><strong>Why now:</strong> ${esc(r.why || 'Not on the V11 core watchlist.')}</div></div></article>`;
  }

  function renderSeason(data) {
    const s = data.season || {}, p = num(s.modelProfitAud), t = num(s.modelTurnoverAud), b = num(s.modelBets), w = num(s.modelWins), l = num(s.modelLosses), roi = num(s.modelRoiPct);
    $('seasonPill').textContent = s.status || 'MODEL';
    $('seasonPill').className = `pill ${statusClass(s.status)}`;
    $('seasonProfit').textContent = p === null ? '—' : money.format(p);
    $('seasonProfit').className = `season-profit ${p > 0 ? 'positive' : p < 0 ? 'negative' : ''}`;
    $('seasonCaption').textContent = `${s.fy || 'Current FY'} model P/L${s.modelThrough ? ' through ' + formatDateOnly(s.modelThrough) : ''}`;
    $('seasonRoi').textContent = pct(roi);
    $('seasonBets').textContent = b ?? '—';
    $('seasonTurnover').textContent = t === null ? '—' : money.format(t);
    $('seasonRecord').textContent = w !== null && l !== null ? `${w} / ${l}` : '—';
    $('cashStatus').innerHTML = `<strong>Actual cash P/L:</strong> ${esc(s.actualCashStatus || 'NOT VERIFIED')}`;
    $('seasonNote').textContent = s.note || '';
  }

  function renderStats(stats) {
    state.stats = stats;
    const strategy = stats.strategy || {}, h = stats.historical || {}, ex = stats.execution || {}, v = stats.safeFloor || {}, c = stats.challenger || {}, e = stats.evidence || {};
    $('statsSystemPill').textContent = strategy.status || 'PREFERRED CHAMPION';
    $('statsSystemPill').className = `pill ${statusClass(strategy.status)}`;
    $('statsSystemName').textContent = strategy.name || 'V11 CORE + A$100K FIXED SAFE FLOOR + BEST-NET EXECUTION';
    $('statsObjective').textContent = strategy.objective || '';
    $('statsSystemRule').textContent = strategy.rule || '';
    $('statsNext12m').textContent = num(v.next12mPlanningMeanAud) === null ? '—' : money.format(v.next12mPlanningMeanAud);
    $('statsV37Mean').textContent = num(v.meanAud) === null ? '—' : money.format(v.meanAud);
    $('statsV37Median').textContent = num(v.medianAud) === null ? '—' : money.format(v.medianAud);
    $('statsV37Positive').textContent = num(v.positiveYears) !== null && num(v.targetYears) !== null ? `${v.positiveYears}/${v.targetYears} positive historical years under stress` : '—';
    $('statsHistAvgFy').textContent = num(h.avgCompletedFyAud) === null ? '—' : money.format(h.avgCompletedFyAud);
    $('statsHistRoi').textContent = pct(h.roiPct);
    $('statsBetsYear').textContent = num(h.betsPerYear) === null ? '—' : Number(h.betsPerYear).toFixed(1);
    $('statsTotalBets').textContent = num(h.bets) === null ? '—' : Math.round(h.bets).toLocaleString('en-AU');
    $('statsHistProfit').textContent = num(h.totalProfitAud) === null ? '—' : money.format(h.totalProfitAud);
    $('statsHistTurnover').textContent = num(h.turnoverAud) === null ? '—' : money.format(h.turnoverAud);
    $('statsRecordedDd').textContent = num(h.recordedMaxDrawdownAud) === null ? '—' : money.format(h.recordedMaxDrawdownAud);
    $('statsStressDd').textContent = num(h.reorderStressMaxDrawdownAud) === null ? '—' : money.format(h.reorderStressMaxDrawdownAud);
    $('statsStartAvg').textContent = num(h.startAug10AvgAud) === null ? '—' : money.format(h.startAug10AvgAud);
    $('statsWorseAvg').textContent = num(ex.fivePctWorseStartAvgAud) === null ? '—' : money.format(ex.fivePctWorseStartAvgAud);
    $('statsExecutionCost').textContent = num(ex.executionSensitivityAud) === null ? '—' : money.format(ex.executionSensitivityAud) + '/yr';
    $('statsExecutionMessage').textContent = ex.message || '';
    $('statsShadowBets').textContent = num(c.approxBetsPerYear) === null ? '—' : Number(c.approxBetsPerYear).toFixed(1) + ' bets/yr';
    $('statsShadowRoi').textContent = pct(c.hindsightRoiPct);
    $('statsShadowFy').textContent = num(c.hindsightAvgFyAud) === null ? '—' : money.format(c.hindsightAvgFyAud);
    $('statsShadowWarning').textContent = c.warning || 'Shadow research is not a live wager instruction.';
    const notes = [['Live choice', strategy.selectionChange || 'V11 core remains the live selection layer.'], ['Historical cutoff', e.historicalCutoff || '—'], ['Planning', e.planningNotPromise || 'Historical/model planning numbers are not guarantees.'], ['Banked cash', e.cashRule || 'Use accepted stake, accepted price, charges and settlement.']];
    if (e.desktopBoundary) notes.push(['Desktop boundary', e.desktopBoundary]);
    $('statsEvidenceNotes').innerHTML = notes.map(([a, b]) => `<div class="stats-note"><strong>${esc(a)}</strong><span>${esc(b)}</span></div>`).join('');
    $('appVersion').textContent = `feed v${stats.appVersion || state.data?.appVersion || '—'}`;
  }

  function renderRisk(data) {
    const s = data.season || {};
    const cash = num(s.actualCashProfitAud);
    const locks = Array.isArray(data.lockedBets) ? data.lockedBets.length : 0;
    $('riskOpenLocks').textContent = String(locks);
    if (cash === null) {
      $('riskModePill').textContent = 'CASH NOT VERIFIED'; $('riskModePill').className = 'pill red';
      $('riskMode').textContent = 'Safe-floor release is locked';
      $('riskModeNote').textContent = 'The app refuses to infer real banked cash from model-equivalent P/L.';
      $('riskHero').className = 'risk-hero red-risk';
      $('riskCashWarning').textContent = s.actualCashStatus || 'Actual cash verification is incomplete.';
      return;
    }
    if (cash < SAFE_FLOOR) {
      $('riskModePill').textContent = 'PRE-FLOOR'; $('riskModePill').className = 'pill blue';
      $('riskMode').textContent = `${money.format(cash)} verified FY cash P/L`;
      $('riskModeNote').textContent = `Frozen V11 selection/staking remains unchanged until verified cash reaches ${money.format(SAFE_FLOOR)}.`;
      $('riskHero').className = 'risk-hero';
      $('riskCashWarning').textContent = `${money.format(SAFE_FLOOR - cash)} remains before the fixed safe floor activates.`;
      return;
    }
    const grossCushion = cash - SAFE_FLOOR;
    $('riskModePill').textContent = 'SAFE FLOOR ACTIVE'; $('riskModePill').className = 'pill green';
    $('riskMode').textContent = `${money.format(SAFE_FLOOR)} protected`;
    $('riskModeNote').textContent = `Gross verified cushion: ${money.format(grossCushion)} before subtracting accepted open exposure.`;
    $('riskHero').className = 'risk-hero safe-risk';
    $('riskCashWarning').textContent = 'Only verified cushion above the fixed floor may be released, after accepted open exposure. The A$10,000 hard cap still applies.';
  }

  function executionFeedBlocked() {
    const fh = state.feedHealth;
    const hasLock = Array.isArray(state.data?.lockedBets) && state.data.lockedBets.length > 0;
    if (fh.blockExecution) return true;
    return Boolean(hasLock && (fh.ageMinutes === null || fh.ageMinutes > 10));
  }

  function renderCommand(data) {
    state.feedHealth = feedHealth(data);
    const fh = state.feedHealth;
    const locked = Array.isArray(data.lockedBets) ? data.lockedBets : [];
    const lockFeedBlocked = locked.length > 0 && executionFeedBlocked();
    $('freshnessBadge').textContent = fh.label; $('freshnessBadge').className = `freshness-badge ${fh.cls}`;
    $('gateFeed').textContent = fh.label; $('gateFeed').className = fh.cls === 'green' ? 'positive-text' : fh.cls === 'red' ? 'negative-text' : '';
    let cls = 'red', text = 'NO BET — wait for BET LOCKED', count = '0', stickyKicker = 'REAL MONEY';
    if (locked.length && lockFeedBlocked) { cls = 'red'; text = 'DO NOT EXECUTE — locked signal feed is stale/offline'; count = `${locked.length} LOCK${locked.length === 1 ? '' : 'S'}`; stickyKicker = 'BLOCKED'; }
    else if (locked.length) { cls = 'green'; text = `${locked.length} BET LOCKED — verify exact horse, price and accepted stake`; count = `${locked.length} LIVE`; stickyKicker = 'BET LOCKED'; }
    $('commandStrip').className = `command-strip ${cls}`; $('commandText').textContent = text; $('commandCount').textContent = count;
    $('stickyCommand').className = `sticky-command ${cls}`; $('stickyKicker').textContent = stickyKicker; $('stickyText').textContent = text;
    $('actionPill').textContent = locked.length ? `${locked.length} LOCKED` : 'NO BET'; $('actionPill').className = `pill ${locked.length && !lockFeedBlocked ? 'green' : 'red'}`;
    if (lockFeedBlocked && locked.length) {
      $('actionWarning').innerHTML = '<strong>Execution blocked by app safety rail.</strong><span>Refresh to a trustworthy feed before placing any locked wager.</span>';
      $('actionWarning').className = 'action-warning danger-action';
    } else {
      $('actionWarning').innerHTML = '<strong>Nothing is a bet until it says BET LOCKED.</strong><span>Potential/watchlist cards are planning only.</span>';
      $('actionWarning').className = 'action-warning';
    }
  }

  function renderData(data) {
    state.data = data;
    $('weekLabel').textContent = data.weekLabel || 'Current racing week';
    $('overallStatus').textContent = data.overallStatus || 'WAIT'; $('overallMessage').textContent = data.overallMessage || '';
    $('productionRule').textContent = data.productionRule || ''; $('updatedAt').textContent = formatUpdated(data.updatedAt); $('appVersion').textContent = `feed v${data.appVersion || '—'}`;
    const cls = statusClass(data.overallStatus); $('statusDot').className = `status-dot ${cls}`; $('overallStatus').className = `status-label ${cls}`;
    renderCommand(data); renderSeason(data); renderRisk(data);
    const locked = Array.isArray(data.lockedBets) ? data.lockedBets : [];
    $('lockedBets').innerHTML = locked.map(renderLockedBet).join(''); $('noLockedBets').hidden = locked.length > 0;
    document.querySelectorAll('[data-log-bet]').forEach(btn => btn.addEventListener('click', () => prefillLockedBet(Number(btn.dataset.logBet))));
    const potential = Array.isArray(data.watchlist) ? data.watchlist : [];
    $('potentialBets').innerHTML = potential.map(renderPotentialBet).join(''); $('noPotentialBets').hidden = potential.length > 0;
    $('potentialPill').textContent = potential.length ? `${potential.length} WATCH` : 'NONE'; $('potentialPill').className = `pill ${potential.length ? 'wait' : 'neutral'}`;
    const review = Array.isArray(data.streamReview) ? data.streamReview : [];
    $('reviewBoard').innerHTML = review.length ? review.map(renderReviewRow).join('') : '<div class="empty-state"><strong>Stream review unavailable.</strong></div>';
    const pCount = review.filter(r => String(r.currentStatus || '').toUpperCase().includes('POTENTIAL')).length;
    $('reviewPill').textContent = `${review.length || 0} STREAMS · ${pCount} WATCH`; applyReviewFilter();
    const meetings = Array.isArray(data.meetings) ? data.meetings : [];
    $('meetings').innerHTML = meetings.map(renderMeeting).join('');
    $('hkMeeting').innerHTML = meetings.filter(m => String(m.region).toLowerCase() === 'hong kong').map(renderMeeting).join('') || '<div class="empty-state"><strong>No Hong Kong meeting published.</strong></div>';
    const hk = data.models?.hongKong || {}; $('hkModelName').textContent = hk.name || 'R23 PLACE BACK'; $('hkModelNote').textContent = hk.note || '';
    const h = data.health || {};
    const labels = [['App feed', h.appFeed || 'UNKNOWN'], ['Australia champion', h.auProduction || 'UNKNOWN'], ['Pre-race watchlist', h.watchlist || 'UNKNOWN'], ['21-stream review', h.reviewBoard || 'UNKNOWN'], ['FY ledger', h.seasonLedger || 'UNKNOWN'], ['Hong Kong', h.hkProduction || 'UNKNOWN'], ['Evidence boundary', h.source || 'Production dashboard is source of truth']];
    $('healthRows').innerHTML = labels.map(([n, v]) => `<div class="health-row"><strong>${esc(n)}</strong><span class="health-value ${statusClass(v)}">${esc(v)}</span></div>`).join('');
    if (state.stats) renderStats(state.stats); updateExecutionChecks();
  }

  function cacheJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function readCachedJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
  async function fetchJson(url) { const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }

  async function loadData(manual = false) {
    if (state.refreshing) return;
    state.refreshing = true; $('refreshButton').disabled = true; $('refreshState').textContent = manual ? 'Refreshing…' : 'Checking latest…';
    try {
      const data = await fetchJson('./current.json'); state.feedSource = 'network'; cacheJson(CACHE_DATA_KEY, data); renderData(data);
      try { const stats = await fetchJson('./stats.json'); cacheJson(CACHE_STATS_KEY, stats); renderStats(stats); }
      catch (statsError) { const cachedStats = readCachedJson(CACHE_STATS_KEY); if (cachedStats) renderStats(cachedStats); console.warn('Stats feed unavailable', statsError); }
      $('refreshState').textContent = 'Latest loaded';
    } catch (error) {
      console.error(error);
      const cached = state.data || readCachedJson(CACHE_DATA_KEY); const cachedStats = state.stats || readCachedJson(CACHE_STATS_KEY);
      if (cached) { state.feedSource = 'cache'; renderData(cached); if (cachedStats) renderStats(cachedStats); $('refreshState').textContent = 'Offline/stale · cached feed only'; }
      else { state.feedSource = 'none'; $('refreshState').textContent = 'Could not load racing feed'; $('freshnessBadge').textContent = 'NO FEED'; $('freshnessBadge').className = 'freshness-badge red'; $('commandStrip').className = 'command-strip red'; $('commandText').textContent = 'DO NOT BET — no trustworthy feed loaded'; }
    } finally { state.refreshing = false; $('refreshButton').disabled = false; setNetworkUI(); }
  }

  function readLogs() {
    try {
      const v2 = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      if (Array.isArray(v2) && v2.length) return v2;
      const legacy = JSON.parse(localStorage.getItem('mitchellRacingExecutionLog') || '[]');
      return Array.isArray(legacy) ? legacy.map(x => ({ ...x, status: 'ACCEPTED', flags: ['LEGACY LOG'], bookmaker: '' })) : [];
    } catch { return []; }
  }
  function saveLogs(logs) { localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-200))); }
  function logStatusClass(log) { if (Array.isArray(log.flags) && log.flags.some(f => f.includes('OFF-RULE') || f.includes('UNVERIFIED'))) return 'red'; if (log.status === 'REJECTED') return 'red'; if (log.status === 'PARTIAL') return 'wait'; return 'green'; }

  function renderLogs() {
    const logs = readLogs().slice().reverse();
    $('executionLog').innerHTML = logs.length ? logs.map(i => {
      const price = num(i.price), stake = num(i.stake) || 0, flags = Array.isArray(i.flags) ? i.flags : [];
      return `<article class="log-row log-card"><div class="log-main"><div class="log-title"><strong>${esc(i.race)} · ${esc(i.horse)}</strong><span class="pill ${logStatusClass(i)}">${esc(i.status || 'ACCEPTED')}</span></div><div class="meta">${esc(i.bookmaker || 'Bookmaker not recorded')} · ${esc(i.time || '')}</div>${i.reference ? `<div class="meta">Ref: ${esc(i.reference)}</div>` : ''}${flags.length ? `<div class="log-flags">${flags.map(f => `<span>${esc(f)}</span>`).join('')}</div>` : ''}</div><div class="log-values"><strong>${money.format(stake)}</strong><span>${price ? '@ ' + price.toFixed(2) : 'NO FILL'}</span></div></article>`;
    }).join('') : '<div class="empty-state"><strong>No execution saved on this phone.</strong><span>Local logs are an audit aid, not the authoritative bookmaker record.</span></div>';
  }

  function currentLockedMatch(race, horse) {
    const locks = Array.isArray(state.data?.lockedBets) ? state.data.lockedBets : [];
    return locks.findIndex(b => String(b.race || '').toUpperCase() === String(race || '').toUpperCase() && String(b.horse || '').trim().toLowerCase() === String(horse || '').trim().toLowerCase());
  }

  function prefillLockedBet(index) {
    const locks = Array.isArray(state.data?.lockedBets) ? state.data.lockedBets : [], b = locks[index];
    if (!b) return;
    $('logLockId').value = String(index); $('logRace').value = b.race || ''; $('logHorse').value = b.horse || ''; $('logModelStake').value = num(b.stakeAud) || ''; $('logMinExec').value = num(b.minExec) || MIN_PRICE; $('logStatus').value = 'ACCEPTED';
    $('logBookmaker').focus({ preventScroll: true }); $('executionForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('formMessage').textContent = 'Locked bet loaded. Enter the bookmaker and the fill actually accepted.'; $('formMessage').className = 'form-message info'; updateExecutionChecks();
  }

  function resetExecutionForm() {
    $('executionForm').reset(); $('logPrice').disabled = false; $('logStake').disabled = false; $('logLockId').value = ''; $('formMessage').textContent = ''; $('formMessage').className = 'form-message'; updateExecutionChecks();
  }

  function executionAssessment() {
    const status = $('logStatus').value, race = $('logRace').value.trim().toUpperCase(), horse = $('logHorse').value.trim(), bookmaker = $('logBookmaker').value.trim();
    const price = num($('logPrice').value), stake = num($('logStake').value), modelStake = num($('logModelStake').value), minExec = num($('logMinExec').value) || MIN_PRICE;
    const lockedIndex = currentLockedMatch(race, horse), flags = [], errors = [];
    if (!race || !horse) errors.push('Race and horse are required.');
    if (!bookmaker) errors.push('Bookmaker is required for an auditable fill.');
    if (status === 'REJECTED') { if (stake && stake > 0) flags.push('REJECTED BUT STAKE ENTERED'); return { status, race, horse, bookmaker, price: price || 0, stake: stake || 0, modelStake, minExec, lockedIndex, flags, errors }; }
    if (price === null || price < 1.01) errors.push('Accepted price is required.');
    if (stake === null || stake <= 0) errors.push('Accepted stake must be above A$0.');
    if (stake !== null && stake > MAX_STAKE) errors.push(`Accepted stake cannot exceed the A$${MAX_STAKE.toLocaleString('en-AU')} hard cap.`);
    if (modelStake !== null && stake !== null && stake > modelStake) flags.push('OFF-RULE · ACCEPTED > MODEL STAKE');
    if (price !== null && price < minExec) flags.push(`OFF-RULE · PRICE < ${minExec.toFixed(2)}`);
    if (lockedIndex < 0) flags.push('UNVERIFIED · NO CURRENT LOCK MATCH');
    if (executionFeedBlocked()) flags.push('OFF-RULE · FEED STALE/OFFLINE');
    if (status === 'ACCEPTED' && modelStake !== null && stake !== null && stake < modelStake) flags.push('PARTIAL-SIZE FILL');
    return { status, race, horse, bookmaker, price, stake, modelStake, minExec, lockedIndex, flags, errors };
  }

  function updateExecutionChecks() {
    const box = $('executionChecks'); if (!box) return;
    const a = executionAssessment(); const hasAny = a.race || a.horse || a.bookmaker || a.price || a.stake || a.modelStake;
    if (!hasAny) { box.innerHTML = '<div class="execution-check neutral"><span>Tip</span><strong>Use a locked bet’s “Log execution” button to prefill the model limits.</strong></div>'; return; }
    const checks = [{ label: 'Current lock', ok: a.lockedIndex >= 0, text: a.lockedIndex >= 0 ? 'MATCHED' : 'NOT MATCHED' }];
    if (a.status !== 'REJECTED') {
      checks.push({ label: 'Price rule', ok: a.price !== null && a.price >= a.minExec, text: a.price === null ? 'ENTER PRICE' : `${a.price.toFixed(2)} vs ${a.minExec.toFixed(2)} min` });
      checks.push({ label: 'Stake cap', ok: a.stake !== null && a.stake <= MAX_STAKE && (a.modelStake === null || a.stake <= a.modelStake), text: a.stake === null ? 'ENTER STAKE' : money.format(a.stake) });
    }
    checks.push({ label: 'Feed', ok: !executionFeedBlocked(), text: executionFeedBlocked() ? 'BLOCKED / REFRESH' : state.feedHealth.label });
    box.innerHTML = checks.map(c => `<div class="execution-check ${c.ok ? 'pass' : 'fail'}"><span>${esc(c.label)}</span><strong>${esc(c.text)}</strong></div>`).join('');
  }

  function setupExecutionForm() {
    ['logRace','logHorse','logBookmaker','logStatus','logPrice','logStake','logModelStake','logMinExec'].forEach(id => { $(id).addEventListener('input', updateExecutionChecks); $(id).addEventListener('change', updateExecutionChecks); });
    $('logStatus').addEventListener('change', () => {
      const rejected = $('logStatus').value === 'REJECTED'; $('logPrice').disabled = rejected; $('logStake').disabled = rejected;
      if (rejected) { $('logPrice').value = ''; $('logStake').value = '0'; } updateExecutionChecks();
    });
    $('executionForm').addEventListener('submit', e => {
      e.preventDefault(); const a = executionAssessment(), m = $('formMessage'); m.className = 'form-message';
      if (a.errors.length) { m.textContent = a.errors.join(' '); m.classList.add('error'); return; }
      if (a.flags.some(f => f.includes('OFF-RULE') || f.includes('UNVERIFIED'))) {
        const ok = window.confirm(`This execution has audit warnings:\n\n${a.flags.join('\n')}\n\nSave it anyway as an honest off-rule record?`); if (!ok) return;
      }
      const logs = readLogs();
      logs.push({ race: a.race, horse: a.horse, bookmaker: a.bookmaker, status: a.status, price: a.status === 'REJECTED' ? 0 : a.price, stake: a.status === 'REJECTED' ? 0 : a.stake, modelStake: a.modelStake, minExec: a.minExec, flags: a.flags, verifiedLock: a.lockedIndex >= 0, reference: $('logReference').value.trim(), time: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Perth' }), timestamp: new Date().toISOString() });
      saveLogs(logs); m.textContent = a.flags.length ? 'Saved with audit warning flags.' : 'Execution saved on this phone.'; m.classList.add(a.flags.length ? 'warning' : 'success'); renderLogs(); setTimeout(resetExecutionForm, 900);
    });
    $('resetLogButton').addEventListener('click', resetExecutionForm);
    $('clearLogButton').addEventListener('click', () => { if (readLogs().length && window.confirm('Clear the execution log saved on this phone?')) { localStorage.removeItem(LOG_KEY); localStorage.removeItem('mitchellRacingExecutionLog'); renderLogs(); } });
  }

  function setActiveTab(name, updateUrl = true) {
    const valid = ['today','review','stats','risk','research','health'], tab = valid.includes(name) ? name : 'today';
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab));
    if (updateUrl && history.replaceState) { const url = new URL(location.href); if (tab === 'today') url.searchParams.delete('tab'); else url.searchParams.set('tab', tab); history.replaceState(null, '', url); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupTabs() {
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setActiveTab(b.dataset.tab)));
    const initial = new URL(location.href).searchParams.get('tab'); if (initial) setActiveTab(initial, false);
    $('stickyAction').addEventListener('click', () => setActiveTab('today'));
  }

  function applyReviewFilter() { const filter = state.reviewFilter; document.querySelectorAll('[data-review-kind]').forEach(card => { card.hidden = filter !== 'all' && card.dataset.reviewKind !== filter; }); }
  function setupReviewFilters() { document.querySelectorAll('[data-review-filter]').forEach(btn => btn.addEventListener('click', () => { state.reviewFilter = btn.dataset.reviewFilter; document.querySelectorAll('[data-review-filter]').forEach(x => x.classList.toggle('active', x === btn)); applyReviewFilter(); })); }

  async function checkAppUpdate() {
    const m = $('refreshState'); m.textContent = 'Checking app update…';
    try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) await reg.update(); await loadData(true); m.textContent = 'App/feed update check complete'; }
    catch (e) { console.error(e); m.textContent = 'Update check failed'; }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('./sw.js');
        reg.addEventListener('updatefound', () => { const worker = reg.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) $('refreshState').textContent = 'App update ready · reopen/refresh'; }); });
      } catch (e) { console.warn('Service worker registration failed', e); }
    });
  }

  function setupConnectivity() {
    window.addEventListener('online', () => { setNetworkUI(); loadData(true); });
    window.addEventListener('offline', () => { setNetworkUI(); if (state.data) { state.feedSource = 'cache'; renderData(state.data); } });
    setNetworkUI();
  }

  function setupAutoRefresh() {
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const hasLock = Array.isArray(state.data?.lockedBets) && state.data.lockedBets.length > 0;
      const intervalEligible = state.feedHealth.raceDay || hasLock; const seconds = intervalEligible ? 30 : 60;
      const last = num(sessionStorage.getItem('mitchellLastRefresh')) || 0;
      if ((Date.now() - last) / 1000 >= seconds) { sessionStorage.setItem('mitchellLastRefresh', String(Date.now())); loadData(false); }
    }, 10000);
  }

  $('uiVersion').textContent = `v${UI_VERSION}`;
  setupTabs(); setupReviewFilters(); setupExecutionForm(); setupConnectivity(); renderLogs();
  $('refreshButton').addEventListener('click', () => loadData(true)); $('forceUpdateButton').addEventListener('click', checkAppUpdate);
  registerServiceWorker(); setupAutoRefresh(); loadData(false);
})();
