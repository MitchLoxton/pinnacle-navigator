(() => {
  'use strict';

  const DATA_URL = './hong-kong.json?v=20260904-parity-v2';

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const money = value => num(value) === null ? '—' : new Intl.NumberFormat('en-AU', {
    style:'currency', currency:'AUD', maximumFractionDigits:0
  }).format(Number(value));
  const price = value => num(value) === null ? '—' : '$' + Number(value).toFixed(2);
  const pctFrac = value => num(value) === null ? '—' : (Number(value) * 100).toFixed(1) + '%';
  const n1 = value => num(value) === null ? '—' : Number(value).toFixed(1);

  function addStyles() {
    if (document.getElementById('hk-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'hk-tab-styles';
    style.textContent = `
      .hk-switcher{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}
      .hk-tab-btn{border:1px solid #334961;background:#111e2f;color:#aebed0;padding:9px 13px;border-radius:10px;font-weight:900;font-size:11px;cursor:pointer;text-decoration:none}
      .hk-tab-btn.active{background:#173455;color:#fff;border-color:#4a79a8}
      .hk-panel{display:none}.hk-panel.active{display:block}
      .hk-action{padding:16px;border-radius:15px;margin:0 0 12px;border:1px solid #765f2a;background:#2a2413}
      .hk-action.wait{border-color:#765f2a;background:#2a2413}.hk-action.bet{border-color:#2a8058;background:#0d3525}.hk-action.no{border-color:#74323e;background:#35151d}
      .hk-action-label{font-size:9px;color:#aebed0;font-weight:950;letter-spacing:.08em}.hk-action-title{font-size:26px;font-weight:1000;margin-top:4px;color:#ffc34f}
      .hk-action.bet .hk-action-title{color:#78f2b5}.hk-action.no .hk-action-title{color:#ff9eaa}.hk-action-text{font-size:11px;line-height:1.45;color:#e0e8f2;margin-top:5px}
      .hk-note{padding:12px;border:1px solid #765f2a;background:#2a2413;border-radius:12px;color:#ffe29a;font-size:11px;line-height:1.45;margin-bottom:12px}
      .hk-goodnote{padding:12px;border:1px solid #2a8058;background:#0d2b20;border-radius:12px;color:#b9f6d8;font-size:11px;line-height:1.45;margin-bottom:12px}
      .hk-strategy{padding:12px;border:1px solid #2e435c;background:#0d1725;border-radius:12px;margin-bottom:12px}.hk-strategy h3{font-size:13px;margin:0 0 9px;color:#fff}
      .hk-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hk-rule{padding:9px;border-radius:9px;background:#111f30}.hk-rule span{display:block;color:#7f96ae;font-size:8px;font-weight:900}.hk-rule strong{display:block;color:#dce8f6;font-size:10px;margin-top:3px;line-height:1.3}
      .hk-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}.hk-kpi{padding:10px;border:1px solid #2e435c;border-radius:11px;background:#0f1d2d}.hk-kpi span{display:block;color:#8198af;font-size:8px;font-weight:950}.hk-kpi strong{display:block;color:#fff;font-size:15px;margin-top:4px}.hk-kpi.good strong{color:#78f2b5}.hk-kpi.warn strong{color:#ffc34f}
      .hk-card{padding:12px;border:1px solid #2e435c;background:#0e1928;border-radius:12px;margin-bottom:8px}.hk-card.bet{border-color:#2a8058;background:#0b261c}.hk-card.no{border-color:#64313b}
      .hk-race{font-size:13px;font-weight:950;color:#fff}.hk-meta{margin-top:5px;color:#9eb3ca;font-size:10px;line-height:1.45}.hk-status{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:8px;background:#2a2413;color:#ffc34f;font-size:9px;font-weight:950}.hk-status.bet{background:#0d3525;color:#78f2b5}.hk-status.no{background:#35151d;color:#ff9eaa}
      .hk-signal{margin-top:8px;padding:9px;border:1px solid #31506d;background:#101d2d;border-radius:9px;font-size:10px;color:#dbe6f4;line-height:1.45}.hk-signal.bet{border-color:#2a8058;background:#0d2c20}.hk-signal.no{border-color:#63313b;background:#2a151b}.hk-signal strong{color:#fff}
      .hk-source{display:inline-block;margin-top:10px;color:#8dc8ff;font-size:10px;font-weight:900;text-decoration:none}.hk-small{font-size:9px;color:#8499af;line-height:1.45;margin-top:7px}
      @media(max-width:700px){.hk-kpis{grid-template-columns:1fr 1fr}}@media(max-width:520px){.hk-rule-grid{grid-template-columns:1fr}.hk-kpis{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function findHost() {
    return document.querySelector('main') || document.querySelector('.app') || document.body;
  }

  function buildShell() {
    if (document.getElementById('hkRacingPanel')) return;
    addStyles();
    const host = findHost();
    const originalChildren = [...host.children];

    const switcher = document.createElement('div');
    switcher.className = 'hk-switcher';
    switcher.innerHTML = `
      <button type="button" class="hk-tab-btn active" data-racing-tab="au">AUSTRALIA · V11</button>
      <button type="button" class="hk-tab-btn" data-racing-tab="hk">HONG KONG · PARITY V2</button>`;

    const au = document.createElement('div');
    au.id = 'auRacingPanel';
    au.className = 'hk-panel active';
    originalChildren.forEach(node => au.appendChild(node));

    const hk = document.createElement('div');
    hk.id = 'hkRacingPanel';
    hk.className = 'hk-panel';
    hk.innerHTML = `
      <section style="margin:0 0 12px">
        <div style="font-size:10px;color:#7f96ae;font-weight:950;letter-spacing:.08em">HONG KONG · LOW FREQUENCY</div>
        <h2 style="margin:5px 0 3px;font-size:20px">SHA TIN · SUN 6 SEP</h2>
        <div style="font-size:11px;color:#9eb3ca">HK PARITY V2 · ~38 bets/year historically · separate from Australian V11</div>
      </section>
      <div id="hkRacingContent"><div class="hk-note">Loading Hong Kong Parity V2…</div></div>`;

    host.appendChild(switcher);
    host.appendChild(au);
    host.appendChild(hk);

    switcher.addEventListener('click', event => {
      const btn = event.target.closest('[data-racing-tab]');
      if (!btn) return;
      const tab = btn.dataset.racingTab;
      switcher.querySelectorAll('.hk-tab-btn').forEach(x => x.classList.toggle('active', x === btn));
      au.classList.toggle('active', tab === 'au');
      hk.classList.toggle('active', tab === 'hk');
      if (tab === 'hk') history.replaceState(null, '', location.pathname + location.search + '#hong-kong');
      else history.replaceState(null, '', location.pathname + location.search);
    });

    if (location.hash === '#hong-kong') switcher.querySelector('[data-racing-tab="hk"]')?.click();
  }

  function classifySignal(signal, strategy) {
    const s = signal || {};
    const odds = num(s.odds ?? s.executableOdds);
    const rank = num(s.marketRank);
    const rawEv = num(s.rawModelEv);
    const rules = strategy?.rules || {};

    if (s.r2Core === true) {
      const low = rules.coreLow || {};
      if (odds !== null && odds >= Number(low.minOddsInclusive ?? 5) && odds < Number(low.maxOddsExclusive ?? 8)) {
        return { sleeve:'LOW CORE', stakeAud:Number(low.stakeAud ?? 7892.146394305168) };
      }
      const long = rules.coreLong || {};
      if (odds !== null && odds >= Number(long.minOddsInclusive ?? 20) && odds < Number(long.maxOddsExclusive ?? 30)) {
        return { sleeve:'LONG CORE', stakeAud:Number(long.stakeAud ?? 10000) };
      }
      return { noBet:true, reason:`Verified R2 CORE runner is outside the frozen $5–<8 and $20–<30 price bands (${price(odds)}).` };
    }

    if (s.satelliteOnly === true) {
      const main = rules.mainSatellite || {};
      const extra = rules.extraSatellite || {};
      const mainPrice = odds !== null && odds >= Number(main.minOddsInclusive ?? 4) && odds < Number(main.maxOddsExclusive ?? 7);
      if (mainPrice && rank === null) return { wait:true, reason:'Market rank is required to test the MAIN SAT rule.' };
      if (mainPrice && rank <= Number(main.maxMarketRank ?? 2)) {
        return { sleeve:'MAIN SAT', stakeAud:Number(main.stakeAud ?? 7892.146394305168) };
      }
      if (rawEv === null) return { wait:true, reason:'Original raw model EV is required to test the EXTRA EV SAT rule.' };
      if (rawEv >= Number(extra.minimumOriginalRawModelEv ?? 0.12)) {
        return { sleeve:'EXTRA EV SAT', stakeAud:Number(extra.stakeAud ?? 7892.146394305168) };
      }
      return { noBet:true, reason:'Verified satellite-only runner does not pass MAIN SAT or the +12% EXTRA EV SAT rule.' };
    }

    if (s.r2Core == null || s.satelliteOnly == null) return { wait:true, reason:'R2 CORE / satellite-only model classification is missing.' };
    return { noBet:true, reason:'Runner is not in either frozen V2 model sleeve.' };
  }

  function evaluateSignal(signal, strategy) {
    const s = signal || {};
    const odds = num(s.odds ?? s.executableOdds);
    const wait = reason => ({ status:'WAIT', reason, signal:s });
    const no = reason => ({ status:'NO_BET', reason, signal:s });

    if (!s.horse) return wait('Horse identity is not verified.');
    if (s.modelVerified !== true && s.modelClassificationVerified !== true) return wait('Frozen R2/Rvenue model classification is not verified.');
    if (s.quoteVerified !== true) return wait('Executable WIN price is not verified.');
    if (odds === null || odds <= 1) return wait('Executable decimal odds are missing or invalid.');

    const classified = classifySignal(s, strategy);
    if (classified.wait) return wait(classified.reason);
    if (classified.noBet) return no(classified.reason);

    const stake = Number(classified.stakeAud || 0);
    const hardCap = Number(strategy?.risk?.hardMaxStakeAud ?? 10000);
    if (!(stake > 0) || stake > hardCap) return no(`Frozen stake ${money(stake)} breaches the ${money(hardCap)} hard cap.`);
    if (s.capacityVerified !== true) return wait(`Need verified capacity for the ${money(stake)} ${classified.sleeve} stake.`);
    const capacity = num(s.capacityAud);
    if (capacity === null) return wait(`Verified available/accepted capacity amount is missing; need at least ${money(stake)}.`);
    if (capacity + 0.005 < stake) return no(`Available capacity ${money(capacity)} is below the frozen ${money(stake)} stake.`);

    return {
      status:'BET_NOW',
      reason:`All HK PARITY V2 gates passed. BACK WIN only. ${classified.sleeve}.`,
      sleeve:classified.sleeve,
      stakeAud:stake,
      signal:s
    };
  }

  function signalHtml(result) {
    const s = result.signal || {};
    const cls = result.status === 'BET_NOW' ? 'bet' : result.status === 'NO_BET' ? 'no' : '';
    const title = result.status === 'BET_NOW' ? 'BET NOW' : result.status === 'NO_BET' ? 'NO BET' : 'WAIT';
    const odds = num(s.odds ?? s.executableOdds);
    const extra = result.status === 'BET_NOW' ? ` · ${esc(result.sleeve)} · stake ${money(result.stakeAud)}` : '';
    const details = s.horse ? `<strong>${esc(String(s.horse).toUpperCase())}</strong> · BACK WIN · ${price(odds)}${extra}` : 'Signal not fully populated.';
    return `<div class="hk-signal ${cls}"><b>${title}</b> · ${details}<br><span style="color:#9eb3ca">${esc(result.reason)}</span></div>`;
  }

  function allSignalsForRace(data, race) {
    const local = Array.isArray(race?.signals) ? race.signals : [];
    const global = Array.isArray(data?.signals) ? data.signals.filter(s => Number(s?.race) === Number(race?.race)) : [];
    return [...local, ...global];
  }

  function render(data) {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    const m = data.meeting || {};
    const strategy = data.strategy || {};
    const hist = strategy.historicalHeadline || {};
    const cadence = strategy.historicalCadence || {};
    const feed = strategy.liveFeed || {};
    const races = Array.isArray(data.races) ? data.races : [];
    const evaluated = races.flatMap(r => allSignalsForRace(data, r).map(signal => ({ race:r.race, result:evaluateSignal(signal, strategy) })));
    const bets = evaluated.filter(x => x.result.status === 'BET_NOW');
    const feedReady = feed.modelClassificationVerified === true && feed.executableQuotesVerified === true && feed.capacityVerified === true;
    const fullyScored = races.length > 0 && races.every(r => !String(r.strategyStatus || '').toUpperCase().includes('NOT SCORED'));

    let overall = { cls:'wait', title:'WAIT', text:feed.message || 'Parity V2 is loaded. Do not bet until the frozen model and executable-price gates are verified.' };
    if (bets.length) {
      overall = { cls:'bet', title:'BET NOW', text:`${bets.length} verified HK PARITY V2 selection${bets.length === 1 ? '' : 's'} passed every pre-bet gate. Place only the exact BACK WIN horse and stake shown below, then record the accepted bet.` };
    } else if (feedReady && fullyScored) {
      overall = { cls:'no', title:'NO BET', text:'The meeting has been fully scored and no horse passed the frozen HK PARITY V2 selection and execution gates.' };
    }

    const rules = strategy.rules || {};
    const low = rules.coreLow || {};
    const long = rules.coreLong || {};
    const main = rules.mainSatellite || {};
    const extra = rules.extraSatellite || {};

    root.innerHTML = `
      <div class="hk-action ${overall.cls}" aria-live="assertive">
        <div class="hk-action-label">HONG KONG · YOUR ACTION</div>
        <div class="hk-action-title">${esc(overall.title)}</div>
        <div class="hk-action-text">${esc(overall.text)}</div>
      </div>

      <div class="hk-goodnote"><b>LOW-FREQUENCY MODE:</b> completed-history cadence is ${n1(cadence.betsPerYear)} bets/year versus ${n1(cadence.australiaV11BetsPerYear)} for Australia V11. This is the closest clean Hong Kong match we found without forcing a literal 50-bet curve-fit.</div>

      <div class="hk-kpis">
        <div class="hk-kpi good"><span>HIST BETS / YEAR</span><strong>${n1(cadence.betsPerYear)}</strong></div>
        <div class="hk-kpi good"><span>HIST ROI</span><strong>${pctFrac(hist.roi)}</strong></div>
        <div class="hk-kpi good"><span>HIST AVG / YEAR</span><strong>${money(hist.annualProfitAud)}</strong></div>
        <div class="hk-kpi warn"><span>HIST MAX DD</span><strong>${money(hist.maxDrawdownAud)}</strong></div>
      </div>

      <div class="hk-note"><b>DO NOT CONFUSE BACKTEST WITH FORWARD EXPECTATION.</b> The calibrated model anchor is about ${money(strategy?.prediction?.calibratedModelEvAudPerYear)} per year, materially below the ${money(hist.annualProfitAud)} historical average. The historical drawdown is also much larger than Australia V11.</div>

      <section class="hk-strategy">
        <h3>${esc(strategy.name || 'HK PARITY V2')} · FROZEN RULE</h3>
        <div class="hk-rule-grid">
          <div class="hk-rule"><span>LOW CORE</span><strong>R2 CORE · ${price(low.minOddsInclusive)} to under ${price(low.maxOddsExclusive)} · ${money(low.stakeAud)}</strong></div>
          <div class="hk-rule"><span>LONG CORE</span><strong>R2 CORE · ${price(long.minOddsInclusive)} to under ${price(long.maxOddsExclusive)} · ${money(long.stakeAud)}</strong></div>
          <div class="hk-rule"><span>MAIN SAT</span><strong>Satellite-only · ${price(main.minOddsInclusive)} to under ${price(main.maxOddsExclusive)} · rank 1–${esc(main.maxMarketRank)} · ${money(main.stakeAud)}</strong></div>
          <div class="hk-rule"><span>EXTRA EV SAT</span><strong>Satellite-only · original raw EV ≥ ${pctFrac(extra.minimumOriginalRawModelEv)} · ${money(extra.stakeAud)}</strong></div>
          <div class="hk-rule"><span>MARKET</span><strong>WIN only · BACK only</strong></div>
          <div class="hk-rule"><span>MAX STAKE</span><strong>${money(strategy?.risk?.hardMaxStakeAud)}</strong></div>
          <div class="hk-rule"><span>HISTORICAL STRESS</span><strong>No rebate · winning profit portion 3% worse</strong></div>
          <div class="hk-rule"><span>LIVE GATE</span><strong>Verified model + quote + capacity before green</strong></div>
        </div>
        <div class="hk-small">The rule is frozen. Do not widen price/rank/EV thresholds after seeing future wins or losses just to protect the historical stats.</div>
      </section>

      <div style="margin-bottom:10px;font-size:11px;color:#b7c7d9"><b>${esc(m.status || '')}</b> · ${esc(m.venue || 'Sha Tin')} · ${esc(m.track || 'Turf')} ${esc(m.course || 'A')} Course · V2 feed: <b>${esc(feed.status || 'NOT VERIFIED')}</b></div>

      ${races.map(r => {
        const results = allSignalsForRace(data, r).map(signal => evaluateSignal(signal, strategy));
        const hasBet = results.some(x => x.status === 'BET_NOW');
        const hasNo = !hasBet && results.length && results.every(x => x.status === 'NO_BET');
        const cls = hasBet ? 'bet' : hasNo ? 'no' : '';
        const status = hasBet ? 'BET NOW' : hasNo ? 'NO BET' : (r.strategyStatus || 'WAIT — V2 NOT SCORED');
        return `<div class="hk-card ${cls}">
          <div class="hk-race">HK R${esc(r.race)} · ${esc(r.timeHkt || 'TBC')} · ${esc(r.name || 'Race')}</div>
          <div class="hk-meta">${esc(r.class || '')} · ${esc(r.distanceM)}m</div>
          <div class="hk-status ${cls}">${esc(status)}</div>
          ${results.length ? results.map(signalHtml).join('') : '<div class="hk-small">No verified V2 horse-level model signal loaded yet. Do not choose a horse manually.</div>'}
        </div>`;
      }).join('')}

      <div class="hk-note" style="margin-top:12px"><b>R15 ARCHIVED:</b> the former R15 Balanced research remains reference-only because ~1,071 proxy positions/year is nowhere near the Australia-style cadence you asked for. HK PARITY V2 is now the active Hong Kong research rule.</div>
      <a class="hk-source" href="${esc(m.officialSourceUrl || '#')}" target="_blank" rel="noopener">OPEN OFFICIAL HKJC RACE CARD ↗</a>`;
  }

  async function loadData() {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    try {
      const response = await fetch(DATA_URL, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      render(await response.json());
    } catch (error) {
      root.innerHTML = `<div class="hk-action wait"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">WAIT</div><div class="hk-action-text">Hong Kong Parity V2 data could not be verified. Do not place a Hong Kong bet.</div></div>`;
    }
  }

  window.MITCHELL_HK_PARITY_V2_EVALUATE = evaluateSignal;
  window.MITCHELL_HK_PARITY_V2_REFRESH = loadData;

  function start() {
    buildShell();
    loadData();
    window.addEventListener('online', () => setTimeout(loadData, 100));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(loadData, 100);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
