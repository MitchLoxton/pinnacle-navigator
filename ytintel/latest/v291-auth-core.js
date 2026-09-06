(function(){
'use strict';
if(document.documentElement.dataset.yt291AuthCore==='1')return;
document.documentElement.dataset.yt291AuthCore='1';
const SUPA='https://dkmacktcfhubsumwrydw.supabase.co';
const PUB='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
const LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
const $=s=>document.querySelector(s);
let client=null,session=null,originalCreate=null,coreSubmit=null,retryingAnalyse=false,lastCloudAction=null,retryTimer=null;
const authDetail=()=>({session,user:session?.user||null,signedIn:!!session});
function emit(){try{window.dispatchEvent(new CustomEvent('ytintel:auth',{detail:authDetail()}))}catch{}}
function loadLib(){return new Promise((resolve,reject)=>{if(window.supabase?.createClient)return resolve(window.supabase);const old=document.querySelector('script[data-yt291-supa]');if(old){old.addEventListener('load',()=>resolve(window.supabase),{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=LIB;s.async=true;s.dataset.yt291Supa='1';s.onload=()=>resolve(window.supabase);s.onerror=()=>reject(Error('Account service could not load.'));document.head.appendChild(s)})}
async function refreshSession(){if(!client)return null;try{const g=await client.auth.getSession();session=g.data?.session||null;const exp=Number(session?.expires_at||0)*1000;if(session&&exp&&exp-Date.now()<120000){const r=await client.auth.refreshSession();if(!r.error)session=r.data?.session||session}emit();return session}catch{return session}}
function patchFactory(lib){if(lib.__ytintelCanonicalAuthPatched)return;originalCreate=lib.createClient.bind(lib);client=window.__YTINTEL_SUPABASE_CLIENT||originalCreate(SUPA,PUB,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});window.__YTINTEL_SUPABASE_CLIENT=client;lib.createClient=function(url,key,opts){if(String(url)===SUPA&&String(key)===PUB)return client;return originalCreate(url,key,opts)};lib.__ytintelCanonicalAuthPatched=true}
function hideError(el){if(!el)return;el.textContent='';el.classList.remove('show')}
function isSignInError(el){return /sign\s*in\s*(?:is\s*)?(?:required|to\s+use)|authentication required/i.test(String(el?.textContent||''))}
async function repairAnalyse(){const err=$('#error');if(!isSignInError(err))return;hideError(err);const report=$('#report');if((report?.innerText||'').trim())return;if(retryingAnalyse||typeof coreSubmit!=='function')return;retryingAnalyse=true;try{await Promise.resolve(coreSubmit.call($('#analyseForm'),{preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}))}catch{}finally{setTimeout(()=>{retryingAnalyse=false},600)}}
async function retryCloudAction(){if(!session||!lastCloudAction||Date.now()-lastCloudAction.at>7000)return;const el=document.getElementById(lastCloudAction.id);if(!el||el.dataset.yt291Retry==='1')return;await refreshSession();el.dataset.yt291Retry='1';setTimeout(()=>{try{el.click()}finally{setTimeout(()=>delete el.dataset.yt291Retry,900)}},50)}
function repairErrors(){repairAnalyse();for(const sel of ['#similarError','#radarError','#packageError']){const e=$(sel);if(!isSignInError(e))continue;if(session){hideError(e);clearTimeout(retryTimer);retryTimer=setTimeout(retryCloudAction,80)}else if(sel==='#packageError'){e.textContent='Analyse a video first. Sign-in is optional for the core Analyse → Packaging workflow.'}}
}
function installRepairs(){const form=$('#analyseForm');if(form&&typeof form.onsubmit==='function')coreSubmit=form.onsubmit;document.addEventListener('click',e=>{const b=e.target.closest?.('#similarBtn,#channelBtn,#radarBtn,#packageBtn');if(b&&b.dataset.yt291Retry!=='1')lastCloudAction={id:b.id,at:Date.now()}},true);const o=new MutationObserver(repairErrors);o.observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('ytintel:auth',repairErrors);setTimeout(repairErrors,300);setTimeout(repairErrors,1500)}
async function boot(){const lib=await loadLib();patchFactory(lib);await refreshSession();client.auth.onAuthStateChange((_event,s)=>{session=s||null;emit();setTimeout(repairErrors,0)});installRepairs();return window.YTIntelAuth}
window.YTIntelAuth={get client(){return client},get session(){return session},get user(){return session?.user||null},get signedIn(){return!!session},refresh:refreshSession,ready:()=>window.YTIntelAuthReady,openAccount:()=>document.querySelector('#v26AccountBtn,[data-v26-auth],[data-v26-account]')?.click()};
window.YTIntelAuthReady=boot().catch(e=>{console.warn('[YTIntel auth core]',e);return window.YTIntelAuth});
})();
