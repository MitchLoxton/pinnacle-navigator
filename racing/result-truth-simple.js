(() => {
  'use strict';

  const CLOSING_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-closing-odds';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 10000;
  const cache = new Map();
  let busy = false;
  let applying = false;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const raceCode = value => String(value || '').trim().toUpperCase();
  const odds = value => Number.isFinite(Number(value)) ? '$' + Number(value).toFixed(2) : '—';
  const money = value => Number.isFinite(Number(value))
    ? new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 }).format(Number(value))
    : '—';

  async function post(body) {
    const r = await fetch(CLOSING_URL, {
      method:'POST',
      cache:'no-store',
      headers:{ 'Content-Type':'application/json', apikey:ANON, Authorization:`Bearer ${ANON}` },
      body:JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data?.ok !== true || !Array.isArray(data?.results)) {
      throw new Error(data?.error || `Result truth HTTP ${r.status}`);
    }
    return data.results;
  }

  function baseData() {
    return window.__MITCHELL_BASE_DATA || null;
  }

  function itemForRace(race) {
    const watch = Array.isArray(baseData()?.watchlist) ? baseData().watchlist : [];
    return watch.find(item => raceCode(item?.race || item?.code) === raceCode(race)) || null;
  }

  function resultCards() {
    const root = document.getElementById('resultsList');
    if (!root) return [];
    return [...root.querySelectorAll('.watch-card')].map(card => {
      const line = card.querySelector('.watch-race')?.textContent || '';
      const race = raceCode(line.split('|')[0].trim());
      return { card, race };
    }).filter(x => /^(PR|SR|MR)[1-7]$/.test(x.race));
  }

  function legacyNode(node) {
    if (!node || node.hasAttribute?.('data-simple-result-truth')) return false;
    if (node.hasAttribute?.('data-execution-truth')) return true;
    const text = String(node.textContent || '').trim();
    return /^(BET RESULT:|LIVE V11 LOCK RESULT|MODEL SIGNAL ONLY|MODEL SIGNAL:|NO ACTUAL BET|ACTUAL WAGER\b|EXECUTION TRUTH\b)/i.test(text);
  }

  function maskCard(card) {
    if (!card) return;
    card.querySelectorAll('[data-execution-truth],[data-closing-odds]').forEach(node => {
      node.style.display = 'none';
      node.setAttribute('aria-hidden', 'true');
    });
    [...card.querySelectorAll('div')].forEach(node => {
      if (legacyNode(node)) {
        node.style.display = 'none';
        node.setAttribute('aria-hidden', 'true');
      }
    });

    let box = card.querySelector('[data-simple-result-truth]');
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-simple-result-truth', 'true');
      box.style.marginTop = '10px';
      box.style.padding = '12px';
      box.style.borderRadius = '12px';
      box.style.background = '#0b1726';
      box.style.border = '1px solid #36516e';
      box.innerHTML = `
        <div style="font-size:9px;color:#8fa5bd;font-weight:950;letter-spacing:.06em">SIMPLE RESULT</div>
        <div style="margin-top:7px;font-size:14px;font-weight:950;color:#ffc34f">SYSTEM BET: CHECKING…</div>
        <div style="margin-top:5px;font-size:12px;font-weight:900;color:#dbe6f4">STATE RESULT: CHECKING…</div>`;
      const grid = [...card.querySelectorAll('div')].find(node => node.style?.display === 'grid');
      if (grid) grid.appendChild(box);
      else card.appendChild(box);
    }
  }

  function render(card, truth) {
    if (!card || !truth) return;
    maskCard(card);
    const box = card.querySelector('[data-simple-result-truth]');
    if (!box) return;

    const system = truth?.systemBet || {};
    const state = truth?.state || {};
    const evidence = truth?.evidence || {};
    const audit = truth?.auditSignal || {};
    const finalRef = truth?.finalFixedWinReference || {};
    const placed = system?.placed === true;
    const outcome = String(system?.outcome || '').toUpperCase();
    const stateOutcome = String(state?.outcome || '').toUpperCase();
    const favName = state?.favourite?.name || null;
    const finalPrice = Number(finalRef?.favouritePrice);

    const systemTone = placed ? (outcome === 'WIN' ? '#78f2b5' : outcome === 'LOSS' ? '#ff9eaa' : '#78f2b5') : '#9eb3ca';
    const systemBg = placed ? (outcome === 'LOSS' ? '#35151d' : '#0d3525') : '#162338';
    const stateTone = stateOutcome === 'WIN' ? '#78f2b5' : stateOutcome === 'LOSS' ? '#ff9eaa' : '#ffc34f';

    const systemTitle = placed
      ? `SYSTEM BET: YES${outcome ? ' · ' + outcome : ''}`
      : 'SYSTEM BET: NO';
    const systemDetail = placed
      ? `${money(system.acceptedStake)} accepted at ${odds(system.acceptedPrice)}${Number.isFinite(Number(system.cashPl)) ? ` · CASH P/L ${money(system.cashPl)}` : ''}`
      : 'No confirmed accepted wager. This race is NOT a betting win/loss and contributes $0 to system cash P/L.';

    const stateTitle = stateOutcome && favName
      ? `STATE RESULT: ${stateOutcome} · ${String(favName).toUpperCase()}`
      : 'STATE RESULT: UNVERIFIED';
    const stateDetail = stateOutcome === 'LOSS'
      ? 'The favourite lost, so the stream loss-state sequence advances. This is state tracking only — not a betting loss.'
      : stateOutcome === 'WIN'
        ? 'The favourite won, so the stream state resets. This is separate from whether a wager was placed.'
        : 'The favourite result could not be verified yet.';

    const evidenceLine = Number.isFinite(Number(evidence?.officialSp))
      ? `OFFICIAL SP: ${odds(evidence.officialSp)} · ${String(evidence.status || '').replaceAll('_',' ')}`
      : 'OFFICIAL SP EVIDENCE: UNVERIFIED';

    const auditHtml = audit?.exists ? `
      <details style="margin-top:10px;padding-top:8px;border-top:1px solid #263950">
        <summary style="cursor:pointer;color:#8fa5bd;font-size:9px;font-weight:900">AUDIT HISTORY — NOT A BET</summary>
        <div style="margin-top:7px;font-size:9px;line-height:1.45;color:#aebed0">
          Old model signal: ${esc(audit.horse || '—')} · ${money(audit.modelStake)} · signal price ${odds(audit.signalPrice)}.<br>
          This is preserved only so the old bot decision is auditable. It is <b>not</b> a system wager and is <b>not</b> a betting WIN/LOSS.
        </div>
      </details>` : '';

    const renderKey = [placed,outcome,system.acceptedStake,system.acceptedPrice,system.cashPl,stateOutcome,favName,finalPrice,evidence.status,evidence.officialSp,audit.exists,audit.modelStake,audit.signalPrice].join('|');
    if (box.dataset.simpleTruthKey === renderKey) return;
    box.dataset.simpleTruthKey = renderKey;
    box.innerHTML = `
      <div style="font-size:9px;color:#8fa5bd;font-weight:950;letter-spacing:.06em">FINAL SYSTEM CLASSIFICATION</div>
      <div style="margin-top:8px;padding:10px;border-radius:10px;background:${systemBg};border:1px solid ${placed ? (outcome === 'LOSS' ? '#74323e' : '#2a8058') : '#36516e'}">
        <div style="font-size:15px;font-weight:1000;color:${systemTone}">${esc(systemTitle)}</div>
        <div style="font-size:10px;line-height:1.4;color:#dbe6f4;margin-top:4px">${esc(systemDetail)}</div>
      </div>
      <div style="margin-top:8px;padding:10px;border-radius:10px;background:#101b2b;border:1px solid #2d425c">
        <div style="font-size:13px;font-weight:950;color:${stateTone}">${esc(stateTitle)}</div>
        <div style="font-size:10px;line-height:1.4;color:#dbe6f4;margin-top:4px">${esc(stateDetail)}</div>
      </div>
      <div style="display:grid;gap:4px;margin-top:9px;font-size:9px;color:#9fb1c4;line-height:1.4">
        <div><b>FINAL FIXED-WIN FAVOURITE:</b> ${favName ? esc(String(favName).toUpperCase()) : '—'}${Number.isFinite(finalPrice) ? ` · ${odds(finalPrice)}` : ''} <span style="color:#71869d">(reference only)</span></div>
        <div><b>${esc(evidenceLine)}</b></div>
      </div>
      ${auditHtml}`;
  }

  async function refresh() {
    if (busy || document.visibilityState === 'hidden') return;
    const cards = resultCards();
    if (!cards.length) return;

    applying = true;
    try { cards.forEach(({ card }) => maskCard(card)); } finally { applying = false; }

    const requests = [];
    for (const { race } of cards) {
      const item = itemForRace(race);
      if (!item?.date) continue;
      requests.push({ race, date:item.date, venue:item.venue || item.region || '' });
    }
    if (!requests.length) return;

    busy = true;
    try {
      const results = await post({ requests });
      results.forEach(result => cache.set(raceCode(result?.race), result));
      applying = true;
      try {
        cards.forEach(({ card, race }) => {
          const truth = cache.get(race);
          if (truth) render(card, truth);
        });
      } finally {
        applying = false;
      }
    } catch (e) {
      console.warn('simple result truth unavailable', e);
    } finally {
      busy = false;
    }
  }

  function reapplyCached() {
    if (applying) return;
    applying = true;
    try {
      resultCards().forEach(({ card, race }) => {
        maskCard(card);
        const truth = cache.get(race);
        if (truth) render(card, truth);
      });
    } finally {
      applying = false;
    }
  }

  function start() {
    const root = document.getElementById('resultsList');
    if (root) {
      new MutationObserver(() => {
        if (applying) return;
        setTimeout(reapplyCached, 0);
        setTimeout(refresh, 50);
      }).observe(root, { childList:true, subtree:true, characterData:true });
    }
    window.addEventListener('mitchell-base-ready', () => setTimeout(refresh, 100));
    window.addEventListener('mitchell-refresh-live', () => setTimeout(refresh, 100));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(refresh, 100);
    });
    window.addEventListener('online', () => setTimeout(refresh, 100));
    setTimeout(refresh, 300);
    setInterval(refresh, POLL_MS);
    setInterval(reapplyCached, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
