(function(){
'use strict';
if(document.documentElement.dataset.yt300Focus==='1')return;
document.documentElement.dataset.yt300Focus='1';
const $=s=>document.querySelector(s);
const HIDE=['viral','sprint','loop','radar','packaging','similar','batch','visuals','updates'];
function apply(){
 for(const id of HIDE){const b=$(`.tabs [data-tab="${id}"]`);if(b)b.style.display='none';const v=$(`#${id}`);if(v&&!v.classList.contains('active'))v.style.display='none';}
 const nav=$('.tabs'),core=nav?.querySelector('.yt-nav-core')||nav;
 for(const [id,name] of [['analyse','Analyse'],['os','Competitors'],['history','Vault']]){
  const b=$(`.tabs [data-tab="${id}"]`);if(!b)continue;
  b.style.removeProperty('display');const label=b.querySelector('.nav-label');if(label)label.textContent=name;
  if(core&&b.parentNode!==core)core.appendChild(b);
 }
 nav?.querySelectorAll('.yt-nav-tools,.yt-nav-system').forEach(x=>x.style.display='none');
 if(!$('#yt310FocusStyle')){const s=document.createElement('style');s.id='yt310FocusStyle';s.textContent='#analyse>.v20-context,#v20MobileStart{display:none!important}';document.head.appendChild(s);}
 const requested=new URLSearchParams(location.search).get('tab'),target=['analyse','os','history'].includes(requested)?requested:'analyse';
 if(!document.documentElement.dataset.yt300InitialRoute){document.documentElement.dataset.yt300InitialRoute='1';const b=$(`.tabs [data-tab="${target}"]`);if(b&&!b.classList.contains('on'))b.click();}
}
function init(){apply();setTimeout(apply,400);setTimeout(apply,1400);window.addEventListener('ytintel:late-layers-ready',apply);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
