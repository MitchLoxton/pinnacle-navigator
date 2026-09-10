(() => {
  'use strict';

  const HISTORY_URL = 'https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-execution?limit=10000';
  const money = new Intl.NumberFormat('en-AU', { style:'currency', currency:'AUD', maximumFractionDigits:0 });
  const dateFmt = new Intl.DateTimeFormat('en-AU', { timeZone:'Australia/Perth', day:'2-digit', month:'short', year:'numeric' });
  const timeFmt = new Intl.DateTimeFormat('en-AU', { timeZone:'Australia/Perth', hour:'numeric', minute:'2-digit' });
  let state = { loading:false, loaded:false, rows:[], summary:null, error:'', truncated:false };
  let version = 0;

  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const finite = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const cash = v => finite(v) !== null ? money.format(finite(v)) : '—';
  const odds = v => finite(v) !== null ? `$${finite(v).toFixed(2)}` : '—';

  function installStyles() {
    if (document.getElementById('premiumBetHistoryStyles')) return;
    const style = document.createElement('style');
    style.id = 'premiumBetHistoryStyles';
    style.textContent = `
      #premiumPage:has(.pbh-shell){display:block!important}
      .pbh-shell{overflow:hidden;padding:0!important;border-radius:30px!important;min-height:620px;background:linear-gradient(145deg,rgba(12,20,29,.96),rgba(6,11,17,.98))!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:0 28px 90px rgba(0,0,0,.28)!important}
      .pbh-head{padding:28px 30px 24px;border-bottom:1px solid rgba(255,255,255,.07);background:radial-gradient(520px 220px at 92% 0%,rgba(226,179,90,.09),transparent 72%),linear-gradient(180deg,rgba(255,255,255,.018),transparent)}
      .pbh-head-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.pbh-kicker{font-size:9px;font-weight:950;letter-spacing:.18em;color:#8e9aa7}.pbh-title{margin:5px 0 0;font-size:34px;line-height:1;letter-spacing:-.045em;color:#f7f9fb}.pbh-sub{margin:9px 0 0;max-width:780px;font-size:11px;line-height:1.55;color:#8d99a7}
      .pbh-refresh{flex:0 0 auto;min-height:40px;padding:0 14px;border-radius:12px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.025);color:#dbe4ed;font-size:9px;font-weight:950;letter-spacing:.08em;cursor:pointer}.pbh-refresh:disabled{opacity:.48;cursor:default}
      .pbh-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:22px}.pbh-stat{padding:13px 14px;border-radius:15px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.018)}.pbh-stat span{display:block;font-size:7.5px;font-weight:900;letter-spacing:.12em;color:#778594}.pbh-stat strong{display:block;margin-top:4px;font-size:18px;color:#eef3f8}.pbh-stat.good strong{color:#8bf7b6}.pbh-stat.bad strong{color:#ff9daa}
      .pbh-toolbar{display:flex;align-items:center;justify-content:space-between;padding:13px 20px;border-bottom:1px solid rgba(255,255,255,.055);background:rgba(5,10,15,.65)}.pbh-toolbar strong{font-size:9px;letter-spacing:.1em;color:#c9d3dd}.pbh-toolbar span{font-size:8px;color:#697684}
      .pbh-list{height:clamp(430px,58vh,790px);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:10px 12px 18px}.pbh-list::-webkit-scrollbar{width:9px}.pbh-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border:3px solid transparent;background-clip:padding-box;border-radius:99px}
      .pbh-row{display:grid;grid-template-columns:minmax(210px,1.35fr) repeat(5,minmax(92px,.58fr));align-items:center;gap:8px;min-height:88px;padding:12px 13px;margin-bottom:7px;border:1px solid rgba(255,255,255,.055);border-radius:17px;background:linear-gradient(120deg,rgba(255,255,255,.018),rgba(255,255,255,.007))}.pbh-main{min-width:0}.pbh-date{font-size:8px;font-weight:850;letter-spacing:.06em;color:#71808f}.pbh-horse{margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:15px;font-weight:950;color:#f4f7fa}.pbh-race{margin-top:4px;font-size:9px;color:#91a0af}.pbh-race b{color:#d4dde6}
      .pbh-cell{min-width:0;padding:7px 9px;border-left:1px solid rgba(255,255,255,.045)}.pbh-cell span{display:block;font-size:7px;font-weight:900;letter-spacing:.105em;color:#667583}.pbh-cell strong{display:block;margin-top:4px;font-size:13px;color:#e9eef3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pbh-cell small{display:block;margin-top:3px;font-size:7.5px;color:#657382;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .pbh-result{display:inline-flex!important;align-items:center;justify-content:center;width:max-content;min-width:58px;padding:6px 9px;border-radius:99px;font-size:9px!important;font-weight:950!important}.pbh-result.win{color:#9bffc1!important;background:rgba(55,209,118,.12);border:1px solid rgba(98,243,155,.24)}.pbh-result.loss{color:#ffadb7!important;background:rgba(255,96,116,.10);border:1px solid rgba(255,125,139,.22)}.pbh-result.pending{color:#f4d58f!important;background:rgba(226,179,90,.1);border:1px solid rgba(226,179,90,.2)}.pbh-pl.good{color:#8bf7b6!important}.pbh-pl.bad{color:#ff9daa!important}
      .pbh-empty,.pbh-loading,.pbh-error{display:grid;place-items:center;min-height:430px;padding:40px 22px;text-align:center}.pbh-empty h3,.pbh-loading h3,.pbh-error h3{margin:0;font-size:18px;color:#eef3f8}.pbh-empty p,.pbh-loading p,.pbh-error p{max-width:520px;margin:8px auto 0;font-size:10px;line-height:1.55;color:#788695}.pbh-foot{padding:11px 18px;border-top:1px solid rgba(255,255,255,.055);font-size:8px;line-height:1.5;color:#5f6c79;background:rgba(5,9,14,.72)}
      @media(max-width:980px){.pbh-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.pbh-row{grid-template-columns:minmax(180px,1.2fr) repeat(3,minmax(88px,.6fr))}.pbh-hide-tablet{display:none}}
      @media(max-width:650px){.pbh-shell{border-radius:24px!important;min-height:0}.pbh-head{padding:21px 18px 18px}.pbh-title{font-size:28px}.pbh-sub{font-size:9.5px}.pbh-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.pbh-stats .pbh-stat:last-child{grid-column:1/-1}.pbh-toolbar{padding:10px 13px}.pbh-toolbar span{display:none}.pbh-list{height:58vh;min-height:390px;padding:8px}.pbh-row{grid-template-columns:1fr 1fr;gap:9px;min-height:0;padding:14px}.pbh-main{grid-column:1/-1;padding-bottom:9px;border-bottom:1px solid rgba(255,255,255,.05)}.pbh-cell{padding:5px 4px;border-left:0}.pbh-hide-mobile{display:none}}
    `;
    document.head.appendChild(style);
  }

  function isOpen(){ return !!document.querySelector('[data-premium-tab="history"].active') && !!document.getElementById('premiumPage'); }
  function dateText(row){ const raw=row?.jumpAt||row?.executionConfirmedAt||row?.date; const d=raw?new Date(raw):null; if(!d||Number.isNaN(d.getTime())) return esc(row?.date||'—'); return `${esc(dateFmt.format(d))}${row?.jumpAt||row?.executionConfirmedAt?` · ${esc(timeFmt.format(d))}`:''}`; }
  function rClass(v){ const x=String(v||'').toUpperCase(); return x==='WIN'?'win':x==='LOSS'?'loss':'pending'; }
  function rText(v){ const x=String(v||'').toUpperCase(); return x==='WIN'||x==='LOSS'?x:'PENDING'; }
  function pClass(v){ const x=finite(v); return x===null||x===0?'':x>0?'good':'bad'; }

  function withRunning(rows){ let total=0; return [...rows].reverse().map(x=>{const p=finite(x?.cashPl);if(p!==null)total+=p;return {...x,runningPl:total};}).reverse(); }

  function rowHtml(x){
    const before=finite(x?.stateBefore), after=finite(x?.stateAfter);
    const stateFlow=before===null?'—':after===null?String(before):`${before} → ${after}`;
    const winner=x?.winnerName?`${x?.winnerNumber?`#${x.winnerNumber} `:''}${x.winnerName}`:(x?.winnerNumber?`#${x.winnerNumber}`:'—');
    return `<article class="pbh-row"><div class="pbh-main"><div class="pbh-date">${dateText(x)} · ACTUAL BET</div><div class="pbh-horse">${esc(x?.horse||'Horse unavailable')}</div><div class="pbh-race"><b>${esc(x?.race||'—')}</b>${x?.venue?` · ${esc(x.venue)}`:''}</div></div><div class="pbh-cell"><span>BET AMOUNT</span><strong>${esc(cash(x?.acceptedStake))}</strong><small>${finite(x?.modelStake)!==null&&finite(x?.modelStake)!==finite(x?.acceptedStake)?`model ${esc(cash(x.modelStake))}`:'accepted stake'}</small></div><div class="pbh-cell"><span>ODDS</span><strong>${esc(odds(x?.acceptedPrice))}</strong><small>${finite(x?.signalPrice)!==null?`signal ${esc(odds(x.signalPrice))}`:'accepted fixed'}</small></div><div class="pbh-cell"><span>STATE</span><strong>${esc(stateFlow)}</strong><small>${before!==null?`entered at ${before}`:'state unavailable'}</small></div><div class="pbh-cell"><span>RESULT</span><strong class="pbh-result ${rClass(x?.result)}">${esc(rText(x?.result))}</strong><small>winner ${esc(winner)}</small></div><div class="pbh-cell pbh-hide-mobile"><span>CASH P/L</span><strong class="pbh-pl ${pClass(x?.cashPl)}">${finite(x?.cashPl)!==null?esc(cash(x.cashPl)):'PENDING'}</strong><small>running ${esc(cash(x?.runningPl))}</small></div><div class="pbh-cell pbh-hide-tablet pbh-hide-mobile"><span>OFFICIAL SP</span><strong>${esc(odds(x?.officialSp))}</strong><small>${esc(String(x?.evidenceStatus||'evidence —').replaceAll('_',' '))}</small></div></article>`;
  }

  function statsHtml(){
    const s=state.summary||{}; const bets=finite(s.bets)??state.rows.length; const wins=finite(s.wins)??0; const losses=finite(s.losses)??0; const staked=finite(s.totalStake)??0; const pl=finite(s.totalPl)??0; const roi=staked>0?pl/staked*100:null;
    return `<div class="pbh-stats"><div class="pbh-stat"><span>RECORDED BETS</span><strong>${bets}</strong></div><div class="pbh-stat"><span>W / L</span><strong>${wins} / ${losses}</strong></div><div class="pbh-stat"><span>TOTAL STAKED</span><strong>${esc(cash(staked))}</strong></div><div class="pbh-stat ${pClass(pl)}"><span>TOTAL P/L</span><strong>${esc(cash(pl))}</strong></div><div class="pbh-stat ${roi!==null?pClass(roi):''}"><span>ACTUAL ROI</span><strong>${roi===null?'—':`${roi>=0?'+':''}${roi.toFixed(1)}%`}</strong></div></div>`;
  }

  function markup(){
    const head=`<section class="premium-card pbh-shell"><header class="pbh-head"><div class="pbh-head-top"><div><div class="pbh-kicker">ACTUAL EXECUTION LEDGER</div><h1 class="pbh-title">Bet History</h1><p class="pbh-sub">Newest bet first. Scroll down for every confirmed cash bet stored by MITCHELL Racing — race, horse, accepted stake, accepted odds, state, result and P/L.</p></div><button class="pbh-refresh" id="pbhRefresh" type="button" ${state.loading?'disabled':''}>${state.loading?'LOADING…':'REFRESH'}</button></div>${statsHtml()}</header>`;
    if(state.loading&&!state.loaded) return `${head}<div class="pbh-loading"><div><h3>Loading bet history…</h3><p>Reading the confirmed execution ledger from newest to oldest.</p></div></div><div class="pbh-foot">Only accepted, confirmed executions appear here.</div></section>`;
    if(state.error&&!state.loaded) return `${head}<div class="pbh-error"><div><h3>History could not load</h3><p>${esc(state.error)}</p></div></div><div class="pbh-foot">History failure does not change the live V11 decision.</div></section>`;
    if(!state.rows.length) return `${head}<div class="pbh-empty"><div><h3>No confirmed cash bets recorded yet</h3><p>The ledger is ready. Your first accepted and recorded V11 bet will appear here automatically, then this list will keep growing.</p></div></div><div class="pbh-foot">State-only races and unplaced model signals are intentionally excluded from actual cash-bet history.</div></section>`;
    const rows=withRunning(state.rows).map(rowHtml).join(''); const note=state.truncated?` · newest ${state.rows.length.toLocaleString('en-AU')} shown`:'';
    return `${head}<div class="pbh-toolbar"><strong>${state.rows.length.toLocaleString('en-AU')} ACTUAL BET${state.rows.length===1?'':'S'} · NEWEST FIRST</strong><span>SCROLL TO GO BACK${esc(note)}</span></div><div class="pbh-list">${rows}</div><div class="pbh-foot">Accepted stake + accepted price drive cash P/L. Signal values are audit references only.</div></section>`;
  }

  function paint(){
    if(!isOpen()) return; const page=document.getElementById('premiumPage'); if(!page) return;
    const key=[version,state.loading,state.loaded,state.error,state.rows.length,state.truncated].join('|'); if(page.dataset.betHistoryKey===key&&page.querySelector('.pbh-shell')) return;
    page.dataset.betHistoryKey=key; page.innerHTML=markup(); document.getElementById('pbhRefresh')?.addEventListener('click',()=>load(true),{once:true}); if(!state.loaded&&!state.loading) load(false);
  }

  async function load(force=false){
    if(state.loading||(state.loaded&&!force)) return; if(!navigator.onLine){state={...state,error:'You are offline'};version++;paint();return;}
    state={...state,loading:true,error:''};version++;paint();
    try{ const r=await fetch(`${HISTORY_URL}&_=${Date.now()}`,{method:'GET',cache:'no-store'}); const body=await r.json().catch(()=>({})); if(!r.ok||body?.ok!==true) throw new Error(body?.error||`HTTP ${r.status}`); state={loading:false,loaded:true,rows:Array.isArray(body?.history)?body.history:[],summary:body?.summary||null,error:'',truncated:body?.truncated===true}; }
    catch(e){state={...state,loading:false,error:e instanceof Error?e.message:'History request failed'};}
    version++;paint();
  }

  function attach(){ installStyles(); const app=document.getElementById('premiumApp'); if(!app){setTimeout(attach,100);return;} new MutationObserver(()=>setTimeout(paint,0)).observe(app,{childList:true,subtree:true}); document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&isOpen()&&state.loaded)load(true)}); window.addEventListener('online',()=>{if(isOpen())load(true)}); window.addEventListener('mitchell-refresh-live',()=>{if(isOpen())load(true)}); paint(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();
