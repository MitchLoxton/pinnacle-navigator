(() => {
  'use strict';

  const URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-v11-state-tracker';
  const KEY = 'sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
  let busy = false;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const ago = value => {
    const ms = Date.now() - Date.parse(value || '');
    if (!Number.isFinite(ms)) return 'never';
    const sec = Math.max(0,Math.round(ms/1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec/60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.round(min/60);
    return hours < 48 ? `${hours}h ago` : `${Math.round(hours/24)}d ago`;
  };
  const stamp = value => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Perth',weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}).format(d) + ' Perth';
  };
  const row = (label,value,tone='') => `<div class="row"><span>${esc(label)}</span><strong class="${tone}">${esc(value)}</strong></div>`;

  function tone(status) {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETE') return 'goodtxt';
    if (['ERROR','ERROR_PARTIAL','REVIEW_REQUIRED'].includes(s)) return 'badtxt';
    return 'warntxt';
  }

  function ensureSection() {
    const root = document.getElementById('autoRoot');
    if (!root) return null;
    let section = document.getElementById('stateTrackerStatus');
    if (section) return section;
    const grid = root.querySelector('.grid');
    section = document.createElement('section');
    section.id = 'stateTrackerStatus';
    section.className = 'section';
    section.innerHTML = '<span class="eyebrow">ALL-21 STATE TRACKER</span><h2 class="warntxt">WAITING FOR HEARTBEAT…</h2><p>Checking the automated post-race state ledger.</p>';
    if (grid) root.insertBefore(section,grid);
    else root.appendChild(section);
    return section;
  }

  async function refresh() {
    if (busy || navigator.onLine === false) return;
    const section = ensureSection();
    if (!section) return;
    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),8000);
    try {
      const response = await fetch(URL,{method:'GET',cache:'no-store',signal:controller.signal,headers:{apikey:KEY}});
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok !== true) throw new Error(body?.error || `HTTP ${response.status}`);
      const h = body.heartbeat || {};
      const status = String(h.status || 'UNKNOWN').toUpperCase();
      const complete = Number(h.existing_count || 0) + Number(h.recorded_count || 0);
      section.innerHTML = `
        <span class="eyebrow">ALL-21 STATE TRACKER</span>
        <h2 class="${tone(status)}">${esc(status.replaceAll('_',' '))}</h2>
        <p>Post-race state tracking is now server-side. It checks every PR1–PR7, SR1–SR7 and MR1–MR7 stream, cross-checks final favourites, and refuses to guess when sources imply different W/L outcomes.</p>
        <div class="rows">
          ${row('Primary run','Saturday 7:00 PM Perth')}
          ${row('Automatic retry','Sunday 8:00 AM Perth')}
          ${row('Target date',h.target_date || 'Waiting for first scheduled run')}
          ${row('Streams resolved',`${complete} / ${h.total_streams || 21}`,complete === 21 ? 'goodtxt' : 'warntxt')}
          ${row('Newly recorded',String(h.recorded_count ?? 0))}
          ${row('Already verified',String(h.existing_count ?? 0))}
          ${row('Pending results',String(h.pending_count ?? 0),Number(h.pending_count) ? 'warntxt' : '')}
          ${row('Needs manual review',String(h.ambiguous_count ?? 0),Number(h.ambiguous_count) ? 'badtxt' : 'goodtxt')}
          ${row('Errors',String(h.error_count ?? 0),Number(h.error_count) ? 'badtxt' : 'goodtxt')}
          ${row('Last finished',h.last_finished_at ? `${stamp(h.last_finished_at)} · ${ago(h.last_finished_at)}` : 'Never run yet')}
        </div>`;
    } catch (error) {
      section.innerHTML = `<span class="eyebrow">ALL-21 STATE TRACKER</span><h2 class="badtxt">STATUS UNVERIFIED</h2><p>The state-tracker heartbeat could not be read. This does not create a bet; it means the weekly state ledger needs verification before being trusted.</p><div class="rows">${row('Error',error instanceof Error ? error.message : 'Unknown error','badtxt')}</div>`;
    } finally {
      clearTimeout(timer);
      busy = false;
    }
  }

  function start() {
    const observer = new MutationObserver(() => {
      if (document.querySelector('#autoRoot .grid')) {
        ensureSection();
        refresh();
        observer.disconnect();
      }
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(() => observer.disconnect(),10000);
    setTimeout(() => { ensureSection(); refresh(); },500);
    setInterval(refresh,60000);
    window.addEventListener('online',refresh);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
