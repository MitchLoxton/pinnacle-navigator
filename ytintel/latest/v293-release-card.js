(function(){
'use strict';
if(document.documentElement.dataset.yt293ReleaseCard==='1')return;
document.documentElement.dataset.yt293ReleaseCard='1';
function render(){
  const grid=document.querySelector('#updates .grid');
  if(!grid)return;
  grid.querySelector('[data-v293-release]')?.remove();
  grid.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const card=document.createElement('article');
  card.className='card c12 release current';
  card.dataset.v293Release='1';
  card.innerHTML='<div class="eyebrow">V0.29.3 · 6 SEP 2026 · CURRENT</div><h3>Video Notes Focus — understand the video, don\'t echo the transcript</h3><ul class="list"><li><b>Video Notes:</b> Analyse now leads with the main message and a small set of distinct notes instead of restating transcript lines.</li><li><b>Evidence receipts:</b> exact caption wording stays tucked underneath each note so the insight and its source are clearly separated.</li><li><b>WPM repair:</b> spoken pace is recalculated from de-duplicated captions and withheld when the public caption source is still implausible.</li><li><b>Runtime coverage:</b> notes are spread across the video instead of clustering around the opening seconds.</li><li><b>Focus reset:</b> Opportunity Radar is removed from the visible product for now so Analyse can be made genuinely excellent first.</li></ul>';
  grid.prepend(card);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
window.addEventListener('ytintel:late-layers-ready',render);
setTimeout(render,1200);
})();
