(() => {
  'use strict';

  const DATA_URL = './hong-kong.json?v=20260904a';

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function addStyles() {
    if (document.getElementById('hk-tab-styles')) return;
    const style = document.createElement('style');
    style.id = 'hk-tab-styles';
    style.textContent = `
      .hk-switcher{display:flex;gap:8px;margin:10px 0 14px;flex-wrap:wrap}
      .hk-tab-btn{border:1px solid #334961;background:#111e2f;color:#aebed0;padding:9px 13px;border-radius:10px;font-weight:900;font-size:11px;cursor:pointer}
      .hk-tab-btn.active{background:#173455;color:#fff;border-color:#4a79a8}
      .hk-panel{display:none}
      .hk-panel.active{display:block}
      .hk-note{padding:12px;border:1px solid #765f2a;background:#2a2413;border-radius:12px;color:#ffe29a;font-size:11px;line-height:1.45;margin-bottom:12px}
      .hk-card{padding:12px;border:1px solid #2e435c;background:#0e1928;border-radius:12px;margin-bottom:8px}
      .hk-race{font-size:13px;font-weight:950;color:#fff}
      .hk-meta{margin-top:5px;color:#9eb3ca;font-size:10px;line-height:1.45}
      .hk-source{display:inline-block;margin-top:10px;color:#8dc8ff;font-size:10px;font-weight:900;text-decoration:none}
    `;
    document.head.appendChild(style);
  }

  function findHost() {
    return document.querySelector('main') || document.querySelector('.app') || document.body;
  }

  function buildShell() {
    if (document.getElementById('hkRacingPanel')) return;
    addStyles();
    const host = findHost();
    const originalChildren = [...host.children];

    const switcher = document.createElement('div');
    switcher.className = 'hk-switcher';
    switcher.innerHTML = `
      <button type="button" class="hk-tab-btn active" data-racing-tab="au">AUSTRALIA · V11</button>
      <button type="button" class="hk-tab-btn" data-racing-tab="hk">HONG KONG · SHA TIN</button>`;

    const au = document.createElement('div');
    au.id = 'auRacingPanel';
    au.className = 'hk-panel active';
    originalChildren.forEach(node => au.appendChild(node));

    const hk = document.createElement('div');
    hk.id = 'hkRacingPanel';
    hk.className = 'hk-panel';
    hk.innerHTML = `
      <section style="margin:0 0 12px">
        <div style="font-size:10px;color:#7f96ae;font-weight:950;letter-spacing:.08em">HONG KONG</div>
        <h2 style="margin:5px 0 3px;font-size:20px">SHA TIN · SUN 6 SEP</h2>
        <div style="font-size:11px;color:#9eb3ca">10 races · Turf A Course · times shown in Perth/Hong Kong time</div>
      </section>
      <div id="hkRacingContent"><div class="hk-note">Loading official Sha Tin meeting…</div></div>`;

    host.appendChild(switcher);
    host.appendChild(au);
    host.appendChild(hk);

    switcher.addEventListener('click', event => {
      const btn = event.target.closest('[data-racing-tab]');
      if (!btn) return;
      const tab = btn.dataset.racingTab;
      switcher.querySelectorAll('.hk-tab-btn').forEach(x => x.classList.toggle('active', x === btn));
      au.classList.toggle('active', tab === 'au');
      hk.classList.toggle('active', tab === 'hk');
      history.replaceState(null, '', tab === 'hk' ? '#hong-kong' : location.pathname + location.search);
    });

    if (location.hash === '#hong-kong') switcher.querySelector('[data-racing-tab="hk"]')?.click();
  }

  async function loadData() {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    try {
      const response = await fetch(DATA_URL, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const m = data.meeting || {};
      root.innerHTML = `
        <div class="hk-note"><b>SEPARATE SYSTEM:</b> ${esc(data.systemMessage || '')}</div>
        <div style="margin-bottom:10px;font-size:11px;color:#b7c7d9"><b>${esc(m.status || '')}</b> · ${esc(m.venue || 'Sha Tin')} · ${esc(m.track || 'Turf')} ${esc(m.course || 'A')} Course</div>
        ${(data.races || []).map(r => `
          <div class="hk-card">
            <div class="hk-race">HK R${esc(r.race)} · ${esc(r.timeHkt || 'TBC')} · ${esc(r.name || 'Race')}</div>
            <div class="hk-meta">${esc(r.class || '')} · ${esc(r.distanceM)}m · <b>NO V11 AU BET SIGNAL</b></div>
          </div>`).join('')}
        <a class="hk-source" href="${esc(m.officialSourceUrl || '#')}" target="_blank" rel="noopener">OPEN OFFICIAL HKJC RACE CARD ↗</a>`;
    } catch (error) {
      root.innerHTML = `<div class="hk-note">Hong Kong meeting data could not be loaded. Do not place a Hong Kong system bet from this tab until the data is restored.</div>`;
    }
  }

  function start() {
    buildShell();
    loadData();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
