const nativeLanguageModel=window.LanguageModel||null;
let shielded=false;
function hide(){
  if(!nativeLanguageModel)return false;
  try{Object.defineProperty(window,'LanguageModel',{value:undefined,writable:true,configurable:true});shielded=window.LanguageModel==null}catch{}
  if(!shielded)try{window.LanguageModel=undefined;shielded=window.LanguageModel==null}catch{}
  document.documentElement.dataset.ytintelLocalAiShield=shielded?'on':'unsupported';
  return shielded;
}
export function enableLocalAI(){
  if(!nativeLanguageModel)return false;
  try{Object.defineProperty(window,'LanguageModel',{value:nativeLanguageModel,writable:true,configurable:true});shielded=false}catch{}
  if(window.LanguageModel!==nativeLanguageModel)try{window.LanguageModel=nativeLanguageModel;shielded=false}catch{}
  document.documentElement.dataset.ytintelLocalAiShield=window.LanguageModel===nativeLanguageModel?'off':'unsupported';
  return window.LanguageModel===nativeLanguageModel;
}
export function disableLocalAI(){return hide()}
export function hasNativeLocalAI(){return !!nativeLanguageModel}
hide();
window.YTIntelLocalAIShield={version:'0.37.0',enableLocalAI,disableLocalAI,hasNativeLocalAI};
