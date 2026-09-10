import * as localAI from './v360-local-ai.js?v=0360';
const $=s=>document.querySelector(s);
let lastState=localAI.getState();
function render(st=localAI.getState()){
  lastState=st;
  const label=$('#v360-ai-label');
  if(label&&!st.text&&!st.creating){
    if(window.YTIntelLocalAIShield?.hasNativeLocalAI?.())label.textContent='optional — tap to enable';
    else if(st.availability==='downloadable'||st.availability==='after-download')label.textContent='optional — tap to download';
    else if(st.availability==='available'||st.availability==='readily')label.textContent='ready — tap to enable';
    else label.textContent='source mode';
  }
}
function install(){
  const btn=$('#v360-ai-status');
  if(!btn)return false;
  btn.onclick=async e=>{
    e.preventDefault();
    e.stopPropagation();
    btn.disabled=true;
    const label=$('#v360-ai-label');
    if(label)label.textContent='starting on-device AI…';
    try{
      window.YTIntelLocalAIShield?.enableLocalAI?.();
      window.__YTINTEL_ALLOW_LOCAL_AI_CREATE=true;
      await localAI.initLocalAI().catch(()=>null);
      await localAI.startFromGesture();
      render(localAI.getState());
    }finally{
      window.__YTINTEL_ALLOW_LOCAL_AI_CREATE=false;
      btn.disabled=false;
    }
  };
  return true;
}
function blockAutoCreate(){
  const form=$('#analyseForm');
  if(!form||form.dataset.v366Optin==='1')return;
  form.dataset.v366Optin='1';
  form.addEventListener('submit',()=>{window.__YTINTEL_ALLOW_LOCAL_AI_CREATE=false},true);
}
function start(){
  blockAutoCreate();
  let tries=0;
  const timer=setInterval(()=>{tries++;blockAutoCreate();if(install()||tries>30)clearInterval(timer)},100);
  window.addEventListener('ytintel:v360-local-ai',e=>render(e.detail));
  render();
  window.YTIntelLocalAiOptIn={version:'0.37.0',install,getState:()=>localAI.getState()};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
