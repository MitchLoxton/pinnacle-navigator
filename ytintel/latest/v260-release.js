(function(){
'use strict';
if(document.documentElement.dataset.yt260Release==='1')return;
document.documentElement.dataset.yt260Release='1';
function show(){
  window.YTINTEL_VERSION='0.26.0';
  const s=document.querySelector('#status');if(s)s.textContent='v0.26.0 · cloud intelligence live';
  const g=document.querySelector('#updates .grid');if(!g)return;
  g.querySelector('[data-v260-release]')?.remove();g.querySelectorAll('.release.current').forEach(x=>x.classList.remove('current'));
  const a=document.createElement('article');a.className='card c12 release current';a.dataset.v260Release='1';
  a.innerHTML='<div class="eyebrow">V0.26.0 · 6 SEP 2026 · CURRENT</div><h3>Cloud Intelligence — YTIntel keeps learning between visits</h3><ul class="list"><li><b>Optional creator accounts:</b> keep the workspace synced across devices instead of tying the product to one browser.</li><li><b>Server-side monitoring:</b> signed-in workspaces can schedule competitor, niche and own-channel scans even after YTIntel is closed.</li><li><b>Persistent opportunity alerts:</b> verified breakout and acceleration signals are saved to the account for the next visit.</li><li><b>Own-channel fit evidence:</b> YTIntel compares current opportunities with repeated patterns from the creator’s stronger channel-relative uploads.</li><li><b>Cloud longitudinal history:</b> repeated snapshots now survive across devices and sessions.</li><li><b>Evidence guardrails preserved:</b> personal fit and opportunity signals remain descriptive evidence, never guaranteed views, CTR or retention.</li></ul>';
  g.prepend(a);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();setTimeout(show,5000);
})();
