(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0});
  let data = window.__MITCHELL_BASE_DATA || null;
  let assist = { alertsEnabled:false, pushRegistered:false, pushBusy:false, pushError:'', notificationPermission:'default' };
  let preflight = window.__MITCHELL_V11_PREFLIGHT || null;
  let live = null;
  let activeTab = 'home';

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const raceCode = v => String(v || '').trim().toUpperCase();

  function icon(name) {
    const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const icons={
      home:`<svg ${common}><path d="M3 10.7 12 3l9 7.7V21h-6v-6H9v6H3z"/></svg>`,
      star:`<svg ${common}><path d="m12 2.8 2.8 5.7 6.3.9-4.6 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2-4.6-4.4 6.3-.9z"/></svg>`,
      clock:`<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>`,
      gear:`<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2.8 2.8-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1.1 1.6v.2H10v-.2a1.8 1.8 0 0 0-1.1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1L4 17.1l.1-.1a1.8 1.8 0 0 0 .4-2A1.8 1.8 0 0 0 3 13.9h-.2V10H3a1.8 1.8 0 0 0 1.5-1.1 1.8 1.8 0 0 0-.4-2L4 6.8 6.8 4l.1.1a1.8 1.8 0 0 0 2 .4A1.8 1.8 0 0 0 10 3V2.8h4V3a1.8 1.8 0 0 0 1.1 1.5 1.8 1.8 0 0 0 2-.4l.1-.1L20 6.8l-.1.1a1.8 1.8 0 0 0-.4 2A1.8 1.8 0 0 0 21 10h.2v4H21a1.8 1.8 0 0 0-1.6 1z"/></svg>`,
      bell:`<svg ${common}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 19h4"/></svg>`,
      signal:`<svg ${common}><path d="M4 18v-2M9 18v-5M14 18V9M19 18V5"/></svg>`,
      tag:`<svg ${common}><path d="M20 13 13 20l-9-9V4h7z"/><circle cx="8.5" cy="8.5" r="1"/></svg>`,
      refresh:`<svg ${common}><path d="M20 6v5h-5"/><path d="M18.4 9A7 7 0 1 0 19 15"/></svg>`,
      horse:`<svg ${common}><path d="M6.3 19c.5-5.2 2.2-8.8 5.2-10.9L10.8 4l3.4 2.2 2.9-.8-.8 3.2 2.4 2.4c1.5 1.5.6 4-1.5 4h-3.1l-2.2 4"/><path d="M8.7 12.4c1.1.7 2.4.9 3.8.6"/></svg>`,
      info:`<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>`
    };
    return icons[name] || icons.info;
  }

  function heroGraphic(){
    return `<svg viewBox="0 0 220 190" fill="none" aria-hidden="true">
      <path class="ghost" d="M38 139c17-44 47-75 87-83 28-6 51 2 67 23-18-8-33-7-44 4 17 4 28 16 31 35-17-12-34-13-52-4-12 6-21 17-27 34" stroke-width="5" opacity=".38"/>
      <path class="ghost" d="M110 57c7-18 19-30 36-34 15-3 28 2 39 14-14-1-23 5-27 16-2 7 0 13 6 19" stroke-width="4" opacity=".52"/>
      <path class="ghost" d="M132 51c-6-11-6-21 0-31 9 4 15 11 18 21" stroke-width="4" opacity=".5"/>
      <path class="accent" d="M44 153c25-8 46-9 65-4" stroke-width="3" opacity=".65"/>
      <path class="ghost" d="M78 96c18 8 36 10 54 5M96 76c-3 13-2 24 3 34" stroke-width="4" opacity=".34"/>
    </svg>`;
  }

  function perthDate(){
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Perth',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  }

  function targetDate(){
    return String(data?.stateTracklist?.[0]?.date || data?.watchlist?.[0]?.date || data?.meetings?.[0]?.date || '');
  }

  function readAction(){
    const card=$('decisionCard');
    const originalTitle=String($('decisionTitle')?.textContent || 'WAIT').trim().toUpperCase();
    const originalMessage=String($('decisionMessage')?.textContent || '').trim();
    const td=targetDate();
    const today=perthDate();
    if(!navigator.onLine) return {tone:'no',title:'OFFLINE',sub:'Reconnect before doing anything.'};
    if(card?.classList.contains('bet-now') || originalTitle==='BET NOW') return {tone:'bet',title:'BET NOW',sub:originalMessage || 'Verified V11 instruction is live.'};
    if(card?.classList.contains('blocked') || originalTitle==='DO NOT BET') return {tone:'no',title:'DO NOT BET',sub:originalMessage || 'A safety check is blocking action.'};
    if(card?.classList.contains('no-bet') || originalTitle==='NO BET') return {tone:'no',title:'NO BET',sub:originalMessage || 'Skip this race.'};
    if(td && td>today && String(data?.overallStatus||'').toUpperCase()==='READY') return {tone:'ready',title:'READY',sub:'No bet right now'};
    return {tone:'wait',title:'WAIT',sub:originalMessage || 'The app is checking automatically.'};
  }

  function readLockedBet(){
    const lock=document.querySelector('#lockedBets .locked-bet:not(.lock-blocked)') || document.querySelector('#lockedBets .locked-bet');
    if(!lock) return null;
    const horse=String(lock.querySelector('.horse-name')?.textContent || '').trim();
    const race=String(lock.querySelector('.race-line')?.textContent || '').trim();
    const market=String(lock.querySelector('.market-line')?.textContent || '').trim();
    const values={};
    [...lock.querySelectorAll('.bet-numbers>div')].forEach(div=>{
      const label=String(div.querySelector('span')?.textContent || '').trim().toUpperCase();
      const value=String(div.querySelector('strong')?.textContent || '').trim();
      if(label&&value) values[label]=value;
    });
    return {horse,race,market,values};
  }

  function statusPill(){
    const ok=preflight?.status==='PASS' && preflight?.safe===true;
    const liveOk=live?.status==='OK';
    const cls=ok ? 'good' : preflight?.status==='BLOCKED' || preflight?.status==='ERROR' ? 'bad' : '';
    const text=ok ? (targetDate()===perthDate() && liveOk ? 'LIVE VERIFIED' : 'SYSTEM READY') : preflight?.status==='BLOCKED' ? 'CHECK BLOCKED' : 'CHECKING';
    return `<div class="premium-live-pill ${cls}"><i></i>${esc(text)}</div>`;
  }

  function header(){
    return `<header class="premium-top">
      <button class="premium-refresh" id="premiumRefresh" type="button" aria-label="Refresh racing app">${icon('refresh')}</button>
      <div class="premium-brand"><div class="premium-brand-main">MITCHELL</div><span class="premium-brand-script">Racing</span><div class="premium-date">${esc(data?.weekLabel || 'Current race day')}</div><div class="premium-motto">Discipline drives longer wins</div></div>
      <div class="premium-hero-mark">${heroGraphic()}</div>${statusPill()}
    </header>`;
  }

  function decisionCard(){
    const a=readAction();
    const bet=readLockedBet();
    let detail='';
    if(a.tone==='bet' && bet){
      const entries=Object.entries(bet.values).slice(0,2);
      detail=`${bet.horse?`<div class="premium-bet-horse">${esc(bet.horse)}</div>`:''}${bet.race?`<div class="premium-bet-race">${esc(bet.race)}</div>`:''}${entries.length?`<div class="premium-bet-data">${entries.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`:''}${bet.market?`<div class="premium-market-line">${esc(bet.market)}</div>`:''}`;
    }
    const rule=a.tone==='bet'
      ? 'Place <b>exactly</b> the horse and stake shown while this card remains green.'
      : 'Only bet when this card turns bright green and literally says <b>BET NOW</b>.';
    return `<section class="premium-card premium-decision ${a.tone}">
      <div class="premium-decision-top"><div class="premium-decision-icon">${icon('horse')}</div><div><div class="premium-decision-kicker">YOUR ACTION</div><h1>${esc(a.title)}</h1><div class="premium-decision-sub">${esc(a.sub)}</div></div></div>
      ${detail}<div class="premium-decision-rule">${rule}</div>
    </section>`;
  }

  function coreCard(){
    const watch=Array.isArray(data?.watchlist)?data.watchlist:[];
    if(!watch.length) return `<section class="premium-card premium-core"><div class="premium-section-title"><span>Today</span><strong>No CORE possibilities</strong></div><div class="premium-foot-note">The app is still tracking all 21 streams automatically.</div></section>`;
    const x=watch[0];
    const ref=num(x?.coreBaseReferenceAud);
    return `<section class="premium-card premium-core" id="premiumCoreCard">
      <div class="premium-section-title"><span>Next CORE possibility</span><button class="premium-mini-action" data-tab-jump="watchlist" aria-label="Open watchlist">›</button></div>
      <div class="premium-core-main"><div><h2>${esc(raceCode(x?.race||x?.code))} · ${esc(x?.venue||x?.region||'')}</h2><div class="premium-core-state">State ${esc(x?.state ?? '—')}</div><div class="premium-core-meta"><span class="premium-potential">Potential only</span><span class="premium-ref">Reference stake ${ref!==null?`<b>${esc(money.format(ref))}</b>`:'—'}</span></div></div><div class="premium-core-icon">${icon('horse')}</div></div>
    </section>`;
  }

  function alertsCard(){
    const fullyOn=assist.alertsEnabled && (assist.pushRegistered || !('PushManager' in window));
    const busy=assist.pushBusy===true;
    const denied=assist.notificationPermission==='denied';
    let title=fullyOn?'Phone Alerts <b>ON</b>':busy?'Connecting alerts…':denied?'Phone alerts blocked':'Phone Alerts OFF';
    let text=fullyOn?'You will be alerted before a CORE possibility reaches the final bet conditions.':denied?'Allow notifications for this site in your browser settings, then try again.':'Turn this on once and you do not need to watch the app all Saturday.';
    let button=fullyOn?'TURN OFF':busy?'CONNECTING…':'TURN ON';
    return `<section class="premium-card premium-alert ${fullyOn?'on':''}"><div class="premium-alert-icon">${icon('bell')}</div><div><strong>${title}</strong><p>${esc(text)}</p></div><button id="premiumAlertsToggle" type="button" ${busy?'disabled':''}>${button}</button></section>`;
  }

  function statsRow(){
    const tracked=Array.isArray(data?.stateTracklist)?data.stateTracklist.length:21;
    const count=Array.isArray(data?.watchlist)?data.watchlist.length:0;
    const min=num(data?.safety?.minimumAcceptedPrice) ?? 3;
    return `<section class="premium-stats"><div class="premium-stat">${icon('signal')}<strong>${tracked}</strong><span>streams tracked</span></div><div class="premium-stat">${icon('star')}<strong>${count}</strong><span>CORE possibilit${count===1?'y':'ies'}</span></div><div class="premium-stat">${icon('tag')}<strong class="money-value">$${min.toFixed(2)}</strong><span>minimum price</span></div></section>`;
  }

  function homePage(){
    return `<div class="premium-offline-banner">OFFLINE · DO NOT BET until the live connection is restored.</div>${decisionCard()}${coreCard()}${alertsCard()}${statsRow()}<div class="premium-foot-note">V11 stays fail-closed. A CORE possibility is never a bet by itself.</div>`;
  }

  function regionName(region){
    const meeting=(data?.meetings||[]).find(m=>String(m?.region||'').toLowerCase()===String(region||'').toLowerCase());
    return `${region}${meeting?.venue?` · ${meeting.venue}`:''}`;
  }

  function watchlistPage(){
    const rows=Array.isArray(data?.stateTracklist)?data.stateTracklist:[];
    const groups=['Perth','Sydney','Melbourne'];
    return `<div class="premium-section-title"><span>Watchlist</span><strong>${rows.length} streams · ${(data?.watchlist||[]).length} CORE today</strong></div>${groups.map(region=>{
      const items=rows.filter(x=>String(x?.region||'').toLowerCase()===region.toLowerCase());
      return `<section class="premium-card premium-region"><div class="premium-region-head"><h3>${esc(regionName(region))}</h3><span>${items.filter(x=>x?.corePotential).length?'CORE highlighted':'tracking only'}</span></div><div class="premium-state-grid">${items.map(x=>`<div class="premium-state ${x?.corePotential?'core':''}"><span>${esc(raceCode(x?.race))}</span><strong>${esc(x?.state ?? '—')}</strong>${x?.corePotential?'<span class="premium-core-badge">CORE</span>':''}</div>`).join('')}</div></section>`;
    }).join('')}<div class="premium-foot-note">States track favourite win/loss history. They are not bets on their own.</div>`;
  }

  function historyPage(){
    const x=data?.lastWeek||{};
    const p=num(x?.systemCashPlAud);
    return `<section class="premium-card premium-history-card"><div class="premium-section-title"><span>History</span><strong>${esc(x?.date||'Latest settled week')}</strong></div><h2>Last week at a glance</h2><p>This is the audit summary only. It does not affect whether you bet today.</p><div class="premium-history-grid"><div><span>Streams logged</span><strong>${esc(x?.streamsLogged ?? '—')}</strong></div><div><span>Favourite wins</span><strong>${esc(x?.favouriteWins ?? '—')}</strong></div><div><span>System bets</span><strong>${esc(x?.confirmedSystemBets ?? '—')}</strong></div><div><span>System P/L</span><strong>${p!==null?esc(money.format(p)):'—'}</strong></div></div><a class="premium-link" href="./stats.html" style="margin-top:14px">OPEN FULL STATS</a></section>`;
  }

  function settingsPage(){
    const alertOn=assist.alertsEnabled && (assist.pushRegistered || !('PushManager' in window));
    return `<section class="premium-card premium-settings-card"><div class="premium-section-title"><span>Settings</span><strong>Keep it simple</strong></div><h2>Race-day setup</h2><p>The safest setup is alerts on, live checks automatic, and no manual interpretation of the watchlist.</p><div class="premium-setting-row"><div><span>PHONE ALERTS</span><strong>${alertOn?'ON':'OFF'}</strong></div><button class="premium-link" id="premiumSettingsAlerts" type="button">${alertOn?'TURN OFF':'TURN ON'}</button></div><div class="premium-setting-row"><div><span>V11 PREFLIGHT</span><strong>${esc(preflight?.status || 'CHECKING')}</strong></div><span>${preflight?.safe===true?'21-stream integrity check passed':'Fail-closed until verified'}</span></div><div class="premium-setting-row"><div><span>EXECUTION RULE</span><strong>20s → 10s pre-jump</strong></div><span>$3.00+ accepted price</span></div><div class="premium-setting-row"><div><span>ADVANCED</span><strong>Hidden by default</strong></div><a class="premium-link" href="./automation.html">AUTOMATION</a></div></section>`;
  }

  function page(){
    if(activeTab==='watchlist') return watchlistPage();
    if(activeTab==='history') return historyPage();
    if(activeTab==='settings') return settingsPage();
    return homePage();
  }

  function nav(){
    const items=[['home','Home'],['watchlist','Watchlist'],['history','History'],['settings','Settings']];
    return `<nav class="premium-nav" aria-label="Racing app navigation">${items.map(([key,label])=>`<button type="button" data-premium-tab="${key}" class="${activeTab===key?'active':''}">${icon(key==='watchlist'?'star':key==='history'?'clock':key==='settings'?'gear':'home')}<span>${label}</span></button>`).join('')}</nav>`;
  }

  function render(){
    const root=$('premiumApp');
    if(!root) return;
    data=window.__MITCHELL_BASE_DATA || data;
    document.body.classList.toggle('premium-offline',navigator.onLine===false);
    root.innerHTML=`${header()}<main class="premium-page" id="premiumPage">${page()}</main>${nav()}`;

    $('premiumRefresh')?.addEventListener('click',()=>$('refreshButton')?.click(),{once:true});
    document.querySelectorAll('[data-premium-tab]').forEach(btn=>btn.addEventListener('click',()=>{activeTab=btn.dataset.premiumTab||'home';render();window.scrollTo({top:0,behavior:'auto'});},{once:true}));
    document.querySelectorAll('[data-tab-jump]').forEach(btn=>btn.addEventListener('click',()=>{activeTab=btn.dataset.tabJump||'home';render();window.scrollTo({top:0,behavior:'auto'});},{once:true}));
    $('premiumAlertsToggle')?.addEventListener('click',toggleAlerts,{once:true});
    $('premiumSettingsAlerts')?.addEventListener('click',toggleAlerts,{once:true});
  }

  async function toggleAlerts(event){
    const button=event?.currentTarget;
    if(button) button.disabled=true;
    try{
      const api=window.MITCHELL_RACE_ASSIST;
      if(!api) return;
      const current=api.getStatus?.() || {};
      if(current.alertsEnabled) api.disableAlerts?.();
      else await api.enableAlerts?.();
      const next=api.getStatus?.() || {};
      assist={...assist,...next};
    }catch(error){
      console.warn('Premium alert toggle failed',error);
    }finally{
      setTimeout(render,250);
    }
  }

  function mount(){
    if($('premiumApp')) return;
    const shell=document.querySelector('.app-shell');
    if(!shell) return;
    document.body.classList.add('premium-racing-ui');
    const root=document.createElement('div');
    root.id='premiumApp';
    shell.prepend(root);

    const decision=$('decisionCard');
    if(decision) new MutationObserver(()=>{ if(activeTab==='home') render(); }).observe(decision,{attributes:true,subtree:true,childList:true,characterData:true});
    const locked=$('lockedBets');
    if(locked) new MutationObserver(()=>{ if(activeTab==='home') render(); }).observe(locked,{subtree:true,childList:true,characterData:true});

    window.addEventListener('mitchell-base-ready',event=>{data=event.detail||window.__MITCHELL_BASE_DATA||data;if(activeTab!=='history') render();});
    window.addEventListener('mitchell-assist-health',event=>{assist={...assist,...(event.detail||{})};if(activeTab!=='history') render();});
    window.addEventListener('mitchell-preflight-health',event=>{preflight={...preflight,...(event.detail||{})};if(activeTab!=='history') render();});
    window.addEventListener('mitchell-live-health',event=>{live={...live,...(event.detail||{})};if(activeTab==='home') render();});
    window.addEventListener('online',()=>{if(activeTab!=='history') render();});
    window.addEventListener('offline',()=>{if(activeTab!=='history') render();});
    render();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();