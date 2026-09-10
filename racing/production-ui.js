(() => {
  'use strict';

  const BUILD = '1.9.0';
  const REFRESH_MS = 60000;
  const FILES = {
    au: './current.json',
    auStats: './stats.json',
    hk: './hong-kong.json',
    hkStats: './hong-kong-stats.json'
  };

  const state = {
    data: { au:null, auStats:null, hk:null, hkStats:null },
    health: { au:null, preflight:null, hk:null },
    loadedAt:null,
    error:null,
    busy:false,
    internalAu:false,
    internalHk:false
  };

  const $ = id => document.getElementById(id);
  const num = value => Number.isFinite(Number(value)) ? Number(value) : null;
  const money = value => {
    const n = num(value);
    if (n === null) return 'â€”';
    const abs = Math.abs(n);
    const sign = n < 0 ? 'âˆ’' : '';
    if (abs >= 1000000) return `${sign}A$${(abs/1000000).toFixed(abs >= 10000000 ? 1 : 2)}m`;
    if (abs >= 1000) return `${sign}A$${(abs/1000).toFixed(abs >= 100000 ? 0 : 1)}k`;
    return `${sign}A$${Math.round(abs).toLocaleString('en-AU')}`;
  };
  const pct = (value, alreadyPct = false) => {
    const n = num(value);
    return n === null ? 'â€”' : `${(alreadyPct ? n : n * 100).toFixed(1)}%`;
  };
  const one = value => {
    const n = num(value);
    return n === null ? 'â€”' : n.toFixed(1);
  };
  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  function perthToday() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone:'Australia/Perth', year:'numeric', month:'2-digit', day:'2-digit'
    }).format(new Date());
  }

  function prettyDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return 'date unavailable';
    const d = new Date(`${value}T12:00:00+08:00`);
    return new Intl.DateTimeFormat('en-AU', {
      timeZone:'Australia/Perth', weekday:'short', day:'numeric', month:'short', year:'numeric'
    }).format(d);
  }

  function timestamp(value) {
    const d = new Date(value || Date.now());
    if (Number.isNaN(d.getTime())) return 'time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      timeZone:'Australia/Perth', hour:'numeric', minute:'2-digit', second:'2-digit'
    }).format(d) + ' Perth';
  }

  function cardDate(data) {
    const track = Array.isArray(data?.stateTracklist) ? data.stateTracklist : [];
    const watch = Array.isArray(data?.watchlist) ? data.watchlist : [];
    const meetings = Array.isArray(data?.meetings) ? data.meetings : [];
    return String(track[0]?.date || watch[0]?.date || meetings[0]?.date || '').trim() || null;
  }

  function dateMode(date) {
    const today = perthToday();
    if (!date) return { mode:'blocked', today, label:'CARD DATE MISSING', tone:'bad' };
    if (date < today) return { mode:'stale', today, label:'OLD CARD Â· NO BET', tone:'bad' };
    if (date > today) return { mode:'future', today, label:'NEXT CARD Â· WAIT', tone:'warn' };
    return { mode:'today', today, label:'RACE DAY', tone:'good' };
  }

  async function getJson(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const join = path.includes('?') ? '&' : '?';
      const response = await fetch(`${path}${join}production=${encodeURIComponent(BUILD)}-${Date.now()}`, {
        cache:'no-store', signal:controller.signal
      });
      if (!response.ok) throw new Error(`${path} HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function ensureShell() {
    let shell = $('productionCommandCentre');
    if (shell) return shell;
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher) return null;
    shell = document.createElement('section');
    shell.id = 'productionCommandCentre';
    shell.className = 'prod-centre';
    shell.setAttribute('aria-live','polite');
    shell.innerHTML = '<div class="prod-loading">Checking both racing systemsâ€¦</div>';
    switcher.insertAdjacentElement('beforebegin', shell);
    return shell;
  }

  function auStatus() {
    const data = state.data.au;
    const date = cardDate(data);
    const dm = dateMode(date);
    const p = state.health.preflight || window.__MITCHELL_V11_PREFLIGHT || null;
    const live = state.health.au || null;
    const preflightAge = p?.checkedAt ? Date.now() - Date.parse(p.checkedAt) : Infinity;
    const preflightPass = p?.status === 'PASS' && p?.safe === true && preflightAge >= 0 && preflightAge <= 600000;
    const liveOk = live?.status === 'OK';

    if (dm.mode === 'stale') return {
      tone:'bad', status:'NO BET', badge:'CARD OUT OF DATE',
      reason:`Last loaded Australia card is ${prettyDate(date)}. Today is ${prettyDate(dm.today)}. It cannot be used as a live betting card.`, date, mode:dm.mode
    };
    if (dm.mode === 'blocked') return {
      tone:'bad', status:'NO BET', badge:'DATA BLOCKED',
      reason:'The Australia card date cannot be verified. Fail closed.', date, mode:dm.mode
    };
    if (dm.mode === 'future') return {
      tone:'warn', status:'WAIT', badge:'NEXT CARD LOADED',
      reason:`The next Australia card is ${prettyDate(date)}. Do nothing until that date and a fresh preflight passes.`, date, mode:dm.mode
    };
    if (!preflightPass) return {
      tone:'bad', status:'NO BET', badge:'PREFLIGHT NOT PASSED',
      reason:p?.errors?.[0] || 'The 21-stream state/evidence preflight is not a fresh PASS.', date, mode:dm.mode
    };
    if (!liveOk) return {
      tone:'warn', status:'WAIT', badge:'RACE DAY Â· CHECKING LIVE',
      reason:live?.reason || 'The current live favourite/price engine is checking.', date, mode:dm.mode
    };
    return {
      tone:'good', status:'LIVE', badge:'RACE DAY Â· VERIFIED',
      reason:'Current card date, V11 preflight and live engine are verified. Still only bet when the large AU action box itself turns green and says BET NOW.', date, mode:dm.mode
    };
  }

  function hkApproved() {
    return state.data.hkStats?.decision?.productionApproved === true;
  }

  function hkStatus() {
    const data = state.data.hk;
    const stats = state.data.hkStats;
    const meetingDate = String(data?.meeting?.date || '').trim() || null;
    const dm = dateMode(meetingDate);
    const approved = stats?.decision?.productionApproved === true;
    const liveFeed = data?.strategy?.liveFeed || {};
    const verifiedAt = Date.parse(liveFeed.lastVerifiedAt || liveFeed.verifiedAt || '');
    const fresh = Number.isFinite(verifiedAt) && Date.now() - verifiedAt >= 0 && Date.now() - verifiedAt <= 30000;
    const feedReady = liveFeed.modelClassificationVerified === true &&
      liveFeed.calibratedModelEvVerified === true &&
      liveFeed.executableQuotesVerified === true &&
      liveFeed.capacityVerified === true &&
      liveFeed.yearBetCountVerified === true &&
      liveFeed.todayRiskVerified === true && fresh;

    if (!approved) return {
      tone:'warn', status:'WAIT', badge:'SHADOW Â· NOT LIVE BETTING',
      reason:'HK OPTIMAL V4 is still a research/forward-validation candidate. Production approval is false, so the app must not issue a real-money BET NOW.', date:meetingDate, approved:false
    };
    if (dm.mode !== 'today') return {
      tone:dm.mode === 'future' ? 'warn' : 'bad', status:dm.mode === 'future' ? 'WAIT' : 'NO BET', badge:dm.label,
      reason:`Loaded Hong Kong meeting is ${meetingDate ? prettyDate(meetingDate) : 'not dated'}; today is ${prettyDate(dm.today)}.`, date:meetingDate, approved:true
    };
    if (!feedReady) return {
      tone:'bad', status:'NO BET', badge:'LIVE GATES NOT VERIFIED',
      reason:'HK production approval exists, but model, quote, capacity, year-count or daily-risk verification is missing/stale.', date:meetingDate, approved:true
    };
    return {
      tone:'good', status:'LIVE', badge:'PRODUCTION VERIFIED',
      reason:'HK production approval and every fresh live execution gate are verified. Only the HK action box may authorize a bet.', date:meetingDate, approved:true
    };
  }

  function stat(label, value, note = '') {
    return `<div class="prod-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  }

  function renderSystemCard(kind, status) {
    if (kind === 'au') {
      const h = state.data.auStats?.historical || {};
      const season = state.data.au?.season || {};
      const actual = season.actualCashProfitAud;
      return `<article class="prod-system ${status.tone}">
        <div class="prod-system-head">
          <div><span class="prod-eyebrow">AUSTRALIA</span><h2>V11 CORE</h2></div>
          <div class="prod-status-pill ${status.tone}">${esc(status.badge)}</div>
        </div>
        <div class="prod-command ${status.tone}"><span>RIGHT NOW</span><strong>${esc(status.status)}</strong><p>${esc(status.reason)}</p></div>
        <div class="prod-stats">
          ${stat('HISTORICAL BETS / YEAR
, one(h.betsPerYear))}
          ${stat('HISTORICAL ROI', pct(h.roiPct, true), `${Number(h.completedFys || 0)} completed FYs`)}
          ${stat('HIST AVG / FY', money(h.avgCompletedFyAud), 'model-equivalent history')}
          ${stat('RECORDED HIST DD', money(h.recordedMaxDrawdownAud), `reorder stress ${money(h.reorderStressMaxDrawdownAud)}`)}
        </div>
        <div class="prod-footline"><b>Current FY model snapshot:</b> ${money(season.modelProfitAud)} on ${Number(season.modelBets || 0)} model bets through ${esc(season.modelThrough || 'â€”')}. <b>Actual cash:</b> ${actual == null ? 'not fully verified/reconciled' : money(actual)}.</div>
      </article>`;
    }

    const h = state.data.hkStats?.historical || {};
    const f = state.data.hkStats?.frequency || {};
    const model = state.data.hkStats?.model || {};
    const stress = state.data.hkStats?.sequenceStress || {};
    return `<article class="prod-system ${status.tone}">
      <div class="prod-system-head">
        <div><span class="prod-eyebrow">HONG KONG</span><h2>OPTIMAL V4</h2></div>
        <div class="prod-status-pill ${status.tone}">${esc(status.badge)}</div>
      </div>
      <div class="prod-command ${status.tone}"><span>RIGHT NOW</span><strong>${esc(status.status)}</strong><p>${esc(status.reason)}</p></div>
      <div class="prod-stats">
        ${stat('HISTORICAL BETS / YEAR
, one(f.betsPerYear))}
        ${stat('HISTORICAL ROI', pct(h.historicalRoi), `${Number(f.completedYears || 0)} completed years`)}
        ${stat('HIST AVG / YEAR', money(h.annualHistoricalProfitAud), 'optimised historical path')}
        ${stat('STORED HIST DD', money(h.raceLevelMaxDrawdownAud), `P95 sequence stress ${money(stress.p95MaxDrawdownAud)}`)}
      </div>
      <div class="prod-footline"><b>Conservative forward anchor:</b> ${money(model.calibratedModelEvAudPerYear)}/year (${pct(model.calibratedModelRoi)} model ROI). <b>2026 partial:</b> ${money(h.partial2026PlAud)} through ${esc(f.partial2026SourceCutoff || 'â€”')}.</div>
    </article>`;
  }

  function render() {
    const shell = ensureShell();
    if (!shell) return;
    const au = auStatus();
    const hk = hkStatus();
    const updated = state.loadedAt ? timestamp(state.loadedAt) : 'checking';
    const allSafe = au.status !== 'LIVE' && hk.status !== 'LIVE';

    shell.innerHTML = `
      <div class="prod-head">
        <div><span class="prod-kicker">MITCHELL RACING Â· PRODUCTION COMMAND CENTRE</span><h1>One screen. One decision.</h1><p>Historical stats are evidence, not permission to bet. Live permission only exists inside a verified green <b>BET NOW</b> action.</p></div>
        <button type="button" id="productionRefresh" class="prod-refresh" ${state.busy ? 'disabled' : ''}>${state.busy ? 'CHECKINGâ€¦' : 'REFRESH ALL'}</button>
      </div>
      <div class="prod-master-rule ${allSafe ? 'safe' : ''}"><span>THE ONLY ACTION RULE</span><strong><b>GREEN + BET NOW</b> = act. Anything else = do not bet.</strong><small>Never infer a bet from odds, a horse name, historical ROI, a watchlist or a model signal.</small></div>
      <div class="prod-grid">${renderSystemCard('au', au)}${renderSystemCard('hk', hk)}</div>
      <div class="prod-updated"><span>APP BUILD ${BUILD}</span><span>STATUS CHECK ${esc(updated)}</span>${state.error ? `<span class="prod-error">${esc(state.error)}</span>` : ''}</div>`;

    $('productionRefresh')?.addEventListener('click', refreshAll, { once:true });
    syncTabLabels(au, hk);
    applyAuGuard(au);
    applyHkGuard(hk);
  }

  function syncTabLabels(au, hk) {
    const auButton = document.querySelector('.hk-tab-btn[data-tab="au"]');
    const hkButton = document.querySelector('.hk-tab-btn[data-tab="hk"]');
    if (auButton) auButton.innerHTML = `<span>AUSTRALIA Â· V11</span><b class="prod-tab-state ${au.tone}">${esc(au.status)}</b>`;
    if (hkButton) hkButton.innerHTML = `<span>HONG KONG Â· V4</span><b class="prod-tab-state ${hk.tone}">${esc(hk.approved ? hk.status : 'SHADOW')}</b>`;
  }

  function applyAuGuard(status) {
    const shouldGuard = status.mode !== 'today';
    document.body.classList.toggle('prod-au-date-guard', shouldGuard);
    if (!shouldGuard || state.internalAu) return;
    const card = $('decisionCard');
    if (!card) return;
    const title = status.mode === 'future' ? 'WAIT' : 'NO BET';
    const expectedClass = `decision-card ${status.mode === 'future' ? 'waiting' : 'blocked'}`;
    const expectedKicker = status.mode === 'future' ? 'AUSTRALIA Â· NEXT CARD' : 'AUSTRALIA Â· CARD NOT CURRENT';
    if (card.dataset.productionDateGuard === status.mode && card.className === expectedClass && $('decisionTitle')?.textContent === title && $('decisionMessage')?.textContent === status.reason && $('decisionKicker')?.textContent === expectedKicker) return;
    state.internalAu = true;
    try {
      card.className = expectedClass;
      card.dataset.productionDateGuard = status.mode;
      if ($('decisionKicker')) $('decisionKicker').textContent = expectedKicker;
      if ($('decisionTitle')) $('decisionTitle').textContent = title;
      if ($('decisionMessage')) $('decisionMessage').textContent = status.reason;
      if ($('lockedBets')) $('lockedBets').innerHTML = '';
      if ($('freshness')) $('freshness').textContent = status.mode === 'future' ? 'NOT RACE DAY Â· FAIL CLOSED' : 'OLD CARD Â· FAIL CLOSED';
      if ($('lastChecked')) $('lastChecked').textContent = `TODAY ${prettyDate(perthToday())}`;
      const bottom = $('bottomCommand');
      if (bottom) bottom.className = `bottom-command ${status.mode === 'future' ? 'waiting' : 'blocked'}`;
      if ($('bottomLabel')) $('bottomLabel').textContent = title;
      if ($('bottomText')) $('bottomText').textContent = status.mode === 'future' ? 'Next card loaded. Wait until race day.' : 'Australia race card is out of date.';
      if (document.querySelector('#auRacingPanel.active') || !document.getElementById('hkRacingPanel')) document.title = `${title} Â· MITCHELL Racing`;
    } finally {
      state.internalAu = false;
    }
  }

  function applyHkGuard(status) {
    const blocked = status.approved !== true;
    document.body.classList.toggle('prod-hk-production-guard', blocked);
    if (!blocked || state.internalHk) return;
    const root = $('hkRacingContent');
    if (!root) return;
    const shadowText = 'HK OPTIMAL V4 is not production-approved. Any qualifying model output is research only and must not become a real-money instruction.';
    const action = root.querySelector('.hk-action');
    const actionTitle = root.querySelector('.hk-action-title');
    const actionText = root.querySelector('.hk-action-text');
    const hasBetClass = Boolean(root.querySelector('.hk-action.bet,.hk-card.bet,.hk-signal.bet,.hk-status.bet'));
    if (!hasBetClass && actionTitle?.textContent === 'WAIT Â· SHADOW ONLYIÈ	‰ˆXİ[Û•^Ë^ÛÛ[OOHÚYİÕ^
H™]\›Âˆİ]Kš[\›˜[2ÈHYNÂˆHÂˆYˆ
Xİ[ÛŠHXİ[Û‹˜Û\ÜÓ˜[YHH	ÚËXXİ[Û‰ÎÂˆYˆ
Xİ[Û•]JHXİ[Û•]K^ÛÛ[H	ÕĞRU0­ÈÒQÕÈÓ“IÎÂˆYˆ
Xİ[Û•^
HXİ[Û•^^ÛÛ[HÚYİÕ^Âˆ›Ûİœ]Y\TÙ[XİÜ[
	ËšËXØ\™˜™]	ÊK™›Ü‘XXÚ
›ÙHOˆ›ÙK˜Û\ÜÓ\İœ™[[İ™J	Ø™]	ÊJNÂˆ›Ûİœ]Y\TÙ[XİÜ[
	ËšË\ÚYÛ˜[˜™]	ÊK™›Ü‘XXÚ
›ÙHOˆÂˆ›ÙK˜Û\ÜÓ\İœ™[[İ™J	Ø™]	ÊNÂˆÛÛœİˆH›ÙKœ]Y\TÙ[XİÜŠ	Ø‰ÊNÂˆYˆ
ŠH‹^ÛÛ[H	ÔÒQÕÈÒQÓS	ÎÂˆJNÂˆ›Ûİœ]Y\TÙ[XİÜ[
	ËšË\İ]\Ë˜™]	ÊK™›Ü‘XXÚ
›ÙHOˆÂˆ›ÙK˜Û\ÜÓ\İœ™[[İ™J	Ø™]	ÊNÂˆ›ÙK^ÛÛ[H	ÔÒQÕÈÒQÓS0­ÈÈ“Õ‘U	ÎÂˆJNÂˆHš[˜[HÂˆİ]Kš[\›˜[šÈH˜[ÙNÂˆBˆB‚ˆ\Ş[˜È[˜İ[Ûˆ™Yœ™\Ú[

HÂˆYˆ
İ]K˜\ŞJH™]\›Âˆİ]K˜\ŞHHYNÂˆİ]K™\œ›ÜˆH[Âˆ™[™\Š
NÂˆHÂˆÛÛœİØ]K]Tİ]ËËÔİ]×HH]ØZ]›ÛZ\ÙK˜[
ÂˆÙ]œÛÛŠ’STË˜]JKÙ]œÛÛŠ’STË˜]Tİ]ÊKÙ]œÛÛŠ’STËšÊKÙ]œÛÛŠ’STËšÔİ]ÊBˆJNÂˆİ]K™]HHÈ]K]Tİ]ËËÔİ]ÈNÂˆİ]K›ØYY]H]K››İÊ
NÂˆÚ[™İË—×ÓRUÒSÔ“ÑPÕSÓ—ÔÕUTÈHÈ]Q]N˜Ø\™]J]JKÑ]NšÏË›YY][™ÏË™]H[Ô›ÙXİ[Û\›İ™YšÔİ]ÏË™XÚ\Ú[ÛËœ›ÙXİ[Û\›İ™YOOHYKÚXÚÙY]›™]È]J
KÒTÓÔİš[™Ê
HNÂˆÚ[™İË™\Ü]Ú]™[
™]Èİ\İÛQ]™[
	ÛZ]Ú[\›ÙXİ[Û‹\İ]\ÉËÈ]Z[Ú[™İË—×ÓRUÒSÔ“ÑPÕSÓ—ÔÕUTÈJJNÂˆHØ]Ú
\œ›ÜŠHÂˆİ]K™\œ›ÜˆH\œ›Üˆ[œİ[˜Ù[Ùˆ\œ›ÜˆÈ\œ›Ü‹›Y\ÜØYÙHˆ	Ô›ÙXİ[Ûˆİ]\ÈÚXÚÈ˜Z[Y	ÎÂˆHš[˜[HÂˆİ]K˜\ŞHH˜[ÙNÂˆ™[™\Š
NÂˆÚ[™İË“RUÒSÒ×ÓÔSPSÕÔ‘Q”‘TÒËŠ
NÂˆÚ[™İË™\Ü]Ú]™[
™]Èİ\İÛQ]™[
	ÛZ]Ú[\™Yœ™\Ú[]™IËÈ]Z[È›Ü˜ÙP˜\ÙNYKÛİ\˜ÙN‰Ü›ÙXİ[Û‹XÙ[™IÈHJJNÂˆBˆB‚ˆ[˜İ[Ûˆ[œİ[İX\™Ê
HÂˆÛÛœİXÚ\Ú[ÛˆH	
	ÙXÚ\Ú[ÛØ\™	ÊNÂˆYˆ
XÚ\Ú[ÛŠH™]È]]][Û“ØœÙ\™\Š

HOˆÂˆYˆ
İ]Kš[\›˜[]JH™]\›ÂˆÛÛœİİ]\ÈH]Tİ]\Ê
NÂˆYˆ
İ]\Ë›[ÙHOOH	İÙ^IÊH]Y]YSZXÜ›İ\ÚÊ

HOˆ\P]QİX\™
İ]\ÊJNÂˆJK›ØœÙ\™JXÚ\Ú[Û‹È]šX]\ÎYKÚ[\İYKİX™YNYKÚ\˜Xİ\‘]NYHJNÂ‚ˆÛÛœİÔ›ÛİH	
	ÚÔ˜XÚ[™ĞÛÛ[	ÊNÂˆYˆ
Ô›Ûİ
H™]È]]][Û“ØœÙ\™\Š

HOˆÂˆYˆ
İ]Kš[\›˜[ÊH™]\›ÂˆÛÛœİİ]\ÈHÔİ]\Ê
NÂˆYˆ
İ]\Ë˜\›İ™YOOHYJH]Y]YSZXÜ›İ\ÚÊ

HOˆ\RÑİX\™
İ]\ÊJNÂˆJK›ØœÙ\™JÔ›ÛİÈ]šX]\ÎYKÚ[\İYKİX™YNYKÚ\˜Xİ\‘]NYHJNÂˆB‚ˆ[˜İ[Ûˆ›Ûİ

HÂˆÛÛœİØZ]›Ü”Ú[H

HOˆÂˆYˆ
Y[œİ\™TÚ[

JH™]\›ˆÙ][Y[İ]
ØZ]›Ü”Ú[L
NÂˆ[œİ[İX\™Ê
NÂˆ™Yœ™\Ú[

NÂˆNÂˆØZ]›Ü”Ú[

NÂˆB‚ˆÚ[™İË˜Y]™[\İ[™\Š	ÛZ]Ú[[]™KZX[	Ë]™[OˆÈİ]KšX[˜]HH]™[™]Z[[È™[™\Š
NÈJNÂˆÚ[™İË˜Y]™[\İ[™\Š	ÛZ]Ú[\™Y›YÚZX[	Ë]™[OˆÈİ]KšX[œ™Y›YÚH]™[™]Z[[È™[™\Š
NÈJNÂˆÚ[™İË˜Y]™[\İ[™\Š	ÛZ]Ú[ZËZX[	Ë]™[OˆÈİ]KšX[šÈH]™[™]Z[[È™[™\Š
NÈJNÂˆÚ[™İË˜Y]™[\İ[™\Š	ÛÛ›[™IË

HOˆ™Yœ™\Ú[

JNÂˆÚ[™İË˜Y]™[\İ[™\Š	ÛÙ™›[™IË™[™\ŠNÂˆØİ[Y[˜Y]™[\İ[™\Š	İš\ÚXš[]XÚ[™ÙIË

HOˆÈYˆ
Øİ[Y[š\ÚXš[]Tİ]HOOH	İš\ÚX›IÊH™Yœ™\Ú[

NÈJNÂ‚ˆYˆ
Øİ[Y[œ™XYTİ]HOOH	ÛØY[™ÉÊHØİ[Y[˜Y]™[\İ[™\Š	ÑÓPÛÛ[ØYY	Ë›ÛİÈÛ˜ÙNYHJNÂˆ[ÙH›Ûİ

NÂˆÙ][\˜[


HOˆÈ™[™\Š
NÈYˆ
Øİ[Y[š\ÚXš[]Tİ]HOOH	İš\ÚX›IÊH™Yœ™\Ú[

NÈK‘Q”‘TÒÓTÊNÂŸJJ
NÂ