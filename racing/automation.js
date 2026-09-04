(() => {
  'use strict';

  const root = document.getElementById('autoRoot');
  const updated = document.getElementById('autoUpdated');
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)) : '—';
  const n1 = v => Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—';
  const pct = v => Number.isFinite(Number(v)) ? `${(Number(v)*100).toFixed(1)}%` : '—';

  async function getJson(path) {
    const response = await fetch(path, { cache:'no-cache' });
    if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
    return response.json();
  }

  function pill(text, tone='') { return `<span class="pill ${tone}">${esc(text)}</span>`; }
  function row(label, value, tone='') { return `<div class="row"><span>${esc(label)}</span><strong class="${tone}">${esc(value)}</strong></div>`; }
  function check(label, status, note='') {
    const normalized = String(status || '').toUpperCase();
    const tone = normalized === 'READY' || normalized === 'VERIFIED' || normalized === 'PASS' ? 'good' : normalized === 'MISSING' || normalized === 'BLOCKED' ? '' : 'warn';
    return `<div class="check ${tone}"><span class="dot"></span><div><strong>${esc(label)}</strong><small>${esc(status)}${note ? ` · ${esc(note)}` : ''}</small></div></div>`;
  }

  function auStatus(config, current) {
    const au = config.australia || {};
    const h = au.historical || {};
    const ready = current?.overallStatus === 'READY';
    const potentials = Array.isArray(current?.watchlist) ? current.watchlist.length : 0;
    return `<article class="card">
      <span class="eyebrow">AUSTRALIA</span><h2>V11 · FROZEN CHAMPION</h2>
      <p>The predictive selection rules stay frozen. Automation is focused on monitoring, execution quality, safe-floor control and honest accepted-fill accounting.</p>
      <div class="status-row">${pill(ready ? 'RACE-DAY DATA READY' : 'DATA NOT READY', ready ? 'good' : 'warn')}${pill('SHADOW AUTO ON','good')}${pill('LIVE EXECUTION LOCKED','bad')}</div>
      <div class="rows">
        ${row('Current V11 potentials', String(potentials), potentials ? 'warntxt' : '')}
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
    const feedReady = feed.modelClassificationVerified === true && feed.calibratedModelEvVerified === true && feed.executableQuotesVerified === true && feed.capacityVerified === true && feed.yearBetCountVerified === true && feed.todayRiskVerified === true;
    return `<article class="card">
      <span class="eyebrow">HONG KONG</span><h2>OPTIMAL V4 · FROZEN SHADOW</h2>
      <p>V4 stays frozen for genuine forward validation. It can be evaluated automatically, but real-money execution remains locked and missing live gates always mean WAIT.</p>
      <div class="status-row">${pill(feedReady ? 'ALL MODEL FEEDS VERIFIED' : 'LIVE MODEL/QUOTE GATES INCOMPLETE', feedReady ? 'good' : 'warn')}${pill('SHADOW AUTO ON','good')}${pill('LIVE EXECUTION LOCKED','bad')}</div>
      <div class="rows">
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
    root.innerHTML = `
      <section class="hero">
        <span class="eyebrow">AUTOMATION CONTROL</span>
        <h1>SHADOW AUTO IS ON</h1>
        <p>The app can automatically monitor, evaluate and prepare decisions. It deliberately cannot submit real-money wagers yet. A browser tab is the control screen — genuine unattended execution must run on an always-on backend.</p>
        <div class="mode"><span class="label">CURRENT MASTER MODE</span><strong>${esc(config.masterMode || 'SHADOW_AUTO').replaceAll('_',' ')}</strong><p>Missing or stale data = WAIT. No guessed horse, price, stake, capacity, race-day P/L or execution result is allowed.</p></div>
      </section>

      <div class="live-lock"><strong>${liveUnlocked ? 'LIVE AUTO UNLOCKED' : 'LIVE AUTO · LOCKED'}</strong><p>${esc(config.liveExecutionReason || '')}</p></div>

      <div class="grid">${auStatus(config,current)}${hkStatus(config,hkLive)}</div>

      <section class="simple">
        <h2>THE EASY VERSION</h2>
        <div class="steps">
          <div class="step"><b>1. Normal use:</b> open LIVE. If the giant action box is not green and saying BET NOW, do nothing.</div>
          <div class="step"><b>2. Shadow auto:</b> the system can monitor and calculate automatically, but you still place any approved wager manually and record the actual accepted fill.</div>
          <div class="step"><b>3. Future full auto:</b> once the server execution chain below is genuinely connected and tested, this tab can become the master status/kill-switch screen.</div>
        </div>
      </section>

      <section class="section">
        <span class="eyebrow">FULL AUTO UNLOCK</span><h2>WHAT IS STILL MISSING</h2>
        <p>I have not faked any of these. LIVE AUTO remains locked until every execution-critical item is real and verified.</p>
        <div class="checklist">${checklist.map(x => check(x.label,x.status)).join('')}</div>
      </section>

      <section class="section">
        <span class="eyebrow">WHY BOTH STRATEGIES ARE NOW FROZEN</span><h2>STOP OPTIMISING THE OLD RESULTS</h2>
        <p>Australia has already reached the point where forward accepted-price/fill evidence is more valuable than another same-history parameter search. Hong Kong V4 also carries a sequencing-overfit warning. The next improvements should come from live execution quality, cleaner feeds, forward validation and operational reliability — not retroactively deleting losses.</p>
        <div class="rows">
          ${row('AU predictive retune', config.australia?.predictiveRetune || 'STOPPED', 'goodtxt')}
          ${row('HK predictive retune', config.hongKong?.predictiveRetune || 'STOPPED', 'goodtxt')}
          ${row('AU next edge', 'Better accepted price + fill rate + safe-floor execution')}
          ${row('HK next edge', 'Fresh forward validation + verified executable quotes/capacity')}
        </div>
        <button class="refresh" id="refreshAuto" type="button">REFRESH STATUS</button>
        <div class="updated">This page refreshes only when you press the button, avoiding unnecessary GitHub Pages polling.</div>
      </section>`;

    updated.textContent = `Config ${config.updatedAt || '—'} · AU ${current?.updatedAt || '—'} · HK ${hkLive?.updatedAt || '—'}`;
    document.getElementById('refreshAuto')?.addEventListener('click', reload);
    window.MITCHELL_AUTOMATION_STATUS = { config, current, hongKong: hkLive, liveExecutionUnlocked: liveUnlocked };
  }

  async function reload() {
    const button = document.getElementById('refreshAuto');
    if (button) button.disabled = true;
    try {
      const [config,current,hkLive] = await Promise.all([
        getJson('./automation-config.json?v=1'),
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
