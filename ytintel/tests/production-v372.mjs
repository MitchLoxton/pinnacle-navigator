import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('ytintel-live-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addInitScript(()=>{try{
  localStorage.setItem('ytintel-v350-profile',JSON.stringify({niche:'GTA 6',subniche:'GTA 6 money/news',channel:'@ytinteltest',audience:'GTA 6 players',competitors:'Blake Ryan',brand:'Proof over hype. No guru language. Use only provable claims.',complete:true}));
  localStorage.setItem('ytintel-v360-endgame-bank',JSON.stringify({
    analyses:[{video_id:'a',title:'A',channel:'Alpha',niche:'GTA 6',subniche:'news',saved_at:new Date().toISOString()},{video_id:'b',title:'B',channel:'Beta',niche:'GTA 6',subniche:'money',saved_at:new Date().toISOString()}],
    hooks:[{video_id:'a',title:'A',type:'proof',line:'proof first'},{video_id:'b',title:'B',type:'proof',line:'proof again'}],
    packages:[{video_id:'a',title:'A',title_keywords:['money','gta6']},{video_id:'b',title:'B',title_keywords:['money','proof']}],
    styles:[{motion_graphics:['zoom','caption']},{motion_graphics:['zoom']}],
    comparisons:[{saved_at:new Date().toISOString(),version:'0.37.2',urls:['x','y'],reports:[]}]
  }));
  localStorage.setItem('ytintel-v360-watchtower',JSON.stringify({competitors:[{seed:'@alpha',label:'Alpha',videos:[{title:'Hot upload',views:20000,outlier_multiple:3.4,views_per_hour:1800}]}],history:[{seed:'@alpha',captured_at:new Date().toISOString(),videos:[]}]}));
}catch{}});
const page=await context.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/?qa=v0372-'+Date.now();
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.2'&&window.YTIntelEndgameCloser?.version==='0.37.2'&&!document.querySelector('#boot')&&!document.querySelector('#app')?.hidden,null,{timeout:120000});
 const top=await page.evaluate(()=>({version:window.YTINTEL_VERSION,nav:[...document.querySelectorAll('[data-tab]')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.tab),closer:window.YTIntelEndgameCloser?.version}));
 assert.equal(top.version,'0.37.2');assert.equal(top.closer,'0.37.2');assert.deepEqual(top.nav,['analyse','compare','vault','competitors']);
 await page.locator('[data-tab="compare"]').click();
 await page.waitForSelector('#v372-run');
 const compare=await page.evaluate(()=>({hero:document.querySelector('#compare .hero')?.innerText||'',root:document.querySelector('#v360-compare-root')?.innerText||'',textarea:!!document.querySelector('#v372-urls'),button:document.querySelector('#v372-run')?.textContent||''}));
 assert(/GROUP VIDEO ANALYSIS/i.test(compare.hero));assert(/Put the winners side by side/i.test(compare.hero));assert(compare.textarea);assert(/Endgame group analysis/i.test(compare.button));assert(/Shared-pattern claims only print when at least two sources support them/i.test(compare.root));
 await page.locator('[data-tab="vault"]').click();await page.waitForSelector('#v372-vault-overview');
 const vault=await page.evaluate(()=>document.querySelector('#v372-vault-overview')?.innerText||'');
 assert(/ENDGAME VAULT INDEX/i.test(vault));assert(/Winner analyses\s*2/i.test(vault));assert(/Packages banked\s*2/i.test(vault));assert(/Group comparisons\s*1/i.test(vault));assert(/money\s*·\s*2/i.test(vault));assert(/zoom\s*·\s*2/i.test(vault));
 await page.locator('[data-tab="competitors"]').click();await page.waitForSelector('#v372-watch-brief');
 const watch=await page.evaluate(()=>document.querySelector('#v372-watch-brief')?.innerText||'');
 assert(/WATCHTOWER BRIEF/i.test(watch));assert(/Competitors tracked\s*1/i.test(watch));assert(/3\.40×/.test(watch));assert(/1\.8K\/h/i.test(watch));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);const mobile=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert(mobile.width<=mobile.viewport+2,`mobile overflow ${mobile.width}`);
 assert.equal(errors.length,0,errors.join('\n'));
 const receipt={pass:true,release:'0.37.2',url,compare,vault,watch,mobile,errors};await writeFile('ytintel-live-proof/v372-receipt.json',JSON.stringify(receipt,null,2));console.log('V372_LIVE_PASS',JSON.stringify(receipt,null,2));
}finally{await browser.close()}
