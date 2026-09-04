(() => {
  'use strict';

  const state = {
    au: { status:'CHECKING', checkedAt:null, pollMs:15000, reason:'' },
    hk: { status:'SHADOW', checkedAt:null, action:'WAIT', reason:'Live HK model/quote feed not verified.' },
    assist: { wakeStatus:'IDLE', alertsEnabled:false, notificationPermission:'default', nearestLeadSeconds:null }
  };

  function addStyles() {
    if (document.getElementById('mitchell-health-styles')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-health-styles';
    style.textContent = `
      .system-health{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:0 0 10px;padding:8px;border:1px solid #29405a;border-radius:13px;background:rgba(8,20,34,.92)}
      .health-chip{min-width:0;padding:8px 9px;border:1px solid #304760;border-radius:10px;background:#0f1d2d}
      .health-chip span{display:block;color:#839ab2;font-size:7px;font-weight:950;letter-spacing:.08em}.health-chip strong{display:block;margin-top:3px;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.health-chip small{display:block;margin-top:3px;color:#8499af;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .health-chip.good{border-color:#2a8058;background:#0c2a1e}.health-chip.good strong{color:#78f2b5}.health-chip.warn{border-color:#735a27;background:#2a2413}.health-chip.warn strong{color:#ffc34f}.health-chip.bad{border-color:#74323e;background:#30161d}.health-chip.bad strong{color:#ff9eaa}
      .health-action{width:100%;margin-top:6px;min-height:28px;border-radius:8px;border:1px solid #3b5c79;background:#11263a;color:#dce9f5;font-size:8px;font-weight:950;cursor:pointer}.health-action.on{border-color:#2a8058;background:#123a2a;color:#9ff4c7}.health-action:disabled{opacity:.55;cursor:wait}
      @media(max-width:700px){.system-health{grid-template-columns:1fr 1fr}}
      @media(max-width:360px){.system-health{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensure() {
    if (document.getElementById('systemHealth')) return true;
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher) return false;
    addStyles();
    const bar = document.createElement('section');
    bar.id = 'systemHealth';
    bar.className = 'system-health';
    bar.setAttribute('aria-live','polite');
    bar.setAttribute('aria-label','Live system health');
    switcher.insertAdjacentElement('afterend', bar);
    render();
    return true;
  }

  const ageSec = value => value ? Math.max(0, Math.floor((Date.now() - Number(value)) / 1000)) : null;
  const cycle = ms => Number.isFinite(Number(ms)) ? `${Math.max(1,Math.round(Number(ms)/1000))}s cycle` : 'auto';

  function render() {
    if (!ensure()) return;
    const bar = document.getElementById('systemHealth');
    const online = navigator.onLine !== false;
    const auAge = ageSec(state.au.checkedAt);
    const auStale = state.au.status === 'OK' && auAge !== null && auAge > 30;
    const auTone = !online || state.au.status === 'ERROR' || auStale ? 'bad' : state.au.status === 'OK' ? 'good' : 'warn';
    const auText = !online ? 'OFFLINE · NO BET' : auStale ? 'STALE · NO BET' : state.au.status === 'OK' ? 'VERIFIED LIVE' : state.au.status === 'ERROR' ? 'BLOCKED' : 'CHECKING';
    const auSmall = state.au.status === 'OK' && auAge !== null ? `${auAge}s ago · ${cycle(state.au.pollMs)}` : (state.au.reason || cycle(state.au.pollMs));

    const hkTone = state.hk.status === 'READY' && state.hk.action === 'BET NOW' ? 'good' : state.hk.status === 'ERROR' ? 'bad' : 'warn';
    const hkText = state.hk.status === 'READY' ? `HK · ${state.hk.action}` : state.hk.status === 'ERROR' ? 'HK · BLOCKED' : 'HK · SHADOW / WAIT';
    const hkAge = ageSec(state.hk.checkedAt);
    const hkSmall = hkAge !== null ? `${hkAge}s since page check` : (state.hk.reason || 'fail closed');

    const wake = String(state.assist.wakeStatus || 'IDLE').toUpperCase();
    const wakeGood = wake === 'AWAKE';
    const wakeBad = wake === 'BLOCKED';
    const assistTone = wakeBad ? 'bad' : wakeGood || state.assist.alertsEnabled ? 'good' : 'warn';
    const assistText = wakeGood ? 'SCREEN AWAKE' : wake === 'UNSUPPORTED' ? 'WAKE UNSUPPORTED' : wakeBad ? 'WAKE BLOCKED' : 'RACE ASSIST READY';
    const lead = Number(state.assist.nearestLeadSeconds);
    const assistSmall = `${state.assist.alertsEnabled ? 'alerts ON' : 'alerts OFF'}${Number.isFinite(lead) && lead > 0 ? ` · ${Math.ceil(lead)}s nearest` : ''}`;

    bar.innerHTML = `
      <div class="health-chip ${online?'good':'bad'}"><span>CONNECTION</span><strong>${online?'ONLINE':'OFFLINE · NO BET'}</strong><small>${online?'Browser connected':'Reconnect before any action'}</small></div>
      <div class="health-chip ${auTone}"><span>AUSTRALIA V11</span><strong>${auText}</strong><small>${auSmall}</small></div>
      <div class="health-chip ${hkTone}"><span>HONG KONG V4</span><strong>${hkText}</strong><small>${hkSmall}</small></div>
      <div class="health-chip ${assistTone}"><span>RACE-DAY ASSIST</span><strong>${assistText}</strong><small>${assistSmall}</small><button type="button" class="health-action ${state.assist.alertsEnabled?'on':''}" id="raceAlertsToggle">${state.assist.alertsEnabled?'ALERTS ON · TAP TO TURN OFF':'ENABLE BET ALERTS'}</button></div>`;

    const button = document.getElementById('raceAlertsToggle');
    button?.addEventListener('click', async () => {
      if (!window.MITCHELL_RACE_ASSIST) return;
      button.disabled = true;
      try {
        if (state.assist.alertsEnabled) window.MITCHELL_RACE_ASSIST.disableAlerts();
        else await window.MITCHELL_RACE_ASSIST.enableAlerts();
      } finally {
        button.disabled = false;
      }
    }, { once:true });
  }

  window.addEventListener('mitchell-live-health', event => {
    state.au = { ...state.au, ...(event.detail || {}) };
    render();
  });
  window.addEventListener('mitchell-hk-health', event => {
    state.hk = { ...state.hk, ...(event.detail || {}) };
    render();
  });
  window.addEventListener('mitchell-assist-health', event => {
    state.assist = { ...state.assist, ...(event.detail || {}) };
    render();
  });
  window.addEventListener('online', render);
  window.addEventListener('offline', render);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure, { once:true });
  else ensure();
  const observer = new MutationObserver(() => { if (ensure()) observer.disconnect(); });
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(() => observer.disconnect(), 10000);
  setInterval(render, 1000);
})();
