(() => {
  'use strict';

  const BUILD = '1.9.0';
  const REFRESH_MS = 60000;
  const FILES = {
    au: './current.json',
    auStats: './stats.json',
    hk: './hong-kong.json',
    hkStats: './hong-kong-stats.json'
  };

  const state = {
    data: { au:null, auStats:null, hk:null, hkStats:null },
    health: { au:null, preflight:null, hk:null },
    loadedAt:null,
    error:null,
    busy:false,
    internalAu:false,
    internalHk:false
  };

  const $ = id => document.getElementById(id);
  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const money = value => {
    const n = num(value);
    if (n === null) return '—';
    const abs = Math.abs(n);
    const sign = n < 0 ? '−' : '';
    if (abs >= 1000000) return `${sign}A$${(abs/1000000).toFixed(abs >= 10000000 ? 1 : 2)}m`;
    if (abs >= 1000) return `${sign}A$${(abs/1000).toFixed(abs >= 100000 ? 0 : 1)}k`;
    return `${sign}A$${Math.round(abs).toLocaleString('en-AU')}`;
  };
  const pct = (value, alreadyPct = false) => {
    const n = num(value);
    return n === null ? '—' : `${(alreadyPct ? n : n * 100).toFixed(1)}%`;
  };
  const one = value => {
    const n = num(value);
    return n === null ? '—' : n.toFixed(1);
  };
  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function perthToday() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone:'Australia/Perth', year:'numeric', month:'2-digit', day:'2-digit'
    }).format(new Date());
  }

  function prettyDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return 'date unavailable';
    const d = new Date(`${value}T12:00:00+08:00`);
    return new Intl.DateTimeFormat('en-AU', {
      timeZone:'Australia/Perth', weekday:'short', day:'numeric', month:'short', year:'numeric'
    }).format(d);
  }

  function timestamp(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return 'time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      timeZone:'Australia/Perth', hour:'numeric', minute:'2-digit', second:'2-digit'
    }).format(d) + ' Perth';
  }

  function cardDate(data) {
    const track = Array.isArray(data?.stateTracklist) ? data.stateTracklist : [];
    const watch = Array.isArray(data?.watchlist) ? data.watchlist : [];
    const meetings = Array.isArray(data?.meetings) ? data.meetings : [];
    return String(track[0]?.date || watch[0]?.date || meetings[0]?.date || '').trim() || null;
  }

  function dateMode(date) {
    const today = perthToday();
    if (!date) return { mode:'blocked', today, label:'CARD DATE MISSING', tone:'bad' };
    if (date < today) return { mode:'stale', today, label:'OLD CARD · NO BET', tone:'bad' };
    if (date > today) return { mode:'future', today, label:'NEXT CARD · WAIT', tone:'warn' };
    return { mode:'today', today, label:'RACE DAY', tone:'good' };
  }

  async function getJson(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const join = path.includes('?') ? '&' : '?';
      const response = await fetch(`${path}${join}production=${encodeURIComponent(BUILD)}-${Date.now()}`, {
        cache:'no-store', signal:controller.signal
      });
      if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function ensureShell() {
    let shell = $('productionCommandCentre');
    if (shell) return shell;
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher) return null;
    shell = document.createElement('section');
    shell.id = 'productionCommandCentre';
    shell.className = 'prod-centre';
    shell.setAttribute('aria-live','polite');
    shell.innerHTML = '<div class="prod-loading">Checking both racing systems…</div>';
    switcher.insertAdjacentElement('beforebegin', shell);
    return shell;
  }

  function auStatus() {
    const data = state.data.au;
    const date = cardDate(data);
    const dm = dateMode(date);
    const p = state.health.preflight || window.__MITCHELL_V11_PREFLIGHT || null;
    const live = state.health.au || null;
    const preflightAge = p?.checkedAt ? Date.now() - Date.parse(p.checkedAt) : Infinity;
    const preflightPass = p?.status === 'PASS' && p?.safe === true && preflightAge >= 0 && preflightAge <= 600000;
    const liveOk = live?.status === 'OK';

    if (dm.mode === 'stale') return {
      tone:'bad', status:'NO BET', badge:'CARD OUT OF DATE',
      reason:`Last loaded Australia card is ${prettyDate(date)}. Today is ${prettyDate(dm.today)}. It cannot be used as a live betting card.`, date, mode:dm.mode
    };
    if (dm.mode === 'blocked') return {
      tone:'bad', status:'NO BET', badge:'DATA BLOCKED',
      reason:'The Australia card date cannot be verified. Fail closed.', date, mode:dm.mode
    };
    if (dm.mode === 'future') return {
      tone:'warn', status:'WAIT', badge:'NEXT CARD LOADED',
      reason:`The next Australia card is ${prettyDate(date)}. Do nothing until that date and a fresh preflight passes.`, date, mode:dm.mode
    };
    if (!preflightPass) return {
      tone:'bad', status:'NO BET', badge:'PREFLIGHT NOT PASSED',
      reason:p?.errors?.[0] || 'The 21-stream state/evidence preflight is not a fresh PASS.', date, mode:dm.mode
    };
    if (!liveOk) return {
      tone:'warn', status:'WAIT', badge:'RACE DAY · CHECKING LIVE',
      reason:live?.reason || 'The current live favourite/price engine is checking.', date, mode:dm.mode
    };
    return {
      tone:'good', status:'LIVE', badge:'RACE DAY · VERIFIED',
      reason:'Current card date, V11 preflight and live engine are verified. Still only bet when the large AU action box itself turns green and says BET NOW.', date, mode:dm.mode
    };
  }

  function hkStatus() {
    const data = state.data.hk;
    const stats = state.data.hkStats;
    const meetingDate = String(data?.meeting?.date || '').trim() || null;
    const dm = dateMode(meetingDate);
    const approved = stats?.decision?.productionApproved === true;
    const liveFeed = data?.strategy?.liveFeed || {};
    const verifiedAt = Date.parse(liveFeed.lastVerifiedAt || liveFeed.verifiedAt || '');
    const fresh = Number.isFinite(verifiedAt) && Date.now() - verifiedAt >= 0 && Date.now() - verifiedAt <= 30000;
    const feedReady = liveFeed.modelClassificationVerified === true &&
      liveFeed.calibratedModelEvVerified === true &&
      liveFeed.executableQuotesVerified === true &&
      liveFeed.capacityVerified === true &&
      liveFeed.yearBetCountVerified === true &&
      liveFeed.todayRiskVerified === true && fresh;

    if (!approved) return {
      tone:'warn', status:'WAIT', badge:'SHADOW · NOT LIVE BETTING',
      reason:'HK OPTIMAL V4 is still a research/forward-validation candidate. Production approval is false, so the app must not issue a real-money BET NOW.', date:meetingDate, approved:false
    };
    if (dm.mode !== 'today') return {
      tone:dm.mode === 'future' ? 'warn' : 'bad', status:dm.mode === 'future' ? 'WAIT' : 'NO BET', badge:dm.label,
      reason:`Loaded Hong Kong meeting is ${meetingDate ? prettyDate(meetingDate) : 'not dated'}; today is ${prettyDate(dm.today)}.`, date:meetingDate, approved:true
    };
    if (!feedReady) return {
      tone:'bad', status:'NO BET', badge:'LIVE GATES NOT VERIFIED',
      reason:'HK production approval exists, but model, quote, capacity, year-count or daily-risk verification is missing/stale.', date:meetingDate, approved:true
    };
    return {
      tone:'good', status:'LIVE', badge:'PRODUCTION VERIFIED',
      reason:'HK production approval and every fresh live execution gate are verified. Only the HK action box may authorize a bet.', date:meetingDate, approved:true
    };
  }

  function stat(label, value, note = '') {
    return `<div class="prod-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function renderSystemCard(kind, status) {
    if (kind === 'au') {
      const h = state.data.auStats?.historical || {};
      const season = state.data.au?.season || {};
      const actual = season.actualCashProfitAud;
      return `<article class="prod-system ${status.tone}">
        <div class="prod-system-head">
          <div><span class="prod-eyebrow">AUSTRALIA</span><h2>V11 CORE</h2></div>
          <div class="prod-status-pill ${status.tone}">${esc(status.badge)}</div>
        </div>
        <div class="prod-command ${status.tone}"><span>RIGHT NOW</span><strong>${esc(status.status)}</strong><p>${esc(status.reason)}</p></div>
        <div class="prod-stats">
          ${stat('HISTORICAL BETS / YEAR', one(h.betsPerYear))}
          ${stat('HISTORICAL ROI', pct(h.roiPct, true), `${Number(h.completedFys || 0)} completed FYs`)}
          ${stat('HIST AVG / FY', money(h.avgCompletedFyAud), 'model-equivalent history')}
          ${stat('RECORDED HIST DD', money(h.recordedMaxDrawdownAud), `reorder stress ${money(h.reorderStressMaxDrawdownAud)}`)}
        </div>
        <div class="prod-footline"><b>Current FY model snapshot:</b> ${money(season.modelProfitAud)} on ${Number(season.modelBets || 0)} model bets through ${esc(season.modelThrough || '—')}. <b>Actual cash:</b> ${actual == null ? 'not fully verified/reconciled' : money(actual)}.</div>
      </article>`;
    }

    const h = state.data.hkStats?.historical || {};
    const f = state.data.hkStats?.frequency || {};
    const model = state.data.hkStats?.model || {};
    const stress = state.data.hkStats?.sequenceStress || {};
    return `<article class="prod-system ${status.tone}">
      <div class="prod-system-head">
        <div><span class="prod-eyebrow">HONG KONG</span><h2>OPTIMAL V4</h2></div>
        <div class="prod-status-pill ${status.tone}">${esc(status.badge)}</div>
      </div>
      <div class="prod-command ${status.tone}"><span>RIGHT NOW</span><strong>${esc(status.status)}</strong><p>${esc(status.reason)}</p></div>
      <div class="prod-stats">
        ${stat('HISTORICAL BETS / YEAR', one(f.betsPerYear))}
        ${stat('HISTORICAL ROI', pct(h.historicalRoi), `${Number(f.completedYears || 0)} completed years`)}
        ${stat('HIST AVG / YEAR', money(h.annualHistoricalProfitAud), 'optimised historical path')}
        ${stat('STORED HIST DD', money(h.raceLevelMaxDrawdownAud), `P95 sequence stress ${money(stress.p95MaxDrawdownAud)}`)}
      </div>
      <div class="prod-footline"><b>Conservative forward anchor:</b> ${money(model.calibratedModelEvAudPerYear)}/year (${pct(model.calibratedModelRoi)} model ROI). <b>2026 partial:</b> ${money(h.partial2026PlAud)} through ${esc(f.partial2026SourceCutoff || '—')}.</div>
    </article>`;
  }

  function render() {
    const shell = ensureShell();
    if (!shell) return;
    const au = auStatus();
    const hk = hkStatus();
    const updated = state.loadedAt ? timestamp(state.loadedAt) : 'checking';
    const allSafe = au.status !== 'LIVE' && hk.status !== 'LIVE';

    shell.innerHTML = `
      <div class="prod-head">
        <div><span class="prod-kicker">MITCHELL RACING · PRODUCTION COMMAND CENTRE</span><h1>One screen. One decision.</h1><p>Historical stats are evidence, not permission to bet. Live permission only exists inside a verified green <b>BET NOW</b> action.</p></div>
        <button type="button" id="productionRefresh" class="prod-refresh" ${state.busy ? 'disabled' : ''}>${state.busy ? 'CHECKING…' : 'REFRESH ALL'}</button>
      </div>
      <div class="prod-master-rule ${allSafe ? 'safe' : ''}"><span>THE ONLY ACTION RULE</span><strong><b>GREEN + BET NOW</b> = act. Anything else = do not bet.</strong><small>Never infer a bet from odds, a horse name, historical ROI, a watchlist or a model signal.</small></div>
      <div class="prod-grid">${renderSystemCard('au', au)}${renderSystemCard('hk', hk)}</div>
      <div class="prod-updated"><span>APP BUILD ${BUILD}</span><span>STATUS CHECK ${esc(updated)}</span>${state.error ? `<span class="prod-error">${esc(state.error)}</span>` : ''}</div>`;

    $('productionRefresh')?.addEventListener('click', refreshAll, { once:true });
    syncTabLabels(au, hk);
    applyAuGuard(au);
    applyHkGuard(hk);
  }

  function syncTabLabels(au, hk) {
    const auButton = document.querySelector('.hk-tab-btn[data-tab="au"]');
    const hkButton = document.querySelector('.hk-tab-btn[data-tab="hk"]');
    if (auButton) auButton.innerHTML = `<span>AUSTRALIA · V11</span><b class="prod-tab-state ${au.tone}">${esc(au.status)}</b>`;
    if (hkButton) hkButton.innerHTML = `<span>HONG KONG · V4</span><b class="prod-tab-state ${hk.tone}">${esc(hk.approved ? hk.status : 'SHADOW')}</b>`;
  }

  function applyAuGuard(status) {
    const shouldGuard = status.mode !== 'today';
    document.body.classList.toggle('prod-au-date-guard', shouldGuard);
    if (!shouldGuard || state.internalAu) return;
    const card = $('decisionCard');
    if (!card) return;
    state.internalAu = true;
    try {
      const title = status.mode === 'future' ? 'WAIT' : 'NO BET';
      card.className = `decision-card ${status.mode === 'future' ? 'waiting' : 'blocked'}`;
      card.dataset.productionDateGuard = status.mode;
      if ($('decisionKicker')) $('decisionKicker').textContent = status.mode === 'future' ? 'AUSTRALIA · NEXT CARD' : 'AUSTRALIA · CARD NOT CURRENT';
      if ($('decisionTitle')) $('decisionTitle').textContent = title;
      if ($('decisionMessage')) $('decisionMessage').textContent = status.reason;
      if ($('lockedBets')) $('lockedBets').innerHTML = '';
      if ($('freshness')) $('freshness').textContent = status.mode === 'future' ? 'NOT RACE DAY · FAIL CLOSED' : 'OLD CARD · FAIL CLOSED';
      if ($('lastChecked')) $('lastChecked').textContent = `TODAY ${prettyDate(perthToday())}`;
      const bottom = $('bottomCommand');
      if (bottom) bottom.className = `bottom-command ${status.mode === 'future' ? 'waiting' : 'blocked'}`;
      if ($('bottomLabel')) $('bottomLabel').textContent = title;
      if ($('bottomText')) $('bottomText').textContent = status.mode === 'future' ? 'Next card loaded. Wait until race day.' : 'Australia race card is out of date.';
      if (document.querySelector('#auRacingPanel.active') || !document.getElementById('hkRacingPanel')) document.title = `${title} · MITCHELL Racing`;
    } finally {
      state.internalAu = false;
    }
  }

  function applyHkGuard(status) {
    const blocked = status.approved !== true;
    document.body.classList.toggle('prod-hk-production-guard', blocked);
    if (!blocked || state.internalHk) return;
    const root = $('hkRacingContent');
    if (!root) return;
    state.internalHk = true;
    try {
      const action = root.querySelector('.hk-action');
      const actionTitle = root.querySelector('.hk-action-title');
      const actionText = root.querySelector('.hk-action-text');
      if (action) action.className = 'hk-action';
      if (actionTitle) actionTitle.textContent = 'WAIT · SHADOW ONLY';
      if (actionText) actionText.textContent = 'HK OPTIMAL V4 is not production-approved. Any qualifying model output is research only and must not become a real-money instruction.';
      root.querySelectorAll('.hk-card.bet').forEach(node => node.classList.remove('bet'));
      root.querySelectorAll('.hk-signal.bet').forEach(node => {
        node.classList.remove('bet');
        const b = node.querySelector('b');
        if (b) b.textContent = 'SHADOW SIGNAL';
      });
      root.querySelectorAll('.hk-status.bet').forEach(node => {
        node.classList.remove('bet');
        node.textContent = 'SHADOW SIGNAL · DO NOT BET';
      });
    } finally {
      state.internalHk = false;
    }
  }

  async function refreshAll() {
    if (state.busy) return;
    state.busy = true;
    state.error = null;
    render();
    try {
      const [au, auStats, hk, hkStats] = await Promise.all([
        getJson(FILES.au), getJson(FILES.auStats), getJson(FILES.hk), getJson(FILES.hkStats)
      ]);
      state.data = { au, auStats, hk, hkStats };
      state.loadedAt = Date.now();
      window.__MITCHELL_PRODUCTION_STATUS = { auDate:cardDate(au), hkDate:hk?.meeting?.date || null, hkProductionApproved:hkStats?.decision?.productionApproved === true, checkedAt:new Date().toISOString() };
      window.dispatchEvent(new CustomEvent('mitchell-production-status', { detail:window.__MITCHELL_PRODUCTION_STATUS }));
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Production status check failed';
    } finally {
      state.busy = false;
      render();
      window.MITCHELL_HK_OPTIMAL_V4_REFRESH?.();
      window.dispatchEvent(new CustomEvent('mitchell-refresh-live', { detail:{ forceBase:true, source:'production-centre' } }));
    }
  }

  function installGuards() {
    const decision = $('decisionCard');
    if (decision) new MutationObserver(() => {
      if (state.internalAu) return;
      const status = auStatus();
      if (status.mode !== 'today') queueMicrotask(() => applyAuGuard(status));
    }).observe(decision, { attributes:true, childList:true, subtree:true, characterData:true });

    const hkRoot = $('hkRacingContent');
    if (hkRoot) new MutationObserver(() => {
      if (state.internalHk) return;
      const status = hkStatus();
      if (status.approved !== true) queueMicrotask(() => applyHkGuard(status));
    }).observe(hkRoot, { attributes:true, childList:true, subtree:true, characterData:true });
  }

  function boot() {
    const waitForShell = () => {
      if (!ensureShell()) return setTimeout(waitForShell, 50);
      installGuards();
      refreshAll();
    };
    waitForShell();
  }

  window.addEventListener('mitchell-live-health', event => { state.health.au = event.detail || null; render(); });
  window.addEventListener('mitchell-preflight-health', event => { state.health.preflight = event.detail || null; render(); });
  window.addEventListener('mitchell-hk-health', event => { state.health.hk = event.detail || null; render(); });
  window.addEventListener('online', () => refreshAll());
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshAll(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  setInterval(() => { render(); if (document.visibilityState === 'visible') refreshAll(); }, REFRESH_MS);
})();
