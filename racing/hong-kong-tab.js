(() => {
  'use strict';

  const DATA_URL = './hong-kong.json?v=20260904-optimal-v4';
  const esc = v => String(v ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const money = v => num(v) === null ? '—' : new Intl.NumberFormat('en-AU', {
    style:'currency', currency:'AUD', maximumFractionDigits:0
  }).format(Number(v));
  const price = v => num(v) === null ? '—' : '$' + Number(v).toFixed(2);
  const pct = v => num(v) === null ? '—' : (Number(v) * 100).toFixed(1) + '%';
  const n1 = v => num(v) === null ? '—' : Number(v).toFixed(1);

  function addStyles() {
    if (document.getElementById('hk-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'hk-tab-styles';
    style.textContent = `
      .hk-switcher{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}
      .hk-tab-btn{border:1px solid #334961;background:#111e2f;color:#aebed0;padding:9px 13px;border-radius:10px;font-weight:900;font-size:11px;cursor:pointer;text-decoration:none}
      .hk-tab-btn.active{background:#173455;color:#fff;border-color:#4a79a8}
      .hk-panel{display:none}.hk-panel.active{display:block}
      .hk-action,.hk-note,.hk-good,.hk-strategy,.hk-card,.hk-dayguard{border-radius:12px;margin-bottom:10px;padding:12px}
      .hk-action{padding:16px;border:1px solid #765f2a;background:#2a2413}
      .hk-action.bet{border-color:#2a8058;background:#0d3525}.hk-action.no{border-color:#74323e;background:#35151d}
      .hk-action-label{font-size:9px;color:#aebed0;font-weight:950}.hk-action-title{font-size:26px;font-weight:1000;color:#ffc34f;margin-top:3px}
      .hk-action.bet .hk-action-title{color:#78f2b5}.hk-action.no .hk-action-title{color:#ff9eaa}.hk-action-text{font-size:11px;line-height:1.45;margin-top:5px}
      .hk-note{border:1px solid #765f2a;background:#2a2413;color:#ffe29a;font-size:10px;line-height:1.5}
      .hk-good{border:1px solid #2a8058;background:#0d2b20;color:#b9f6d8;font-size:10px;line-height:1.5}
      .hk-dayguard{border:1px solid #365678;background:#0d2134}.hk-dayguard h3{font-size:11px;margin:0 0 8px}.hk-daygrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.hk-daycell{padding:9px;background:#10283e;border-radius:9px}.hk-daycell span{display:block;color:#829bb4;font-size:8px;font-weight:950}.hk-daycell strong{display:block;margin-top:4px;font-size:12px}.hk-daycell.stop strong{color:#ff9eaa}.hk-daycell.good strong{color:#78f2b5}
      .hk-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}.hk-kpi{padding:10px;border:1px solid #2e435c;border-radius:10px;background:#0f1d2d}.hk-kpi span,.hk-rule span{display:block;color:#8198af;font-size:8px;font-weight:950}.hk-kpi strong{display:block;font-size:15px;margin-top:4px}
      .hk-strategy{border:1px solid #2e435c;background:#0d1725}.hk-strategy h3{margin:0 0 9px;font-size:13px}.hk-rules{display:grid;grid-template-columns:1fr 1fr;gap:7px}.hk-rule{padding:9px;border-radius:9px;background:#111f30}.hk-rule strong{display:block;font-size:10px;margin-top:3px;line-height:1.35}
      .hk-card{border:1px solid #2e435c;background:#0e1928}.hk-card.bet{border-color:#2a8058;background:#0b261c}.hk-card.no{border-color:#64313b}.hk-race{font-size:13px;font-weight:950}.hk-meta,.hk-small{margin-top:5px;color:#9eb3ca;font-size:9px;line-height:1.45}.hk-status{display:inline-block;margin-top:8px;padding:5px 8px;border-radius:8px;background:#2a2413;color:#ffc34f;font-size:9px;font-weight:950}.hk-status.bet{background:#0d3525;color:#78f2b5}.hk-status.no{background:#35151d;color:#ff9eaa}
      .hk-signal{margin-top:8px;padding:8px;border:1px solid #31506d;border-radius:8px;font-size:10px;line-height:1.4}.hk-signal.bet{border-color:#2a8058;background:#0d2c20}.hk-signal.no{border-color:#63313b;background:#2a151b}.hk-source{display:inline-block;margin-top:8px;color:#8dc8ff;font-size:10px;font-weight:900;text-decoration:none}
      @media(max-width:600px){.hk-kpis,.hk-rules{grid-template-columns:1fr 1fr}.hk-daygrid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function buildShell() {
    if (document.getElementById('hkRacingPanel')) return;
    addStyles();
    const host = document.querySelector('main') || document.body;
    const original = [...host.children];

    const nav = document.createElement('div');
    nav.className = 'hk-switcher';
    nav.innerHTML = '<button class="hk-tab-btn active" data-tab="au">AUSTRALIA · V11</button><button class="hk-tab-btn" data-tab="hk">HONG KONG · OPTIMAL V4</button>';

    const au = document.createElement('div');
    au.id = 'auRacingPanel';
    au.className = 'hk-panel active';
    original.forEach(node => au.appendChild(node));

    const hk = document.createElement('div');
    hk.id = 'hkRacingPanel';
    hk.className = 'hk-panel';
    hk.innerHTML = '<section style="margin-bottom:12px"><div style="font-size:10px;color:#7f96ae;font-weight:950">HONG KONG · DAILY RISK GUARD</div><h2 style="margin:5px 0 3px;font-size:20px">SHA TIN · SUN 6 SEP</h2><div style="font-size:11px;color:#9eb3ca">HK OPTIMAL V4 · one bet/race · max 2/day · stop day at −A$10k realised P/L · 100/year cap</div></section><div id="hkRacingContent"><div class="hk-note">Loading Hong Kong OPTIMAL V4…</div></div>';
    host.append(nav, au, hk);

    const switchTab = tab => {
      nav.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
      au.classList.toggle('active', tab === 'au');
      hk.classList.toggle('active', tab === 'hk');
      const bottom = document.getElementById('bottomCommand');
      if (bottom) bottom.style.display = tab === 'hk' ? 'none' : '';
      history.replaceState(null, '', location.pathname + location.search + (tab === 'hk' ? '#hong-kong' : ''));
    };

    nav.addEventListener('click', event => {
      const button = event.target.closest('[data-tab]');
      if (button) switchTab(button.dataset.tab);
    });
    if (location.hash === '#hong-kong') switchTab('hk');
  }

  function classify(signal, strategy) {
    const odds = num(signal.odds ?? signal.executableOdds);
    const rank = num(signal.marketRank);
    const raw = num(signal.rawModelEv);
    const rules = strategy?.rules || {};

    if (signal.r2Core === true) {
      const low = rules.coreLow || {};
      if (odds !== null && odds >= Number(low.minOddsInclusive ?? 4) && odds < Number(low.maxOddsExclusive ?? 7)) {
        return { sleeve:'LOW CORE', stake:Number(low.stakeAud ?? 3000) };
      }
      const long = rules.coreLong || {};
      if (odds !== null && odds >= Number(long.minOddsInclusive ?? 18) && odds < Number(long.maxOddsExclusive ?? 30)) {
        return { sleeve:'LONG CORE', stake:Number(long.stakeAud ?? 5000) };
      }
      return { no:true, reason:'R2 CORE runner is outside the frozen $4–<7 and $18–<30 bands.' };
    }

    if (signal.satelliteOnly === true) {
      const main = rules.mainSatellite || {};
      const extra = rules.extraSatellite || {};
      const inMain = odds !== null && odds >= Number(main.minOddsInclusive ?? 3) && odds < Number(main.maxOddsExclusive ?? 7);
      if (inMain && rank === null) return { wait:true, reason:'Market rank is required for MAIN SAT.' };
      if (inMain && rank <= Number(main.maxMarketRank ?? 2)) {
        return { sleeve:'MAIN SAT', stake:Number(main.stakeAud ?? 7000) };
      }
      if (raw === null) return { wait:true, reason:'Original raw model EV is required for EXTRA EV SAT.' };
      if (raw >= Number(extra.minimumOriginalRawModelEv ?? 0.18)) {
        return { sleeve:'EXTRA EV SAT', stake:Number(extra.stakeAud ?? 10000) };
      }
      return { no:true, reason:'Satellite runner does not pass MAIN SAT or +18% EXTRA EV SAT.' };
    }

    return { wait:true, reason:'R2 CORE / satellite-only model classification is not verified.' };
  }

  function calibratedEv(signal) {
    const direct = num(signal.calibratedModelEv ?? signal.calibratedEv);
    if (direct !== null) return direct;
    const probability = num(signal.calibratedProbability ?? signal.calibratedP);
    const odds = num(signal.odds ?? signal.executableOdds);
    if (probability === null || odds === null) return null;
    const stressedOdds = 1 + (odds - 1) * 0.97;
    return probability * stressedOdds - 1;
  }

  function precheck(signal, strategy) {
    if (!signal?.horse) return { status:'WAIT', reason:'Horse identity is not verified.', signal };
    if (signal.modelVerified !== true && signal.modelClassificationVerified !== true) {
      return { status:'WAIT', reason:'Frozen model classification is not verified.', signal };
    }
    if (signal.quoteVerified !== true) return { status:'WAIT', reason:'Executable WIN price is not verified.', signal };
    const odds = num(signal.odds ?? signal.executableOdds);
    if (odds === null || odds <= 1) return { status:'WAIT', reason:'Executable decimal odds are missing or invalid.', signal };

    const classification = classify(signal, strategy);
    if (classification.wait) return { status:'WAIT', reason:classification.reason, signal };
    if (classification.no) return { status:'NO_BET', reason:classification.reason, signal };

    const modelEv = calibratedEv(signal);
    if (modelEv === null) {
      return { status:'WAIT', reason:'Verified calibrated model EV is required for the one-bet-per-race ranking.', signal };
    }
    return {
      status:'QUALIFIES', signal, sleeve:classification.sleeve,
      stakeAud:classification.stake, calibratedEv:modelEv,
      odds, rawEv:num(signal.rawModelEv) ?? -999
    };
  }

  function dailyRiskDecision(strategy) {
    const feed = strategy?.liveFeed || {};
    const guard = strategy?.dailyRiskGuard || {};
    const maxDay = Number(guard.maxConfirmedBetsPerRaceDay ?? strategy?.risk?.maxBetsPerRaceDay ?? 2);
    const lossStop = Number(guard.dailyRealizedLossStopAud ?? strategy?.risk?.dailyRealizedLossStopAud ?? 10000);

    if (feed.todayRiskVerified !== true) {
      return { status:'WAIT', reason:'Today’s HK risk state is not verified, so the 2-bet/day and daily-loss rules cannot be enforced.' };
    }
    const todayCount = num(feed.confirmedBetsToday);
    const todayPl = num(feed.realizedPlTodayAud);
    if (todayCount === null) return { status:'WAIT', reason:'Confirmed Hong Kong bet count for today is missing.' };
    if (todayPl === null) return { status:'WAIT', reason:'Realised Hong Kong P/L for today is missing.' };
    if (todayCount >= maxDay) return { status:'NO_BET', reason:`Daily cap reached (${todayCount}/${maxDay} confirmed HK bets today).` };
    if (todayPl <= -lossStop) return { status:'NO_BET', reason:`Daily loss stop triggered: today’s realised HK P/L is ${money(todayPl)} (stop at −${money(lossStop)}).` };
    return { status:'OK', todayCount, todayPl, maxDay, lossStop };
  }

  function executeTop(candidate, strategy) {
    const signal = candidate.signal || {};
    const hardCap = Number(strategy?.risk?.hardMaxStakeAud ?? 10000);
    const yearCap = Number(strategy?.risk?.maxBetsPerCalendarYear ?? 100);
    if (!(candidate.stakeAud > 0) || candidate.stakeAud > hardCap) {
      return { ...candidate, status:'NO_BET', reason:`Stake ${money(candidate.stakeAud)} breaches the ${money(hardCap)} hard cap.` };
    }

    const feed = strategy?.liveFeed || {};
    if (feed.yearBetCountVerified !== true) {
      return { ...candidate, status:'WAIT', reason:'Calendar-year confirmed bet count is not verified, so the 100-bet hard cap cannot be enforced.' };
    }
    const used = num(feed.confirmedBetsThisCalendarYear);
    if (used === null) return { ...candidate, status:'WAIT', reason:'Confirmed Hong Kong bets this calendar year are missing.' };
    if (used >= yearCap) return { ...candidate, status:'NO_BET', reason:`Calendar-year cap reached (${used}/${yearCap}).` };

    const day = dailyRiskDecision(strategy);
    if (day.status !== 'OK') return { ...candidate, status:day.status, reason:day.reason };

    if (signal.capacityVerified !== true) return { ...candidate, status:'WAIT', reason:`Need verified capacity for ${money(candidate.stakeAud)}.` };
    const capacity = num(signal.capacityAud);
    if (capacity === null) return { ...candidate, status:'WAIT', reason:`Capacity amount is missing; need at least ${money(candidate.stakeAud)}.` };
    if (capacity < candidate.stakeAud) {
      return { ...candidate, status:'NO_BET', reason:`Available capacity ${money(capacity)} is below ${money(candidate.stakeAud)}.` };
    }

    return {
      ...candidate,
      status:'BET_NOW',
      reason:`All OPTIMAL V4 gates passed · ${candidate.sleeve} · highest calibrated model EV in this race · daily guard clear (${day.todayCount}/${day.maxDay} bets, ${money(day.todayPl)} realised today).`
    };
  }

  function evaluateRace(rawSignals, strategy) {
    const checked = rawSignals.map(signal => precheck(signal, strategy));
    if (checked.some(x => x.status === 'WAIT')) {
      return checked.map(x => x.status === 'QUALIFIES'
        ? { ...x, status:'WAIT', reason:'Race ranking is incomplete because another potentially relevant signal is not fully verified.' }
        : x);
    }

    const qualifiers = checked.filter(x => x.status === 'QUALIFIES');
    if (!qualifiers.length) return checked;
    qualifiers.sort((a,b) => (b.calibratedEv - a.calibratedEv) || (a.odds - b.odds) || (b.rawEv - a.rawEv));
    const top = qualifiers[0];
    const chosen = executeTop(top, strategy);

    return checked.map(x => {
      if (x === top) return chosen;
      if (x.status === 'QUALIFIES') {
        return { ...x, status:'NO_BET', reason:'Qualifies, but OPTIMAL V4 allows one bet per race and another runner has higher calibrated model EV.' };
      }
      return x;
    });
  }

  function raceSignals(data, race) {
    const local = Array.isArray(race.signals) ? race.signals : [];
    const global = Array.isArray(data.signals) ? data.signals.filter(x => Number(x.race) === Number(race.race)) : [];
    return [...local, ...global];
  }

  function signalHtml(result) {
    const signal = result.signal || {};
    const cls = result.status === 'BET_NOW' ? 'bet' : result.status === 'NO_BET' ? 'no' : '';
    const title = result.status === 'BET_NOW' ? 'BET NOW' : result.status === 'NO_BET' ? 'NO BET' : 'WAIT';
    const model = result.calibratedEv != null ? ` · model EV ${pct(result.calibratedEv)}` : '';
    const detail = signal.horse
      ? `<strong>${esc(String(signal.horse).toUpperCase())}</strong> · BACK WIN · ${price(signal.odds ?? signal.executableOdds)}${result.sleeve ? ` · ${esc(result.sleeve)}` : ''}${result.status === 'BET_NOW' ? ` · stake ${money(result.stakeAud)}` : ''}${model}`
      : 'Signal incomplete.';
    return `<div class="hk-signal ${cls}"><b>${title}</b> · ${detail}<br><span style="color:#9eb3ca">${esc(result.reason || '')}</span></div>`;
  }

  function render(data) {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    const strategy = data.strategy || {};
    const headline = strategy.historicalHeadline || {};
    const cadence = strategy.historicalCadence || {};
    const feed = strategy.liveFeed || {};
    const rules = strategy.rules || {};
    const risk = strategy.risk || {};
    const guard = strategy.dailyRiskGuard || {};
    const races = Array.isArray(data.races) ? data.races : [];

    const byRace = races.map(race => ({ race, results:evaluateRace(raceSignals(data, race), strategy) }));
    const bets = byRace.flatMap(x => x.results).filter(x => x.status === 'BET_NOW');
    const fullyScored = races.length > 0 && races.every(r => !String(r.strategyStatus || '').includes('NOT SCORED'));
    const feedReady = feed.modelClassificationVerified === true && feed.calibratedModelEvVerified === true &&
      feed.executableQuotesVerified === true && feed.capacityVerified === true &&
      feed.yearBetCountVerified === true && feed.todayRiskVerified === true;

    let action = { cls:'', title:'WAIT', text:feed.message || 'Do not bet until every OPTIMAL V4 live gate is verified.' };
    if (bets.length) {
      action = { cls:'bet', title:'BET NOW', text:`${bets.length} race${bets.length === 1 ? '' : 's'} currently has one verified OPTIMAL V4 selection. Place only the exact horse and stake shown.` };
    } else if (feedReady && fullyScored) {
      action = { cls:'no', title:'NO BET', text:'Meeting scored; no horse passed every OPTIMAL V4 selection, execution and daily-risk gate.' };
    }

    const todayCount = num(feed.confirmedBetsToday);
    const todayPl = num(feed.realizedPlTodayAud);
    const maxDay = Number(guard.maxConfirmedBetsPerRaceDay ?? 2);
    const lossStop = Number(guard.dailyRealizedLossStopAud ?? 10000);
    const dayStopped = feed.todayRiskVerified === true && ((todayCount !== null && todayCount >= maxDay) || (todayPl !== null && todayPl <= -lossStop));
    const low = rules.coreLow || {}, long = rules.coreLong || {}, main = rules.mainSatellite || {}, extra = rules.extraSatellite || {};

    root.innerHTML = `
      <div class="hk-action ${action.cls}"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">${esc(action.title)}</div><div class="hk-action-text">${esc(action.text)}</div></div>

      <div class="hk-good"><b>OPTIMAL V4 ACTIVE:</b> same horse-selection model and stakes as V3, but now maximum <b>2 HK bets per race day</b> and stop for the day once realised HK P/L reaches <b>−${money(lossStop)}</b> or worse. Historical cadence ${n1(cadence.betsPerYear)} bets/year; busiest completed year ${esc(cadence.maxBetsAnyCompletedYear)}; hard annual cap ${esc(cadence.calendarYearBetCap)}.</div>

      <div class="hk-dayguard">
        <h3>TODAY'S HONG KONG RISK GUARD</h3>
        <div class="hk-daygrid">
          <div class="hk-daycell ${feed.todayRiskVerified === true && !dayStopped ? 'good' : ''}"><span>RISK STATE</span><strong>${feed.todayRiskVerified === true ? (dayStopped ? 'STOPPED' : 'CLEAR') : 'NOT VERIFIED'}</strong></div>
          <div class="hk-daycell ${todayCount !== null && todayCount >= maxDay ? 'stop' : ''}"><span>CONFIRMED BETS TODAY</span><strong>${todayCount === null ? '—' : `${todayCount} / ${maxDay}`}</strong></div>
          <div class="hk-daycell ${todayPl !== null && todayPl <= -lossStop ? 'stop' : ''}"><span>REALISED HK P/L TODAY</span><strong>${money(todayPl)}</strong></div>
        </div>
        <div class="hk-small">If this risk state cannot be verified, V4 fails closed to WAIT. A third Hong Kong bet in one race day is never allowed.</div>
      </div>

      <div class="hk-kpis"><div class="hk-kpi"><span>HIST BETS/YR</span><strong>${n1(cadence.betsPerYear)}</strong></div><div class="hk-kpi"><span>HIST ROI</span><strong>${pct(headline.roi)}</strong></div><div class="hk-kpi"><span>HIST AVG/YR</span><strong>${money(headline.annualProfitAud)}</strong></div><div class="hk-kpi"><span>STORED HIST DD</span><strong>${money(headline.maxDrawdownAud)}</strong></div></div>

      <div class="hk-note"><b>RESEARCH WARNING:</b> ${money(headline.maxDrawdownAud)} is the stored historical path, not a guaranteed maximum. V4 was found by testing the historical sequence and every removed historical V3 bet happened to lose. That can be overfit, so V4 is frozen for forward validation. Day-block P95 stress is about ${money(risk.dayBlockSequenceStressP95MaxDrawdownAud)}. Calibrated model EV is about ${money(strategy?.prediction?.calibratedModelEvAudPerYear)}/year.</div>

      <section class="hk-strategy"><h3>${esc(strategy.name || 'HK OPTIMAL V4')}</h3><div class="hk-rules">
        <div class="hk-rule"><span>LOW CORE</span><strong>R2 CORE · ${price(low.minOddsInclusive)}–&lt;${price(low.maxOddsExclusive)} · ${money(low.stakeAud)}</strong></div>
        <div class="hk-rule"><span>LONG CORE</span><strong>R2 CORE · ${price(long.minOddsInclusive)}–&lt;${price(long.maxOddsExclusive)} · ${money(long.stakeAud)}</strong></div>
        <div class="hk-rule"><span>MAIN SAT</span><strong>Satellite-only · ${price(main.minOddsInclusive)}–&lt;${price(main.maxOddsExclusive)} · rank 1–${esc(main.maxMarketRank)} · ${money(main.stakeAud)}</strong></div>
        <div class="hk-rule"><span>EXTRA EV SAT</span><strong>Satellite-only · raw EV ≥ ${pct(extra.minimumOriginalRawModelEv)} · ${money(extra.stakeAud)}</strong></div>
        <div class="hk-rule"><span>WITHIN A RACE</span><strong>Only highest verified calibrated model EV qualifier</strong></div>
        <div class="hk-rule"><span>DAY / YEAR CAPS</span><strong>Max ${esc(maxDay)}/day · stop at −${money(lossStop)} · max ${esc(risk.maxBetsPerCalendarYear || 100)}/year</strong></div>
      </div><div class="hk-small">WIN only · BACK only · maximum stake ${money(risk.hardMaxStakeAud)}.</div></section>

      ${byRace.map(({race, results}) => {
        const hasBet = results.some(x => x.status === 'BET_NOW');
        const allNo = !hasBet && results.length > 0 && results.every(x => x.status === 'NO_BET');
        const cls = hasBet ? 'bet' : allNo ? 'no' : '';
        const status = hasBet ? 'BET NOW' : allNo ? 'NO BET' : (race.strategyStatus || 'WAIT — OPTIMAL V4 NOT SCORED');
        return `<div class="hk-card ${cls}"><div class="hk-race">HK R${esc(race.race)} · ${esc(race.timeHkt || 'TBC')} · ${esc(race.name || 'Race')}</div><div class="hk-meta">${esc(race.class || '')} · ${esc(race.distanceM)}m</div><div class="hk-status ${cls}">${esc(status)}</div>${results.length ? results.map(signalHtml).join('') : '<div class="hk-small">No verified V4 horse-level model signal loaded yet. Do not choose a horse manually.</div>'}</div>`;
      }).join('')}

      <a class="hk-source" href="${esc(data?.meeting?.officialSourceUrl || '#')}" target="_blank" rel="noopener">OPEN OFFICIAL HKJC RACE CARD ↗</a>`;
  }

  async function loadData() {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    try {
      const response = await fetch(DATA_URL, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      render(await response.json());
    } catch (error) {
      root.innerHTML = '<div class="hk-action"><div class="hk-action-label">HONG KONG · YOUR ACTION</div><div class="hk-action-title">WAIT</div><div class="hk-action-text">Hong Kong OPTIMAL V4 data could not be verified. Do not place a Hong Kong bet.</div></div>';
    }
  }

  window.MITCHELL_HK_OPTIMAL_V4_EVALUATE_RACE = evaluateRace;
  window.MITCHELL_HK_OPTIMAL_V4_REFRESH = loadData;

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
