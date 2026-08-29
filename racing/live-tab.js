(() => {
  'use strict';

  const LIVE_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-tab-live';
  const ANON_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 30000;
  const MAX_LIVE_AGE_MS = 90000;
  let running = false;
  let lastGoodAt = 0;

  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const raceCode = value => String(value || '').trim().toUpperCase();
  const moneyOdds = value => Number.isFinite(Number(value)) ? '$' + Number(value).toFixed(2) : '—';

  async function fetchJson(path) {
    const r = await fetch(`${path}?live=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  async function fetchLive(requests) {
    const r = await fetch(LIVE_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_JWT,
        'Authorization': `Bearer ${ANON_JWT}`,
      },
      body: JSON.stringify({ requests }),
    });
    if (!r.ok) throw new Error(`Live TAB bridge HTTP ${r.status}`);
    const body = await r.json();
    if (!body?.ok || !Array.isArray(body.results)) throw new Error(body?.error || 'Live TAB bridge returned invalid data');
    return body.results;
  }

  function findCard(race) {
    return [...document.querySelectorAll('.watch-card')].find(card => {
      const label = card.querySelector('.watch-race')?.textContent || '';
      return label.trim().toUpperCase().startsWith(race);
    }) || null;
  }

  function gateRows(card) {
    return [...card.querySelectorAll('div')].filter(row => {
      const first = row.children?.[0]?.textContent || '';
      return /^\d\.\s/.test(first.trim()) && row.children.length >= 3;
    });
  }

  function paintRow(row, mode, detail) {
    if (!row) return;
    const pass = mode === 'PASS';
    const wait = mode === 'WAIT';
    row.style.background = pass ? '#0d3525' : wait ? '#33270e' : '#35151d';
    row.style.borderColor = pass ? '#2a8058' : wait ? '#735a27' : '#74323e';
    if (row.children[1]) {
      row.children[1].textContent = mode;
      row.children[1].style.color = pass ? '#78f2b5' : wait ? '#ffc34f' : '#ff9eaa';
    }
    if (row.children[2]) row.children[2].textContent = detail;
  }

  function setCardStatus(card, text, tone = 'wait') {
    const badge = card.querySelector('.not-bet');
    if (!badge) return;
    badge.textContent = text;
    badge.style.background = tone === 'ok' ? '#0d3525' : tone === 'bad' ? '#35151d' : '#33270e';
    badge.style.borderColor = tone === 'ok' ? '#2a8058' : tone === 'bad' ? '#74323e' : '#735a27';
    badge.style.color = tone === 'ok' ? '#78f2b5' : tone === 'bad' ? '#ff9eaa' : '#ffc34f';
  }

  function setExplainer(card, html) {
    const boxes = [...card.querySelectorAll('div')];
    const box = boxes.find(x => (x.textContent || '').trim().startsWith('Why no bet yet:'));
    if (box) box.innerHTML = `<b style="color:white">Why no bet yet:</b> ${html}`;
  }

  function liveStamp(result) {
    const d = new Date(result?.fetchedAt || Date.now());
    if (Number.isNaN(d.getTime())) return 'just now';
    return new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Australia/Perth' }).format(d) + ' Perth';
  }

  function renderRace(item, result) {
    const race = raceCode(item.race || item.code);
    const card = findCard(race);
    if (!card) return;
    const horseEl = card.querySelector('strong');
    const rows = gateRows(card);
    const fieldRow = rows.find(r => (r.children[0]?.textContent || '').includes('FIELD'));
    const favRow = rows.find(r => (r.children[0]?.textContent || '').includes('FAVOURITE'));
    const priceRow = rows.find(r => (r.children[0]?.textContent || '').includes('PRICE'));
    const lockRow = rows.find(r => (r.children[0]?.textContent || '').includes('BET LOCKED'));
    const gate = Number(item.priceGate || 3);

    paintRow(fieldRow, item.fieldsConfirmed === true ? 'PASS' : 'WAIT', item.fieldsConfirmed === true ? 'Field confirmed' : 'Field not confirmed yet');
    paintRow(lockRow, 'WAIT', 'FINAL V11 STAKE > A$0 HAS NOT BEEN RECEIVED');

    if (!result?.ok) {
      if (horseEl) {
        horseEl.textContent = 'LIVE MARKET UNVERIFIED';
        horseEl.style.color = '#ffc34f';
      }
      paintRow(favRow, 'WAIT', `TAB live favourite unavailable (${String(result?.error || 'feed error')})`);
      paintRow(priceRow, 'WAIT', `No complete live TAB fixed-price market. Minimum is $${gate.toFixed(2)}.`);
      setCardStatus(card, 'LIVE TAB UNVERIFIED — DO NOT USE OLD FAVOURITE', 'bad');
      setExplainer(card, `The old saved horse is deliberately ignored. TAB did not return a complete verified live market, so <b>do not choose a horse manually</b>.`);
      return;
    }

    const favourites = Array.isArray(result.favourites) ? result.favourites : [];
    const livePrice = Number(result.favouritePrice);
    const pricePass = Number.isFinite(livePrice) && livePrice >= gate;

    if (result.favouriteType === 'EQUAL' || favourites.length > 1) {
      const names = favourites.map(x => x.name).filter(Boolean);
      if (horseEl) {
        horseEl.textContent = names.length ? `EQUAL FAVOURITES: ${names.join(' / ')}` : 'EQUAL FAVOURITES';
        horseEl.style.color = '#ffc34f';
      }
      paintRow(favRow, 'WAIT', `Equal TAB favourites at ${moneyOdds(livePrice)} — do not choose one manually`);
      paintRow(priceRow, pricePass ? 'PASS' : 'FAIL', `${moneyOdds(livePrice)} live TAB favourite price vs $${gate.toFixed(2)} minimum · ${liveStamp(result)}`);
      setCardStatus(card, 'EQUAL FAVOURITES — WAIT FOR EXACT LOCK', 'wait');
      setExplainer(card, `TAB currently has equal favourites. <b>Do not pick one yourself and do not split the stake.</b> Wait for a single favourite and the final V11 BET LOCKED instruction.`);
      return;
    }

    const fav = favourites[0];
    if (!fav?.name || !Number.isFinite(livePrice)) {
      if (horseEl) {
        horseEl.textContent = 'LIVE MARKET UNVERIFIED';
        horseEl.style.color = '#ffc34f';
      }
      paintRow(favRow, 'WAIT', 'TAB did not return one usable favourite');
      paintRow(priceRow, 'WAIT', 'No verified live favourite price');
      setCardStatus(card, 'WAIT — LIVE FAVOURITE UNVERIFIED', 'bad');
      return;
    }

    if (horseEl) {
      horseEl.textContent = fav.name;
      horseEl.style.color = '';
    }
    paintRow(favRow, 'PASS', `${fav.name} — LIVE TAB favourite at ${moneyOdds(livePrice)}`);
    paintRow(priceRow, pricePass ? 'PASS' : 'FAIL', `${moneyOdds(livePrice)} live TAB vs $${gate.toFixed(2)} minimum · checked ${liveStamp(result)}`);
    setCardStatus(card, pricePass ? 'LIVE PRICE PASSES — WAIT FOR BET LOCKED' : 'LIVE PRICE BELOW GATE — WAIT', pricePass ? 'ok' : 'bad');
    setExplainer(card, pricePass
      ? `TAB currently makes <b>${esc(fav.name)}</b> the favourite at <b>${moneyOdds(livePrice)}</b>. The price gate passes, but this is still <b>NOT A BET</b> until V11 produces FINAL STAKE &gt; A$0 and sends BET LOCKED.`
      : `TAB currently makes <b>${esc(fav.name)}</b> the favourite at <b>${moneyOdds(livePrice)}</b>, which is below the $${gate.toFixed(2)} minimum. Wait for the market and final V11 lock.`);
  }

  function renderTop(data, results) {
    const locked = Array.isArray(data.lockedBets) ? data.lockedBets : [];
    if (locked.length) return;
    const title = document.getElementById('decisionTitle');
    const message = document.getElementById('decisionMessage');
    const kicker = document.getElementById('decisionKicker');
    const bottomLabel = document.getElementById('bottomLabel');
    const bottomText = document.getElementById('bottomText');
    const freshness = document.getElementById('freshness');
    if (!title || !message || !kicker) return;

    const ok = results.filter(r => r?.ok);
    const failed = results.filter(r => !r?.ok);
    const equal = ok.filter(r => r.favouriteType === 'EQUAL' || (r.favourites || []).length > 1);
    const above = ok.filter(r => r.favouriteType === 'SINGLE' && Number(r.favouritePrice) >= 3);

    title.textContent = 'WAIT — NO BET YET';
    kicker.textContent = 'LIVE TAB CHECKING';
    if (bottomLabel) bottomLabel.textContent = 'LIVE TAB CHECKING';

    if (failed.length) {
      message.textContent = `${failed.map(r => r.race).join(', ')} cannot currently be verified from a complete live TAB fixed-price market. The app will not reuse yesterday's favourite.`;
      if (bottomText) bottomText.textContent = 'Live market incomplete/unavailable — old favourite ignored.';
    } else if (equal.length) {
      message.textContent = `${equal.map(r => r.race).join(', ')} currently has equal TAB favourites. Do not choose one manually. Wait for the market to separate and for BET LOCKED.`;
      if (bottomText) bottomText.textContent = 'Equal favourites — wait for an exact locked horse.';
    } else if (above.length) {
      message.textContent = `${above.map(r => r.race).join(', ')} currently passes the $3.00 live TAB price gate. Price alone is not a wager — final BET LOCKED is still required.`;
      if (bottomText) bottomText.textContent = 'Live price may pass; final V11 BET LOCKED still required.';
    } else {
      message.textContent = 'Live TAB favourites are updating automatically. No verified BET LOCKED instruction has been received.';
      if (bottomText) bottomText.textContent = 'Live favourites updating — no locked wager.';
    }
    if (freshness) freshness.textContent = `LIVE TAB · checked ${new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Australia/Perth' }).format(new Date())}`;
  }

  function markAllUnverified(reason) {
    document.querySelectorAll('.watch-card').forEach(card => {
      const horseEl = card.querySelector('strong');
      if (horseEl) {
        horseEl.textContent = 'LIVE MARKET UNVERIFIED';
        horseEl.style.color = '#ffc34f';
      }
      setCardStatus(card, 'LIVE TAB UNVERIFIED — STALE HORSE HIDDEN', 'bad');
      setExplainer(card, `Live TAB refresh failed (${esc(reason)}). The app is hiding the saved favourite rather than pretending it is current.`);
    });
    const freshness = document.getElementById('freshness');
    if (freshness) freshness.textContent = 'LIVE TAB UNVERIFIED';
  }

  async function refreshLive() {
    if (running || document.visibilityState !== 'visible') return;
    running = true;
    try {
      const data = await fetchJson('./current.json');
      const watch = Array.isArray(data.watchlist) ? data.watchlist : [];
      const requests = watch.map(item => ({
        race: raceCode(item.race || item.code),
        date: item.date,
        venue: item.venue || item.region,
      })).filter(x => x.race && x.date && x.venue);
      if (!requests.length) return;
      const results = await fetchLive(requests);
      const byRace = new Map(results.map(r => [raceCode(r.race), r]));
      watch.forEach(item => renderRace(item, byRace.get(raceCode(item.race || item.code))));
      renderTop(data, results);
      lastGoodAt = Date.now();
    } catch (error) {
      console.error('Live TAB refresh failed', error);
      if (!lastGoodAt || Date.now() - lastGoodAt > MAX_LIVE_AGE_MS) markAllUnverified(error instanceof Error ? error.message : 'feed error');
    } finally {
      running = false;
    }
  }

  function schedule() {
    setTimeout(refreshLive, 800);
    setInterval(refreshLive, POLL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(refreshLive, 250);
    });
    window.addEventListener('online', () => setTimeout(refreshLive, 250));
    document.getElementById('refreshButton')?.addEventListener('click', () => setTimeout(refreshLive, 450));
    document.getElementById('bottomRefresh')?.addEventListener('click', () => setTimeout(refreshLive, 450));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();
