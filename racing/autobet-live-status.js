(() => {
  'use strict';
  const URL='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/racing-autobet';
  const KEY='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
  const REFRESH_MS=30000;

  function ensure(){
    let el=document.getElementById('autobetLiveStatus');
    if(el) return el;
    const health=document.getElementById('systemHealth');
    const anchor=health || document.querySelector('.hk-switcher') || document.querySelector('.decision-card');
    if(!anchor) return null;
    el=document.createElement('section');
    el.id='autobetLiveStatus';
    el.style.cssText='margin:0 0 10px;padding:10px 12px;border-radius:12px;border:1px solid #765f2a;background:#2a2413;font-size:9px;line-height:1.45;color:#e9cf88';
    anchor.insertAdjacentElement('afterend',el);
    return el;
  }

  function render(d){
    const el=ensure(); if(!el) return;
    const ready=d?.ready===true;
    el.style.borderColor=ready?'#2a8058':'#765f2a';
    el.style.background=ready?'#0d3023':'#2a2413';
    el.style.color=ready?'#b9edd1':'#e9cf88';
    el.innerHTML=ready
      ? '<strong style="display:block;font-size:10px;color:#78f2b5">AUTO BET PLACER · ARMED</strong><span>The server will place only a fully verified V11 BET_LOCKED wager that passes the final Betfair price/liquidity/exposure checks.</span>'
      : '<strong style="display:block;font-size:10px;color:#ffc34f">AUTO BET PLACER · LOCKED</strong><span>Automatic real-money placement is OFF. The signal engine can still show BET NOW, but no provider order will be sent automatically.</span>';
  }

  async function refresh(){
    try{
      const r=await fetch(URL,{method:'GET',cache:'no-store',headers:{apikey:KEY}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d?.ok!==true) throw new Error();
      render(d);
    }catch{
      const el=ensure(); if(!el) return;
      el.style.borderColor='#74323e';el.style.background='#30161d';el.style.color='#ffb5bf';
      el.innerHTML='<strong style="display:block;font-size:10px;color:#ff9eaa">AUTO BET STATUS · UNVERIFIED</strong><span>Treat automatic real-money placement as OFF.</span>';
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,250),{once:true});
  else setTimeout(refresh,250);
  setInterval(refresh,REFRESH_MS);
})();
