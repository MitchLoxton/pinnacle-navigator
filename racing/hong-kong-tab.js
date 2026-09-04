(() => {
  'use strict';

  const DATA_URL = './hong-kong.json?v=20260904-r15';

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const money = value => num(value) === null ? '—' : new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  }).format(Number(value));
  const price = value => num(value) === null ? '—' : '$' + Number(value).toFixed(2);
  const pct = value => num(value) === null ? '—' : (Number(value) * 100).toFixed(1) + '%';

  function addStyles() {
    if (document.getElementById('hk-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'hk-tab-styles';
    style.textContent = `
      .hk-switcher{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}
      .hk-tab-btn{border:1px solid #334961;background:#111e2f;color:#aebed0;padding:9px 13px;border-radius:10px;font-weight:900;font-size:11px;cursor:pointer}
      .hk-tab-btn.active{background:#173455;color:#fff;border-color:#4a79a8}
      .hk-panel{display:none}
      .hk-panel.active{display:block}
      .hk-action{padding:16px;border-radius:15px;margin:0 0 12px;border:1px solid #765f2a;background:#2a2413}
      .hk-action.wait{border-color:#765f2a;background:#2a2413}.hk-action.bet{border-color:#2a8058;background:#0d3525}.hk-action.no{border-color:#74323e;background:#35151d}
      .hk-action-label{font-size:9px;color:#aebed0;font-weight:950;letter-spacing:.08em}.hk-action-title{font-size:26px;font-weight:1000;margin-top:4px;color:#ffc34f}
      .hk-action.bet .hk-action-title{color:#78f2b5}.hk-action.no .hk-action-title{color:#ff9eaa}.hk-action-text{font-size:11px;line-height:1.45;color:#e0e8f2;margin-top:5px}
      .hk-note{padding:12px;border:1px solid #765f2a;background:#2a2413;border-radius:12px;color:#ffe29a;font-size:11px;line-height:1.45;margin-bottom:12px}
      .hk-strategy{padding:12px;border:1px solid #2e435c;background:#0d1725;border-radius:12px;margin-bottom:12px}.hk-strategy h3{font-size:13px;margin:0 0 9px;color:#fff}.hk-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hk-rule{padding:9px;border-radius:9px;background:#111f30}.hk-rule span{display:block;color:#7f96ae;font-size:8px;font-weight:900}.hk-rule strong{display:block;color:#dce8f6;font-size:10px;margin-top:3px;line-height:1.3}
      .hk-card{padding:12px;border:1px solid #2e435c;background:#0e1928;border-radius:12px;margin-bottom:8px}.hk-card.bet{border-color:#2a8058;background:#0b261c}.hk-card.no{border-color:#64313b}
      .hk-race{font-size:13px;font-weight:950;color:#fff}.hk-meta{margin-top:5px;color:#9eb3ca;font-size:10px;line-height:1.45}.hk-status{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:8px;background:#2a2413;color:#ffc34f;font-size:9px;font-weight:950}.hk-status.bet{background:#0d3525;color:#78f2b5}.hk-status.no{background:#35151d;color:#ff9eaa}
      .hk-signal{margin-top:8px;padding:9px;border:1px solid #31506d;background:#101d2d;border-radius:9px;font-size:10px;color:#dbe6f4;line-height:1.45}.hk-signal.bet{border-color:#2a8058;background:#0d2c20}.hk-signal.no{border-color:#63313b;background:#2a151b}.hk-signal strong{color:#fff}
      .hk-source{display:inline-block;margin-top:10px;color:#8dc8ff;font-size:10px;font-weight:900;text-decoration:none}.hk-small{font-size:9px;color:#8499af;line-height:1.45;margin-top:7px}
      @media(max-width:520px){.hk-rule-grid{grid-template-columns:1fr}}
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
      <button type="button" class="hk-tab-btn" data-racing-tab="hk">HONG KONG · R15</button>`;

    const au = document.createElement('div');
    au.id = 'auRacingPanel';
    au.className = 'hk-panel active';
    originalChildren.forEach(node => au.appendChild(node));

    const hk = document.createElement('div');
    hk.id = 'hkRacingPanel';
    hk.className = 'hk-panel';
    hk.innerHTML = `
      <section style="margin:0 0 12px">
        <div style="font-size:10px;color:#7f96ae;font-weight:950;letter-spacing:.08em">HONG KONG · R15 BALANCED</div>
        <h2 style="margin:5px 0 3px;font-size:20px">SHA TIN · SUN 6 SEP</h2>
        <div style="font-size:11px;color:#9eb3ca">10 races · Turf A Course · Perth/Hong Kong time · separate from Australian V11</div>
      </section>
      <div id="hkRacingContent"><div class="hk-note">Loading Hong Kong R15 strategy…</div></div>`;

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

  function evaluateSignal(signal, strategy) {
    const s = signal || {};
    const action = String(s.action || '').toUpperCase();
    const market = String(s.market || '').toUpperCase();
    const channel = String(s.channel || '').toUpperCase();
    const odds = num(s.odds);
    const netEv = num(s.netEv);
    const riskAud = num(s.riskAud);
    const targetCap = num(strategy?.risk?.targetRiskPerPositionAud) ?? 5000;
    const hardCap = num(strategy?.risk?.absoluteHardMaxAud) ?? 8000;
    const minEv = num(strategy?.execution?.minimumNetEv) ?? 0.01;

    const wait = reason => ({ status:'WAIT', reason, signal:s });
    const no = reason => ({ status:'NO_BET', reason, signal:s });

    if (!s.horse) return wait('Horse identity is not verified.');
    if (s.modelVerified !== true) return wait('R4C/R8 model probability is not verified.');
    if (s.portfolioVerified !== true) return wait('R15 portfolio decision is not verified.');
    if (s.quoteVerified !== true) return wait('Executable price is not verified.');
    if (s.capacityVerified !== true) return wait('Accepted capacity is not verified.');
    if (!['BACK','LAY','PASS'].includes(action)) return wait('R15 action is missing.');
    if (action === 'PASS') return no('R15 portfolio says PASS.');
    if (!['WIN','PLACE'].includes(market)) return no('Market is outside R15 WIN/PLACE scope.');
    if (odds === null) return wait('Executable odds are missing.');

    const bounds = strategy?.markets?.[market] || {};
    if (market === 'WIN') {
      const min = num(bounds.minOdds) ?? 1.5;
      const max = num(bounds.maxOddsInclusive) ?? 6;
      if (odds < min || odds > max) return no(`WIN price ${price(odds)} is outside ${price(min)}–${price(max)}.`);
    } else {
      const min = num(bounds.minOdds) ?? 1.1;
      const max = num(bounds.maxOddsExclusive) ?? 10;
      if (odds < min || odds >= max) return no(`PLACE price ${price(odds)} is outside ${price(min)}–<${price(max)}.`);
    }

    if (action === 'LAY' && channel !== 'EXCHANGE') return no('LAY is Exchange-only.');
    if (netEv === null) return wait('Net expected value is not verified.');
    if (netEv < minEv) return no(`Net EV ${pct(netEv)} is below the +${pct(minEv)} safety gate.`);
    if (riskAud === null || riskAud <= 0) return wait('Risk amount is not verified.');
    if (riskAud > hardCap) return no(`Risk ${money(riskAud)} breaches the absolute ${money(hardCap)} hard maximum.`);
    if (riskAud > targetCap) return no(`Risk ${money(riskAud)} exceeds the active R15 Balanced ${money(targetCap)} position cap.`);

    return {
      status:'BET_NOW',
      reason:'All R15 Balanced model, price, EV, capacity and risk gates passed.',
      signal:s
    };
  }

  function signalHtml(result) {
    const s = result.signal || {};
    const cls = result.status === 'BET_NOW' ? 'bet' : result.status === 'NO_BET' ? 'no' : '';
    const title = result.status === 'BET_NOW' ? 'BET NOW' : result.status === 'NO_BET' ? 'NO BET' : 'WAIT';
    const details = s.horse ? `<strong>${esc(String(s.horse).toUpperCase())}</strong> · ${esc(String(s.action || '').toUpperCase())} ${esc(String(s.market || '').toUpperCase())} · ${price(s.odds)} · risk ${money(s.riskAud)}${num(s.netEv) !== null ? ` · net EV ${pct(s.netEv)}` : ''}` : 'Signal not fully populated.';
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
    const races = Array.isArray(data.races) ? data.races : [];
    const evaluated = races.flatMap(r => allSignalsForRace(data, r).map(signal => ({ race:r.race, result:evaluateSignal(signal, strategy) })));
    const bets = evaluated.filter(x => x.result.status === 'BET_NOW');
    const feed = strategy.liveFeed || {};
    const feedReady = feed.modelProbabilitiesVerified === true && feed.executableQuotesVerified === true && feed.capacityVerified === true;
    const fullyScored = races.length > 0 && races.every(r => !String(r.strategyStatus || '').toUpperCase().includes('NOT SCORED'));

    let overall = { cls:'wait', title:'WAIT', text:feed.message || 'R15 is loaded. Do not bet until live model and executable quote gates are verified.' };
    if (bets.length) {
      overall = { cls:'bet', title:'BET NOW', text:`${bets.length} fully verified R15 position${bets.length === 1 ? '' : 's'} passed every gate. Place only the exact horse, market, side, price/risk shown below.` };
    } else if (feedReady && fullyScored) {
      overall = { cls:'no', title:'NO BET', text:'The meeting has been scored and no R15 position passed every model, price, EV, capacity and risk gate.' };
    }

    const winMin = strategy?.markets?.WIN?.minOdds ?? 1.5;
    const winMax = strategy?.markets?.WIN?.maxOddsInclusive ?? 6;
    const placeMin = strategy?.markets?.PLACE?.minOdds ?? 1.1;
    const placeMax = strategy?.markets?.PLACE?.maxOddsExclusive ?? 10;
    const riskCap = strategy?.risk?.targetRiskPerPositionAud ?? 5000;
    const hardCap = strategy?.risk?.absoluteHardMaxAud ?? 8000;
    const minEv = strategy?.execution?.minimumNetEv ?? 0.01;

    root.innerHTML = `
      <div class="hk-action ${overall.cls}" aria-live="assertive">
        <div class="hk-action-label">HONG KONG · YOUR ACTION</div>
        <div class="hk-action-title">${esc(overall.title)}</div>
        <div class="hk-action-text">${esc(overall.text)}</div>
      </div>

      <div class="hk-note"><b>THIS IS NOT THE AUSTRALIAN STREAK SYSTEM.</b> ${esc(data.systemMessage || '')}</div>

      <section class="hk-strategy">
        <h3>${esc(strategy.name || 'HK R15 BALANCED')}</h3>
        <div class="hk-rule-grid">
          <div class="hk-rule"><span>WIN MARKET</span><strong>${price(winMin)} to ${price(winMax)} inclusive</strong></div>
          <div class="hk-rule"><span>PLACE MARKET</span><strong>${price(placeMin)} to under ${price(placeMax)}</strong></div>
          <div class="hk-rule"><span>ACTIVE RISK CAP</span><strong>${money(riskCap)} per position</strong></div>
          <div class="hk-rule"><span>ABSOLUTE HARD MAX</span><strong>${money(hardCap)}</strong></div>
          <div class="hk-rule"><span>VALUE GATE</span><strong>Net EV at least +${pct(minEv)}</strong></div>
          <div class="hk-rule"><span>BACK ROUTING</span><strong>Best positive-net-EV executable fixed/exchange quote</strong></div>
          <div class="hk-rule"><span>LAY ROUTING</span><strong>Exchange only</strong></div>
          <div class="hk-rule"><span>MODELS</span><strong>R4C WIN · R8 PLACE</strong></div>
        </div>
        <div class="hk-small">Fail closed: model probability, portfolio action, executable quote, capacity, price range, net EV and risk must all verify before BET NOW is allowed.</div>
      </section>

      <div style="margin-bottom:10px;font-size:11px;color:#b7c7d9"><b>${esc(m.status || '')}</b> · ${esc(m.venue || 'Sha Tin')} · ${esc(m.track || 'Turf')} ${esc(m.course || 'A')} Course · R15 feed: <b>${esc(feed.status || 'NOT VERIFIED')}</b></div>

      ${races.map(r => {
        const results = allSignalsForRace(data, r).map(signal => evaluateSignal(signal, strategy));
        const hasBet = results.some(x => x.status === 'BET_NOW');
        const hasNo = !hasBet && results.length && results.every(x => x.status === 'NO_BET');
        const cls = hasBet ? 'bet' : hasNo ? 'no' : '';
        const status = hasBet ? 'BET NOW' : hasNo ? 'NO BET' : (r.strategyStatus || 'WAIT — NOT SCORED');
        return `<div class="hk-card ${cls}">
          <div class="hk-race">HK R${esc(r.race)} · ${esc(r.timeHkt || 'TBC')} · ${esc(r.name || 'Race')}</div>
          <div class="hk-meta">${esc(r.class || '')} · ${esc(r.distanceM)}m</div>
          <div class="hk-status ${cls}">${esc(status)}</div>
          ${results.length ? results.map(signalHtml).join('') : '<div class="hk-small">No verified R15 horse-level signal loaded yet. Do not choose a horse manually.</div>'}
        </div>`;
      }).join('')}

      <div class="hk-note" style="margin-top:12px"><b>RESEARCH CAUTION:</b> the later R15 package still inherits synthetic/proxy historical PLACE execution assumptions. The app therefore refuses to turn green from a model idea alone; live executable price and capacity must be verified.</div>
      <a class="hk-source" href="${esc(m.officialSourceUrl || '#')}" target="_blank" rel="noopener">OPEN OFFICIAL HKJC RACE CARD ↗</a>`;
  }

  async function loadData() {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    try {
      const response = await fetch(DATA_URL, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      render(data);
    } catch (error) {
      root.innerHTML = `<div class="hk-action wait"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">WAIT</div><div class="hk-action-text">Hong Kong R15 data could not be verified. Do not place a Hong Kong bet.</div></div>`;
    }
  }

  window.MITCHELL_HK_R15_EVALUATE = evaluateSignal;
  window.MITCHELL_HK_R15_REFRESH = loadData;

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
