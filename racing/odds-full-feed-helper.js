(() => {
  'use strict';

  const KEY_STORE = 'mitchell_racing_odds_api_key';
  const SIGNUP_URL = 'https://puntersedge.online/api#signup';
  const SERVED = [
    'Sportsbet','TAB','TABtouch','Neds','Ladbrokes','PointsBet','BetRight',
    'BetDeluxe','Betr','Unibet','NextBet','Palmerbet','BetGold','BoostBet'
  ];

  // Improve full-feed coverage without touching the V11 engine.
  // The provider docs recommend num_races=200 and include_unresolved=true for full-card matching.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      const url = typeof input === 'string' ? input : input?.url;
      if (url && url.includes('api.puntersedge.online/v1/racing/next-to-go')) {
        const u = new URL(url);
        if (!u.pathname.includes('/demo/')) {
          u.searchParams.set('num_races', '200');
          u.searchParams.set('categories', 'horse');
          u.searchParams.set('include_unresolved', 'true');
          input = typeof input === 'string' ? u.toString() : new Request(u.toString(), input);
        }
      }
    } catch (_) {}
    return nativeFetch(input, init);
  };

  function esc(v){
    return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function style(){
    if (document.getElementById('oddsFullFeedHelperStyle')) return;
    const s = document.createElement('style');
    s.id = 'oddsFullFeedHelperStyle';
    s.textContent = `
      .fullfeed-panel{margin-top:12px;padding:14px;border:1px solid #5a4720;border-radius:14px;background:linear-gradient(145deg,#21180a,#15120c 70%,#10161f);box-shadow:0 14px 36px rgba(0,0,0,.18)}
      .fullfeed-top{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.fullfeed-copy{min-width:0}.fullfeed-kicker{font-size:8px;font-weight:950;letter-spacing:.11em;color:#ffcc68}.fullfeed-title{margin:3px 0 0;font-size:15px;font-weight:950;color:#fff}.fullfeed-text{margin:6px 0 0;color:#c7d2df;font-size:9px;line-height:1.5;max-width:760px}.fullfeed-badge{flex:0 0 auto;padding:5px 8px;border-radius:999px;border:1px solid #5a4720;background:#2b200d;color:#ffd372;font-size:8px;font-weight:950}.fullfeed-actions{display:grid;grid-template-columns:auto minmax(180px,1fr) auto;gap:7px;margin-top:11px}.fullfeed-link,.fullfeed-connect{appearance:none;border:1px solid #386893;background:#102943;color:#eef7ff;border-radius:10px;padding:10px 12px;font:inherit;font-size:9px;font-weight:950;text-decoration:none;text-align:center;cursor:pointer}.fullfeed-connect{border-color:#277553;background:#103627;color:#8ef0bd}.fullfeed-input{min-width:0;width:100%;box-sizing:border-box;border:1px solid #35506c;border-radius:10px;background:#07121f;color:#fff;padding:10px 11px;font:inherit;font-size:10px}.fullfeed-books{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}.fullfeed-books span{padding:4px 7px;border-radius:999px;border:1px solid #2b3d52;background:#0d1825;color:#a9bbce;font-size:7px;font-weight:850}.fullfeed-note{margin-top:8px;color:#8498ad;font-size:7.5px;line-height:1.45}.fullfeed-ok{margin-top:10px;padding:9px 10px;border:1px solid #266c50;border-radius:10px;background:#0f2a20;color:#86efb8;font-size:9px;font-weight:900}.fullfeed-error{margin-top:8px;color:#ff9d9d;font-size:8px;font-weight:800}.fullfeed-panel[data-connected="true"]{border-color:#286b50;background:linear-gradient(145deg,#0f281f,#0c1714)}
      @media(max-width:700px){.fullfeed-actions{grid-template-columns:1fr}.fullfeed-top{display:block}.fullfeed-badge{display:inline-flex;margin-top:7px}}
    `;
    document.head.appendChild(s);
  }

  function findHero(){
    const page = document.querySelector('.odds-page');
    if (!page) return null;
    return page.querySelector('.odds-hero');
  }

  function refreshOdds(){
    const btn = document.getElementById('oddsRefresh');
    if (btn) btn.click();
  }

  function renderPanel(){
    style();
    const hero = findHero();
    if (!hero) return;
    const hasKey = !!String(localStorage.getItem(KEY_STORE) || '').trim();
    let panel = document.getElementById('oddsFullFeedHelper');
    if (panel) panel.remove();
    panel = document.createElement('section');
    panel.id = 'oddsFullFeedHelper';
    panel.className = 'fullfeed-panel';
    panel.dataset.connected = hasKey ? 'true' : 'false';

    if (hasKey) {
      panel.innerHTML = `
        <div class="fullfeed-top"><div class="fullfeed-copy"><div class="fullfeed-kicker">FULL BOOKMAKER FEED</div><div class="fullfeed-title">Full comparison key is connected</div><div class="fullfeed-text">The Odds tab will now request the whole priced horse-racing card and match every supported bookmaker quote to the selected race.</div></div><div class="fullfeed-badge">CONNECTED</div></div>
        <div class="fullfeed-ok">Sportsbet · TAB · TABtouch · Neds · Ladbrokes · PointsBet · BetRight · BetDeluxe · Betr · Unibet · NextBet · Palmerbet · BetGold · BoostBet</div>
        <div class="fullfeed-actions"><button type="button" class="fullfeed-connect" id="fullfeedRefresh">REFRESH ALL BOOKS</button><span></span><button type="button" class="fullfeed-link" id="fullfeedDisconnect">DISCONNECT KEY</button></div>
      `;
    } else {
      panel.innerHTML = `
        <div class="fullfeed-top"><div class="fullfeed-copy"><div class="fullfeed-kicker">WHY YOU ONLY SEE TABTOUCH</div><div class="fullfeed-title">Connect the full live bookmaker feed</div><div class="fullfeed-text">The public sandbox only returns a small sample of races, so it often misses your selected race. A free feed key unlocks the complete next-to-go card and all supported bookmaker prices. The key stays in this browser only.</div></div><div class="fullfeed-badge">1 STEP LEFT</div></div>
        <div class="fullfeed-actions">
          <a class="fullfeed-link" href="${esc(SIGNUP_URL)}" target="_blank" rel="noopener">1. GET FREE KEY</a>
          <input class="fullfeed-input" id="fullfeedKeyInput" type="password" autocomplete="off" placeholder="2. Paste API key here">
          <button type="button" class="fullfeed-connect" id="fullfeedConnect">3. CONNECT + LOAD ALL</button>
        </div>
        <div class="fullfeed-books">${SERVED.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
        <div class="fullfeed-note">The data provider emails the free key and does not require a credit card for the free tier. Once connected, the comparison table fills automatically where each bookmaker has a current quote. bet365 is not part of this provider's current 14-book racing feed, so the app will never invent a bet365 price.</div>
        <div class="fullfeed-error" id="fullfeedError" hidden></div>
      `;
    }

    const feed = hero.querySelector('.odds-feed');
    if (feed && feed.nextSibling) hero.insertBefore(panel, feed.nextSibling);
    else hero.appendChild(panel);

    document.getElementById('fullfeedConnect')?.addEventListener('click', () => {
      const input = document.getElementById('fullfeedKeyInput');
      const key = String(input?.value || '').trim();
      const err = document.getElementById('fullfeedError');
      if (!key || key.length < 8) {
        if (err) { err.hidden = false; err.textContent = 'Paste the API key from the email first.'; }
        return;
      }
      localStorage.setItem(KEY_STORE, key);
      renderPanel();
      setTimeout(refreshOdds, 50);
    });
    document.getElementById('fullfeedRefresh')?.addEventListener('click', refreshOdds);
    document.getElementById('fullfeedDisconnect')?.addEventListener('click', () => {
      localStorage.removeItem(KEY_STORE);
      renderPanel();
      setTimeout(refreshOdds, 50);
    });
  }

  let queued = false;
  function queue(){
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; renderPanel(); });
  }

  const obs = new MutationObserver(queue);
  function mount(){
    const root = document.getElementById('premiumApp') || document.body;
    obs.observe(root, {childList:true, subtree:true});
    queue();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
