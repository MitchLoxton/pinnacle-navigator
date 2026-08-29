(() => {
  'use strict';

  const LIVE_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-tab-live';
  const ANON_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 15000;
  const MAX_LIVE_AGE_MS = 45000;
  let running = false;
  let lastGoodAt = 0;

  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const raceCode = value => String(value || '').trim().toUpperCase();
  const moneyOdds = value => Number.isFinite(Number(value)) ? '$' + Number(value).toFixed(2) : '—';
  const humanError = value => String(value || 'feed error').replaceAll('_', ' ').toLowerCase();

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
    for (const container of [...card.children]) {
      if (!(container instanceof HTMLElement) || container.tagName !== 'DIV') continue;
      const rows = [...container.children].filter(row => {
        if (!(row instanceof HTMLElement) || row.tagName !== 'DIV' || row.children.length !== 3) return false;
        const label = row.children[0]?.textContent || '';
        return /^\d\.\s/.test(label.trim());
      });
      if (rows.length === 4) return rows;
    }
    return [];
  }

  function rowByLabel(rows, label) {
    return rows.find(row => (row.children[0]?.textContent || '').toUpperCase().includes(label)) || null;
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
    const box = [...card.children].find(el => el instanceof HTMLElement && (el.textContent || '').trim().startsWith('Why no bet yet:'));
    if (box) box.innerHTML = `<b style="color:white">Why no bet yet:</b> ${html}`;
  }

  function liveStamp(result) {
    const d = new Date(result?.fetchedAt || Date.now());
    if (Number.isNaN(d.getTime())) return 'just now';
    return new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Australia/Perth'
    }).format(d) + ' Perth';
  }

  function ensureOddsBoard(card) {
    let board = card.querySelector('.live-odds-board');
    if (board) return board;
    board = document.createElement('div');
    board.className = 'live-odds-board';
    const explainer = [...card.children].find(el => el instanceof HTMLElement && (el.textContent || '').trim().startsWith('Why no bet yet:'));
    if (explainer) explainer.insertAdjacentElement('afterend', board);
    else card.appendChild(board);
    return board;
  }

  function renderOddsBoard(card, result) {
    const board = ensureOddsBoard(card);
    const runners = Array.isArray(result?.runners) ? result.runners : [];
    const active = runners
      .filter(r => !r?.scratched)
      .sort((a, b) => {
        const ap = Number(a?.price);
        const bp = Number(b?.price);
        const av = Number.isFinite(ap) ? ap : Infinity;
        const bv = Number.isFinite(bp) ? bp : Infinity;
        if (av !== bv) return av - bv;
        return Number(a?.number || 999) - Number(b?.number || 999);
      });
    const favouriteNames = new Set((Array.isArray(result?.favourites) ? result.favourites : []).map(x => String(x?.name || '').toUpperCase()));
    const pricedCount = active.filter(r => Number.isFinite(Number(r?.price))).length;

    if (!active.length) {
      board.innerHTML = `
        <div style="margin-top:10px;padding:11px;border-radius:11px;background:#101b2b;border:1px solid #2d425c">
          <div style="font-size:10px;font-weight:900;letter-spacing:.06em;color:#9eb3ca">LIVE TAB ODDS</div>
          <div style="margin-top:5px;color:#ffc34f;font-size:11px;font-weight:800">No runner prices returned yet.</div>
        </div>`;
      return;
    }

    const rows = active.map(runner => {
      const price = Number(runner?.price);
      const hasPrice = Number.isFinite(price);
      const isFav = favouriteNames.has(String(runner?.name || '').toUpperCase());
      const priceText = hasPrice ? moneyOdds(price) : 'NO QUOTE';
      const bg = isFav ? '#0d3525' : '#0b1524';
      const border = isFav ? '#2a8058' : '#263950';
      const priceColor = isFav ? '#78f2b5' : hasPrice ? '#f1f5f9' : '#ffc34f';
      return `
        <div style="display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;padding:7px 8px;border-radius:9px;background:${bg};border:1px solid ${border}">
          <span style="font-size:10px;color:#8fa5bd;font-weight:800">#${esc(runner?.number ?? '—')}</span>
          <span style="font-size:11px;color:#e7edf5;font-weight:${isFav ? '900' : '700'}">${isFav ? '★ ' : ''}${esc(runner?.name || 'UNKNOWN')}</span>
          <strong style="font-size:12px;color:${priceColor};white-space:nowrap">${priceText}</strong>
        </div>`;
    }).join('');

    const heading = result?.ok ? 'LIVE TAB FIXED-WIN ODDS' : 'LIVE TAB ODDS — PARTIAL MARKET';
    const tone = result?.ok ? '#78f2b5' : '#ffc34f';
    const method = result?.verificationMethod === 'TAB_FAVOURITE_FLAG'
      ? 'Favourite verified by TAB favourite flag.'
      : result?.verificationMethod === 'COMPLETE_MARKET_LOWEST_PRICE'
        ? 'Favourite verified from the complete fixed-price market.'
        : 'Favourite is not verified until TAB completes the market or flags the favourite.';

    board.innerHTML = `
      <div style="margin-top:10px;padding:11px;border-radius:11px;background:#081421;border:1px solid #2b4058">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
          <div>
            <div style="font-size:10px;font-weight:950;letter-spacing:.06em;color:${tone}">${heading}</div>
            <div style="margin-top:3px;color:#93a9c0;font-size:9px">${pricedCount}/${active.length} active runners priced · checked ${esc(liveStamp(result))}</div>
          </div>
          <div style="font-size:9px;color:#8fa5bd;text-align:right">AUTO 15s</div>
        </div>
        <div style="display:grid;gap:5px;margin-top:9px;max-height:290px;overflow:auto">${rows}</div>
        <div style="margin-top:8px;color:#9fb0c3;font-size:9px;line-height:1.4">${esc(method)}</div>
      </div>`;
  }

  function renderRace(item, result) {
    const race = raceCode(item.race || item.code);
    const card = findCard(race);
    if (!card) return;

    const horseEl = [...card.children].find(el => el.tagName === 'STRONG') || null;
    const rows = gateRows(card);
    const fieldRow = rowByLabel(rows, 'FIELD');
    const favRow = rowByLabel(rows, 'FAVOURITE');
    const priceRow = rowByLabel(rows, 'PRICE');
    const lockRow = rowByLabel(rows, 'BET LOCKED');
    const gate = Number(item.priceGate || 3);

    paintRow(fieldRow, item.fieldsConfirmed === true ? 'PASS' : 'WAIT', item.fieldsConfirmed === true ? 'Field confirmed' : 'Field not confirmed yet');
    paintRow(lockRow, 'WAIT', 'FINAL V11 STAKE > A$0 HAS NOT BEEN RECEIVED');
    renderOddsBoard(card, result);

    if (!result?.ok) {
      const error = humanError(result?.error);
      const active = Array.isArray(result?.runners) ? result.runners.filter(r => !r?.scratched) : [];
      const pricedCount = active.filter(r => Number.isFinite(Number(r?.price))).length;
      if (horseEl) {
        horseEl.textContent = active.length ? 'LIVE MARKET PARTIAL — FAVOURITE UNVERIFIED' : 'LIVE MARKET UNVERIFIED';
        horseEl.style.color = '#ffc34f';
      }
      paintRow(favRow, 'WAIT', `Live TAB favourite unavailable: ${error}`);
      paintRow(priceRow, 'WAIT', active.length
        ? `${pricedCount}/${active.length} active TAB prices are live. Favourite not verified yet.`
        : `No complete live TAB fixed-price market. Minimum is $${gate.toFixed(2)}.`);
      setCardStatus(card, active.length ? 'PARTIAL TAB MARKET — WAIT' : 'LIVE TAB UNVERIFIED — WAIT', 'bad');
      setExplainer(card, active.length
        ? `TAB is returning live prices, but it has not supplied enough information to verify the favourite (${esc(error)}). The live odds are shown below; <b>do not choose the favourite manually</b>.`
        : `TAB could not provide a verified live market (${esc(error)}). The saved horse is hidden rather than being presented as current.`);
      return;
    }

    const favourites = Array.isArray(result.favourites) ? result.favourites : [];
    const livePrice = Number(result.favouritePrice);
    const pricePass = Number.isFinite(livePrice) && livePrice >= gate;
    const methodText = result.verificationMethod === 'TAB_FAVOURITE_FLAG' ? 'TAB FLAG' : 'FULL MARKET';

    if (result.favouriteType === 'EQUAL' || favourites.length > 1) {
      const names = favourites.map(x => x.name).filter(Boolean);
      if (horseEl) {
        horseEl.textContent = names.length ? `EQUAL FAVOURITES: ${names.join(' / ')}` : 'EQUAL FAVOURITES';
        horseEl.style.color = '#ffc34f';
      }
      paintRow(favRow, 'WAIT', `Equal TAB favourites at ${moneyOdds(livePrice)} · ${methodText}`);
      paintRow(priceRow, pricePass ? 'PASS' : 'FAIL', `${moneyOdds(livePrice)} live TAB favourite price vs $${gate.toFixed(2)} minimum · ${liveStamp(result)}`);
      setCardStatus(card, 'EQUAL FAVOURITES — WAIT FOR EXACT LOCK', 'wait');
      setExplainer(card, `TAB currently has equal favourites. <b>Do not pick one yourself and do not split the stake.</b> Wait for the market to separate and for the final V11 BET LOCKED instruction.`);
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
    paintRow(favRow, 'PASS', `${fav.name} — LIVE TAB favourite at ${moneyOdds(livePrice)} · ${methodText}`);
    paintRow(priceRow, pricePass ? 'PASS' : 'FAIL', `${moneyOdds(livePrice)} live TAB vs $${gate.toFixed(2)} minimum · checked ${liveStamp(result)}`);
    setCardStatus(card, pricePass ? 'LIVE PRICE PASSES — WAIT FOR BET LOCKED' : 'LIVE PRICE BELOW GATE — WAIT', pricePass ? 'ok' : 'bad');
    setExplainer(card, pricePass
      ? `TAB currently makes <b>${esc(fav.name)}</b> the verified favourite at <b>${moneyOdds(livePrice)}</b>. The price gate passes, but this is still <b>NOT A BET</b> until V11 produces FINAL STAKE &gt; A$0 and sends BET LOCKED.`
      : `TAB currently makes <b>${esc(fav.name)}</b> the verified favourite at <b>${moneyOdds(livePrice)}</b>, which is below the $${gate.toFixed(2)} minimum. Wait for the market and final V11 lock.`);
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
    kicker.textContent = 'LIVE TAB · AUTO 15S';
    if (bottomLabel) bottomLabel.textContent = 'LIVE TAB · AUTO 15S';

    if (failed.length) {
      const reasons = failed.map(r => `${r.race}: ${humanError(r.error)}`).join(' · ');
      message.textContent = `Live TAB odds are updating, but ${failed.map(r => r.race).join(', ')} is not fully verified yet. ${reasons}. See each race's live odds board below.`;
      if (bottomText) bottomText.textContent = 'Live odds updating; one or more favourites still unverified.';
    } else if (equal.length) {
      message.textContent = `${equal.map(r => r.race).join(', ')} currently has equal TAB favourites. Live odds are shown below. Wait for the market to separate and for BET LOCKED.`;
      if (bottomText) bottomText.textContent = 'Equal favourites — live odds updating.';
    } else if (above.length) {
      message.textContent = `${above.map(r => r.race).join(', ')} currently passes the $3.00 live TAB price gate. Live odds update every 15 seconds. Final BET LOCKED is still required.`;
      if (bottomText) bottomText.textContent = 'Live odds updating; final V11 BET LOCKED still required.';
    } else {
      message.textContent = 'Live TAB favourites and runner odds are updating every 15 seconds. No verified BET LOCKED instruction has been received.';
      if (bottomText) bottomText.textContent = 'Live odds updating — no locked wager.';
    }

    if (freshness) freshness.textContent = `LIVE TAB · checked ${new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Australia/Perth'
    }).format(new Date())}`;
  }

  function markAllUnverified(reason) {
    document.querySelectorAll('.watch-card').forEach(card => {
      const horseEl = [...card.children].find(el => el.tagName === 'STRONG') || null;
      if (horseEl) {
        horseEl.textContent = 'LIVE MARKET UNVERIFIED';
        horseEl.style.color = '#ffc34f';
      }
      const rows = gateRows(card);
      paintRow(rowByLabel(rows, 'FAVOURITE'), 'WAIT', 'Live TAB refresh failed');
      paintRow(rowByLabel(rows, 'PRICE'), 'WAIT', 'Live TAB refresh failed');
      setCardStatus(card, 'LIVE TAB UNVERIFIED — STALE HORSE HIDDEN', 'bad');
      setExplainer(card, `Live TAB refresh failed (${esc(reason)}). The app is hiding the saved favourite rather than pretending it is current.`);
      renderOddsBoard(card, null);
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
      if (!lastGoodAt || Date.now() - lastGoodAt > MAX_LIVE_AGE_MS) {
        markAllUnverified(error instanceof Error ? error.message : 'feed error');
      }
    } finally {
      running = false;
    }
  }

  function schedule() {
    setTimeout(refreshLive, 400);
    setInterval(refreshLive, POLL_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') setTimeout(refreshLive, 100);
    });
    window.addEventListener('online', () => setTimeout(refreshLive, 100));
    document.getElementById('refreshButton')?.addEventListener('click', () => setTimeout(refreshLive, 250));
    document.getElementById('bottomRefresh')?.addEventListener('click', () => setTimeout(refreshLive, 250));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();
