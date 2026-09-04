(() => {
  'use strict';

  const WAKE_NEAR_SECONDS = 900;
  const ALERT_KEY = 'mitchell-racing-alerts-v1';
  let nearestLeadSeconds = null;
  let wakeLock = null;
  let wakeStatus = 'IDLE';
  let alertsEnabled = false;
  let lastAlertSignature = '';
  let lastBetNow = false;

  try { alertsEnabled = localStorage.getItem(ALERT_KEY) === '1'; } catch {}

  function emit() {
    window.dispatchEvent(new CustomEvent('mitchell-assist-health', {
      detail: {
        wakeStatus,
        alertsEnabled,
        notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
        nearestLeadSeconds
      }
    }));
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
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('BET NOW · MITCHELL Racing', {
            body: message || 'A verified race-day instruction is ready. Open MITCHELL Racing now.',
            tag: 'mitchell-racing-bet-now',
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
    alertsEnabled = true;
    try { localStorage.setItem(ALERT_KEY, '1'); } catch {}
    if ('Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }
    emit();
    checkBetNow();
    return {
      enabled: alertsEnabled,
      notificationPermission: 'Notification' in window ? Notification.permission : 'unsupported',
      vibrationSupported: 'vibrate' in navigator
    };
  }

  function disableAlerts() {
    alertsEnabled = false;
    try { localStorage.removeItem(ALERT_KEY); } catch {}
    emit();
  }

  window.MITCHELL_RACE_ASSIST = {
    enableAlerts,
    disableAlerts,
    getStatus: () => ({ wakeStatus, alertsEnabled, nearestLeadSeconds })
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

  function start() {
    const card = document.getElementById('decisionCard');
    if (card) new MutationObserver(checkBetNow).observe(card, { attributes:true, childList:true, subtree:true, characterData:true });
    checkBetNow();
    syncWake();
    emit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
