(() => {
  'use strict';

  const root = document.getElementById('autoRoot');
  const updated = document.getElementById('autoUpdated');
  const SHADOW_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-v11-auto';
  const PUBLISHABLE_KEY = 'sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)) : '—';
  const n1 = v => Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—';
  const pct = v => Number.isFinite(Number(v)) ? `${(Number(v)*100).toFixed(1)}%` : '—';

  async function fetchTimeout(url, options = {}, timeoutMs = 9000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try { return await fetch(url,{ ...options, signal:controller.signal }); }
    finally { clearTimeout(timer); }
  }

  async function getJson(path) {
    const response = await fetchTimeout(path,{ cache:'no-cache' });
    if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
    return response.json();
  }

  async function getShadowHealth() {
    const response = await fetchTimeout(SHADOW_URL,{
      method:'GET', cache:'no-store', headers:{ apikey:PUBLISHABLE_KEY }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok !== true) throw new Error(body?.error || `SHADOW HEALTH HTTP ${response.status}`);
    return body;
  }

  function pill(text, tone='') { return `<span class="pill ${tone}">${esc(text)}</span>`; }
  function row(label, value, tone='') { return `<div class="row"><span>${esc(label)}</span><strong class="${tone}">${esc(value)}</strong></div>`; }
  function isReadyStatus(status) {
    return ['READY','VERIFIED','PASS','ACTIVE','ACTIVE_SCHEDULED','OK','IDLE_NO_TODAY_RACES'].includes(String(status || '').toUpperCase());
  }
  function check(label, status, note='') {
    const normalized = String(status || '').toUpperCase();
    const tone = isReadyStatus(normalized) ? 'good' : normalized === 'MISSING' || normalized === 'BLOCKED' || normalized === 'ERROR' ? '' : 'warn';
    return `<div class="check ${tone}"><span class="dot"></span><div><strong>${esc(label)}</strong><small>${esc(status)}${note ? ` · ${esc(note)}` : ''}</small></div></div>`;
  }
  function ago(value) {
    const ms = Date.now() - Date.parse(value || '');
    if (!Number.isFinite(ms)) return 'never';
    const sec = Math.max(0,Math.round(ms/1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec/60);
    if (min < 60) return `${min}m ago`;
    return `${Math.round(min/60)}h ago`;
  }
  function perthStamp(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Perth',weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(d) + ' Perth';
  }

  function auStatus(config, current) {
    const au = config.australia || {};
    const h = au.historical || {};
    const ready = current?.overallStatus === 'READY';
    const potentials = Array.isArray(current?.watchlist) ? current.watchlist.length : 0;
    const p = au.browserPollingSeconds || {};
    return `<article class="card">
      <span class="eyebrow">AUSTRALIA</span><h2>V11 · FROZEN CHAMPION</h2>
      <p>Predictive rules stay frozen. The live stack now uses adaptive client checks, independent scheduled server shadow monitoring, near-jump bursts, strict source-age/window checks and duplicate-safe execution records.</p>
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
      <p>V4 remains a forward-validation system. Missing model, quote, capacity, meeting-date or daily-risk evidence means WAIT; the app must not invent a horse.</p>
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
      </div>
    </article>`;
  }

  function render(config, current, hkLive, shadowHealth) {
    const liveUnlocked = config.liveExecutionUnlocked === true;
    const checklist = Array.isArray(config.liveUnlockChecklist) ? config.liveUnlockChecklist : [];
    const readyItems = checklist.filter(x => isReadyStatus(x.status)).length;
    const backend = config.shadowBackend || {};
    const burst = backend.nearJumpBurst || {};
    const hb = shadowHealth?.heartbeat || {};
    const hbStatus = String(hb.status || 'UNKNOWN').toUpperCase();
    const hbGood = isReadyStatus(hbStatus);
    const hbBad = hbStatus === 'ERROR' || hbStatus === 'DEGRADED';

    root.innerHTML = `
      <section class="hero">
        <span class="eyebrow">AUTOMATION CONTROL</span>
        <h1>SCHEDULED SHADOW AUTO IS ON</h1>
        <p>The AU V11 shadow worker is independently scheduled and now writes a persistent heartbeat, so this page can prove when the server actually ran instead of merely trusting configuration.</p>
        <div class="mode"><span class="label">CURRENT MASTER MODE</span><strong>${esc(config.masterMode || 'SCHEDULED_SHADOW_AUTO').replaceAll('_',' ')}</strong><p>Missing or stale data = WAIT. Real-money unattended wagering remains locked.</p></div>
      </section>

      <div class="live-lock"><strong>${liveUnlocked ? 'LIVE AUTO UNLOCKED' : 'LIVE AUTO · LOCKED'}</strong><p>${esc(config.liveExecutionReason || '')}</p></div>

      <section class="section">
        <span class="eyebrow">VERIFIED SERVER HEARTBEAT</span><h2 class="${hbBad?'badtxt':hbGood?'goodtxt':'warntxt'}">${esc(hbStatus.replaceAll('_',' '))}</h2>
        <p>This comes from the Supabase shadow worker's private heartbeat table, not from the static GitHub config.</p>
        <div class="rows">
          ${row('Last start', hb.last_started_at ? `${perthStamp(hb.last_started_at)} · ${ago(hb.last_started_at)}` : 'Never')}
          ${row('Last finish', hb.last_finished_at ? `${perthStamp(hb.last_finished_at)} · ${ago(hb.last_finished_at)}` : 'Never', hbGood ? 'goodtxt' : hbBad ? 'badtxt' : 'warntxt')}
          ${row('Last run date', hb.run_date || '—')}
          ${row('Races processed', String(hb.processed ?? 0))}
          ${row('Near-jump burst checks', String(hb.burst_checks ?? 0))}
          ${row('Last error', hb.error || 'None', hb.error ? 'badtxt' : 'goodtxt')}
        </div>
      </section>

      <section class="section">
        <span class="eyebrow">SERVER SHADOW ENGINE</span><h2>${esc(String(backend.status || 'UNKNOWN').replaceAll('_',' '))}</h2>
        <p>${esc(backend.note || 'Server shadow status unavailable.')}</p>
        <div class="rows">
          ${row('Worker', backend.function || '—', isReadyStatus(backend.status) ? 'goodtxt' : 'warntxt')}
          ${row('Recurring scheduler', backend.scheduled === true ? 'ACTIVE' : 'NOT YET', backend.scheduled === true ? 'goodtxt' : 'warntxt')}
          ${row('Schedule', backend.schedule || '—')}
          ${row('Near-jump burst', burst.enabled === true ? `${burst.intervalSeconds}s checks inside ${burst.windowSeconds}s · up to ${burst.maxBurstDurationSeconds}s per cron run` : 'OFF', burst.enabled === true ? 'goodtxt' : 'warntxt')}
          ${row('Can place wagers', backend.placesWagers === true ? 'YES' : 'NO — LOCKED', backend.placesWagers === true ? 'goodtxt' : 'badtxt')}
        </div>
      </section>

      <div class="grid">${auStatus(config,current)}${hkStatus(config,hkLive)}</div>

      <section class="simple"><h2>THE EASY VERSION</h2><div class="steps">
        <div class="step"><b>1. LIVE:</b> green BET NOW = exact instruction. Yellow WAIT or red NO BET = do nothing.</div>
        <div class="step"><b>2. Race-day assist:</b> near a watched AU race the app can keep the screen awake when supported; opt-in bet alerts are available in the health strip.</div>
        <div class="step"><b>3. Server shadow:</b> Saturday monitoring continues server-side even if the browser closes, with near-jump burst checks for audit/forward validation.</div>
        <div class="step"><b>4. Full auto:</b> stays locked until genuine bookmaker execution, fill callbacks and exposure controls are connected.</div>
      </div></section>

      <section class="section">
        <span class="eyebrow">FULL AUTO UNLOCK</span><h2>${readyItems} / ${checklist.length} EXECUTION ITEMS READY</h2>
        <p>PARTIAL does not count as ready. The real-money execution lock remains until every critical item is genuine.</p>
        <div style="height:8px;border-radius:999px;background:#162437;overflow:hidden;margin:10px 0 12px"><div style="height:100%;width:${checklist.length ? (readyItems/checklist.length)*100 : 0}%;background:#78f2b5"></div></div>
        <div class="checklist">${checklist.map(x => check(x.label,x.status)).join('')}</div>
      </section>

      <section class="section">
        <span class="eyebrow">SYSTEM DISCIPLINE</span><h2>PREDICTIVE RULES STAY FROZEN</h2>
        <p>Operational reliability is being improved without repeatedly retuning historical selections. That keeps forward evidence cleaner and reduces the temptation to optimise old losses away.</p>
        <button class="refresh" id="refreshAuto" type="button">REFRESH STATUS</button>
        <div class="updated">Refresh reads the live server heartbeat as well as the static strategy/config files.</div>
      </section>`;

    updated.textContent = `Heartbeat ${hb.last_finished_at ? perthStamp(hb.last_finished_at) : '—'} · Config ${config.updatedAt || '—'} · AU ${current?.updatedAt || '—'} · HK ${hkLive?.updatedAt || '—'}`;
    document.getElementById('refreshAuto')?.addEventListener('click', reload);
    window.MITCHELL_AUTOMATION_STATUS = { config,current,hongKong:hkLive,shadowHealth,liveExecutionUnlocked:liveUnlocked,readyItems,totalItems:checklist.length };
  }

  async function reload() {
    const button = document.getElementById('refreshAuto');
    if (button) button.disabled = true;
    try {
      const [config,current,hkLive,shadowHealth] = await Promise.all([
        getJson('./automation-config.json?v=3'),
        getJson('./current.json'),
        getJson('./hong-kong.json?v=20260904-optimal-v4'),
        getShadowHealth()
      ]);
      render(config,current,hkLive,shadowHealth);
    } catch (error) {
      console.error(error);
      root.innerHTML = `<section class="hero"><span class="eyebrow">AUTOMATION CONTROL</span><h1 style="color:#ff9eaa">AUTO STATUS UNVERIFIED</h1><p>The automation safety state or live server heartbeat could not be verified. Treat the automation layer as OFF / WAIT. Real-money automated action is not permitted.</p></section><div class="live-lock"><strong>LIVE AUTO · LOCKED</strong><p>${esc(error instanceof Error ? error.message : 'Unknown loading error')}</p></div>`;
      updated.textContent = 'Automation status failed closed';
      window.MITCHELL_AUTOMATION_STATUS = { liveExecutionUnlocked:false,error:String(error) };
    } finally {
      if (button) button.disabled = false;
    }
  }

  reload();
})();