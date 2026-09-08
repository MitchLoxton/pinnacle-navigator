/* Presentation/accessibility only. No provider calls, credentials or storage changes. */
(function () {
  'use strict';
  if (window.YTIntelPhone) return;
  const root = document.documentElement;
  root.dataset.ytPhone = '0.33.1';
  if (!document.getElementById('yt331PhoneStyle')) {
    const link=document.createElement('link');link.id='yt331PhoneStyle';link.rel='stylesheet';
    link.href=new URL('v331-phone.css?v=0331',document.currentScript?.src||location.href).href;document.head.appendChild(link);
  }
  const small = matchMedia('(max-width:820px), (max-width:1023px) and (pointer:coarse)');
  const editable = el => !!el && (el.matches('textarea,select,[contenteditable="true"]') || (el.matches('input') && !['button','submit','reset','file','checkbox','radio','range','color','hidden'].includes(el.type)));
  let frame = 0, timer = 0;
  function viewport() {
    const v = window.visualViewport;
    const height = v ? v.height : innerHeight;
    root.style.setProperty('--yt-phone-visible-height', Math.round(height) + 'px');
    // Exclude pinch zoom; never blur a field to react to a viewport resize.
    const keyboard = small.matches && editable(document.activeElement) && (!v || Math.abs(v.scale-1)<.08) && (innerHeight-height-(v?.offsetTop||0) > 120);
    root.dataset.ytPhoneKeyboard = keyboard ? 'open' : 'closed';
  }
  function queueViewport() { if (!frame) frame=requestAnimationFrame(()=>{frame=0;viewport();}); }
  function focused() {
    queueViewport(); clearTimeout(timer);
    timer=setTimeout(()=>{
      const el=document.activeElement;
      if(!small.matches || !editable(el)) return;
      const v=window.visualViewport, rect=el.getBoundingClientRect(), bottom=(v?.offsetTop||0)+(v?.height||innerHeight);
      if(rect.top<0 || rect.top>bottom-70) el.scrollIntoView({block:'nearest',behavior:'auto'});
    },280);
  }
  function decorate() {
    document.querySelectorAll('#mobileDock button').forEach(b=>{
      b.type='button';
      const on=b.classList.contains('on');
      if(on) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
    });
    const url=document.getElementById('videoUrl');
    if(url){url.setAttribute('aria-label','YouTube video link');url.setAttribute('enterkeyhint','go');url.setAttribute('autocapitalize','none');url.setAttribute('spellcheck','false');}
    const number=document.getElementById('yt320Target');if(number)number.setAttribute('inputmode','numeric');
    document.querySelectorAll('#yt320Sources').forEach(el=>{el.setAttribute('autocapitalize','none');el.setAttribute('spellcheck','false');});
    document.querySelectorAll('.yt330-matrix,.yt300-compare').forEach(el=>{el.tabIndex=0;el.setAttribute('role','region');el.setAttribute('aria-label','Comparison table. Swipe horizontally for more columns.');});
  }
  function init() {
    viewport();decorate();
    document.addEventListener('focusin',focused);
    document.addEventListener('focusout',()=>{clearTimeout(timer);timer=setTimeout(queueViewport,120);});
    window.visualViewport?.addEventListener('resize',queueViewport,{passive:true});
    window.visualViewport?.addEventListener('scroll',queueViewport,{passive:true});
    window.addEventListener('resize',queueViewport,{passive:true});
    small.addEventListener('change',queueViewport);
    document.addEventListener('click',e=>{if(e.target.closest?.('#mobileDock,.tabs,#yt320Modes,#yt330CompareRun'))requestAnimationFrame(decorate);});
    window.addEventListener('ytintel:late-layers-ready',decorate);
    window.addEventListener('ytintel:auth',decorate);
  }
  window.YTIntelPhone={version:'0.33.1',refresh:()=>{decorate();viewport();}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
