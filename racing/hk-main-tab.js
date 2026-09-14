(() => {
  'use strict';

  let hkOpen = location.hash === '#hong-kong';

  function styles() {
    if (document.getElementById('hk-main-nav-style')) return;
    const s = document.createElement('style');
    s.id = 'hk-main-nav-style';
    s.textContent = `
      body .premium-nav{grid-template-columns:repeat(6,minmax(0,1fr))!important}
      @media(max-width:600px){
        body .premium-nav{gap:1px!important}
        body .premium-nav button{min-width:0!important;padding:7px 1px!important}
        body .premium-nav button span{font-size:6.5px!important;letter-spacing:0!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      }
    `;
    document.head.appendChild(s);
  }

  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M6 5h11l-2 3 2 3H6"/></svg>';
  }

  function sourceHtml() {
    const source = document.getElementById('hkRacingPanel');
    if (!source) return '<section class="premium-card"><h2>Hong Kong</h2><p>Loading Hong Kong section...</p></section>';
    const copy = document.createElement('div');
    [...source.children].forEach(child => copy.appendChild(child.cloneNode(true)));
    copy.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    copy.querySelectorAll('[data-tab]').forEach(el => el.removeAttribute('data-tab'));
    return `<section class="premium-card" style="margin-bottom:12px"><div class="premium-section-title"><span>Separate system</span><strong>Hong Kong</strong></div><p style="color:#9eb3ca;font-size:10px;line-height:1.45">Hong Kong now has its own main app tab.</p></section>${copy.innerHTML}`;
  }

  function show() {
    const page = document.getElementById('premiumPage');
    const nav = document.querySelector('.premium-nav');
    if (!page || !nav) return;
    page.innerHTML = sourceHtml();
    page.dataset.hkMain = '1';
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.hasAttribute('data-hk-main-tab')));
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#hong-kong');
    window.scrollTo({top:0,behavior:'auto'});
  }

  function open() {
    const home = document.querySelector('.premium-nav [data-premium-tab="home"]');
    if (home) home.click();
    setTimeout(() => {
      hkOpen = true;
      ensure();
      show();
    }, 0);
  }

  function ensure() {
    styles();
    const nav = document.querySelector('.premium-nav');
    if (!nav) return false;
    let btn = nav.querySelector('[data-hk-main-tab]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-hk-main-tab','1');
      btn.innerHTML = `${icon()}<span>Hong Kong</span>`;
      const settings = nav.querySelector('[data-premium-tab="settings"]');
      settings ? nav.insertBefore(btn, settings) : nav.appendChild(btn);
      btn.addEventListener('click', open);
    }
    if (hkOpen) nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    return true;
  }

  document.addEventListener('click', e => {
    if (e.target.closest('[data-premium-tab]') || e.target.closest('[data-odds-compare-tab]')) {
      hkOpen = false;
      if (location.hash === '#hong-kong' && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
    }
  }, true);

  function mount() {
    const root = document.getElementById('premiumApp');
    if (!root) return setTimeout(mount, 150);
    ensure();
    new MutationObserver(() => {
      ensure();
      const page = document.getElementById('premiumPage');
      if (hkOpen && page && page.dataset.hkMain !== '1') show();
    }).observe(root, {childList:true,subtree:true});
    if (hkOpen) setTimeout(open, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
