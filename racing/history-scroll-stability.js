(() => {
  'use strict';

  let savedListScroll = 0;
  let savedWindowScroll = 0;
  let userHasScrolled = false;
  let lastHistoryClickAt = 0;

  const historyButton = () => document.querySelector('[data-premium-tab="history"].active');
  const historyList = () => document.querySelector('#premiumPage .sbh .sl');
  const historyOpen = () => Boolean(historyButton() && document.querySelector('#premiumPage .sbh'));

  function ensureStyles() {
    if (document.getElementById('mitchell-history-scroll-stability-css')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-history-scroll-stability-css';
    style.textContent = `
      #premiumPage .sbh .sl {
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        overflow-anchor: none;
        scroll-behavior: auto !important;
      }
      #premiumPage:has(.sbh) { overflow-anchor: none; }
    `;
    document.head.appendChild(style);
  }

  function bindList() {
    const list = historyList();
    if (!list || list.dataset.scrollStableBound === '1') return;
    list.dataset.scrollStableBound = '1';
    if (userHasScrolled && savedListScroll > 0) list.scrollTop = savedListScroll;
    list.addEventListener('scroll', () => {
      if (!historyOpen()) return;
      savedListScroll = list.scrollTop;
      userHasScrolled = true;
    }, { passive:true });
  }

  function restorePosition() {
    if (!historyOpen() || !userHasScrolled) {
      bindList();
      return;
    }

    const list = historyList();
    if (list && Math.abs(list.scrollTop - savedListScroll) > 2) {
      list.scrollTop = savedListScroll;
    }

    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (savedWindowScroll > 0 && Math.abs(y - savedWindowScroll) > 2 && Date.now() - lastHistoryClickAt > 600) {
      window.scrollTo({ top:savedWindowScroll, left:0, behavior:'auto' });
    }
    bindList();
  }

  function scheduleRestore() {
    requestAnimationFrame(() => requestAnimationFrame(restorePosition));
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-premium-tab]');
    if (!button) return;
    if (button.dataset.premiumTab === 'history') {
      savedListScroll = 0;
      savedWindowScroll = 0;
      userHasScrolled = false;
      lastHistoryClickAt = Date.now();
      // Cancel the premium UI's lingering smooth-to-top animation on iOS.
      setTimeout(() => window.scrollTo({ top:0, left:0, behavior:'auto' }), 0);
      setTimeout(() => { ensureStyles(); bindList(); }, 60);
    } else {
      savedListScroll = 0;
      savedWindowScroll = 0;
      userHasScrolled = false;
    }
  }, true);

  window.addEventListener('scroll', () => {
    if (!historyOpen()) return;
    savedWindowScroll = window.scrollY || document.documentElement.scrollTop || 0;
    if (Date.now() - lastHistoryClickAt > 600) userHasScrolled = true;
  }, { passive:true });

  function start() {
    ensureStyles();
    const root = document.getElementById('premiumApp');
    if (!root) return;
    new MutationObserver(() => {
      if (!historyButton()) return;
      scheduleRestore();
    }).observe(root, { subtree:true, childList:true });
    bindList();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
