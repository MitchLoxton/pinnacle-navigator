(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const state = { data: null, stats: null, loading: false };
  const LOCK_STALE_MINUTES = 90;

  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;

  function formatUpdated(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Update time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth'
    }).format(d) + ' Perth';
  }

  function feedAgeMinutes(value) {
    const t = new Date(value).getTime();
    if (!Number.isFinite(t)) return Infinity;
    return Math.max(0, (Date.now() - t) / 60000);
  }

  function isFreshEnoughForLockedBet(data) {
    return navigator.onLine && feedAgeMinutes(data?.updatedAt) <= LOCK_STALE_MINUTES;
  }

  function lockedInstruction(b) {
    const stake = num(b.stakeAud) ?? num(b.stake) ?? 0;
    const min = num(b.minExec) ?? num(b.minPrice) ?? num(b.priceGate) ?? 3;
    const horse = b.horse || b.selection || 'Horse TBC';
    const race = b.race || b.code || 'Race';
    const venue = b.venue || b.region || '';
    const jump = b.jumpTime || b.time || '';
    return `
      <article class="locked-bet">
        <div class="bet-badge">BET THIS</div>
        <div class="race-line">${esc(race)}${venue ? ' · ' + esc(venue) : ''}${jump ? ' · ' + esc(jump) : ''}</div>
        <div class="horse-name">${esc(horse)}</div>
        <div class="bet-numbers">
          <div><span>STAKE</span><strong>${stake > 0 ? money.format(stake) : 'WAIT FOR STAKE'}</strong></div>
          <div><span>MIN ODDS</span><strong>${min > 0 ? '$' + min.toFixed(2) : '$3.00'}</strong></div>
        </div>
        <div class="bet-rule">Fixed WIN market · exact horse · never exceed the model stake.</div>
      </article>`;
  }

  function watchCard(item) {
    const race = item.race || item.code || 'Race TBC';
    const horse = item.provisionalHorse || item.horse || 'Favourite TBC';
    const venue = item.venue || item.region || '';
    const stake = num(item.coreBaseReferenceAud);
    return `
      <article class="watch-card">
        <div>
          <div class="watch-race">${esc(race)}${venue ? ' · ' + esc(venue) : ''}</div>
          <strong>${esc(horse)}</strong>
          <span>${stake ? 'Core reference ' + money.format(stake) + ' · ' : ''}waiting for final lock</span>
        </div>
        <div class="not-bet">NOT A BET</div>
      </article>`;
  }

  function setDecision(mode, title, message, kicker, bottomText) {
    const card = $('decisionCard');
    const bottom = $('bottomCommand');
    card.className = `decision-card ${mode}`;
    bottom.className = `bottom-command ${mode}`;
    $('decisionKicker').textContent = kicker;
    $('decisionTitle').textContent = title;
    $('decisionMessage').textContent = message;
    $('bottomLabel').textContent = kicker;
    $('bottomText').textContent = bottomText;
  }

  function renderDecision(data) {
    const locked = Array.isArray(data.lockedBets) ? data.lockedBets : [];
    const fresh = isFreshEnoughForLockedBet(data);
    $('lockedBets').innerHTML = '';

    if (locked.length && !fresh) {
      setDecision(
        'blocked',
        'DO NOT BET',
        navigator.onLine ? 'A locked signal exists, but the feed is too old. Refresh before risking money.' : 'You are offline. A locked signal must be re-verified online before betting.',
        'STOP — REFRESH',
        'Blocked until the latest locked signal is verified.'
      );
      $('lockedBets').innerHTML = locked.map(lockedInstruction).join('');
      return;
    }

    if (locked.length === 0) {
      setDecision(
        'no-bet',
        'DO NOT BET',
        'There is no BET LOCKED signal right now. Do nothing.',
        'NO BET',
        'No locked wager right now.'
      );
      return;
    }

    setDecision(
      'bet-now',
      locked.length === 1 ? 'BET NOW' : `BET ${locked.length} RACES`,
      'Only place the wager(s) shown below. Do not add anything else.',
      'BET LOCKED',
      locked.length === 1 ? 'A locked bet is ready — use the exact instruction above.' : `${locked.length} locked bets are ready.`
    );
    $('lockedBets').innerHTML = locked.map(lockedInstruction).join('');
  }

  function renderWatchlist(data) {
    const items = Array.isArray(data.watchlist) ? data.watchlist : [];
    $('watchCount').textContent = String(items.length);
    $('watchlist').innerHTML = items.length
      ? items.map(watchCard).join('')
      : '<div class="empty-watch">Nothing close to a signal right now.</div>';
  }

  function renderDetails(data, stats) {
    $('weekLabel').textContent = data.weekLabel || 'Current racing week';
    $('updatedAt').textContent = data.updatedAt ? 'Updated ' + formatUpdated(data.updatedAt) : 'Update time unavailable';
    const age = feedAgeMinutes(data.updatedAt);
    const feedText = !navigator.onLine ? 'OFFLINE' : Number.isFinite(age) ? (age < 2 ? 'LIVE · just updated' : `ONLINE · ${Math.floor(age)} min old`) : 'UNKNOWN';
    $('freshness').textContent = feedText;
    $('feedStatus').textContent = feedText;

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
    if (manual) $('freshness').textContent = 'Refreshing…';

    try {
      const data = await fetchJson('./current.json');
      state.data = data;
      renderDecision(data);
      renderWatchlist(data);
      try {
        state.stats = await fetchJson('./stats.json');
      } catch (e) {
        console.warn('Stats unavailable', e);
      }
      renderDetails(data, state.stats);
    } catch (e) {
      console.error(e);
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

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
    }
  }

  $('refreshButton').addEventListener('click', () => loadData(true));
  $('bottomRefresh').addEventListener('click', () => loadData(true));
  window.addEventListener('online', () => loadData(true));
  window.addEventListener('offline', () => state.data && renderDecision(state.data));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadData(false);
  });

  registerServiceWorker();
  loadData(false);
  setInterval(() => {
    if (document.visibilityState === 'visible') loadData(false);
  }, 30000);
})();
