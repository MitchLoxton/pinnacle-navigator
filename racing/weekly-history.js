(() => {
  'use strict';

  const esc = v => String(v ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');

  async function getJson(path) {
    const r = await fetch(`${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache:'no-store' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  function outcomeTone(outcome) {
    return String(outcome).toUpperCase() === 'WIN' ? '#78f2b5' : '#ff9eaa';
  }

  function groupRows(rows, prefix) {
    return rows.filter(x => String(x?.race || '').startsWith(prefix));
  }

  function venueFor(rows, fallback) {
    const venue = rows.find(x => x?.venue)?.venue;
    return venue || fallback;
  }

  function groupCard(label, rows) {
    return `<div style="padding:10px;border-radius:11px;background:#0b1726;border:1px solid #2d425c">
      <div style="font-size:10px;font-weight:950;color:#fff;letter-spacing:.04em">${esc(label)}</div>
      <div style="display:grid;gap:5px;margin-top:7px">
        ${rows.map(x => `<div style="display:grid;grid-template-columns:38px 1fr auto auto;gap:7px;align-items:center;padding:7px 8px;border-radius:8px;background:#101b2b;font-size:10px">
          <b style="color:#8fa5bd">${esc(x.race)}</b>
          <span style="color:#dbe6f4;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.favourite || 'Favourite')}</span>
          <b style="color:${outcomeTone(x.outcome)}">${esc(x.outcome)}</b>
          <span style="color:#8fa5bd">S${esc(x.stateBefore)}→${esc(x.stateAfter)}</span>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function dateLabel(value) {
    const d = new Date(`${value || ''}T00:00:00+08:00`);
    if (Number.isNaN(d.getTime())) return 'LAST WEEK';
    return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Perth',day:'numeric',month:'short'}).format(d).toUpperCase();
  }

  function render(history) {
    const box = document.getElementById('lastWeekLog');
    const summary = document.getElementById('lastWeekSummary');
    if (!box || !summary) return;

    const rows = Array.isArray(history?.races) ? history.races : (Array.isArray(history?.results) ? history.results : []);
    const system = history?.summary || history?.systemSummary || {};
    const wins = Number.isFinite(Number(system.favouriteWins)) ? Number(system.favouriteWins) : rows.filter(x => String(x?.outcome).toUpperCase() === 'WIN').length;
    const losses = Number.isFinite(Number(system.favouriteLosses)) ? Number(system.favouriteLosses) : rows.filter(x => String(x?.outcome).toUpperCase() === 'LOSS').length;
    const bets = Number(system.confirmedSystemBets) || 0;
    const signals = Number(system.betNowSignals) || 0;
    const cash = Number(system.systemCashPlAud) || 0;
    const money = new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(cash);

    const perth = groupRows(rows,'PR');
    const sydney = groupRows(rows,'SR');
    const melbourne = groupRows(rows,'MR');

    summary.textContent = `${rows.length} states logged · ${signals} BET NOW signal${signals===1?'':'s'} · ${bets} confirmed bet${bets===1?'':'s'}`;
    box.innerHTML = `
      <div style="padding:12px;border-radius:12px;background:#162338;border:1px solid #36516e">
        <div style="font-size:9px;color:#8fa5bd;font-weight:950;letter-spacing:.06em">${esc(dateLabel(history?.date))} FINAL LOG</div>
        <div style="font-size:15px;font-weight:1000;color:#fff;margin-top:4px">${wins} favourite wins · ${losses} favourite losses</div>
        <div style="font-size:12px;font-weight:950;color:#9eb3ca;margin-top:5px">BET NOW SIGNALS: ${signals} · CONFIRMED BETS: ${bets} · CASH P/L: ${esc(money)}</div>
        <div style="font-size:9px;color:#b7c5d5;line-height:1.4;margin-top:6px">Every BET NOW instruction stays in history. If accepted bookmaker execution is unconfirmed, the signal remains visible but does not alter counted-bet, turnover, cash P/L or ROI stats. Favourite results still move stream state independently.</div>
      </div>
      <div style="display:grid;gap:9px;margin-top:9px">
        ${groupCard(`PERTH · ${venueFor(perth,'BELMONT PARK')}`, perth)}
        ${groupCard(`SYDNEY · ${venueFor(sydney,'SYDNEY')}`, sydney)}
        ${groupCard(`MELBOURNE · ${venueFor(melbourne,'MELBOURNE')}`, melbourne)}
      </div>`;
  }

  async function refresh() {
    const box = document.getElementById('lastWeekLog');
    if (!box) return;
    try {
      const current = window.__MITCHELL_BASE_DATA || await getJson('./current.json');
      const path = current?.lastWeek?.historyFile || './history/2026-08-29.json';
      const history = await getJson(path);
      render(history);
    } catch (e) {
      const summary = document.getElementById('lastWeekSummary');
      if (summary) summary.textContent = 'Log unavailable';
      box.innerHTML = '<div style="padding:10px;color:#ffc34f">Last-week state log could not be loaded. This does not change the live betting decision.</div>';
      console.warn('weekly history', e);
    }
  }

  window.addEventListener('mitchell-base-ready', refresh);
  window.addEventListener('mitchell-refresh-live', refresh);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(refresh, 500), { once:true });
  else setTimeout(refresh, 500);
})();
