(() => {
  'use strict';

  const URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-v11-preflight';
  const KEY = 'sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
  const REFRESH_MS = 300000;
  const MAX_PASS_AGE_MS = 600000;

  let state = { status:'CHECKING', safe:false, checkedAt:null, targetDate:null, errors:[], warnings:[] };
  let busy = false;
  let internal = false;

  const $ = id => document.getElementById(id);

  function freshPass() {
    const checked = Date.parse(state.checkedAt || '');
    return state.status === 'PASS' && state.safe === true && Number.isFinite(checked) && Date.now() - checked <= MAX_PASS_AGE_MS;
  }

  function emit() {
    window.__MITCHELL_V11_PREFLIGHT = { ...state, freshPass:freshPass() };
    window.dispatchEvent(new CustomEvent('mitchell-preflight-health', { detail:window.__MITCHELL_V11_PREFLIGHT }));
  }

  function blockGreen() {
    if (internal || freshPass()) return;
    const card = $('decisionCard');
    if (!card?.classList.contains('bet-now')) return;
    internal = true;
    try {
      card.className = 'decision-card blocked';
      card.dataset.preflightGuard = 'blocked';
      const bottom = $('bottomCommand');
      if (bottom) bottom.className = 'bottom-command blocked';
      if ($('decisionKicker')) $('decisionKicker').textContent = 'V11 DATA PREFLIGHT · BLOCKED';
      if ($('decisionTitle')) $('decisionTitle').textContent = 'DO NOT BET';
      const reason = state.status === 'BLOCKED'
        ? (state.errors[0] || 'Race-day state/evidence integrity check failed.')
        : state.status === 'ERROR'
          ? 'The race-day integrity service could not be verified.'
          : 'The all-21 state and frozen CORE evidence check is still running.';
      if ($('decisionMessage')) $('decisionMessage').textContent = `${reason} A green instruction is not valid until PREFLIGHT = PASS.`;
      if ($('bottomLabel')) $('bottomLabel').textContent = 'DO NOT BET';
      if ($('bottomText')) $('bottomText').textContent = 'V11 state/evidence preflight has not passed.';
      document.title = 'DO NOT BET · MITCHELL Racing';
    } finally {
      internal = false;
    }
  }

  async function refresh() {
    if (busy || navigator.onLine === false) {
      if (navigator.onLine === false) {
        state = { ...state, status:'ERROR', safe:false, checkedAt:new Date().toISOString(), errors:['BROWSER_OFFLINE'] };
        emit();
        blockGreen();
      }
      return;
    }
    busy = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(),9000);
    try {
      const response = await fetch(URL, {
        method:'GET', cache:'no-store', signal:controller.signal,
        headers:{ apikey:KEY }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok !== true) throw new Error(body?.error || `HTTP ${response.status}`);
      state = {
        status:String(body.preflight || 'ERROR').toUpperCase(),
        safe:body.safeToEvaluateLiveV11 === true,
        checkedAt:body.checkedAt || new Date().toISOString(),
        targetDate:body.targetDate || null,
        streamCount:Number(body.streamCount || 0),
        coreWatchCount:Number(body.coreWatchCount || 0),
        coreWatchRaces:Array.isArray(body.coreWatchRaces) ? body.coreWatchRaces : [],
        errors:Array.isArray(body.errors) ? body.errors : [],
        warnings:Array.isArray(body.warnings) ? body.warnings : [],
        note:body.note || ''
      };
      emit();
      if (!freshPass()) blockGreen();
      else if ($('decisionCard')?.dataset?.preflightGuard === 'blocked') {
        delete $('decisionCard').dataset.preflightGuard;
        window.dispatchEvent(new Event('mitchell-refresh-live'));
      }
    } catch (error) {
      state = {
        ...state,
        status:'ERROR', safe:false, checkedAt:new Date().toISOString(),
        errors:[error instanceof Error ? error.message : 'PREFLIGHT_ERROR']
      };
      emit();
      blockGreen();
    } finally {
      clearTimeout(timer);
      busy = false;
    }
  }

  function start() {
    state.checkedAt = new Date().toISOString();
    emit();
    const card = $('decisionCard');
    if (card) new MutationObserver(() => {
      if (!internal) queueMicrotask(blockGreen);
    }).observe(card,{attributes:true,childList:true,subtree:true,characterData:true});
    refresh();
    setInterval(refresh,REFRESH_MS);
    window.addEventListener('online',refresh);
    window.addEventListener('offline',refresh);
    document.addEventListener('visibilitychange',() => { if (document.visibilityState === 'visible') refresh(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
