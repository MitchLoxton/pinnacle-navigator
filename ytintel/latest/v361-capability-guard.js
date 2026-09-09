const delay=(ms,value)=>new Promise(resolve=>setTimeout(()=>resolve(value),ms));
function wrapMethod(owner,name,fallback,ms=1500){
  if(!owner||typeof owner[name]!=='function'||owner[name].__ytintelBound)return false;
  const original=owner[name].bind(owner);
  const bounded=(...args)=>Promise.race([Promise.resolve().then(()=>original(...args)).catch(()=>fallback),delay(ms,fallback)]);
  try{Object.defineProperty(bounded,'__ytintelBound',{value:true});}catch{}
  try{owner[name]=bounded;if(owner[name]===bounded)return true}catch{}
  try{Object.defineProperty(owner,name,{value:bounded,writable:true,configurable:true});return owner[name]===bounded}catch{}
  return false;
}
function installExpectedMediaLimitGuard(){
  window.addEventListener('unhandledrejection',event=>{
    const message=String(event.reason?.message||event.reason||'');
    if(!/No reliable media metadata source|YTIntel media service 502|Piped media fallback unavailable|Invidious media fallback unavailable/i.test(message))return;
    event.preventDefault();
    document.documentElement.dataset.ytintelMediaLimited='1';
  });
}
export function installCapabilityGuard(){
  let guarded=false;
  try{guarded=wrapMethod(window.LanguageModel,'availability','unavailable',1500)||guarded}catch{}
  try{guarded=wrapMethod(window.ai?.languageModel,'capabilities',{available:'no'},1500)||guarded}catch{}
  try{guarded=wrapMethod(navigator.serviceWorker,'getRegistrations',[],1200)||guarded}catch{}
  try{guarded=wrapMethod(window.ServiceWorkerRegistration?.prototype,'unregister',false,1000)||guarded}catch{}
  try{guarded=wrapMethod(window.caches,'keys',[],1200)||guarded}catch{}
  try{guarded=wrapMethod(window.caches,'delete',false,900)||guarded}catch{}
  document.documentElement.dataset.ytintelCapabilityGuard=guarded?'bounded':'not-needed';
  return guarded;
}
installExpectedMediaLimitGuard();
installCapabilityGuard();
