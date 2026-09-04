(() => {
  'use strict';

  const root = document.getElementById('autoRoot');
  const updated = document.getElementById('autoUpdated');
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)) : '—';
  const n1 = v => Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—';
  const pct = v => Number.isFinite(Number(v)) ? `${(Number(v)*100).toFixed(1)}%` : '—';

  async function getJson(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(path, { cache:'no-cache', signal:controller.signal });
      if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function pill(text, tone='') { return `<span class="pill ${tone}">${esc(text)}</span>`; }
  function row(label, value, tone='') { return `<div class="row"><span>${esc(label)}</span><strong class="${tone}">${esc(value)}</strong></div>`; }
  function isReadyStatus(status) {
    return ['READY','VERIFIED','PASS','ACTIVE','ACTIVE_SCHEDULED'].includes(String(status || '').toUpperCase());
  }
  function check(label, status, note='') {
    const normalized = String(status || '').toUpperCase();
    const tone = isReadyStatus(normalized) ? 'good' : normalized === 'MISSING' || normalized === 'BLOCKED' ? '' : 'warn';
    return `<div class="check ${tone}"><span class="dot"></span><div><strong>${esc(label)}</strong><small>${esc(status)}${note ? ` · ${esc(note)}` : ''}</small></div></div>`;
  }

  function auStatus(config, current) {
    const au = config.australia || {};
    const h = au.historical || {};
    const ready = current?.overallStatus === 'READY';
    const potentials = Array.isArray(current?.watchlist) ? current.watchlist.length : 0;
    const p = au.browserPollingSeconds || {};
    return `<article class="card">
      <span class="eyebrow">AUSTRALIA</span><h2>V11 · FROZEN CHAMPION</h2>
      <p>The predictive selection rules stay frozen. The upgrades are now operational: adaptive browser polling, scheduled server shadow checks, near-jump burst monitoring, execution-record duplicate protection and fail-closed accounting.</p>
      <div class="status-row">${pill(ready ? 'RACE-DAY DATA READY' : 'DATA NOT READY', ready ? 'good' : 'warn')}${pill('SERVER SHADOW SCHEDULED','good')}${pill('LIVE EXECUTION LOCKED','bad')}</div>
      <div class="rows">
        ${row('Current V11 potentials', String(potentials), potentials ? 'warntxt' : '')}
        ${row('Browser polling', `${p.far ?? 15}s far · ${p.near ?? 5}s near · ${p.hot ?? 2.5}s hot`, 'goodtxt')}
        ${row('Server near-jump shadow burst', `${au.serverShadowBurstSeconds ?? 4}s`, 'goodtxt')}
        ${row('Execution record duplicate guard', au.executionRecordIdempotent === true ? 'READY' : '—', au.executionRecordIdempotent === true ? 'goodtxt' : '')}
        ${row('Historical bets / year', n1(h.betsPerYear))}
        ${row('Historical ROI', pct(h.historicalRoi), 'goodtxt')}
        ${row('Historical avg / year', money(h.annualHistoricalProfitAud), 'goodtxt')}
        ${row('Recorded / reorder DD', `${money(h.recordedMaxDrawdownAud)} / ${money(h.reorderStressMaxDrawdownAud)}`)}
        ${row('Minimum live price', `$${Number(au.minimumAcceptedPrice || 3).toFixed(2)}+`)}
        ${row('Signal window', `${au.signalWindowSeconds?.open ?? 20}s → ${au.signalWindowSeconds?.cutoff ?? 10}s pre-jump`)}
        ${row('Hard model stake cap', money(au.hardMaxStakeAud))}
        ${row('Post-target protected floor', money(au.safeFloorAud))}
      </div>
    </article>`;
  }

  function hkStatus(config, hkLive) {
    const hk = config.hongKong || {};
    const h = hk.historical || {};
    const feed = hkLive?.strategy?.liveFeed || {};
    const meetingDate = hkLive?.meeting?.date || '';
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Perth',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const feedReady = meetingDate === today && feed.modelClassificationVerified === true && feed.calibratedModelEvVerified === true && feed.executableQuotesVerified === true && feed.capacityVerified === true && feed.yearBetCountVerified === true && feed.todayRiskVerified === true;
    return `<article class="card">
      <span class="eyebrow">HONG KONG</span><h2>OPTIMAL V4 · FROZEN SHADOW</h2>
      <p>V4 stays frozen for genuine forward validation. Real-money execution remains locked; missing model, quote, capacity, date or daily-risk gates always mean WAIT.</p>
      <div class="status-row">${pill(feedReady ? 'BASE LIVE GATES VERIFIED' : 'LIVE MODEL/QUOTE GATES INCOMPLETE', feedReady ? 'good' : 'warn')}${pill('SHADOW EVALUATION ON','good')}${pill('LIVE EXECUTION LOCKED','bad')}</div>
      <div class="rows">
        ${row('Loaded meeting date', meetingDate || '—', meetingDate === today ? 'goodtxt' : 'warntxt')}
        ${row('Historical bets / year', n1(h.betsPerYear))}
        ${row('Busiest completed year', `${h.maxBetsAnyCompletedYear ?? '—'} / 100`)}
        ${row('Historical ROI', pct(h.historicalRoi), 'goodtxt')}
        ${row('Historical avg / year', money(h.annualHistoricalProfitAud), 'goodtxt')}
        ${row('Stored / P95 sequence DD', `${money(h.storedHistoricalMaxDrawdownAud)} / ${money(h.p95DayBlockSequenceDrawdownAud)}`)}
        ${row('Maximum per race', '1 selection')}
        ${row('Maximum per race day', `${hk.maxConfirmedBetsPerRaceDay ?? 2} confirmed bets`)}
        ${row('Daily loss stop', `No new bet at ≤ -${money(hk.dailyRealizedLossStopAud)}`)}
        ${row('Hard calendar-year cap', `${hk.maxConfirmedBetsPerCalendarYear ?? 100} bets`)}
      </div>
    </article>`;
  }

  function render(config, current, hkLive) {
    const liveUnlocked = config.liveExecutionUnlocked === true;
    const checklist = Array.isArray(config.liveUnlockChecklist) ? config.liveUnlockChecklist : [];
    const readyItems = checklist.filter(x => isReadyStatus(x.status)).length;
    const backend = config.shadowBackend || {};
    const burst = backend.nearJumpBurst || {};
    root.innerHTML = `
      <section class="hero">
        <span class="eyebrow">AUTOMATION CONTROL</span>
        <h1>SCHEDULED SHADOW AUTO IS ON</h1>
        <p>Australia V11 now has an independent scheduled server shadow monitor. Near a watched jump it switches into a short burst loop, so shadow evaluation is no longer dependent on your phone/browser staying awake. It still cannot submit real-money wagers.</p>
        <div class="mode"><span class="label">CURRENT MASTER MODE</span><strong>${esc(config.masterMode || 'SCHEDULED_SHADOW_AUTO').replaceAll('_',' ')}</strong><p>Missing or stale data = WAIT. No guessed horse, price, stake, capacity, race-day P/L or execution result is allowed.</p></div>
      </section>

      <div class="live-lock"><strong>${liveUnlocked ? 'LIVE AUTO UNLOCKED' : 'LIVE AUTO · LOCKED'}</strong><p>${esc(config.liveExecutionReason || '')}</p></div>

      <section class="section">
        <span class="eyebrow">SERVER SHADOW ENGINE</span><h2>${esc(String(backend.status || 'UNKNOWN').replaceAll('_',' '))}</h2>
        <p>${esc(backend.note || 'Server shadow status unavailable.')}</p>
        <div class="rows">
          ${row('Worker', backend.function || '—', isReadyStatus(backend.status) ? 'goodtxt' : 'warntxt')}
          ${row('Role', String(backend.role || '—').replaceAll('_',' '))}
          ${row('Recurring scheduler', backend.scheduled === true ? 'ACTIVE' : 'NOT YET', backend.scheduled === true ? 'goodtxt' : 'warntxt')}
          ${row('Schedule', backend.schedule || '—')}
          ${row('Near-jump burst', burst.enabled === true ? `${burst.intervalSeconds}s checks inside ${burst.windowSeconds}s · up to ${burst.maxBurstDurationSeconds}s per cron run` : 'OFF', burst.enabled === true ? 'goodtxt' : 'warntxt')}
          ${row('Can place wagers', backend.placesWagers === true ? 'YES' : 'NO — LOCKED', backend.placesWagers === true ? 'goodtxt' : 'badtxt')}
        </div>
      </section>

      <div class="grid">${auStatus(config,current)}${hkStatus(config,hkLive)}</div>

      <section class="simple">
        <h2>THE EASY VERSION</h2>
        <div class="steps">
          <div class="step"><b>1. Normal use:</b> open LIVE. Green BET NOW = follow the exact instruction. Yellow WAIT or red NO BET = do nothing.</div>
          <div class="step"><b>2. Race-day assist:</b> near a watched AU race the app can keep the screen awake when supported, and you can enable opt-in bet alerts from the health strip.</div>
          <div class="step"><b>3. Server shadow:</b> Saturday monitoring continues server-side even if the browser closes; near jump it burst-checks every few seconds for audit/forward validation.</div>
          <div class="step"><b>4. Future full auto:</b> remains locked until bookmaker execution, fill callbacks, exposure controls and the remaining checklist items are real.</div>
        </div>
      </section>

      <section class="section">
        <span class="eyebrow">FULL AUTO UNLOCK</span><h2>${readyItems} / ${checklist.length} EXECUTION ITEMS READY</h2>
        <p>This is deliberately strict. LIVE AUTO stays locked until every execution-critical item is real and verified; PARTIAL readiness does not count as complete.</p>
        <div style="height:8px;border-radius:999px;background:#162437;overflow:hidden;margin:10px 0 12px"><div style="height:100%;width:${checklist.length ? (readyItems/checklist.length)*100 : 0}%;background:#78f2b5"></div></div>
        <div class="checklist">${checklist.map(x => check(x.label,x.status)).join('')}</div>
      </section>

      <section class="section">
        <span class="eyebrow">WHY BOTH STRATEGIES ARE NOW FROZEN</span><h2>STOP OPTIMISING THE OLD RESULTS</h2>
        <p>Australia has reached the point where forward accepted-price/fill evidence is more valuable than another same-history parameter search. Hong Kong V4 also carries a sequencing-overfit warning. Improvements now come from execution quality, cleaner feeds, forward validation and operational reliability — not retroactively deleting losses.</p>
        <div class="rows">
          ${row('AU predictive retune', config.australia?.predictiveRetune || 'STOPPED', 'goodtxt')}
          ${row('HK predictive retune', config.hongKong?.predictiveRetune || 'STOPPED', 'goodtxt')}
          ${row('AU next edge', 'Accepted-price quality + fill rate + exposure control')}
          ${row('HK next edge', 'Fresh forward validation + verified executable quotes/capacity')}
        </div>
        <button class="refresh" id="refreshAuto" type="button">REFRESH STATUS</button>
        <div class="updated">This page refreshes only when you press the button, avoiding unnecessary GitHub Pages polling.</div>
      </section>`;

    updated.textContent = `Config ${config.updatedAt || '—'} · AU ${current?.updatedAt || '—'} · HK ${hkLive?.updatedAt || '—'}`;
    document.getElementById('refreshAuto')?.addEventListener('click', reload);
    window.MITCHELL_AUTOMATION_STATUS = { config, current, hongKong:hkLive, liveExecutionUnlocked:liveUnlocked, readyItems, totalItems:checklist.length };
  }

  async function reload() {
    const button = document.getElementById('refreshAuto');
    if (button) button.disabled = true;
    try {
      const [config,current,hkLive] = await Promise.all([
        getJson('./automation-config.json?v=3'),
        getJson('./current.json'),
        getJson('./hong-kong.json?v=20260904-optimal-v4')
      ]);
      render(config,current,hkLive);
    } catch (error) {
      console.error(error);
      root.innerHTML = `<section class="hero"><span class="eyebrow">AUTOMATION CONTROL</span><h1 style="color:#ff9eaa">AUTO STATUS UNVERIFIED</h1><p>The automation safety state could not be loaded. Treat both systems as OFF / WAIT. No real-money automated action is permitted.</p></section><div class="live-lock"><strong>LIVE AUTO · LOCKED</strong><p>${esc(error instanceof Error ? error.message : 'Unknown loading error')}</p></div>`;
      updated.textContent = 'Automation status failed closed';
      window.MITCHELL_AUTOMATION_STATUS = { liveExecutionUnlocked:false, error:String(error) };
    } finally {
      if (button) button.disabled = false;
    }
  }

  reload();
})();