(function(){
'use strict';
if(window.__YTINTEL_V300_FETCH_GUARD__)return;
window.__YTINTEL_V300_FETCH_GUARD__=true;
const nativeFetch=window.fetch.bind(window);
function msFor(url,init){
  const u=String(url||'');
  if(/supabase\.co\/functions\/v1\/ytintel-v09/i.test(u)){
    const body=String(init?.body||'');
    if(/\"mode\"\s*:\s*\"channel\"|action=discover/i.test(u+body))return 45000;
    if(/action=analyze/i.test(u))return 120000;
    return 60000;
  }
  if(/supabase\.co\/functions\/v1\/ytintel-v082/i.test(u)){
    if(/action=health/i.test(u))return 15000;
    if(/action=(?:analyze|package)/i.test(u))return 90000;
    return 60000;
  }
  if(/invidious\.|inv\.nadeko\.net|yt\.chocolatemoo53\.com/i.test(u))return 15000;
  return 0;
}
window.fetch=function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const timeout=msFor(url,init);
  if(!timeout||init?.signal)return nativeFetch(input,init);
  const c=new AbortController(),t=setTimeout(()=>c.abort(new DOMException('YTIntel network stage timed out','TimeoutError')),timeout);
  return nativeFetch(input,{...(init||{}),signal:c.signal}).finally(()=>clearTimeout(t));
};
})();
