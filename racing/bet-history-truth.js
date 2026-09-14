(() => {
  'use strict';

  const nativeFetch = window.fetch.bind(window);
  const TARGET = '/functions/v1/racing-execution';
  let auditRows = [];
  let renderQueued = false;

  const money = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)) : '—';
  const odds = v => Number.isFinite(Number(v)) && Number(v) > 1 ? '$' + Number(v).toFixed(2) : '—';
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const horseKey = v => String(v || '').toUpperCase().replace(/\([^)]*\)/g,' ').replace(/\b(?:NZ|AUS|EM\d+)\b/g,' ').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');

  function isSystemHistoryRequest(input, init) {
    if (String(init?.method || 'GET').toUpperCase() !== 'GET') return false;
    const raw = typeof input === 'string' ? input : input?.url;
    if (!raw) return false;
    try {
      const u = new URL(raw, window.location.href);
      return u.pathname.includes(TARGET) && u.searchParams.get('mode') === 'system';
    } catch {
      return false;
    }
  }

  function signalOutcome(row) {
    if (!row?.winnerName || !row?.horse) return null;
    return horseKey(row.winnerName) === horseKey(row.horse) ? 'WIN' : 'LOSS';
  }

  function stateAfter(row) {
    if (Number.isFinite(Number(row?.stateAfter))) return Number(row.stateAfter);
    const before = Number(row?.stateBefore);
    const result = signalOutcome(row);
    if (!Number.isFinite(before) || !result) return null;
    return result === 'WIN' ? 0 : before + 1;
  }

  function isConfirmedBet(row) {
    return String(row?.executionStatus || '').toUpperCase() === 'CONFIRMED' && Number(row?.acceptedStake) > 0 && Number(row?.acceptedPrice) >= 3;
  }

  function normaliseAudit(row) {
    const outcome = signalOutcome(row);
    return {
      ...row,
      systemBet:false,
      auditStatus:String(row?.executionStatus || 'UNCONFIRMED').toUpperCase(),
      signalOutcome:outcome,
      stateAfter:stateAfter(row),
      cashPl:0,
      finalDisplay:'NO BET'
    };
  }

  window.fetch = async function(input, init) {
    const response = await nativeFetch(input, init);
    if (!isSystemHistoryRequest(input, init) || !response.ok) return response;
    try {
      const body = await response.clone().json();
      if (!body?.ok || !Array.isArray(body.history)) return response;

      const kept = [];
      const audit = [];
      for (const row of body.history) {
        if (row?.source === 'LIVE_SYSTEM_SIGNAL' && !isConfirmedBet(row)) audit.push(normaliseAudit(row));
        else kept.push(row);
      }
      auditRows = audit.sort((a,b) => String(b.date).localeCompare(String(a.date)) || String(b.race).localeCompare(String(a.race)));
      window.__MITCHELL_SIGNAL_AUDIT = auditRows.slice();
      body.history = kept;
      queueAuditRender();

      const headers = new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      headers.set('cache-control','no-store');
      return new Response(JSON.stringify(body), { status:response.status, statusText:response.statusText, headers });
    } catch (e) {
      console.warn('history truth filter', e);
      return response;
    }
  };

  function exactNote(row) {
    if (row?.date === '2026-09-12' && String(row?.race).toUpperCase() === 'PR2') {
      return 'Fully reconciled: the temporary V11 lock was revoked before execution when OLAF THE SNOWMAN moved from $3.00 to $2.90, below the $3.00 minimum. No accepted wager was confirmed.';
    }
    if (String(row?.executionStatus || '').toUpperCase() === 'NOT_PLACED') {
      return 'Final execution status is NOT PLACED. It is excluded from system-bet totals and cash P/L.';
    }
    return 'No accepted wager is recorded. This remains an audit-only signal and is excluded from system-bet totals and cash P/L.';
  }

  function rowHtml(row) {
    const outcome = row.signalOutcome || '—';
    const winner = row.winnerName ? `${row.winnerNumber ? '#' + row.winnerNumber + ' ' : ''}${row.winnerName}` : '—';
    const before = Number.isFinite(Number(row.stateBefore)) ? Number(row.stateBefore) : null;
    const after = Number.isFinite(Number(row.stateAfter)) ? Number(row.stateAfter) : null;
    const state = before === null ? '—' : `${before}${after === null ? '' : ' → ' + after}`;
    return `<article class="signal-audit-row">
      <div class="signal-audit-title"><div><span>${esc(row.date || '')} · ${esc(row.race || '')}</span><strong>${esc(row.horse || 'Signal horse')}</strong><small>${esc(row.venue || '')}</small></div><b>NO BET</b></div>
      <div class="signal-audit-grid">
        <div><span>SIGNAL ONLY</span><strong>${money(row.modelStake)} @ ${odds(row.signalPrice)}</strong></div>
        <div><span>EXECUTION</span><strong>${esc(row.auditStatus || 'UNCONFIRMED')}</strong></div>
        <div><span>STATE</span><strong>${esc(state)}</strong></div>
        <div><span>SIGNAL OUTCOME</span><strong>${esc(outcome)}</strong></div>
        <div><span>WINNER</span><strong>${esc(winner)}</strong></div>
        <div><span>ACTUAL CASH P/L</span><strong>A$0</strong></div>
      </div>
      <p>${esc(exactNote(row))}</p>
    </article>`;
  }

  function ensureStyle() {
    if (document.getElementById('signalAuditStyle')) return;
    const s = document.createElement('style');
    s.id = 'signalAuditStyle';
    s.textContent = `
      .signal-audit{margin:12px 0;padding:14px;border-radius:15px;border:1px solid #36516e;background:linear-gradient(145deg,#0b1726,#101c2d)}
      .signal-audit-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}
      .signal-audit-head span{display:block;color:#83a2c0;font-size:8px;font-weight:950;letter-spacing:.11em}.signal-audit-head strong{display:block;color:#fff;font-size:16px;margin-top:3px}.signal-audit-head b{padding:6px 8px;border-radius:999px;background:#2d1d0c;border:1px solid #8b641e;color:#ffd879;font-size:8px;white-space:nowrap}
      .signal-audit-row{padding:11px;border-radius:12px;background:#091522;border:1px solid #253c55;margin-top:8px}.signal-audit-title{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.signal-audit-title span{display:block;color:#7f96ad;font-size:8px;font-weight:900}.signal-audit-title strong{display:block;color:#fff;font-size:13px;margin-top:2px}.signal-audit-title small{display:block;color:#7f96ad;font-size:8px;margin-top:2px}.signal-audit-title b{padding:5px 7px;border-radius:999px;background:#173727;border:1px solid #2f7656;color:#7df0b6;font-size:8px}.signal-audit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}.signal-audit-grid div{padding:7px 8px;border-radius:9px;background:#101e2e}.signal-audit-grid span{display:block;color:#7189a1;font-size:7px;font-weight:950}.signal-audit-grid strong{display:block;color:#f3f8fd;font-size:10px;margin-top:2px}.signal-audit-row p{margin:8px 0 0;color:#9db0c4;font-size:9px;line-height:1.45}
      @media(max-width:560px){.signal-audit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(s);
  }

  function renderAudit() {
    renderQueued = false;
    ensureStyle();
    const page = document.getElementById('premiumPage');
    const ledger = page?.querySelector('.sbh');
    if (!ledger) return;
    ledger.querySelector('#mitchellSignalAudit')?.remove();
    if (!auditRows.length) return;

    const panel = document.createElement('section');
    panel.id = 'mitchellSignalAudit';
    panel.className = 'signal-audit';
    panel.innerHTML = `<div class="signal-audit-head"><div><span>LIVE SIGNAL AUDIT · NOT SYSTEM BETS</span><strong>${auditRows.length} signal${auditRows.length === 1 ? '' : 's'} excluded from bet totals</strong></div><b>NO CASH BET</b></div>${auditRows.map(rowHtml).join('')}`;
    const head = ledger.querySelector('.sh');
    if (head?.nextSibling) ledger.insertBefore(panel, head.nextSibling);
    else ledger.appendChild(panel);
  }

  function queueAuditRender() {
    if (renderQueued) return;
    renderQueued = true;
    setTimeout(renderAudit, 0);
  }

  function start() {
    ensureStyle();
    const root = document.getElementById('premiumApp') || document.body;
    new MutationObserver(queueAuditRender).observe(root,{childList:true,subtree:true});
    document.addEventListener('click', e => {
      if (e.target?.closest?.('[data-premium-tab="history"]')) setTimeout(renderAudit,80);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start,{once:true});
  else start();
})();
