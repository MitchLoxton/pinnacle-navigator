/* MITCHELL Racing · Holo Deck · v1.12.0
   Presentation layer that sits on top of premium-ui.js renders. It reads, never writes:
   - keeps the decision-card reactor animations phase-continuous across re-renders,
   - draws the 3D Stream Radar from current.json (tower height = state, CORE = beacon),
   - live jump countdowns from the verified jumpAt already in current.json,
   - holographic tab transitions and a sliding nav glow,
   - a BET NOW beacon on every non-Home tab. It mirrors premium-ui readAction()'s
     bet condition exactly (online AND (decisionCard has .bet-now OR title === 'BET NOW'))
     and only points you to Home; it never creates or alters an instruction. */
(() => {
  'use strict';

  const REDUCED = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const money = new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 });

  /* ---------------------------------------------------------------- phase continuity */
  function syncPhase(scope){
    if (!scope || REDUCED.matches) return;
    const now = performance.now() / 1000;
    scope.querySelectorAll('.hc-anim').forEach(el => {
      const durs = getComputedStyle(el).animationDuration.split(',').map(s => parseFloat(s) * (/ms\s*$/.test(s) ? 0.001 : 1));
      const base = parseFloat(el.dataset.delay || '0') || 0;
      el.style.animationDelay = durs.map(d => d > 0 ? `${(-((now + base) % d)).toFixed(3)}s` : '0s').join(',');
    });
  }

  /* ---------------------------------------------------------------- tone burst */
  let lastTone = null;
  function toneCheck(){
    const d = document.querySelector('#premiumPage .premium-decision');
    if (!d) return;
    const tone = ['bet', 'no', 'ready', 'wait'].find(t => d.classList.contains(t)) || null;
    if (tone && lastTone && tone !== lastTone && !REDUCED.matches) {
      d.classList.add('hc-burst');
      setTimeout(() => d.classList.remove('hc-burst'), 1500);
    }
    if (tone) lastTone = tone;
  }

  /* ---------------------------------------------------------------- jump countdowns */
  function rel(ms){
    const a = Math.abs(ms), h = Math.floor(a / 3600000), m = Math.floor((a % 3600000) / 60000), s = Math.floor((a % 60000) / 1000);
    return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
  }
  function tickJumps(){
    document.querySelectorAll('.pc-jump[data-jump-at]').forEach(el => {
      const at = Date.parse(el.dataset.jumpAt || '');
      const out = el.querySelector('.pc-jump-rel'); if (!out) return;
      if (!Number.isFinite(at)) { out.textContent = ''; el.classList.remove('soon', 'past'); return; }
      const d = at - Date.now();
      el.classList.toggle('soon', d > 0 && d <= 30 * 60000);
      el.classList.toggle('past', d <= 0);
      out.textContent = d > 0 ? `in ${rel(d)}` : d > -5 * 60000 ? 'jumping now' : `jumped ${rel(-d)} ago`;
    });
  }

  /* ---------------------------------------------------------------- stream radar */
  function StreamRadar(canvas){
    const ctx = canvas.getContext('2d');
    const RINGS = { Perth:{ r:.40, off:0, code:'PR' }, Sydney:{ r:.66, off:2 * Math.PI / 21, code:'SR' }, Melbourne:{ r:.92, off:4 * Math.PI / 21, code:'MR' } };
    const EL = 30 * Math.PI / 180, SE = Math.sin(EL), CE = Math.cos(EL), F = 3.4;
    const FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,sans-serif';
    let W = 0, H = 0, cx = 0, cy = 0, R = 0, towers = [], yaw = -0.35, vel = 0, last = 0, running = false, raf = 0, hold = 0, t0 = performance.now();
    let sel = null, hits = [];
    function size(){
      const r = canvas.getBoundingClientRect();
      if (!r.width) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2; cy = H * 0.64; R = Math.min(W * 0.47, H * 0.95);
      return true;
    }
    function setData(rows, watch){
      const ref = new Map((watch || []).map(w => [String(w?.race || '').toUpperCase(), w]));
      towers = [];
      Object.entries(RINGS).forEach(([region, cfg]) => {
        for (let k = 1; k <= 7; k++) {
          const code = cfg.code + k;
          const row = (rows || []).find(x => String(x?.race || '').toUpperCase() === code);
          const a = cfg.off + (k - 1) * 2 * Math.PI / 7;
          const st = row && row.state !== null && row.state !== undefined && Number.isFinite(Number(row.state)) ? Number(row.state) : null;
          towers.push({ code, region, venue:String(row?.venue || ''), state:st, core:row?.corePotential === true, ref:ref.get(code)?.coreBaseReferenceAud ?? null,
            x:Math.cos(a) * cfg.r, y:Math.sin(a) * cfg.r, h:st === null ? 0.025 : 0.05 + Math.min(st, 12) * 0.066 });
        }
      });
      if (sel) sel = towers.find(t => t.code === sel.code) || null;
    }
    function P(x, y, z, useYaw = true){
      const c = useYaw ? Math.cos(yaw) : 1, s = useYaw ? Math.sin(yaw) : 0;
      const xr = x * c - y * s, yr = x * s + y * c, up = yr * SE + z * CE, depth = yr * CE - z * SE, k = F / (F + depth);
      return [cx + xr * k * R, cy - up * k * R, depth, k];
    }
    function ring(r, style, width, dash){
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2, p = P(Math.cos(a) * r, Math.sin(a) * r, 0); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.strokeStyle = style; ctx.lineWidth = width; ctx.setLineDash(dash || []); ctx.stroke(); ctx.setLineDash([]);
    }
    function poly(pts, fill, stroke){
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    function pill(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function label(x, y, a, b, hot){
      ctx.font = `800 12px ${FONT}`; const w1 = ctx.measureText(a).width;
      ctx.font = `600 10px ${FONT}`; const w2 = ctx.measureText(b).width;
      const bw = Math.max(w1, w2) + 18, bx = Math.max(4, Math.min(W - bw - 4, x - bw / 2)), by = Math.max(4, y - 32);
      ctx.fillStyle = 'rgba(12,16,48,.9)'; ctx.strokeStyle = hot ? 'rgba(206,192,255,.95)' : 'rgba(143,243,255,.7)'; ctx.lineWidth = 1;
      pill(bx, by, bw, 31, 9); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F4F1FF'; ctx.font = `800 12px ${FONT}`; ctx.fillText(a, bx + bw / 2, by + 14);
      ctx.fillStyle = hot ? '#CFC4FF' : '#BDEFFA'; ctx.font = `600 10px ${FONT}`; ctx.fillText(b, bx + bw / 2, by + 26);
      return by + 31;
    }
    function draw(now){
      if (!W) return;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, R * 1.08);
      g.addColorStop(0, 'rgba(143,243,255,.17)'); g.addColorStop(.55, 'rgba(120,110,255,.07)'); g.addColorStop(1, 'rgba(7,11,31,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.08, R * 1.08 * SE, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ring(1.04, 'rgba(185,164,255,.55)', 1.4);
      ring(1.11, 'rgba(143,243,255,.18)', 1, [2, 7]);
      Object.values(RINGS).forEach(cfg => ring(cfg.r, 'rgba(143,243,255,.22)', 1));
      for (let i = 0; i < 24; i++) {
        const a = i / 24 * Math.PI * 2, p0 = P(Math.cos(a) * .2, Math.sin(a) * .2, 0), p1 = P(Math.cos(a) * 1.04, Math.sin(a) * 1.04, 0);
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.strokeStyle = 'rgba(143,243,255,.06)'; ctx.lineWidth = 1; ctx.stroke();
      }
      // scanning sweep on the table
      const sw = (t * 0.9) % (Math.PI * 2);
      ctx.beginPath(); const s0 = P(0, 0, 0); ctx.moveTo(s0[0], s0[1]);
      for (let i = 0; i <= 12; i++) { const a = sw - i * 0.045, p = P(Math.cos(a) * 1.04, Math.sin(a) * 1.04, 0); ctx.lineTo(p[0], p[1]); }
      ctx.closePath(); ctx.fillStyle = 'rgba(143,243,255,.07)'; ctx.fill();
      const pc = P(0, 0, 0), eg = ctx.createRadialGradient(pc[0], pc[1], 0, pc[0], pc[1], R * .17);
      eg.addColorStop(0, `rgba(233,253,255,${.45 + .15 * Math.sin(t * 2)})`); eg.addColorStop(1, 'rgba(143,243,255,0)');
      ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(pc[0], pc[1], R * .17, R * .17 * SE, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      const list = towers.map(tw => ({ tw, d:P(tw.x, tw.y, 0)[2] })).sort((a, b) => b.d - a.d);
      hits = [];
      ctx.globalCompositeOperation = 'lighter';
      list.forEach(({ tw }) => {
        const w = 0.042, z = tw.h, pulse = tw.core ? 0.5 + 0.5 * Math.sin(t * 3 + tw.x * 9) : 0, on = sel === tw;
        const c = [[-w, -w], [w, -w], [w, w], [-w, w]].map(([dx, dy]) => [tw.x + dx, tw.y + dy]);
        const b = c.map(([x, y]) => P(x, y, 0)), tp = c.map(([x, y]) => P(x, y, z));
        const faces = [0, 1, 2, 3].map(i => ({ i, d:(b[i][2] + b[(i + 1) % 4][2]) / 2 })).sort((p, q) => q.d - p.d);
        const top = P(tw.x, tw.y, z), base = P(tw.x, tw.y, 0);
        const grad = ctx.createLinearGradient(0, base[1], 0, top[1]);
        if (tw.core) { grad.addColorStop(0, 'rgba(185,164,255,.2)'); grad.addColorStop(1, `rgba(236,228,255,${.42 + .2 * pulse})`); }
        else if (tw.state === null) { grad.addColorStop(0, 'rgba(160,176,255,.04)'); grad.addColorStop(1, 'rgba(160,176,255,.08)'); }
        else { grad.addColorStop(0, 'rgba(143,243,255,.05)'); grad.addColorStop(1, on ? 'rgba(200,240,255,.45)' : 'rgba(160,200,255,.26)'); }
        const edge = tw.core ? `rgba(233,226,255,${.65 + .3 * pulse})` : on ? 'rgba(240,253,255,.98)' : 'rgba(170,236,255,.42)';
        faces.forEach(({ i }) => poly([b[i], b[(i + 1) % 4], tp[(i + 1) % 4], tp[i]], grad, edge));
        poly(tp, tw.core ? `rgba(255,255,255,${.5 + .3 * pulse})` : on ? 'rgba(240,253,255,.7)' : 'rgba(210,248,255,.32)', edge);
        if (tw.core) {
          const len = 64 * top[3];
          const bg = ctx.createLinearGradient(0, top[1], 0, top[1] - len);
          bg.addColorStop(0, 'rgba(236,228,255,.75)'); bg.addColorStop(1, 'rgba(185,164,255,0)');
          ctx.fillStyle = bg; ctx.fillRect(top[0] - 3 * top[3], top[1] - len, 6 * top[3], len);
          const ph = (t * 0.8 + tw.x) % 1, pr = 0.06 + 0.08 * ph;
          ctx.beginPath(); ctx.ellipse(base[0], base[1], pr * R * base[3], pr * R * base[3] * SE, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(185,164,255,${.8 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.stroke();
          for (let k = 0; k < 3; k++) {
            const q = (t * 0.5 + k / 3 + tw.y) % 1;
            ctx.fillStyle = `rgba(236,228,255,${.7 * (1 - q)})`;
            ctx.beginPath(); ctx.arc(top[0] + Math.sin((q + k) * 6) * 5, top[1] - q * len * 1.1, 1.3, 0, Math.PI * 2); ctx.fill();
          }
        }
        hits.push({ tw, x:top[0], y:top[1], bx:base[0], by:base[1], k:top[3] });
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `700 9.5px ${FONT}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      Object.entries(RINGS).forEach(([name, cfg]) => {
        const p = P(0, -cfg.r, 0, false);
        ctx.strokeStyle = 'rgba(7,11,31,.85)'; ctx.lineWidth = 4; ctx.strokeText(name.toUpperCase(), p[0], p[1] + 14);
        ctx.fillStyle = 'rgba(190,198,236,.92)'; ctx.fillText(name.toUpperCase(), p[0], p[1] + 14);
      });
      hits.filter(h => h.tw.core || h.tw === sel).forEach(h => {
        const st = h.tw.state === null ? 'state unknown' : `state ${h.tw.state}`;
        label(h.x, h.y - (h.tw.core ? 66 * h.k : 10), h.tw.code, h.tw.core ? `CORE · ${st}` : st, h.tw.core);
      });
    }
    let lastDraw = 0;
    function loop(now){
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - lastDraw < 32) return; // ~30fps keeps race-day battery use low
      const dt = Math.min(0.08, (now - (last || now)) / 1000); last = now; lastDraw = now;
      if (Math.abs(vel) > 0.0004) { yaw += vel * 2; vel *= 0.87; }
      else if (now > hold) yaw += dt * 0.11;
      draw(now);
    }
    function start(){ if (REDUCED.matches) { draw(performance.now()); return; } if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop(){ running = false; cancelAnimationFrame(raf); }
    function pick(px, py){
      let best = null, bd = 26;
      hits.forEach(h => {
        const dx = h.x - h.bx, dy = h.y - h.by, L = dx * dx + dy * dy || 1;
        const u = Math.max(0, Math.min(1, ((px - h.bx) * dx + (py - h.by) * dy) / L));
        const d = Math.hypot(px - (h.bx + u * dx), py - (h.by + u * dy));
        if (d < bd) { bd = d; best = h.tw; }
      });
      return best;
    }
    // drag to spin, tap to select
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x:e.clientX, y:e.clientY, t:performance.now(), moved:false, lx:e.clientX }; vel = 0; hold = performance.now() + 3500; });
    canvas.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - down.lx; down.lx = e.clientX;
      if (Math.abs(e.clientX - down.x) > 6) { down.moved = true; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} }
      if (down.moved) { yaw -= dx * 0.012; vel = -dx * 0.012; if (REDUCED.matches) draw(performance.now()); }
    });
    const end = e => {
      if (!down) return;
      if (!down.moved) {
        const r = canvas.getBoundingClientRect(), tw = pick(e.clientX - r.left, e.clientY - r.top);
        sel = tw && sel !== tw ? tw : null;
        canvas.dispatchEvent(new CustomEvent('radar-select', { detail:sel }));
        draw(performance.now());
      }
      down = null; hold = performance.now() + 3500;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', () => { down = null; });
    return { size, setData, start, stop, draw:() => draw(performance.now()), get towers(){ return towers; } };
  }

  let radar = null, radarWrap = null, radarIO = null, radarVisible = false;
  function radarDetail(tw){
    const box = radarWrap?.querySelector('.hr-detail'); if (!box) return;
    if (!tw) { box.innerHTML = '<span>Tap a tower to see its race slot.</span>'; return; }
    const st = tw.state === null ? 'unknown' : tw.state;
    box.innerHTML = `<b>${esc(tw.code)}</b><span>${esc(tw.venue || tw.region)}</span><span>State ${esc(st)}${tw.state > 0 ? ` (favourite lost ${esc(tw.state)} in a row)` : tw.state === 0 ? ' (favourite won last time)' : ''}</span>${tw.core ? `<span class="hot">CORE watch race${tw.ref !== null && tw.ref !== undefined ? `, reference stake ${esc(money.format(Number(tw.ref)))}` : ''}. Not a bet unless the top card says BET NOW.</span>` : ''}`;
  }
  function mountRadar(){
    const mount = $('holoRadarMount');
    if (!mount) { radar?.stop(); return; }
    const data = window.__MITCHELL_BASE_DATA;
    if (!radarWrap) {
      radarWrap = document.createElement('div');
      radarWrap.className = 'hr-wrap';
      radarWrap.innerHTML = '<canvas class="hr-canvas" role="img" aria-label="Stream radar: 21 race slots as towers. Taller towers mean a longer losing run for the favourite; glowing beacons are CORE races."></canvas><div class="hr-detail" aria-live="polite"></div>';
      const canvas = radarWrap.querySelector('canvas');
      radar = StreamRadar(canvas);
      canvas.addEventListener('radar-select', e => radarDetail(e.detail));
      radarIO = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => { radarVisible = en.isIntersecting; radarVisible && !document.hidden ? radar.start() : radar.stop(); }), { threshold:0.05 }) : null;
      radarIO?.observe(canvas);
    }
    if (radarWrap.parentNode !== mount) mount.appendChild(radarWrap);
    radar.setData(data?.stateTracklist || [], data?.watchlist || []);
    requestAnimationFrame(() => { if (radar.size()) { radar.draw(); if (radarVisible || !radarIO) radar.start(); } });
    if (!radarWrap.querySelector('.hr-detail').textContent) radarDetail(null);
  }

  /* ---------------------------------------------------------------- nav glow + transitions */
  let prevGlow = null, pendingScan = false;
  function glowFor(nav){
    const active = nav?.querySelector('button.active');
    if (!nav || !active) return null;
    return { x:active.offsetLeft, w:active.offsetWidth };
  }
  function placeGlow(animateFrom){
    const nav = document.querySelector('.premium-nav'); if (!nav) return;
    let glow = nav.querySelector('.nav-glow');
    if (!glow) { glow = document.createElement('span'); glow.className = 'nav-glow'; glow.setAttribute('aria-hidden', 'true'); nav.prepend(glow); nav.classList.add('has-glow'); }
    const to = glowFor(nav); if (!to) { glow.style.opacity = '0'; return; }
    glow.style.opacity = '1';
    if (animateFrom && !REDUCED.matches) {
      glow.style.transition = 'none';
      glow.style.width = animateFrom.w + 'px'; glow.style.transform = `translateX(${animateFrom.x}px)`;
      void glow.offsetWidth;
      glow.style.transition = '';
    }
    glow.style.width = to.w + 'px'; glow.style.transform = `translateX(${to.x}px)`;
  }
  function scanIn(){
    const page = $('premiumPage'); if (!page || REDUCED.matches) return;
    page.classList.remove('pg-scan'); void page.offsetWidth; page.classList.add('pg-scan');
    setTimeout(() => page.classList.remove('pg-scan'), 700);
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest?.('.premium-nav button');
    if (!btn) return;
    prevGlow = glowFor(btn.closest('.premium-nav'));
    pendingScan = !btn.classList.contains('active');
    setTimeout(() => { placeGlow(prevGlow); if (pendingScan) scanIn(); pendingScan = false; updateBeacon(); }, 0);
  }, true);

  /* ---------------------------------------------------------------- BET NOW beacon */
  let beacon = null;
  function isBetNow(){
    if (!navigator.onLine) return false; // premium-ui readAction() returns OFFLINE first
    const card = $('decisionCard');
    const title = String($('decisionTitle')?.textContent || '').trim().toUpperCase();
    return !!card && (card.classList.contains('bet-now') || title === 'BET NOW');
  }
  function updateBeacon(){
    if (!beacon) {
      beacon = document.createElement('button');
      beacon.type = 'button'; beacon.id = 'holoBeacon';
      beacon.addEventListener('click', () => document.querySelector('.premium-nav [data-premium-tab="home"]')?.click());
      document.body.appendChild(beacon);
    }
    const onHome = !!document.querySelector('.premium-nav [data-premium-tab="home"].active');
    const show = isBetNow() && !onHome;
    if (show) {
      const horse = String(document.querySelector('#lockedBets .locked-bet:not(.lock-blocked) .horse-name, #lockedBets .horse-name')?.textContent || '').trim();
      const html = `<span class="hb-word">BET NOW</span><span class="hb-sub">${horse ? esc(horse) + ' · ' : ''}tap to open Home for the exact instruction</span>`;
      if (beacon.innerHTML !== html) beacon.innerHTML = html;
      beacon.setAttribute('role', 'alert');
    }
    beacon.classList.toggle('on', show);
    beacon.hidden = !show;
  }

  /* ---------------------------------------------------------------- render hook */
  function onRender(){
    const app = $('premiumApp'); if (!app) return;
    syncPhase(app);
    toneCheck();
    tickJumps();
    mountRadar();
    placeGlow(null);
    updateBeacon();
  }
  function start(){
    const app = $('premiumApp');
    if (!app) { setTimeout(start, 120); return; }
    new MutationObserver(onRender).observe(app, { childList:true });
    const card = $('decisionCard'), locked = $('lockedBets');
    const mo = new MutationObserver(updateBeacon);
    if (card) mo.observe(card, { attributes:true, subtree:true, childList:true, characterData:true });
    if (locked) mo.observe(locked, { subtree:true, childList:true, characterData:true });
    window.addEventListener('online', updateBeacon); window.addEventListener('offline', updateBeacon);
    window.addEventListener('mitchell-base-ready', () => setTimeout(mountRadar, 0));
    window.addEventListener('resize', () => { placeGlow(null); if (radar && $('holoRadarMount') && radar.size()) radar.draw(); });
    document.addEventListener('visibilitychange', () => { if (!radar) return; document.hidden ? radar.stop() : (radarVisible && $('holoRadarMount') && radar.start()); });
    setInterval(() => { if (!document.hidden) { tickJumps(); updateBeacon(); } }, 1000);
    onRender();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();
