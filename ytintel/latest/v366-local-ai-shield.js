const nativeLanguageModel=window.LanguageModel||null;
const nativeLegacyLanguageModel=window.ai?.languageModel||null;
let modernHidden=!nativeLanguageModel,legacyHidden=!nativeLegacyLanguageModel;
function setWindowLanguageModel(value){
  try{Object.defineProperty(window,'LanguageModel',{value,writable:true,configurable:true});return window.LanguageModel===value}catch{}
  try{window.LanguageModel=value;return window.LanguageModel===value}catch{}
  return false;
}
function setLegacyLanguageModel(value){
  if(!window.ai)return value==null;
  try{Object.defineProperty(window.ai,'languageModel',{value,writable:true,configurable:true});return window.ai?.languageModel===value}catch{}
  try{window.ai.languageModel=value;return window.ai?.languageModel===value}catch{}
  return false;
}
function stamp(){
  const on=(!nativeLanguageModel||modernHidden)&&(!nativeLegacyLanguageModel||legacyHidden);
  document.documentElement.dataset.ytintelLocalAiShield=on?'on':'partial';
  document.documentElement.dataset.ytintelLegacyAiShield=(!nativeLegacyLanguageModel||legacyHidden)?'on':'partial';
  return on;
}
function hide(){
  modernHidden=!nativeLanguageModel||setWindowLanguageModel(undefined);
  legacyHidden=!nativeLegacyLanguageModel||setLegacyLanguageModel(undefined);
  return stamp();
}
export function enableLocalAI(){
  modernHidden=nativeLanguageModel?!setWindowLanguageModel(nativeLanguageModel):true;
  legacyHidden=nativeLegacyLanguageModel?!setLegacyLanguageModel(nativeLegacyLanguageModel):true;
  const available=window.LanguageModel===nativeLanguageModel&&!!nativeLanguageModel||window.ai?.languageModel===nativeLegacyLanguageModel&&!!nativeLegacyLanguageModel;
  document.documentElement.dataset.ytintelLocalAiShield=available?'off':'unsupported';
  document.documentElement.dataset.ytintelLegacyAiShield=window.ai?.languageModel===nativeLegacyLanguageModel&&!!nativeLegacyLanguageModel?'off':(!nativeLegacyLanguageModel?'none':'unsupported');
  return available;
}
export function disableLocalAI(){return hide()}
export function hasNativeLocalAI(){return !!(nativeLanguageModel||nativeLegacyLanguageModel)}
hide();
window.YTIntelLocalAIShield={version:'0.37.0',enableLocalAI,disableLocalAI,hasNativeLocalAI};
