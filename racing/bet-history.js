(() => {
  'use strict';

  const HISTORY_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-execution?limit=10000';
  const money = new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 });
  const dateFmt = new Intl.DateTimeFormat('en-AU', { timeZone:'Australia/Perth', day:'2-digit', month:'short', year:'numeric' });
  const timeFmt = new Intl.DateTimeFormat('en-AU', { timeZone:'Australia/Perth', hour:'numeric', minute:'2-digit' });
  let store = { loading:false, loaded:false, rows:[], summary:null, error:'', truncated:false };
  let revision = 0;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const num = v => (v === null || v === undefined || v === '') ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
  const cash = v => num(v) === null ? '—' : money.format(num(v));
  const odds = v => num(v) === null ? '—' : `$${num(v).toFixed(2)}`;
  const result = v => ['WIN','LOSS'].includes(String(v || '').toUpperCase()) ? String(v).toUpperCase() : 'PENDING';
  const resultClass = v => result(v) === 'WIN' ? 'win' : result(v) === 'LOSS' ? 'loss' : 'pending';
  const valueClass = v => num(v) === null || num(v) === 0 ? '' : num(v) > 0 ? 'good' : 'bad';

  function addStyles(){
    if(document.getElementById('premiumBetHistoryStyles')) return;
    const el=document.createElement('style');
    el.id='premiumBetHistoryStyles';
    el.textContent=`
      #premiumPage:has(.pbh-shell){display:block!important}
      .pbh-shell{overflow:hidden;padding:0!important;border-radius:30px!important;min-height:620px;background:linear-gradient(145deg,rgba(12,20,29,.96),rgba(6,11,17,.98))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 28px 90px rgba(0,0,0,.28)!important}
      .pbh-head{padding:28px 30px 24px;border-bottom:1px solid rgba(255,255,255,.07);background:radial-gradient(520px 220px at 92% 0%,rgba(226,179,90,.09),transparent 72%),linear-gradient(180deg,rgba(255,255,255,.018),transparent)}
      .pbh-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.pbh-kicker{font-size:9px;font-weight:950;letter-spacing:.18em;color:#8e9aa7}.pbh-title{margin:5px 0 0;font-size:34px;line-height:1;letter-spacing:-.045em;color:#f7f9fb}.pbh-sub{margin:9px 0 0;max-width:820px;font-size:11px;line-height:1.55;color:#8d99a7}
      .pbh-refresh{flex:0 0 auto;min-height:40px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);color:#dbe4ed;font-size:9px;font-weight:950;letter-spacing:.08em;cursor:pointer}.pbh-refresh:disabled{opacity:.48;cursor:default}
      .pbh-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:22px}.pbh-stat{padding:13px 14px;border-radius:15px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.018)}.pbh-stat span,.pbh-cell span{display:block;font-size:7px;font-weight:900;letter-spacing:.11em;color:#6f7d8b;text-transform:uppercase}.pbh-stat strong{display:block;margin-top:4px;font-size:18px;color:#eef3f8}.pbh-stat.good strong,.pbh-pl.good{color:#8bf7b6!important}.pbh-stat.bad strong,.pbh-pl.bad{color:#ff9daa!important}
      .pbh-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,.055);background:rgba(5,10,15,.65)}.pbh-toolbar strong{font-size:9px;letter-spacing:.1em;color:#c9d3dd}.pbh-toolbar span{font-size:8px;color:#697684}
      .pbh-list{height:clamp(430px,58vh,790px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:10px 12px 18px;scrollbar-gutter:stable}.pbh-list::-webkit-scrollbar{width:9px}.pbh-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border:3px solid transparent;background-clip:padding-box;border-radius:99px}
      .pbh-row{display:grid;grid-template-columns:minmax(215px,1.35fr) repeat(5,minmax(92px,.58fr));align-items:center;gap:8px;min-height:88px;padding:12px 13px;margin-bottom:7px;border:1px solid rgba(255,255,255,.055);border-radius:17px;background:linear-gradient(120deg,rgba(255,255,255,.018),rgba(255,255,255,.007))}.pbh-main{min-width:0}.pbh-date{font-size:8px;font-weight:850;letter-spacing:.05em;color:#71808f}.pbh-horse{margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px;font-weight:950;color:#f4f7fa}.pbh-race{margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:9px;color:#91a0af}.pbh-race b{color:#d4dde6}
      .pbh-cell{min-width:0;padding:7px 9px;border-left:1px solid rgba(255,255,255,.045)}.pbh-cell strong{display:block;margin-top:4px;font-size:13px;color:#e9eef3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pbh-cell small{display:block;margin-top:3px;font-size:7.5px;color:#657382;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .pbh-result{display:inline-flex!important;align-items:center;justify-content:center;width:max-content;min-width:58px;padding:6px 9px;border-radius:99px;font-size:9px!important;font-weight:950!important}.pbh-result.win{color:#9bffc1!important;background:rgba(55,209,118,.12);border:1px solid rgba(98,243,155,.24)}.pbh-result.loss{color:#ffadb7!important;background:rgba(255,96,116,.10);border:1px solid rgba(255,125,139,.22)}.pbh-result.pending{color:#f4d58f!important;background:rgba(226,179,90,.1);border:1px solid rgba(226,179,90,.2)}
      .pbh-message{display:grid;place-items:center;min-height:430px;padding:40px 22px;text-align:center}.pbh-message h3{margin:0;font-size:18px;color:#eef3f8}.pbh-message p{max-width:540px;margin:8px auto 0;font-size:10px;line-height:1.55;color:#788695}.pbh-error h3{color:#ffadb7}.pbh-foot{padding:11px 18px;border-top:1px solid rgba(255,255,255,.055);font-size:8px;line-height:1.5;color:#5f6c79;background:rgba(5,9,14,.72)}
      @media(max-width:980px){.pbh-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.pbh-row{grid-template-columns:minmax(180px,1.2fr) repeat(3,minmax(88px,.6fr))}.pbh-hide-tablet{display:none}}
      @media(max-width:650px){.pbh-shell{border-radius:24px!important;min-height:0}.pbh-head{padding:21px 18px 18px}.pbh-title{font-size:28px}.pbh-sub{font-size:9.5px}.pbh-refresh{min-height:37px;padding:0 11px;font-size:8px}.pbh-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:17px}.pbh-stats .pbh-stat:last-child{grid-column:1/-1}.pbh-toolbar{padding:10px 13px}.pbh-toolbar span{display:none}.pbh-list{height:58vh;min-height:390px;padding:8px}.pbh-row{grid-template-columns:1fr 1fr;gap:9px;min-height:0;padding:14px}.pbh-main{grid-column:1/-1;padding-bottom:9px;border-bottom:1px solid rgba(255,255,255,.05)}.pbh-cell{padding:5px 4px;border-left:0}.pbh-hide-mobile{display:none}.pbh-message{min-height:390px}}
    `;
    document.head.appendChild(el);
  }

  function open(){ return !!document.querySelector('[data-premium-tab="history"].active') && !!document.getElementById('premiumPage'); }
  function when(x){ const raw=x?.jumpAt||x?.executionConfirmedAt||x?.date; const d=raw?new Date(raw):null; if(!d||Number.isNaN(d.getTime())) return esc(x?.date||'—'); return `${esc(dateFmt.format(d))}${(x?.jumpAt||x?.executionConfirmedAt)?` · ${esc(timeFmt.format(d))}`:''}`; }
  function withRunning(rows){ let total=0; return [...rows].reverse().map(x=>{const p=num(x?.cashPl);if(p!==null)total+=p;return {...x,runningPl:total};}).reverse(); }

  function row(x){
    const before=num(x?.stateBefore), after=num(x?.stateAfter);
    const stateFlow=before===null?'—':after===null?String(before):`${before} → ${after}`;
    const winner=x?.winnerName?`${x?.winnerNumber?`#${x.winnerNumber} `:''}${x.winnerName}`:(x?.winnerNumber?`#${x.winnerNumber}`:'—');
    const modelDiff=num(x?.modelStake)!==null&&num(x?.modelStake)!==num(x?.acceptedStake);
    return `<article class="pbh-row">
      <div class="pbh-main"><div class="pbh-date">${when(x)} · ACTUAL BET</div><div class="pbh-horse">${esc(x?.horse||'Horse unavailable')}</div><div class="pbh-race"><b>${esc(x?.race||'—')}</b>${x?.venue?` · ${esc(x.venue)}`:''}</div></div>
      <div class="pbh-cell"><span>BET AMOUNT</span><strong>${esc(cash(x?.acceptedStake))}</strong><small>${modelDiff?`model ${esc(cash(x.modelStake))}`:'accepted stake'}</small></div>
      <div class="pbh-cell"><span>ODDS</span><strong>${esc(odds(x?.acceptedPrice))}</strong><small>${num(x?.signalPrice)!==null?`signal ${esc(odds(x.signalPrice))}`:'accepted fixed'}</small></div>
      <div class="pbh-cell"><span>STATE</span><strong>${esc(stateFlow)}</strong><small>${before!==null?`entered at ${before}`:'state unavailable'}</small></div>
      <div class="pbh-cell"><span>RESULT</span><strong class="pbh-result ${resultClass(x?.result)}">${result(x?.result)}</strong><small>winner ${esc(winner)}</small></div>
      <div class="pbh-cell pbh-hide-mobile"><span>CASH P/L</span><strong class="pbh-pl ${valueClass(x?.cashPl)}">${num(x?.cashPl)!==null?esc(cash(x.cashPl)):'PENDING'}</strong><small>${num(x?.runningPl)!==null?`running ${esc(cash(x.runningPl))}`:'not settled'}</small></div>
      <div class="pbh-cell pbh-hide-tablet pbh-hide-mobile"><span>OFFICIAL SP</span><strong>${esc(odds(x?.officialSp))}</strong><small>${esc(String(x?.evidenceStatus||'evidence —').replaceAll('_',' '))}</small></div>
    </article>`;
  }

  function stats(){
    const s=store.summary||{};
    const bets=num(s.bets)??store.rows.length, wins=num(s.wins)??0, losses=num(s.losses)??0;
    const staked=num(s.totalStake)??0, pl=num(s.totalPl)??0, roi=staked>0?pl/staked*100:null;
    return `<div class="pbh-stats"><div class="pbh-stat"><span>RECORDED BETS</span><strong>${bets}</strong></div><div class="pbh-stat"><span>W / L</span><strong>${wins} / ${losses}</strong></div><div class="pbh-stat"><span>TOTAL STAKED</span><strong>${esc(cash(staked))}</strong></div><div class="pbh-stat ${valueClass(pl)}"><span>TOTAL P/L</span><strong>${esc(cash(pl))}</strong></div><div class="pbh-stat ${roi===null?'':valueClass(roi)}"><span>ACTUAL ROI</span><strong>${roi===null?'—':`${roi>=0?'+':''}${roi.toFixed(1)}%`}</strong></div></div>`;
  }

  function markup(){
    const head=`<section class="premium-card pbh-shell"><header class="pbh-head"><div class="pbh-top"><div><div class="pbh-kicker">ACTUAL EXECUTION LEDGER</div><h1 class="pbh-title">Bet History</h1><p class="pbh-sub">Newest bet first. Scroll down through every confirmed cash bet stored by MITCHELL Racing — race, horse, accepted stake, accepted odds, state, result, P/L and audit details.</p></div><button class="pbh-refresh" id="pbhRefresh" type="button" ${store.loading?'disabled':''}>${store.loading?'LOADING…':'REFRESH'}</button></div>${stats()}</header>`;
    if(store.loading&&!store.loaded) return `${head}<div class="pbh-message"><div><h3>Loading bet history…</h3><p>Reading the confirmed execution ledger from newest to oldest.</p></div></div><div class="pbh-foot">Only accepted, confirmed executions appear here.</div></section>`;
    if(store.error&&!store.loaded) return `${head}<div class="pbh-message pbh-error"><div><h3>History could not load</h3><p>${esc(store.error)}</p></div></div><div class="pbh-foot">History availability does not change the live V11 decision.</div></section>`;
    if(!store.rows.length) return `${head}<div class="pbh-message"><div><h3>No confirmed cash bets recorded yet</h3><p>The ledger is ready. The first accepted and recorded V11 bet will appear here automatically, then this list will keep growing.</p></div></div><div class="pbh-foot">State-only races and unplaced model signals are intentionally excluded from actual cash-bet history.</div></section>`;
    const rows=withRunning(store.rows).map(row).join('');
    return `${head}<div class="pbh-toolbar"><strong>${store.rows.length.toLocaleString('en-AU')} ACTUAL BET${store.rows.length===1?'':'S'} · NEWEST FIRST</strong><span>SCROLL DOWN TO GO BACK${store.truncated?' · LIMIT REACHED':''}</span></div><div class="pbh-list">${rows}</div><div class="pbh-foot">Accepted stake + accepted price drive cash P/L. Signal values are audit references only.</div></section>`;
  }

  function paint(){
    if(!open()) return;
    const page=document.getElementById('premiumPage'); if(!page) return;
    const key=[revision,store.loading,store.loaded,store.error,store.rows.length,store.truncated].join('|');
    if(page.dataset.betHistoryKey===key&&page.querySelector('.pbh-shell')) return;
    page.dataset.betHistoryKey=key; page.innerHTML=markup();
    document.getElementById('pbhRefresh')?.addEventListener('click',()=>load(true),{once:true});
    if(!store.loaded&&!store.loading) load(false);
  }

  async function load(force=false){
    if(store.loading||(store.loaded&&!force)) return;
    if(!navigator.onLine){store={...store,error:'You are offline'};revision++;paint();return;}
    store={...store,loading:true,error:''};revision++;paint();
    try{
      const r=await fetch(`${HISTORY_URL}&_=${Date.now()}`,{method:'GET',cache:'no-store'});
      const body=await r.json().catch(()=>({}));
      if(!r.ok||body?.ok!==true) throw new Error(body?.error||`HTTP ${r.status}`);
      store={loading:false,loaded:true,rows:Array.isArray(body?.history)?body.history:[],summary:body?.summary||null,error:'',truncated:body?.truncated===true};
    }catch(e){ store={...store,loading:false,error:e instanceof Error?e.message:'History request failed'}; }
    revision++;paint();
  }

  function attach(){
    addStyles();
    const app=document.getElementById('premiumApp'); if(!app){setTimeout(attach,100);return;}
    new MutationObserver(()=>setTimeout(paint,0)).observe(app,{childList:true,subtree:true});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&open()&&store.loaded)load(true)});
    window.addEventListener('online',()=>{if(open())load(true)});
    window.addEventListener('mitchell-refresh-live',()=>{if(open())load(true)});
    paint();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',attach,{once:true}); else attach();
})();
