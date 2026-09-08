import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const proof='ytintel-live-proof';await mkdir(proof,{recursive:true});
const url='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/?qa=v0340-live-'+Date.now();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
const page=await context.newPage(),errors=[],requests=[];
page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
page.on('response',response=>{try{const u=new URL(response.url());if(u.hostname.endsWith('supabase.co'))requests.push({action:u.searchParams.get('action'),status:response.status()})}catch{}});
const hardStop=setTimeout(()=>{console.error('Production browser deadline exceeded');process.exit(2)},240000);
try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.34.0'&&!document.querySelector('#boot'),null,{timeout:30000});
  const before=await page.evaluate(()=>({
    version:window.YTINTEL_VERSION,
    active:document.querySelector('.view.active')?.id,
    script_count:[...document.scripts].filter(s=>s.src).length,
    script_names:[...document.scripts].filter(s=>s.src).map(s=>new URL(s.src).pathname.split('/').pop()),
    nav:[...document.querySelectorAll('[data-tab]')].map(x=>x.dataset.tab),
    text:document.body.innerText
  }));
  assert.equal(before.version,'0.34.0');
  assert.equal(before.active,'analyse');
  assert.deepEqual(before.nav,['analyse','competitors','vault']);
  assert.equal(before.script_count,1,'Clean shell must load exactly one external JS bundle');
  assert.deepEqual(before.script_names,['v340-zero-credit.js']);
  for(const old of ['Smart Start','Research Sprint','Opportunity Radar','Packaging Lab','What’s New'])assert(!before.text.includes(old),`Legacy layer still visible: ${old}`);

  await page.locator('#videoUrl').fill('https://www.youtube.com/watch?v=GzhT10i4vag');
  await page.locator('#analyseBtn').click();
  await page.waitForSelector('#progressCard:not(.hidden)',{timeout:10000});
  await page.waitForFunction(()=>document.querySelector('#progressPct')?.textContent==='100%'||document.querySelector('#progressState')?.textContent==='STOPPED',null,{timeout:150000});
  const state=await page.evaluate(()=>({
    pct:document.querySelector('#progressPct')?.textContent,
    state:document.querySelector('#progressState')?.textContent,
    error:document.querySelector('#analyseError')?.textContent||'',
    sections:[...document.querySelectorAll('#report [data-section]')].map(x=>Number(x.dataset.section)),
    agents:[...document.querySelectorAll('#agents .agent')].map(x=>x.className),
    report_text:document.querySelector('#report')?.innerText||'',
    button_enabled:!document.querySelector('#analyseBtn')?.disabled,
    vault_count:JSON.parse(localStorage.getItem('ytintel-v340-vault')||'[]').length
  }));
  assert.equal(state.state,'EVIDENCE COMPLETE','Zero-credit production run must finish rather than stick');
  assert.equal(state.pct,'100%');
  assert.deepEqual(state.sections,Array.from({length:17},(_,i)=>i+1));
  assert(state.button_enabled);
  assert(state.vault_count>0);
  assert(state.report_text.includes('The summary — so you never need to watch it'));
  assert(state.report_text.includes('Make it yours'));
  assert(state.report_text.includes('Full transcript'));
  assert(requests.some(x=>x.action==='analyze'&&x.status===200),'Real source analyse endpoint was not called successfully');
  assert(!requests.some(x=>String(x.action||'').includes('research-stage')),'Paid-model research endpoint must not run in zero-credit mode');
  assert(!requests.some(x=>String(x.action||'').includes('package')),'Paid packaging endpoint must not run in zero-credit mode');
  assert.equal(errors.length,0,'Production app emitted JavaScript errors');

  await page.screenshot({path:proof+'/desktop-v0340.png',fullPage:false});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
  const mobile=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,dock:[...document.querySelectorAll('[data-dock]')].map(x=>x.dataset.dock)}));
  assert(mobile.width<=mobile.viewport+2,'Mobile page overflows horizontally');
  assert.deepEqual(mobile.dock,['analyse','competitors','vault']);
  await page.screenshot({path:proof+'/mobile-v0340.png',fullPage:false});
  const receipt={pass:true,test:'live YTIntel v0.34 clean zero-credit core',before,state,mobile,requests,errors,finished_at:new Date().toISOString()};
  await writeFile(proof+'/receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
}catch(e){await writeFile(proof+'/failure.json',JSON.stringify({pass:false,error:e.message,errors,requests},null,2));await page.screenshot({path:proof+'/failure.png',timeout:5000}).catch(()=>{});throw e}finally{clearTimeout(hardStop);await browser.close()}
