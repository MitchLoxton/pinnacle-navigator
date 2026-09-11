(() => {
  'use strict';

  const ODDS_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-source-probe';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYXNlIiwicmVmIjoiZGttYWNrdGNmaHVic3Vtd3J5ZHciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NjQ1Njg5NCwiZXhwIjoyMTAyMDMyODk0fQ.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const POLL_MS = 30000;
  const FETCH_TIMEOUT_MS = 12000;

  let busy = false;
  let timer = null;
  let lastResults = [];
  let lastFetchedAt = null;
  let renderTimer = null;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const raceCode = value => String(value || '').trim().toUpperCase();
  const odds = value => Number.isFinite(Number(value)) ? '$' + Number(value).toFixed(2) : '—';
  const horseKey = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  const isWatchlistOpen = () => Boolean(document.querySelector('[data-premium-tab="watchlist"].active') && document.getElementById('premiumPage'));

  function stamp(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      hour:'numeric', minute:'2-digit', second:'2-digit', timeZone:'Australia/Perth'
    }).format(d) + ' Perth';
  }

  function ensureCss() {
    if (document.getElementById('mitchell-watchlist-odds-css')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-watchlist-odds-css';
    style.textContent = `
      .wlo-shell{margin:14px 0 18px;display:grid;gap:12px}
      .wlo-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;border:1px solid #ffffff13;background:#0a131e}
      .wlo-head span{display:block;font-size:8px;font-weight:950;letter-spacing:.13em;color:#7d8b99}
      .wlo-head strong{display:block;margin-top:4px;font-size:17px;color:#f5f7fa}
      .wlo-head small{display:block;margin-top:4px;color:#738191;font-size:9px;line-height:1.35}
      .wlo-refresh{border:1px solid #ffffff1b;background:#ffffff09;color:#e6edf5;border-radius:12px;height:38px;padding:0 13px;font-size:9px;font-weight:950;white-space:nowrap}
      .wlo-refresh:disabled{opacity:.55}
      .wlo-region{border:1px solid #ffffff12;border-radius:20px;background:#09121c;overflow:hidden}
      .wlo-region-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #ffffff0d}
      .wlo-region-head strong{font-size:12px}.wlo-region-head span{font-size:8px;color:#788696;font-weight:900;letter-spacing:.08em}
      .wlo-race{border-bottom:1px solid #ffffff0d}.wlo-race:last-child{border-bottom:0}
      .wlo-race summary{list-style:none;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:12px 14px;cursor:pointer}
      .wlo-race summary::-webkit-details-marker{display:none}
      .wlo-code{font-size:13px;font-weight:950;color:#fff;min-width:34px}
      .wlo-summary{min-width:0}.wlo-summary strong{display:block;font-size:11px;color:#eef3f8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wlo-summary small{display:block;margin-top:3px;font-size:8px;color:#758493}
      .wlo-status{display:inline-flex;align-items:center;justify-content:center;border-radius:99px;padding:5px 8px;font-size:8px;font-weight:950;letter-spacing:.04em;white-space:nowrap}
      .wlo-live{color:#82f3b1;background:#133624}.wlo-partial{color:#f3d482;background:#332a12}.wlo-wait{color:#a9b8c7;background:#172332}.wlo-bad{color:#ff9eaa;background:#35151d}
      .wlo-core{box-shadow:inset 3px 0 0 #e1b45e}.wlo-core-tag{margin-left:6px;color:#e1b45e;font-size:7px;font-weight:950;letter-spacing:.06em}
      .wlo-market{padding:0 12px 13px}.wlo-grid{display:grid;gap:5px}
      .wlo-runner{display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;border:1px solid #ffffff0d;border-radius:10px;background:#0c1723}
      .wlo-runner.fav{border-color:#2f7c57;background:#0e2a20}
      .wlo-num{font-size:9px;color:#82909e;font-weight:850}.wlo-name{font-size:10px;color:#e9eef4;font-weight:800;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .wlo-name b{color:#7df0ad;font-size:7px;margin-left:5px}.wlo-prices{text-align:right}.wlo-win{display:block;color:#f6f8fb;font-size:12px;font-weight:950}.fav .wlo-win{color:#82f3b1}.wlo-place{display:block;margin-top:2px;color:#718191;font-size:7px}
      .wlo-empty{padding:12px;color:#7d8b99;font-size:9px;line-height:1.45}
      .wlo-source{padding:10px 14px;border-top:1px solid #ffffff0d;color:#687685;font-size:8px;line-height:1.4}
      @media(max-width:650px){.wlo-shell{margin-top:10px}.wlo-head{padding:12px}.wlo-head strong{font-size:15px}.wlo-race summary{padding:11px 12px}.wlo-market{padding:0 9px 11px}.wlo-runner{padding:8px}.wlo-name{font-size:9.5px}}
    `;
    document.head.appendChild(style);
  }

  async function fetchTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal:controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchGroup(races) {
    const r = await fetchTimeout(ODDS_URL, {
      method:'POST',
      cache:'no-store',
      headers:{
        'Content-Type':'application/json',
        apikey:ANON,
        Authorization:`Bearer ${ANON}`
      },
      body:JSON.stringify({ races })
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body?.ok !== true || !Array.isArray(body.results)) {
      throw new Error(body?.error || `Odds HTTP ${r.status}`);
    }
    return body.results;
  }

  function tracklist() {
    const data = window.__MITCHELL_BASE_DATA || {};
    return Array.isArray(data?.stateTracklist) ? data.stateTracklist : [];
  }

  function statusInfo(result) {
    const status = String(result?.oddsStatus || '').toUpperCase();
    if (status === 'LIVE') return { cls:'wlo-live', label:'ODDS LIVE' };
    if (status === 'PARTIAL') return { cls:'wlo-partial', label:'PARTIAL ODDS' };
    if (status === 'NOT_OUT') return { cls:'wlo-wait', label:'NOT OUT YET' };
    return { cls:'wlo-bad', label:'SOURCE CHECK' };
  }

  function runnerRows(result) {
    const runners = (Array.isArray(result?.runners) ? result.runners : []).filter(r => !r?.scratched);
    if (!runners.length) return '<div class="wlo-empty">No active fixed-WIN prices are published for this race yet.</div>';

    const favs = new Set((Array.isArray(result?.favourites) ? result.favourites : []).map(f => horseKey(f?.name)));
    const sorted = [...runners].sort((a,b) => {
      const ap = Number(a?.price), bp = Number(b?.price);
      const aKey = Number.isFinite(ap) ? ap : 99999;
      const bKey = Number.isFinite(bp) ? bp : 99999;
      return aKey - bKey || Number(a?.number || 999) - Number(b?.number || 999);
    });

    return `<div class="wlo-grid">${sorted.map(r => {
      const isFav = favs.has(horseKey(r?.name));
      const p = Number(r?.price);
      const pp = Number(r?.placePrice);
      return `<div class="wlo-runner ${isFav ? 'fav' : ''}">
        <span class="wlo-num">#${esc(r?.number ?? '—')}</span>
        <span class="wlo-name">${esc(r?.name || 'UNKNOWN')}${isFav ? '<b>FAV</b>' : ''}</span>
        <span class="wlo-prices"><span class="wlo-win">WIN ${Number.isFinite(p) ? odds(p) : '—'}</span>${Number.isFinite(pp) ? `<span class="wlo-place">PLACE ${odds(pp)}</span>` : ''}</span>
      </div>`;
    }).join('')}</div>`;
  }

  function raceHtml(item, result) {
    const race = raceCode(item?.race);
    const info = statusInfo(result);
    const favs = Array.isArray(result?.favourites) ? result.favourites : [];
    const fp = Number(result?.favouritePrice);
    const favText = favs.length && Number.isFinite(fp)
      ? `${favs.map(x => x?.name || 'UNKNOWN').join(' / ')} · ${odds(fp)}`
      : info.label === 'NOT OUT YET' ? 'Waiting for TABtouch fixed-WIN market' : 'Favourite/price checking';
    const hasPrices = Boolean(result?.oddsAvailable);
    return `<details class="wlo-race ${item?.corePotential ? 'wlo-core' : ''}"${hasPrices ? ' open' : ''}>
      <summary>
        <span class="wlo-code">${esc(race)}</span>
        <span class="wlo-summary"><strong>${esc(favText)}${item?.corePotential ? '<span class="wlo-core-tag">CORE</span>' : ''}</strong><small>State ${esc(item?.state ?? '—')} · ${esc(result?.venue || item?.venue || item?.region || '')}</small></span>
        <span class="wlo-status ${info.cls}">${info.label}</span>
      </summary>
      <div class="wlo-market">${runnerRows(result)}</div>
    </details>`;
  }

  function buildHtml() {
    const rows = tracklist();
    const byRace = new Map(lastResults.map(x => [raceCode(x?.race), x]));
    const groups = ['Perth','Sydney','Melbourne'];
    const liveCount = lastResults.filter(x => x?.oddsAvailable).length;
    const timeText = lastFetchedAt ? stamp(lastFetchedAt) : 'checking now';

    return `<section class="wlo-shell" data-watchlist-live-odds>
      <div class="wlo-head">
        <div><span>ACTIVE MARKET ODDS</span><strong>${liveCount ? `${liveCount} of ${rows.length} races have prices` : 'Checking whether odds are out'}</strong><small>TABtouch fixed-WIN · auto refresh every 30 seconds · last check ${esc(timeText)}</small></div>
        <button type="button" class="wlo-refresh" data-watch-odds-refresh ${busy ? 'disabled' : ''}>${busy ? 'CHECKING…' : 'REFRESH ODDS'}</button>
      </div>
      ${groups.map(region => {
        const items = rows.filter(x => String(x?.region || '').toLowerCase() === region.toLowerCase());
        return `<section class="wlo-region"><div class="wlo-region-head"><strong>${esc(region)}</strong><span>${items.length} RACES</span></div>${items.map(item => {
          const race = raceCode(item?.race);
          const result = byRace.get(race) || { race, oddsStatus:'NOT_OUT', oddsAvailable:false, runners:[] };
          return raceHtml(item, result);
        }).join('')}</section>`;
      }).join('')}
      <div class="wlo-source">Live odds are information only. They do not create a bet. The app's green BET NOW instruction remains the only execution instruction.</div>
    </section>`;
  }

  function marketRenderKey() {
    return JSON.stringify((lastResults || []).map(result => ({
      race:raceCode(result?.race),
      status:result?.oddsStatus || '',
      favouritePrice:Number.isFinite(Number(result?.favouritePrice)) ? Number(result.favouritePrice) : null,
      runners:(Array.isArray(result?.runners) ? result.runners : []).map(r => [r?.number, r?.name, r?.price, r?.placePrice, r?.scratched, r?.suspended])
    })));
  }

  function render() {
    if (!isWatchlistOpen()) return;
    ensureCss();
    const page = document.getElementById('premiumPage');
    if (!page) return;

    const key = marketRenderKey();
    let root = page.querySelector('[data-watchlist-live-odds]');
    if (root?.dataset?.marketRenderKey === key) {
      root.querySelector('[data-watch-odds-refresh]')?.addEventListener('click', () => refresh(true), { once:true });
      return;
    }
    if (!root) {
      const holder = document.createElement('div');
      holder.innerHTML = buildHtml();
      root = holder.firstElementChild;
      root.dataset.marketRenderKey = key;
      const title = page.querySelector('.premium-section-title');
      if (title?.nextSibling) page.insertBefore(root, title.nextSibling);
      else page.prepend(root);
    } else {
      const openRaces = new Set([...root.querySelectorAll('.wlo-race[open]')].map(x => x.querySelector('.wlo-code')?.textContent || ''));
      const holder = document.createElement('div');
      holder.innerHTML = buildHtml();
      const next = holder.firstElementChild;
      next.dataset.marketRenderKey = key;
      const pageY = window.scrollY || document.documentElement.scrollTop || 0;
      root.replaceWith(next);
      root = next;
      if (pageY > 0) requestAnimationFrame(() => window.scrollTo({ top:pageY, left:0, behavior:'auto' }));
      if (openRaces.size) {
        [...root.querySelectorAll('.wlo-race')].forEach(d => {
          const code = d.querySelector('.wlo-code')?.textContent || '';
          if (openRaces.has(code)) d.open = true;
        });
      }
    }

    root.querySelector('[data-watch-odds-refresh]')?.addEventListener('click', () => refresh(true), { once:true });
  }

  function scheduleRender(delay = 80) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, delay);
  }

  async function refresh() {
    if (!isWatchlistOpen() || busy) return;
    const rows = tracklist();
    if (!rows.length) {
      scheduleRender();
      return;
    }

    busy = true;
    const refreshButton = document.querySelector('[data-watch-odds-refresh]');
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = 'CHECKING...';
    }
    try {
      const groups = ['PR','SR','MR'].map(prefix => rows.filter(x => raceCode(x?.race).startsWith(prefix)).map(x => raceCode(x?.race)));
      const settled = await Promise.allSettled(groups.map(fetchGroup));
      const next = [];
      for (const result of settled) {
        if (result.status === 'fulfilled') next.push(...result.value);
      }
      if (next.length) {
        lastResults = next;
        lastFetchedAt = new Date();
      }
    } catch (error) {
      console.warn('Watchlist odds unavailable', error);
    } finally {
      busy = false;
      render();
      scheduleNext();
    }
  }

  function scheduleNext(delay = POLL_MS) {
    clearTimeout(timer);
    if (!isWatchlistOpen()) return;
    timer = setTimeout(refresh, delay);
  }

  function onTabChange() {
    setTimeout(() => {
      if (!isWatchlistOpen()) {
        clearTimeout(timer);
        return;
      }
      render();
      refresh();
    }, 90);
  }

  function start() {
    ensureCss();
    document.addEventListener('click', event => {
      if (event.target?.closest?.('[data-premium-tab="watchlist"], [data-tab-jump="watchlist"]')) onTabChange();
    }, true);

    window.addEventListener('online', () => { if (isWatchlistOpen()) refresh(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isWatchlistOpen()) refresh();
    });

    if (isWatchlistOpen()) {
      render();
      refresh();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
