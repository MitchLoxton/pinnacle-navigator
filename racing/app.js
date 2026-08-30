(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  const CLIENT_BUILD = '1.6.8';
  let updateReloading = false;

  window.__MITCHELL_BASE_DATA = null;
  window.__MITCHELL_STATS = null;
  window.__MITCHELL_LIVE_V11_HAS_RENDERED = false;

  function reloadForBuild(build) {
    if (updateReloading) return;
    updateReloading = true;
    const url = new URL(window.location.href);
    url.searchParams.set('build', String(build || CLIENT_BUILD));
    url.searchParams.set('_refresh', String(Date.now()));
    window.location.replace(url.toString());
  }

  async function checkClientBuild() {
    try {
      const r = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) return;
      const version = await r.json();
      if (version?.build && version.build !== CLIENT_BUILD) reloadForBuild(version.build);
    } catch (e) {
      console.warn('Build check unavailable', e);
    }
  }

  async function setupAppUpdater() {
    if ('serviceWorker' in navigator) {
      try {
        const hadController = Boolean(navigator.serviceWorker.controller);
        let controllerReloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (hadController && !controllerReloaded) {
            controllerReloaded = true;
            reloadForBuild(CLIENT_BUILD);
          }
        });
        navigator.serviceWorker.addEventListener('message', event => {
          if (event?.data?.type === 'MITCHELL_APP_UPDATE' && event.data.build !== CLIENT_BUILD) {
            reloadForBuild(event.data.build);
          }
        });
        const reg = await navigator.serviceWorker.register(`./sw.js?build=${CLIENT_BUILD}`, {
          scope: './',
          updateViaCache: 'none'
        });
        await reg.update();
        window.setInterval(() => reg.update().catch(() => {}), 30000);
      } catch (e) {
        console.warn('Service worker update check unavailable', e);
      }
    }
    await checkClientBuild();
    window.setInterval(checkClientBuild, 15000);
  }

  function fmtUpdated(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Update time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth'
    }).format(d) + ' Perth';
  }

  async function json(path) {
    const r = await fetch(`${path}?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  function setChecking() {
    if (window.__MITCHELL_LIVE_V11_HAS_RENDERED) return;
    $('decisionCard').className = 'decision-card waiting';
    $('bottomCommand').className = 'bottom-command waiting';
    $('decisionKicker').textContent = 'LIVE V11 CHECKING';
    $('decisionTitle').textContent = 'CHECKING...';
    $('decisionMessage').textContent = 'Checking live odds, system-bet execution truth and state results.';
    $('lockedBets').innerHTML = '';
    $('freshness').textContent = 'LIVE V11 · AUTO';
    $('bottomLabel').textContent = 'LIVE V11';
    $('bottomText').textContent = 'A signal is not a system bet until accepted execution is confirmed.';
  }

  function skeleton(data) {
    const items = Array.isArray(data?.watchlist) ? data.watchlist : [];
    $('watchSummary').textContent = items.length ? `${items.length} races being checked live` : 'No V11 watch races';
    $('watchlist').innerHTML = items.map(item => {
      const race = String(item.race || item.code || '').toUpperCase();
      const venue = item.venue || item.region || '';
      return `<article class="watch-card" data-race="${race}" style="display:block">
        <div class="watch-race">${race}${venue ? ' | ' + venue : ''}</div>
        <strong style="font-size:19px;margin-top:5px">CHECKING LIVE V11...</strong>
        <div style="margin-top:10px;padding:11px;border-radius:11px;background:#101b2b;border:1px solid #2d425c;color:#dbe6f4;font-size:11px">Loading current market and saved decision...</div>
      </article>`;
    }).join('');
  }

  function details(data, stats) {
    $('weekLabel').textContent = data?.weekLabel || 'Current racing week';
    $('updatedAt').textContent = data?.updatedAt ? 'Base card published ' + fmtUpdated(data.updatedAt) : 'Base card time unavailable';
    const season = data?.season || {};
    const p = Number(season.modelProfitAud);
    $('seasonProfit').textContent = Number.isFinite(p) ? money.format(p) : '—';
    const h = stats?.historical || {};
    const avg = Number(h.avgCompletedFyAud);
    const roi = Number(h.roiPct);
    $('histAvg').textContent = Number.isFinite(avg) ? money.format(avg) : '—';
    $('histRoi').textContent = Number.isFinite(roi) ? roi.toFixed(1) + '%' : '—';
    $('feedStatus').textContent = `V11 SIMPLE-RESULT ENGINE · CLIENT ${CLIENT_BUILD}`;
  }

  async function loadBase() {
    try {
      const data = await json('./current.json');
      window.__MITCHELL_BASE_DATA = data;
      let stats = null;
      try { stats = await json('./stats.json'); } catch (e) { console.warn('Stats unavailable', e); }
      window.__MITCHELL_STATS = stats;
      details(data, stats);
      if (!window.__MITCHELL_LIVE_V11_HAS_RENDERED) skeleton(data);
      setChecking();
      window.dispatchEvent(new CustomEvent('mitchell-base-ready', { detail: data }));
    } catch (e) {
      console.error(e);
      if (!window.__MITCHELL_LIVE_V11_HAS_RENDERED) {
        $('decisionCard').className = 'decision-card blocked';
        $('decisionTitle').textContent = 'FEED ERROR';
        $('decisionMessage').textContent = 'Could not load the trusted V11 watchlist. Do not place a bet.';
      }
    }
  }

  function manualRefresh() {
    setChecking();
    checkClientBuild();
    loadBase().finally(() => window.dispatchEvent(new Event('mitchell-refresh-live')));
  }

  $('refreshButton')?.addEventListener('click', manualRefresh);
  $('bottomRefresh')?.addEventListener('click', manualRefresh);
  setupAppUpdater();
  loadBase();
})();
