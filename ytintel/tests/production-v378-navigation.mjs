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
  await page.goto(`${live}?qa=v0378-nav-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.8'&&window.YTIntelNavigationResilience?.version==='0.37.8'&&!document.querySelector('#app')?.hidden&&!document.querySelector('#app')?.classList.contains('v360-prehide'),null,{timeout:120000});

  const initial=await page.evaluate(()=>({
    version:window.YTINTEL_VERSION,
    resilience:window.YTIntelNavigationResilience?.version,
    appHidden:document.querySelector('#app')?.hidden,
    prehide:document.querySelector('#app')?.classList.contains('v360-prehide'),
    boot:!!document.querySelector('#boot'),
    active:document.querySelector('.view.active')?.id||''
  }));
  assert.equal(initial.version,'0.37.8');
  assert.equal(initial.resilience,'0.37.8');
  assert.equal(initial.appHidden,false);
  assert.equal(initial.prehide,false);
  assert.equal(initial.boot,false);
  assert(initial.active,'one app view must stay active');

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
  assert.equal(hardened.marker,'youtube-new-tab');

  const repaired=await page.evaluate(async()=>{
    const app=document.querySelector('#app');
    app.hidden=true;
    app.classList.add('v360-prehide');
    document.documentElement.classList.add('v360-loading');
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
    window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    await new Promise(r=>setTimeout(r,180));
    return{
      hidden:app.hidden,
      prehide:app.classList.contains('v360-prehide'),
      loading:document.documentElement.classList.contains('v360-loading'),
      active:document.querySelector('.view.active')?.id||'',
      recovered:document.documentElement.dataset.ytintelRecoveredFrom||''
    };
  });
  assert.equal(repaired.hidden,false,'pageshow must recover a hidden app shell');
  assert.equal(repaired.prehide,false);
  assert.equal(repaired.loading,false);
  assert(repaired.active,'pageshow recovery must restore an active view');
  assert.match(repaired.recovered,/pageshow-bfcache/);

  await page.goto(`https://mitchloxton.github.io/pinnacle-navigator/?qa=away-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:90000});
  await page.goBack({waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.8'&&!document.querySelector('#app')?.hidden&&!document.querySelector('#app')?.classList.contains('v360-prehide')&&!!document.querySelector('.view.active'),null,{timeout:120000});
  const returned=await page.evaluate(()=>({url:location.href,hidden:document.querySelector('#app')?.hidden,prehide:document.querySelector('#app')?.classList.contains('v360-prehide'),active:document.querySelector('.view.active')?.id||'',errors:window.__YTINTEL_NAV_RESILIENCE||null}));
  assert.equal(returned.hidden,false);
  assert.equal(returned.prehide,false);
  assert(returned.active);
  assert.equal(errors.length,0,errors.join('\n'));

  await page.screenshot({path:'ytintel-live-proof/v378-return-navigation.png',fullPage:true});
  const receipt={pass:true,initial,hardened,repaired,returned,errors};
  await writeFile('ytintel-live-proof/v378-navigation-receipt.json',JSON.stringify(receipt,null,2));
  console.log('V378_NAVIGATION_PASS',JSON.stringify(receipt,null,2));
}finally{
  await browser.close();
}
