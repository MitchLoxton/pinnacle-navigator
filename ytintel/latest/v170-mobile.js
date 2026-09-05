(function(){
'use strict';
const $=s=>document.querySelector(s);
function go(tab){document.querySelector(`.tabs [data-tab="${tab}"]`)?.click()}
function build(){const old=$('#mobileDock');if(old)old.remove();const d=document.createElement('nav');d.id='mobileDock';d.className='mobile-dock no-print';d.setAttribute('aria-label','YTIntel mobile navigation');d.innerHTML='<button data-dock="os">Start</button><button data-dock="sprint">Sprint</button><button data-dock="analyse">Analyse</button><button data-dock="loop">Creator Loop</button>';document.body.appendChild(d);d.querySelectorAll('[data-dock]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.dock)));const sync=()=>{const a=$('.view.active')?.id;d.querySelectorAll('[data-dock]').forEach(b=>b.classList.toggle('on',b.dataset.dock===a))};document.querySelectorAll('.view').forEach(v=>new MutationObserver(sync).observe(v,{attributes:true,attributeFilter:['class']}));sync()}
function init(){build();setTimeout(()=>{if(!$('#mobileDock')?.querySelector('[data-dock="sprint"]'))build()},900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
