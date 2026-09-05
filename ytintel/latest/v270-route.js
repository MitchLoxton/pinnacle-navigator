(function(){
'use strict';
if(document.documentElement.dataset.yt270Route==='1')return;
document.documentElement.dataset.yt270Route='1';
function route(){const p=new URLSearchParams(location.search);if(p.get('tab')!=='viral')return;let n=0,t=setInterval(()=>{n++;const b=document.querySelector('.tabs [data-tab="viral"]');if(b){clearInterval(t);b.click();const v=p.get('video');if(v)setTimeout(()=>{const i=document.querySelector('#v27Url');if(i)i.value=v},80)}else if(n>50)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();
