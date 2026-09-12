(() => {
  'use strict';

  const BOOKS = ['Sportsbet','TAB','TABtouch','Ladbrokes','Neds','Unibet','PointsBet','bet365'];
  const STORAGE_PREFIX = 'mitchell_odds_compare_v1_';
  let oddsMode = false;
  let observer = null;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = v => Number.isFinite(Number(v)) && Number(v) > 1 ? Number(v) : null;
  const raceCode = v => String(v || '').trim().toUpperCase();
  const moneyOdds = v => num(v) !== null ? '$' + Number(v).toFixed(2) : '—';
  const horseKey = v => String(v || '').toUpperCase().replace(/^★\s*/,'').replace(/\bNZ\b$/,'').replace(/[^A-Z0-9]+/g,' ').trim().replace(/\s+/g,' ');

  function baseData(){ return window.__MITCHELL_BASE_DATA || {}; }
  function coreRace(){ return raceCode(baseData()?.watchlist?.[0]?.race || baseData()?.stateTracklist?.find(x => x?.corePotential)?.race || 'PR2'); }
  function storeKey(){ return STORAGE_PREFIX + coreRace(); }
  function saved(){ try { return JSON.parse(localStorage.getItem(storeKey()) || '{}'); } catch { return {}; } }
  function save(x){ localStorage.setItem(storeKey(), JSON.stringify(x)); }

  function parseLiveRunners(){
    const race = coreRace();
    const card = document.querySelector(`.watch-card[data-race="${CSS.escape(race)}"]`);
    if (!card) return [];
    const rows = [...card.querySelectorAll('.live-odds-board div[style*="grid-template-columns:34px"]')];
    return rows.map(row => {
      const children = [...row.children];
      const no = String(children[0]?.textContent || '').replace('#','').trim();
      const name = String(children[1]?.textContent || '').replace(/^★\s*/,'').trim();
      const price = num(String(children[2]?.textContent || '').replace('$','').trim());
      return { number:no, name, tabtouch:price };
    }).filter(x => x.name);
  }

  function statsFor(runner, state){
    const vals = [];
    const rows = BOOKS.map(book => {
      const value = book === 'TABtouch' ? runner.tabtouch : num(state?.[horseKey(runner.name)]?.[book]);
      if (value !== null) vals.push({book, value});
      return {book, value};
    });
    const prices = vals.map(x => x.value);
    const avg = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : null;
    const sorted = [...prices].sort((a,b)=>a-b);
    const med = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2) : null;
    const imp = prices.length ? prices.reduce((a,p)=>a + 1/p,0)/prices.length : null;
    const consensus = imp ? 1/imp : null;
    const best = vals.reduce((a,b)=>!a || b.value > a.value ? b : a, null);
    const low = vals.reduce((a,b)=>!a || b.value < a.value ? b : a, null);
    return {rows, count:prices.length, avg, med, consensus, best, low, spread:best&&low ? best.value-low.value : null};
  }

  function styles(){ return `<style id="mitchellOddsCompareStyles">
    .odds-wrap{display:grid;gap:12px;padding-bottom:8px}.odds-hero{position:relative;overflow:hidden;padding:20px;border-radius:18px;background:linear-gradient(145deg,#0d1826 0%,#0a121e 58%,#101a2a 100%);border:1px solid #263a52;box-shadow:0 18px 45px rgba(0,0,0,.28)}
    .odds-hero:after{content:"";position:absolute;width:180px;height:180px;border-radius:50%;right:-65px;top:-70px;background:radial-gradient(circle,rgba(76,189,255,.17),rgba(76,189,255,0) 70%)}
    .odds-kicker{font-size:9px;font-weight:950;letter-spacing:.14em;color:#7ba5cb;text-transform:uppercase}.odds-title{margin:4px 0 0;font-size:27px;line-height:1.05;color:#fff}.odds-sub{margin:8px 0 0;max-width:620px;color:#9eb2c8;font-size:11px;line-height:1.5}.odds-analysis{display:inline-flex;margin-top:12px;padding:6px 9px;border-radius:999px;background:#132b22;border:1px solid #285c49;color:#78efb4;font-size:8px;font-weight:950;letter-spacing:.08em}
    .odds-toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.odds-btn{appearance:none;border:1px solid #315270;background:#122337;color:#eaf4ff;padding:9px 11px;border-radius:10px;font-weight:900;font-size:10px}.odds-btn.danger{border-color:#59313b;background:#29151b;color:#ffb3bd}.odds-updated{margin-left:auto;align-self:center;color:#7790a8;font-size:9px}
    .odds-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.odds-summary>div{padding:10px 11px;border-radius:12px;background:#0a1522;border:1px solid #22374d}.odds-summary span{display:block;font-size:7px;color:#7189a1;font-weight:950;letter-spacing:.09em}.odds-summary strong{display:block;margin-top:4px;color:#f2f8ff;font-size:13px}
    .odds-runner{border-radius:16px;background:linear-gradient(145deg,#0a1522,#0d1928);border:1px solid #253a50;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.18)}.odds-runner.fav{border-color:#2f8060;box-shadow:0 10px 34px rgba(23,120,83,.12)}
    .odds-runner-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:13px 14px 11px}.odds-horse{font-size:15px;font-weight:950;color:#f7fbff}.odds-number{color:#7f96ad;margin-right:6px}.odds-fav-pill{display:inline-flex;margin-left:7px;padding:3px 6px;border-radius:999px;background:#133426;color:#78efb4;font-size:7px;font-weight:950;vertical-align:2px}.odds-best{text-align:right}.odds-best span{display:block;font-size:7px;color:#7189a1;font-weight:950}.odds-best strong{display:block;margin-top:2px;font-size:17px;color:#78efb4}.odds-best small{display:block;margin-top:1px;color:#8ca0b5;font-size:8px}
    .odds-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#1c3044;border-top:1px solid #22374d;border-bottom:1px solid #22374d}.odds-metrics>div{background:#0c1826;padding:8px 9px}.odds-metrics span{display:block;font-size:6.5px;letter-spacing:.07em;color:#6f879f;font-weight:950}.odds-metrics strong{display:block;margin-top:3px;font-size:11px;color:#f2f7fc}
    .odds-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:11px}.odds-book{display:grid;grid-template-columns:1fr 76px;gap:8px;align-items:center;padding:8px 9px;border-radius:10px;background:#101e2e;border:1px solid #223950}.odds-book.best{border-color:#317c5d;background:#0f2920}.odds-book label{font-size:9px;color:#b8c8d8;font-weight:900}.odds-book input{width:100%;box-sizing:border-box;text-align:right;background:#07111c;border:1px solid #29415a;color:#f5f9fd;border-radius:8px;padding:7px 8px;font:inherit;font-size:11px;font-weight:900}.odds-book input[readonly]{color:#7eeeb5;border-color:#2d7256;background:#0c211a}.odds-auto{display:block;color:#64829d;font-size:7px;margin-top:2px}.odds-empty{padding:22px;border-radius:16px;background:#0b1623;border:1px solid #253a50;color:#90a5ba;text-align:center;line-height:1.5}.odds-note{font-size:8.5px;line-height:1.5;color:#758da5;padding:0 4px}
    .premium-nav{grid-template-columns:repeat(5,1fr)!important}.premium-nav button[data-odds-compare-tab] svg{width:19px;height:19px}
    @media(max-width:520px){.odds-summary{grid-template-columns:repeat(2,1fr)}.odds-grid{grid-template-columns:1fr}.odds-metrics{grid-template-columns:repeat(2,1fr)}.odds-updated{width:100%;margin-left:0}.odds-title{font-size:24px}}
  </style>`; }

  function renderOdds(){
    const page = document.getElementById('premiumPage');
    if (!page) return;
    const runners = parseLiveRunners();
    const state = saved();
    const computed = runners.map(r => ({...r, s:statsFor(r,state)}));
    const favourite = computed.filter(x=>x.s.consensus).sort((a,b)=>a.s.consensus-b.s.consensus)[0] || null;
    const widest = computed.filter(x=>x.s.spread!==null).sort((a,b)=>b.s.spread-a.s.spread)[0] || null;
    const booksSeen = new Set(); computed.forEach(x=>x.s.rows.forEach(b=>{if(b.value!==null)booksSeen.add(b.book);}));
    const stamp = new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Perth',hour:'numeric',minute:'2-digit',second:'2-digit'}).format(new Date());

    page.innerHTML = `${styles()}<div class="odds-wrap">
      <section class="odds-hero"><div class="odds-kicker">${esc(coreRace())} · bookmaker comparison</div><h2 class="odds-title">Market Odds</h2><p class="odds-sub">Compare the main Australian bookmakers side-by-side. TABtouch fills automatically from the app; enter the other live prices and the averages recalculate instantly.</p><span class="odds-analysis">ANALYSIS ONLY · DOES NOT CHANGE V11</span><div class="odds-toolbar"><button class="odds-btn" id="oddsRefreshLive" type="button">REFRESH TABTOUCH</button><button class="odds-btn danger" id="oddsClear" type="button">CLEAR MANUAL ODDS</button><span class="odds-updated">view updated ${esc(stamp)} Perth</span></div></section>
      ${runners.length ? `<section class="odds-summary"><div><span>CONSENSUS FAVOURITE</span><strong>${esc(favourite?.name||'—')}</strong></div><div><span>CONSENSUS PRICE</span><strong>${moneyOdds(favourite?.s?.consensus)}</strong></div><div><span>BOOKMAKERS SEEN</span><strong>${booksSeen.size}</strong></div><div><span>WIDEST DISAGREEMENT</span><strong>${widest?`${esc(widest.name)} · $${widest.s.spread.toFixed(2)}`:'—'}</strong></div></section>` : ''}
      ${runners.length ? computed.map(x=>{
        const isFav=favourite&&horseKey(favourite.name)===horseKey(x.name);
        return `<article class="odds-runner ${isFav?'fav':''}"><div class="odds-runner-head"><div class="odds-horse"><span class="odds-number">#${esc(x.number||'—')}</span>${esc(x.name)}${isFav?'<span class="odds-fav-pill">CONSENSUS FAV</span>':''}</div><div class="odds-best"><span>BEST AVAILABLE</span><strong>${moneyOdds(x.s.best?.value)}</strong><small>${esc(x.s.best?.book||'')}</small></div></div><div class="odds-metrics"><div><span>AVERAGE</span><strong>${moneyOdds(x.s.avg)}</strong></div><div><span>CONSENSUS</span><strong>${moneyOdds(x.s.consensus)}</strong></div><div><span>MEDIAN</span><strong>${moneyOdds(x.s.med)}</strong></div><div><span>RANGE</span><strong>${x.s.low&&x.s.best?`${moneyOdds(x.s.low.value)}–${moneyOdds(x.s.best.value)}`:'—'}</strong></div></div><div class="odds-grid">${x.s.rows.map(b=>`<div class="odds-book ${x.s.best&&b.book===x.s.best.book?'best':''}"><label>${esc(b.book)}${b.book==='TABtouch'?'<span class="odds-auto">AUTO FROM APP</span>':''}</label><input ${b.book==='TABtouch'?'readonly':''} inputmode="decimal" data-horse="${esc(horseKey(x.name))}" data-book="${esc(b.book)}" placeholder="—" value="${b.value!==null?Number(b.value).toFixed(2):''}"></div>`).join('')}</div></article>`;
      }).join('') : `<div class="odds-empty">Live runner prices have not populated yet. Press <b>REFRESH TABTOUCH</b>, then reopen this tab in a few seconds.</div>`}
      <div class="odds-note">Average = arithmetic mean of the available prices. Consensus = inverse of the average implied probability, so it is less distorted by one very high quote. Manual bookmaker entries are saved only in this browser. Betfair/exchange prices are intentionally not mixed into the fixed-odds average.</div>
    </div>`;

    page.querySelectorAll('.odds-book input:not([readonly])').forEach(input=>input.addEventListener('input',()=>{
      const next=saved(), horse=input.dataset.horse, book=input.dataset.book, value=String(input.value||'').trim();
      next[horse]=next[horse]||{};
      if(value) next[horse][book]=value; else delete next[horse][book];
      save(next); renderOdds();
    }));
    document.getElementById('oddsClear')?.addEventListener('click',()=>{localStorage.removeItem(storeKey());renderOdds();});
    document.getElementById('oddsRefreshLive')?.addEventListener('click',()=>{document.getElementById('refreshButton')?.click();setTimeout(renderOdds,2200);});
  }

  function ensureTab(){
    const nav=document.querySelector('.premium-nav');
    if(!nav)return;
    let btn=nav.querySelector('[data-odds-compare-tab]');
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.dataset.oddsCompareTab='1';
      btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-3M9 18v-6M14 18V8M19 18V4"/><path d="M3 21h18"/></svg><span>Odds</span>';
      const settings=nav.querySelector('[data-premium-tab="settings"]');
      settings?nav.insertBefore(btn,settings):nav.appendChild(btn);
      btn.addEventListener('click',()=>{oddsMode=true;nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));renderOdds();window.scrollTo({top:0,behavior:'auto'});});
    }
    if(oddsMode)nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));
  }

  document.addEventListener('click',e=>{if(e.target.closest('[data-premium-tab]'))oddsMode=false;},true);

  function mount(){
    const tryMount=()=>{
      const root=document.getElementById('premiumApp');
      if(!root){setTimeout(tryMount,150);return;}
      ensureTab();
      observer=new MutationObserver(()=>{ensureTab();if(oddsMode&&!document.querySelector('.odds-wrap'))setTimeout(renderOdds,0);});
      observer.observe(root,{childList:true,subtree:true});
    };
    tryMount();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
