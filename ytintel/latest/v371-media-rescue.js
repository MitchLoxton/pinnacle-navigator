(()=>{'use strict';
const BASE='https://dkmacktcfhubsumwrydw.supabase.co/functions/v1/';
const nativeFetch=window.fetch.bind(window);
function urlOf(input){try{return typeof input==='string'?input:input instanceof URL?input.href:input?.url||''}catch{return''}}
function headersOf(input,init){try{return new Headers(init?.headers||(input instanceof Request?input.headers:undefined))}catch{return new Headers()}}
window.fetch=function(input,init){
  const raw=urlOf(input);
  if(!raw.includes('/functions/v1/ytintel-v091'))return nativeFetch(input,init);
  let u;try{u=new URL(raw)}catch{return nativeFetch(input,init)}
  const action=u.searchParams.get('action')||'';
  const headers=headersOf(input,init);
  if(headers.get('x-ytintel-client')==='web-v380')headers.set('x-ytintel-client','web-v360');
  if(action==='media'){
    const next=new URL(BASE+'ytintel-v093');
    next.searchParams.set('action','media-rescue');
    return nativeFetch(next.href,{...(init||{}),headers});
  }
  return nativeFetch(input,{...(init||{}),headers});
};
document.documentElement.dataset.ytintelMediaRescue='v038';
window.YTIntelMediaRescue={version:'0.38.0',enabled:true};
})();
