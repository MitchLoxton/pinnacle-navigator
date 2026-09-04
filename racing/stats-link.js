(() => {
  'use strict';

  function makeLink(href, text, dataKey) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'hk-tab-btn';
    link.dataset[dataKey] = '1';
    link.textContent = text;
    link.style.textDecoration = 'none';
    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    return link;
  }

  function addUtilityLinks() {
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher) return false;
    if (!switcher.querySelector('[data-auto-link]')) {
      switcher.appendChild(makeLink('./automation.html', 'AUTO · SHADOW', 'autoLink'));
    }
    if (!switcher.querySelector('[data-stats-link]')) {
      switcher.appendChild(makeLink('./stats.html', 'STATS · FULL AUDIT', 'statsLink'));
    }
    return true;
  }

  function start() {
    if (addUtilityLinks()) return;
    const observer = new MutationObserver(() => {
      if (addUtilityLinks()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
