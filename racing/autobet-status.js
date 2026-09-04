(() => {
  'use strict';

  const URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-autobet';
  const KEY = 'sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
  const REFRESH_MS = 30000;
  let busy = false;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)) : '—';
  const yes = v => v === true ? 'YES' : 'NO';

  async function getStatus() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),7000);
    try {
      const response = await fetch(URL,{method:'GET',cache:'no-store',signal:controller.signal,headers:{apikey:KEY}});
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok !== true) throw new Error(body?.error || `HTTP ${response.status}`);
      return body;
    } finally { clearTimeout(timer); }
  }

  function ensureHost() {
    let host = document.getElementById('autobetStatusHost');
    if (host) return host;
    const root = document.getElementById('autoRoot');
    if (!root) return null;
    host = document.createElement('div');
    host.id = 'autobetStatusHost';
    root.insertAdjacentElement('afterend',host);
    return host;
  }

  function render(data) {
    const host = ensureHost();
    if (!host) return;
    const ready = data?.ready === true;
    const enabled = data?.enabled === true;
    const kill = data?.killSwitch === true;
    const appKey = data?.credentials?.appKeyPresent === true;
    const session = data?.credentials?.sessionTokenPresent === true;
    const last = data?.lastOrder || null;
    const missing = [!appKey?'BETFAIR APP KEY':null,!session?'BETFAIR SESSION TOKEN':null,!enabled?'SERVER ENABLE':null,kill?'KILL SWITCH OFF':null].filter(Boolean);
    const headline = ready ? 'AUTO BET PLACER · READY' : 'AUTO BET PLACER · LOCKED';
    const tone = ready ? 'goodtxt' : 'warntxt';

    host.innerHTML = `
      <section class="section" id="autobetPanel">
        <span class="eyebrow">REAL-MONEY PLACER</span>
        <h2 class="${tone}">${headline}</h2>
        <p>The server-side Betfair Exchange adapter is installed. It can only fire after a fresh V11 preflight PASS and a genuine BET_LOCKED signal inside the 20s→10s window. It then re-checks the AUD account, horse, WIN market, $3.00 minimum and full-stake liquidity before sending a fill-or-kill BACK order.</p>
        <div class="status-row">
          <span class="pill ${ready?'good':'warn'}">${ready?'PLACER ARMED':'PLACER NOT ARMED'}</span>
          <span class="pill ${appKey?'good':'bad'}">APP KEY ${yes(appKey)}</span>
          <span class="pill ${session?'good':'bad'}">SESSION ${yes(session)}</span>
          <span class="pill ${kill?'bad':'good'}">KILL SWITCH ${kill?'ON':'OFF'}</span>
        </div>
        <div class="rows">
          <div class="row"><span>Provider</span><strong>${esc(data?.provider || 'BETFAIR_EXCHANGE')}</strong></div>
          <div class="row"><span>Server enable</span><strong class="${enabled?'goodtxt':'warntxt'}">${enabled?'ON':'OFF'}</strong></div>
          <div class="row"><span>Max one bet</span><strong>${money(data?.maxBetAud)}</strong></div>
          <div class="row"><span>Max daily exposure</span><strong>${money(data?.maxDailyExposureAud)}</strong></div>
          <div class="row"><span>Placement path</span><strong>SERVER ONLY · FILL OR KILL</strong></div>
          <div class="row"><span>Duplicate protection</span><strong class="goodtxt">ONE PROVIDER ORDER / RACE</strong></div>
          <div class="row"><span>Still needed</span><strong class="${missing.length?'warntxt':'goodtxt'}">${esc(missing.length ? missing.join(' · ') : 'NOTHING')}</strong></div>
          <div class="row"><span>Last provider order</span><strong>${last ? `${esc(last.race_code)} · ${esc(last.status)}` : 'NONE YET'}</strong></div>
        </div>
        <div style="margin-top:10px;padding:10px;border-radius:10px;border:1px solid ${ready?'#2a8058':'#765f2a'};background:${ready?'#0d3023':'#2a2413'};font-size:9px;line-height:1.5;color:${ready?'#b9edd1':'#e9cf88'}">
          ${ready
            ? 'AUTO BET IS ARMED. The server will attempt only exact V11 locked bets that pass every final execution gate.'
            : 'The placer code is live but deliberately cannot send money yet. Betfair credentials must be stored as Supabase Edge Function secrets, then the server control must be explicitly enabled and the kill switch turned off.'}
        </div>
      </section>`;
    window.MITCHELL_AUTOBET_STATUS = data;
  }

  function renderError(error) {
    const host = ensureHost();
    if (!host) return;
    host.innerHTML = `<section class="section"><span class="eyebrow">REAL-MONEY PLACER</span><h2 class="badtxt">AUTO BET STATUS UNVERIFIED</h2><p>${esc(error instanceof Error ? error.message : 'Could not verify placer status.')} The real-money placer must be treated as OFF.</p></section>`;
    window.MITCHELL_AUTOBET_STATUS = {ready:false,error:String(error)};
  }

  async function refresh() {
    if (busy) return;
    busy = true;
    try { render(await getStatus()); }
    catch (error) { renderError(error); }
    finally { busy = false; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
  setInterval(refresh,REFRESH_MS);
})();
