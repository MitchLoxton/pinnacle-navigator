(() => {
  'use strict';

  const BOOKS=[
    {key:'sportsbet',label:'Sportsbet',domain:'sportsbet.com.au',short:'SB'},
    {key:'tab',label:'TAB',domain:'tab.com.au',short:'TAB'},
    {key:'tabtouch',label:'TABtouch',domain:'tabtouch.com.au',short:'TT'},
    {key:'ladbrokes_au',label:'Ladbrokes',domain:'ladbrokes.com.au',short:'LB'},
    {key:'neds',label:'Neds',domain:'neds.com.au',short:'N'},
    {key:'pointsbetau',label:'PointsBet',domain:'pointsbet.com.au',short:'PB'},
    {key:'unibet',label:'Unibet',domain:'unibet.com.au',short:'UB'},
    {key:'bet365',label:'bet365',domain:'bet365.com.au',short:'365'},
    {key:'betright',label:'BetRight',domain:'betright.com.au',short:'BR'},
    {key:'betdeluxe',label:'BetDeluxe',domain:'betdeluxe.com.au',short:'BD'},
    {key:'betr_au',label:'Betr',domain:'betr.com.au',short:'BE'},
    {key:'playup',label:'NextBet',domain:'nextbet.com.au',short:'NB'},
    {key:'palmerbet',label:'Palmerbet',domain:'palmerbet.com',short:'PA'},
    {key:'betgold',label:'BetGold',domain:'betgold.com.au',short:'BG'},
    {key:'boostbet',label:'BoostBet',domain:'boostbet.com.au',short:'BB'}
  ];

  const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const price=v=>{const n=Number(String(v||'').replace(/[^0-9.]/g,''));return Number.isFinite(n)&&n>1?n:null;};
  const fmt=v=>Number.isFinite(v)?'$'+v.toFixed(2):'—';
  const bookKey=v=>{const s=String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');if(s==='ladbrokes')return'ladbrokes_au';if(s==='pointsbet')return'pointsbetau';if(['bet365','bet365au'].includes(s))return'bet365';if(s==='tabtouch')return'tabtouch';if(s==='sportsbet')return'sportsbet';if(s==='neds')return'neds';if(s==='unibet')return'unibet';if(s==='betright')return'betright';if(s==='betdeluxe')return'betdeluxe';if(s==='betr')return'betr_au';if(s==='nextbet'||s==='playup')return'playup';if(s==='palmerbet')return'palmerbet';if(s==='betgold')return'betgold';if(s==='boostbet')return'boostbet';if(s==='tab')return'tab';return s;};
  const logo=b=>`<span class="odds-matrix-logo"><span>${esc(b.short)}</span><img src="https://www.google.com/s2/favicons?sz=64&domain_url=https://${esc(b.domain)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.style.display='none'"></span>`;
  const average=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const consensus=a=>{if(!a.length)return null;const imp=a.reduce((x,y)=>x+1/y,0)/a.length;return imp?1/imp:null;};

  function parseRunner(card){
    const nameEl=card.querySelector('.odds-name');
    if(!nameEl)return null;
    const no=String(card.querySelector('.odds-no')?.textContent||'').replace('#','').trim();
    const clone=nameEl.cloneNode(true);clone.querySelector('.odds-no')?.remove();clone.querySelector('.odds-fav')?.remove();
    const name=String(clone.textContent||'').trim();
    const isFav=!!card.querySelector('.odds-fav');
    const quotes=new Map();
    card.querySelectorAll('.odds-book').forEach(el=>{
      const label=String(el.querySelector('b')?.textContent||'').trim();
      const key=bookKey(label);const p=price(el.querySelector('strong')?.textContent);
      if(!key||p===null)return;
      quotes.set(key,{price:p,age:String(el.querySelector('.odds-age')?.textContent||'').trim(),stale:el.classList.contains('stale')});
    });
    return {no,name,isFav,quotes};
  }

  function build(){
    const page=document.querySelector('.odds-page');if(!page)return;
    const source=[...page.querySelectorAll('.odds-runner:not(.odds-matrix-source-hidden)')];
    if(!source.length)return;
    const existing=page.querySelector('.odds-matrix-wrap');if(existing)existing.remove();
    const runners=source.map(parseRunner).filter(Boolean);if(!runners.length)return;
    source.forEach(x=>x.classList.add('odds-matrix-source-hidden'));

    const liveKeys=new Set();runners.forEach(r=>r.quotes.forEach((q,k)=>liveKeys.add(k)));
    const liveCount=liveKeys.size;

    const coverage=`<div class="odds-matrix-coverage">${BOOKS.map(b=>`<div class="odds-matrix-cover ${liveKeys.has(b.key)?'live':''}">${logo(b)}<span>${esc(b.label)}</span><i></i></div>`).join('')}</div>`;
    const warning=liveCount<2?`<div class="odds-matrix-warning"><span>⚠</span><div><strong>Only ${liveCount} bookmaker feed is currently returning prices.</strong> The board below still shows every bookmaker column, so missing feeds are obvious. Open “Unlock all bookmaker prices” above to connect the full comparison feed.</div></div>`:'';

    const heads=BOOKS.map(b=>`<th><div class="odds-matrix-bookhead">${logo(b)}<span>${esc(b.label)}</span></div></th>`).join('');
    const body=runners.map(r=>{
      const fresh=[...r.quotes.entries()].filter(([,q])=>!q.stale);
      const usable=fresh.length?fresh:[...r.quotes.entries()];
      const vals=usable.map(([,q])=>q.price);
      const best=usable.reduce((a,x)=>!a||x[1].price>a[1].price?x:a,null);
      const avg=average(vals),cons=consensus(vals);
      const cells=BOOKS.map(b=>{
        const q=r.quotes.get(b.key);
        if(!q)return `<td><div class="odds-matrix-quote missing"><strong>—</strong><small>NO QUOTE</small></div></td>`;
        const isBest=best&&best[0]===b.key&&!q.stale;
        return `<td><div class="odds-matrix-quote ${isBest?'best':''} ${q.stale?'stale':''}"><strong>${fmt(q.price)}</strong><small>${esc(q.age||'LIVE')}</small>${isBest?'<small class="odds-matrix-best">BEST</small>':''}</div></td>`;
      }).join('');
      return `<tr class="${r.isFav?'market-fav':''}"><td class="runner-col"><div class="odds-matrix-runner"><span class="odds-matrix-number">${esc(r.no||'—')}</span><div><strong>${esc(r.name)}</strong><small>${r.quotes.size} book${r.quotes.size===1?'':'s'} quoted</small>${r.isFav?'<span class="odds-matrix-fav">MARKET FAVOURITE</span>':''}</div></div></td>${cells}<td class="odds-matrix-calc ${best?'best':''}"><strong>${fmt(best?.[1]?.price)}</strong><small>${best?esc(BOOKS.find(b=>b.key===best[0])?.label||best[0]):'—'}</small></td><td class="odds-matrix-calc"><strong>${vals.length>=2?fmt(avg):'—'}</strong><small>${vals.length>=2?`${vals.length} books`:'need 2+'}</small></td><td class="odds-matrix-calc"><strong>${vals.length>=2?fmt(cons):'—'}</strong><small>${vals.length>=2?'implied avg':'need 2+'}</small></td></tr>`;
    }).join('');

    const matrix=`<div class="odds-matrix-wrap">${warning}${coverage}<section class="odds-matrix-shell"><div class="odds-matrix-titlebar"><strong>Fixed Win Bookmaker Comparison</strong><span>Green = best fresh price · scroll sideways for every bookmaker →</span></div><div class="odds-matrix-scroll"><table class="odds-matrix"><thead><tr><th class="runner-col">Runner</th>${heads}<th>Best</th><th>Average</th><th>Consensus</th></tr></thead><tbody>${body}</tbody></table></div></section></div>`;
    const summary=page.querySelector('.odds-summary');
    if(summary)summary.insertAdjacentHTML('afterend',matrix);else page.querySelector('#oddsContent')?.insertAdjacentHTML('afterbegin',matrix);
  }

  let queued=false;
  function queue(){if(queued)return;queued=true;setTimeout(()=>{queued=false;build();},80);}
  const obs=new MutationObserver(queue);
  function mount(){const root=document.getElementById('premiumApp');if(!root){setTimeout(mount,150);return;}obs.observe(root,{subtree:true,childList:true});queue();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
