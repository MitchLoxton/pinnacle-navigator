(() => {
  'use strict';

  function addStyles() {
    if (document.getElementById('mitchell-easy-styles')) return;
    const style = document.createElement('style');
    style.id = 'mitchell-easy-styles';
    style.textContent = `
      .easy-master-rule{margin:0 0 12px;padding:12px 14px;border-radius:13px;border:1px solid #2a8058;background:#0d2d21;display:flex;justify-content:space-between;gap:12px;align-items:center}
      .easy-master-rule span{display:block;font-size:8px;font-weight:950;color:#8ab9a2;letter-spacing:.08em}.easy-master-rule strong{display:block;margin-top:3px;font-size:14px;color:#78f2b5}.easy-master-rule p{margin:0;max-width:520px;font-size:9px;line-height:1.45;color:#a7c8b8;text-align:right}
      .easy-advanced{margin:8px 0 11px;border:1px solid #2e435c;border-radius:11px;overflow:hidden;background:#0d1725}.easy-advanced>summary{cursor:pointer;padding:10px 11px;font-size:9px;font-weight:950;color:#a9bdd0}.easy-advanced>.hk-strategy{margin:0;border:0;border-top:1px solid #2e435c;border-radius:0}
      .watch-details:not([open]){opacity:.82}.details-card:not([open]){opacity:.82}
      @media(max-width:620px){.easy-master-rule{display:block}.easy-master-rule p{text-align:left;margin-top:6px}}
    `;
    document.head.appendChild(style);
  }

  function collapseAustralia() {
    ['watchDetails','resultsDetails','lastWeekDetails'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.open = false;
    });
    document.querySelectorAll('#auRacingPanel .details-card').forEach(el => { el.open = false; });
  }

  function addMasterRule() {
    const switcher = document.querySelector('.hk-switcher');
    if (!switcher || document.querySelector('.easy-master-rule')) return;
    const box = document.createElement('div');
    box.className = 'easy-master-rule';
    box.innerHTML = '<div><span>THE ONLY THING YOU NEED TO FOLLOW</span><strong>BIG ACTION BOX = YOUR INSTRUCTION</strong></div><p>GREEN BET NOW = follow the exact horse/stake shown. YELLOW WAIT or RED NO BET = do nothing. Everything else is information/audit.</p>';
    switcher.insertAdjacentElement('afterend', box);
  }

  function simplifyHongKong() {
    const root = document.getElementById('hkRacingContent');
    if (!root) return;
    const strategy = root.querySelector('.hk-strategy');
    if (strategy && !strategy.closest('.easy-advanced')) {
      const details = document.createElement('details');
      details.className = 'easy-advanced';
      const summary = document.createElement('summary');
      summary.textContent = 'SHOW HONG KONG STRATEGY DETAILS';
      strategy.parentNode.insertBefore(details, strategy);
      details.append(summary, strategy);
    }
  }

  function run() {
    addStyles();
    collapseAustralia();
    addMasterRule();
    simplifyHongKong();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once:true });
  else run();

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(() => observer.disconnect(), 30000);
})();
