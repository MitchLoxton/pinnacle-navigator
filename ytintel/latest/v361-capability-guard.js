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
installCapabilityGuard();
