(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = { data: null, refreshing: false };
  const money = new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 });
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const pct = (value,d=1) => Number.isFinite(Number(value)) ? `${Number(value).toFixed(d)}%` : '—';
  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;

  function statusClass(value){
    const s=String(value||'').toUpperCase();
    if(s.includes('POTENTIAL')||s.includes('GREEN')||s.includes('PRODUCTION')||s.includes('LOCKED')||s==='WATCH') return 'green';
    if(s.includes('NO CURRENT')||s.includes('NO BET')||s.includes('RED')||s.includes('BLOCK')) return 'red';
    if(s.includes('RESEARCH')) return 'research';
    return 'wait';
  }
  function formatDateOnly(v){
    if(!v) return '';
    const [y,m,d]=String(v).split('-').map(Number);
    if(!y||!m||!d) return String(v);
    return new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,d)));
  }
  function formatUpdated(v){
    const d=new Date(v); if(Number.isNaN(d.getTime())) return 'Update time unavailable';
    return 'Updated '+new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit',timeZone:'Australia/Perth'}).format(d)+' Perth';
  }
  function renderMeeting(m){
    return `<div class="meeting-row"><div class="meeting-main"><strong>${esc(m.region)}</strong><div class="meta">${esc(m.venue)}${m.date?' · '+esc(formatDateOnly(m.date)):''}</div></div><div class="meeting-side"><span class="code">${esc(m.code)}</span><span class="pill ${statusClass(m.status)}">${esc(m.status)}</span></div></div>`;
  }
  function renderLockedBet(b){
    const stake=num(b.stakeAud)||0, min=num(b.minExec)||0;
    return `<div class="bet-row"><div class="bet-main"><strong>${esc(b.race)} · ${esc(b.horse)}</strong><div class="meta">${esc(b.venue||b.region||'')}${b.jumpTime?' · '+esc(b.jumpTime):''}${b.note?' · '+esc(b.note):''}</div></div><div class="bet-side"><span class="code">${stake>0?money.format(stake):'STAKE PENDING'}</span><span class="pill ${statusClass(b.status||'BET LOCKED')}">${min>0?'MIN '+min.toFixed(2):esc(b.status||'BET LOCKED')}</span></div></div>`;
  }
  function renderPotentialBet(i){
    const st=num(i.state), gate=num(i.priceGate)||0, core=num(i.coreBaseReferenceAud)||0;
    const n=num(i.histN), wins=num(i.histWins), wr=num(i.histWinRatePct), pu=num(i.histProfitUnits), roi=num(i.histRoiPct), avg=num(i.averageOdds);
    return `<div class="potential-card"><div class="potential-head"><div class="bet-main"><strong>${esc(i.race)} · ${esc(i.provisionalHorse||'Favourite TBC')}</strong><div class="meta">${esc(i.venue||i.region||'')} · state ${st??'—'} · ${esc(i.qualifyingKey||'')}</div></div><div class="bet-side"><span class="code">${core>0?'CORE REF '+money.format(core):'V11 STATE'}</span><span class="pill wait">${gate>0?'$'+gate.toFixed(2)+'+ screen':'PRICE TBC'}</span></div></div><div class="state-stat-grid"><div><span>Hist bets</span><strong>${n??'—'}</strong></div><div><span>Wins</span><strong>${wins??'—'}</strong></div><div><span>Win rate</span><strong>${pct(wr)}</strong></div><div><span>Hist ROI</span><strong class="${roi>=0?'positive-text':'negative-text'}">${pct(roi)}</strong></div><div><span>Hist P/L</span><strong class="${pu>=0?'positive-text':'negative-text'}">${pu===null?'—':(pu>=0?'+':'')+pu.toFixed(1)+'u'}</strong></div><div><span>Avg odds</span><strong>${avg&&avg>0?avg.toFixed(2):'—'}</strong></div></div>${i.marketStatus?`<div class="meta evidence-line">${esc(i.marketStatus)}</div>`:''}${i.why?`<div class="meta why-line">${esc(i.why)}</div>`:''}</div>`;
  }
  function renderReviewRow(r){
    const current = String(r.currentStatus||'NO CURRENT POTENTIAL').toUpperCase();
    const cls=statusClass(current), sroi=num(r.snapshotRoiPct), avg=num(r.snapshotAverageOdds), stake=num(r.currentReferenceStakeAud);
    const currentState=num(r.currentState), snapState=num(r.snapshotState), n=num(r.snapshotBets), wr=num(r.snapshotWinRatePct);
    const statusLabel=current.includes('POTENTIAL')?'POTENTIAL 29 AUG':'NO CURRENT POTENTIAL';
    return `<details class="review-card ${cls==='green'?'review-active':''}">
      <summary>
        <div class="review-summary-main"><strong>${esc(r.race)}</strong><span class="review-action">${esc(r.snapshotAction||'No Bet')}</span></div>
        <div class="review-summary-side"><span class="pill ${cls}">${esc(statusLabel)}</span><span class="chevron">⌄</span></div>
      </summary>
      <div class="review-body">
        <div class="review-current"><span>Current planning state</span><strong>${currentState!==null?'State '+currentState:'Not independently reconciled'}</strong>${stake?`<small>Core reference ${money.format(stake)}</small>`:''}</div>
        <div class="state-stat-grid review-stats">
          <div><span>22 Aug state</span><strong>${snapState??'—'}</strong></div>
          <div><span>Hist bets</span><strong>${n??'—'}</strong></div>
          <div><span>Win rate</span><strong>${pct(wr)}</strong></div>
          <div><span>Avg odds</span><strong>${avg!==null?avg.toFixed(2):'—'}</strong></div>
          <div><span>Hist ROI</span><strong class="${sroi>=0?'positive-text':'negative-text'}">${pct(sroi,0)}</strong></div>
          <div><span>22 Aug action</span><strong>${esc(r.snapshotAction||'No Bet')}</strong></div>
        </div>
        <div class="review-why"><strong>Why now:</strong> ${esc(r.why||'Not on the current watchlist. Do not bet unless frozen V11 later produces BET LOCKED and the live price passes the gate.')}</div>
        <div class="meta">Latest comparable row stats: ${esc(r.snapshotDate||'22 Aug 2026')} sheet. Current status is kept separate so old ROI does not masquerade as a live instruction.</div>
      </div>
    </details>`;
  }
  function renderSeason(data){
    const s=data.season||{}, p=num(s.modelProfitAud), t=num(s.modelTurnoverAud), b=num(s.modelBets), w=num(s.modelWins), l=num(s.modelLosses), roi=num(s.modelRoiPct);
    $('seasonPill').textContent=s.status||'MODEL'; $('seasonPill').className='pill wait';
    $('seasonProfit').textContent=p===null?'—':money.format(p); $('seasonProfit').className=`season-profit ${p>0?'positive':p<0?'negative':''}`;
    $('seasonCaption').textContent=`${s.fy||'Current FY'} model P/L${s.modelThrough?' through '+formatDateOnly(s.modelThrough):''}`;
    $('seasonRoi').textContent=pct(roi); $('seasonBets').textContent=b??'—'; $('seasonTurnover').textContent=t===null?'—':money.format(t); $('seasonRecord').textContent=w!==null&&l!==null?`${w} / ${l}`:'—';
    $('cashStatus').innerHTML=`<strong>Actual cash P/L:</strong> ${esc(s.actualCashStatus||'NOT VERIFIED')}`; $('seasonNote').textContent=s.note||'';
  }
  function renderData(data){
    state.data=data; $('weekLabel').textContent=data.weekLabel||'Current racing week'; $('overallStatus').textContent=data.overallStatus||'WAIT'; $('overallMessage').textContent=data.overallMessage||''; $('productionRule').textContent=data.productionRule||''; $('updatedAt').textContent=formatUpdated(data.updatedAt); $('appVersion').textContent=`v${data.appVersion||'0.1.0'}`;
    const cls=statusClass(data.overallStatus); $('statusDot').className=`status-dot ${cls}`; $('overallStatus').className=`status-label ${cls}`; renderSeason(data);
    const locked=Array.isArray(data.lockedBets)?data.lockedBets:[]; $('lockedBets').innerHTML=locked.map(renderLockedBet).join(''); $('noLockedBets').hidden=locked.length>0; $('actionPill').textContent=locked.length?`${locked.length} LOCKED`:'NO LOCK YET'; $('actionPill').className=`pill ${locked.length?'green':'wait'}`;
    const potential=Array.isArray(data.watchlist)?data.watchlist:[]; $('potentialBets').innerHTML=potential.map(renderPotentialBet).join(''); $('auPotentialBets').innerHTML=potential.length?potential.map(renderPotentialBet).join(''):'<div class="empty-state"><strong>No current Australian potential bets.</strong></div>'; $('noPotentialBets').hidden=potential.length>0; $('potentialPill').textContent=potential.length?`${potential.length} POTENTIAL`:'NONE'; $('potentialPill').className=`pill ${potential.length?'wait':'red'}`;
    const review=Array.isArray(data.streamReview)?data.streamReview:[]; $('reviewBoard').innerHTML=review.length?review.map(renderReviewRow).join(''):'<div class="empty-state"><strong>Stream review unavailable.</strong></div>'; $('reviewPill').textContent=`${review.length||0} STREAMS`;
    const meetings=Array.isArray(data.meetings)?data.meetings:[]; $('meetings').innerHTML=meetings.map(renderMeeting).join(''); $('auMeetings').innerHTML=meetings.filter(m=>String(m.region).toLowerCase()!=='hong kong').map(renderMeeting).join(''); $('hkMeeting').innerHTML=meetings.filter(m=>String(m.region).toLowerCase()==='hong kong').map(renderMeeting).join('')||'<div class="empty-state"><strong>No Hong Kong meeting published.</strong></div>';
    const au=data.models?.australia||{}, hk=data.models?.hongKong||{}; $('auModelName').textContent=au.name||'V11'; $('auModelNote').textContent=au.note||''; $('hkModelName').textContent=hk.name||'R23 PLACE BACK'; $('hkModelNote').textContent=hk.note||'';
    const stored=Number(localStorage.getItem('mitchellRacingStake')); if(!$('stakeInput').value) $('stakeInput').value=String(stored>0?stored:Number(data.stakeDefaultAud||1000)); updateMoney();
    const h=data.health||{}; const labels=[['App feed',h.appFeed||'UNKNOWN'],['Australia production',h.auProduction||'UNKNOWN'],['Pre-race watchlist',h.watchlist||'UNKNOWN'],['21-stream review',h.reviewBoard||'UNKNOWN'],['FY ledger',h.seasonLedger||'UNKNOWN'],['Hong Kong',h.hkProduction||'UNKNOWN'],['Evidence boundary',h.source||'Production dashboard is source of truth']]; $('healthRows').innerHTML=labels.map(([n,v])=>`<div class="health-row"><strong>${esc(n)}</strong><span class="health-value ${statusClass(v)}">${esc(v)}</span></div>`).join('');
  }
  async function loadData(manual=false){
    if(state.refreshing)return; state.refreshing=true; $('refreshButton').disabled=true; $('refreshState').textContent=manual?'Refreshing…':'Checking latest…';
    try{ const r=await fetch(`./current.json?t=${Date.now()}`,{cache:'no-store'}); if(!r.ok)throw new Error(`HTTP ${r.status}`); renderData(await r.json()); $('refreshState').textContent='Latest loaded'; }
    catch(e){console.error(e); $('refreshState').textContent=state.data?'Offline · showing last loaded state':'Could not load data';}
    finally{state.refreshing=false; $('refreshButton').disabled=false;}
  }
  function updateMoney(){
    if(!state.data)return; let stake=Number($('stakeInput').value); if(!Number.isFinite(stake)||stake<1)stake=1; if(stake>100000)stake=100000; $('stakeInput').value=String(Math.round(stake)); localStorage.setItem('mitchellRacingStake',String(stake));
    const au=Number(state.data.models?.australia?.historicalEquivalentProfitPer1000Stake||0)*stake/1000; const hk=Number(state.data.models?.hongKong?.modelEquivalentProfitPer1000Stake||0)*stake/1000; const dd=Number(state.data.models?.hongKong?.proxyMaxDrawdownUnits||0)*stake; $('auProjection').textContent=money.format(au); $('hkProjection').textContent=money.format(hk); $('combinedProjection').textContent=money.format(au+hk); $('hkDrawdown').textContent=money.format(dd);
  }
  function readLogs(){try{const x=JSON.parse(localStorage.getItem('mitchellRacingExecutionLog')||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function saveLogs(x){localStorage.setItem('mitchellRacingExecutionLog',JSON.stringify(x.slice(-100)))}
  function renderLogs(){const logs=readLogs().slice().reverse(); $('executionLog').innerHTML=logs.length?logs.map(i=>`<div class="log-row"><div class="log-main"><strong>${esc(i.race)} · ${esc(i.horse)}</strong><div class="meta">${esc(i.time)}</div></div><div class="meeting-side"><span class="code">${money.format(i.stake)}</span><span class="pill green">@ ${Number(i.price).toFixed(2)}</span></div></div>`).join(''):'<div class="empty-state"><strong>No execution saved on this phone.</strong></div>';}
  function setupTabs(){document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{const n=b.dataset.tab; document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b)); document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===n));}));}
  function setupExecutionForm(){
    $('executionForm').addEventListener('submit',e=>{e.preventDefault();const race=$('logRace').value.trim().toUpperCase(),horse=$('logHorse').value.trim(),price=Number($('logPrice').value),stake=Number($('logStake').value),m=$('formMessage');m.className='form-message';if(!race||!horse||!Number.isFinite(price)||price<1.01||!Number.isFinite(stake)||stake<=0){m.textContent='Enter race, horse, accepted price and accepted stake.';m.classList.add('error');return;}const logs=readLogs();logs.push({race,horse,price,stake,time:new Date().toLocaleString('en-AU')});saveLogs(logs);$('executionForm').reset();m.textContent='Execution saved on this phone.';m.classList.add('success');renderLogs();});
    $('clearLogButton').addEventListener('click',()=>{if(readLogs().length&&window.confirm('Clear the execution log saved on this phone?')){localStorage.removeItem('mitchellRacingExecutionLog');renderLogs();}});
  }
  function registerServiceWorker(){if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));}
  setupTabs(); setupExecutionForm(); renderLogs(); $('refreshButton').addEventListener('click',()=>loadData(true)); $('stakeInput').addEventListener('change',updateMoney); $('stakeInput').addEventListener('blur',updateMoney); registerServiceWorker(); loadData(false); setInterval(()=>{if(document.visibilityState==='visible')loadData(false)},60000);
})();
