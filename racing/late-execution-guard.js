(() => {
  'use strict';

  const LIVE_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-tab-live';
  const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrbWFja3RjZmh1YnN1bXdyeWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTY4OTQsImV4cCI6MjEwMjAzMjg5NH0.EUZ5Xd6rLsxoZIpfPwVzH-TUcz1t8-j1DVZ6ES8A1zk';
  const FAST_MS = 5000;
  const EXEC_OPEN = 45;
  const TOO_LATE = 5;
  const MIN_PRICE = 3;
  let busy = false;
  let blockedByGuard = false;

  const $ = id => document.getElementById(id);
  const raceCode = v => String(v || '').trim().toUpperCase();
  const horseKey = v => String(v || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\bNZ\b$/, '').trim().replace(/\s+/g, ' ');
  const odds = v => Number.isFinite(Number(v)) ? '$' + Number(v).toFixed(2) : '—';

  function nearJumpOnScreen() {
    return [...document.querySelectorAll('#watchlist .watch-race')].some(el => /\b\d+s to jump\b/i.test(el.textContent || ''));
  }

  function hasLockedCard() {
    return Boolean(document.querySelector('#lockedBets .locked-bet'));
  }

  function requests() {
    const watch = Array.isArray(window.__MITCHELL_BASE_DATA?.watchlist) ? window.__MITCHELL_BASE_DATA.watchlist : [];
    return watch.map(item => ({
      race: raceCode(item?.race || item?.code),
      date: item?.date,
      venue: item?.venue || item?.region || ''
    })).filter(x => x.race && x.date && x.venue);
  }

  async function fetchLive(reqs) {
    const r = await fetch(LIVE_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON,
        Authorization: `Bearer ${ANON}`
      },
      body: JSON.stringify({ requests: reqs })
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok || body?.ok !== true || !Array.isArray(body.results)) throw new Error(body?.error || `Late guard HTTP ${r.status}`);
    return body.results;
  }

  function lockedRunnerPrice(result, horse) {
    const key = horseKey(horse);
    const runner = (Array.isArray(result?.runners) ? result.runners : []).find(r => !r?.scratched && horseKey(r?.name) === key);
    const p = Number(runner?.price);
    return Number.isFinite(p) ? p : null;
  }

  function block(title, detail, label) {
    blockedByGuard = true;
    const card = $('decisionCard');
    const bottom = $('bottomCommand');
    if (card) card.className = 'decision-card blocked';
    if (bottom) bottom.className = 'bottom-command blocked';
    if ($('decisionKicker')) $('decisionKicker').textContent = 'LATE EXECUTION GUARD · BLOCKED';
    if ($('decisionTitle')) $('decisionTitle').textContent = title;
    if ($('decisionMessage')) $('decisionMessage').textContent = detail;
    if ($('bottomLabel')) $('bottomLabel').textContent = label;
    if ($('bottomText')) $('bottomText').textContent = detail;
    const badge = document.querySelector('#lockedBets .bet-badge');
    if (badge) badge.textContent = title;
    document.title = 'DO NOT PLACE · MITCHELL Racing';
  }

  function verify(result) {
    const d = result?.decision || {};
    if (d.status !== 'BET_LOCKED') return { ok: false, silent: true };

    const lead = Number(result?.leadSeconds);
    if (Number.isFinite(lead) && lead > EXEC_OPEN) {
      return { ok: false, title: 'DO NOT PLACE — EARLY LOCK', label: 'EARLY LOCK BLOCKED', detail: `This lock is ${Math.ceil(lead)}s before jump. Production v1.6.6 only permits a new placement inside the final ${EXEC_OPEN}s.` };
    }
    if (!Number.isFinite(lead) || lead <= TOO_LATE || result?.closed === true) {
      return { ok: false, title: 'DO NOT PLACE — TOO LATE', label: 'TOO LATE', detail: 'The safe placement window has closed. Do not chase the market.' };
    }

    const favs = Array.isArray(result?.favourites) ? result.favourites : [];
    if (result?.favouriteType !== 'SINGLE' || !favs[0]?.name) {
      return { ok: false, title: 'DO NOT PLACE — FAVOURITE UNVERIFIED', label: 'FAVOURITE UNVERIFIED', detail: 'There is no single verified live favourite right now. Do not place the saved lock.' };
    }
    if (horseKey(favs[0].name) !== horseKey(d.horse)) {
      return { ok: false, title: 'DO NOT PLACE — FAVOURITE CHANGED', label: 'FAVOURITE CHANGED', detail: `${d.horse} is no longer the verified live favourite. Do not place the old lock.` };
    }

    const live = lockedRunnerPrice(result, d.horse);
    const min = Math.max(MIN_PRICE, Number(d.minExec) || MIN_PRICE);
    if (!Number.isFinite(live)) {
      return { ok: false, title: 'DO NOT PLACE — PRICE UNVERIFIED', label: 'PRICE UNVERIFIED', detail: `A current fixed-WIN quote for ${d.horse} cannot be verified. Do not place.` };
    }
    if (live < min) {
      return { ok: false, title: 'DO NOT PLACE — PRICE TOO LOW', label: 'PRICE TOO LOW', detail: `${d.horse} is now ${odds(live)}, below the ${odds(min)} live minimum. Do not place.` };
    }

    return { ok: true };
  }

  async function fastCheck() {
    if (busy || document.visibilityState === 'hidden') return;

    // Before a lock, force the main live engine to refresh every 5s in the final minute.
    if (nearJumpOnScreen() && !hasLockedCard()) {
      window.dispatchEvent(new Event('mitchell-refresh-live'));
      return;
    }

    if (!hasLockedCard()) return;
    const reqs = requests();
    if (!reqs.length) return;

    busy = true;
    try {
      const results = await fetchLive(reqs);
      const locked = results.find(r => r?.decision?.status === 'BET_LOCKED' && !['COMPLETE', 'CLOSED_RESULT_PENDING'].includes(r?.phase));
      if (!locked) {
        block('DO NOT PLACE — LOCK NOT VERIFIED', 'The live server no longer verifies an active BET LOCKED instruction.', 'LOCK NOT VERIFIED');
        return;
      }
      const check = verify(locked);
      if (!check.ok && !check.silent) {
        block(check.title, check.detail, check.label);
        return;
      }
      if (check.ok && blockedByGuard) {
        blockedByGuard = false;
        window.dispatchEvent(new Event('mitchell-refresh-live'));
      }
    } catch (e) {
      block('DO NOT PLACE — LIVE CHECK FAILED', 'The final live favourite/price check failed. Fail closed and do not place.', 'LIVE CHECK FAILED');
      console.warn('Late execution guard failed', e);
    } finally {
      busy = false;
    }
  }

  setInterval(fastCheck, FAST_MS);
  window.addEventListener('mitchell-base-ready', () => setTimeout(fastCheck, 250));
  window.addEventListener('online', () => setTimeout(fastCheck, 250));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') setTimeout(fastCheck, 250);
  });
})();
