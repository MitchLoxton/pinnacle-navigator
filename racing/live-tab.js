(() => {
  'use strict';

  const LIVE_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-tab-live';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 15000;
  const BASE_REFRESH_MS = 300000;
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  let busy = false;
  let lastData = null;
  let lastResults = [];
  let baseFetchedAt = 0;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const raceCode = v => String(v || '').trim().toUpperCase();
  const odds = v => Number.isFinite(Number(v)) ? '$' + Number(v).toFixed(2) : '—';
  const horseKey = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\bNZ\b$/,'').trim().replace(/\s+/g,' ');

  function stamp(value = new Date()) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return 'now';
    return new Intl.DateTimeFormat('en-AU', { hour:'numeric', minute:'2-digit', second:'2-digit', timeZone:'Australia/Perth' }).format(d) + ' Perth';
  }

  function leadText(seconds) {
    if (!Number.isFinite(Number(seconds))) return 'jump time checking';
    const s = Number(seconds);
    if (s <= 0) return 'race closed';
    if (s < 60) return `${Math.ceil(s)}s to jump`;
    return `${Math.floor(s/60)}m ${Math.max(0,Math.floor(s%60))}s to jump`;
  }

  async function getJson(path) {
    const r = await fetch(`${path}?v=1.8.1`, { cache:'no-cache' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  async function getBaseData(force = false) {
    if (!force && lastData && (Date.now() - baseFetchedAt) < BASE_REFRESH_MS) return lastData;
    const data = await getJson('./current.json');
    lastData = data;
    baseFetchedAt = Date.now();
    return data;
  }

  async function fetchLive(requests) {
    const r = await fetch(LIVE_URL, {
      method:'POST', cache:'no-store',
      headers:{ 'Content-Type':'application/json', apikey:ANON, Authorization:`Bearer ${ANON}` },
      body:JSON.stringify({ requests })
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body?.ok !== true || !Array.isArray(body.results)) throw new Error(body?.error || `Live V11 HTTP ${r.status}`);
    return body.results;
  }

  function gate(label, mode, detail) {
    const pass = mode === 'PASS';
    const wait = mode === 'WAIT';
    const bg = pass ? '#0d3525' : wait ? '#33270e' : '#35151d';
    const border = pass ? '#2a8058' : wait ? '#735a27' : '#74323e';
    const color = pass ? '#78f2b5' : wait ? '#ffc34f' : '#ff9eaa';
    return `<div style="display:grid;grid-template-columns:86px 62px 1fr;gap:8px;align-items:center;padding:8px 9px;border-radius:10px;background:${bg};border:1px solid ${border};font-size:10px;line-height:1.3">
      <strong style="font-size:9px;letter-spacing:.05em">${esc(label)}</strong><b style="color:${color};font-size:9px">${esc(mode)}</b><span style="color:#d3dbe6">${esc(detail)}</span>
    </div>`;
  }

  function liveRunnerPrice(result, horse) {
    const key = horseKey(horse);
    const runner = (Array.isArray(result?.runners) ? result.runners : []).find(r => !r?.scratched && horseKey(r?.name) === key);
    const p = Number(runner?.price);
    return Number.isFinite(p) ? p : null;
  }

  function oddsBoard(result) {
    const runners = (Array.isArray(result?.runners) ? result.runners : []).filter(r => !r?.scratched);
    if (!runners.length) return '';
    const favs = new Set((result?.favourites || []).map(x => horseKey(x?.name)));
    const sorted = [...runners].sort((a,b) => {
      const ap=Number(a?.price), bp=Number(b?.price);
      return (Number.isFinite(ap)?ap:9999)-(Number.isFinite(bp)?bp:9999) || Number(a?.number||999)-Number(b?.number||999);
    });
    return `<div class="live-odds-board" style="margin-top:10px;padding:11px;border-radius:11px;background:#081421;border:1px solid #2b4058">
      <div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:10px;letter-spacing:.06em;color:#78f2b5">LIVE TABTOUCH FIXED-WIN ODDS</b><div style="font-size:9px;color:#93a9c0;margin-top:3px">checked ${esc(stamp(result?.fetchedAt))}</div></div><span style="font-size:9px;color:#8fa5bd">AUTO 15s</span></div>
      <div style="display:grid;gap:5px;margin-top:9px;max-height:290px;overflow:auto">${sorted.map(r => {
        const fav=favs.has(horseKey(r?.name)), p=Number(r?.price);
        return `<div style="display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;padding:7px 8px;border-radius:9px;background:${fav?'#0d3525':'#0b1524'};border:1px solid ${fav?'#2a8058':'#263950'}"><span style="font-size:10px;color:#8fa5bd;font-weight:800">#${esc(r?.number ?? '—')}</span><span style="font-size:11px;color:#e7edf5;font-weight:${fav?900:700}">${fav?'★ ':''}${esc(r?.name||'UNKNOWN')}</span><strong style="font-size:12px;color:${fav?'#78f2b5':'#f1f5f9'}">${Number.isFinite(p)?odds(p):'NO QUOTE'}</strong></div>`;
      }).join('')}</div>
    </div>`;
  }

  function watchCard(item, result) {
    const race = raceCode(item?.race || item?.code);
    const venue = item?.venue || item?.region || '';
    const d = result?.decision || {};
    const gateMin = Number(item?.priceGate || 3);
    const favs = Array.isArray(result?.favourites) ? result.favourites : [];
    const fav = favs[0];
    const p = Number(result?.favouritePrice);
    const single = result?.favouriteType === 'SINGLE' && fav?.name && Number.isFinite(p);
    const locked = d.status === 'BET_LOCKED';
    const finalNo = d.status === 'NO_BET_FINAL';
    const fieldMode = item?.fieldsConfirmed === true ? 'PASS' : 'WAIT';
    const favMode = single ? 'PASS' : 'WAIT';
    const priceMode = single ? (p >= gateMin ? 'PASS' : 'FAIL') : 'WAIT';
    const lockMode = locked ? 'PASS' : finalNo ? 'FAIL' : 'WAIT';
    const horse = locked ? d.horse : single ? fav.name : result?.favouriteType === 'EQUAL' ? `EQUAL FAVOURITES: ${favs.map(x=>x.name).join(' / ')}` : 'LIVE FAVOURITE CHECKING';
    const lockDetail = locked
      ? `BET LOCKED · ${money.format(Number(d.stake)||0)} · MIN EXEC ${odds(d.minExec)}`
      : finalNo ? `NO BET — FINAL · ${d.reason || 'No qualifying lock before safety buffer.'}`
      : d.reason || `V11 is monitoring · ${leadText(result?.leadSeconds)}`;
    const headlineColor = locked ? '#78f2b5' : finalNo ? '#ff9eaa' : '#f4f6f8';
    const badge = locked ? 'BET LOCKED — CHECK TOP BOX' : finalNo ? 'NO BET — FINAL' : 'MONITORING — NOT A BET YET';
    const badgeTone = locked ? '#0d3525' : finalNo ? '#35151d' : '#33270e';
    const why = locked
      ? `<b style="color:#78f2b5">V11 HAS LOCKED THIS RACE.</b> The top box is the final execution instruction and checks the current price against the saved minimum.`
      : finalNo ? `<b style="color:#ff9eaa">FINAL NO BET.</b> ${esc(d.reason || 'The final V11 stake did not qualify before the safety buffer.')}`
      : `<b>Still waiting:</b> ${esc(d.reason || 'V11 is recalculating automatically from the live favourite and price.')}`;
    return `<article class="watch-card" data-race="${esc(race)}" style="display:block">
      <div class="watch-race">${esc(race)}${venue?' | '+esc(venue):''} · ${esc(leadText(result?.leadSeconds))}</div>
      <strong style="font-size:19px;margin-top:5px;color:${headlineColor}">${esc(horse)}</strong>
      <div style="display:grid;gap:6px;margin-top:11px">
        ${gate('1. FIELD',fieldMode,fieldMode==='PASS'?'Field confirmed':'Field not confirmed')}
        ${gate('2. FAVOURITE',favMode,single?`${fav.name} at ${odds(p)}`:(result?.favouriteType==='EQUAL'?'Equal favourites — no manual choice':'Verified favourite not available'))}
        ${gate('3. PRICE',priceMode,single?`${odds(p)} live vs ${odds(gateMin)} minimum`:`Waiting for one verified live favourite price`)}
        ${gate('4. V11 DECISION',lockMode,lockDetail)}
      </div>
      <div style="margin-top:10px;padding:10px 11px;border-radius:11px;background:#101b2b;border:1px solid #2d425c;color:#dbe6f4;font-size:11px;line-height:1.45">${why}</div>
      ${oddsBoard(result)}
      <div class="not-bet" style="display:inline-flex;margin-top:10px;max-width:100%;white-space:normal;background:${badgeTone}">${esc(badge)}</div>
    </article>`;
  }

  function resultCard(item, result) {
    const race = raceCode(item?.race || item?.code);
    const venue = item?.venue || item?.region || '';
    const d = result?.decision || {};
    const r = result?.result || {};
    const pending = result?.phase === 'CLOSED_RESULT_PENDING';
    if (pending) return `<article class="watch-card" style="display:block"><div class="watch-race">${esc(race)}${venue?' | '+esc(venue):''}</div><strong style="font-size:19px;margin-top:5px;color:#ffc34f">RACE FINISHED — RESULT PENDING</strong><div style="margin-top:10px;color:#dbe6f4">${d.status==='BET_LOCKED'?`Saved bet: ${esc(d.horse)} · ${money.format(Number(d.stake)||0)}`:'No live V11 bet is active.'}</div></article>`;
    const noBet = r.status === 'NO_BET' || d.status === 'RACE_COMPLETE_NO_BET';
    const won = r.status === 'WIN' || d.status === 'SETTLED_WIN';
    const lost = r.status === 'LOSS' || d.status === 'SETTLED_LOSS';
    const tone = won ? '#78f2b5' : lost ? '#ff9eaa' : '#9eb3ca';
    const betLine = noBet ? 'NO BET — no V11 lock was recorded before the start' : won ? `BET RESULT: WIN · ${esc(d.horse||'')} · ${money.format(Number(d.stake)||0)}` : lost ? `BET RESULT: LOSS · ${esc(d.horse||'')} · ${money.format(Number(d.stake)||0)}` : esc(d.reason || 'Race complete');
    return `<article class="watch-card" style="display:block;border-color:#33465f;background:#091523">
      <div class="watch-race">${esc(race)}${venue?' | '+esc(venue):''}</div>
      <strong style="font-size:19px;margin-top:5px;color:${tone}">RACE COMPLETE</strong>
      <div style="display:grid;gap:7px;margin-top:11px;padding:11px;border-radius:11px;background:#101b2b;border:1px solid #2d425c">
        <div><span style="color:#8fa5bd;font-size:9px;font-weight:900">WINNER</span><div style="font-size:15px;font-weight:950;color:#fff;margin-top:2px">${r.winnerNumber?'#'+esc(r.winnerNumber)+' ':''}${esc(r.winnerName || 'Result received — winner name pending')}</div></div>
        <div><span style="color:#8fa5bd;font-size:9px;font-weight:900">OFFICIAL RESULT</span><div style="font-size:12px;font-weight:800;color:#dbe6f4;margin-top:2px">${Array.isArray(r.numbers)&&r.numbers.length?esc(r.numbers.join('-')):'—'}</div></div>
        <div style="padding:9px;border-radius:9px;background:${won?'#0d3525':lost?'#35151d':'#162338'};font-size:11px;font-weight:900;color:${tone}">${betLine}</div>
      </div>
    </article>`;
  }

  function instruction(result) {
    const d = result?.decision || {};
    const live = liveRunnerPrice(result,d.horse);
    const min = Number(d.minExec);
    const okay = Number.isFinite(live) && Number.isFinite(min) && live >= min;
    return { d, live, min, okay };
  }

  function renderTop(results) {
    const active = results.filter(r => !['COMPLETE','CLOSED_RESULT_PENDING'].includes(r?.phase));
    const locked = active.filter(r => r?.decision?.status === 'BET_LOCKED');
    const card=$('decisionCard'), title=$('decisionTitle'), msg=$('decisionMessage'), kicker=$('decisionKicker'), box=$('lockedBets'), bottom=$('bottomCommand');
    box.innerHTML='';
    if (locked.length) {
      const x=locked[0], q=instruction(x), d=q.d;
      if (q.okay) {
        card.className='decision-card bet-now'; bottom.className='bottom-command bet-now'; kicker.textContent='BET LOCKED · VERIFIED'; title.textContent='BET NOW';
        msg.textContent=`${x.race}: ${d.horse}. The saved V11 decision is locked and the current TABtouch quote still passes the minimum.`;
        box.innerHTML=`<article class="locked-bet"><div class="bet-badge">BET THIS HORSE</div><div class="race-line">${esc(x.race)} · FIXED WIN</div><div class="horse-name">${esc(d.horse)}</div><div class="bet-numbers"><div><span>EXACT STAKE</span><strong>${money.format(Number(d.stake)||0)}</strong></div><div><span>DO NOT BET BELOW</span><strong>${odds(d.minExec)}</strong></div></div><div style="margin-top:10px;padding:10px;border-radius:10px;background:#0d3525;border:1px solid #2a8058"><b style="color:#78f2b5">CURRENT TABTOUCH: ${odds(q.live)} · PRICE OK</b></div></article>`;
        $('bottomLabel').textContent='BET NOW'; $('bottomText').textContent=`${d.horse} · ${money.format(Number(d.stake)||0)} · min ${odds(d.minExec)}`; document.title='BET NOW · MITCHELL Racing';
      } else {
        card.className='decision-card blocked'; bottom.className='bottom-command blocked'; kicker.textContent='BET LOCKED · PRICE CHECK'; title.textContent='DO NOT PLACE YET';
        msg.textContent=Number.isFinite(q.live)?`V11 is locked on ${d.horse}, but the current ${odds(q.live)} quote is below the saved ${odds(d.minExec)} minimum.`:`V11 is locked on ${d.horse}, but a current executable quote cannot be verified.`;
        box.innerHTML=`<article class="locked-bet lock-blocked"><div class="bet-badge">LOCKED — PRICE NOT EXECUTABLE</div><div class="horse-name">${esc(d.horse)}</div><div class="bet-numbers"><div><span>SAVED STAKE</span><strong>${money.format(Number(d.stake)||0)}</strong></div><div><span>MINIMUM</span><strong>${odds(d.minExec)}</strong></div></div></article>`;
        $('bottomLabel').textContent='WAIT'; $('bottomText').textContent='Saved V11 lock exists, but live price must pass the minimum.'; document.title='MITCHELL Racing';
      }
    } else {
      card.className='decision-card no-bet'; bottom.className='bottom-command no-bet'; kicker.textContent='NO ACTIVE BET'; title.textContent='DO NOT BET';
      const finals=active.filter(r=>r?.decision?.status==='NO_BET_FINAL').length;
      msg.textContent=active.length?`${active.length} upcoming V11 race${active.length===1?' is':'s are'} being monitored. ${finals?`${finals} already has a FINAL NO BET decision. `:''}Only a saved BET LOCKED instruction can turn this box green.`:'No active V11 watch races remain. See Today’s Results below.';
      $('bottomLabel').textContent='NO ACTIVE BET'; $('bottomText').textContent=active.length?'Live V11 is monitoring upcoming races.':'All watched races are finished.'; document.title='MITCHELL Racing';
    }
    $('freshness').textContent=`LIVE V11 · checked ${stamp()}`;
    $('lastChecked').textContent=`AUTO 15s`;
    window.__MITCHELL_LIVE_V11_HAS_RENDERED=true;
  }

  function render(data, results) {
    lastData=data; lastResults=results;
    const map=new Map(results.map(r=>[raceCode(r?.race),r]));
    const items=Array.isArray(data?.watchlist)?data.watchlist:[];
    const active=[], finished=[];
    for(const item of items){const r=map.get(raceCode(item.race||item.code));if(!r)continue;(['COMPLETE','CLOSED_RESULT_PENDING'].includes(r.phase)?finished:active).push([item,r]);}
    $('watchSummary').textContent=active.length?`${active.length} upcoming V11 race${active.length===1?'':'s'} — live decision active`:'No upcoming watch races';
    $('watchlist').innerHTML=active.length?active.map(([i,r])=>watchCard(i,r)).join(''):'<div class="empty-watch">No V11 watch race is still active.</div>';
    const rd=$('resultsDetails'), rl=$('resultsList'), rs=$('resultsSummary');
    if(rd&&rl&&rs){rd.hidden=finished.length===0;rs.textContent=finished.length?`${finished.length} completed/resulting race${finished.length===1?'':'s'}`:'No results yet';rl.innerHTML=finished.map(([i,r])=>resultCard(i,r)).join('');}
    renderTop(results);
  }

  function fail(reason) {
    if (!lastResults.length) {
      $('decisionCard').className='decision-card blocked'; $('bottomCommand').className='bottom-command blocked';
      $('decisionKicker').textContent='LIVE V11 ERROR'; $('decisionTitle').textContent='DO NOT BET'; $('decisionMessage').textContent=`Live V11 cannot be verified (${reason}). No new wager should be placed.`;
      $('bottomLabel').textContent='LIVE V11 ERROR'; $('bottomText').textContent='No verified live decision.'; $('freshness').textContent='LIVE V11 UNAVAILABLE';
    }
  }

  async function refresh(forceBase = false) {
    if (busy || document.visibilityState==='hidden') return;
    busy=true;
    try {
      const data=await getBaseData(forceBase);
      const watch=Array.isArray(data?.watchlist)?data.watchlist:[];
      const requests=watch.map(i=>({race:raceCode(i.race||i.code),date:i.date,venue:i.venue||i.region})).filter(x=>x.race&&x.date&&x.venue);
      if(!requests.length){render(data,[]);return;}
      const results=await fetchLive(requests);
      render(data,results);
    } catch(e) { console.error('Live V11 refresh failed',e); fail(e instanceof Error?e.message:'feed error'); }
    finally { busy=false; }
  }

  window.addEventListener('mitchell-base-ready', event => {
    if (event?.detail) {
      lastData = event.detail;
      baseFetchedAt = Date.now();
    }
    setTimeout(() => refresh(false), 50);
  });
  window.addEventListener('mitchell-refresh-live',()=>setTimeout(() => refresh(false),50));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(() => refresh(false),50)});
  window.addEventListener('online',()=>setTimeout(() => refresh(false),50));
  setTimeout(() => refresh(false),500);
  setInterval(() => refresh(false),POLL_MS);
})();