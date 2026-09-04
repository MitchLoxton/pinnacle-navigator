(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
  const CLIENT_BUILD = '1.8.1';
  const BUILD_CHECK_MS = 300000;
  const SW_CHECK_MS = 600000;
  let updateReloading = false;

  window.__MITCHELL_BASE_DATA = null;
  window.__MITCHELL_STATS = null;
  window.__MITCHELL_LIVE_V11_HAS_RENDERED = false;

  function reloadForBuild(build) {
    if (updateReloading) return;
    updateReloading = true;
    const url = new URL(window.location.href);
    url.searchParams.set('build', String(build || CLIENT_BUILD));
    url.searchParams.delete('_refresh');
    window.location.replace(url.toString());
  }

  async function checkClientBuild() {
    try {
      const r = await fetch(`./version.json?v=${encodeURIComponent(CLIENT_BUILD)}`, { cache: 'no-cache' });
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
            window.location.reload();
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
        reg.update().catch(() => {});
        window.setInterval(() => reg.update().catch(() => {}), SW_CHECK_MS);
      } catch (e) {
        console.warn('Service worker update check unavailable', e);
      }
    }
    await checkClientBuild();
    window.setInterval(checkClientBuild, BUILD_CHECK_MS);
  }

  function fmtUpdated(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Update time unavailable';
    return new Intl.DateTimeFormat('en-AU', {
      weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth'
    }).format(d) + ' Perth';
  }

  async function json(path) {
    const r = await fetch(`${path}?v=${encodeURIComponent(CLIENT_BUILD)}`, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return r.json();
  }

  function setChecking() {
    if (window.__MITCHELL_LIVE_V11_HAS_RENDERED) return;
    $('decisionCard').className = 'decision-card waiting';
    $('bottomCommand').className = 'bottom-command waiting';
    $('decisionKicker').textContent = 'YOUR ACTION';
    $('decisionTitle').textContent = 'WAIT';
    $('decisionMessage').textContent = 'Do not bet while this box is yellow. The app is checking automatically.';
    $('lockedBets').innerHTML = '';
    $('freshness').textContent = 'LIVE V11 · AUTO';
    $('bottomLabel').textContent = 'WAIT';
    $('bottomText').textContent = 'Do nothing unless the top box turns green and says BET NOW.';
  }

  function skeleton(data) {
    const items = Array.isArray(data?.watchlist) ? data.watchlist : [];
    $('watchSummary').textContent = items.length ? `${items.length} possible races — wait for green` : 'No V11 CORE possibilities';
    $('watchlist').innerHTML = items.map(item => {
      const race = String(item.race || item.code || '').toUpperCase();
      const venue = item.venue || item.region || '';
      return `<article class="watch-card" data-race="${race}" style="display:block">
        <div class="watch-race">${race}${venue ? ' | ' + venue : ''}</div>
        <strong style="font-size:19px;margin-top:5px">WAIT — DO NOT BET</strong>
        <div style="margin-top:10px;padding:11px;border-radius:11px;background:#101b2b;border:1px solid #2d425c;color:#dbe6f4;font-size:11px">Checking the live favourite, price and V11 decision automatically…</div>
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
    $('feedStatus').textContent = `V11 ONE-SCREEN ENGINE · CLIENT ${CLIENT_BUILD}`;
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
        $('decisionKicker').textContent = 'YOUR ACTION';
        $('decisionTitle').textContent = 'DO NOT BET';
        $('decisionMessage').textContent = 'The live feed could not be verified. Reconnect and refresh before doing anything.';
        $('bottomCommand').className = 'bottom-command blocked';
        $('bottomLabel').textContent = 'DO NOT BET';
        $('bottomText').textContent = 'Live feed unavailable.';
      }
    }
  }

  function manualRefresh() {
    setChecking();
    checkClientBuild();
    loadBase().finally(() => window.dispatchEvent(new CustomEvent('mitchell-refresh-live', { detail: { forceBase: true } })));
  }

  $('refreshButton')?.addEventListener('click', manualRefresh);
  $('bottomRefresh')?.addEventListener('click', manualRefresh);
  setupAppUpdater();
  loadBase();
})();