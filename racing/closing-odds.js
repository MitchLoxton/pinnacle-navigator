(() => {
  'use strict';

  const CLOSING_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-closing-odds';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 30000;
  const EVIDENCE_MIN = 3;
  const cache = new Map();
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  let busy = false;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const raceCode = value => String(value || '').trim().toUpperCase();
  const odds = value => Number.isFinite(Number(value)) ? '$' + Number(value).toFixed(2) : '—';

  async function getBaseData() {
    if (window.__MITCHELL_BASE_DATA) return window.__MITCHELL_BASE_DATA;
    const r = await fetch(`./current.json?close=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`current.json HTTP ${r.status}`);
    return r.json();
  }

  async function fetchClosing(requests) {
    const r = await fetch(CLOSING_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
      },
      body: JSON.stringify({ requests }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body?.ok !== true || !Array.isArray(body.results)) {
      throw new Error(body?.error || `Closing odds HTTP ${r.status}`);
    }
    return body.results;
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

  function legacyOutcomeNode(card) {
    return [...card.querySelectorAll('div')].find(node => {
      const text = String(node.textContent || '').trim();
      return text.startsWith('BET RESULT:') || text.startsWith('NO BET —') || text.startsWith('LIVE V11 LOCK RESULT');
    }) || null;
  }

  function renderLiveDecision(card, closing) {
    const node = legacyOutcomeNode(card);
    const d = closing?.liveDecision;
    if (!node || !d) return;

    const locked = d.locked === true;
    const result = String(d.resultStatus || '').toUpperCase();
    if (!locked) {
      node.style.background = '#162338';
      node.style.color = '#9eb3ca';
      node.innerHTML = `
        <div style="font-size:9px;letter-spacing:.05em;color:#9eb3ca">LIVE V11</div>
        <div style="font-size:12px;font-weight:950;margin-top:3px">NO LIVE LOCK</div>
        <div style="font-size:9px;font-weight:700;margin-top:4px;color:#b7c5d5">No V11 lock was recorded before the start. The post-race $3+ evidence check below is a separate statistics rule.</div>`;
      return;
    }

    const won = result === 'WIN';
    const lost = result === 'LOSS';
    const tone = won ? '#78f2b5' : lost ? '#ff9eaa' : '#ffc34f';
    node.style.background = won ? '#0d3525' : lost ? '#35151d' : '#33270e';
    node.style.color = tone;
    node.innerHTML = `
      <div style="font-size:9px;letter-spacing:.05em;color:${tone}">LIVE V11 LOCK RESULT</div>
      <div style="font-size:12px;font-weight:950;margin-top:3px">${esc(result || 'SETTLED')} · ${esc(d.horse || 'UNKNOWN')} · ${money.format(Number(d.stake) || 0)}</div>
      <div style="font-size:9px;font-weight:800;margin-top:4px;color:#d6e0eb">LOCK ${odds(d.entryPrice)} · MIN EXEC ${odds(d.minExec)}</div>
      <div style="font-size:9px;font-weight:700;margin-top:4px;color:#b7c5d5">This is the live lock outcome. Whether the race belongs in the workbook's $3+ ROI evidence is classified separately below.</div>`;
  }

  function evidenceInfo(closing) {
    const p = Number(closing?.evidence?.price ?? closing?.favouritePrice);
    const verified = Number.isFinite(p) && p > 1;
    const status = String(closing?.evidence?.status || (verified ? (p >= EVIDENCE_MIN ? 'ELIGIBLE' : 'EXCLUDED_BELOW_3') : 'UNVERIFIED'));
    if (!verified || status === 'UNVERIFIED') {
      return {
        key: 'UNVERIFIED',
        title: 'V11 $3+ STATISTICS EVIDENCE · UNVERIFIED',
        color: '#ffc34f',
        bg: '#33270e',
        border: '#735a27',
        text: 'Post-race evidence price is not verified. Do not add this race to exact-state ROI evidence yet. Loss-state tracking can still update once the race result is known.'
      };
    }
    if (status === 'ELIGIBLE' || p >= EVIDENCE_MIN) {
      return {
        key: `ELIGIBLE|${p}`,
        title: 'V11 $3+ STATISTICS EVIDENCE · ELIGIBLE',
        color: '#78f2b5',
        bg: '#0d3525',
        border: '#2a8058',
        text: `${odds(p)} ≥ ${odds(EVIDENCE_MIN)}. This race qualifies for the workbook's exact-state ROI evidence. Loss-state tracking also updates.`
      };
    }
    return {
      key: `EXCLUDED|${p}`,
      title: 'V11 $3+ STATISTICS EVIDENCE · EXCLUDED',
      color: '#ff9eaa',
      bg: '#35151d',
      border: '#74323e',
      text: `${odds(p)} < ${odds(EVIDENCE_MIN)}. Do NOT include this race in exact-state ROI evidence/statistics. The race still updates the loss-state sequence.`
    };
  }

  function renderClosing(card, closing) {
    const favs = Array.isArray(closing?.favourites) ? closing.favourites : [];
    const evidence = evidenceInfo(closing);
    const d = closing?.liveDecision || {};
    const renderKey = closing?.ok
      ? `ok|${closing.favouriteType || ''}|${Number(closing.favouritePrice) || ''}|${evidence.key}|${d.status || ''}|${d.resultStatus || ''}|${Number(d.entryPrice) || ''}|${Number(d.minExec) || ''}|${Number(d.stake) || ''}|${favs.map(f => `${f?.number || ''}:${f?.name || ''}`).join('|')}`
      : `wait|${closing?.error || ''}`;

    renderLiveDecision(card, closing);

    let box = card.querySelector('[data-closing-odds]');
    if (box?.dataset.closingRenderKey === renderKey) return;

    if (!box) {
      box = document.createElement('div');
      box.setAttribute('data-closing-odds', 'true');
      box.style.marginTop = '10px';
      box.style.padding = '11px';
      box.style.borderRadius = '11px';
      box.style.background = '#0b1726';
      box.style.border = '1px solid #2d425c';
      const inner = card.querySelector('div[style*="display:grid"]');
      if (inner) inner.insertBefore(box, inner.lastElementChild || null);
      else card.appendChild(box);
    }
    box.dataset.closingRenderKey = renderKey;

    if (!closing?.ok) {
      box.innerHTML = `
        <div style="font-size:9px;color:#8fa5bd;font-weight:900;letter-spacing:.05em">POST-RACE $3+ EVIDENCE CHECK</div>
        <div style="margin-top:4px;font-size:11px;color:#ffc34f;font-weight:850">Final fixed-WIN closing odds unavailable — evidence status remains UNVERIFIED.</div>`;
      return;
    }

    const p = Number(closing.favouritePrice);
    const equal = closing.favouriteType === 'EQUAL' && favs.length > 1;
    const title = equal ? 'FINAL EQUAL FAVOURITES' : 'FINAL CLOSING FAVOURITE';
    const names = favs.length ? favs.map(f => `${f?.number ? '#' + esc(f.number) + ' ' : ''}${esc(f?.name || 'UNKNOWN')}`).join(' / ') : 'Favourite unavailable';

    box.innerHTML = `
      <div style="font-size:9px;color:#8fa5bd;font-weight:900;letter-spacing:.05em">${title}</div>
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-top:5px">
        <div style="font-size:14px;color:#fff;font-weight:950;line-height:1.25">${names}</div>
        <div style="font-size:18px;color:#78f2b5;font-weight:950;white-space:nowrap">${odds(p)}</div>
      </div>
      <div style="font-size:9px;color:#8fa5bd;margin-top:5px">POST-RACE EVIDENCE PRICE · TAB.com.au final fixed-WIN market</div>
      <div style="margin-top:10px;padding:10px;border-radius:10px;background:${evidence.bg};border:1px solid ${evidence.border}">
        <div style="font-size:9px;font-weight:950;letter-spacing:.04em;color:${evidence.color}">${evidence.title}</div>
        <div style="font-size:10px;font-weight:750;line-height:1.4;color:#dbe6f4;margin-top:4px">${esc(evidence.text)}</div>
      </div>
      <div style="font-size:9px;color:#8fa5bd;line-height:1.35;margin-top:8px"><b>Two-price rule:</b> the live fixed price decides whether V11 can lock a wager; the post-race $3+ evidence price decides whether the race belongs in the historical ROI evidence. They are intentionally separate.</div>`;
  }

  async function refresh() {
    if (busy || document.visibilityState === 'hidden') return;
    const cards = resultCards();
    if (!cards.length) return;
    busy = true;
    try {
      const data = await getBaseData();
      const watch = Array.isArray(data?.watchlist) ? data.watchlist : [];
      const byRace = new Map(watch.map(item => [raceCode(item?.race || item?.code), item]));
      const requests = [];
      for (const { race } of cards) {
        const item = byRace.get(race);
        if (!item || cache.get(race)?.ok) continue;
        requests.push({ race, date: item.date, venue: item.venue || item.region || '' });
      }

      if (requests.length) {
        const results = await fetchClosing(requests);
        for (const result of results) cache.set(raceCode(result?.race), result);
      }

      for (const { card, race } of cards) {
        const result = cache.get(race);
        if (result) renderClosing(card, result);
      }
    } catch (e) {
      console.warn('Closing odds refresh unavailable', e);
    } finally {
      busy = false;
    }
  }

  function start() {
    const results = document.getElementById('resultsList');
    if (results) {
      new MutationObserver(() => setTimeout(refresh, 50)).observe(results, { childList: true });
    }
    window.addEventListener('mitchell-base-ready', () => setTimeout(refresh, 100));
    window.addEventListener('mitchell-refresh-live', () => setTimeout(refresh, 100));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(refresh, 100);
    });
    window.addEventListener('online', () => setTimeout(refresh, 100));
    setTimeout(refresh, 800);
    setInterval(refresh, POLL_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
