import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('ytintel-live-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1365,height:900},serviceWorkers:'block'});
const page=await context.newPage();
page.setDefaultTimeout(90000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const live='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/';
try{
  await page.goto(`${live}?qa=v0379-usability-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.9'&&!document.querySelector('#app')?.hidden&&!document.querySelector('#app')?.classList.contains('v360-prehide'),null,{timeout:120000});
  await page.waitForFunction(()=>window.YTIntelUsabilityGuard?.version==='0.37.9-usability',null,{timeout:120000});

  const initial=await page.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0];
    const app=document.querySelector('#app');
    const overlay=document.querySelector('#v350-profile-overlay');
    return{
      version:window.YTINTEL_VERSION,
      bootstrap:window.__YTINTEL_BOOTSTRAP||null,
      usability:window.YTIntelUsabilityGuard?.version||'',
      resilience:window.YTIntelNavigationResilience?.version||'',
      shellVisibleMs:Number(window.__YTINTEL_SHELL_VISIBLE_MS||0),
      dclMs:Math.round(nav?.domContentLoadedEventEnd||0),
      appHidden:app?.hidden,
      appPointer:getComputedStyle(app).pointerEvents,
      prehide:app?.classList.contains('v360-prehide'),
      boot:!!document.querySelector('#boot'),
      blockingOverlay:Boolean(overlay&&getComputedStyle(overlay).display!=='none'),
      active:document.querySelector('.view.active')?.id||''
    };
  });
  assert.equal(initial.version,'0.37.9');
  assert.equal(initial.usability,'0.37.9-usability');
  assert.equal(initial.appHidden,false);
  assert.equal(initial.prehide,false);
  assert.equal(initial.boot,false,'blocking boot overlay must not exist');
  assert.equal(initial.blockingOverlay,false,'Creator DNA onboarding must never block the app');
  assert.notEqual(initial.appPointer,'none','app shell must accept pointer input');
  assert(initial.active,'one app view must stay active');
  assert(initial.shellVisibleMs>0&&initial.shellVisibleMs<5000,`shell-visible budget exceeded: ${initial.shellVisibleMs}ms`);
  assert(initial.dclMs<7000,`DOMContentLoaded budget exceeded: ${initial.dclMs}ms`);

  // Core controls must be interactable before advanced intelligence has finished hydrating.
  await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=GzhT10i4vag');
  assert.equal(await page.locator('#videoUrl').inputValue(),'https://www.youtube.com/watch?v=GzhT10i4vag');

  const navLatency=await page.evaluate(async()=>{
    const sequence=['vault','competitors','analyse','vault','analyse'];
    const samples=[];
    for(const tab of sequence){
      const b=document.querySelector(`[data-tab="${tab}"]`);
      const t0=performance.now();
      b.click();
      await new Promise(r=>requestAnimationFrame(()=>r()));
      samples.push({tab,ms:performance.now()-t0,active:document.querySelector('.view.active')?.id||''});
    }
    return samples;
  });
  for(const x of navLatency){
    assert.equal(x.active,x.tab,`navigation failed for ${x.tab}`);
    assert(x.ms<200,`navigation latency budget exceeded for ${x.tab}: ${x.ms.toFixed(1)}ms`);
  }

  const clickProof=await page.evaluate(()=>({
    analyseActive:document.querySelector('#analyse')?.classList.contains('active'),
    navOn:document.querySelector('[data-tab="analyse"]')?.classList.contains('on'),
    overlay:!!document.querySelector('#v350-profile-overlay'),
    pointer:getComputedStyle(document.querySelector('#app')).pointerEvents
  }));
  assert.equal(clickProof.analyseActive,true);
  assert.equal(clickProof.navOn,true);
  assert.equal(clickProof.overlay,false);
  assert.notEqual(clickProof.pointer,'none');

  const hardened=await page.evaluate(async()=>{
    const a=document.createElement('a');
    a.id='qa-youtube-link';
    a.href='https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    a.textContent='YT';
    document.body.append(a);
    await new Promise(r=>setTimeout(r,50));
    return{target:a.target,rel:a.rel,marker:a.dataset.ytintelExternal||''};
  });
  assert.equal(hardened.target,'_blank','YouTube links must not replace the YTIntel tab');
  assert.match(hardened.rel,/noopener/);
  assert.match(hardened.rel,/noreferrer/);

  if(initial.resilience){
    const repaired=await page.evaluate(async()=>{
      const app=document.querySelector('#app');
      app.hidden=true;
      app.classList.add('v360-prehide');
      document.documentElement.classList.add('v360-loading');
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
      await new Promise(r=>setTimeout(r,180));
      return{hidden:app.hidden,prehide:app.classList.contains('v360-prehide'),loading:document.documentElement.classList.contains('v360-loading'),active:document.querySelector('.view.active')?.id||''};
    });
    assert.equal(repaired.hidden,false);
    assert.equal(repaired.prehide,false);
    assert.equal(repaired.loading,false);
    assert(repaired.active);
  }

  await page.goto(`https://mitchloxton.github.io/pinnacle-navigator/?qa=away-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.goBack({waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.9'&&!document.querySelector('#app')?.hidden&&!!document.querySelector('.view.active'),null,{timeout:120000});
  await page.locator('[data-tab="vault"]').click();
  await page.waitForFunction(()=>document.querySelector('#vault')?.classList.contains('active'));
  const returned=await page.evaluate(()=>({url:location.href,hidden:document.querySelector('#app')?.hidden,active:document.querySelector('.view.active')?.id||'',overlay:!!document.querySelector('#v350-profile-overlay')}));
  assert.equal(returned.hidden,false);
  assert.equal(returned.active,'vault');
  assert.equal(returned.overlay,false);
  assert.equal(errors.length,0,errors.join('\n'));

  await page.screenshot({path:'ytintel-live-proof/v379-usability-performance.png',fullPage:true});
  const receipt={pass:true,initial,navLatency,clickProof,hardened,returned,errors};
  await writeFile('ytintel-live-proof/v379-usability-receipt.json',JSON.stringify(receipt,null,2));
  console.log('V379_USABILITY_PERFORMANCE_PASS',JSON.stringify(receipt,null,2));
}finally{
  await browser.close();
}
