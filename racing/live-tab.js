(() => {
  'use strict';

  const LIVE_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-tab-live';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const FAR_POLL_MS = 15000;
  const NEAR_POLL_MS = 5000;
  const HOT_POLL_MS = 2500;
  const BASE_REFRESH_MS = 300000;
  const FETCH_TIMEOUT_MS = 9000;
  const SOURCE_MAX_AGE_MS = 8000;
  const EXEC_OPEN = 20;
  const EXEC_CUTOFF = 10;
  const MIN_PRICE = 3;
  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 });

  let busy = false;
  let lastData = null;
  let lastResults = [];
  let baseFetchedAt = 0;
  let pollTimer = null;
  let currentPollMs = FAR_POLL_MS;
  let lastLiveSuccessAt = null;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const raceCode = v => String(v || '').trim().toUpperCase();
  const odds = v => Number.isFinite(Number(v)) ? '$' + Number(v).toFixed(2) : '—';
  const horseKey = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]+/g,' ').replace(/\bNZ\b$/,'').trim().replace(/\s+/g,' ');

  function stamp(value = new Date()) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return 'time unavailable';
    return new Intl.DateTimeFormat('en-AU', { hour:'numeric', minute:'2-digit', second:'2-digit', timeZone:'Australia/Perth' }).format(d) + ' Perth';
  }

  function leadText(seconds) {
    if (!Number.isFinite(Number(seconds))) return 'jump time checking';
    const s = Number(seconds);
    if (s <= 0) return 'race closed';
    if (s < 60) return `${Math.ceil(s)}s to jump`;
    return `${Math.floor(s/60)}m ${Math.max(0,Math.floor(s%60))}s to jump`;
  }

  function pollLabel() {
    return currentPollMs <= HOT_POLL_MS ? 'AUTO 2.5s · HOT' : currentPollMs <= NEAR_POLL_MS ? 'AUTO 5s · NEAR' : 'AUTO 15s';
  }

  function emitHealth(status, detail = {}) {
    window.dispatchEvent(new CustomEvent('mitchell-live-health', {
      detail:{ status, checkedAt:lastLiveSuccessAt, pollMs:currentPollMs, ...detail }
    }));
  }

  async function fetchTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal:controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function getJson(path) {
    const r = await fetchTimeout(`${path}?v=1.8.1`, { cache:'no-cache' });
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
    const r = await fetchTimeout(LIVE_URL, {
      method:'POST', cache:'no-store',
      headers:{ 'Content-Type':'application/json', apikey:ANON, Authorization:`Bearer ${ANON}` },
      body:JSON.stringify({ requests })
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body?.ok !== true || !Array.isArray(body.results)) throw new Error(body?.error || `Live V11 HTTP ${r.status}`);
    return body.results;
  }

  function nextPoll(results) {
    const leads = (Array.isArray(results) ? results : [])
      .filter(r => !['COMPLETE','CLOSED_RESULT_PENDING','FINAL'].includes(r?.phase))
      .map(r => Number(r?.leadSeconds)).filter(x => Number.isFinite(x) && x > 0);
    if (!leads.length) return FAR_POLL_MS;
    const nearest = Math.min(...leads);
    if (nearest <= 45) return HOT_POLL_MS;
    if (nearest <= 180) return NEAR_POLL_MS;
    return FAR_POLL_MS;
  }

  function scheduleNext(delay = currentPollMs) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(() => refresh(false), Math.max(1000, Number(delay) || FAR_POLL_MS));
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

  function sameFavourite(result, horse) {
    const favs = Array.isArray(result?.favourites) ? result.favourites : [];
    return result?.favouriteType === 'SINGLE' && favs[0]?.name && horseKey(favs[0].name) === horseKey(horse);
  }

  function newestSourceTime(results) {
    const times = (Array.isArray(results) ? results : []).map(r => Date.parse(r?.fetchedAt)).filter(Number.isFinite);
    return times.length ? new Date(Math.max(...times)) : null;
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
      <div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-size:10px;letter-spacing:.06em;color:#78f2b5">LIVE TABTOUCH FIXED-WIN ODDS</b><div style="font-size:9px;color:#93a9c0;margin-top:3px">source ${esc(stamp(result?.fetchedAt))}</div></div><span style="font-size:9px;color:#8fa5bd">${pollLabel()}</span></div>
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
        ${gate('3. PRICE',priceMode,single?`${odds(p)} live vs ${odds(gateMin)} minimum`:'Waiting for one verified live favourite price')}
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
    const lead = Number(result?.leadSeconds);
    const sourceAt = Date.parse(result?.fetchedAt);
    const sourceAgeMs = Number.isFinite(sourceAt) ? Date.now() - sourceAt : Infinity;
    const priceOk = Number.isFinite(live) && live >= Math.max(MIN_PRICE, Number.isFinite(min) ? min : MIN_PRICE);
    const phaseOk = result?.phase === 'LOCKED' && d?.status === 'BET_LOCKED';
    const windowOk = Number.isFinite(lead) && lead <= EXEC_OPEN && lead > EXEC_CUTOFF && result?.closed !== true;
    const fresh = Number.isFinite(sourceAt) && sourceAgeMs >= -2000 && sourceAgeMs <= SOURCE_MAX_AGE_MS;
    const favouriteOk = sameFavourite(result,d.horse);
    const unconfirmed = String(d?.executionStatus || 'UNCONFIRMED').toUpperCase() !== 'CONFIRMED';
    const okay = priceOk && phaseOk && windowOk && fresh && favouriteOk && unconfirmed;
    let blockReason = null;
    if (!unconfirmed) blockReason = 'This wager is already recorded. Do not place it again.';
    else if (!phaseOk) blockReason = 'The server no longer reports an active locked signal.';
    else if (!windowOk) blockReason = `The ${EXEC_OPEN}s→${EXEC_CUTOFF}s execution window is not open.`;
    else if (!favouriteOk) blockReason = 'The locked horse is no longer the single verified favourite.';
    else if (!fresh) blockReason = 'The source quote is stale or timestamp-invalid.';
    else if (!priceOk) blockReason = 'The current live price is below the required minimum or unavailable.';
    return { d, live, min, lead, sourceAgeMs, okay, blockReason };
  }

  function renderTop(results) {
    const active = results.filter(r => !['COMPLETE','CLOSED_RESULT_PENDING'].includes(r?.phase));
    const locked = active.filter(r => r?.decision?.status === 'BET_LOCKED');
    const card=$('decisionCard'), title=$('decisionTitle'), msg=$('decisionMessage'), kicker=$('decisionKicker'), box=$('lockedBets'), bottom=$('bottomCommand');
    if (!card || !title || !msg || !kicker || !box || !bottom) return;
    box.innerHTML='';

    if (locked.length > 1) {
      card.className='decision-card blocked'; bottom.className='bottom-command blocked'; kicker.textContent='SAFETY BLOCK'; title.textContent='DO NOT BET';
      msg.textContent='More than one V11 race is simultaneously locked. The app will not guess which instruction to prioritise.';
      $('bottomLabel').textContent='DO NOT BET'; $('bottomText').textContent='Multiple simultaneous locks detected.'; document.title='DO NOT BET · MITCHELL Racing';
    } else if (locked.length) {
      const x=locked[0], q=instruction(x), d=q.d;
      if (String(d?.executionStatus || '').toUpperCase() === 'CONFIRMED') {
        card.className='decision-card waiting'; bottom.className='bottom-command waiting'; kicker.textContent='ACTUAL WAGER CONFIRMED'; title.textContent='BET RECORDED';
        msg.textContent=`${x.race}: ${d.horse}. Accepted execution is already recorded. Do not place another wager.`;
        box.innerHTML=`<article class="locked-bet"><div class="bet-badge">ACTUAL BET CONFIRMED</div><div class="race-line">${esc(x.race)} · FIXED WIN</div><div class="horse-name">${esc(d.horse)}</div><div class="bet-numbers"><div><span>ACCEPTED STAKE</span><strong>${money.format(Number(d.acceptedStake)||0)}</strong></div><div><span>ACCEPTED PRICE</span><strong>${odds(d.acceptedPrice)}</strong></div></div></article>`;
        $('bottomLabel').textContent='BET RECORDED'; $('bottomText').textContent='Do not place a second wager.'; document.title='BET RECORDED · MITCHELL Racing';
      } else if (q.okay) {
        card.className='decision-card bet-now'; bottom.className='bottom-command bet-now'; kicker.textContent='BET LOCKED · VERIFIED'; title.textContent='BET NOW';
        msg.textContent=`${x.race}: ${d.horse}. Live favourite, price, source freshness and the ${EXEC_OPEN}s→${EXEC_CUTOFF}s window all pass.`;
        box.innerHTML=`<article class="locked-bet"><div class="bet-badge">BET THIS HORSE</div><div class="race-line">${esc(x.race)} · FIXED WIN</div><div class="horse-name">${esc(d.horse)}</div><div class="bet-numbers"><div><span>EXACT STAKE</span><strong>${money.format(Number(d.stake)||0)}</strong></div><div><span>DO NOT BET BELOW</span><strong>${odds(d.minExec)}</strong></div></div><div style="margin-top:10px;padding:10px;border-radius:10px;background:#0d3525;border:1px solid #2a8058"><b style="color:#78f2b5">CURRENT TABTOUCH: ${odds(q.live)} · ${Math.max(0,Math.round(q.sourceAgeMs/1000))}s SOURCE AGE · ${Math.ceil(q.lead)}s TO JUMP</b></div></article>`;
        $('bottomLabel').textContent='BET NOW'; $('bottomText').textContent=`${d.horse} · ${money.format(Number(d.stake)||0)} · min ${odds(d.minExec)}`; document.title='BET NOW · MITCHELL Racing';
      } else {
        card.className='decision-card blocked'; bottom.className='bottom-command blocked'; kicker.textContent='LOCK EXISTS · FINAL CHECK FAILED'; title.textContent='DO NOT PLACE YET';
        msg.textContent=q.blockReason || 'The locked signal is not safely executable right now.';
        box.innerHTML=`<article class="locked-bet lock-blocked"><div class="bet-badge">LOCKED — NOT EXECUTABLE</div><div class="horse-name">${esc(d.horse)}</div><div class="bet-numbers"><div><span>SAVED STAKE</span><strong>${money.format(Number(d.stake)||0)}</strong></div><div><span>MINIMUM</span><strong>${odds(d.minExec)}</strong></div></div></article>`;
        $('bottomLabel').textContent='WAIT'; $('bottomText').textContent='Saved V11 lock exists, but every live safety check must pass.'; document.title='MITCHELL Racing';
      }
    } else if (active.length) {
      const finals=active.filter(r=>r?.decision?.status==='NO_BET_FINAL').length;
      if (finals === active.length) {
        card.className='decision-card no-bet'; bottom.className='bottom-command no-bet'; kicker.textContent='FINAL DECISION'; title.textContent='NO BET';
        msg.textContent='Every remaining watched race has a FINAL NO BET decision. Do not choose another horse.';
        $('bottomLabel').textContent='NO BET'; $('bottomText').textContent='All remaining watched races are final no-bets.';
      } else {
        card.className='decision-card waiting'; bottom.className='bottom-command waiting'; kicker.textContent='YOUR ACTION'; title.textContent='WAIT';
        msg.textContent=`${active.length} upcoming V11 race${active.length===1?' is':'s are'} being monitored${finals?`; ${finals} already final no-bet`:''}. Do nothing unless a saved BET LOCKED instruction turns this box green.`;
        $('bottomLabel').textContent='WAIT'; $('bottomText').textContent='Live V11 is monitoring. Do nothing unless the top box turns green.';
      }
      document.title='MITCHELL Racing';
    } else {
      card.className='decision-card no-bet'; bottom.className='bottom-command no-bet'; kicker.textContent='RACE-DAY STATUS'; title.textContent='NO BET';
      msg.textContent='No active V11 watch race remains. See Today’s Results for the completed audit.';
      $('bottomLabel').textContent='NO BET'; $('bottomText').textContent='No active V11 watch race remains.'; document.title='MITCHELL Racing';
    }

    const source = newestSourceTime(results);
    $('freshness').textContent = source ? `LIVE V11 · source ${stamp(source)}` : 'LIVE V11 · verified response';
    $('lastChecked').textContent = pollLabel();
    window.__MITCHELL_LIVE_V11_HAS_RENDERED=true;
  }

  function render(data, results) {
    lastData=data;
    lastResults=results;
    lastLiveSuccessAt=Date.now();
    currentPollMs=nextPoll(results);

    const map=new Map(results.map(r=>[raceCode(r?.race),r]));
    const items=Array.isArray(data?.watchlist)?data.watchlist:[];
    const active=[], finished=[];
    for(const item of items){
      const r=map.get(raceCode(item.race||item.code));
      if(!r) continue;
      (['COMPLETE','CLOSED_RESULT_PENDING'].includes(r.phase)?finished:active).push([item,r]);
    }
    $('watchSummary').textContent=active.length?`${active.length} upcoming V11 race${active.length===1?'':'s'} — live decision active`:'No upcoming watch races';
    $('watchlist').innerHTML=active.length?active.map(([i,r])=>watchCard(i,r)).join(''):'<div class="empty-watch">No V11 watch race is still active.</div>';
    const rd=$('resultsDetails'), rl=$('resultsList'), rs=$('resultsSummary');
    if(rd&&rl&&rs){
      rd.hidden=finished.length===0;
      rs.textContent=finished.length?`${finished.length} completed/resulting race${finished.length===1?'':'s'}`:'No results yet';
      rl.innerHTML=finished.map(([i,r])=>resultCard(i,r)).join('');
    }
    renderTop(results);
    const finiteLeads=results.map(r=>Number(r?.leadSeconds)).filter(x=>Number.isFinite(x)&&x>0);
    emitHealth('OK',{ sourceFetchedAt:newestSourceTime(results)?.toISOString?.() || null, nearestLeadSeconds:finiteLeads.length?Math.min(...finiteLeads):null, reason:'Live V11 response verified.' });
  }

  function fail(reason) {
    const card=$('decisionCard'), bottom=$('bottomCommand');
    if(card) card.className='decision-card blocked';
    if(bottom) bottom.className='bottom-command blocked';
    if($('decisionKicker')) $('decisionKicker').textContent='LIVE V11 ERROR';
    if($('decisionTitle')) $('decisionTitle').textContent='DO NOT BET';
    if($('decisionMessage')) $('decisionMessage').textContent=`Live V11 cannot be verified (${reason}). Previous live prices or green states are not valid.`;
    if($('bottomLabel')) $('bottomLabel').textContent='LIVE V11 ERROR';
    if($('bottomText')) $('bottomText').textContent='No verified live decision. Do not use an older screen.';
    if($('freshness')) $('freshness').textContent='LIVE V11 UNAVAILABLE · FAIL CLOSED';
    if($('lastChecked')) $('lastChecked').textContent='REFRESH REQUIRED';
    document.title='DO NOT BET · MITCHELL Racing';
    emitHealth('ERROR',{ reason:String(reason || 'Live feed unavailable') });
  }

  function verifyCompleteResponse(requests, results) {
    if (!Array.isArray(results) || results.length !== requests.length) throw new Error('INCOMPLETE_LIVE_RESPONSE');
    const expected = new Set(requests.map(x=>raceCode(x.race)));
    const received = new Set(results.map(x=>raceCode(x?.race)).filter(Boolean));
    for (const race of expected) if (!received.has(race)) throw new Error(`MISSING_LIVE_RACE_${race}`);
  }

  async function refresh(forceBase = false) {
    if (busy) return;
    if (document.visibilityState==='hidden') { scheduleNext(FAR_POLL_MS); return; }
    if (navigator.onLine === false) { fail('browser offline'); scheduleNext(FAR_POLL_MS); return; }
    busy=true;
    try {
      const data=await getBaseData(forceBase);
      const watch=Array.isArray(data?.watchlist)?data.watchlist:[];
      const requests=watch.map(i=>({race:raceCode(i.race||i.code),date:i.date,venue:i.venue||i.region})).filter(x=>x.race&&x.date&&x.venue);
      if(!requests.length){ render(data,[]); return; }
      const results=await fetchLive(requests);
      verifyCompleteResponse(requests,results);
      render(data,results);
    } catch(e) {
      console.error('Live V11 refresh failed',e);
      fail(e instanceof Error?e.message:'feed error');
      currentPollMs = NEAR_POLL_MS;
    } finally {
      busy=false;
      scheduleNext(currentPollMs);
    }
  }

  window.addEventListener('mitchell-base-ready', event => {
    if (event?.detail) { lastData=event.detail; baseFetchedAt=Date.now(); }
    setTimeout(() => refresh(false), 50);
  });
  window.addEventListener('mitchell-refresh-live',()=>setTimeout(() => refresh(false),50));
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') setTimeout(() => refresh(false),50); });
  window.addEventListener('online',()=>setTimeout(() => refresh(false),50));
  window.addEventListener('offline',()=>{ clearTimeout(pollTimer); fail('browser offline'); scheduleNext(FAR_POLL_MS); });

  emitHealth('CHECKING',{ reason:'Waiting for first verified live response.' });
  setTimeout(() => refresh(false),500);
})();