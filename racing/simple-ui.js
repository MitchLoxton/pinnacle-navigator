(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const cardState = card => {
    if (!card) return 'WAIT';
    if (card.classList.contains('bet-now')) return 'BET';
    if (card.classList.contains('no-bet') || card.classList.contains('blocked')) return 'NO';
    return 'WAIT';
  };

  function normalizeMonitoringState() {
    const card = $('decisionCard');
    const message = $('decisionMessage');
    const bottom = $('bottomCommand');
    const text = String(message?.textContent || '');
    if (!card || !card.classList.contains('no-bet')) return;
    if (!/upcoming V11 race|being monitored/i.test(text)) return;
    card.className = 'decision-card waiting';
    if (bottom) bottom.className = 'bottom-command waiting';
    if ($('decisionKicker')) $('decisionKicker').textContent = 'YOUR ACTION';
    if ($('decisionTitle')) $('decisionTitle').textContent = 'WAIT';
    if (message) message.textContent = 'Possible races are being monitored. Do not bet unless this box turns green and says BET NOW.';
    if ($('bottomLabel')) $('bottomLabel').textContent = 'WAIT';
    if ($('bottomText')) $('bottomText').textContent = 'Do nothing unless the top box turns green and says BET NOW.';
  }

  function syncPlainInstruction() {
    normalizeMonitoringState();
    const card = $('decisionCard');
    const panel = $('plainInstruction');
    if (!card || !panel) return;
    const state = cardState(card);
    panel.className = `plain-instruction ${state === 'BET' ? 'plain-bet' : state === 'NO' ? 'plain-no' : 'plain-wait'}`;
    const title = panel.querySelector('[data-simple-title]');
    const text = panel.querySelector('[data-simple-text]');
    if (state === 'BET') {
      if (title) title.textContent = 'PLACE THE BET SHOWN ABOVE';
      if (text) text.textContent = 'Use the exact horse, stake and minimum price in the green box. After the bookmaker accepts it, record the accepted bet in the app.';
    } else if (state === 'NO') {
      if (title) title.textContent = 'DO NOT BET';
      if (text) text.textContent = 'Skip it. Do not try to rescue, chase or choose another horse.';
    } else {
      if (title) title.textContent = 'WAIT — DO NOTHING';
      if (text) text.textContent = 'Keep the app open. A possible race is not a bet. Only act if the top box turns green and literally says BET NOW.';
    }
  }

  function syncFocus(data) {
    const el = $('focusRaces');
    if (!el) return;
    const items = Array.isArray(data?.watchlist) ? data.watchlist : [];
    if (!items.length) {
      el.textContent = 'No V11 CORE possibilities currently';
      return;
    }
    el.textContent = items.map(x => String(x?.race || x?.code || '').toUpperCase()).filter(Boolean).join(' + ') + ' are being watched';
  }

  function makeSimpleCommand(card) {
    if (!card || card.dataset.simpleUi === '1') return;
    card.dataset.simpleUi = '1';
    const text = String(card.textContent || '').toUpperCase();
    const isBet = text.includes('BET LOCKED') || text.includes('CHECK TOP BOX');
    const isNo = text.includes('NO BET — FINAL') || text.includes('FINAL NO BET');
    const command = document.createElement('div');
    command.className = `simple-card-command ${isBet ? 'simple-card-bet' : isNo ? 'simple-card-no' : 'simple-card-wait'}`;
    command.innerHTML = isBet
      ? '<span>WHAT YOU DO</span><strong>CHECK THE GREEN TOP BOX</strong><small>Only place it if the top box says BET NOW.</small>'
      : isNo
        ? '<span>WHAT YOU DO</span><strong>SKIP THIS RACE</strong><small>Final no bet. Nothing else to decide.</small>'
        : '<span>WHAT YOU DO</span><strong>WAIT — DO NOT BET</strong><small>This race is only being watched.</small>';

    const first = card.firstElementChild;
    if (first?.nextSibling) card.insertBefore(command, first.nextSibling);
    else card.prepend(command);

    const verbose = [];
    [...card.children].forEach(node => {
      if (node === command || node === first) return;
      const nodeText = String(node.textContent || '');
      if (node.classList.contains('live-odds-board') ||
          (nodeText.includes('1. FIELD') && nodeText.includes('4. V11 DECISION')) ||
          nodeText.includes('Still waiting:') ||
          nodeText.includes('V11 HAS LOCKED THIS RACE') ||
          nodeText.includes('FINAL NO BET.')) {
        node.classList.add('simple-hidden-detail');
        verbose.push(node);
      }
    });

    if (verbose.length) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'simple-detail-button';
      button.textContent = 'Show live details';
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') === 'true';
        verbose.forEach(node => node.classList.toggle('simple-detail-open', !open));
        button.setAttribute('aria-expanded', String(!open));
        button.textContent = open ? 'Show live details' : 'Hide live details';
      });
      card.appendChild(button);
    }
  }

  function simplifyWatchlist() {
    document.querySelectorAll('#watchlist article.watch-card').forEach(makeSimpleCommand);
  }

  function installObservers() {
    const decision = $('decisionCard');
    if (decision) {
      new MutationObserver(syncPlainInstruction).observe(decision, { attributes:true, childList:true, subtree:true, characterData:true });
    }
    const watch = $('watchlist');
    if (watch) {
      new MutationObserver(() => {
        window.requestAnimationFrame(simplifyWatchlist);
      }).observe(watch, { childList:true, subtree:true });
    }
  }

  window.addEventListener('mitchell-base-ready', event => {
    syncFocus(event.detail || window.__MITCHELL_BASE_DATA);
    simplifyWatchlist();
    syncPlainInstruction();
  });

  document.addEventListener('DOMContentLoaded', () => {
    syncFocus(window.__MITCHELL_BASE_DATA);
    syncPlainInstruction();
    simplifyWatchlist();
    installObservers();
  });
})();
