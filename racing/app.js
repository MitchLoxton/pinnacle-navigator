(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const state = { data: null, refreshing: false };
  const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

  function escapeHTML(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function statusClass(value) {
    const s = String(value || '').toUpperCase();
    if (s.includes('GREEN') || s.includes('PRODUCTION') || s.includes('LOCKED') || s === 'WATCH') return 'green';
    if (s.includes('RED') || s.includes('NO BET') || s.includes('BLOCK')) return 'red';
    if (s.includes('RESEARCH')) return 'research';
    return 'wait';
  }

  function formatDateOnly(dateString) {
    if (!dateString) return '';
    const [y, m, d] = String(dateString).split('-').map(Number);
    if (!y || !m || !d) return String(dateString);
    return new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(new Date(Date.UTC(y, m - 1, d)));
  }

  function formatUpdated(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Update time unavailable';
    return 'Updated ' + new Intl.DateTimeFormat('en-AU', {
      day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Perth'
    }).format(date) + ' Perth';
  }

  function renderMeeting(m) {
    const cls = statusClass(m.status);
    return `<div class="meeting-row">
      <div class="meeting-main">
        <strong>${escapeHTML(m.region)}</strong>
        <div class="meta">${escapeHTML(m.venue)}${m.date ? ' · ' + escapeHTML(formatDateOnly(m.date)) : ''}</div>
      </div>
      <div class="meeting-side">
        <span class="code">${escapeHTML(m.code)}</span>
        <span class="pill ${cls}">${escapeHTML(m.status)}</span>
      </div>
    </div>`;
  }

  function renderLockedBet(bet) {
    const cls = statusClass(bet.status || 'BET LOCKED');
    const stake = Number(bet.stakeAud || 0);
    const minExec = Number(bet.minExec || 0);
    return `<div class="bet-row">
      <div class="bet-main">
        <strong>${escapeHTML(bet.race || '')} · ${escapeHTML(bet.horse || '')}</strong>
        <div class="meta">${escapeHTML(bet.venue || bet.region || '')}${bet.jumpTime ? ' · ' + escapeHTML(bet.jumpTime) : ''}${bet.note ? ' · ' + escapeHTML(bet.note) : ''}</div>
      </div>
      <div class="bet-side">
        <span class="code">${stake > 0 ? money.format(stake) : 'STAKE PENDING'}</span>
        <span class="pill ${cls}">${minExec > 0 ? 'MIN ' + minExec.toFixed(2) : escapeHTML(bet.status || 'BET LOCKED')}</span>
      </div>
    </div>`;
  }

  function renderPotentialBet(item) {
    const stateNo = Number(item.state);
    const priceGate = Number(item.priceGate || 0);
    const coreBase = Number(item.coreBaseReferenceAud || 0);
    const horse = item.provisionalHorse || 'Favourite TBC';
    const metaBits = [item.venue || item.region || ''];
    if (Number.isFinite(stateNo)) metaBits.push(`state ${stateNo}`);
    if (item.qualifyingKey) metaBits.push(item.qualifyingKey);
    if (item.why) metaBits.push(item.why);
    const gateText = priceGate > 0 ? `$${priceGate.toFixed(2)}+ screen` : 'PRICE TBC';
    return `<div class="bet-row potential-row">
      <div class="bet-main">
        <strong>${escapeHTML(item.race || '')} · ${escapeHTML(horse)}</strong>
        <div class="meta">${metaBits.filter(Boolean).map(escapeHTML).join(' · ')}</div>
      </div>
      <div class="bet-side">
        <span class="code">${coreBase > 0 ? 'CORE REF ' + money.format(coreBase) : 'V11 STATE'}</span>
        <span class="pill wait">${escapeHTML(gateText)}</span>
      </div>
    </div>`;
  }

  function renderData(data) {
    state.data = data;
    $('weekLabel').textContent = data.weekLabel || 'Current racing week';
    $('overallStatus').textContent = data.overallStatus || 'WAIT';
    $('overallMessage').textContent = data.overallMessage || 'No current instruction.';
    $('productionRule').textContent = data.productionRule || '';
    $('updatedAt').textContent = formatUpdated(data.updatedAt);
    $('appVersion').textContent = `v${data.appVersion || '0.1.0'}`;

    const cls = statusClass(data.overallStatus);
    $('statusDot').className = `status-dot ${cls}`;
    $('overallStatus').className = `status-label ${cls}`;

    const locked = Array.isArray(data.lockedBets) ? data.lockedBets : [];
    $('lockedBets').innerHTML = locked.map(renderLockedBet).join('');
    $('noLockedBets').hidden = locked.length > 0;
    $('actionPill').textContent = locked.length ? `${locked.length} LOCKED` : 'NO LOCK YET';
    $('actionPill').className = `pill ${locked.length ? 'green' : 'wait'}`;

    const potential = Array.isArray(data.watchlist) ? data.watchlist : [];
    $('potentialBets').innerHTML = potential.map(renderPotentialBet).join('');
    $('auPotentialBets').innerHTML = potential.length ? potential.map(renderPotentialBet).join('') : '<div class="empty-state"><strong>No current Australian potential bets.</strong></div>';
    $('noPotentialBets').hidden = potential.length > 0;
    $('potentialPill').textContent = potential.length ? `${potential.length} POTENTIAL` : 'NONE';
    $('potentialPill').className = `pill ${potential.length ? 'wait' : 'red'}`;

    const meetings = Array.isArray(data.meetings) ? data.meetings : [];
    $('meetings').innerHTML = meetings.map(renderMeeting).join('');
    $('auMeetings').innerHTML = meetings.filter(m => String(m.region).toLowerCase() !== 'hong kong').map(renderMeeting).join('');
    $('hkMeeting').innerHTML = meetings.filter(m => String(m.region).toLowerCase() === 'hong kong').map(renderMeeting).join('') || '<div class="empty-state"><strong>No Hong Kong meeting published.</strong></div>';

    const au = data.models?.australia || {};
    const hk = data.models?.hongKong || {};
    $('auModelName').textContent = au.name || 'V11';
    $('auModelNote').textContent = au.note || '';
    $('hkModelName').textContent = hk.name || 'R23 PLACE BACK';
    $('hkModelNote').textContent = hk.note || '';

    const storedStake = Number(localStorage.getItem('mitchellRacingStake'));
    if (!$('stakeInput').value) $('stakeInput').value = String(storedStake > 0 ? storedStake : Number(data.stakeDefaultAud || 1000));
    updateMoney();

    const health = data.health || {};
    const labels = [
      ['App feed', health.appFeed || 'UNKNOWN'],
      ['Australia production', health.auProduction || 'UNKNOWN'],
      ['Pre-race watchlist', health.watchlist || 'UNKNOWN'],
      ['Hong Kong', health.hkProduction || 'UNKNOWN'],
      ['Evidence boundary', health.source || 'Production dashboard is source of truth']
    ];
    $('healthRows').innerHTML = labels.map(([name, value]) => `<div class="health-row"><strong>${escapeHTML(name)}</strong><span class="health-value ${statusClass(value)}">${escapeHTML(value)}</span></div>`).join('');
  }

  async function loadData(manual = false) {
    if (state.refreshing) return;
    state.refreshing = true;
    $('refreshButton').disabled = true;
    $('refreshState').textContent = manual ? 'Refreshing…' : 'Checking latest…';
    try {
      const response = await fetch(`./current.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      renderData(data);
      $('refreshState').textContent = 'Latest loaded';
    } catch (error) {
      console.error('Racing data refresh failed', error);
      $('refreshState').textContent = state.data ? 'Offline · showing last loaded state' : 'Could not load data';
    } finally {
      state.refreshing = false;
      $('refreshButton').disabled = false;
    }
  }

  function updateMoney() {
    if (!state.data) return;
    let stake = Number($('stakeInput').value);
    if (!Number.isFinite(stake) || stake < 1) stake = 1;
    if (stake > 100000) stake = 100000;
    $('stakeInput').value = String(Math.round(stake));
    localStorage.setItem('mitchellRacingStake', String(stake));

    const auPer1000 = Number(state.data.models?.australia?.historicalEquivalentProfitPer1000Stake || 0);
    const hkPer1000 = Number(state.data.models?.hongKong?.modelEquivalentProfitPer1000Stake || 0);
    const ddUnits = Number(state.data.models?.hongKong?.proxyMaxDrawdownUnits || 0);
    const au = auPer1000 * stake / 1000;
    const hk = hkPer1000 * stake / 1000;
    $('auProjection').textContent = money.format(au);
    $('hkProjection').textContent = money.format(hk);
    $('combinedProjection').textContent = money.format(au + hk);
    $('hkDrawdown').textContent = money.format(ddUnits * stake);
  }

  function readLogs() {
    try {
      const value = JSON.parse(localStorage.getItem('mitchellRacingExecutionLog') || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveLogs(logs) {
    localStorage.setItem('mitchellRacingExecutionLog', JSON.stringify(logs.slice(-100)));
  }

  function renderLogs() {
    const logs = readLogs().slice().reverse();
    $('executionLog').innerHTML = logs.length ? logs.map(item => `<div class="log-row">
      <div class="log-main"><strong>${escapeHTML(item.race)} · ${escapeHTML(item.horse)}</strong><div class="meta">${escapeHTML(item.time)}</div></div>
      <div class="meeting-side"><span class="code">${money.format(item.stake)}</span><span class="pill green">@ ${Number(item.price).toFixed(2)}</span></div>
    </div>`).join('') : '<div class="empty-state"><strong>No execution saved on this phone.</strong><span>Record the real accepted stake and price after a genuine locked bet.</span></div>';
  }

  function setupTabs() {
    document.querySelectorAll('.tab').forEach(button => {
      button.addEventListener('click', () => {
        const name = button.dataset.tab;
        document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === button));
        document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === name));
      });
    });
  }

  function setupExecutionForm() {
    $('executionForm').addEventListener('submit', event => {
      event.preventDefault();
      const race = $('logRace').value.trim().toUpperCase();
      const horse = $('logHorse').value.trim();
      const price = Number($('logPrice').value);
      const stake = Number($('logStake').value);
      const message = $('formMessage');
      message.className = 'form-message';
      if (!race || !horse || !Number.isFinite(price) || price < 1.01 || !Number.isFinite(stake) || stake <= 0) {
        message.textContent = 'Enter race, horse, accepted price and accepted stake.';
        message.classList.add('error');
        return;
      }
      const logs = readLogs();
      logs.push({ race, horse, price, stake, time: new Date().toLocaleString('en-AU') });
      saveLogs(logs);
      $('executionForm').reset();
      message.textContent = 'Execution saved on this phone.';
      message.classList.add('success');
      renderLogs();
    });

    $('clearLogButton').addEventListener('click', () => {
      const logs = readLogs();
      if (!logs.length) return;
      if (window.confirm('Clear the execution log saved on this phone?')) {
        localStorage.removeItem('mitchellRacingExecutionLog');
        renderLogs();
      }
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => console.error('Service worker failed', error));
    });
  }

  setupTabs();
  setupExecutionForm();
  renderLogs();
  $('refreshButton').addEventListener('click', () => loadData(true));
  $('stakeInput').addEventListener('change', updateMoney);
  $('stakeInput').addEventListener('blur', updateMoney);
  registerServiceWorker();
  loadData(false);

  setInterval(() => {
    if (document.visibilityState === 'visible') loadData(false);
  }, 60000);
})();
