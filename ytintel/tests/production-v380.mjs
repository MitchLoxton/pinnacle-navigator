import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('ytintel-live-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
  const url=`https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/?qa=v380-live-${Date.now()}`;
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.YTIntelStableShell?.coreReady===true,null,{timeout:45000});
  await page.waitForTimeout(700);
  const start=await page.evaluate(()=>({version:document.querySelector('#version')?.textContent,scripts:document.scripts.length,core:document.documentElement.dataset.ytintelCore}));
  assert.equal(start.version,'v0.38.0');assert.equal(start.scripts,1);assert.equal(start.core,'ready');
  const select=async name=>{await page.locator(`[data-tab="${name}"]`).click();await page.waitForFunction(n=>{const x=document.getElementById(n);return x&&x.classList.contains('active')&&!x.hidden&&getComputedStyle(x).display!=='none'},name)};
  await select('competitors');
  await page.locator('#competitorInput').fill('@YTIntelLiveSmoke');await page.locator('#addCompetitor').click();
  assert((await page.locator('#competitorList').innerText()).includes('@YTIntelLiveSmoke'));
  await select('vault');
  await page.locator('#creator_niche').fill('Live smoke niche');await page.locator('#creator_subniche').fill('Live smoke subniche');await page.locator('#saveCreator').click();
  await page.waitForFunction(()=>/Saved locally/i.test(document.querySelector('#creatorSaved')?.textContent||''));
  await select('analyse');
  await page.setViewportSize({width:390,height:844});
  for(const name of ['competitors','vault','analyse']){await page.locator(`[data-dock="${name}"]`).click();await page.waitForFunction(n=>document.getElementById(n)?.classList.contains('active'),name)}
  const mobile=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert(mobile.scroll<=mobile.viewport+1,`mobile overflow ${mobile.scroll}>${mobile.viewport}`);
  await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=GzhT10i4vag');await page.locator('#analyseBtn').click();
  await page.waitForFunction(()=>!document.querySelector('#progressCard')?.classList.contains('hidden'),null,{timeout:10000});
  await page.locator('[data-dock="vault"]').click();await page.waitForFunction(()=>document.querySelector('#vault')?.classList.contains('active'));
  await page.locator('[data-dock="analyse"]').click();await page.waitForFunction(()=>document.querySelector('#analyse')?.classList.contains('active'));
  await page.waitForFunction(()=>document.querySelectorAll('#report > .section').length>=17||(document.querySelector('#analyseError')?.textContent||'').trim().length>0,null,{timeout:210000});
  const result=await page.evaluate(()=>({sections:document.querySelectorAll('#report > .section').length,error:(document.querySelector('#analyseError')?.textContent||'').trim(),pct:document.querySelector('#progressPct')?.textContent||'',buttonDisabled:document.querySelector('#analyseBtn')?.disabled,version:document.querySelector('#version')?.textContent,active:document.querySelector('.view.active')?.id}));
  assert.equal(result.error,'',result.error);assert(result.sections>=17,`only ${result.sections} sections`);assert.equal(result.pct,'100%');assert.equal(result.buttonDisabled,false);assert.equal(result.version,'v0.38.0');assert.equal(result.active,'analyse');assert.deepEqual(errors,[],errors.join(' | '));
  await page.screenshot({path:'ytintel-live-proof/v380-mobile.png',fullPage:true});
  const receipt={pass:true,url,start,result,mobile,errors,checked_at:new Date().toISOString()};await writeFile('ytintel-live-proof/v380-receipt.json',JSON.stringify(receipt,null,2));
  console.log(JSON.stringify(receipt,null,2));
}finally{await browser.close()}
