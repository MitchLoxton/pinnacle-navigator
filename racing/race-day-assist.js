(() => {
  'use strict';

  const WAKE_NEAR_SECONDS = 900;
  const ALERT_KEY = 'mitchell-racing-alerts-v2';
  const AUTO_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-v11-auto';
  const API_KEY = 'sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
  let nearestLeadSeconds = null;
  let wakeLock = null;
  let wakeStatus = 'IDLE';
  let alertsEnabled = false;
  let pushRegistered = false;
  let pushBusy = false;
  let pushError = '';
  let lastAlertSignature = '';
  let lastBetNow = false;

  try {
    alertsEnabled = localStorage.getItem(ALERT_KEY) === '1' || localStorage.getItem('mitchell-racing-alerts-v1') === '1';
    if (alertsEnabled) localStorage.setItem(ALERT_KEY, '1');
  } catch {}

  const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  function emit() {
    window.dispatchEvent(new CustomEvent('mitchell-assist-health', {
      detail: {
        wakeStatus,
        alertsEnabled,
        pushSupported: pushSupported(),
        pushRegistered,
        pushBusy,
        pushError,
        notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
        nearestLeadSeconds
      }
    }));
    renderQuickCard();
  }

  function addQuickStyles() {
    if (document.getElementById('mitchell-phone-alert-style')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-phone-alert-style';
    style.textContent = `
      .phone-alert-card{margin:0 0 10px;padding:14px;border:1px solid #765f2a;border-radius:14px;background:#2a2413;color:#f4f6f8;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}
      .phone-alert-card.good{border-color:#2a8058;background:#0d3023}.phone-alert-card.bad{border-color:#74323e;background:#30161d}
      .phone-alert-card span{display:block;font-size:8px;font-weight:950;letter-spacing:.1em;color:#9fb0c2}.phone-alert-card.good span{color:#91d8b1}.phone-alert-card.bad span{color:#f3a6b1}
      .phone-alert-card strong{display:block;margin-top:4px;font-size:17px;line-height:1.08}.phone-alert-card p{margin:6px 0 0;color:#cbd6e2;font-size:10px;line-height:1.4;max-width:760px}
      .phone-alert-card button{min-height:44px;border:0;border-radius:11px;padding:10px 13px;background:#ffc34f;color:#151515;font-weight:950;font-size:10px;white-space:nowrap;cursor:pointer}.phone-alert-card.good button{background:#78f2b5}.phone-alert-card.bad button{background:#ff9eaa}
      .phone-alert-card button:disabled{opacity:.6;cursor:wait}
      @media(max-width:620px){.phone-alert-card{grid-template-columns:1fr}.phone-alert-card button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function ensureQuickCard() {
    let el = document.getElementById('phoneAlertCard');
    if (el) return el;
    addQuickStyles();
    const anchor = document.querySelector('.only-rule') || document.getElementById('decisionCard');
    if (!anchor) return null;
    el = document.createElement('section');
    el.id = 'phoneAlertCard';
    el.className = 'phone-alert-card';
    anchor.insertAdjacentElement('afterend', el);
    return el;
  }

  function renderQuickCard() {
    const el = ensureQuickCard();
    if (!el) return;
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';
    let tone = '', title = 'TURN ON PHONE ALERTS', text = 'One tap connects race-day alerts so you do not need to watch the app all Saturday.', button = 'ENABLE PHONE ALERTS';
    if (permission === 'denied') {
      tone = 'bad';
      title = 'PHONE ALERTS BLOCKED';
      text = 'Notifications are blocked in this browser. Allow notifications for MITCHELL Racing in your phone/browser settings, then reopen the app.';
      button = 'TRY AGAIN';
    } else if (pushBusy) {
      title = 'CONNECTING PHONE ALERTS…';
      text = 'Registering this device with the server. Keep the app open for a few seconds.';
      button = 'CONNECTING…';
    } else if (alertsEnabled && pushRegistered) {
      tone = 'good';
      title = 'PHONE ALERTS ON';
      text = 'Background alerts are armed: CORE heads-up, ~15 min, ~3 min, STAND BY, BET NOW and final NO BET. You can lock your phone.';
      button = 'TURN ALERTS OFF';
    } else if (alertsEnabled && !pushSupported()) {
      title = 'APP-OPEN ALERTS ON';
      text = 'This browser cannot receive background web push. Keep the app open, or add MITCHELL Racing to your Home Screen and reopen it for background alerts.';
      button = 'TURN ALERTS OFF';
    } else if (alertsEnabled) {
      title = 'ALERTS ON · PUSH NOT CONNECTED';
      text = pushError || 'The app can alert while open, but background phone push is not connected yet. Tap to retry.';
      button = 'RETRY PHONE PUSH';
    }
    el.className = `phone-alert-card ${tone}`.trim();
    el.innerHTML = `<div><span>RACE-DAY NOTIFICATIONS</span><strong>${title}</strong><p>${text}</p></div><button type="button" id="phoneAlertQuickButton" ${pushBusy?'disabled':''}>${button}</button>`;
    const btn = document.getElementById('phoneAlertQuickButton');
    btn?.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        if (alertsEnabled && pushRegistered) await disableAlerts();
        else if (alertsEnabled && !pushRegistered && permission !== 'denied') await registerBackgroundPush(true);
        else if (alertsEnabled) await disableAlerts();
        else await enableAlerts();
      } finally {
        btn.disabled = false;
        emit();
      }
    }, { once:true });
  }

  function b64ToBytes(value) {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(ch => ch.charCodeAt(0)));
  }

  async function autoRequest(method = 'GET', body = null) {
    const options = { method, cache:'no-store', headers:{ apikey:API_KEY } };
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(AUTO_URL, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true) throw new Error(data?.error || `Alert server HTTP ${response.status}`);
    return data;
  }

  async function getPushKey() {
    const data = await autoRequest('GET');
    const key = String(data?.push?.publicKey || '');
    if (!data?.push?.ready || !key) throw new Error('Phone push server is not ready yet.');
    return key;
  }

  async function existingPushStatus() {
    if (!pushSupported() || Notification.permission !== 'granted') {
      pushRegistered = false;
      return false;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      pushRegistered = Boolean(subscription);
      return pushRegistered;
    } catch (error) {
      pushRegistered = false;
      pushError = error instanceof Error ? error.message : 'Could not inspect push registration.';
      return false;
    }
  }

  async function registerBackgroundPush(sendTest = true) {
    if (!pushSupported()) {
      pushRegistered = false;
      pushError = 'Background push is unsupported in this browser. Add the app to your Home Screen if you are on iPhone.';
      emit();
      return false;
    }
    if (Notification.permission !== 'granted') {
      pushRegistered = false;
      pushError = `Notification permission is ${Notification.permission}.`;
      emit();
      return false;
    }
    pushBusy = true;
    pushError = '';
    emit();
    try {
      const reg = await navigator.serviceWorker.ready;
      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const publicKey = await getPushKey();
        subscription = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:b64ToBytes(publicKey) });
      }
      const data = await autoRequest('POST', { action:'PUSH_SUBSCRIBE', subscription:subscription.toJSON(), test:sendTest });
      pushRegistered = data?.subscribed === true;
      if (!pushRegistered) throw new Error('Server did not confirm this phone subscription.');
      return true;
    } catch (error) {
      pushRegistered = false;
      pushError = error instanceof Error ? error.message : 'Background push registration failed.';
      console.warn('Background racing push unavailable', error);
      return false;
    } finally {
      pushBusy = false;
      emit();
    }
  }

  async function unregisterBackgroundPush() {
    if (!pushSupported()) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        try { await autoRequest('POST', { action:'PUSH_UNSUBSCRIBE', endpoint:subscription.endpoint }); } catch (error) { console.warn('Push unsubscribe server sync failed', error); }
        try { await subscription.unsubscribe(); } catch {}
      }
    } finally {
      pushRegistered = false;
    }
  }

  async function releaseWake() {
    const lock = wakeLock;
    wakeLock = null;
    if (lock) {
      try { await lock.release(); } catch {}
    }
    if (wakeStatus !== 'UNSUPPORTED') wakeStatus = 'IDLE';
    emit();
  }

  function shouldWake() {
    return document.visibilityState === 'visible' && navigator.onLine !== false &&
      Number.isFinite(Number(nearestLeadSeconds)) && Number(nearestLeadSeconds) > 0 && Number(nearestLeadSeconds) <= WAKE_NEAR_SECONDS;
  }

  async function syncWake() {
    if (!('wakeLock' in navigator)) {
      wakeStatus = 'UNSUPPORTED';
      emit();
      return;
    }
    if (!shouldWake()) {
      await releaseWake();
      return;
    }
    if (wakeLock) {
      wakeStatus = 'AWAKE';
      emit();
      return;
    }
    try {
      wakeStatus = 'REQUESTING';
      emit();
      wakeLock = await navigator.wakeLock.request('screen');
      wakeStatus = 'AWAKE';
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        wakeStatus = shouldWake() ? 'RETRYING' : 'IDLE';
        emit();
        if (shouldWake()) setTimeout(syncWake, 1000);
      }, { once:true });
      emit();
    } catch (error) {
      wakeStatus = 'BLOCKED';
      emit();
      console.warn('Race-day wake lock unavailable', error);
    }
  }

  async function sendBetAlert(message) {
    if (!alertsEnabled) return;
    try { navigator.vibrate?.([300, 120, 300, 120, 650]); } catch {}
    if (pushRegistered) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('BET NOW · MITCHELL Racing', {
            body: message || 'A verified race-day instruction is ready. Open MITCHELL Racing now.',
            tag: 'mitchell-racing-bet-now-local',
            renotify: true,
            requireInteraction: true,
            icon: './icon.svg',
            badge: './icon.svg',
            data: { url: './' }
          });
        } else {
          new Notification('BET NOW · MITCHELL Racing', { body: message || 'Verified race-day instruction ready.' });
        }
      } catch (error) {
        console.warn('Race alert notification failed', error);
      }
    }
  }

  function checkBetNow() {
    const card = document.getElementById('decisionCard');
    if (!card) return;
    const isBetNow = card.classList.contains('bet-now') && String(document.getElementById('decisionTitle')?.textContent || '').trim().toUpperCase() === 'BET NOW';
    if (!isBetNow) {
      lastBetNow = false;
      return;
    }
    const signature = [
      document.getElementById('decisionMessage')?.textContent || '',
      document.querySelector('#lockedBets .horse-name')?.textContent || '',
      document.querySelector('#lockedBets .bet-numbers')?.textContent || ''
    ].join('|').trim();
    if (!lastBetNow || (signature && signature !== lastAlertSignature)) {
      lastBetNow = true;
      lastAlertSignature = signature;
      sendBetAlert(document.getElementById('decisionMessage')?.textContent || 'Verified BET NOW instruction ready.');
    }
  }

  async function enableAlerts() {
    pushError = '';
    if ('Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }
    if ('Notification' in window && Notification.permission === 'denied') {
      alertsEnabled = false;
      try { localStorage.removeItem(ALERT_KEY); } catch {}
      pushError = 'Notification permission is blocked.';
      emit();
      return { enabled:false, notificationPermission:'denied', pushRegistered:false };
    }
    alertsEnabled = true;
    try { localStorage.setItem(ALERT_KEY, '1'); localStorage.removeItem('mitchell-racing-alerts-v1'); } catch {}
    await registerBackgroundPush(true);
    emit();
    checkBetNow();
    return {
      enabled: alertsEnabled,
      notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
      vibrationSupported: 'vibrate' in navigator,
      pushRegistered
    };
  }

  async function disableAlerts() {
    alertsEnabled = false;
    try { localStorage.removeItem(ALERT_KEY); localStorage.removeItem('mitchell-racing-alerts-v1'); } catch {}
    await unregisterBackgroundPush();
    pushError = '';
    emit();
  }

  window.MITCHELL_RACE_ASSIST = {
    enableAlerts,
    disableAlerts,
    registerBackgroundPush,
    getStatus: () => ({ wakeStatus, alertsEnabled, pushRegistered, pushSupported:pushSupported(), pushError, nearestLeadSeconds })
  };

  window.addEventListener('mitchell-live-health', event => {
    const detail = event.detail || {};
    nearestLeadSeconds = Number.isFinite(Number(detail.nearestLeadSeconds)) ? Number(detail.nearestLeadSeconds) : null;
    if (detail.status === 'ERROR') nearestLeadSeconds = null;
    syncWake();
  });
  window.addEventListener('offline', () => { nearestLeadSeconds = null; releaseWake(); });
  window.addEventListener('online', syncWake);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncWake();
    else releaseWake();
  });
  window.addEventListener('beforeunload', releaseWake);

  async function start() {
    const card = document.getElementById('decisionCard');
    if (card) new MutationObserver(checkBetNow).observe(card, { attributes:true, childList:true, subtree:true, characterData:true });
    await existingPushStatus();
    checkBetNow();
    syncWake();
    emit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
