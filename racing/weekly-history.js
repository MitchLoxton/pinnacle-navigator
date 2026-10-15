(() => {
  'use strict';

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const money = new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', maximumFractionDigits: 0
  });
  const cash = value => money.format(Number(value) || 0);
  const resultColor = result =>
    String(result).toUpperCase() === 'WIN' ? '#78f2b5' :
    String(result).toUpperCase() === 'LOSS' ? '#ff9eaa' : '#d1dfed';

  const dateLabel = value => {
    const d = new Date(String(value || '') + 'T12:00:00+08:00');
    return Number.isNaN(d.getTime()) ? 'LAST WEEK' :
      new Intl.DateTimeFormat('en-AU', {timeZone:'Australia/Perth',day:'numeric',month:'short'}).format(d).toUpperCase();
  };

  function raceRow(x) {
    const betNow = x && x.betNowSignal === true;
    const signal = betNow ? String(x.signalOutcome || 'PENDING').toUpperCase() : '';
    const signalPl = Number(x.signalModelPlAud);
    const signalPlText = Number.isFinite(signalPl) && x.signalModelPlAud !== null && x.signalModelPlAud !== undefined
      ? (signalPl > 0 ? '+' : '') + cash(signalPl)
      : 'PENDING';

    let extra = '';
    if (betNow) {
      extra = '<div style="grid-column:1/-1;margin-top:4px;padding:8px;border-radius:7px;background:#123226;color:' +
        resultColor(signal) + ';font-size:11px;font-weight:900">' +
        'PERMANENT BET NOW SYSTEM BET · ' + esc(x.signalHorse || x.favourite || '') +
        ' · ' + esc(cash(x.signalStakeAud)) +
        ' @ $' + esc(Number(x.signalPrice || 0).toFixed(2)) +
        ' · ' + esc(signal) +
        ' · SYSTEM P/L ' + esc(signalPlText) +
        '</div>';
    }
    return '<div style="display:grid;grid-template-columns:40px 1fr auto auto;gap:8px;align-items:center;padding:9px;border-radius:9px;background:#101b2b;font-size:11px">' +
      '<b style="color:#91a7c0">' + esc(x.race) + '</b>' +
      '<span style="color:#e6f1fc;font-weight:850;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(x.favourite || 'Favourite') + '</span>' +
      '<b style="color:' + resultColor(x.outcome) + '">' + esc(x.outcome || '?') + '</b>' +
      '<span style="color:#a7bbd0">S' + esc(x.stateBefore) + '→' + esc(x.stateAfter) + '</span>' +
      extra + '</div>';
  }

  function region(rows, prefix, name, fallback) {
    const items = rows.filter(x => String(x?.race || '').startsWith(prefix));
    const venue = items.find(x => x.venue)?.venue || fallback;
    return '<section style="padding:11px;border-radius:12px;background:#0b1726;border:1px solid #2d425c">' +
      '<strong style="font-size:11px;color:#fff">' + esc(name) + ' · ' + esc(venue) + '</strong>' +
      '<div style="display:grid;gap:5px;margin-top:9px">' + items.map(raceRow).join('') + '</div>' +
      '</section>';
  }

  function render(history) {
    const holder = document.getElementById('lastWeekLog');
    const summary = document.getElementById('lastWeekSummary');
    if (!holder || !summary) return;
    const rows = Array.isArray(history?.races) ? history.races :
      Array.isArray(history?.results) ? history.results : [];
    const totals = history?.summary || history?.systemSummary || {};
    const count = Number(totals.systemBets ?? totals.betNowSignals ?? rows.filter(x => x.betNowSignal === true).length) || 0;
    const pl = Number(totals.systemPlAud ?? totals.betNowSignalModelPlAud) || 0;
    const wins = Number(totals.favouriteWins ?? rows.filter(x => x.outcome === 'WIN').length);
    const losses = Number(totals.favouriteLosses ?? rows.filter(x => x.outcome === 'LOSS').length);
    const systemWins = Number(totals.betNowSignalWins ?? rows.filter(x => x.betNowSignal === true && x.signalOutcome === 'WIN').length) || 0;
    const systemLosses = Number(totals.betNowSignalLosses ?? rows.filter(x => x.betNowSignal === true && x.signalOutcome === 'LOSS').length) || 0;
    const plText = (pl > 0 ? '+' : '') + cash(pl);
    summary.textContent = rows.length + ' stream results · ' + count + ' permanent BET NOW system bet' + (count === 1 ? '' : 's');
    holder.innerHTML =
      '<div style="padding:13px;border-radius:12px;background:#162338;border:1px solid #36516e">' +
        '<div style="font-size:10px;color:#a1b7ce;font-weight:950">' + esc(dateLabel(history?.date)) + ' FINAL LOG</div>' +
        '<div style="font-size:16px;font-weight:950;color:#fff;margin-top:5px">' + wins + ' favourite wins · ' + losses + ' favourite losses</div>' +
        '<div style="font-size:13px;font-weight:900;margin-top:6px;color:' + resultColor(pl >= 0 ? 'WIN' : 'LOSS') + '">' +
        count + ' BET NOW SYSTEM BET' + (count === 1 ? '' : 'S') + ' · ' + systemWins + 'W/' + systemLosses + 'L · ' + esc(plText) + ' SYSTEM P/L</div>' +
        '<div style="font-size:10px;color:#bac8dc;margin-top:7px">Every genuine BET NOW instruction remains one permanent system bet at its original instructed stake and odds. Personal bookmaker execution does not change these totals.</div>' +
      '</div>' +
      '<div style="display:grid;gap:10px;margin-top:10px">' +
        region(rows, 'PR', 'PERTH', 'ASCOT') +
        region(rows, 'SR', 'SYDNEY', 'RANDWICK') +
        region(rows, 'MR', 'MELBOURNE', 'CAULFIELD') +
      '</div>';
  }

  async function refresh() {
    const holder = document.getElementById('lastWeekLog');
    if (!holder) return;
    try {
      const current = window.__MITCHELL_BASE_DATA ||
        await (await fetch('./current.json?history=' + Date.now(), {cache:'no-store'})).json();
      const path = current?.lastWeek?.historyFile;
      if (!path || !/^[./a-zA-Z0-9-]+\.json$/.test(path)) throw new Error('Invalid weekly history path');
      const response = await fetch(path + '?history=' + Date.now(), {cache:'no-store'});
      if (!response.ok) throw new Error('History HTTP ' + response.status);
      render(await response.json());
    } catch (error) {
      const summary = document.getElementById('lastWeekSummary');
      if (summary) summary.textContent = 'Weekly history unavailable';
      holder.textContent = 'Weekly race results could not be loaded. System BET NOW history remains separate and unchanged.';
      console.warn('Weekly history:', error);
    }
  }

  window.addEventListener('mitchell-base-ready', refresh);
  window.addEventListener('mitchell-refresh-live', refresh);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, {once:true});
  } else {
    refresh();
  }
})();
