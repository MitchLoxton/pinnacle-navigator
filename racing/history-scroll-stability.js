(() => {
  'use strict';

  const now = () => (window.performance?.now?.() ?? Date.now());
  const nativeScrollTo = window.scrollTo.bind(window);
  const innerHTMLDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');

  let enteringHistoryUntil = 0;
  let allowHistoryExitUntil = 0;

  const historyButtonActive = () => Boolean(document.querySelector('[data-premium-tab="history"].active'));
  const historyPageLoaded = () => Boolean(document.querySelector('#premiumPage .sbh'));

  function installCss() {
    if (document.getElementById('mitchell-history-hard-lock-css')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-history-hard-lock-css';
    style.textContent = `
      html.mitchell-history-open,
      html.mitchell-history-open body {
        scroll-behavior: auto !important;
        overflow-anchor: none !important;
      }
      #premiumPage .sbh,
      #premiumPage .sbh .sl {
        overflow-anchor: none !important;
        scroll-behavior: auto !important;
      }
      #premiumPage .sbh .sl {
        overscroll-behavior-y: contain !important;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }
    `;
    document.head.appendChild(style);
  }

  function syncHistoryClass() {
    document.documentElement.classList.toggle('mitchell-history-open', historyButtonActive());
  }

  function requestedTop(args) {
    if (!args.length) return null;
    if (typeof args[0] === 'object' && args[0] !== null) {
      const value = Number(args[0].top);
      return Number.isFinite(value) ? value : null;
    }
    const value = Number(args[1]);
    return Number.isFinite(value) ? value : null;
  }

  // The premium navigation used smooth scrolling after every tab click. On iOS that
  // animation can continue fighting the nested History scroller. Convert the initial
  // History jump to an instant one, then refuse any later unsolicited jump-to-top.
  window.scrollTo = function (...args) {
    if (historyButtonActive()) {
      const top = requestedTop(args);
      if (top !== null && top <= 1) {
        if (now() <= enteringHistoryUntil) {
          return nativeScrollTo({ top:0, left:0, behavior:'auto' });
        }
        if (historyPageLoaded()) return;
      }
    }
    return nativeScrollTo(...args);
  };

  // History is rendered by a separate ledger script. If another live/background UI
  // render tries to replace #premiumPage while History is open, keep the ledger DOM
  // mounted. If the ledger itself refreshes, preserve its exact scroll position
  // synchronously before the browser can paint a jump back to zero.
  if (innerHTMLDescriptor?.get && innerHTMLDescriptor?.set && innerHTMLDescriptor.configurable !== false) {
    Object.defineProperty(Element.prototype, 'innerHTML', {
      configurable: innerHTMLDescriptor.configurable,
      enumerable: innerHTMLDescriptor.enumerable,
      get: innerHTMLDescriptor.get,
      set(value) {
        const isPremiumPage = this?.id === 'premiumPage';
        const currentLedger = isPremiumPage && historyButtonActive() ? this.querySelector('.sbh') : null;

        if (!currentLedger || now() <= allowHistoryExitUntil) {
          return innerHTMLDescriptor.set.call(this, value);
        }

        const incoming = String(value ?? '');
        const currentList = currentLedger.querySelector('.sl');
        const listY = currentList?.scrollTop || 0;
        const pageY = window.scrollY || document.documentElement.scrollTop || 0;

        // Background render trying to replace History with the generic History card.
        if (!incoming.includes('sbh')) return;

        // Legitimate History ledger refresh: replace, then restore before paint.
        innerHTMLDescriptor.set.call(this, value);
        const replacementList = this.querySelector('.sbh .sl');
        if (replacementList && listY > 0) replacementList.scrollTop = listY;
        if (pageY > 0) nativeScrollTo({ top:pageY, left:0, behavior:'auto' });
      }
    });
  }

  // Capture navigation before premium-ui's own click handler runs.
  document.addEventListener('click', event => {
    const tab = event.target?.closest?.('[data-premium-tab]');
    if (tab) {
      if (tab.dataset.premiumTab === 'history') {
        enteringHistoryUntil = now() + 1200;
        allowHistoryExitUntil = 0;
        queueMicrotask(syncHistoryClass);
        setTimeout(syncHistoryClass, 0);
        setTimeout(syncHistoryClass, 60);
      } else {
        allowHistoryExitUntil = now() + 1200;
        document.documentElement.classList.remove('mitchell-history-open');
      }
    }

    const jump = event.target?.closest?.('[data-tab-jump]');
    if (jump) {
      allowHistoryExitUntil = now() + 1200;
      document.documentElement.classList.remove('mitchell-history-open');
    }
  }, true);

  function start() {
    installCss();
    syncHistoryClass();
    const root = document.getElementById('premiumApp');
    if (!root) return;
    new MutationObserver(syncHistoryClass).observe(root, {
      subtree:true,
      childList:true,
      attributes:true,
      attributeFilter:['class']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
