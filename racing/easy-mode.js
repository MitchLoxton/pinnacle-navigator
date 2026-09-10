(() => {
  'use strict';

  const BUILD = 'easy-2';
  const DATA = {
    au: './current.json',
    hk: './hong-kong.json',
    hkStats: './hong-kong-stats.json'
  };

  const state = { au:null, hk:null, hkStats:null, busy:false };
  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function perthToday() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone:'Australia/Perth', year:'numeric', month:'2-digit', day:'2-digit'
    }).format(new Date());
  }

  function prettyDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return 'Date unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      timeZone:'Australia/Perth', weekday:'long', day:'numeric', month:'short'
    }).format(new Date(`${value}T12:00:00+08:00`));
  }

  function auDate() {
    const track = Array.isArray(state.au?.stateTracklist) ? state.au.stateTracklist : [];
    const watch = Array.isArray(state.au?.watchlist) ? state.au.watchlist : [];
    const meetings = Array.isArray(state.au?.meetings) ? state.au.meetings : [];
    return String(track[0]?.date || watch[0]?.date || meetings[0]?.date || '').trim();
  }

  function activeTab() {
    return document.querySelector('.hk-tab-btn.active')?.dataset?.tab === 'hk' ? 'hk' : 'au';
  }

  function getAuDecision() {
    const date = auDate();
    const today = perthToday();
    const watch = Array.isArray(state.au?.watchlist) ? state.au.watchlist : [];
    const races = watch.map(x => String(x?.race || '').trim()).filter(Boolean);
    const raceText = races.length ? races.join(', ') : 'No V11 CORE race currently listed';
    const meetingText = (Array.isArray(state.au?.meetings) ? state.au.meetings : [])
      .map(x => x?.venue).filter(Boolean).join(' · ');

    if (!date) return {
      tone:'bad', action:'NO BET', eyebrow:'AUSTRALIA · V11 CORE',
      title:'Card unavailable',
      message:'The race-day card date cannot be verified. Do nothing.',
      focus:'No verified CORE race', dateText:'Date unavailable'
    };

    if (date > today) return {
      tone:'warn', action:'WAIT', eyebrow:'AUSTRALIA · V11 CORE',
      title:`Next race day: ${prettyDate(date)}`,
      message:'You do not need to pick a horse or place anything now. Open the app on race day and let it do the live checks.',
      focus:races.length === 1 ? `Only CORE possibility: ${raceText}` : `CORE possibilities: ${raceText}`,
      dateText:meetingText || prettyDate(date)
    };

    if (date < today) return {
      tone:'bad', action:'NO BET', eyebrow:'AUSTRALIA · V11 CORE',
      title:'Loaded card is out of date',
      message:'The app is fail-closed until a current race card is loaded.',
      focus:'Do not use the old card', dateText:prettyDate(date)
    };

    const title = String($('decisionTitle')?.textContent || '').trim().toUpperCase();
    const card = $('decisionCard');
    if (title === 'BET NOW' && card?.classList.contains('bet-now')) return {
      tone:'good', action:'BET NOW', eyebrow:'AUSTRALIA · V11 CORE',
      title:'Follow the green bet box below',
      message:'Place only the exact horse, stake and accepted price shown by the live V11 action box.',
      focus:races.length ? `CORE race: ${raceText}` : 'Live V11 instruction active', dateText:meetingText || prettyDate(date)
    };
    if (title.includes('NO BET') || card?.classList.contains('blocked')) return {
      tone:'bad', action:'NO BET', eyebrow:'AUSTRALIA · V11 CORE',
      title:'Skip it', message:'Do nothing. Do not substitute another horse or race.',
      focus:races.length ? `CORE watch: ${raceText}` : 'No active CORE bet', dateText:meetingText || prettyDate(date)
    };
    return {
      tone:'warn', action:'WAIT', eyebrow:'AUSTRALIA · V11 CORE',
      title:'Race day — keep the app open',
      message:'The live engine is checking. Do nothing unless the large action box below turns green and literally says BET NOW.',
      focus:races.length === 1 ? `Only CORE possibility: ${raceText}` : `CORE possibilities: ${raceText}`,
      dateText:meetingText || prettyDate(date)
    };
  }

  function getHkDecision() {
    const date = String(state.hk?.meeting?.date || '').trim();
    const venue = String(state.hk?.meeting?.venue || 'Hong Kong').trim();
    const approved = state.hkStats?.decision?.productionApproved === true;
    const today = perthToday();

    if (!approved) return {
      tone:'warn', action:'SHADOW ONLY', eyebrow:'HONG KONG · OPTIMAL V4',
      title:date ? `${prettyDate(date)} · ${venue}` : venue,
      message:'Testing and forward validation only. Do not place real-money Hong Kong bets.',
      focus:'Production approval: OFF', dateText:'No live betting permission'
    };

    if (!date || date !== today) return {
      tone:date && date > today ? 'warn' : 'bad',
      action:date && date > today ? 'WAIT' : 'NO BET', eyebrow:'HONG KONG · OPTIMAL V4',
      title:date ? `${prettyDate(date)} · ${venue}` : 'Meeting unavailable',
      message:date && date > today ? 'Open the app on meeting day. No action is required now.' : 'Current HK meeting cannot be verified.',
      focus:'No live bet now', dateText:approved ? 'Production approved' : 'Shadow only'
    };

    const actionTitle = String(document.querySelector('.hk-action-title')?.textContent || '').trim().toUpperCase();
    const actionBox = document.querySelector('.hk-action');
    if (actionTitle === 'BET NOW' && actionBox?.classList.contains('bet')) return {
      tone:'good', action:'BET NOW', eyebrow:'HONG KONG · OPTIMAL V4',
      title:'Follow the green HK bet box below',
      message:'Place only the exact horse and stake shown after every live gate is verified.',
      focus:'Production live instruction', dateText:`${prettyDate(date)} · ${venue}`
    };
    if (actionTitle.includes('NO BET') || actionBox?.classList.contains('no')) return {
      tone:'bad', action:'NO BET', eyebrow:'HONG KONG · OPTIMAL V4',
      title:'Skip it', message:'Do nothing. Do not substitute another horse.',
      focus:'No active HK bet', dateText:`${prettyDate(date)} · ${venue}`
    };
    return {
      tone:'warn', action:'WAIT', eyebrow:'HONG KONG · OPTIMAL V4',
      title:`${prettyDate(date)} · ${venue}`,
      message:'The live HK gates are still checking. Do nothing unless the action box turns green and says BET NOW.',
      focus:'Waiting for full verification', dateText:'Production approved'
    };
  }

  function addStyles() {
    if ($('mitchell-easy-styles-v2')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-easy-styles-v2';
    style.textContent = `
      body.easy-simple-mode .prod-centre,
      body.easy-simple-mode .system-health,
      body.easy-simple-mode .today-focus,
      body.easy-simple-mode .watch-details,
      body.easy-simple-mode .details-card,
      body.easy-simple-mode #auRacingPanel>.topbar,
      body.easy-simple-mode #bottomCommand,
      body.easy-simple-mode #hkRacingPanel .hk-note,
      body.easy-simple-mode #hkRacingPanel .hk-good,
      body.easy-simple-mode #hkRacingPanel .hk-dayguard,
      body.easy-simple-mode #hkRacingPanel .hk-kpis,
      body.easy-simple-mode #hkRacingPanel .easy-advanced,
      body.easy-simple-mode #hkRacingPanel .hk-card,
      body.easy-simple-mode footer{display:none!important}
      body.easy-simple-mode.easy-details-open .prod-centre,
      body.easy-simple-mode.easy-details-open .system-health,
      body.easy-simple-mode.easy-details-open .today-focus,
      body.easy-simple-mode.easy-details-open .watch-details,
      body.easy-simple-mode.easy-details-open .details-card,
      body.easy-simple-mode.easy-details-open #auRacingPanel>.topbar,
      body.easy-simple-mode.easy-details-open #hkRacingPanel .hk-note,
      body.easy-simple-mode.easy-details-open #hkRacingPanel .hk-good,
      body.easy-simple-mode.easy-details-open #hkRacingPanel .hk-dayguard,
      body.easy-simple-mode.easy-details-open #hkRacingPanel .hk-kpis,
      body.easy-simple-mode.easy-details-open #hkRacingPanel .easy-advanced,
      body.easy-simple-mode.easy-details-open #hkRacingPanel .hk-card,
      body.easy-simple-mode.easy-details-open footer{display:revert!important}
      body.easy-simple-mode.easy-details-open #bottomCommand{display:flex!important}
      body.easy-simple-mode #auRacingPanel{padding-top:0}
      .easy-home{margin:0 0 10px;padding:16px;border:1px solid #314962;border-radius:20px;background:linear-gradient(180deg,#0e1e30,#091522);box-shadow:0 14px 38px rgba(0,0,0,.18)}
      .easy-home.warn{border-color:#80652a}.easy-home.bad{border-color:#793742}.easy-home.good{border-color:#27855a;background:linear-gradient(180deg,#0d2d21,#091b15)}
      .easy-home-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
      .easy-home-brand{font-size:9px;font-weight:1000;letter-spacing:.16em;color:#75b9ff}.easy-home-sub{margin-top:4px;color:#8399b1;font-size:9px;font-weight:850}
      .easy-refresh{flex:0 0 auto;min-width:82px;min-height:40px;border:1px solid #3b5875;border-radius:11px;background:#11243a;color:#fff;font-size:9px;font-weight:1000;letter-spacing:.05em;cursor:pointer}.easy-refresh:disabled{opacity:.6}
      .easy-action{margin-top:14px;padding:15px 16px;border-radius:16px;border:1px solid #745a27;background:#2b2412}
      .easy-action.bad{border-color:#793742;background:#33161d}.easy-action.good{border-color:#27855a;background:#0c3424}.easy-action.warn{border-color:#80652a;background:#2b2412}
      .easy-eyebrow{display:block;font-size:8px;font-weight:1000;letter-spacing:.13em;color:#9cb0c6}.easy-action-word{display:block;margin-top:4px;font-size:34px;line-height:1;font-weight:1000;letter-spacing:-.04em;color:#ffc34f}.easy-action.bad .easy-action-word{color:#ff9eaa}.easy-action.good .easy-action-word{color:#78f2b5}
      .easy-action h2{margin:9px 0 0;font-size:17px;line-height:1.15}.easy-action p{margin:7px 0 0;color:#c5d0dd;font-size:11px;line-height:1.45}
      .easy-focus{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.easy-focus>div{padding:10px 11px;border:1px solid #293f57;border-radius:12px;background:#0a1726}.easy-focus span{display:block;color:#7f96ae;font-size:7px;font-weight:1000;letter-spacing:.09em}.easy-focus strong{display:block;margin-top:4px;font-size:11px;line-height:1.3}
      .easy-rule{margin-top:10px;padding:11px 12px;border-radius:12px;border:1px solid #2d6f51;background:#0c281d}.easy-rule strong{display:block;color:#78f2b5;font-size:12px}.easy-rule span{display:block;margin-top:4px;color:#a9c4b7;font-size:9px;line-height:1.35}
      .easy-bottom{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px}.easy-steps{color:#8196ad;font-size:8px;font-weight:850;line-height:1.35}.easy-details-toggle{border:0;background:transparent;color:#8fc7ff;font-size:9px;font-weight:1000;cursor:pointer;padding:8px 0}
      body.easy-simple-mode .hk-switcher{margin-top:0!important}.hk-switcher{border-radius:12px}.hk-tab-btn{flex:1!important;justify-content:center!important;min-width:0!important}.hk-tab-btn.active{box-shadow:inset 0 0 0 1px rgba(130,190,255,.18)}
      body.easy-simple-mode:not(.easy-details-open) #auRacingPanel .decision-card{margin-top:0!important;border-radius:18px!important}
      body.easy-simple-mode:not(.easy-details-open) #hkRacingPanel>section{margin:5px 0 9px!important}body.easy-simple-mode:not(.easy-details-open) #hkRacingPanel .hk-action{border-radius:18px!important;margin-bottom:0!important}
      @media(max-width:620px){.easy-home{padding:13px;border-radius:17px}.easy-action-word{font-size:31px}.easy-focus{grid-template-columns:1fr}.easy-bottom{align-items:flex-end}.easy-steps{max-width:62%}.easy-refresh{min-width:74px}.hk-switcher{position:sticky!important;top:0!important;z-index:50!important}}
    `;
    document.head.appendChild(style);
  }

  function ensureHome() {
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher) return null;
    let home = $('easyHome');
    if (home) return home;
    home = document.createElement('section');
    home.id = 'easyHome';
    home.className = 'easy-home warn';
    home.setAttribute('aria-live','polite');
    switcher.insertAdjacentElement('beforebegin', home);
    return home;
  }

  function render() {
    const home = ensureHome();
    if (!home) return;
    const tab = activeTab();
    const decision = tab === 'hk' ? getHkDecision() : getAuDecision();
    home.className = `easy-home ${decision.tone}`;
    home.innerHTML = `
      <div class="easy-home-top">
        <div><div class="easy-home-brand">MITCHELL RACING</div><div class="easy-home-sub">Simple mode · ${tab === 'hk' ? 'Hong Kong' : 'Australia'}</div></div>
        <button id="easyRefresh" class="easy-refresh" type="button" ${state.busy ? 'disabled' : ''}>${state.busy ? 'CHECKING…' : 'REFRESH'}</button>
      </div>
      <div class="easy-action ${decision.tone}">
        <span class="easy-eyebrow">${esc(decision.eyebrow)} · WHAT YOU DO NOW</span>
        <strong class="easy-action-word">${esc(decision.action)}</strong>
        <h2>${esc(decision.title)}</h2>
        <p>${esc(decision.message)}</p>
      </div>
      <div class="easy-focus">
        <div><span>WHAT MATTERS</span><strong>${esc(decision.focus)}</strong></div>
        <div><span>MEETING / STATUS</span><strong>${esc(decision.dateText)}</strong></div>
      </div>
      <div class="easy-rule"><strong>Only GREEN + BET NOW means place a bet.</strong><span>Yellow = wait. Red = no bet. Never choose another horse yourself.</span></div>
      <div class="easy-bottom"><div class="easy-steps">1. Choose Australia or Hong Kong below<br>2. Read the big action box<br>3. Green BET NOW only</div><button id="easyDetailsToggle" class="easy-details-toggle" type="button">${document.body.classList.contains('easy-details-open') ? 'HIDE DETAILS' : 'SHOW STATS & DETAILS'}</button></div>`;

    $('easyRefresh')?.addEventListener('click', refreshAll, { once:true });
    $('easyDetailsToggle')?.addEventListener('click', () => {
      document.body.classList.toggle('easy-details-open');
      render();
    }, { once:true });
  }

  async function fetchJson(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(`${path}?easy=${BUILD}-${Date.now()}`, { cache:'no-store', signal:controller.signal });
      if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadData() {
    try {
      const [au,hk,hkStats] = await Promise.all([
        fetchJson(DATA.au), fetchJson(DATA.hk), fetchJson(DATA.hkStats)
      ]);
      state.au = au; state.hk = hk; state.hkStats = hkStats;
    } catch (error) {
      console.warn('easy mode data refresh', error);
    }
  }

  async function refreshAll() {
    if (state.busy) return;
    state.busy = true; render();
    try {
      $('refreshButton')?.click();
      if (typeof window.MITCHELL_HK_OPTIMAL_V4_REFRESH === 'function') window.MITCHELL_HK_OPTIMAL_V4_REFRESH();
      $('productionRefresh')?.click();
      await loadData();
      await new Promise(resolve => setTimeout(resolve, 250));
    } finally {
      state.busy = false; render();
    }
  }

  function hookUi() {
    const switcher = document.querySelector('.hk-switcher');
    if (switcher && !switcher.dataset.easyHooked) {
      switcher.dataset.easyHooked = '1';
      switcher.addEventListener('click', () => setTimeout(render, 0));
    }
    const targets = [$('decisionCard'), $('hkRacingContent')].filter(Boolean);
    if (targets.length) {
      const observer = new MutationObserver(() => render());
      targets.forEach(target => observer.observe(target, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] }));
      setTimeout(() => observer.disconnect(), 120000);
    }
  }

  async function init() {
    addStyles();
    document.body.classList.add('easy-simple-mode');
    document.body.classList.remove('easy-details-open');
    await loadData();
    render();
    hookUi();
    setInterval(() => { loadData().then(render); }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
