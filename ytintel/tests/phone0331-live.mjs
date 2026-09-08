import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const url='https://mitchloxton.github.io/pinnacle-navigator/ytintel/latest/';
const rows=[];await mkdir('phone-live-proof',{recursive:true});
for(const [engine,type]of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),errors=[];
 page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url+'?qa=phone0331-live',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.YTIntelPhone&&window.YTIntelBriefWorkspace&&document.documentElement.dataset.yt300CoreAnalysis==='1',null,{timeout:45000});
  await page.waitForTimeout(1800);
  for(const [width,height]of [[320,740],[390,844],[430,932],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(200);
   for(const name of ['analyse','os','history']){
    const button=page.locator(`#mobileDock [data-dock="${name}"]`);await button.tap();await page.waitForTimeout(100);
    assert.equal(await page.locator('.view.active').getAttribute('id'),name);
    const d=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,inner:innerWidth}));
    assert.equal(d.client,width);assert(d.scroll<=width+2,`${engine} ${name}: ${d.scroll}>${width}`);
    assert((await button.boundingBox()).height>=44);rows.push({engine,width,height,page:name,...d});
   }
   await page.locator('#mobileDock [data-dock="analyse"]').tap();assert(await page.locator('#videoUrl').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16));
   if(width===390){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`phone-live-proof/${engine}-390-live.png`});}
  }
  assert.deepEqual(errors,[]);rows.push({engine,javascript_errors:errors,phone_version:await page.evaluate(()=>window.YTIntelPhone.version)});
 }catch(e){await page.screenshot({path:`phone-live-proof/${engine}-failed.png`}).catch(()=>{});await writeFile('phone-live-proof/failure.json',JSON.stringify({error:e.message,engine,errors,rows},null,2));throw e;}
 finally{await browser.close();}
}
await writeFile('phone-live-proof/receipt.json',JSON.stringify({pass:true,url,checks:'Actual deployed layout and touch navigation. No model calls submitted. Browser emulation, not physical-device proof.',rows},null,2));console.log(JSON.stringify({pass:true,checks:rows.length}));
