(function(){
'use strict';
const $=s=>document.querySelector(s);
let observer=null;
function go(tab){document.querySelector(`.tabs [data-tab="${tab}"]`)?.click()}
function build(){
 observer?.disconnect();
 $('#mobileDock')?.remove();
 const d=document.createElement('nav');d.id='mobileDock';d.className='mobile-dock no-print';d.setAttribute('aria-label','YTIntel mobile navigation');
 d.innerHTML='<button data-dock="analyse">Analyse</button><button data-dock="os">Competitors</button><button data-dock="history">Vault</button>';
 document.body.appendChild(d);
 d.querySelectorAll('[data-dock]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.dock)));
 const sync=()=>{const active=$('.view.active')?.id;d.querySelectorAll('[data-dock]').forEach(b=>b.classList.toggle('on',b.dataset.dock===active))};
 observer=new MutationObserver(sync);
 document.querySelectorAll('.view').forEach(v=>observer.observe(v,{attributes:true,attributeFilter:['class']}));sync();
}
function init(){build();window.addEventListener('ytintel:late-layers-ready',()=>{if(!$('#mobileDock')?.querySelector('[data-dock="history"]'))build()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
