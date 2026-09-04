(() => {
  'use strict';

  function addStatsLink() {
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher || switcher.querySelector('[data-stats-link]')) return Boolean(switcher);
    const link = document.createElement('a');
    link.href = './stats.html';
    link.className = 'hk-tab-btn';
    link.dataset.statsLink = '1';
    link.textContent = 'STATS · FULL AUDIT';
    link.style.textDecoration = 'none';
    link.style.display = 'inline-flex';
    link.style.alignItems = 'center';
    switcher.appendChild(link);
    return true;
  }

  function start() {
    if (addStatsLink()) return;
    const observer = new MutationObserver(() => {
      if (addStatsLink()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
