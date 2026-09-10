import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';

await mkdir('ytintel-live-proof',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addInitScript(()=>{try{
 localStorage.setItem('ytintel-v350-profile',JSON.stringify({niche:'GTA 6',subniche:'GTA 6 money/news',channel:'@ytinteltest',audience:'GTA 6 players',competitors:'Blake Ryan',brand:'Proof over hype. No guru language. Use only provable claims.',complete:true}));
 localStorage.setItem('ytintel-v360-endgame-bank',JSON.stringify({analyses:[{video_id:'a',title:'A',channel:'Alpha',niche:'YouTube / Creator Business',subniche:'YouTube packaging / growth',saved_at:new Date().toISOString()},{video_id:'b',title:'B',channel:'Beta',niche:'YouTube / Creator Business',subniche:'YouTube automation / AI content',saved_at:new Date().toISOString()}],hooks:[{video_id:'a',title:'A',type:'proof',line:'proof first'},{video_id:'b',title:'B',type:'proof',line:'proof again'}],packages:[{video_id:'a',title:'A',title_keywords:['money','youtube']},{video_id:'b',title:'B',title_keywords:['money','proof']}],styles:[{motion_graphics:['zoom','caption']},{motion_graphics:['zoom']}],comparisons:[{saved_at:new Date().toISOString(),version:'0.37.2',urls:['x','y'],reports:[]}]}));
 localStorage.setItem('ytintel-v360-watchtower',JSON.stringify({competitors:[{seed:'@alpha',label:'Alpha',videos:[{title:'Hot upload',views:20000,outlier_multiple:3.4,views_per_hour:1800}]}],history:[{seed:'@alpha',captured_at:new Date().toISOString(),videos:[]}]}));
}catch{}});
const page=await context.newPage();page.setDefaultTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/?qa=v0373-shell-'+Date.now();
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.YTINTEL_VERSION==='0.37.3'&&window.YTIntelSingleAnalyse?.version==='0.37.3'&&!document.querySelector('#boot')&&!document.querySelector('#app')?.hidden,null,{timeout:120000});
 const top=await page.evaluate(()=>({version:window.YTINTEL_VERSION,nav:[...document.querySelectorAll('[data-tab]')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.tab),dock:[...document.querySelectorAll('[data-dock]')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.dock),compare:!!document.querySelector('#compare,[data-tab="compare"],[data-dock="compare"]')}));
 assert.equal(top.version,'0.37.3');assert.equal(top.compare,false);assert.deepEqual(top.nav,['analyse','vault','competitors']);assert.deepEqual(top.dock,['analyse','vault','competitors']);
 await page.locator('[data-tab="vault"]').click();await page.waitForSelector('#v372-vault-overview');await page.waitForTimeout(100);
 const vault=await page.evaluate(()=>({text:document.querySelector('#v372-vault-overview')?.innerText||'',compareButton:!!document.querySelector('[data-bank="comparisons"]')}));
 assert(/ENDGAME VAULT INDEX/i.test(vault.text));assert(/Winner analyses\s*2/i.test(vault.text));assert(/Packages banked\s*2/i.test(vault.text));assert(/money\s*·\s*2/i.test(vault.text));assert(/zoom\s*·\s*2/i.test(vault.text));assert.equal(vault.compareButton,false,'Comparison UI must stay hidden while Compare is parked');
 await page.locator('[data-tab="competitors"]').click();await page.waitForSelector('#v372-watch-brief');const watch=await page.evaluate(()=>document.querySelector('#v372-watch-brief')?.innerText||'');assert(/WATCHTOWER BRIEF/i.test(watch));assert(/Competitors tracked\s*1/i.test(watch));assert(/3\.40×/.test(watch));assert(/1\.8K\/h/i.test(watch));
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);const mobile=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,dock:[...document.querySelectorAll('[data-dock]')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.dataset.dock)}));assert(mobile.width<=mobile.viewport+2,`mobile overflow ${mobile.width}`);assert.deepEqual(mobile.dock,['analyse','vault','competitors']);assert.equal(errors.length,0,errors.join('\n'));
 const receipt={pass:true,release:'0.37.3',url,top,vault,watch,mobile,errors};await writeFile('ytintel-live-proof/v373-shell-receipt.json',JSON.stringify(receipt,null,2));console.log('V373_SHELL_PASS',JSON.stringify(receipt,null,2));
}finally{await browser.close()}
