/* MITCHELL Racing · Holo History · v1.12.0
   Read-only presentation of:
     1. the immutable 2026 BET NOW ledger (live database first, stored canonical ledger second),
     2. the weekly 21-stream Saturday audits (history/YYYY-MM-DD.json),
     3. the frozen V11 historical replay (v11-replay.json, model research only).
   It never writes data, never edits a signal and never fills a gap. If a source is
   unavailable it says so instead of showing zeros. Hologram "result projections" show
   only the recorded winner/favourite numbers - running positions are not recorded, so
   nothing about how a race was run is drawn or implied. */
(() => {
  'use strict';

  const LEDGER_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-execution?mode=system&year=2026&limit=5000';
  // Public Supabase anon key (same publishable key the live engine uses in live-tab.js).
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const STORED_URL = './history/2026-bet-now-signals.json';
  const REPLAY_URL = './v11-replay.json';
  const TZ = 'Australia/Perth';
  const FETCH_MS = 9000;
  const REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  // Captured at load, before odds-full-feed-helper.js wraps window.fetch. That wrapper drops every
  // LIVE_SYSTEM_SIGNAL row without a confirmed cash execution from racing-execution responses, which
  // would hide unplaced BET NOW signals. System history counts every BET NOW (AI_CONTEXT §3), so the
  // ledger is read through the unwrapped fetch. Keep this script before odds-*.js in index.html.
  const rawFetch = window.fetch.bind(window);
  if (!/\[native code\]/.test(Function.prototype.toString.call(window.fetch))) console.warn('Holo History: window.fetch was already wrapped when History loaded, so ledger rows may be filtered. Keep holo-history.js before odds-*.js.');

  const HORSE = {
    body:'M40,54C40.6,50.8 42.8,44.7 46,42C49.2,39.3 54.9,37.2 60,37C65.1,36.8 71.9,39.9 78,41C84.1,42.1 92.6,44.2 98,44C103.4,43.8 107.8,42.1 112,40C116.2,37.9 119.8,34.4 124,31C128.2,27.6 134.3,22.5 138,19C141.7,15.5 145.6,11.6 147,9C148.4,6.4 146.4,3.2 147,3C147.6,2.8 149.9,8.2 151,8C152.1,7.8 153.2,1.8 154,2C154.8,2.2 154.9,7.2 156,9C157.1,10.8 158.8,10.4 161,13C163.2,15.6 167.8,21.8 170,25C172.2,28.2 174.5,30.8 175,33C175.5,35.2 174.6,37.9 173,39C171.4,40.1 167.6,40.6 165,40C162.4,39.4 159.4,36.4 157,35C154.6,33.6 151.9,30.2 150,31C148.1,31.8 146.8,36.5 145,40C143.2,43.5 140.6,49.0 139,53C137.4,57.0 136.9,61.5 135,65C133.1,68.5 131.0,72.6 127,75C123.0,77.4 115.6,79.2 110,80C104.4,80.8 97.8,80.5 92,80C86.2,79.5 79.1,78.1 74,77C68.9,75.9 64.2,74.3 60,73C55.8,71.7 50.9,70.8 48,69C45.1,67.2 43.3,64.4 42,62C40.7,59.6 39.4,57.2 40,54Z',
    tail:'M41.3,46.1C38.8,45.0 32.9,45.9 28.3,47.8C23.6,49.8 19.2,53.3 15.4,57.0C11.6,60.7 9.4,64.7 7.1,68.4C4.7,72.1 3.0,75.7 2.4,77.5C1.8,79.4 2.1,79.5 3.6,78.5C5.1,77.4 7.9,74.4 10.9,71.6C14.0,68.8 16.9,65.8 20.6,63.0C24.3,60.3 27.8,57.8 31.7,56.2C35.7,54.5 40.9,55.8 42.7,53.9C44.4,52.1 43.9,47.2 41.3,46.1Z',
    legNear:['M120.8,71.9C121.5,76.0 129.9,81.9 135.0,86.7C140.1,91.4 144.1,95.1 149.2,98.4C154.3,101.8 159.0,104.1 163.2,105.4C167.5,106.7 171.2,106.4 173.0,105.5C174.8,104.6 174.5,101.4 173.0,100.5C171.5,99.6 168.4,101.9 164.8,100.6C161.1,99.4 157.0,97.0 152.8,93.6C148.5,90.1 144.9,86.6 141.0,81.3C137.1,76.0 134.8,65.8 131.2,64.1C127.6,62.4 120.1,67.8 120.8,71.9Z','M46.5,59.9C42.3,62.7 41.5,76.1 38.1,83.7C34.8,91.3 31.6,96.9 27.7,102.0C23.8,107.2 17.9,109.6 16.4,112.1C14.9,114.6 16.7,117.0 19.6,115.9C22.5,114.8 27.6,110.9 32.3,106.0C37.0,101.0 40.6,95.1 45.9,88.3C51.1,81.5 61.3,73.2 61.5,68.1C61.6,63.0 50.7,57.1 46.5,59.9Z'],
    legFar:['M112.3,71.7C111.7,75.6 119.9,84.5 120.5,90.0C121.1,95.5 118.1,99.1 115.8,102.3C113.5,105.6 108.6,106.2 107.6,107.9C106.6,109.7 108.1,112.5 110.4,112.1C112.7,111.7 117.1,109.6 120.2,105.7C123.3,101.7 126.9,96.7 127.5,90.0C128.1,83.3 126.5,71.6 123.7,68.3C121.0,65.0 112.8,67.8 112.3,71.7Z','M63.7,71.1C64.1,76.3 73.8,86.2 78.4,93.8C83.0,101.4 86.2,107.3 89.3,113.3C92.4,119.3 93.7,124.9 95.7,127.0C97.7,129.1 100.5,127.9 100.3,125.0C100.1,122.1 97.4,117.0 94.7,110.7C92.1,104.5 88.9,98.5 85.6,90.2C82.3,82.0 80.2,68.3 76.3,64.9C72.3,61.4 63.3,65.9 63.7,71.1Z'],
    jockey:'M92,30C92.8,27.6 96.2,26.2 100,24C103.8,21.8 106.8,20.6 111,19C115.2,17.4 117.8,16.0 121,16C124.2,16.0 126.2,17.4 127,19C127.8,20.6 127.6,22.2 125,24C122.4,25.8 118.2,26.0 114,28C109.8,30.0 107.6,32.4 104,34C100.4,35.6 98.4,36.8 96,36C93.6,35.2 91.2,32.4 92,30Z',
    helmet:'M122.6,14.6a6.2,6.2 0 1,1 12.4,0q0,2.4 -1.5,3.4h-10.2z',
    arm:'M118.9,21.8C119.6,23.9 123.5,28.1 126.9,29.9C130.2,31.8 135.5,32.3 137.6,32.0C139.7,31.6 139.9,29.1 138.4,28.0C136.9,27.0 131.9,27.8 129.1,26.1C126.4,24.3 124.9,19.0 123.1,18.2C121.2,17.4 118.2,19.7 118.9,21.8Z',
    knee:'M96.0,34.9C98.8,36.8 111.5,35.7 113.6,37.8C115.7,40.0 108.0,44.8 107.8,46.9C107.5,48.9 110.3,51.4 112.2,49.1C114.1,46.8 120.9,38.1 118.4,34.2C115.8,30.2 102.1,27.0 98.0,27.1C94.0,27.3 93.2,32.9 96.0,34.9Z'
  };

  const money = new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0});
  const dayFmt = new Intl.DateTimeFormat('en-AU',{timeZone:TZ,weekday:'short',day:'numeric',month:'short',year:'numeric'});
  const shortFmt = new Intl.DateTimeFormat('en-AU',{timeZone:TZ,day:'numeric',month:'short'});
  const weekFmt = new Intl.DateTimeFormat('en-AU',{timeZone:TZ,weekday:'long',day:'numeric',month:'long'});

  const S = {
    ledger:{ status:'idle', list:[], source:'none', notices:[], throughDate:null },
    weeks:{ status:'idle', list:[] },
    replay:{ status:'idle', data:null, fys:[] },
    view:'signals',
    openWeeks:new Set(),
    weeksTouched:false,
    token:0
  };

  /* ------------------------------------------------------------ helpers */
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => (v === null || v === undefined || v === '') ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
  const up = v => String(v ?? '').trim().toUpperCase();
  const isoDate = v => String(v || '').slice(0, 10);
  const asDate = iso => new Date(isoDate(iso) + 'T12:00:00+08:00');
  const fmt = (f, iso) => { const d = asDate(iso); return Number.isNaN(d.getTime()) ? String(iso || '—') : f.format(d); };
  const cash = v => v === null ? '—' : money.format(v);
  const signed = v => v === null ? '—' : v === 0 ? money.format(0) : (v > 0 ? '+' : '−') + money.format(Math.abs(v));
  const price = v => v === null ? '—' : '$' + v.toFixed(2);
  const pct = v => (v === null || !Number.isFinite(v)) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
  const kfmt = v => {
    if (v === null || !Number.isFinite(v)) return '—';
    const a = Math.abs(v), s = a >= 1000 ? '$' + (Math.round(a / 100) / 10).toFixed(a >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K' : '$' + Math.round(a);
    return v < 0 ? '−' + s : s;
  };
  const nameKey = v => up(v).replace(/\([^)]*\)/g, ' ').replace(/[^A-Z0-9]+/g, ' ').trim();
  function displayName(v){
    return String(v || '').trim().split(/\s+/).map(w => {
      if (!w) return w;
      if (w.startsWith('(')) return w.toUpperCase();
      return w.toLowerCase().replace(/(^|-)([a-z])/g, (m, p, c) => p + c.toUpperCase());
    }).join(' ');
  }
  function normResult(v){
    const r = up(v);
    if (r === 'WIN' || r === 'WON' || r === 'W' || r === 'SIGNAL_WIN') return 'WIN';
    if (r === 'LOSS' || r === 'LOST' || r === 'L' || r === 'SIGNAL_LOSS') return 'LOSS';
    return 'PENDING';
  }
  // System P/L rule (AI_CONTEXT): instructed stake at the recorded instruction price.
  function plOf(pl, result, stake, pr){
    if (pl !== null) return pl;
    if (result === 'WIN' && stake !== null && pr !== null) return stake * (pr - 1);
    if (result === 'LOSS' && stake !== null) return -stake;
    return null;
  }

  async function getJson(url, opts = {}){
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_MS);
    try {
      const r = await rawFetch(url, { cache:'no-store', ...opts, signal:ctl.signal });
      let body = null;
      try { body = await r.json(); } catch { body = null; }
      return { ok:r.ok, status:r.status, body };
    } finally { clearTimeout(timer); }
  }

  /* ------------------------------------------------------------ ledger */
  function fromDb(x){
    const date = isoDate(x?.date), race = up(x?.race), result = normResult(x?.result);
    const stake = num(x?.modelStake), pr = num(x?.signalPrice);
    return {
      key:`${date}|${race}`, no:num(x?.signalNo), date, race, venue:String(x?.venue || ''), horse:String(x?.horse || ''),
      horseNo:null, state:num(x?.stateBefore), stateAfter:num(x?.stateAfter), stake, price:pr, result,
      winner:String(x?.winnerName || x?.winner || ''), winnerNo:num(x?.winnerNumber), pl:plOf(num(x?.modelPl), result, stake, pr),
      exec:up(x?.executionStatus), accStake:num(x?.acceptedStake), accPrice:num(x?.acceptedPrice), cashPl:num(x?.cashPl),
      evidence:String(x?.signalEvidence || ''), contradictory:x?.historicalContradictoryNoBetAlert === true
    };
  }
  function fromStored(x){
    const date = isoDate(x?.date), race = up(x?.race), result = normResult(x?.result);
    const stake = num(x?.stakeAud), pr = num(x?.signalPrice);
    return {
      key:`${date}|${race}`, no:num(x?.signalNo), date, race, venue:String(x?.venue || ''), horse:String(x?.horse || ''),
      horseNo:null, state:num(x?.stateBefore), stateAfter:null, stake, price:pr, result,
      winner:String(x?.winner || ''), winnerNo:num(x?.winnerNumber), pl:plOf(num(x?.signalPlAud), result, stake, pr),
      exec:up(x?.executionStatus), accStake:num(x?.acceptedStakeAud), accPrice:num(x?.acceptedPrice), cashPl:num(x?.cashPlAud),
      evidence:String(x?.signalEvidence || ''), contradictory:x?.historicalContradictoryNoBetAlert === true
    };
  }
  function order(a, b){
    if (a.no !== null && b.no !== null && a.no !== b.no) return a.no - b.no;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.race < b.race ? -1 : a.race > b.race ? 1 : 0;
  }
  function totals(list){
    let wins = 0, losses = 0, pending = 0, turnover = 0, pl = 0, plMissing = 0;
    list.forEach(s => {
      if (s.result === 'WIN' || s.result === 'LOSS') {
        if (s.result === 'WIN') wins++; else losses++;
        if (s.pl === null || s.stake === null) { plMissing++; return; }
        turnover += s.stake; pl += s.pl;
      } else pending++;
    });
    const conf = list.filter(s => s.exec === 'CONFIRMED' && (s.accStake || 0) > 0);
    return {
      n:list.length, wins, losses, pending, turnover, pl, plMissing, roi:turnover ? pl / turnover * 100 : null,
      cashN:conf.length, cashStake:conf.reduce((a, s) => a + (s.accStake || 0), 0),
      cashPl:conf.reduce((a, s) => a + (s.cashPl ?? 0), 0), cashMissing:conf.filter(s => s.cashPl === null).length
    };
  }

  function buildLedger(db, dbErr, stored, storedFile){
    const base = window.__MITCHELL_BASE_DATA || null;
    const through = base?.season?.liveSignalAudit?.throughDate || base?.auditThroughDate || (stored && stored.length ? stored.map(s => s.date).sort().pop() : null);
    if (!db && !stored) {
      return { status:'error', list:[], source:'none', throughDate:null, notices:[{ bad:true,
        text:`The BET NOW ledger can't be loaded right now (live database: ${dbErr || 'unavailable'}; the stored ledger file is also unavailable). Nothing has been substituted. Tap Refresh ledger to try again.` }] };
    }
    const notices = [], map = new Map(), conflicts = [];
    (stored || []).forEach(s => map.set(s.key, { ...s, srcs:['stored'] }));
    let dbOnly = 0;
    (db || []).forEach(d => {
      const prev = map.get(d.key);
      if (!prev) { map.set(d.key, { ...d, srcs:['db'] }); dbOnly++; return; }
      const diff = [];
      if (d.stake !== null && prev.stake !== null && Math.abs(d.stake - prev.stake) > 0.5) diff.push('stake');
      if (d.price !== null && prev.price !== null && Math.abs(d.price - prev.price) > 0.0001) diff.push('price');
      if (d.result !== 'PENDING' && prev.result !== 'PENDING' && d.result !== prev.result) diff.push('result');
      if (diff.length) conflicts.push(`${prev.race} ${fmt(shortFmt, prev.date)} (${diff.join(', ')})`);
      const merged = { ...prev };
      Object.keys(d).forEach(k => {
        const v = d[k];
        if (v === null || v === undefined || v === '') return;
        if (k === 'result' && v === 'PENDING' && prev.result !== 'PENDING') return;
        if (k === 'contradictory' && v === false) return;
        merged[k] = v;
      });
      merged.srcs = ['stored', 'db'];
      map.set(d.key, merged);
    });
    const list = [...map.values()].sort(order);
    if (!db) notices.push({ text:`Couldn't reach the live database ledger (${dbErr || 'unavailable'}). Showing the stored ledger${through ? `, audited to ${fmt(shortFmt, through)}` : ''}. A BET NOW from today won't appear here until the live ledger is reachable again.` });
    if (db && dbOnly) notices.push({ text:`${dbOnly} signal${dbOnly === 1 ? ' is' : 's are'} in the live database but not yet in the weekly audit file. ${dbOnly === 1 ? 'It is' : 'They are'} tagged "Live database".` });
    if (db && stored) {
      const dbKeys = new Set(db.map(d => d.key));
      const missing = stored.filter(s => !dbKeys.has(s.key)).length;
      if (missing) notices.push({ text:`The live database returned ${db.length} signal${db.length === 1 ? '' : 's'} but the audited ledger has ${missing} more. BET NOW signals are permanent, so the audited ones are still shown.` });
    }
    if (conflicts.length) notices.push({ bad:true, text:`The database and the stored ledger disagree on ${conflicts.join('; ')}. The database version is shown. Check this before the next weekly update.` });
    if (storedFile?.summary && stored) {
      const t = totals(stored), sm = storedFile.summary;
      const off = (num(sm.systemBets) !== null && num(sm.systemBets) !== stored.length)
        || (num(sm.systemPlAud) !== null && Math.abs(num(sm.systemPlAud) - t.pl) > 1)
        || (num(sm.systemTurnoverAud) !== null && Math.abs(num(sm.systemTurnoverAud) - t.turnover) > 1);
      if (off) notices.push({ bad:true, text:"The stored ledger file's summary totals don't match its own rows. The figures here are computed from the rows." });
    }
    const source = (db && db.length) || !(stored && stored.length) ? 'live' : 'stored';
    return { status:'ready', list, source, notices, throughDate:through, loadedAt:Date.now() };
  }

  async function loadLedger(force = false){
    if (S.ledger.status === 'loading') return;
    if (S.ledger.status === 'ready' && !force) return;
    const token = ++S.token;
    S.ledger = { ...S.ledger, status:'loading' };
    paintHero();
    const [dbRes, stRes] = await Promise.allSettled([
      getJson(LEDGER_URL, { headers:{ apikey:ANON, Authorization:'Bearer ' + ANON } }),
      getJson(STORED_URL + '?h=' + Date.now())
    ]);
    if (token !== S.token) return;
    let db = null, dbErr = '';
    const dv = dbRes.status === 'fulfilled' ? dbRes.value : null;
    if (dv && dv.ok && dv.body?.ok === true && Array.isArray(dv.body.history)) {
      db = dv.body.history.filter(x => x?.source === 'LIVE_SYSTEM_SIGNAL').map(fromDb).filter(x => x.date && x.race);
    } else if (dv) {
      dbErr = `HTTP ${dv.status}${dv.body?.error ? ' ' + String(dv.body.error).slice(0, 80) : dv.body?.message ? ' ' + String(dv.body.message).slice(0, 80) : ''}`;
    } else {
      dbErr = dbRes.reason?.name === 'AbortError' ? 'request timed out' : 'network error';
    }
    let stored = null, storedFile = null;
    const sv = stRes.status === 'fulfilled' ? stRes.value : null;
    if (sv && sv.ok && Array.isArray(sv.body?.signals)) {
      storedFile = sv.body;
      stored = storedFile.signals.map(fromStored).filter(x => x.date && x.race);
    }
    S.ledger = buildLedger(db, dbErr, stored, storedFile);
    enrichFromWeeks();
    paintHero();
    if (S.view === 'signals') paintView();
  }

  /* ------------------------------------------------------------ weekly audits */
  function saturdays(fromIso, toIso){
    const out = [], d = asDate(fromIso), end = asDate(toIso);
    if (Number.isNaN(d.getTime()) || Number.isNaN(end.getTime())) return out;
    while (d.getUTCDay() !== 6) d.setUTCDate(d.getUTCDate() + 1);
    while (d <= end && out.length < 60) { out.push(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() + 7); }
    return out;
  }
  const PREFIX = { Perth:'PR', Sydney:'SR', Melbourne:'MR' };
  function normWeek(d){
    const date = isoDate(d?.date || d?.raceDate);
    const src = Array.isArray(d?.races) ? d.races : Array.isArray(d?.results) ? d.results : [];
    const rows = src.map(r => ({
      race:up(r?.race), venue:String(r?.venue || ''), fav:String(r?.favourite || ''), favNo:num(r?.favouriteNumber),
      outcome:normResult(r?.outcome), before:num(r?.stateBefore), after:num(r?.stateAfter),
      signal:r?.betNowSignal === true, sigHorse:String(r?.signalHorse || ''), sigStake:num(r?.signalStakeAud), sigPrice:num(r?.signalPrice),
      sigOutcome:normResult(r?.signalOutcome), sigPl:num(r?.signalModelPlAud), winner:String(r?.winner || ''), winnerNo:num(r?.winnerNumber),
      evidence:String(r?.evidenceStatus || ''), url:String(r?.sourceUrl || ''), exec:up(r?.executionStatus)
    })).filter(r => r.race);
    return {
      date, rows, inactive:Array.isArray(d?.inactive) ? d.inactive : [],
      favWins:rows.filter(r => r.outcome === 'WIN').length, favLosses:rows.filter(r => r.outcome === 'LOSS').length
    };
  }
  async function loadWeeks(){
    if (S.weeks.status === 'loading' || S.weeks.status === 'ready') return;
    S.weeks = { status:'loading', list:[] };
    if (S.view === 'saturdays') paintView();
    let base = window.__MITCHELL_BASE_DATA || null;
    if (!base) { try { base = (await getJson('./current.json?h=' + Date.now())).body; } catch { base = null; } }
    const from = base?.season?.liveStart || S.ledger.list[0]?.date || null;
    const to = base?.auditThroughDate || base?.lastWeek?.date || S.ledger.throughDate || null;
    const dates = from && to ? saturdays(from, to) : [];
    const res = await Promise.allSettled(dates.map(d => getJson(`./history/${d}.json?h=${Date.now()}`)));
    const list = res.map((r, i) => {
      const w = (r.status === 'fulfilled' && r.value.ok && r.value.body) ? normWeek(r.value.body) : null;
      return (w && w.date && w.rows.length) ? w : { date:dates[i], missing:true, rows:[], inactive:[], favWins:0, favLosses:0 };
    }).sort((a, b) => a.date < b.date ? 1 : -1);
    S.weeks = { status:list.some(w => !w.missing) ? 'ready' : 'error', list };
    if (enrichFromWeeks() && S.view === 'signals') paintView();
    if (S.view === 'saturdays') paintView();
  }
  // Adds the signal horse's saddlecloth number (and a missing winner) from the weekly audit row.
  function enrichFromWeeks(){
    if (S.weeks.status !== 'ready' || S.ledger.status !== 'ready') return false;
    let changed = false;
    S.ledger.list.forEach(s => {
      const w = S.weeks.list.find(x => x.date === s.date && !x.missing); if (!w) return;
      const r = w.rows.find(x => x.race === s.race); if (!r) return;
      if (nameKey(r.fav) === nameKey(s.horse) && s.horseNo === null && r.favNo !== null) { s.horseNo = r.favNo; changed = true; }
      if (s.stateAfter === null && r.after !== null && s.state !== null && r.before === s.state) { s.stateAfter = r.after; changed = true; }
      if (!s.winner && r.winner) { s.winner = r.winner; changed = true; }
      if (s.winnerNo === null && r.winnerNo !== null && s.winner && nameKey(r.winner) === nameKey(s.winner)) { s.winnerNo = r.winnerNo; changed = true; }
    });
    return changed;
  }

  /* ------------------------------------------------------------ replay */
  function fyCompleted(fy, through){
    const end = (parseInt(String(fy).slice(0, 4), 10) + 1) + '-06-30';
    return !!through && end <= String(through);
  }
  async function loadReplay(){
    if (S.replay.status === 'loading' || S.replay.status === 'ready') return;
    S.replay = { status:'loading', data:null, fys:[] };
    let r = null;
    try { r = await getJson(REPLAY_URL); } catch { r = null; }
    if (r && r.ok && Array.isArray(r.body?.rows)) {
      const m = new Map();
      r.body.rows.forEach(row => {
        const [date, race, state, stake, pr, res, pl, fy] = row;
        const f = m.get(fy) || { fy, n:0, w:0, stake:0, pl:0, rows:[] };
        f.n++; if (res === 'W') f.w++; f.stake += num(stake) || 0; f.pl += num(pl) || 0;
        f.rows.push({ date, race, state:num(state), stake:num(stake), price:num(pr), res, pl:num(pl) });
        m.set(fy, f);
      });
      S.replay = { status:'ready', data:r.body, fys:[...m.values()].sort((a, b) => a.fy < b.fy ? -1 : 1) };
    } else S.replay = { status:'error', data:null, fys:[] };
    if (S.view === 'replay') paintView();
  }

  /* ------------------------------------------------------------ hologram */
  const FLOOR = (() => {
    let s = '';
    [154, 160, 168, 179, 194].forEach(y => { s += `<path d="M0 ${y}H340"/>`; });
    for (let x = -140; x <= 480; x += 40) s += `<path d="M${(170 + (x - 170) * 0.3).toFixed(1)} 150L${x} 200"/>`;
    return s;
  })();
  function ensureDefs(){
    if (document.getElementById('hhDefs')) return;
    const H = HORSE;
    const wrap = document.createElement('div');
    wrap.innerHTML = `<svg id="hhDefs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
      <linearGradient id="hhFoil" gradientUnits="userSpaceOnUse" x1="10" y1="0" x2="185" y2="120"><stop offset="0" stop-color="#8FF3FF"/><stop offset=".38" stop-color="#B9A4FF"/><stop offset=".68" stop-color="#FFB0DA"/><stop offset="1" stop-color="#FFE7A3"/></linearGradient>
      <pattern id="hhScan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1.1" fill="#070B1F" fill-opacity=".42"/></pattern>
      <linearGradient id="hhBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8FF3FF" stop-opacity=".28"/><stop offset=".55" stop-color="#B9A4FF" stop-opacity=".07"/><stop offset="1" stop-color="#B9A4FF" stop-opacity="0"/></linearGradient>
      <radialGradient id="hhBaseGlow"><stop offset="0" stop-color="#8FF3FF" stop-opacity=".6"/><stop offset="1" stop-color="#8FF3FF" stop-opacity="0"/></radialGradient>
      <linearGradient id="hhRing" x1="0" x2="1"><stop offset="0" stop-color="#8FF3FF" stop-opacity=".18"/><stop offset=".5" stop-color="#B9A4FF" stop-opacity=".95"/><stop offset="1" stop-color="#FFB0DA" stop-opacity=".18"/></linearGradient>
      <linearGradient id="hhSweep" x1="0" x2="1"><stop offset="0" stop-color="#8FF3FF" stop-opacity="0"/><stop offset=".5" stop-color="#E9FDFF" stop-opacity=".85"/><stop offset="1" stop-color="#8FF3FF" stop-opacity="0"/></linearGradient>
      <linearGradient id="hhPost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF1FF"/><stop offset="1" stop-color="#EEF1FF" stop-opacity=".12"/></linearGradient>
      <g id="hhHorse"><path d="${H.legFar[0]}" opacity=".55"/><path d="${H.legFar[1]}" opacity=".55"/><path d="${H.tail}"/><path d="${H.body}"/><path d="${H.legNear[0]}"/><path d="${H.legNear[1]}"/><path d="${H.knee}"/><path d="${H.jockey}"/><path d="${H.arm}"/><path d="${H.helmet}"/></g>
    </defs></svg>`;
    document.body.appendChild(wrap.firstElementChild);
  }
  function scene(cloth){
    const c = (cloth === null || cloth === undefined || cloth === '') ? '' : String(cloth);
    const fs = c.length >= 3 ? 7.4 : c.length === 2 ? 9.6 : 10.6;
    return `<svg viewBox="0 -18 340 218" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g class="hh-floor" stroke="#8FF3FF" stroke-opacity=".1" stroke-width="1" fill="none">${FLOOR}</g>
      <path class="hh-beam" d="M86 184L28 36H312L254 184Z" fill="url(#hhBeam)"/>
      <ellipse cx="170" cy="184" rx="74" ry="8" fill="url(#hhBaseGlow)"/>
      <ellipse class="hh-ring r1" cx="170" cy="184" rx="104" ry="13" stroke="url(#hhRing)"/>
      <ellipse class="hh-ring r2" cx="170" cy="184" rx="86" ry="10.5" stroke="url(#hhRing)"/>
      <ellipse class="hh-ring r3" cx="170" cy="184" rx="124" ry="15.5" stroke="url(#hhRing)"/>
      <g class="hh-post" transform="translate(268 88)" opacity=".78"><rect x="-1.5" y="0" width="3" height="96" rx="1.5" fill="url(#hhPost)"/><circle cx="0" cy="13" r="9.5" fill="#FFB0DA" fill-opacity=".5" stroke="#EEF1FF" stroke-width="1.6"/><circle cx="0" cy="13" r="3.2" fill="#EEF1FF" fill-opacity=".85"/></g>
      <rect class="hh-sweep" x="40" y="174" width="260" height="8" fill="url(#hhSweep)"/>
      <g class="hh-fig"><g class="hh-glow" transform="translate(70 42) scale(1.04)">
        <use href="#hhHorse" fill="#8FF3FF" opacity=".32" transform="translate(-1.7 0)"/>
        <use href="#hhHorse" fill="#FFB0DA" opacity=".28" transform="translate(1.7 0)"/>
        <use href="#hhHorse" fill="url(#hhFoil)" opacity=".86"/>
        <use href="#hhHorse" fill="url(#hhScan)"/>
        ${c ? `<g transform="translate(89 45)"><path d="M0 0H21L19 15.5H-2Z" fill="#F4F6FF"/><text x="9.6" y="11.8" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#0B1130" font-family="-apple-system,BlinkMacSystemFont,Inter,sans-serif">${esc(c)}</text></g>` : ''}
      </g></g>
      <circle class="hh-spark" cx="118" cy="178" r="1.4" fill="#8FF3FF"/><circle class="hh-spark" cx="206" cy="180" r="1.2" fill="#FFB0DA"/><circle class="hh-spark" cx="160" cy="182" r="1.6" fill="#FFE7A3"/><circle class="hh-spark" cx="232" cy="177" r="1.1" fill="#B9A4FF"/>
    </svg>`;
  }
  // mode: won (our signal won) | fav (favourite won, no signal) | winner (winner known, ghost beaten) | unknown | pending
  function holoBlock({ mode, name, cloth, label, ghost }){
    const nm = name ? displayName(name) : '';
    const hasCloth = cloth !== null && cloth !== undefined && cloth !== '';
    const cls = mode === 'won' ? 'is-won' : (mode === 'unknown' || mode === 'pending') ? 'is-unknown' : '';
    const aria = mode === 'won' ? `Result projection: our signal ${nm}${hasCloth ? `, number ${cloth},` : ''} won`
      : mode === 'fav' ? `Result projection: favourite ${nm}${hasCloth ? `, number ${cloth},` : ''} won`
      : mode === 'winner' ? `Result projection: winner ${nm || 'not recorded'}${hasCloth ? `, number ${cloth}` : ''}${ghost?.name ? `. ${ghost.who} ${displayName(ghost.name)} was beaten` : ''}`
      : mode === 'pending' ? `Result pending for ${nm}` : `Winner not recorded${ghost?.name ? `. Favourite ${displayName(ghost.name)} was beaten` : ''}`;
    const ghostHtml = ghost && ghost.name ? `<span class="hh-ghost">${esc(ghost.who)} <i>${esc(displayName(ghost.name))}</i>${ghost.cloth !== null && ghost.cloth !== undefined ? `<span class="hh-cloth">${esc(ghost.cloth)}</span>` : ''} beaten</span>` : '';
    return `<div class="hh-holo ${cls}" role="img" aria-label="${esc(aria)}">${scene(cls === 'is-unknown' ? null : (hasCloth ? cloth : null))}<div class="hh-holo-cap"><span class="hh-holo-label">${esc(label)}</span>${nm ? `<span class="hh-holo-name">${esc(nm)}${hasCloth ? `<span class="hh-cloth">${esc(cloth)}</span>` : ''}</span>` : ''}</div><span class="hh-holo-foot">Result projection</span></div>${ghostHtml ? `<div class="hh-ghost-row" aria-hidden="true">${ghostHtml}</div>` : ''}`;
  }
  let io = null;
  function observeHolos(scope){
    if (REDUCED.matches || !('IntersectionObserver' in window) || !scope) return;
    if (!io) io = new IntersectionObserver(entries => entries.forEach(en => en.target.classList.toggle('is-live', en.isIntersecting && en.intersectionRatio >= 0.35)), { threshold:[0, 0.35, 0.75] });
    scope.querySelectorAll('.hh-holo').forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------ charts */
  function niceStep(range, target){
    const raw = range / Math.max(1, target), mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
  }
  const CW = 340, CH = 180, CL = 48, CR = 66, CT = 14, CB = 12;
  function curveModel(list){
    const settled = list.filter(s => s.result !== 'PENDING' && s.pl !== null);
    if (!settled.length) return null;
    const pts = [{ k:0, y:0, s:null }];
    let run = 0;
    settled.forEach((s, i) => { run += s.pl; pts.push({ k:i + 1, y:run, s }); });
    const ys = pts.map(p => p.y);
    let lo = Math.min(0, ...ys), hi = Math.max(0, ...ys);
    const span = (hi - lo) || 1; lo -= span * 0.1; hi += span * 0.12;
    const X = k => CL + (CW - CL - CR) * k / (pts.length - 1);
    const Y = v => CT + (CH - CT - CB) * (hi - v) / (hi - lo);
    return { pts, X, Y, lo, hi, run };
  }
  function curveSvg(list){
    const m = curveModel(list);
    if (!m) return '<div class="hh-empty">The curve appears after the first settled signal.</div>';
    const { pts, X, Y, lo, hi } = m;
    const step = niceStep(hi - lo, 4);
    let ticks = '';
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const y = Y(v).toFixed(1);
      ticks += `<path class="${Math.abs(v) < 1e-6 ? 'zero' : 'grid'}" d="M${CL} ${y}H${CW - CR + 8}"/><text class="tick" x="${CL - 8}" y="${(+y + 4).toFixed(1)}" text-anchor="end">${v === 0 ? '$0' : (v > 0 ? '+' : '') + kfmt(v)}</text>`;
    }
    const line = 'M' + pts.map(p => `${X(p.k).toFixed(1)},${Y(p.y).toFixed(1)}`).join('L');
    const area = `${line}L${X(pts.length - 1).toFixed(1)},${Y(0).toFixed(1)}L${X(0).toFixed(1)},${Y(0).toFixed(1)}Z`;
    const last = pts[pts.length - 1];
    const marks = pts.slice(1).map(p => `<circle class="pt ${p.s.result === 'WIN' ? 'win' : 'loss'}" data-k="${p.k}" cx="${X(p.k).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="4.5"/>`).join('');
    const tips = pts.slice(1).map(p => ({
      x:+X(p.k).toFixed(1), y:+Y(p.y).toFixed(1),
      a:`Signal ${p.s.no ?? p.k} · ${fmt(shortFmt, p.s.date)} · ${p.s.race}`,
      b:signed(p.y), c:`${p.s.result === 'WIN' ? 'Won' : 'Lost'} ${signed(p.s.pl)} · ${displayName(p.s.horse)}`
    }));
    return `<svg viewBox="0 0 ${CW} ${CH}" role="img" tabindex="0" aria-label="Running system P/L after each signal, ending at ${esc(signed(last.y))}. Use left and right arrows to step through signals." data-tips="${esc(JSON.stringify(tips))}">
      ${ticks}<path class="area" d="${area}"/><path class="line" d="${line}"/>
      <path class="cross" d="M0 ${CT}V${CH - CB}" visibility="hidden"/>
      ${marks}
      <text class="end" x="${(X(last.k) + 9).toFixed(1)}" y="${(Y(last.y) + 4).toFixed(1)}">${esc(signed(last.y))}</text>
    </svg>`;
  }
  function bindTips(fig, tip, opts){
    const svg = fig?.querySelector('svg'); if (!svg || !tip) return;
    let tips = [];
    try { tips = JSON.parse(svg.dataset.tips || '[]'); } catch { tips = []; }
    if (!tips.length) return;
    let cur = -1;
    const show = k => {
      cur = Math.max(0, Math.min(tips.length - 1, k));
      const t = tips[cur], r = svg.getBoundingClientRect(), fr = fig.getBoundingClientRect();
      tip.replaceChildren();
      const a = document.createElement('div'); a.textContent = t.a;
      const b = document.createElement('strong'); b.textContent = t.b;
      const c = document.createElement('div'); c.textContent = t.c;
      tip.append(a, b, c);
      tip.hidden = false;
      const px = (t.x / opts.w) * r.width + (r.left - fr.left), py = (t.y / opts.h) * r.height + (r.top - fr.top);
      const half = Math.min(110, tip.offsetWidth / 2 || 90);
      tip.style.left = Math.max(half, Math.min(fr.width - half, px)) + 'px';
      tip.style.top = (py - 12) + 'px';
      opts.onShow?.(svg, cur, t);
    };
    const hide = () => { tip.hidden = true; cur = -1; opts.onHide?.(svg); };
    const nearest = e => {
      const r = svg.getBoundingClientRect(), vx = (e.clientX - r.left) / r.width * opts.w;
      let best = 0, d = Infinity;
      tips.forEach((t, i) => { const dd = Math.abs(t.x - vx); if (dd < d) { d = dd; best = i; } });
      return best;
    };
    svg.addEventListener('pointermove', e => show(nearest(e)));
    svg.addEventListener('pointerdown', e => show(nearest(e)));
    svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
    svg.addEventListener('focus', () => show(tips.length - 1));
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur < 0 ? 0 : cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur < 0 ? tips.length - 1 : cur - 1); }
      else if (e.key === 'Escape') hide();
    });
  }
  function bindCurve(){
    const fig = document.getElementById('hhCurve');
    bindTips(fig, document.getElementById('hhTip'), {
      w:CW, h:CH,
      onShow:(svg, k, t) => {
        svg.querySelectorAll('.pt.on').forEach(p => p.classList.remove('on'));
        svg.querySelector(`.pt[data-k="${k + 1}"]`)?.classList.add('on');
        const cross = svg.querySelector('.cross');
        if (cross) { cross.setAttribute('d', `M${t.x} ${CT}V${CH - CB}`); cross.setAttribute('visibility', 'visible'); }
      },
      onHide:svg => { svg.querySelectorAll('.pt.on').forEach(p => p.classList.remove('on')); svg.querySelector('.cross')?.setAttribute('visibility', 'hidden'); }
    });
  }
  const BW = 340, BH = 206, BL = 46, BR = 8, BT = 24, BB = 26;
  function barsSvg(fys, avg){
    if (!fys.length) return '';
    const vals = fys.map(f => f.pl);
    const hi = Math.max(0, ...vals) * 1.14 || 1, lo = Math.min(0, ...vals) * 1.14;
    const Y = v => BT + (BH - BT - BB) * (hi - v) / (hi - lo);
    const band = (BW - BL - BR) / fys.length, bw = Math.min(14, band * 0.7);
    const step = niceStep(hi - lo, 4);
    let g = '';
    for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
      const y = Y(v).toFixed(1);
      g += `<path class="grid" d="M${BL} ${y}H${BW - BR}"/><text class="tick" x="${BL - 7}" y="${(+y + 4).toFixed(1)}" text-anchor="end">${v === 0 ? '$0' : kfmt(v)}</text>`;
    }
    const maxI = vals.indexOf(Math.max(...vals)), minI = vals.indexOf(Math.min(...vals));
    const labels = [];
    const bars = fys.map((f, i) => {
      const cx = BL + band * i + band / 2, x0 = cx - bw / 2, x1 = cx + bw / 2, y0 = Y(0), yv = Y(f.pl);
      const top = Math.min(y0, yv), bot = Math.max(y0, yv), r = Math.min(4, (bot - top) / 2, bw / 2);
      const d = f.pl >= 0
        ? `M${x0.toFixed(1)} ${bot.toFixed(1)}V${(top + r).toFixed(1)}Q${x0.toFixed(1)} ${top.toFixed(1)} ${(x0 + r).toFixed(1)} ${top.toFixed(1)}H${(x1 - r).toFixed(1)}Q${x1.toFixed(1)} ${top.toFixed(1)} ${x1.toFixed(1)} ${(top + r).toFixed(1)}V${bot.toFixed(1)}Z`
        : `M${x0.toFixed(1)} ${top.toFixed(1)}V${(bot - r).toFixed(1)}Q${x0.toFixed(1)} ${bot.toFixed(1)} ${(x0 + r).toFixed(1)} ${bot.toFixed(1)}H${(x1 - r).toFixed(1)}Q${x1.toFixed(1)} ${bot.toFixed(1)} ${x1.toFixed(1)} ${(bot - r).toFixed(1)}V${top.toFixed(1)}Z`;
      if (i === maxI || i === minI) labels.push(`<text class="lab" x="${cx.toFixed(1)}" y="${(f.pl >= 0 ? top - 6 : bot + 13).toFixed(1)}" text-anchor="middle">${kfmt(f.pl)}</text>`);
      return `<path class="bar" data-i="${i}" d="${d}"/>`;
    }).join('');
    const ya = avg !== null ? Y(avg).toFixed(1) : null;
    const avgEl = ya ? `<path class="avg" d="M${BL} ${ya}H${BW - BR}"/>` : '';
    const xl = `<text class="tick" x="${BL}" y="${BH - 6}">${esc(fys[0].fy)}</text><text class="tick" x="${BW - BR}" y="${BH - 6}" text-anchor="end">${esc(fys[fys.length - 1].fy)}</text>`;
    const tips = fys.map((f, i) => ({ x:+(BL + band * i + band / 2).toFixed(1), y:+Math.min(Y(0), Y(f.pl)).toFixed(1), a:`FY ${f.fy}`, b:signed(f.pl), c:`${f.n} bets, ${f.w} won, ROI ${pct(f.stake ? f.pl / f.stake * 100 : null)}` }));
    return `<svg viewBox="0 0 ${BW} ${BH}" role="img" tabindex="0" aria-label="Replay profit per financial year, ${esc(fys[0].fy)} to ${esc(fys[fys.length - 1].fy)}. Use left and right arrows to step through years." data-tips="${esc(JSON.stringify(tips))}">${g}${bars}${avgEl}${labels.join('')}${xl}</svg>`;
  }
  function bindBars(){
    const fig = document.getElementById('hhBars');
    bindTips(fig, document.getElementById('hhBarTip'), {
      w:BW, h:BH,
      onShow:(svg, i) => { svg.querySelectorAll('.bar.on').forEach(b => b.classList.remove('on')); svg.querySelector(`.bar[data-i="${i}"]`)?.classList.add('on'); },
      onHide:svg => svg.querySelectorAll('.bar.on').forEach(b => b.classList.remove('on'))
    });
  }

  /* ------------------------------------------------------------ views */
  function sourceChip(L){
    if (L.source === 'live') return '<span class="hh-source hh-source--live">Live database</span>';
    if (L.source === 'stored') return `<span class="hh-source hh-source--stored">Stored ledger${L.throughDate ? ` to ${esc(fmt(shortFmt, L.throughDate))}` : ''}</span>`;
    return '<span class="hh-source hh-source--none">Unavailable</span>';
  }
  function srTable(list){
    if (!list.length) return '';
    return `<div class="hh-sr"><table><caption>2026 BET NOW signals</caption><thead><tr><th>Signal</th><th>Date</th><th>Race</th><th>Horse</th><th>Stake</th><th>Price</th><th>Result</th><th>System P/L</th></tr></thead><tbody>${list.map((s, i) => `<tr><td>${esc(s.no ?? i + 1)}</td><td>${esc(fmt(dayFmt, s.date))}</td><td>${esc(s.race)} ${esc(s.venue)}</td><td>${esc(displayName(s.horse))}</td><td>${esc(cash(s.stake))}</td><td>${esc(price(s.price))}</td><td>${esc(s.result)}</td><td>${esc(s.pl === null ? 'Pending' : signed(s.pl))}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function heroHtml(){
    const L = S.ledger;
    const head = `<div class="hh-head"><h2 class="hh-title">2026 system ledger</h2>${L.status === 'loading' && !L.list.length ? '<span class="hh-source">Loading…</span>' : sourceChip(L)}</div>`;
    if ((L.status === 'idle' || L.status === 'loading') && !L.list.length) {
      return `${head}<div class="hh-figure"><span class="hh-figure-value" style="opacity:.35">$—</span><span class="hh-figure-label">Loading the immutable BET NOW ledger…</span></div>`;
    }
    if (L.status === 'error') {
      return `${head}<div class="hh-figure"><span class="hh-figure-value" style="font-size:38px">Unavailable</span><span class="hh-figure-label">No figures are shown rather than showing zeros.</span></div>${L.notices.map(n => `<p class="hh-notice${n.bad ? ' hh-notice--bad' : ''}">${esc(n.text)}</p>`).join('')}<div style="margin-top:12px"><button type="button" class="hh-btn" data-hh-refresh>Refresh ledger</button></div>`;
    }
    const t = totals(L.list);
    const form = L.list.map((s, i) => `<li class="${s.result === 'WIN' ? 'win' : s.result === 'LOSS' ? 'loss' : 'pending'}" title="Signal ${esc(s.no ?? i + 1)}: ${esc(s.race)} ${esc(fmt(shortFmt, s.date))}">${s.result === 'WIN' ? 'W' : s.result === 'LOSS' ? 'L' : '…'}</li>`).join('');
    return `${head}
      <div class="hh-figure"><span class="hh-figure-value">${esc(signed(t.pl))}</span><span class="hh-figure-label">System P/L from ${t.n} BET NOW signal${t.n === 1 ? '' : 's'}${t.pending ? ` (${t.pending} still pending)` : ''}. Each one counts at its instructed stake and price, whether or not you placed it.</span></div>
      <figure class="hh-curve" id="hhCurve">${curveSvg(L.list)}<div class="hh-tip" id="hhTip" hidden></div></figure>
      <ol class="hh-form" aria-label="Signal results, oldest first">${form}</ol>
      <div class="hh-form-cap">Oldest to newest. W means the signal won, L means it lost.</div>
      <dl class="hh-facts"><div><dt>Won</dt><dd>${t.wins}</dd></div><div><dt>Lost</dt><dd>${t.losses}</dd></div><div><dt>Turnover</dt><dd>${esc(cash(t.turnover))}</dd></div><div><dt>ROI</dt><dd>${esc(pct(t.roi))}</dd></div></dl>
      <div class="hh-cash"><span>Bookmaker cash is audited separately and never changes the system record: <strong>${t.cashN} confirmed bet${t.cashN === 1 ? '' : 's'}</strong>${t.cashN ? `, ${esc(cash(t.cashStake))} staked, <strong>${esc(signed(t.cashPl))}</strong>${t.cashMissing ? ` (cash P/L missing for ${t.cashMissing})` : ''}` : ''}.</span></div>
      ${t.plMissing ? `<p class="hh-notice hh-notice--bad">${t.plMissing} settled signal${t.plMissing === 1 ? ' has' : 's have'} no recorded stake or P/L, so the totals above leave ${t.plMissing === 1 ? 'it' : 'them'} out.</p>` : ''}
      ${L.notices.map(n => `<p class="hh-notice${n.bad ? ' hh-notice--bad' : ''}">${esc(n.text)}</p>`).join('')}
      <div style="margin-top:12px"><button type="button" class="hh-btn" data-hh-refresh ${L.status === 'loading' ? 'disabled' : ''}>${L.status === 'loading' ? 'Refreshing…' : 'Refresh ledger'}</button></div>
      ${srTable(L.list)}`;
  }
  function evidenceLabel(s){
    const e = up(s.evidence);
    if (e === 'BET_LOCKED_AND_SENT_BET_NOW_PUSH') return 'Locked and BET NOW push sent';
    if (e === 'BET_LOCKED_ONLY') return 'Locked event, no push recorded';
    if (s.srcs?.includes('db')) return 'Immutable database event';
    return 'Immutable signal';
  }
  function cashTag(s){
    if (s.exec === 'CONFIRMED' && (s.accStake || 0) > 0) return `<li class="cash-ok">Cash confirmed: ${esc(cash(s.accStake))} at ${esc(price(s.accPrice))}${s.cashPl !== null ? `, ${esc(signed(s.cashPl))}` : ''}</li>`;
    if (s.exec === 'NOT_PLACED') return '<li class="cash-no">Not placed by you</li>';
    return '<li class="cash-no">Cash not confirmed</li>';
  }
  function ticket(s, i){
    const n = s.no ?? i + 1, res = s.result;
    const resLabel = res === 'WIN' ? 'Won' : res === 'LOSS' ? 'Lost' : 'Pending';
    const after = s.stateAfter ?? (res === 'WIN' ? 0 : (res === 'LOSS' && s.state !== null) ? s.state + 1 : null);
    const holo = res === 'WIN'
      ? holoBlock({ mode:'won', name:s.winner || s.horse, cloth:s.winnerNo ?? s.horseNo, label:'Our signal won' })
      : res === 'LOSS'
        ? (s.winner
          ? holoBlock({ mode:'winner', name:s.winner, cloth:s.winnerNo, label:'Winner', ghost:{ who:'Our signal', name:s.horse, cloth:s.horseNo } })
          : holoBlock({ mode:'unknown', name:'', cloth:null, label:'Winner not recorded', ghost:{ who:'Our signal', name:s.horse, cloth:s.horseNo } }))
        : holoBlock({ mode:'pending', name:s.horse, cloth:s.horseNo, label:'Result pending' });
    const tags = [];
    if (s.state !== null) tags.push(`<li>State ${esc(s.state)}${after !== null ? ` → ${esc(after)}` : ''}</li>`);
    tags.push(`<li>${esc(evidenceLabel(s))}</li>`);
    if (s.contradictory) tags.push('<li>Later NO BET alert ignored</li>');
    tags.push(cashTag(s));
    if (s.srcs && s.srcs.length === 1 && s.srcs[0] === 'db') tags.push('<li class="cash-ok">Live database</li>');
    const pl = s.pl;
    return `<article class="hh-ticket hh-foil" aria-label="Signal ${esc(n)}, ${esc(s.race)}, ${esc(fmt(dayFmt, s.date))}, ${resLabel}">
      <header class="hh-ticket-head"><div class="hh-serial">Signal ${esc(n)}&ensp;<time datetime="${esc(s.date)}">${esc(fmt(dayFmt, s.date))}</time></div><span class="hh-result hh-result--${res === 'WIN' ? 'win' : res === 'LOSS' ? 'loss' : 'pending'}">${resLabel}</span><div class="hh-race"><span class="hh-race-code">${esc(s.race)}</span><span class="hh-race-venue">${esc(s.venue)}</span></div></header>
      ${holo}
      <div class="hh-perf" aria-hidden="true"></div>
      <dl class="hh-ticket-grid"><div><dt>Stake</dt><dd>${esc(cash(s.stake))}</dd></div><div><dt>Price</dt><dd>${esc(price(s.price))}</dd></div><div><dt>System P/L</dt><dd class="${pl > 0 ? 'pos' : pl < 0 ? 'neg' : ''}">${pl === null ? 'Pending' : esc(signed(pl))}</dd></div></dl>
      <ul class="hh-tags">${tags.join('')}</ul>
    </article>`;
  }
  function signalsView(){
    const L = S.ledger;
    if ((L.status === 'idle' || L.status === 'loading') && !L.list.length) return '<div class="hh-empty">Loading BET NOW signals…</div>';
    if (L.status === 'error') return '<div class="hh-empty">No signals can be shown because the ledger is unavailable. Nothing is substituted.</div>';
    if (!L.list.length) return '<div class="hh-empty">No BET NOW signals have been recorded for 2026 yet.</div>';
    return `<p class="hh-intro">Each ticket projects the recorded winner of that race as a hologram. It isn't a replay: running positions and margins aren't recorded, so only the recorded result is shown.</p>
      <div class="hh-tickets">${L.list.map((s, i) => ({ s, i })).reverse().map(({ s, i }) => ticket(s, i)).join('')}</div>`;
  }
  const ledgerSignal = (date, race) => S.ledger.status === 'ready' ? S.ledger.list.find(s => s.date === date && s.race === race) || null : null;
  const isSignal = (w, r) => r.signal || !!ledgerSignal(w.date, r.race);
  function cell(w, r){
    const o = r.outcome === 'WIN' ? 'win' : r.outcome === 'LOSS' ? 'loss' : '';
    const sg = isSignal(w, r);
    const label = `${r.race}: favourite ${r.outcome === 'WIN' ? 'won' : r.outcome === 'LOSS' ? 'lost' : 'result unknown'}, state ${r.before ?? 'unknown'} to ${r.after ?? 'unknown'}${sg ? ', BET NOW signal' : ''}`;
    return `<button type="button" class="hh-cell ${o}${sg ? ' signal' : ''}" data-hh-cell="${esc(w.date)}|${esc(r.race)}" aria-label="${esc(label)}"><b>${r.outcome === 'WIN' ? 'W' : r.outcome === 'LOSS' ? 'L' : '?'}</b><span>${esc(r.before ?? '–')}→${esc(r.after ?? '–')}</span></button>`;
  }
  function boardRow(w, region){
    const p = PREFIX[region], rows = w.rows.filter(r => r.race.startsWith(p));
    const venue = rows.find(r => r.venue)?.venue || '';
    const off = w.inactive.find(x => String(x?.region || '').toLowerCase() === region.toLowerCase() || String(x?.codes || '').startsWith(p));
    if (!rows.length) return `<div class="hh-row"><div class="hh-row-label">${region}<small>${off ? 'No meeting' : '—'}</small></div><div class="hh-row-off">${esc(off?.reason || 'Not recorded in this audit.')}</div></div>`;
    const cells = [1, 2, 3, 4, 5, 6, 7].map(k => { const r = rows.find(x => x.race === p + k); return r ? cell(w, r) : '<div class="hh-cell" aria-hidden="true"><span>—</span></div>'; }).join('');
    return `<div class="hh-row"><div class="hh-row-label">${region}<small>${esc(venue)}</small></div>${cells}</div>`;
  }
  function weekBlock(w){
    if (w.missing) return `<section class="hh-panel hh-week hh-week--missing"><div class="hh-week-head" style="cursor:default"><span class="hh-week-date">${esc(fmt(weekFmt, w.date))}</span><span class="hh-week-sub">No weekly audit file in the app for this Saturday, so nothing is shown.</span></div></section>`;
    const firstReal = S.weeks.list.find(x => !x.missing);
    const open = S.openWeeks.has(w.date) || (!S.weeksTouched && firstReal && firstReal.date === w.date);
    const fromLedger = S.ledger.status === 'ready' ? S.ledger.list.filter(s => s.date === w.date) : null;
    const sigs = fromLedger && fromLedger.length ? fromLedger : w.rows.filter(r => r.signal);
    const plVals = fromLedger && fromLedger.length ? sigs.map(s => s.result === 'PENDING' ? 0 : s.pl) : sigs.map(r => r.sigPl);
    const plKnown = plVals.every(v => v !== null && v !== undefined);
    const sigPl = plKnown ? plVals.reduce((a, v) => a + v, 0) : null;
    const off = w.inactive.map(x => x?.region).filter(Boolean);
    return `<section class="hh-panel hh-week">
      <button type="button" class="hh-week-head" data-hh-week="${esc(w.date)}" aria-expanded="${open}" aria-controls="hhBoard-${esc(w.date)}">
        <span class="hh-week-date">${esc(fmt(weekFmt, w.date))}</span>
        <span class="hh-week-sub">${w.favWins} favourite win${w.favWins === 1 ? '' : 's'}, ${w.favLosses} loss${w.favLosses === 1 ? '' : 'es'}${off.length ? `. ${esc(off.join(', '))}: no meeting` : ''}</span>
        <span class="hh-week-pl ${sigs.length && sigPl !== null ? (sigPl > 0 ? 'pos' : sigPl < 0 ? 'neg' : '') : ''}">${sigs.length ? (sigPl !== null ? esc(signed(sigPl)) : 'P/L incomplete') : 'No signals'}<small>${sigs.length ? `${sigs.length} BET NOW` : 'none recorded'}</small></span>
      </button>
      <div class="hh-board" id="hhBoard-${esc(w.date)}" ${open ? '' : 'hidden'}>${['Perth', 'Sydney', 'Melbourne'].map(rg => boardRow(w, rg)).join('')}</div>
    </section>`;
  }
  function saturdaysView(){
    const W = S.weeks;
    if (W.status === 'idle' || W.status === 'loading') return '<div class="hh-empty">Loading Saturday audits…</div>';
    if (W.status === 'error' || !W.list.length) return '<div class="hh-empty">The weekly audit files couldn\'t be loaded. Nothing is substituted. <button type="button" class="hh-btn" data-hh-weeks-retry style="margin-top:10px">Try again</button></div>';
    return `<p class="hh-intro">All 21 race slots are tracked every Saturday. Each cell shows whether the favourite won (W) or lost (L) and how that slot's state moved. Tap a cell for its result projection.</p>
      <div class="hh-key" aria-hidden="true"><span><i class="k-win"></i>Favourite won</span><span><i class="k-loss"></i>Favourite lost</span><span><i class="k-sig"></i>BET NOW signal</span></div>
      <div class="hh-weeks">${W.list.map(weekBlock).join('')}</div>`;
  }
  function fyBlock(f, through){
    const partial = !fyCompleted(f.fy, through);
    return `<details class="hh-fy" data-fy="${esc(f.fy)}"><summary><strong>${esc(f.fy)}${partial ? ' (pre-live replay, partial)' : ''}</strong><span>${f.n} bets, ${f.w} won, ROI ${esc(pct(f.stake ? f.pl / f.stake * 100 : null))}</span><em class="${f.pl < 0 ? 'neg' : ''}">${esc(signed(f.pl))}</em></summary><div class="hh-fy-body"></div></details>`;
  }
  function fillFy(d){
    const body = d.querySelector('.hh-fy-body'); if (!body || body.childElementCount) return;
    const f = S.replay.fys.find(x => x.fy === d.dataset.fy); if (!f) return;
    body.innerHTML = `<div class="hh-scroll"><table class="hh-rows"><thead><tr><th>Date</th><th>Race</th><th class="r">State</th><th class="r">Stake</th><th class="r">Price</th><th>Result</th><th class="r">P/L</th></tr></thead><tbody>${f.rows.map(r => `<tr><td>${esc(fmt(shortFmt, r.date))}</td><td>${esc(r.race)}</td><td class="r">${esc(r.state ?? '—')}</td><td class="r">${esc(cash(r.stake))}</td><td class="r">${esc(price(r.price))}</td><td class="${r.res === 'W' ? 'w' : 'l'}">${r.res === 'W' ? 'Won' : 'Lost'}</td><td class="r">${esc(signed(r.pl))}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function partialNote(part){
    const season = (window.__MITCHELL_BASE_DATA || {}).season || {};
    const mb = num(season.modelBets), mp = num(season.modelProfitAud);
    return part.map(f => {
      if (mb === null || mp === null || (mb === f.n && Math.abs(mp - f.pl) < 1)) return '';
      const last = f.rows.map(r => r.date).sort().pop();
      return `<p class="hh-notice">The replay file's ${esc(f.fy)} rows stop at ${esc(fmt(shortFmt, last))} (${f.n} bets, ${esc(signed(f.pl))}), but current.json records ${mb} model bets${season.modelThrough ? ` to ${esc(fmt(shortFmt, season.modelThrough))}` : ''} (${esc(signed(mp))}). Treat the partial year as unverified.</p>`;
    }).join('');
  }
  function replayView(){
    const R = S.replay;
    if (R.status === 'error') return '<div class="hh-empty">The V11 replay file couldn\'t be loaded.</div>';
    if (R.status !== 'ready') return '<div class="hh-empty">Loading the V11 replay…</div>';
    const through = R.data?.benchmarkThrough || null;
    const done = R.fys.filter(f => fyCompleted(f.fy, through)), part = R.fys.filter(f => !fyCompleted(f.fy, through));
    const tot = done.reduce((a, f) => ({ n:a.n + f.n, pl:a.pl + f.pl, stake:a.stake + f.stake }), { n:0, pl:0, stake:0 });
    const avg = done.length ? tot.pl / done.length : null;
    const bm = R.data?.benchmark || {};
    const matches = num(bm.bets) === tot.n && Math.abs((num(bm.profitAud) || 0) - tot.pl) < 1 && Math.abs((num(bm.turnoverAud) || 0) - tot.stake) < 1;
    return `<section class="hh-panel">
        <div class="hh-head"><h2 class="hh-title">V11 historical replay</h2><span class="hh-source">Model research</span></div>
        <p class="hh-intro" style="margin:8px 0 0">The frozen V11 rules replayed over ${done.length} completed financial years. This is research history, not live BET NOW signals or bookmaker cash.</p>
        <dl class="hh-facts"><div><dt>Bets</dt><dd>${tot.n}</dd></div><div><dt>Average per FY</dt><dd>${esc(kfmt(avg))}</dd></div><div><dt>ROI</dt><dd>${esc(pct(tot.stake ? tot.pl / tot.stake * 100 : null))}</dd></div><div><dt>Losing FYs</dt><dd>${done.filter(f => f.pl < 0).length}</dd></div></dl>
        <figure class="hh-bars" id="hhBars">${barsSvg(done, avg)}<div class="hh-tip" id="hhBarTip" hidden></div><figcaption class="hh-legend"><span><i class="k-bar"></i>Replay profit per financial year</span><span><i class="k-avg"></i>Average ${esc(kfmt(avg))} per FY</span></figcaption></figure>
        ${matches ? '' : '<p class="hh-notice hh-notice--bad">These replay rows don\'t add up to the frozen benchmark recorded in the same file. Treat the chart as unverified.</p>'}
      </section>
      <div class="hh-fys">${[...done].reverse().map(f => fyBlock(f, through)).join('')}${part.map(f => fyBlock(f, through)).join('')}</div>
      ${partialNote(part)}
      <p class="hh-foot">Frozen benchmark through ${esc(fmt(dayFmt, through))}: ${esc(bm.bets ?? '—')} bets, ${esc(cash(num(bm.turnoverAud)))} turnover, ${esc(signed(num(bm.profitAud)))} profit. Source: ${esc(R.data?.source || 'V11 research workbook')}.</p>`;
  }

  /* ------------------------------------------------------------ race sheet */
  let sheetReturn = null;
  function closeSheet(){
    document.querySelector('.hh-sheet')?.remove();
    document.documentElement.classList.remove('hh-lock');
    document.removeEventListener('keydown', sheetKeys);
    if (sheetReturn && document.contains(sheetReturn)) sheetReturn.focus();
    sheetReturn = null;
  }
  function sheetKeys(e){ if (e.key === 'Escape') closeSheet(); }
  function openSheet(date, race, from){
    const w = S.weeks.list.find(x => x.date === date && !x.missing), r = w?.rows.find(x => x.race === race);
    if (!r) return;
    const sig = ledgerSignal(date, race);
    const isSig = r.signal || !!sig;
    const winName = r.winner || sig?.winner || '';
    const winNo = r.winnerNo ?? sig?.winnerNo ?? null;
    let holo, sigText = 'No BET NOW signal';
    if (isSig) {
      const sHorse = sig?.horse || r.sigHorse || '';
      const sOut = sig ? sig.result : r.sigOutcome;
      // A saddlecloth number is attached to the signal horse only when the audit row proves it.
      const sNo = sHorse && nameKey(sHorse) === nameKey(r.fav) ? r.favNo : (sHorse && winName && nameKey(sHorse) === nameKey(winName) ? winNo : null);
      if (sOut === 'WIN') holo = holoBlock({ mode:'won', name:sHorse, cloth:sNo, label:'Our signal won' });
      else if (sOut === 'LOSS') holo = winName
        ? holoBlock({ mode:'winner', name:winName, cloth:winNo, label:'Winner', ghost:{ who:'Our signal', name:sHorse, cloth:sNo } })
        : holoBlock({ mode:'unknown', name:'', cloth:null, label:'Winner not recorded in this audit', ghost:{ who:'Our signal', name:sHorse, cloth:sNo } });
      else holo = holoBlock({ mode:'pending', name:sHorse, cloth:sNo, label:'Result pending' });
      const sStake = sig?.stake ?? r.sigStake, sPrice = sig?.price ?? r.sigPrice, sPl = sig ? sig.pl : r.sigPl;
      sigText = `${displayName(sHorse) || 'Signal horse not recorded'}, ${cash(sStake)} at ${price(sPrice)}: ${sOut === 'WIN' ? 'won' : sOut === 'LOSS' ? 'lost' : 'pending'}${sPl !== null && sPl !== undefined ? ' ' + signed(sPl) : ''}`;
    } else if (r.outcome === 'WIN') holo = holoBlock({ mode:'fav', name:r.fav, cloth:r.favNo, label:'Favourite won' });
    else if (r.outcome === 'LOSS' && winName) holo = holoBlock({ mode:'winner', name:winName, cloth:winNo, label:'Winner', ghost:{ who:'Favourite', name:r.fav, cloth:r.favNo } });
    else holo = holoBlock({ mode:'unknown', name:'', cloth:null, label:r.outcome === 'LOSS' ? 'Winner not recorded in this audit' : 'Result not recorded', ghost:r.outcome === 'LOSS' ? { who:'Favourite', name:r.fav, cloth:r.favNo } : null });
    const evid = up(r.evidence) === 'UNVERIFIED' ? 'Archived favourite record, not independently checked against official SP' : (r.evidence || 'Weekly audit file');
    const el = document.createElement('div');
    el.className = 'hh-sheet';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'hhSheetTitle');
    el.innerHTML = `<div class="hh-sheet-card">
      <div class="hh-grab" aria-hidden="true"></div>
      <div class="hh-sheet-head"><div><div class="hh-serial">${esc(fmt(dayFmt, date))}</div><div class="hh-race"><span class="hh-race-code" id="hhSheetTitle">${esc(r.race)}</span><span class="hh-race-venue">${esc(r.venue)}</span></div></div><button type="button" class="hh-close" aria-label="Close">×</button></div>
      ${holo}
      <dl class="hh-detail">
        <div><dt>Favourite</dt><dd>${esc(displayName(r.fav) || '—')}${r.favNo !== null ? ` (${esc(r.favNo)})` : ''}</dd></div>
        <div><dt>Favourite result</dt><dd>${r.outcome === 'WIN' ? 'Won' : r.outcome === 'LOSS' ? 'Lost' : 'Not recorded'}</dd></div>
        <div><dt>State</dt><dd>${esc(r.before ?? '—')} → ${esc(r.after ?? '—')}</dd></div>
        <div><dt>Winner</dt><dd>${winName ? `${esc(displayName(winName))}${winNo !== null ? ` (${esc(winNo)})` : ''}` : (r.outcome === 'WIN' ? esc(displayName(r.fav)) : 'Not recorded')}</dd></div>
        <div class="wide"><dt>System</dt><dd>${esc(sigText)}</dd></div>
        <div class="wide"><dt>Evidence</dt><dd>${esc(evid)}</dd></div>
      </dl>
      <p class="hh-sheet-note">The projection shows only the recorded result. Running positions and margins aren't recorded, so the race itself isn't reconstructed.${r.url && /^https:\/\//.test(r.url) ? ` <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Open the result page</a>` : ''}</p>
    </div>`;
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('.hh-close')) closeSheet(); });
    closeSheet();
    sheetReturn = from || null;
    document.body.appendChild(el);
    document.documentElement.classList.add('hh-lock');
    document.addEventListener('keydown', sheetKeys);
    if (!REDUCED.matches) el.querySelector('.hh-holo')?.classList.add('is-live');
    el.querySelector('.hh-close')?.focus();
  }

  /* ------------------------------------------------------------ paint */
  const isHistoryActive = () => !!document.querySelector('[data-premium-tab="history"].active');
  function mountEl(){ return document.getElementById('holoHistoryMount') || (isHistoryActive() ? document.getElementById('premiumPage') : null); }
  function ensureRoot(){
    const m = mountEl(); if (!m) return null;
    let root = m.querySelector('#holoHistory');
    if (root) return root;
    m.innerHTML = `<div class="hh" id="holoHistory">
      <section class="hh-panel hh-foil hh-hero" id="hhHero" aria-live="polite"></section>
      <div class="hh-seg" role="tablist" aria-label="History views" id="hhSeg"></div>
      <div id="hhView" role="tabpanel"></div>
      <p class="hh-foot">Sources: the live ledger is the immutable BET_LOCKED events and sent BET NOW pushes, deduped by race; the stored ledger is history/2026-bet-now-signals.json; Saturdays come from the weekly audit files; the replay is frozen V11 research. History never changes what you bet today. <a href="./stats.html">Open the full stats page</a>.</p>
    </div>`;
    root = m.querySelector('#holoHistory');
    bindRoot(root);
    return root;
  }
  function paintHero(){ if (!ensureRoot()) return; const el = document.getElementById('hhHero'); if (el) { el.innerHTML = heroHtml(); bindCurve(); } }
  function paintSeg(){
    const el = document.getElementById('hhSeg'); if (!el) return;
    el.innerHTML = [['signals', 'Signals'], ['saturdays', 'Saturdays'], ['replay', '18-yr replay']].map(([k, l]) => `<button type="button" role="tab" id="hhTab-${k}" aria-controls="hhView" aria-selected="${S.view === k}" tabindex="${S.view === k ? 0 : -1}" data-hh-view="${k}">${l}</button>`).join('');
  }
  function paintView(){
    if (!ensureRoot()) return;
    const el = document.getElementById('hhView'); if (!el) return;
    if (io) io.disconnect();
    el.setAttribute('aria-labelledby', 'hhTab-' + S.view);
    if (S.view === 'saturdays') { el.innerHTML = saturdaysView(); if (S.weeks.status === 'idle') loadWeeks(); }
    else if (S.view === 'replay') { el.innerHTML = replayView(); if (S.replay.status === 'idle') loadReplay(); else bindBars(); }
    else el.innerHTML = signalsView();
    observeHolos(el);
  }
  function paintAll(){ if (!ensureRoot()) return; paintHero(); paintSeg(); paintView(); }
  function setView(v){
    if (!['signals', 'saturdays', 'replay'].includes(v) || v === S.view) return;
    S.view = v; paintSeg(); paintView();
    document.getElementById('hhTab-' + v)?.focus({ preventScroll:true });
  }
  function bindRoot(root){
    root.addEventListener('click', e => {
      const v = e.target.closest('[data-hh-view]'); if (v) { setView(v.dataset.hhView); return; }
      const wk = e.target.closest('[data-hh-week]');
      if (wk) {
        S.weeksTouched = true;
        const d = wk.dataset.hhWeek, board = document.getElementById('hhBoard-' + d), open = wk.getAttribute('aria-expanded') !== 'true';
        wk.setAttribute('aria-expanded', String(open));
        if (board) board.hidden = !open;
        S.weeks.list.forEach(w => { const b = document.getElementById('hhBoard-' + w.date); if (b && !b.hidden) S.openWeeks.add(w.date); else S.openWeeks.delete(w.date); });
        return;
      }
      const c = e.target.closest('[data-hh-cell]'); if (c) { const [d, r] = c.dataset.hhCell.split('|'); openSheet(d, r, c); return; }
      if (e.target.closest('[data-hh-refresh]')) { loadLedger(true); return; }
      if (e.target.closest('[data-hh-weeks-retry]')) { S.weeks = { status:'idle', list:[] }; loadWeeks(); }
    });
    root.addEventListener('keydown', e => {
      const tab = e.target.closest?.('[data-hh-view]'); if (!tab) return;
      const order = ['signals', 'saturdays', 'replay'], i = order.indexOf(S.view);
      if (e.key === 'ArrowRight') { e.preventDefault(); setView(order[(i + 1) % 3]); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setView(order[(i + 2) % 3]); }
    });
    root.addEventListener('toggle', e => { const d = e.target; if (d?.matches?.('details.hh-fy') && d.open) fillFy(d); }, true);
  }
  function onHistoryOpen(){
    if (!isHistoryActive()) return;
    ensureDefs();
    paintAll();
    loadLedger(S.ledger.status === 'ready' && Date.now() - (S.ledger.loadedAt || 0) > 120000);
    loadWeeks();
  }
  function start(){
    document.addEventListener('click', e => {
      if (e.target.closest?.('[data-premium-tab="history"]') || e.target.closest?.('[data-tab-jump="history"]')) setTimeout(onHistoryOpen, 0);
    });
    window.addEventListener('mitchell-refresh-live', () => { if (isHistoryActive()) loadLedger(true); });
    if (isHistoryActive()) onHistoryOpen();
  }
  window.MITCHELL_HOLO_HISTORY = { refresh:() => loadLedger(true) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
