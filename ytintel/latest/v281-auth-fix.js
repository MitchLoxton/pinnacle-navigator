(function(){
'use strict';
if(document.documentElement.dataset.yt281AuthFix==='1')return;
document.documentElement.dataset.yt281AuthFix='1';

const SUPA='https://dkmacktcfhubsumwrydw.supabase.co';
const PUB='sb_publishable_VATM2AkVyl-yvxv28S2FXw_CqMpBr6q';
const APP_URL='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/';
const LIB='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
const PENDING='ytintel-pending-username';
const $=s=>document.querySelector(s);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let client=null,session=null,profile=null;

function injectCss(){
  if($('#ytAuthFixStyle'))return;
  const s=document.createElement('style');s.id='ytAuthFixStyle';s.textContent=`
  .yt-authfix-modal{position:fixed;inset:0;z-index:100050;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(3,5,8,.93);backdrop-filter:blur(12px)}
  .yt-authfix-modal.show{display:flex}.yt-authfix-card{width:min(520px,100%);max-height:92vh;overflow:auto;padding:24px;border:1px solid #303744;border-radius:22px;background:#10141b;box-shadow:0 35px 100px rgba(0,0,0,.5)}
  .yt-authfix-top{display:flex;gap:12px;align-items:flex-start}.yt-authfix-top>div{flex:1}.yt-authfix-top h2{margin:5px 0 7px;color:#f3f6fb;font-size:26px;letter-spacing:-.025em}.yt-authfix-top p{margin:0;color:#8490a2;font-size:10px;line-height:1.55}.yt-authfix-close{width:35px;height:35px;border-radius:10px;border:1px solid #303744;background:#181d26;color:#fff;font-size:20px;cursor:pointer}
  .yt-authfix-fields{display:grid;gap:10px;margin:20px 0 12px}.yt-authfix-fields label{display:grid;gap:6px;color:#8d99aa;font-size:9px;font-weight:800}.yt-authfix-fields input{width:100%;box-sizing:border-box;border:1px solid #303744;border-radius:11px;background:#090c11;color:#f2f5f9;padding:12px;outline:none}.yt-authfix-fields input:focus{border-color:#5b718f;box-shadow:0 0 0 3px rgba(90,120,160,.08)}
  .yt-authfix-msg{min-height:18px;margin:7px 0 2px;font-size:9px;line-height:1.45}.yt-authfix-msg.error{color:#ff7b89}.yt-authfix-msg.success{color:#6fe0a4}.yt-authfix-msg.info{color:#9eacbf}
  .yt-authfix-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.yt-authfix-actions .btn{min-height:38px}.yt-authfix-back{border:0;background:transparent;color:#9eacbf;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:6px 0;font-size:9px}
  .yt-authfix-success{margin:20px 0 6px;padding:18px;border:1px solid rgba(111,224,164,.24);border-radius:15px;background:rgba(111,224,164,.055)}.yt-authfix-success b{display:block;color:#76e3aa;font-size:14px;margin-bottom:7px}.yt-authfix-success p{margin:0;color:#9ba7b8;font-size:10px;line-height:1.55}
  .yt-authfix-account{margin:18px 0 6px;padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.018)}.yt-authfix-account b{display:block;color:#eef3f8;font-size:15px}.yt-authfix-account span{display:block;color:#7e8a9c;font-size:9px;margin-top:4px}
  #ytAuthWelcome{display:inline-flex;align-items:center;gap:6px;color:#b7c2d1;font-size:10px;font-weight:800;white-space:nowrap}#ytAuthWelcome:before{content:'';width:7px;height:7px;border-radius:50%;background:#63d99b;box-shadow:0 0 0 3px rgba(99,217,155,.09)}
  #ytAuthHeroWelcome{margin:0 0 8px;color:#85e3b1;font-size:11px;font-weight:900;letter-spacing:.02em}
  @media(max-width:640px){.yt-authfix-card{padding:18px}.yt-authfix-actions{display:grid}.yt-authfix-actions .btn{width:100%}#ytAuthWelcome{display:none}}
  `;document.head.appendChild(s)
}

function loadLibrary(){return new Promise((resolve,reject)=>{if(window.supabase?.createClient)return resolve(window.supabase);const old=$('script[data-yt-authfix-supa]');if(old){old.addEventListener('load',()=>resolve(window.supabase),{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=LIB;s.async=true;s.dataset.ytAuthfixSupa='1';s.onload=()=>resolve(window.supabase);s.onerror=()=>reject(Error('Account service could not load.'));document.head.appendChild(s)})}
function cleanUsername(v){return String(v||'').trim().replace(/[^A-Za-z0-9_]/g,'').slice(0,24)}
function validUsername(v){return /^[A-Za-z0-9_]{3,24}$/.test(String(v||''))}
function fallbackUsername(){const meta=session?.user?.user_metadata||{};return cleanUsername(profile?.username||meta.username||session?.user?.email?.split('@')[0]||'creator')}
async function readProfile(){if(!client||!session)return null;const q=await client.from('ytintel_profiles').select('username,channel_name,channel_url,niche,goal').eq('user_id',session.user.id).maybeSingle();if(q.error)throw q.error;profile=q.data||null;return profile}
async function ensureUsername(wanted=''){
  if(!client||!session)return;
  let username=cleanUsername(wanted||session.user.user_metadata?.username||localStorage.getItem(PENDING)||profile?.username||'');
  if(!validUsername(username))return;
  const q=await client.from('ytintel_profiles').select('user_id,username').eq('user_id',session.user.id).maybeSingle();
  if(q.error)throw q.error;
  if(q.data){if(q.data.username!==username){const u=await client.from('ytintel_profiles').update({username}).eq('user_id',session.user.id);if(u.error)throw u.error}}
  else{const i=await client.from('ytintel_profiles').insert({user_id:session.user.id,username});if(i.error)throw i.error}
  localStorage.removeItem(PENDING);profile={...(profile||{}),username};
}
function restoreAnalysisAccess(){
  ['#videoUrl','#analyseForm button','#v27Url','#v27Form button'].forEach(sel=>document.querySelectorAll(sel).forEach(n=>{n.disabled=false;n.removeAttribute('aria-disabled')}));
  document.querySelectorAll('[data-tab="analyse"],[data-tab="viral"]').forEach(n=>{n.disabled=false;n.removeAttribute('aria-disabled')});
}
function renderPersonal(){
  const name=fallbackUsername();
  const top=$('.top .split');
  let w=$('#ytAuthWelcome');
  if(session&&name){if(!w&&top){w=document.createElement('span');w.id='ytAuthWelcome';top.insertBefore(w,top.firstChild)}if(w)w.textContent=`Welcome back, ${name}`}
  else w?.remove();
  const hero=$('#os .hero');let h=$('#ytAuthHeroWelcome');
  if(session&&name&&hero){if(!h){h=document.createElement('div');h.id='ytAuthHeroWelcome';hero.insertBefore(h,hero.firstChild)}h.textContent=`Welcome back, ${name}.`}
  else h?.remove();
  const old=$('#v26AccountBtn');if(old&&session)old.innerHTML=`<span class="v26-cloud-dot"></span> ${E(name||'Account')}`;
}
function closeOldAuth(){const old=$('#v26Auth');old?.classList.remove('show')}
function modal(){
  let m=$('#ytAuthFix');if(m)return m;
  m=document.createElement('div');m.id='ytAuthFix';m.className='yt-authfix-modal';m.innerHTML=`<div class="yt-authfix-card"><div class="yt-authfix-top"><div><div class="eyebrow">YTINTEL ACCOUNT</div><h2 id="ytAuthTitle">Sign in</h2><p id="ytAuthSubtitle">Your research, style banks and creator intelligence stay connected across devices.</p></div><button class="yt-authfix-close" aria-label="Close">×</button></div><div id="ytAuthBody"></div></div>`;document.body.appendChild(m);m.querySelector('.yt-authfix-close').onclick=()=>m.classList.remove('show');m.onclick=e=>{if(e.target===m)m.classList.remove('show')};return m
}
function fieldMsg(text='',tone='error'){const x=$('#ytAuthMsg');if(!x)return;x.textContent=text;x.className=`yt-authfix-msg ${tone}`}
function showSignIn(message='',tone='info'){
  const m=modal();$('#ytAuthTitle').textContent='Welcome back';$('#ytAuthSubtitle').textContent='Sign in to sync your workspace and keep your creator intelligence attached to your account.';
  $('#ytAuthBody').innerHTML=`<div class="yt-authfix-fields"><label>Email<input id="ytAuthEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="ytAuthPassword" type="password" autocomplete="current-password" placeholder="At least 8 characters"></label></div><div id="ytAuthMsg" class="yt-authfix-msg ${tone}">${E(message)}</div><div class="yt-authfix-actions"><button class="btn primary" id="ytAuthSignIn">Sign in</button><button class="btn" id="ytAuthCreateOpen">Create account →</button></div><p class="v26-account-note">Analysis is available whether you are signed in or not. An account adds personalisation, sync and cloud monitoring.</p>`;
  $('#ytAuthSignIn').onclick=signIn;$('#ytAuthCreateOpen').onclick=showSignUp;m.classList.add('show')
}
function showSignUp(){
  const m=modal();$('#ytAuthTitle').textContent='Create your YTIntel account';$('#ytAuthSubtitle').textContent='Choose the username YTIntel will use to personalise your workspace.';
  $('#ytAuthBody').innerHTML=`<button class="yt-authfix-back" id="ytAuthBack">← Back to sign in</button><div class="yt-authfix-fields"><label>Username<input id="ytAuthUsername" type="text" autocomplete="username" maxlength="24" placeholder="thenuk"></label><label>Email<input id="ytAuthEmail" type="email" autocomplete="email" placeholder="you@example.com"></label><label>Password<input id="ytAuthPassword" type="password" autocomplete="new-password" placeholder="At least 8 characters"></label><label>Confirm password<input id="ytAuthConfirm" type="password" autocomplete="new-password" placeholder="Repeat password"></label></div><div id="ytAuthMsg" class="yt-authfix-msg info">Username: 3–24 letters, numbers or underscores.</div><div class="yt-authfix-actions"><button class="btn primary" id="ytAuthCreate">Create account</button></div>`;
  $('#ytAuthBack').onclick=()=>showSignIn();$('#ytAuthCreate').onclick=signUp;m.classList.add('show');setTimeout(()=>$('#ytAuthUsername')?.focus(),30)
}
function showVerify(email){
  $('#ytAuthTitle').textContent='Check your email';$('#ytAuthSubtitle').textContent='Your account was created successfully.';
  $('#ytAuthBody').innerHTML=`<div class="yt-authfix-success"><b>✓ Account created</b><p>We sent a verification link to <strong>${E(email)}</strong>. Click it and you will return to YTIntel — not localhost.</p></div><div class="yt-authfix-actions"><button class="btn" id="ytAuthBackSignIn">Back to sign in</button></div>`;$('#ytAuthBackSignIn').onclick=()=>showSignIn('After verifying your email, sign in here.','success')
}
async function signIn(){
  const email=$('#ytAuthEmail')?.value.trim(),password=$('#ytAuthPassword')?.value||'';fieldMsg('Signing in…','info');
  if(!email||password.length<8)return fieldMsg('Enter a valid email and a password of at least 8 characters.','error');
  try{const r=await client.auth.signInWithPassword({email,password});if(r.error)throw r.error;session=r.data?.session||null;await readProfile().catch(()=>null);await ensureUsername().catch(()=>{});renderPersonal();restoreAnalysisAccess();closeOldAuth();fieldMsg(`Signed in. Welcome back, ${fallbackUsername()}.`,'success');setTimeout(()=>{modal().classList.remove('show');location.reload()},550)}catch(e){fieldMsg(e?.message||'Could not sign in.','error')}
}
async function signUp(){
  const username=cleanUsername($('#ytAuthUsername')?.value),email=$('#ytAuthEmail')?.value.trim(),password=$('#ytAuthPassword')?.value||'',confirm=$('#ytAuthConfirm')?.value||'';
  if(!validUsername(username))return fieldMsg('Choose a username with 3–24 letters, numbers or underscores.','error');
  if(!email||password.length<8)return fieldMsg('Enter a valid email and a password of at least 8 characters.','error');
  if(password!==confirm)return fieldMsg('Those passwords do not match.','error');
  fieldMsg('Creating your account…','info');
  try{
    localStorage.setItem(PENDING,username);
    const r=await client.auth.signUp({email,password,options:{data:{username},emailRedirectTo:APP_URL}});if(r.error)throw r.error;
    session=r.data?.session||null;
    if(session){await ensureUsername(username);await readProfile().catch(()=>null);renderPersonal();restoreAnalysisAccess();showVerify(email);return}
    showVerify(email)
  }catch(e){localStorage.removeItem(PENDING);fieldMsg(e?.message||'Could not create account.','error')}
}
async function showAccount(){
  const m=modal();if(!session)return showSignIn();
  await readProfile().catch(()=>null);const name=fallbackUsername();$('#ytAuthTitle').textContent=`Welcome back, ${name}`;$('#ytAuthSubtitle').textContent='Your YTIntel account is connected.';
  $('#ytAuthBody').innerHTML=`<div class="yt-authfix-account"><b>@${E(name)}</b><span>${E(session.user.email||'Signed in')} · cloud sync connected</span></div><div class="yt-authfix-actions"><button class="btn primary" id="ytAuthContinue">Continue to YTIntel</button><button class="btn" id="ytAuthSignOut">Sign out</button></div>`;
  $('#ytAuthContinue').onclick=()=>{restoreAnalysisAccess();m.classList.remove('show')};$('#ytAuthSignOut').onclick=async()=>{await client.auth.signOut();session=null;profile=null;renderPersonal();m.classList.remove('show');location.reload()};m.classList.add('show')
}
function interceptAuthClicks(){document.addEventListener('click',e=>{const hit=e.target.closest?.('#v26AccountBtn,[data-v26-auth],[data-v26-account]');if(!hit)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();closeOldAuth();session?showAccount():showSignIn()},true)}
async function boot(){
  injectCss();restoreAnalysisAccess();interceptAuthClicks();
  try{const lib=await loadLibrary();client=lib.createClient(SUPA,PUB,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const g=await client.auth.getSession();session=g.data?.session||null;client.auth.onAuthStateChange((_event,s)=>{session=s||null;setTimeout(async()=>{if(session){await readProfile().catch(()=>null);await ensureUsername().catch(()=>{})}renderPersonal();restoreAnalysisAccess()},0)});if(session){await readProfile().catch(()=>null);await ensureUsername().catch(()=>{});renderPersonal();restoreAnalysisAccess();const returned=location.hash.includes('access_token')||/[?&](code|token_hash|type)=/.test(location.search);if(returned){const name=fallbackUsername();setTimeout(()=>{if(typeof window.YTIntelToast==='function')window.YTIntelToast(`Email verified. Welcome back, ${name}.`)},250);history.replaceState({},document.title,APP_URL)}}
  catch(e){console.warn('[YTIntel auth fix]',e);restoreAnalysisAccess()}
  window.YTINTEL_VERSION='0.28.1';const status=$('#status');if(status&&/cloud intelligence|always-on|checking intelligence|ready/i.test(status.textContent||''))status.textContent='v0.28.1 · account system live';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700),{once:true});else setTimeout(boot,700);
})();
