(() => {
  'use strict';

  const LIVE_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-tab-live';
  const EXEC_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-execution';
  const CLOSING_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-closing-odds';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const FAST_MS = 5000;
  const RESULT_MS = 20000;
  const EXEC_OPEN = 20;
  const EXEC_CUTOFF = 10;
  const MIN_PRICE = 3;

  let guardBusy = false;
  let resultBusy = false;
  let stickyMode = null;
  let stickyPayload = null;

  const $ = id => document.getElementById(id);
  const raceCode = v => String(v || '').trim().toUpperCase();
  const horseKey = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\bNZ\b$/, '').trim().replace(/\s+/g, ' ');
  const odds = v => Number.isFinite(Number(v)) ? '$' + Number(v).toFixed(2) : '—';
  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 }).format(Number(v)) : '—';

  async function post(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type':'application/json', apikey:ANON, Authorization:`Bearer ${ANON}` },
      body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data?.ok !== true) throw new Error(data?.error || `HTTP ${r.status}`);
    return data;
  }

  function watchItems() {
    return Array.isArray(window.__MITCHELL_BASE_DATA?.watchlist) ? window.__MITCHELL_BASE_DATA.watchlist : [];
  }

  function requests() {
    return watchItems().map(item => ({
      race: raceCode(item?.race || item?.code),
      date: item?.date,
      venue: item?.venue || item?.region || ''
    })).filter(x => x.race && x.date && x.venue);
  }

  function itemForRace(race) {
    return watchItems().find(item => raceCode(item?.race || item?.code) === raceCode(race)) || null;
  }

  function liveRunnerPrice(result, horse) {
    const key = horseKey(horse);
    const runner = (Array.isArray(result?.runners) ? result.runners : []).find(r => !r?.scratched && horseKey(r?.name) === key);
    const p = Number(runner?.price);
    return Number.isFinite(p) ? p : null;
  }

  function sameFavourite(result, horse) {
    const favs = Array.isArray(result?.favourites) ? result.favourites : [];
    return result?.favouriteType === 'SINGLE' && favs[0]?.name && horseKey(favs[0].name) === horseKey(horse);
  }

  function block(title, detail, label = 'DO NOT PLACE') {
    stickyMode = 'BLOCKED';
    stickyPayload = { title, detail, label };
    const card = $('decisionCard');
    const bottom = $('bottomCommand');
    if (card) card.className = 'decision-card blocked';
    if (bottom) bottom.className = 'bottom-command blocked';
    if ($('decisionKicker')) $('decisionKicker').textContent = 'EXECUTION GUARD · BLOCKED';
    if ($('decisionTitle')) $('decisionTitle').textContent = title;
    if ($('decisionMessage')) $('decisionMessage').textContent = detail;
    if ($('bottomLabel')) $('bottomLabel').textContent = label;
    if ($('bottomText')) $('bottomText').textContent = detail;
    const badge = document.querySelector('#lockedBets .bet-badge');
    if (badge) badge.textContent = title;
    document.title = 'DO NOT PLACE · MITCHELL Racing';
  }

  function recorded(result) {
    stickyMode = 'RECORDED';
    stickyPayload = result;
    const d = result?.decision || {};
    const card = $('decisionCard');
    const bottom = $('bottomCommand');
    if (card) card.className = 'decision-card waiting';
    if (bottom) bottom.className = 'bottom-command waiting';
    if ($('decisionKicker')) $('decisionKicker').textContent = 'ACTUAL WAGER CONFIRMED';
    if ($('decisionTitle')) $('decisionTitle').textContent = 'BET RECORDED';
    if ($('decisionMessage')) $('decisionMessage').textContent = `${result?.race || ''}: ${d.horse || ''} · accepted ${money(d.acceptedStake)} at ${odds(d.acceptedPrice)}. Do not place another wager.`;
    if ($('bottomLabel')) $('bottomLabel').textContent = 'BET RECORDED';
    if ($('bottomText')) $('bottomText').textContent = 'Actual execution is confirmed. Do not place a second wager.';
    const badge = document.querySelector('#lockedBets .bet-badge');
    if (badge) badge.textContent = 'ACTUAL BET CONFIRMED — DO NOT PLACE AGAIN';
    document.title = 'BET RECORDED · MITCHELL Racing';
  }

  function truthifyWatchLabels() {
    document.querySelectorAll('#watchlist .not-bet').forEach(el => {
      if (/^BET LOCKED/i.test(el.textContent || '')) el.textContent = 'SIGNAL READY — ACTUAL BET NOT YET CONFIRMED';
    });
    document.querySelectorAll('#watchlist .watch-card').forEach(card => {
      const gate = [...card.querySelectorAll('div')].find(node => /4\. V11 DECISION/.test(node.textContent || ''));
      if (!gate) return;
      const span = gate.querySelector('span');
      if (span && /BET LOCKED/i.test(span.textContent || '')) span.textContent = span.textContent.replace(/BET LOCKED/gi, 'SIGNAL READY');
    });
  }

  function recorderBox(result) {
    const locked = document.querySelector('#lockedBets .locked-bet');
    if (!locked) return;
    const d = result?.decision || {};
    if (d.executionStatus === 'CONFIRMED') {
      recorded(result);
      return;
    }

    if ($('decisionKicker')) $('decisionKicker').textContent = 'SIGNAL READY · EXECUTION UNCONFIRMED';
    const badge = locked.querySelector('.bet-badge');
    if (badge) badge.textContent = 'SIGNAL READY — PLACE ONLY IF BOOKMAKER ACCEPTS';

    let box = locked.querySelector('[data-execution-recorder]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-execution-recorder', 'true');
      box.style.marginTop = '10px';
      box.style.padding = '11px';
      box.style.borderRadius = '10px';
      box.style.background = '#122033';
      box.style.border = '1px solid #36516e';
      box.innerHTML = `
        <div style="font-size:10px;font-weight:950;color:#fff">A SIGNAL IS NOT A RECORDED BET YET</div>
        <div style="font-size:9px;line-height:1.4;color:#aebed0;margin-top:4px">Place only if the bookmaker actually accepts the wager at $3.00+. Then record the accepted stake and price here. Until you do, this cannot become a cash WIN/LOSS.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">
          <button type="button" data-record-bet style="padding:10px;border:0;border-radius:9px;font-weight:950;background:#78f2b5;color:#062318">RECORD ACCEPTED BET</button>
          <button type="button" data-not-placed style="padding:10px;border:1px solid #74404a;border-radius:9px;font-weight:900;background:#35151d;color:#ffb5bf">I DID NOT PLACE</button>
        </div>
        <div data-exec-status style="font-size:9px;margin-top:7px;color:#9fb1c4"></div>`;
      locked.appendChild(box);
      box.querySelector('[data-record-bet]')?.addEventListener('click', () => recordAccepted(result, box));
      box.querySelector('[data-not-placed]')?.addEventListener('click', () => markNotPlaced(result, box));
    }
  }

  async function freshLocked(race) {
    const reqs = requests();
    const body = await post(LIVE_URL, { requests: reqs });
    return body.results.find(r => raceCode(r?.race) === raceCode(race) && r?.decision?.status === 'BET_LOCKED') || null;
  }

  async function recordAccepted(result, box) {
    const status = box.querySelector('[data-exec-status]');
    try {
      if (status) status.textContent = 'Rechecking live market before recording…';
      const fresh = await freshLocked(result?.race);
      if (!fresh) throw new Error('The live server no longer verifies this signal. Do not place it.');
      const d = fresh.decision || {};
      const lead = Number(fresh.leadSeconds);
      const live = liveRunnerPrice(fresh, d.horse);
      if (!Number.isFinite(lead) || lead > EXEC_OPEN || lead <= EXEC_CUTOFF) throw new Error('The executable window is no longer open.');
      if (!sameFavourite(fresh, d.horse)) throw new Error('The locked horse is no longer the single verified favourite.');
      if (!Number.isFinite(live) || live < MIN_PRICE) throw new Error('The live fixed-WIN price is below $3.00 or unverified.');

      const acceptedStake = Number(window.prompt('Accepted stake (AUD):', String(Number(d.stake) || '')));
      if (!Number.isFinite(acceptedStake) || acceptedStake <= 0) throw new Error('Accepted stake was not recorded.');
      const acceptedPrice = Number(window.prompt('Accepted fixed-WIN price:', Number(live).toFixed(2)));
      if (!Number.isFinite(acceptedPrice) || acceptedPrice < MIN_PRICE) throw new Error('V11 requires an accepted price of at least $3.00.');

      const item = itemForRace(fresh.race);
      if (!item) throw new Error('Race date could not be resolved.');
      if (status) status.textContent = 'Saving accepted execution…';
      await post(EXEC_URL, { race:fresh.race, date:item.date, action:'CONFIRM', acceptedStake, acceptedPrice });
      if (status) status.textContent = 'ACTUAL BET RECORDED.';
      stickyMode = null;
      window.dispatchEvent(new Event('mitchell-refresh-live'));
      setTimeout(guardTick, 250);
    } catch (e) {
      if (status) status.textContent = e instanceof Error ? e.message : 'Could not record execution.';
      block('DO NOT PLACE — EXECUTION NOT CONFIRMED', e instanceof Error ? e.message : 'Execution could not be verified.', 'NOT CONFIRMED');
    }
  }

  async function markNotPlaced(result, box) {
    const status = box.querySelector('[data-exec-status]');
    if (!window.confirm('Mark this signal as NOT PLACED? It will not count as a cash bet.')) return;
    try {
      const item = itemForRace(result?.race);
      if (!item) throw new Error('Race date could not be resolved.');
      if (status) status.textContent = 'Saving NO BET…';
      await post(EXEC_URL, { race:result.race, date:item.date, action:'NOT_PLACED' });
      block('NO BET — NOT PLACED', 'You marked this signal as not placed. It will not count as a cash win/loss.', 'NO BET');
      window.dispatchEvent(new Event('mitchell-refresh-live'));
    } catch (e) {
      if (status) status.textContent = e instanceof Error ? e.message : 'Could not save status.';
    }
  }

  function validateLocked(result) {
    const d = result?.decision || {};
    if (d.executionStatus === 'CONFIRMED') return { ok:true, recorded:true };
    const lead = Number(result?.leadSeconds);
    if (!Number.isFinite(lead) || lead > EXEC_OPEN) return { ok:false, title:'DO NOT PLACE — TOO EARLY', detail:`Actual V11 execution is allowed only from ${EXEC_OPEN}s down to ${EXEC_CUTOFF}s before jump.` };
    if (lead <= EXEC_CUTOFF || result?.closed === true) return { ok:false, title:'DO NOT PLACE — WINDOW CLOSED', detail:`The ${EXEC_OPEN}s→${EXEC_CUTOFF}s execution window has closed. Do not chase the market.` };
    if (!sameFavourite(result, d.horse)) return { ok:false, title:'DO NOT PLACE — FAVOURITE CHANGED', detail:`${d.horse || 'The signal horse'} is no longer the single verified favourite.` };
    const live = liveRunnerPrice(result, d.horse);
    if (!Number.isFinite(live)) return { ok:false, title:'DO NOT PLACE — PRICE UNVERIFIED', detail:'A current fixed-WIN price cannot be verified.' };
    if (live < MIN_PRICE) return { ok:false, title:'DO NOT PLACE — PRICE BELOW $3', detail:`Current fixed-WIN ${odds(live)} is below the $3.00 V11 minimum.` };
    return { ok:true, recorded:false };
  }

  async function guardTick() {
    if (guardBusy || document.visibilityState === 'hidden') return;
    const reqs = requests();
    if (!reqs.length) return;
    const near = [...document.querySelectorAll('#watchlist .watch-race')].some(el => /\b\d+s to jump\b/i.test(el.textContent || ''));
    if (!near && !document.querySelector('#lockedBets .locked-bet')) return;

    guardBusy = true;
    try {
      const body = await post(LIVE_URL, { requests:reqs });
      const active = body.results.filter(r => !['COMPLETE','CLOSED_RESULT_PENDING'].includes(r?.phase));
      const locked = active.find(r => r?.decision?.status === 'BET_LOCKED');
      truthifyWatchLabels();

      if (!locked) {
        if (document.querySelector('#lockedBets .locked-bet')) block('DO NOT PLACE — SIGNAL NOT VERIFIED', 'The live server no longer verifies an executable V11 signal.', 'SIGNAL NOT VERIFIED');
        else if (near) window.dispatchEvent(new Event('mitchell-refresh-live'));
        return;
      }

      const check = validateLocked(locked);
      if (!check.ok) {
        block(check.title, check.detail, 'DO NOT PLACE');
        return;
      }
      if (check.recorded) {
        recorded(locked);
        return;
      }

      stickyMode = 'READY';
      stickyPayload = locked;
      recorderBox(locked);
    } catch (e) {
      block('DO NOT PLACE — LIVE CHECK FAILED', 'The final live verification failed. Fail closed and do not place.', 'LIVE CHECK FAILED');
      console.warn('execution truth guard', e);
    } finally {
      guardBusy = false;
    }
  }

  function resultCards() {
    return [...document.querySelectorAll('#resultsList .watch-card')].map(card => {
      const line = card.querySelector('.watch-race')?.textContent || '';
      const race = raceCode(line.split('|')[0].trim());
      return { card, race };
    }).filter(x => /^(PR|SR|MR)[1-7]$/.test(x.race));
  }

  function legacyOutcomeNode(card) {
    return [...card.querySelectorAll('div')].find(node => {
      const text = String(node.textContent || '').trim();
      return text.startsWith('BET RESULT:') || text.startsWith('NO BET —') || text.startsWith('LIVE V11 LOCK RESULT') || text.startsWith('MODEL SIGNAL');
    }) || null;
  }

  function renderResultTruth(card, closing) {
    const exec = closing?.execution || {};
    const signal = closing?.signal || {};
    const evidence = closing?.evidence || {};
    const finalPrice = Number(closing?.finalFixedWinReference?.favouritePrice ?? closing?.favouritePrice);
    const node = legacyOutcomeNode(card);

    if (node) {
      if (exec.actualBet) {
        const result = String(exec.resultStatus || '').toUpperCase();
        const won = result === 'WIN';
        node.style.background = won ? '#0d3525' : '#35151d';
        node.style.color = won ? '#78f2b5' : '#ff9eaa';
        node.innerHTML = `<b>ACTUAL WAGER ${won ? 'WIN' : result === 'LOSS' ? 'LOSS' : 'RECORDED'}</b> · ${money(exec.acceptedStake)} @ ${odds(exec.acceptedPrice)}${Number.isFinite(Number(exec.cashPl)) ? ` · CASH P/L ${money(exec.cashPl)}` : ''}`;
      } else if (signal.exists) {
        node.style.background = '#33270e';
        node.style.color = '#ffc34f';
        node.innerHTML = `<b>MODEL SIGNAL ONLY — NO ACTUAL WAGER CONFIRMED</b><br><span style="font-size:9px;color:#d7c79a">Signal was ${money(signal.modelStake)} at ${odds(signal.signalPrice)}, but no accepted stake/price is recorded. It is NOT counted as a cash betting win/loss.</span>`;
      } else {
        node.style.background = '#162338';
        node.style.color = '#9eb3ca';
        node.innerHTML = '<b>NO ACTUAL BET</b>';
      }
    }

    let box = card.querySelector('[data-execution-truth-result]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-execution-truth-result','true');
      box.style.marginTop = '10px';
      box.style.padding = '11px';
      box.style.borderRadius = '11px';
      box.style.background = '#0b1726';
      box.style.border = '1px solid #2d425c';
      card.appendChild(box);
    }

    const execLine = exec.actualBet
      ? `<div style="color:#78f2b5;font-weight:950">ACTUAL BET CONFIRMED · ${money(exec.acceptedStake)} @ ${odds(exec.acceptedPrice)}</div>`
      : signal.exists
        ? `<div style="color:#ffc34f;font-weight:950">ACTUAL BET: ${String(exec.status || 'UNCONFIRMED').replaceAll('_',' ')}</div><div style="color:#b7c5d5;margin-top:3px">The model signal is preserved for audit, but without accepted execution it does not enter cash P/L.</div>`
        : `<div style="color:#9eb3ca;font-weight:950">ACTUAL BET: NONE</div>`;

    const evidenceLine = Number.isFinite(Number(evidence.officialSp))
      ? `<div style="color:${evidence.status === 'ELIGIBLE' ? '#78f2b5' : '#ff9eaa'};font-weight:950">OFFICIAL SP ${odds(evidence.officialSp)} · ${String(evidence.status || '').replaceAll('_',' ')}</div>`
      : `<div style="color:#ffc34f;font-weight:950">OFFICIAL SP EVIDENCE · UNVERIFIED</div><div style="color:#b7c5d5;margin-top:3px">Do not add or exclude this race from the workbook ROI evidence until true Official SP is verified.</div>`;

    box.innerHTML = `
      <div style="font-size:9px;color:#8fa5bd;font-weight:900;letter-spacing:.05em">EXECUTION TRUTH</div>
      <div style="font-size:10px;line-height:1.45;margin-top:6px">${execLine}</div>
      ${signal.exists ? `<div style="font-size:10px;color:#dbe6f4;margin-top:8px"><b>MODEL SIGNAL:</b> ${signal.horse || '—'} · ${money(signal.modelStake)} · signal price ${odds(signal.signalPrice)}</div>` : ''}
      <div style="font-size:10px;color:#dbe6f4;margin-top:8px"><b>FINAL FIXED-WIN REFERENCE:</b> ${Number.isFinite(finalPrice) ? odds(finalPrice) : '—'} <span style="color:#8fa5bd">(not automatically Official SP)</span></div>
      <div style="font-size:10px;line-height:1.45;margin-top:8px">${evidenceLine}</div>
      <div style="font-size:9px;color:#8fa5bd;line-height:1.4;margin-top:8px"><b>State tracking is separate:</b> the favourite's race result still updates the stream's win/loss state even when there was no actual wager.</div>`;
  }

  async function refreshResults() {
    if (resultBusy || document.visibilityState === 'hidden') return;
    const cards = resultCards();
    if (!cards.length) return;
    const reqs = cards.map(({ race }) => {
      const item = itemForRace(race);
      return item ? { race, date:item.date, venue:item.venue || item.region || '' } : null;
    }).filter(Boolean);
    if (!reqs.length) return;

    resultBusy = true;
    try {
      const body = await post(CLOSING_URL, { requests:reqs });
      for (const closing of body.results || []) {
        const match = cards.find(x => x.race === raceCode(closing?.race));
        if (match) renderResultTruth(match.card, closing);
      }
    } catch (e) {
      console.warn('execution truth results', e);
    } finally {
      resultBusy = false;
    }
  }

  function reapplySticky() {
    truthifyWatchLabels();
    if (stickyMode === 'BLOCKED' && stickyPayload) block(stickyPayload.title, stickyPayload.detail, stickyPayload.label);
    else if (stickyMode === 'RECORDED' && stickyPayload) recorded(stickyPayload);
    else if (stickyMode === 'READY' && stickyPayload) recorderBox(stickyPayload);
  }

  function start() {
    const decision = $('decisionCard');
    if (decision) new MutationObserver(() => setTimeout(reapplySticky, 0)).observe(decision, { subtree:true, childList:true, characterData:true });
    const results = $('resultsList');
    if (results) new MutationObserver(() => setTimeout(refreshResults, 50)).observe(results, { childList:true });
    window.addEventListener('mitchell-base-ready', () => { setTimeout(guardTick, 250); setTimeout(refreshResults, 500); });
    window.addEventListener('mitchell-refresh-live', () => { setTimeout(guardTick, 250); setTimeout(refreshResults, 500); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { setTimeout(guardTick, 100); setTimeout(refreshResults, 200); } });
    window.addEventListener('online', () => { setTimeout(guardTick, 100); setTimeout(refreshResults, 200); });
    setInterval(guardTick, FAST_MS);
    setInterval(refreshResults, RESULT_MS);
    setTimeout(guardTick, 800);
    setTimeout(refreshResults, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
