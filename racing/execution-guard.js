(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let syncing = false;

  function setBlockedVisuals(titleText, detailText, labelText) {
    const card = $('decisionCard');
    const bottom = $('bottomCommand');
    const title = $('decisionTitle');
    const kicker = $('decisionKicker');
    const bottomLabel = $('bottomLabel');
    const bottomText = $('bottomText');

    if (card) card.className = 'decision-card blocked';
    if (bottom) bottom.className = 'bottom-command blocked';
    if (title) title.textContent = titleText;
    if (kicker) kicker.textContent = 'BET LOCKED · EXECUTION BLOCKED';
    if (bottomLabel) bottomLabel.textContent = labelText;
    if (bottomText) bottomText.textContent = detailText;
    document.title = 'DO NOT PLACE · MITCHELL Racing';
  }

  function addGuardBox(kind, currentPrice, minPrice) {
    const box = $('lockedBets');
    if (!box) return;
    const locked = box.querySelector('.locked-bet');
    if (!locked) return;

    const badge = locked.querySelector('.bet-badge');
    if (badge) badge.textContent = kind === 'LOW' ? 'DO NOT PLACE — PRICE TOO LOW' : 'DO NOT PLACE — LIVE PRICE UNVERIFIED';

    let guard = locked.querySelector('[data-execution-guard]');
    if (!guard) {
      guard = document.createElement('div');
      guard.setAttribute('data-execution-guard', 'true');
      guard.style.marginTop = '10px';
      guard.style.padding = '11px';
      guard.style.borderRadius = '10px';
      guard.style.background = '#35151d';
      guard.style.border = '1px solid #74323e';
      guard.style.color = '#ffb1bb';
      guard.style.fontWeight = '900';
      guard.style.lineHeight = '1.35';
      locked.appendChild(guard);
    }

    if (kind === 'LOW') {
      guard.textContent = `EXECUTION BLOCKED: current fixed-WIN ${currentPrice} is below MIN EXEC ${minPrice}. Do not place the bet. Keep waiting; if the price recovers to ${minPrice} or higher before the race, BET NOW can return.`;
    } else {
      guard.textContent = `EXECUTION BLOCKED: a current fixed-WIN quote cannot be verified against MIN EXEC ${minPrice || '—'}. Do not place the bet until the live quote is verified and passes.`;
    }
  }

  function syncExecutionGuard() {
    if (syncing) return;
    syncing = true;
    try {
      const msg = $('decisionMessage')?.textContent || '';
      const title = $('decisionTitle')?.textContent?.trim() || '';
      const low = msg.match(/current\s+(\$\d+(?:\.\d+)?)\s+quote\s+is\s+below\s+the\s+saved\s+(\$\d+(?:\.\d+)?)\s+minimum/i);

      if (low) {
        const current = low[1];
        const minimum = low[2];
        setBlockedVisuals(
          'DO NOT PLACE — PRICE TOO LOW',
          `${current} is below MIN EXEC ${minimum}. Wait for the price to recover.`,
          'PRICE TOO LOW'
        );
        addGuardBox('LOW', current, minimum);
        return;
      }

      if (/current executable quote cannot be verified/i.test(msg)) {
        const minText = $('lockedBets')?.textContent?.match(/MINIMUM\s*(\$\d+(?:\.\d+)?)/i)?.[1] || null;
        setBlockedVisuals(
          'DO NOT PLACE — PRICE UNVERIFIED',
          'A live executable fixed-WIN quote cannot be verified. Wait.',
          'PRICE UNVERIFIED'
        );
        addGuardBox('UNVERIFIED', null, minText);
        return;
      }

      if (title === 'BET NOW') {
        const kicker = $('decisionKicker');
        if (kicker) kicker.textContent = 'BET LOCKED · LIVE PRICE PASSES MIN EXEC';
      }
    } finally {
      syncing = false;
    }
  }

  function start() {
    const root = $('decisionCard');
    if (!root) return;
    const observer = new MutationObserver(syncExecutionGuard);
    observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true });
    window.setInterval(syncExecutionGuard, 1000);
    syncExecutionGuard();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
