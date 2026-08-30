(() => {
  'use strict';

  const CLOSING_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-closing-odds';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJka21hY2t0Y2ZodWJzdW13cnlkdyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg2NDU2ODk0LCJleHAiOjIxMDIwMzI4OTR9.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 30000;
  const cache = new Map();
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

  function renderClosing(card, closing) {
    let box = card.querySelector('[data-closing-odds]');
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

    if (!closing?.ok) {
      box.innerHTML = `<div style="font-size:9px;color:#8fa5bd;font-weight:900;letter-spacing:.05em">FINAL CLOSING FAVOURITE</div><div style="margin-top:4px;font-size:11px;color:#ffc34f;font-weight:850">Final fixed-WIN closing odds unavailable — checking TABtouch result market.</div>`;
      return;
    }

    const favs = Array.isArray(closing.favourites) ? closing.favourites : [];
    const p = Number(closing.favouritePrice);
    const equal = closing.favouriteType === 'EQUAL' && favs.length > 1;
    const title = equal ? 'FINAL EQUAL FAVOURITES' : 'FINAL CLOSING FAVOURITE';
    const names = favs.length ? favs.map(f => `${f?.number ? '#' + esc(f.number) + ' ' : ''}${esc(f?.name || 'UNKNOWN')}`).join(' / ') : 'Favourite unavailable';
    const method = closing.verificationMethod === 'TABTOUCH_FINAL_FAVOURITE_FLAG' ? 'TABtouch final favourite flag' : 'lowest final fixed-WIN price';

    box.innerHTML = `
      <div style="font-size:9px;color:#8fa5bd;font-weight:900;letter-spacing:.05em">${title}</div>
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin-top:5px">
        <div style="font-size:14px;color:#fff;font-weight:950;line-height:1.25">${names}</div>
        <div style="font-size:18px;color:#78f2b5;font-weight:950;white-space:nowrap">${odds(p)}</div>
      </div>
      <div style="font-size:9px;color:#8fa5bd;margin-top:5px">FINAL FIXED-WIN · ${esc(method)}</div>`;
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
      new MutationObserver(() => setTimeout(refresh, 50)).observe(results, { childList: true, subtree: true });
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
