(function(){
'use strict';
if(document.documentElement.dataset.yt300Focus==='1')return;
document.documentElement.dataset.yt300Focus='1';
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
const HIDE=['sprint','loop','radar','packaging','similar','batch','visuals','updates'];
function apply(){
  for(const id of HIDE){const b=$(`.tabs [data-tab="${id}"]`);if(b)b.style.display='none';const v=$(`#${id}`);if(v&&!v.classList.contains('active'))v.style.display='none'}
  const os=$('.tabs [data-tab="os"]');if(os){const l=os.querySelector('.nav-label');if(l)l.textContent='Competitors';else os.childNodes.forEach(n=>{if(n.nodeType===3&&String(n.textContent).trim())n.textContent='Competitors '})}
  const hist=$('.tabs [data-tab="history"]');if(hist){const l=hist.querySelector('.nav-label');if(l)l.textContent='Vault';}
  const q=new URLSearchParams(location.search),requested=q.get('tab');
  const allowed=new Set(['analyse','os','history']);
  const target=allowed.has(requested)?requested:'analyse';
  if(!document.documentElement.dataset.yt300InitialRoute){document.documentElement.dataset.yt300InitialRoute='1';const btn=$(`.tabs [data-tab="${target}"]`);if(btn&&!btn.classList.contains('on'))btn.click()}
}
function init(){apply();setTimeout(apply,400);setTimeout(apply,1400);window.addEventListener('ytintel:late-layers-ready',apply)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
