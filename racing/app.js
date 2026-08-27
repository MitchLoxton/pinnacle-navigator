(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const state = { data: null, stats: null, loading: false, lastCheckedAt: null, actionableKey: '' };
  const LOCK_STALE_MINUTES = 15;
  const MAX_STAKE = 10000;
  const MIN_GLOBAL_PRICE = 3;

  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;

  function perthParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Perth', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(date);
    return Object.fromEntries(parts.map(p => [p.type, p.value]));
  }

  function todayPerthYmd() {
    const p = perthParts();
    return `${p.year}-${p.month}-${p.day}`;
  }

  function formatUpdated(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Update time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth'
    }).format(d) + ' Perth';
  }

  function formatChecked(value) {
    if (!value) return 'Not checked yet';
    return 'Checked ' + new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: 'Australia/Perth'
    }).format(value);
  }

  function feedAgeMinutes(value) {
    const t = new Date(value).getTime();
    if (!Number.isFinite(t)) return Infinity;
    return Math.max(0, (Date.now() - t) / 60000);
  }

  function normaliseRace(value) {
    return String(value || '').trim().toUpperCase();
  }

  function meetingDateForRace(data, race) {
    const prefix = normaliseRace(race).slice(0, 2);
    const meetings = Array.isArray(data?.meetings) ? data.meetings : [];
    const meeting = meetings.find(m => String(m.code || '').toUpperCase().startsWith(prefix));
    return meeting?.date || null;
  }

  function isPlaceholderHorse(value) {
    const s = String(value || '').trim().toUpperCase();
    if (!s) return true;
    return s === 'HORSE TBC' || s === 'FAVOURITE TBC' || s === 'OFFICIAL FAVOURITE (TBC)' || s.includes('(TBC)');
  }

  function lockShape(b, data) {
    const stake = num(b?.stakeAud) ?? num(b?.stake);
    const min = num(b?.minExec) ?? num(b?.minPrice) ?? num(b?.priceGate);
    const horse = String(b?.horse || b?.selection || '').trim();
    const race = normaliseRace(b?.race || b?.code);
    const venue = String(b?.venue || b?.region || '').trim();
    const jump = String(b?.jumpTime || b?.time || '').trim();
    const meetingDate = b?.date || meetingDateForRace(data, race);
    return { stake, min, horse, race, venue, jump, meetingDate };
  }

  function validateLock(b, data) {
    const x = lockShape(b, data);
    const reasons = [];
    if (!/^(PR|SR|MR)[1-7]$/.test(x.race)) reasons.push('race code is missing or invalid');
    if (isPlaceholderHorse(x.horse)) reasons.push('horse is not confirmed');
    if (!(x.stake > 0 && x.stake <= MAX_STAKE)) reasons.push('stake is missing or outside the A$10,000 cap');
    if (x.stake > 0 && Math.abs((x.stake / 50) - Math.round(x.stake / 50)) > 1e-9) reasons.push('stake is not rounded to A$50');
    if (!(x.min >= MIN_GLOBAL_PRICE)) reasons.push('minimum executable odds are missing or below $3.00');
    if (!x.meetingDate) reasons.push('race date cannot be verified');
    else if (x.meetingDate !== todayPerthYmd()) reasons.push(`race date is ${x.meetingDate}, not today`);
    return { ...x, valid: reasons.length === 0, reasons };
  }

  function feedIsHealthy(data) {
    const appFeed = String(data?.health?.appFeed || '').toUpperCase();
    return !appFeed || appFeed.includes('GREEN') || appFeed.includes('OK');
  }

  function feedIsFresh(data) {
    return navigator.onLine && feedAgeMinutes(data?.updatedAt) <= LOCK_STALE_MINUTES;
  }

  function copyText(value, button) {
    const done = () => {
      const old = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      setTimeout(() => { button.textContent = old; button.classList.remove('copied'); }, 1400);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done).catch(() => {});
  }

  function lockedInstruction(lock, index, blocked = false) {
    const minText = lock.min > 0 ? '$' + lock.min.toFixed(2) : '—';
    const copy = `${lock.race} · ${lock.horse} · FIXED WIN · ${money.format(lock.stake)} · minimum odds ${minText}`;
    return `
      <article class="locked-bet ${blocked ? 'lock-blocked' : ''}">
        <div class="bet-badge">${blocked ? 'DO NOT PLACE' : 'BET THIS HORSE'}</div>
        <div class="race-line">${esc(lock.race)}${lock.venue ? ' · ' + esc(lock.venue) : ''}${lock.jump ? ' · ' + esc(lock.jump) : ''}</div>
        <div class="horse-name">${esc(lock.horse || 'UNCONFIRMED')}</div>
        <div class="market-line">FIXED WIN</div>
        <div class="bet-numbers">
          <div><span>EXACT STAKE</span><strong>${lock.stake > 0 ? money.format(lock.stake) : '—'}</strong></div>
          <div><span>DO NOT BET BELOW</span><strong>${minText}</strong></div>
        </div>
        ${blocked ? '' : `
        <label class="price-check">
          <span>Odds you can actually get</span>
          <input class="price-input" data-min="${lock.min}" data-result="priceResult${index}" type="number" min="1.01" step="0.01" inputmode="decimal" placeholder="e.g. ${Math.max(lock.min, 3).toFixed(2)}">
        </label>
        <div class="price-result waiting" id="priceResult${index}">Enter your bookmaker odds to double-check the price.</div>
        <button class="copy-bet" type="button" data-copy="${esc(copy)}">Copy bet instruction</button>`}
      </article>`;
  }

  function watchCard(item) {
    const race = normaliseRace(item.race || item.code) || 'Race TBC';
    const venue = item.venue || item.region || '';
    const horse = item.provisionalHorse || item.horse || '';
    const horseText = isPlaceholderHorse(horse) ? 'Favourite not confirmed' : horse;
    return `
      <article class="watch-card">
        <div>
          <div class="watch-race">${esc(race)}${venue ? ' · ' + esc(venue) : ''}</div>
          <strong>${esc(horseText)}</strong>
          <span>Possible future signal only. Wait for the big green BET NOW box.</span>
        </div>
        <div class="not-bet">NOT A BET</div>
      </article>`;
  }

  function setDecision(mode, title, message, kicker, bottomText) {
    $('decisionCard').className = `decision-card ${mode}`;
    $('bottomCommand').className = `bottom-command ${mode}`;
    $('decisionKicker').textContent = kicker;
    $('decisionTitle').textContent = title;
    $('decisionMessage').textContent = message;
    $('bottomLabel').textContent = kicker;
    $('bottomText').textContent = bottomText;
    document.title = mode === 'bet-now' ? 'BET NOW · MITCHELL Racing' : 'MITCHELL Racing';
  }

  function renderDecision(data) {
    const raw = Array.isArray(data.lockedBets) ? data.lockedBets : [];
    $('lockedBets').innerHTML = '';

    if (!raw.length) {
      state.actionableKey = '';
      setDecision('no-bet', 'DO NOT BET', 'There is no verified BET LOCKED signal right now. Do nothing.', 'NO BET', 'No locked wager right now.');
      return;
    }

    const locks = raw.map(b => validateLock(b, data));
    const keys = locks.map(x => `${x.race}|${x.horse.toUpperCase()}`);
    const duplicate = new Set(keys).size !== keys.length;
    const invalid = locks.filter(x => !x.valid);
    const fresh = feedIsFresh(data);
    const healthy = feedIsHealthy(data);

    if (!fresh || !healthy || invalid.length || duplicate) {
      const reasons = [];
      if (!navigator.onLine) reasons.push('you are offline');
      else if (!fresh) reasons.push(`the locked feed is more than ${LOCK_STALE_MINUTES} minutes old`);
      if (!healthy) reasons.push('the system health feed is not green');
      if (duplicate) reasons.push('duplicate locked instructions were detected');
      invalid.forEach(x => x.reasons.forEach(r => reasons.push(`${x.race || 'lock'}: ${r}`)));
      const unique = [...new Set(reasons)];
      state.actionableKey = '';
      setDecision('blocked', 'DO NOT BET', `A lock exists, but it failed a safety check: ${unique.join('; ')}. Refresh before risking money.`, 'STOP — REFRESH', 'Locked instruction blocked until every safety check passes.');
      $('lockedBets').innerHTML = locks.map((x, i) => lockedInstruction(x, i, true)).join('');
      return;
    }

    const actionKey = keys.sort().join('||') + '|' + data.updatedAt;
    if (state.actionableKey && state.actionableKey !== actionKey && navigator.vibrate) navigator.vibrate([180, 90, 180]);
    state.actionableKey = actionKey;
    setDecision('bet-now', locks.length === 1 ? 'BET NOW' : `BET ${locks.length} RACES`, 'Use only the exact instruction below. Check your actual bookmaker odds before placing it.', 'BET LOCKED · VERIFIED', locks.length === 1 ? 'Verified locked bet ready.' : `${locks.length} verified locked bets ready.`);
    $('lockedBets').innerHTML = locks.map((x, i) => lockedInstruction(x, i, false)).join('');
  }

  function renderWatchlist(data) {
    const items = Array.isArray(data.watchlist) ? data.watchlist : [];
    $('watchSummary').textContent = items.length ? `${items.length} possible ${items.length === 1 ? 'signal' : 'signals'} — do not bet yet` : 'No possible signals right now';
    $('watchlist').innerHTML = items.length ? items.map(watchCard).join('') : '<div class="empty-watch">Nothing close to a signal right now.</div>';
  }

  function renderDetails(data, stats) {
    $('weekLabel').textContent = data.weekLabel || 'Current racing week';
    $('updatedAt').textContent = data.updatedAt ? 'Data published ' + formatUpdated(data.updatedAt) : 'Data update time unavailable';
    state.lastCheckedAt = new Date();
    $('lastChecked').textContent = formatChecked(state.lastCheckedAt);

    const age = feedAgeMinutes(data.updatedAt);
    const lockedCount = Array.isArray(data.lockedBets) ? data.lockedBets.length : 0;
    const exactFeedText = !navigator.onLine ? 'OFFLINE' : Number.isFinite(age) ? (age < 2 ? 'LIVE DATA' : `ONLINE · DATA ${Math.floor(age)} MIN OLD`) : 'UNKNOWN';
    const actionFeedText = !navigator.onLine ? 'OFFLINE' : !lockedCount ? 'AUTO-CHECKING EVERY 30S' : age <= LOCK_STALE_MINUTES ? 'LOCK FEED FRESH' : 'LOCK FEED STALE';
    $('freshness').textContent = actionFeedText;
    $('feedStatus').textContent = exactFeedText;

    const season = data.season || {};
    const p = num(season.modelProfitAud);
    $('seasonProfit').textContent = p === null ? '—' : money.format(p);

    const h = stats?.historical || {};
    $('histAvg').textContent = num(h.avgCompletedFyAud) === null ? '—' : money.format(h.avgCompletedFyAud);
    $('histRoi').textContent = num(h.roiPct) === null ? '—' : Number(h.roiPct).toFixed(1) + '%';
  }

  async function fetchJson(path) {
    const r = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  async function loadData(manual = false) {
    if (state.loading) return;
    state.loading = true;
    $('refreshButton').disabled = true;
    $('bottomRefresh').disabled = true;
    if (manual) {
      $('freshness').textContent = 'Refreshing…';
      $('lastChecked').textContent = 'Checking now…';
    }

    try {
      const data = await fetchJson('./current.json');
      state.data = data;
      try {
        state.stats = await fetchJson('./stats.json');
      } catch (e) {
        console.warn('Stats unavailable', e);
      }
      renderDecision(data);
      renderWatchlist(data);
      renderDetails(data, state.stats);
    } catch (e) {
      console.error(e);
      state.lastCheckedAt = new Date();
      $('lastChecked').textContent = formatChecked(state.lastCheckedAt);
      if (state.data) {
        renderDecision(state.data);
        renderWatchlist(state.data);
        renderDetails(state.data, state.stats);
      } else {
        setDecision('blocked', 'DO NOT BET', 'The app cannot verify the latest race-day feed.', 'FEED ERROR', 'No verified feed — do not bet.');
        $('freshness').textContent = 'Could not load latest feed';
        $('feedStatus').textContent = 'ERROR';
      }
    } finally {
      state.loading = false;
      $('refreshButton').disabled = false;
      $('bottomRefresh').disabled = false;
    }
  }

  function setupInteractions() {
    document.addEventListener('input', event => {
      if (!event.target.classList.contains('price-input')) return;
      const input = event.target;
      const result = $(input.dataset.result);
      const min = Number(input.dataset.min);
      const price = Number(input.value);
      if (!Number.isFinite(price) || !input.value) {
        result.className = 'price-result waiting';
        result.textContent = 'Enter your bookmaker odds to double-check the price.';
      } else if (price >= min) {
        result.className = 'price-result ok';
        result.textContent = `PRICE OK · ${price.toFixed(2)} is at or above ${min.toFixed(2)}.`;
      } else {
        result.className = 'price-result bad';
        result.textContent = `TOO LOW · ${price.toFixed(2)} is below ${min.toFixed(2)}. DO NOT PLACE.`;
      }
    });

    document.addEventListener('click', event => {
      const button = event.target.closest('.copy-bet');
      if (button) copyText(button.dataset.copy || '', button);
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
  }

  $('refreshButton').addEventListener('click', () => loadData(true));
  $('bottomRefresh').addEventListener('click', () => loadData(true));
  window.addEventListener('online', () => loadData(true));
  window.addEventListener('offline', () => state.data && renderDecision(state.data));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadData(false);
  });

  setupInteractions();
  registerServiceWorker();
  loadData(false);
  setInterval(() => {
    if (document.visibilityState === 'visible') loadData(false);
  }, 30000);
})();
