(() => {
  'use strict';

  function addStyles() {
    if (document.getElementById('hk-roadmap-styles')) return;
    const style = document.createElement('style');
    style.id = 'hk-roadmap-styles';
    style.textContent = `
      .hk-roadmap{margin:0 0 12px;padding:14px;border:1px solid #31506d;border-radius:14px;background:linear-gradient(180deg,#102238,#0b1625)}
      .hk-roadmap h3{margin:3px 0 5px;font-size:18px;color:#f4f8fc}
      .hk-roadmap .kicker{font-size:8px;font-weight:1000;letter-spacing:.12em;color:#86a9c8;text-transform:uppercase}
      .hk-roadmap .sub{font-size:9px;line-height:1.45;color:#9eb3ca}
      .hk-roadmap-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:10px}
      .hk-roadmap-card{padding:10px;border:1px solid #2e435c;border-radius:10px;background:#0c1b2b}
      .hk-roadmap-card span{display:block;font-size:7.5px;font-weight:1000;color:#7f98b0;text-transform:uppercase}
      .hk-roadmap-card strong{display:block;margin-top:5px;font-size:13px;color:#f4f8fc}
      .hk-roadmap-card small{display:block;margin-top:5px;font-size:8px;line-height:1.35;color:#94a9be}
      .hk-roadmap-card.good{border-color:#2a8058;background:#0d2b20}.hk-roadmap-card.good strong{color:#8bf4bf}
      .hk-roadmap-card.wait{border-color:#7b652c;background:#282313}.hk-roadmap-card.wait strong{color:#ffd36d}
      .hk-roadmap-warning{margin-top:8px;padding:9px 10px;border-left:3px solid #74323e;border-radius:7px;background:#25151b;color:#dbaab2;font-size:8.5px;line-height:1.4}
      @media(max-width:600px){.hk-roadmap-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function render() {
    addStyles();
    const root = document.getElementById('hkRacingContent');
    if (!root || document.getElementById('hkResearchRoadmap')) return false;
    const panel = document.createElement('section');
    panel.id = 'hkResearchRoadmap';
    panel.className = 'hk-roadmap';
    panel.innerHTML = `
      <div class="kicker">Hong Kong · research roadmap</div>
      <h3>TARGET CADENCE: ~55–65 QUALIFYING SELECTIONS / YEAR</h3>
      <div class="sub">Quality comes first. The current core stays frozen while a separate PLACE research sleeve is validated. This panel is informational and does not change the app's fail-closed wagering controls.</div>
      <div class="hk-roadmap-grid">
        <div class="hk-roadmap-card good"><span>Core research sleeve</span><strong>FROZEN · ~35.7/YR</strong><small>Keep the stronger existing WIN core unchanged rather than loosening thresholds for extra volume.</small></div>
        <div class="hk-roadmap-card wait"><span>Independent PLACE sleeve</span><strong>VALIDATION NEEDED</strong><small>Goal is roughly 20–30 additional high-quality selections per year after real quote, liquidity and forward validation.</small></div>
        <div class="hk-roadmap-card wait"><span>Combined target</span><strong>~55–65/YR</strong><small>Promotion remains blocked until the second sleeve has frozen rules and passes the evidence gates.</small></div>
      </div>
      <div class="hk-roadmap-warning"><b>Rejected volume shortcut:</b> the ~57.6/year WIN-only candidate was excluded after a severe reserved-2026 failure. It stays excluded rather than being retuned around that result.</div>
    `;
    root.prepend(panel);
    const button = document.querySelector('.hk-tab-btn[data-tab="hk"]');
    if (button) button.textContent = 'HONG KONG · 60 TARGET';
    return true;
  }

  function start() {
    if (render()) return;
    const observer = new MutationObserver(() => {
      if (render()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();